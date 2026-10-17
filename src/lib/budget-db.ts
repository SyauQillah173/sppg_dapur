import { Prisma, PrismaClient } from '@prisma/client';

type Tx = Prisma.TransactionClient | PrismaClient;

/** Baris budget_allocations → bentuk aplikasi. */
export function budgetToApp(row: any, unitMap?: Map<string, string>) {
  const sppgUnitName =
    row.sppgUnitId === 'ALL'
      ? 'Semua SPPG (Gabungan 4 Unit)'
      : unitMap?.get(row.sppgUnitId) || row.sppgUnitId;

  let meta: any = {};
  let noteText = row.notes || '';
  if (row.notes && typeof row.notes === 'string' && (row.notes.startsWith('{') || row.notes.startsWith('['))) {
    try {
      meta = JSON.parse(row.notes);
      noteText = meta.note || '';
    } catch {
      // not JSON, keep as is
    }
  }

  return {
    id: row.id,
    sppgUnitId: row.sppgUnitId,
    sppgUnitName,
    fiscalPeriod: row.fiscalPeriod,
    amountAllocated: Number(row.amountAllocated),
    amountRealized: Number(row.amountRealized),
    remainingBudget: Number(row.remainingBudget),
    allocatedDate: new Date(row.allocatedDate).toISOString(),
    notes: noteText,
    rawNotes: row.notes || '',
    requestedBy: row.requestedBy || meta.requestedBy || '',
    requesterFor: row.requesterFor || meta.requesterFor || '',
    cashHolder: row.cashHolder || meta.cashHolder || '',
    transferProofUrl: row.transferProofUrl || meta.transferProofUrl || '',
    withdrawnAmount: Number(row.withdrawnAmount ?? meta.withdrawnAmount) || 0,
    withdrawnAt: row.withdrawnAt || meta.withdrawnAt || undefined,
    withdrawnBy: row.withdrawnBy || meta.withdrawnBy || '',
    withdrawnRecipient: row.withdrawnRecipient || meta.withdrawnRecipient || '',
    withdrawnSpender: row.withdrawnSpender || meta.withdrawnSpender || '',
    withdrawnProofUrl: row.withdrawnProofUrl || meta.withdrawnProofUrl || '',
    withdrawnNote: row.withdrawnNote || meta.withdrawnNote || '',
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
