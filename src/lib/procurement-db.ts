import { Prisma, PrismaClient } from '@prisma/client';

type Tx = Prisma.TransactionClient | PrismaClient;

/** Baris DB → bentuk yang dipakai aplikasi (tanpa relasi include, id = id aplikasi). */
export function orderToApp(order: any, items: any[]) {
  return {
    id: order.id,
    receiptNumber: order.receiptNumber || '-',
    date: new Date(order.date).toISOString().slice(0, 10),
    sppgUnitId: order.sppgUnitId,
    requesterId: order.requesterId,
    supplierId: order.supplierId,
    amountRequested: Number(order.amountRequested),
    actualReceiptTotal: Number(order.actualReceiptTotal),
    changeReturned: Number(order.changeReturned),
    status: order.status,
    receiptPhotoUrl: order.receiptPhotoUrl || '',
    physicalReceiptImage: order.physicalReceiptImage || '',
    auditedBy: order.auditedBy || undefined,
    auditedAt: order.auditedAt ? new Date(order.auditedAt).toISOString() : undefined,
    auditNotes: order.auditNotes || undefined,
    discrepancyReason: order.discrepancyReason || undefined,
    notes: order.notes || undefined,
    createdAt: new Date(order.createdAt).toISOString(),
    items: items.map((it) => ({
      id: it.id,
      name: it.name,
      category: it.category,
      quantity: Number(it.quantity),
      unit: it.unit,
      unitPrice: Number(it.unitPrice),
      subtotal: Number(it.subtotal),
      isOcrMatched: it.isOcrMatched,
      isItemVerified: it.isItemVerified,
      hasPriceAnomaly: it.hasPriceAnomaly,
      previousAvgPrice: it.previousAvgPrice != null ? Number(it.previousAvgPrice) : undefined,
    })),
  };
}

/**
 * Sesuaikan total unit + supplier saat nota dibuat/diubah/dihapus.
 * Nota 'ALL' dibagi rata ke tiap unit supaya total tidak berlipat.
 * ponytail: asumsi bagi rata; ganti kalau nanti ada rincian per unit.
 */
export async function applyOrderAggregates(
  tx: Tx,
  order: { sppgUnitId: string; supplierId: string; actualReceiptTotal: number | Prisma.Decimal },
  sign: 1 | -1
) {
  const total = Number(order.actualReceiptTotal) * sign;

  // Increment atomik (bukan baca-lalu-tulis per baris) supaya tetap jauh di bawah
  // batas waktu transaksi Neon.
  if (order.sppgUnitId === 'ALL') {
    const unitCount = await tx.sppgUnit.count();
    const share = unitCount > 0 ? total / unitCount : total;
    await tx.sppgUnit.updateMany({
      data: { totalRealized: { increment: share }, totalRemaining: { decrement: share } },
    });
  } else {
    await tx.sppgUnit.updateMany({
      where: { id: order.sppgUnitId },
      data: { totalRealized: { increment: total }, totalRemaining: { decrement: total } },
    });
  }

  await tx.supplier.updateMany({
    where: { id: order.supplierId },
    data: { totalDisbursed: { increment: total }, totalTransactions: { increment: sign } },
  });
}

/** Periksa anomali harga tiap item terhadap harga patokan bahan (naik > 20%). */
export async function withAnomalyCheck(tx: Tx, items: any[]) {
  const list = items || [];
  if (list.length === 0) return [];

  // Patokan diambil sekali untuk semua item, bukan satu query per baris.
  const ingredients = await tx.ingredient.findMany({
    select: { id: true, name: true, lastPurchasePrice: true },
  });
  const byName = new Map(ingredients.map((i) => [i.name.trim().toLowerCase(), i]));

  return list.map((item: any) => {
    const name = String(item.name || '').trim();
    const ingredient = byName.get(name.toLowerCase());
    const benchmark = ingredient ? Number(ingredient.lastPurchasePrice) : 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const quantity = Number(item.quantity) || 0;

    return {
      ingredientId: ingredient?.id ?? null,
      name,
      category: item.category || 'Sayuran',
      quantity,
      unit: item.unit || 'Kg',
      unitPrice,
      subtotal: Number(item.subtotal) || quantity * unitPrice || 0,
      isOcrMatched: item.isOcrMatched !== false,
      isItemVerified: !!item.isItemVerified,
      hasPriceAnomaly: benchmark > 0 && unitPrice > benchmark * 1.2,
      previousAvgPrice: benchmark > 0 ? benchmark : null,
    };
  });
}
