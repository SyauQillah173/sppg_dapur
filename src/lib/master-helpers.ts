/** Perapian nama: rapikan spasi ganda dan potong spasi tepi. */
export function normalizeName(v: unknown): string {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Kode urut berikutnya berdasarkan angka TERBESAR yang sudah ada, bukan jumlah baris.
 * Kalau pakai jumlah baris, hapus 1 baris lalu tambah baru akan menabrak kode lama.
 */
export function nextCode(prefix: string, existing: string[], pad = 2): string {
  let max = 0;
  for (const code of existing) {
    const m = /(\d+)\s*$/.exec(String(code ?? ''));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}${String(max + 1).padStart(pad, '0')}`;
}

export function isUniqueViolation(e: any): boolean {
  return e?.code === 'P2002';
}

/** Jalankan create; kalau kode bentrok, coba kode berikutnya (maks 5x). */
export async function createWithCode<T>(
  build: (code: string) => Promise<T>,
  prefix: string,
  existing: string[],
  pad = 2
): Promise<T> {
  const codes = [...existing];
  let lastError: any = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = nextCode(prefix, codes, pad);
    try {
      return await build(code);
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
      lastError = e;
      codes.push(code);
    }
  }
  throw lastError ?? new Error('Gagal membuat kode unik.');
}
