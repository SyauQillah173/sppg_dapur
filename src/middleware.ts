import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass Next.js internal files, static assets, and favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.') // file extension like .png, .jpg, .ico
  ) {
    return NextResponse.next();
  }

  // 2. Bypass public auth API endpoints
  if (
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout'
  ) {
    return NextResponse.next();
  }

  // 3. Inspect session cookie
  const sessionCookie = request.cookies.get('giziflow_session')?.value;
  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      // Decode base64 JSON payload
      const jsonStr = atob(sessionCookie);
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.username && parsed.role) {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  const isLoginPage = pathname === '/login';

  // If not authenticated and trying to access any protected route
  if (!isAuthenticated && !isLoginPage) {
    // If it's an API route, return 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak. Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }
    // Otherwise redirect to /login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and trying to access /login, redirect to dashboard /
  if (isAuthenticated && isLoginPage) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
