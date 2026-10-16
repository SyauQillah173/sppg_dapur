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

    return NextResponse.json({
      success: true,
      data: orders.map((o) => orderToApp(o, o.items, lookups)),
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

    return NextResponse.json(
      { success: true, data: orderToApp(created, created.items, lookups), message: 'Data belanja tersimpan.' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
