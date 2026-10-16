import { NextRequest, NextResponse } from 'next/server';
import { parseSessionToken, SessionUser } from './auth';
import { UserRole } from './types';

// Re-export for routes that still call it directly (backward compat)
export { parseSessionToken };


/**
 * Validates session from request cookies.
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
  const token = req.cookies.get('giziflow_session')?.value;
  if (!token) {
    return { error: NextResponse.json({ success: false, error: 'Akses ditolak. Silakan login.' }, { status: 401 }) };
  }

  const user = await parseSessionToken(token);
  if (!user) {
    return { error: NextResponse.json({ success: false, error: 'Sesi tidak valid atau kedaluwarsa.' }, { status: 401 }) };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { error: NextResponse.json({ success: false, error: 'Akses ditolak. Hak akses tidak mencukupi.' }, { status: 403 }) };
  }

  return { user };
}

/** Convenience: only SUPERADMIN allowed */
export async function requireSuperadmin(req: NextRequest) {
  return requireAuth(req, ['SUPERADMIN']);
}
