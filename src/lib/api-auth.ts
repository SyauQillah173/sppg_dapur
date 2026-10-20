import { NextRequest, NextResponse } from 'next/server';
import { parseSessionToken, SessionUser } from './auth';
import { UserRole } from './types';
import { isSessionRevoked } from './session-manager';

// Re-export for routes that still call it directly (backward compat)
export { parseSessionToken };

/**
 * Validates session from request cookies or Authorization header.
 * Also verifies if the session has been revoked via remote logout.
 * Returns { user } on success, or { error: NextResponse } on failure.
 * Usage in route handler:
 *   const auth = await requireAuth(req);
 *   if ('error' in auth) return auth.error;
 *   const { user } = auth;
 */
export async function requireAuth(
  req: NextRequest,
  allowedRoles?: UserRole[]
): Promise<{ user: SessionUser } | { error: NextResponse }> {
  // Dukung token dari Cookie HTTP-only atau Header Authorization: Bearer <token>
  const cookieToken = req.cookies.get('giziflow_session')?.value;
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    return { error: NextResponse.json({ success: false, error: 'Akses ditolak. Silakan login terlebih dahulu.' }, { status: 401 }) };
  }

  const user = await parseSessionToken(token);
  if (!user) {
    return { error: NextResponse.json({ success: false, error: 'Sesi tidak valid atau telah kedaluwarsa.' }, { status: 401 }) };
  }

  // Verifikasi apakah perangkat telah di-kick / di-logout secara jarak jauh
  const revoked = await isSessionRevoked(token);
  if (revoked) {
    const res = NextResponse.json(
      { success: false, error: 'Sesi perangkat telah dicabut atau dikeluarkan secara jarak jauh.', revoked: true },
      { status: 401 }
    );
    res.cookies.delete('giziflow_session');
    return { error: res };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { error: NextResponse.json({ success: false, error: 'Akses ditolak. Hak akses tidak mencukupi untuk aksi ini.' }, { status: 403 }) };
  }

  return { user };
}

/** Convenience: only SUPERADMIN allowed */
export async function requireSuperadmin(req: NextRequest) {
  return requireAuth(req, ['SUPERADMIN']);
}

/** Convenience: SUPERADMIN or DISTRIBUTION_DRIVER allowed */
export async function requireDistributionAccess(req: NextRequest) {
  return requireAuth(req, ['SUPERADMIN', 'DISTRIBUTION_DRIVER']);
}
