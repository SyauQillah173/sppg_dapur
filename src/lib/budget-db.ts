import { Prisma, PrismaClient } from '@prisma/client';

type Tx = Prisma.TransactionClient | PrismaClient;

/** Baris budget_allocations → bentuk aplikasi. */
export function budgetToApp(row: any) {
  return {
    id: row.id,
    sppgUnitId: row.sppgUnitId,
    fiscalPeriod: row.fiscalPeriod,
    amountAllocated: Number(row.amountAllocated),
    amountRealized: Number(row.amountRealized),
    remainingBudget: Number(row.remainingBudget),
    allocatedDate: new Date(row.allocatedDate).toISOString(),
    notes: row.notes || '',
  };
}

/**
 * Sesuaikan pagu kas tiap unit saat dana masuk dicatat/diubah/dihapus.
 * 'ALL' = dana gabungan → dibagi rata supaya total anggaran tidak berlipat.
 * ponytail: asumsi bagi rata; ganti kalau nanti ada rincian per unit.
 */
export async function applyBudgetToUnits(tx: Tx, sppgUnitId: string, delta: number) {
  if (sppgUnitId === 'ALL') {
    const unitCount = await tx.sppgUnit.count();
    const share = unitCount > 0 ? delta / unitCount : delta;
    await tx.sppgUnit.updateMany({
      data: { activeBudget: { increment: share }, totalRemaining: { increment: share } },
    });
    return;
  }

  await tx.sppgUnit.updateMany({
    where: { id: sppgUnitId },
    data: { activeBudget: { increment: delta }, totalRemaining: { increment: delta } },
  });
}
