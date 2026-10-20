import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditStatus } from '@prisma/client';
import { requireSuperadmin } from '@/lib/api-auth';
import { applyOrderAggregates, orderToApp, withAnomalyCheck } from '@/lib/procurement-db';
import { deleteNotaPhoto, deleteNotaPhotos, cleanupOrphanedPhotos } from '@/lib/nota-storage';
import { safeErrorMessage } from '@/lib/safe-error';

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
        if (existing.receiptPhotoUrl && existing.receiptPhotoUrl !== body.receiptPhotoUrl) {
          await deleteNotaPhoto(existing.receiptPhotoUrl, tx);
        }
        data.receiptPhotoUrl = body.receiptPhotoUrl || null;
        data.physicalReceiptImage = body.receiptPhotoUrl ? 'PHYSICAL_RECEIPT_NEW' : null;
      }
      if (body.isChangeReturned !== undefined) data.isChangeReturned = Boolean(body.isChangeReturned);
      if (body.returnProofUrl !== undefined) {
        if (existing.returnProofUrl && existing.returnProofUrl !== body.returnProofUrl) {
          await deleteNotaPhoto(existing.returnProofUrl, tx);
        }
        data.returnProofUrl = body.returnProofUrl || null;
      }
      if (body.returnedAt !== undefined) data.returnedAt = body.returnedAt ? new Date(body.returnedAt) : null;
      if (body.returnedBy !== undefined) data.returnedBy = body.returnedBy || null;
      if (body.returnedTo !== undefined) data.returnedTo = body.returnedTo || null;
      if (body.returnNotes !== undefined) data.returnNotes = body.returnNotes || null;

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

      // Jika sisa kas baru saja dikembalikan, catat notifikasi sistem
      if (body.isChangeReturned && !existing.isChangeReturned) {
        try {
          await tx.systemNotification.create({
            data: {
              type: 'CHANGE_RETURNED',
              title: 'Pengembalian Sisa Kas Lunas',
              message: `${body.returnedBy || 'Pemegang Kasbon'} telah menyetorkan sisa uang kasbon nota ${order.receiptNumber} sebesar Rp ${Number(order.changeReturned).toLocaleString('id-ID')} kepada ${body.returnedTo || 'Bendahara SPPG'}. Bukti TF terlampir.`,
              actorName: body.returnedBy || 'Pemegang Kasbon',
              amount: order.changeReturned,
              referenceId: order.id,
            },
          });
        } catch (e) {
          console.error('Failed to log change return notification:', e);
        }
      }

      await applyOrderAggregates(tx, order, 1);
      return order;
    });

    const [unit, emp, sup] = await Promise.all([
      updated.sppgUnitId === 'ALL' ? null : prisma.sppgUnit.findUnique({ where: { id: updated.sppgUnitId }, select: { name: true } }),
      prisma.employee.findUnique({ where: { id: updated.requesterId }, select: { name: true, roleTitle: true } }),
      prisma.supplier.findUnique({ where: { id: updated.supplierId }, select: { name: true, address: true } }),
    ]);

    const lookups = {
      unitMap: unit ? new Map([[updated.sppgUnitId, unit.name]]) : undefined,
      empMap: emp ? new Map([[updated.requesterId, { name: emp.name, roleTitle: emp.roleTitle }]]) : undefined,
      supMap: sup ? new Map([[updated.supplierId, { name: sup.name, address: sup.address }]]) : undefined,
    };

    return NextResponse.json({ success: true, data: orderToApp(updated, updated.items, lookups), message: 'Nota belanja diperbarui.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
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
    const [unit, emp, sup] = await Promise.all([
      updated.sppgUnitId === 'ALL' ? null : prisma.sppgUnit.findUnique({ where: { id: updated.sppgUnitId }, select: { name: true } }),
      prisma.employee.findUnique({ where: { id: updated.requesterId }, select: { name: true, roleTitle: true } }),
      prisma.supplier.findUnique({ where: { id: updated.supplierId }, select: { name: true, address: true } }),
    ]);

    const lookups = {
      unitMap: unit ? new Map([[updated.sppgUnitId, unit.name]]) : undefined,
      empMap: emp ? new Map([[updated.requesterId, { name: emp.name, roleTitle: emp.roleTitle }]]) : undefined,
      supMap: sup ? new Map([[updated.supplierId, { name: sup.name, address: sup.address }]]) : undefined,
    };

    return NextResponse.json({ success: true, data: orderToApp(updated, items, lookups) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}

/** Hapus nota belanja beserta rinciannya, dan kembalikan total unit + supplier. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const existing = await prisma.procurementOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Nota belanja tidak ditemukan.' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Kembalikan/kurangi stok bahan makanan yang tadinya masuk dari nota ini
      for (const it of existing.items) {
        const qty = Number(it.quantity) || 0;
        if (qty <= 0) continue;
        if (it.ingredientId) {
          await tx.ingredient.updateMany({
            where: { id: it.ingredientId },
            data: { currentStock: { decrement: qty } },
          });
        } else if (it.name?.trim()) {
          await tx.ingredient.updateMany({
            where: { name: { equals: it.name.trim(), mode: 'insensitive' } },
            data: { currentStock: { decrement: qty } },
          });
        }
      }

      await applyOrderAggregates(tx, existing, -1);
      await tx.procurementOrder.delete({ where: { id } });
      // Hapus foto nota belanja dan bukti transfer sisa kas dari PostgreSQL agar tidak memenuhi database!
      await deleteNotaPhotos([existing.receiptPhotoUrl, existing.returnProofUrl], tx);
    });

    // Otomatis bersihkan foto yatim yang tidak terpakai di background
    cleanupOrphanedPhotos().catch(console.error);

    return NextResponse.json({ success: true, message: 'Nota belanja dihapus beserta foto fisiknya.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}
