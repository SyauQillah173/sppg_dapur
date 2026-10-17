import { cookies } from 'next/headers';
import { UserRole } from './types';
import { getSessionSecret } from './session-secret';

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

const SESSION_COOKIE_NAME = 'giziflow_session';

// ─── HMAC helpers (Node.js crypto, available in Edge/Node runtimes) ───────────

async function hmacSign(payload: string): Promise<string> {
  const secret = await getSessionSecret();
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Buffer.from(sig).toString('base64url');
}

async function hmacVerify(payload: string, sig: string): Promise<boolean> {
  try {
    const expected = await hmacSign(payload);
    // constant-time compare
    if (expected.length !== sig.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    return diff === 0;
  } catch { return false; }
}

// Token format: base64url(payload).base64url(hmac)
export async function createSessionToken(user: SessionUser): Promise<string> {
  const payload = Buffer.from(JSON.stringify({
    id: user.id, username: user.username, name: user.name, role: user.role,
    iat: Math.floor(Date.now() / 1000),
  })).toString('base64url');
  const sig = await hmacSign(payload);
  return `${payload}.${sig}`;
}

export async function parseSessionToken(token: string): Promise<SessionUser | null> {
  try {
    const dot = token.lastIndexOf('.');
    if (dot < 1) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const valid = await hmacVerify(payload, sig);
    if (!valid) return null;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    // Token max age: 30 hari (2.592.000 detik)
    // Sesi aktif selama user membuka aplikasi, otomatis logout jika 30 hari tidak dibuka
    if (!parsed.iat || Date.now() / 1000 - parsed.iat > 60 * 60 * 24 * 30) return null;
    if (!parsed.username || !parsed.role) return null;
    return { id: parsed.id, username: parsed.username, name: parsed.name, role: parsed.role as UserRole };
  } catch { return null; }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return parseSessionToken(token);
}

export async function setSessionCookie(res: { cookies: { set: Function } }, user: SessionUser): Promise<string> {
  const token = await createSessionToken(user);
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 hari
  });
  return token;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
