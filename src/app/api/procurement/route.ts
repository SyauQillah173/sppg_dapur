import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditStatus } from '@prisma/client';
import { requireAuth, requireSuperadmin } from '@/lib/api-auth';
import { applyOrderAggregates, orderToApp, withAnomalyCheck } from '@/lib/procurement-db';
import { sanitizeObject } from '@/lib/sanitize';


/** Daftar pembelanjaan + rincian bahannya (tabel procurement_orders & procurement_items). */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const sppgUnitId = searchParams.get('sppgUnitId');

    const where: any = {};
    if (sppgUnitId && sppgUnitId !== 'ALL') {
      // Nota gabungan 'ALL' tetap ikut tampil saat satu unit dipilih
      where.OR = [{ sppgUnitId }, { sppgUnitId: 'ALL' }];
    }

    const [orders, units, emps, sups] = await Promise.all([
      prisma.procurementOrder.findMany({
        where,
        include: { items: true },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.sppgUnit.findMany({ select: { id: true, name: true } }),
      prisma.employee.findMany({ select: { id: true, name: true, roleTitle: true } }),
      prisma.supplier.findMany({ select: { id: true, name: true, address: true } }),
    ]);

    const lookups = {
      unitMap: new Map(units.map((u) => [u.id, u.name])),
      empMap: new Map(emps.map((e) => [e.id, { name: e.name, roleTitle: e.roleTitle }])),
      supMap: new Map(sups.map((s) => [s.id, { name: s.name, address: s.address }])),
    };

    return NextResponse.json(
      {
        success: true,
        data: orders.map((o) => orderToApp(o, o.items, lookups)),
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

/** Catat pembelanjaan baru. Sekaligus menyesuaikan total unit + supplier. */
export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const rawBody = await req.json();
    const body = sanitizeObject(rawBody) as any;
    const {
      id,
      receiptNumber,
      date,
      sppgUnitId,
      requesterId,
      supplierId,
      amountRequested,
      actualReceiptTotal,
      changeReturned,
      notes,
      items,
      receiptPhotoUrl,
      status,
    } = body;

    if (!sppgUnitId || !requesterId || !supplierId) {
      return NextResponse.json(
        { success: false, error: 'Tujuan SPPG, peminta, dan supplier wajib diisi.' },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const mappedItems = await withAnomalyCheck(tx, items || []);

      const order = await tx.procurementOrder.create({
        data: {
          ...(id ? { id } : {}),
          receiptNumber: String(receiptNumber || '-').trim() || '-',
          date: new Date(date || Date.now()),
          sppgUnitId,
          requesterId,
          supplierId,
          amountRequested: Number(amountRequested) || 0,
          actualReceiptTotal: Number(actualReceiptTotal) || 0,
          changeReturned: Number(changeReturned) || 0,
          status: (status as AuditStatus) || AuditStatus.PENDING_AUDIT,
          receiptPhotoUrl: receiptPhotoUrl || null,
          physicalReceiptImage: receiptPhotoUrl ? 'PHYSICAL_RECEIPT_NEW' : null,
          notes: notes || null,
          isChangeReturned: Boolean(body.isChangeReturned),
          returnProofUrl: body.returnProofUrl || null,
          returnedAt: body.returnedAt ? new Date(body.returnedAt) : null,
          returnedBy: body.returnedBy || null,
          returnedTo: body.returnedTo || null,
          returnNotes: body.returnNotes || null,
          items: { create: mappedItems },
        },
        include: { items: true },
      });

      await applyOrderAggregates(tx, order, 1);

      // Otomatis tambahkan stok bahan makanan MBG & catat kartu stok masuk
      for (const it of order.items) {
        const qty = Number(it.quantity) || 0;
        if (qty <= 0) continue;

        let targetIngId = it.ingredientId;
        if (!targetIngId) {
          const found = await tx.ingredient.findFirst({
            where: { name: { equals: it.name.trim(), mode: 'insensitive' } },
          });
          if (found) targetIngId = found.id;
        }

        if (targetIngId) {
          const updatedIng = await tx.ingredient.update({
            where: { id: targetIngId },
            data: {
              currentStock: { increment: qty },
              lastPurchasePrice: Number(it.unitPrice) > 0 ? Number(it.unitPrice) : undefined,
            },
          });

          if (!it.ingredientId) {
            await tx.procurementItem.update({
              where: { id: it.id },
              data: { ingredientId: targetIngId },
            });
          }

          const safeUnitId = order.sppgUnitId === 'ALL' ? 'SPPG-AA02' : order.sppgUnitId;
          try {
            await tx.stockMovement.create({
              data: {
                sppgUnitId: safeUnitId,
                ingredientId: targetIngId,
                type: 'MASUK',
                quantity: qty,
                unit: it.unit || updatedIng.defaultUnit,
                referenceNumber: order.receiptNumber || 'NOTA-BELANJA',
                purpose: `Belanja Pasokan Stok MBG (${order.receiptNumber || 'Nota'})`,
                recordedBy: 'Superadmin Pengadaan',
                remainingStockAfter: updatedIng.currentStock,
              },
            });
          } catch (e) {
            console.warn('Gagal catat stock movement:', e);
          }
        } else if (it.name?.trim()) {
          // Buat otomatis bahan makanan baru di database jika belum pernah terdaftar
          try {
            let cat = await tx.ingredientCategory.findFirst({
              where: { name: { equals: it.category?.trim() || 'Lainnya', mode: 'insensitive' } },
            });
            if (!cat) {
              cat = await tx.ingredientCategory.findFirst();
            }
            if (cat) {
              const codeSuffix = Date.now().toString().slice(-5);
              const createdIng = await tx.ingredient.create({
                data: {
                  code: `ING-NEW-${codeSuffix}`,
                  name: it.name.trim(),
                  categoryId: cat.id,
                  defaultUnit: it.unit || 'Kg',
                  currentStock: qty,
                  lastPurchasePrice: Number(it.unitPrice) || 0,
                },
              });
              targetIngId = createdIng.id;
              await tx.procurementItem.update({
                where: { id: it.id },
                data: { ingredientId: targetIngId },
              });
              const safeUnitId = order.sppgUnitId === 'ALL' ? 'SPPG-AA02' : order.sppgUnitId;
              await tx.stockMovement.create({
                data: {
                  sppgUnitId: safeUnitId,
                  ingredientId: targetIngId,
                  type: 'MASUK',
                  quantity: qty,
                  unit: it.unit || createdIng.defaultUnit,
                  referenceNumber: order.receiptNumber || 'NOTA-BELANJA',
                  purpose: `Belanja Pasokan Stok MBG Bahan Baru (${order.receiptNumber || 'Nota'})`,
                  recordedBy: 'Superadmin Pengadaan',
                  remainingStockAfter: qty,
                },
              });
            }
          } catch (e) {
            console.warn('Gagal tambah bahan baru otomatis ke master:', e);
          }
        }
      }

      return order;
    });

    const [unit, emp, sup] = await Promise.all([
      created.sppgUnitId === 'ALL' ? null : prisma.sppgUnit.findUnique({ where: { id: created.sppgUnitId }, select: { name: true } }),
      prisma.employee.findUnique({ where: { id: created.requesterId }, select: { name: true, roleTitle: true } }),
      prisma.supplier.findUnique({ where: { id: created.supplierId }, select: { name: true, address: true } }),
    ]);

    const lookups = {
      unitMap: unit ? new Map([[created.sppgUnitId, unit.name]]) : undefined,
      empMap: emp ? new Map([[created.requesterId, { name: emp.name, roleTitle: emp.roleTitle }]]) : undefined,
      supMap: sup ? new Map([[created.supplierId, { name: sup.name, address: sup.address }]]) : undefined,
    };

    // Log system notification for Pemantau / Auditor in real-time
    try {
      const unitLabel = created.sppgUnitId === 'ALL' ? 'Semua Unit (4 Dapur)' : (unit?.name || created.sppgUnitId);
      await prisma.systemNotification.create({
        data: {
          type: 'PROCUREMENT_ADDED',
          title: 'Pembelanjaan Baru Perlu Audit',
          message: `Superadmin mencatat nota fisik ${created.receiptNumber} sebesar Rp ${Number(created.actualReceiptTotal).toLocaleString('id-ID')} (${unitLabel}). Menunggu verifikasi auditor.`,
          actorName: 'Superadmin Pengelola',
          amount: created.actualReceiptTotal,
          unitName: unitLabel,
          referenceId: created.id,
        },
      });
    } catch (e) {
      console.error('Failed to log procurement notification:', e);
    }

    return NextResponse.json(
      { success: true, data: orderToApp(created, created.items, lookups), message: 'Data belanja tersimpan.' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
