import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditStatus } from '@prisma/client';
import { requireAuth, requireSuperadmin } from '@/lib/api-auth';
import { applyOrderAggregates, orderToApp, withAnomalyCheck } from '@/lib/procurement-db';

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

    const orders = await prisma.procurementOrder.findMany({
      where,
      include: { items: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      data: orders.map((o) => orderToApp(o, o.items)),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

/** Catat pembelanjaan baru. Sekaligus menyesuaikan total unit + supplier. */
export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
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
          items: { create: mappedItems },
        },
        include: { items: true },
      });

      await applyOrderAggregates(tx, order, 1);
      return order;
    });

    return NextResponse.json(
      { success: true, data: orderToApp(created, created.items), message: 'Data belanja tersimpan.' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
