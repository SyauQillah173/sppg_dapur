import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperadmin } from '@/lib/api-auth';
import { sanitizeObject } from '@/lib/sanitize';

const db = prisma as any;

/**
 * GET: Ambil daftar seluruh pengiriman distribusi porsi makanan MBG resmi ke sekolah.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const sppgUnitId = searchParams.get('sppgUnitId');
    const status = searchParams.get('status');

    const where: any = {};
    if (sppgUnitId && sppgUnitId !== 'ALL') {
      where.sppgUnitId = sppgUnitId;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const distributions = await db.mealDistribution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      { success: true, data: distributions },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

/**
 * POST: Catat pengiriman makanan baru ke sekolah, sekaligus potong stok bahan gudang (Stok KELUAR).
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const rawBody = await req.json();
    const body = sanitizeObject(rawBody) as any;

    const {
      dispatchNumber,
      sppgUnitId,
      sppgUnitName,
      schoolName,
      schoolAddress,
      schoolType,
      contactPerson,
      contactPhone,
      menuCode,
      menuTitle,
      menuDetails,
      targetPortions,
      deliveredPortions,
      absentStudents,
      surplusHandling,
      status,
      departureTime,
      estimatedArrival,
      actualArrival,
      driverName,
      driverPhone,
      vehiclePlate,
      foodTemperature,
      foodSafetyWindow,
      recipientName,
      recipientNip,
      bastNumber,
      isSigned,
      recipientSignature,
      deliveryPhotoUrl,
      notes,
      deductStockNow,
      deductedItems,
    } = body;

    if (!schoolName || !targetPortions || !driverName) {
      return NextResponse.json(
        { success: false, error: 'Nama sekolah, jumlah porsi, dan nama pengemudi/driver wajib diisi.' },
        { status: 400 }
      );
    }

    const uniqueDispatchNumber =
      dispatchNumber || `SJ-${sppgUnitId || 'SPPG'}-${Date.now().toString().slice(-6)}`;
    const uniqueBastNumber =
      bastNumber || `BAST/MBG/${Date.now().toString().slice(-6)}`;

    const result = await prisma.$transaction(async (tx: any) => {
      let isStockDeducted = false;
      const recordedDeductedItems: any[] = [];

      // Otomatis potong stok bahan makanan di gudang (tipe KELUAR) jika flag aktif
      if (deductStockNow && Array.isArray(deductedItems) && deductedItems.length > 0) {
        for (const item of deductedItems) {
          const qty = Number(item.quantity) || 0;
          if (qty <= 0) continue;

          let targetIngId = item.ingredientId;
          if (!targetIngId && item.name) {
            const found = await tx.ingredient.findFirst({
              where: { name: { equals: item.name.trim(), mode: 'insensitive' } },
            });
            if (found) targetIngId = found.id;
          }

          if (targetIngId) {
            const currentIng = await tx.ingredient.findUnique({
              where: { id: targetIngId },
            });
            const safeUnitId = sppgUnitId === 'ALL' || !sppgUnitId ? 'SPPG-AA02' : sppgUnitId;
            let updatedDist = (currentIng?.sppgDistribution as Record<string, number>) || {};
            if (updatedDist && typeof updatedDist === 'object') {
              const currentKitchenQty = Number(updatedDist[safeUnitId]) || 0;
              const deductedFromKitchen = Math.min(currentKitchenQty, qty);
              updatedDist = {
                ...updatedDist,
                [safeUnitId]: Math.max(0, currentKitchenQty - deductedFromKitchen),
              };
            }

            // Kurangi stok di tabel ingredient dan update sppgDistribution
            const updatedIng = await tx.ingredient.update({
              where: { id: targetIngId },
              data: {
                currentStock: { decrement: qty },
                sppgDistribution: updatedDist,
              },
            });
            await tx.stockMovement.create({
              data: {
                sppgUnitId: safeUnitId,
                ingredientId: targetIngId,
                type: 'KELUAR',
                quantity: qty,
                unit: item.unit || updatedIng.defaultUnit,
                referenceNumber: uniqueDispatchNumber,
                purpose: `Distribusi ${targetPortions} Porsi (${menuTitle}) ke ${schoolName}`,
                recordedBy: 'Superadmin Logistik Distribusi',
                remainingStockAfter: updatedIng.currentStock,
              },
            });

            recordedDeductedItems.push({
              ingredientId: targetIngId,
              name: updatedIng.name,
              quantity: qty,
              unit: item.unit || updatedIng.defaultUnit,
              remainingStockAfter: Number(updatedIng.currentStock),
            });
            isStockDeducted = true;
          }
        }
      }

      const created = await tx.mealDistribution.create({
        data: {
          dispatchNumber: uniqueDispatchNumber,
          sppgUnitId: sppgUnitId || 'SPPG-AA02',
          sppgUnitName: sppgUnitName || 'SPPG ABAR ABIR 02',
          schoolName,
          schoolAddress: schoolAddress || '-',
          schoolType: schoolType || 'SD',
          contactPerson: contactPerson || 'Pihak Sekolah',
          contactPhone: contactPhone || '-',
          menuCode: menuCode || 'MENU-HARIAN',
          menuTitle: menuTitle || 'Paket Menu MBG Standar Gizi',
          menuDetails: menuDetails || {},
          targetPortions: Number(targetPortions),
          deliveredPortions: Number(deliveredPortions || targetPortions),
          absentStudents: Number(absentStudents || 0),
          surplusHandling: surplusHandling || 'Diberikan ke guru/staf pendamping',
          status: status || 'PREPARING',
          departureTime: departureTime || null,
          estimatedArrival: estimatedArrival || null,
          actualArrival: actualArrival || null,
          driverName,
          driverPhone: driverPhone || '-',
          vehiclePlate: vehiclePlate || '-',
          foodTemperature: foodTemperature || '65°C',
          foodSafetyWindow: foodSafetyWindow || 'Aman s.d 4 jam setelah dimasak',
          recipientName: recipientName || null,
          recipientNip: recipientNip || null,
          bastNumber: uniqueBastNumber,
          isSigned: Boolean(isSigned),
          recipientSignature: recipientSignature || null,
          deliveryPhotoUrl: deliveryPhotoUrl || null,
          notes: notes || null,
          isStockDeducted,
          deductedItems: recordedDeductedItems,
        },
      });

      // Catat notifikasi sistem
      try {
        await tx.systemNotification.create({
          data: {
            type: 'DISTRIBUTION_DISPATCHED',
            title: 'Pengiriman Porsi MBG Dimulai',
            message: `Surat jalan ${uniqueDispatchNumber}: ${targetPortions} porsi ${menuTitle} dikirim ke ${schoolName} oleh driver ${driverName}.`,
            actorName: 'Superadmin Logistik',
            referenceId: created.id,
            unitName: sppgUnitName || 'SPPG ABAR ABIR 02',
          },
        });
      } catch (e) {
        console.warn('Gagal catat notifikasi sistem distribusi:', e);
      }

      return created;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
