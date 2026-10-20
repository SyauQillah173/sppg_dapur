import bcrypt from 'bcryptjs';
import { scryptSync, timingSafeEqual } from 'crypto';

const BCRYPT_ROUNDS = 12;
const KEYLEN = 64;

/**
 * Hash password menggunakan standar industri bcrypt dengan work-factor 12.
 * Menghasilkan hash $2b$12$... atau $2a$12$... yang tahan terhadap brute force & rainbow tables.
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

/**
 * Verifikasi password mendukung:
 * 1. Standar bcrypt ($2a$, $2b$, $2y$)
 * 2. Transisi format lama scrypt ($scrypt$salt$hash)
 * 3. Fallback plaintext lama (jika ada data warisan sebelum migrasi)
 */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored || !password) return false;

  // Standar modern: bcrypt hash ($2a$, $2b$, $2y$)
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    try {
      return bcrypt.compareSync(password, stored);
    } catch {
      return false;
    }
  }

  // Kompatibilitas mundur: scrypt hash lama
  if (stored.startsWith('scrypt$')) {
    try {
      const parts = stored.split('$');
      if (parts.length < 3) return false;
      const saltHex = parts[1];
      const hashHex = parts[2];
      if (!saltHex || !hashHex) return false;

      const expected = Buffer.from(hashHex, 'hex');
      const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    } catch {
      return false;
    }
  }

  // Fallback: plaintext lama jika ada sebelum sistem keamanan diterapkan
  return stored === password;
}

/**
 * Menentukan apakah password yang tersimpan perlu di-rehash ke bcrypt 12.
 * Mengembalikan true jika password belum berupa bcrypt hash berstandar 12 rounds.
 */
export function needsRehash(stored: string): boolean {
  if (!stored) return true;
  // Jika bukan bcrypt 12 rounds ($2b$12$... atau $2a$12$...)
  return !(stored.startsWith('$2b$12$') || stored.startsWith('$2a$12$'));
}

/**
 * Alias untuk kompatibilitas mundur
 */
export function isLegacyPassword(stored: string): boolean {
  return needsRehash(stored);
}
