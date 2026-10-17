import { NextRequest, NextResponse } from 'next/server';
import { parseSessionToken, setSessionCookie } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@/lib/types';
import { isSessionRevoked, touchSession } from '@/lib/session-manager';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('giziflow_session')?.value;
    if (!token) return NextResponse.json({ success: false, user: null }, { status: 401 });

    const sessionUser = await parseSessionToken(token);
    if (!sessionUser) return NextResponse.json({ success: false, user: null }, { status: 401 });

    // Periksa apakah perangkat ini telah dikeluarkan / di-logout jarak jauh
    const revoked = await isSessionRevoked(token);
    if (revoked) {
      const revokedRes = NextResponse.json(
        { success: false, error: 'Perangkat ini telah dikeluarkan dari sistem. Silakan login kembali.', revoked: true },
        { status: 401 }
      );
      revokedRes.cookies.delete('giziflow_session');
      return revokedRes;
    }

    // Anti-spam heartbeat: perbarui lastActiveAt hanya jika sudah lewat > 3 menit
    await touchSession(token);

    let userToReturn = sessionUser;
    try {
      const dbUser = await prisma.adminUser.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, username: true, name: true, role: true },
      });
      if (dbUser) userToReturn = { ...dbUser, role: dbUser.role as UserRole };
    } catch { /* DB unreachable */ }

    const response = NextResponse.json({ success: true, user: userToReturn });
    const freshToken = await setSessionCookie(response, userToReturn);
    return NextResponse.json({ success: true, user: userToReturn, token: freshToken }, {
      headers: response.headers,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
