/**
 * Kunci HMAC untuk cookie sesi.
 * SESSION_SECRET kalau diset; kalau tidak, diturunkan dari kredensial DB.
 * Tidak boleh ada nilai default yang ikut ke repo — repo ini publik, kunci yang
 * ikut ke repo = siapa pun bisa memalsukan cookie SUPERADMIN.
 */
let cached: string | null = null;

export async function getSessionSecret(): Promise<string> {
  if (cached) return cached;

  const explicit = process.env.SESSION_SECRET;
  if (explicit && explicit.length >= 16) {
    cached = explicit;
    return cached;
  }

  const seed = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!seed) {
    throw new Error('SESSION_SECRET atau DATABASE_URL wajib diset: sesi tidak boleh memakai kunci default.');
  }

  const data = new TextEncoder().encode(`sppg-session-v1|${seed}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  cached = Buffer.from(digest).toString('hex');
  return cached;
}
