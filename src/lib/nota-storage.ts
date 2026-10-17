/** Foto nota disimpan sebagai baris Postgres (bytea) — aman di Vercel/serverless yang FS-nya read-only. */
export const NOTA_URL_PREFIX = '/api/nota/';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

/** Nama file harus hasil generator /api/upload — cegah path traversal. */
export function safeNotaName(name: string): string | null {
  return /^nota-\d+-[a-z0-9]{1,10}\.(jpg|jpeg|png|webp|heic|heif)$/.test(name) ? name : null;
}

export function notaMime(name: string): string {
  return MIME[name.split('.').pop()?.toLowerCase() || ''] || 'application/octet-stream';
}

/** Ekstrak nama nota unik dari URL (misal: /api/nota/nota-1234-xyz.webp -> nota-1234-xyz.webp) */
export function extractNotaName(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;
  const match = urlOrPath.match(/nota-\d+-[a-z0-9]{1,10}\.(jpg|jpeg|png|webp|heic|heif)/i);
  return match ? match[0] : null;
}

/** Hapus 1 foto dari tabel nota_photos di database */
export async function deleteNotaPhoto(urlOrName: string | null | undefined, client?: any): Promise<boolean> {
  const name = extractNotaName(urlOrName);
  if (!name) return false;

  try {
    const prismaClient = client || (await import('@/lib/prisma')).default;
    await prismaClient.notaPhoto.deleteMany({
      where: { name },
    });
    return true;
  } catch (err) {
    console.error(`Gagal menghapus foto ${name} dari nota_photos:`, err);
    return false;
  }
}

/** Hapus beberapa foto sekaligus dari tabel nota_photos */
export async function deleteNotaPhotos(urlsOrNames: (string | null | undefined)[], client?: any): Promise<number> {
  const names = urlsOrNames
    .map(extractNotaName)
    .filter((n): n is string => Boolean(n));

  if (names.length === 0) return 0;

  try {
    const prismaClient = client || (await import('@/lib/prisma')).default;
    const res = await prismaClient.notaPhoto.deleteMany({
      where: { name: { in: names } },
    });
    return res.count;
  } catch (err) {
    console.error('Gagal menghapus kumpulan foto dari nota_photos:', err);
    return 0;
  }
}

/**
 * Pembersih Otomatis: Hapus semua foto di tabel nota_photos yang tidak lagi
 * dipakai oleh transaksi belanja aktif manapun atau alokasi anggaran manapun.
 */
export async function cleanupOrphanedPhotos(client?: any): Promise<{ deletedCount: number; orphanedNames: string[] }> {
  try {
    const prismaClient = client || (await import('@/lib/prisma')).default;

    const [allPhotos, orders, budgets] = await Promise.all([
      prismaClient.notaPhoto.findMany({ select: { name: true } }),
      (prismaClient.procurementOrder as any).findMany({ select: { receiptPhotoUrl: true, returnProofUrl: true } }),
      prismaClient.budgetAllocation.findMany({ select: { notes: true } }),
    ]);

    const activeNames = new Set<string>();

    for (const o of orders) {
      const p1 = extractNotaName(o.receiptPhotoUrl);
      if (p1) activeNames.add(p1);
      const p2 = extractNotaName((o as any).returnProofUrl);
      if (p2) activeNames.add(p2);
    }

    for (const b of budgets) {
      if (b.notes) {
        const matches = b.notes.matchAll(/nota-\d+-[a-z0-9]{1,10}\.(jpg|jpeg|png|webp|heic|heif)/gi);
        for (const m of matches) {
          activeNames.add(m[0]);
        }
      }
    }

    const orphaned = allPhotos.filter((p: { name: string }) => !activeNames.has(p.name));
    if (orphaned.length === 0) {
      return { deletedCount: 0, orphanedNames: [] };
    }

    const orphanedNames = orphaned.map((p: { name: string }) => p.name);
    const res = await prismaClient.notaPhoto.deleteMany({
      where: { name: { in: orphanedNames } },
    });

    console.log(`🧹 Berhasil membersihkan ${res.count} foto yatim/sampah dari tabel nota_photos.`);
    return { deletedCount: res.count, orphanedNames };
  } catch (err) {
    console.error('Gagal membersihkan foto yatim:', err);
    return { deletedCount: 0, orphanedNames: [] };
  }
}
