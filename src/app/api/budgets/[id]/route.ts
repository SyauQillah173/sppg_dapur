import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/api-auth';
import { applyBudgetToUnits, budgetToApp } from '@/lib/budget-db';
import { deleteNotaPhotos, cleanupOrphanedPhotos } from '@/lib/nota-storage';
import { safeErrorMessage } from '@/lib/safe-error';

/** Edit catatan dana masuk. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.budgetAllocation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Catatan dana masuk tidak ditemukan.' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Baca metadata lama jika ada
      let oldMeta: any = {};
      if (existing.notes && typeof existing.notes === 'string' && (existing.notes.startsWith('{') || existing.notes.startsWith('['))) {
        try {
          oldMeta = JSON.parse(existing.notes);
        } catch {
          // ignore
        }
      }

      const mergedMeta = {
        note: body.notes !== undefined ? body.notes : (oldMeta.note || existing.notes || ''),
        requestedBy: body.requestedBy !== undefined ? body.requestedBy : (oldMeta.requestedBy || ''),
        requesterFor: body.requesterFor !== undefined ? body.requesterFor : (oldMeta.requesterFor || ''),
        cashHolder: body.cashHolder !== undefined ? body.cashHolder : (oldMeta.cashHolder || ''),
        transferProofUrl: body.transferProofUrl !== undefined ? body.transferProofUrl : (oldMeta.transferProofUrl || ''),
        withdrawnAmount: body.withdrawnAmount !== undefined ? Number(body.withdrawnAmount) : (oldMeta.withdrawnAmount || 0),
        withdrawnAt: body.withdrawnAt !== undefined ? body.withdrawnAt : oldMeta.withdrawnAt,
        withdrawnBy: body.withdrawnBy !== undefined ? body.withdrawnBy : (oldMeta.withdrawnBy || ''),
        withdrawnRecipient: body.withdrawnRecipient !== undefined ? body.withdrawnRecipient : (oldMeta.withdrawnRecipient || ''),
        withdrawnSpender: body.withdrawnSpender !== undefined ? body.withdrawnSpender : (oldMeta.withdrawnSpender || ''),
        withdrawnProofUrl: body.withdrawnProofUrl !== undefined ? body.withdrawnProofUrl : (oldMeta.withdrawnProofUrl || ''),
        withdrawnNote: body.withdrawnNote !== undefined ? body.withdrawnNote : (oldMeta.withdrawnNote || ''),
      };

      const hasMeta = mergedMeta.requestedBy || mergedMeta.requesterFor || mergedMeta.cashHolder || mergedMeta.transferProofUrl || mergedMeta.withdrawnAmount > 0 || mergedMeta.withdrawnRecipient || mergedMeta.withdrawnSpender || mergedMeta.withdrawnProofUrl;
      const serializedNotes = hasMeta ? JSON.stringify(mergedMeta) : (body.notes !== undefined ? body.notes : existing.notes);

      // Kembalikan dulu pengaruh catatan lama ke pagu kas unit (dikurangi sisa yang sudah ditarik sebelumnya jika ada)
      const oldNetAllocated = Number(existing.amountAllocated) - (Number(oldMeta.withdrawnAmount) || 0);
      await applyBudgetToUnits(tx, existing.sppgUnitId, -oldNetAllocated);

      const data: any = {};
      if (body.sppgUnitId) data.sppgUnitId = body.sppgUnitId;
      if (body.fiscalPeriod !== undefined) data.fiscalPeriod = String(body.fiscalPeriod).trim() || '-';
      if (body.amountAllocated !== undefined) {
        const amount = Number(body.amountAllocated);
        if (!isFinite(amount) || amount <= 0) throw new Error('Nominal dana masuk harus lebih dari 0.');
        data.amountAllocated = amount;
      }
      if (body.amountRealized !== undefined) data.amountRealized = Number(body.amountRealized) || 0;
      
      const newAmountAllocated = data.amountAllocated ?? Number(existing.amountAllocated);
      const newAmountRealized = data.amountRealized ?? Number(existing.amountRealized);
      
      if (body.remainingBudget !== undefined) {
        data.remainingBudget = Number(body.remainingBudget) || 0;
      } else if (body.withdrawnAmount !== undefined) {
        data.remainingBudget = Math.max(0, newAmountAllocated - newAmountRealized - mergedMeta.withdrawnAmount);
      }

      if (body.allocatedDate) data.allocatedDate = new Date(body.allocatedDate);
      data.notes = serializedNotes;

      const row = await tx.budgetAllocation.update({ where: { id }, data });
      const newNetAllocated = Number(row.amountAllocated) - (Number(mergedMeta.withdrawnAmount) || 0);
      await applyBudgetToUnits(tx, row.sppgUnitId, newNetAllocated);
      return row;
    });

    const units = await prisma.sppgUnit.findMany({ select: { id: true, name: true } });
    const unitMap = new Map(units.map((u) => [u.id, u.name]));
    return NextResponse.json({ success: true, data: budgetToApp(updated, unitMap), message: 'Catatan dana masuk diperbarui.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 400 });
  }
}

/** Hapus catatan dana masuk dan kembalikan pagu kas unit. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const existing = await prisma.budgetAllocation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Catatan dana masuk tidak ditemukan.' }, { status: 404 });
    }

    const photosToDelete: string[] = [];
    if (existing.notes) {
      const matches = existing.notes.matchAll(/nota-\d+-[a-z0-9]{1,10}\.(jpg|jpeg|png|webp|heic|heif)/gi);
      for (const m of matches) {
        photosToDelete.push(m[0]);
      }
    }

    await prisma.$transaction(async (tx) => {
      await applyBudgetToUnits(tx, existing.sppgUnitId, -Number(existing.amountAllocated));
      await tx.budgetAllocation.delete({ where: { id } });
      if (photosToDelete.length > 0) {
        await deleteNotaPhotos(photosToDelete, tx);
      }
    });

    // Otomatis bersihkan foto yatim yang tidak terpakai
    cleanupOrphanedPhotos().catch(console.error);

    return NextResponse.json({ success: true, message: 'Catatan dana masuk dihapus beserta bukti transfernya.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}
