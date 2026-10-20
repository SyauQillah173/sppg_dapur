import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionSecret } from '@/lib/session-secret';
import { checkRateLimit } from '@/lib/rate-limit';

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
    // Token max age: 30 hari (2.592.000 detik)
    if (!parsed.iat || Date.now() / 1000 - parsed.iat > 60 * 60 * 24 * 30) return null;
    if (!parsed.username || !parsed.role) return null;
    return { username: parsed.username, role: parsed.role };
  } catch { return null; }
}

const SEC: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https:",
    "font-src 'self' data:",
    "object-src 'none'",
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

  // 1. IP Extraction & Rate Limiting for API routes to prevent scraping & DDoS
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/auth/restore') {
      if (!checkRateLimit(`rl:restore:${ip}`, 30, 60_000)) {
        return NextResponse.json(
          { success: false, error: 'Terlalu banyak permintaan restore sesi. Harap tunggu sebentar.' },
          { status: 429 }
        );
      }
    } else if (pathname !== '/api/auth/login') {
      if (!checkRateLimit(`rl:api:${ip}`, 180, 60_000)) {
        return NextResponse.json(
          { success: false, error: 'Batas frekuensi permintaan API terlampaui. Harap perlambat akses Anda demi kestabilan server.' },
          { status: 429 }
        );
      }
    }

    // 2. CSRF & Cross-Origin Protection for state-modifying methods
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (mutatingMethods.includes(request.method)) {
      const origin = request.headers.get('origin');
      const host = request.headers.get('host');
      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            return NextResponse.json(
              { success: false, error: 'Akses ditolak: Permintaan lintas-asal (Cross-Origin CSRF) tidak diizinkan.' },
              { status: 403 }
            );
          }
        } catch {
          return NextResponse.json(
            { success: false, error: 'Header Origin permintaan tidak valid.' },
            { status: 400 }
          );
        }
      }
    }
  }

  if (pathname === '/api/auth/login' || pathname === '/api/auth/logout' || pathname === '/api/auth/restore') {
    const res = NextResponse.next();
    Object.entries(SEC).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // Dukung token dari Cookie HttpOnly maupun Bearer Authorization header
  const cookieToken = request.cookies.get('giziflow_session')?.value;
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = cookieToken || bearerToken;

  const session = token ? await verifyToken(token) : null;
  const isAuthenticated = !!session;
  const isLoginPage = pathname === '/login';

  if (!isAuthenticated && !isLoginPage) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Silakan login terlebih dahulu.' }, { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && isLoginPage) {
    const redirectRes = NextResponse.redirect(new URL('/', request.url));
    if (token) {
      redirectRes.cookies.set('giziflow_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 hari
      });
    }
    return redirectRes;
  }

  const res = NextResponse.next();
  Object.entries(SEC).forEach(([k, v]) => res.headers.set(k, v));

  // Rolling session: selama user aktif membuka aplikasi, masa berlaku cookie diperpanjang 30 hari ke depan
  if (token && session) {
    res.cookies.set('giziflow_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 hari
    });
  }

  return res;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
