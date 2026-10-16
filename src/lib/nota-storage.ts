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
