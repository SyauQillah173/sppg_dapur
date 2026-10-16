import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionSecret } from '@/lib/session-secret';

async function verifyToken(token: string): Promise<{ username: string; role: string } | null> {
  try {
    const dot = token.lastIndexOf('.');
    if (dot < 1) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(await getSessionSecret()),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
    const expected = Buffer.from(sigBuf).toString('base64url');
    if (expected.length !== sig.length) return null;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    if (diff !== 0) return null;
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (!parsed.iat || Date.now() / 1000 - parsed.iat > 60 * 60 * 24 * 7) return null;
    if (!parsed.username || !parsed.role) return null;
    return { username: parsed.username, role: parsed.role };
  } catch { return null; }
}

const SEC: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https:",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join('; '),
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') || pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|css|js|map|json|webmanifest)$/.test(pathname)
  ) return NextResponse.next();

  if (pathname === '/api/auth/login' || pathname === '/api/auth/logout') {
    const res = NextResponse.next();
    Object.entries(SEC).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  const token = request.cookies.get('giziflow_session')?.value;
  const session = token ? await verifyToken(token) : null;
  const isAuthenticated = !!session;
  const isLoginPage = pathname === '/login';

  if (!isAuthenticated && !isLoginPage) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Silakan login.' }, { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const res = NextResponse.next();
  Object.entries(SEC).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
