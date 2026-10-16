export interface StateSnapshot {
  procurements?: unknown[];
  budgetAllocations?: unknown[];
  [key: string]: unknown;
}

/**
 * Penyelamat data: server masih kosong untuk jenis data ini tapi perangkat ini punya
 * isinya (input lama sebelum sinkron server aktif) → pakai milik lokal.
 * Sengaja sempit: hanya berlaku saat daftar di server benar-benar kosong, supaya
 * penghapusan di perangkat lain tidak dihidupkan lagi oleh cache yang lebih tua.
 */
export function rescueLocalOnly(server: StateSnapshot, local: StateSnapshot | null): StateSnapshot {
  const rescued: StateSnapshot = {};
  if (!local) return rescued;

  for (const key of ['procurements', 'budgetAllocations'] as const) {
    const serverList = Array.isArray(server[key]) ? (server[key] as unknown[]) : [];
    const localList = Array.isArray(local[key]) ? (local[key] as unknown[]) : [];
    if (serverList.length === 0 && localList.length > 0) rescued[key] = localList;
  }
  return rescued;
}
