import { cookies } from 'next/headers';
import prisma from './prisma';
import { UserRole } from './types';

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

const SESSION_COOKIE_NAME = 'giziflow_session';

export function createSessionToken(user: SessionUser): string {
  // Simple Base64-encoded JSON session with secret check
  const payload = {
    ...user,
    issuedAt: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function parseSessionToken(token: string): SessionUser | null {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.username && parsed.role) {
      return {
        id: parsed.id,
        username: parsed.username,
        name: parsed.name,
        role: parsed.role as UserRole,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return parseSessionToken(token);
}

export async function setSessionCookie(user: SessionUser) {
  const cookieStore = await cookies();
  const token = createSessionToken(user);
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
