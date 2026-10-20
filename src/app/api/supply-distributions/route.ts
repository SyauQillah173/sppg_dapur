import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperadmin } from '@/lib/api-auth';
import { sanitizeObject } from '@/lib/sanitize';
import { safeErrorMessage } from '@/lib/safe-error';

const db = prisma as any;

/**
 * GET: Ambil daftar seluruh alokasi/penyebaran pasokan bahan belanja ke dapur SPPG.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const procurementOrderId = searchParams.get('procurementOrderId');
    const status = searchParams.get('status');

    const where: any = {};
    if (procurementOrderId) {
      where.procurementOrderId = procurementOrderId;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const records = await db.supplyDistribution.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(
      { success: true, data: records },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}

/**
 * POST: Catat penyebaran bahan belanja ke 4 dapur SPPG.
 * Otomatis memperbarui saldo stok sebaran per unit (sppgDistribution) dan mencatat kartu stok MASUK.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const rawBody = await req.json();
    const body = sanitizeObject(rawBody) as any;

    const {
      dispatchNumber,
      date,
      procurementOrderId,
      receiptNumber,
      supplierId,
      supplierName,
      driverName,
      driverPhone,
      vehiclePlate,
      status,
      notes,
      items,
      headSignerName,
      headSignerTitle,
      headSignerNip,
    } = body;

    if (!supplierName || !driverName || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nama supplier/CV, nama driver pengantar, dan rincian alokasi bahan wajib diisi.' },
        { status: 400 }
      );
    }

    const uniqueDispatchNumber =
      dispatchNumber || `SJ-BAHAN-${Date.now().toString().slice(-6)}`;

    const created = await prisma.$transaction(async (tx: any) => {
      // 1. Simpan baris penyebaran bahan
      const supplyDist = await tx.supplyDistribution.create({
        data: {
          dispatchNumber: uniqueDispatchNumber,
          date: date ? new Date(date) : new Date(),
          procurementOrderId: procurementOrderId || null,
          receiptNumber: receiptNumber || null,
          supplierId: supplierId || null,
          supplierName: supplierName.trim(),
          driverName: driverName.trim(),
          driverPhone: driverPhone?.trim() || '-',
          vehiclePlate: vehiclePlate?.trim() || '-',
          status: status || 'COMPLETED',
          notes: notes || null,
          items,
          headSignerName: headSignerName || 'Drs. H. M. Zainudin, M.M.',
          headSignerTitle: headSignerTitle || 'Kepala Satuan Pelayanan Pemenuhan Gizi (SPPG)',
          headSignerNip: headSignerNip || '19750812 199903 1 004',
        },
      });

      // 2. Perbarui sppgDistribution pada tabel Ingredient dan catat kartu stok per dapur
      for (const it of items) {
        if (!it.allocations || typeof it.allocations !== 'object') continue;

        let targetIngId = it.ingredientId;
        if (!targetIngId && it.name) {
          const found = await tx.ingredient.findFirst({
            where: { name: { equals: it.name.trim(), mode: 'insensitive' } },
          });
          if (found) targetIngId = found.id;
        }

        if (targetIngId) {
          const currentIng = await tx.ingredient.findUnique({
            where: { id: targetIngId },
          });

          if (currentIng) {
            const currentDist = (currentIng.sppgDistribution as Record<string, number>) || {};
            const updatedDist = { ...currentDist };

            for (const [unitId, qty] of Object.entries(it.allocations)) {
              const numQty = Number(qty) || 0;
              if (numQty <= 0) continue;

              updatedDist[unitId] = (Number(updatedDist[unitId]) || 0) + numQty;

              // Catat riwayat mutasi stok MASUK spesifik ke unit dapur SPPG tersebut
              try {
                await tx.stockMovement.create({
                  data: {
                    sppgUnitId: unitId,
                    ingredientId: targetIngId,
                    type: 'MASUK',
                    quantity: numQty,
                    unit: it.unit || currentIng.defaultUnit,
                    referenceNumber: uniqueDispatchNumber,
                    purpose: `Pasokan Alokasi Belanja ${receiptNumber || 'Nota'} dari ${supplierName}`,
                    recordedBy: `${driverName} (Driver ${supplierName})`,
                    remainingStockAfter: updatedDist[unitId],
                  },
                });
              } catch (smErr) {
                console.warn('Gagal catat stock movement alokasi unit:', smErr);
              }
            }

            await tx.ingredient.update({
              where: { id: targetIngId },
              data: { sppgDistribution: updatedDist },
            });
          }
        }
      }

      // 3. Catat notifikasi sistem
      try {
        await tx.systemNotification.create({
          data: {
            type: 'SUPPLY_ALLOCATED',
            title: 'Pasokan Belanja Disebar ke Dapur SPPG',
            message: `Surat jalan ${uniqueDispatchNumber}: ${items.length} jenis bahan belanja dari ${supplierName} telah disebar ke dapur-dapur SPPG oleh ${driverName}.`,
            actorName: 'Superadmin Logistik Bahan',
            referenceId: supplyDist.id,
            unitName: 'Semua Dapur SPPG',
          },
        });
      } catch (e) {
        console.warn('Gagal catat notifikasi alokasi bahan:', e);
      }

      return supplyDist;
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}
