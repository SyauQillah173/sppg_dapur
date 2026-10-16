import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/api-auth';
import { applyBudgetToUnits, budgetToApp } from '@/lib/budget-db';

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
      // Kembalikan dulu pengaruh catatan lama ke pagu kas unit
      await applyBudgetToUnits(tx, existing.sppgUnitId, -Number(existing.amountAllocated));

      const data: any = {};
      if (body.sppgUnitId) data.sppgUnitId = body.sppgUnitId;
      if (body.fiscalPeriod !== undefined) data.fiscalPeriod = String(body.fiscalPeriod).trim() || '-';
      if (body.amountAllocated !== undefined) {
        const amount = Number(body.amountAllocated);
        if (!isFinite(amount) || amount <= 0) throw new Error('Nominal dana masuk harus lebih dari 0.');
        data.amountAllocated = amount;
      }
      if (body.amountRealized !== undefined) data.amountRealized = Number(body.amountRealized) || 0;
      if (body.remainingBudget !== undefined) data.remainingBudget = Number(body.remainingBudget) || 0;
      if (body.allocatedDate) data.allocatedDate = new Date(body.allocatedDate);
      if (body.notes !== undefined) data.notes = body.notes || null;

      const row = await tx.budgetAllocation.update({ where: { id }, data });
      await applyBudgetToUnits(tx, row.sppgUnitId, Number(row.amountAllocated));
      return row;
    });

    const units = await prisma.sppgUnit.findMany({ select: { id: true, name: true } });
    const unitMap = new Map(units.map((u) => [u.id, u.name]));
    return NextResponse.json({ success: true, data: budgetToApp(updated, unitMap), message: 'Catatan dana masuk diperbarui.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 });
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

    await prisma.$transaction(async (tx) => {
      await applyBudgetToUnits(tx, existing.sppgUnitId, -Number(existing.amountAllocated));
      await tx.budgetAllocation.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: 'Catatan dana masuk dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
