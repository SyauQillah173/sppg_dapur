import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditStatus } from '@prisma/client';
import { requireSuperadmin } from '@/lib/api-auth';
import { applyOrderAggregates, orderToApp, withAnomalyCheck } from '@/lib/procurement-db';

/** Edit nota belanja: nominal, tanggal, unit, peminta, supplier, rincian bahan, status. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.procurementOrder.findUnique({ where: { id }, include: { items: true } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Nota belanja tidak ditemukan.' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Tarik dulu pengaruh nota lama dari total unit + supplier, lalu pasang nilai baru.
      await applyOrderAggregates(tx, existing, -1);

      const data: any = {};
      if (body.receiptNumber !== undefined) data.receiptNumber = String(body.receiptNumber).trim() || '-';
      if (body.date) data.date = new Date(body.date);
      if (body.sppgUnitId) data.sppgUnitId = body.sppgUnitId;
      if (body.requesterId) data.requesterId = body.requesterId;
      if (body.supplierId) data.supplierId = body.supplierId;
      if (body.amountRequested !== undefined) data.amountRequested = Number(body.amountRequested) || 0;
      if (body.actualReceiptTotal !== undefined) data.actualReceiptTotal = Number(body.actualReceiptTotal) || 0;
      if (body.changeReturned !== undefined) data.changeReturned = Number(body.changeReturned) || 0;
      if (body.notes !== undefined) data.notes = body.notes || null;
      if (body.receiptPhotoUrl !== undefined) {
        data.receiptPhotoUrl = body.receiptPhotoUrl || null;
        data.physicalReceiptImage = body.receiptPhotoUrl ? 'PHYSICAL_RECEIPT_NEW' : null;
      }
      if (body.status) {
        data.status = body.status as AuditStatus;
        if (body.status === AuditStatus.VERIFIED) data.auditedAt = new Date();
        if (body.auditedBy) data.auditedBy = body.auditedBy;
        if (body.auditNotes !== undefined) data.auditNotes = body.auditNotes || null;
        if (body.discrepancyReason !== undefined) data.discrepancyReason = body.discrepancyReason || null;
      }

      if (Array.isArray(body.items)) {
        await tx.procurementItem.deleteMany({ where: { procurementOrderId: id } });
        data.items = { create: await withAnomalyCheck(tx, body.items) };
      }

      const order = await tx.procurementOrder.update({
        where: { id },
        data,
        include: { items: true },
      });

      await applyOrderAggregates(tx, order, 1);
      return order;
    });

    return NextResponse.json({ success: true, data: orderToApp(updated, updated.items), message: 'Nota belanja diperbarui.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

/** Ubah status audit saja (dipakai tombol ACC / Tandai Selisih). */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, auditNotes, auditedBy, discrepancyReason } = body;

    const updated = await prisma.procurementOrder.update({
      where: { id },
      data: {
        status: status as AuditStatus,
        auditNotes,
        auditedBy,
        discrepancyReason,
        auditedAt: new Date(),
      },
      include: { items: true },
    });

    await prisma.procurementItem.updateMany({
      where: { procurementOrderId: id },
      data: { isItemVerified: status === AuditStatus.VERIFIED },
    });

    const items = await prisma.procurementItem.findMany({ where: { procurementOrderId: id } });
    return NextResponse.json({ success: true, data: orderToApp(updated, items) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

/** Hapus nota belanja beserta rinciannya, dan kembalikan total unit + supplier. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const existing = await prisma.procurementOrder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Nota belanja tidak ditemukan.' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await applyOrderAggregates(tx, existing, -1);
      await tx.procurementOrder.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: 'Nota belanja dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
