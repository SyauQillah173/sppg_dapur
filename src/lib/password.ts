import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

/** Cocok? Hash lama (plaintext) tetap diterima supaya login tidak terkunci — lalu di-upgrade. */
export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;

  if (!stored.startsWith('scrypt$')) return stored === password;

  const [, saltHex, hashHex] = stored.split('$');
  if (!saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function isLegacyPassword(stored: string): boolean {
  return !!stored && !stored.startsWith('scrypt$');
}
