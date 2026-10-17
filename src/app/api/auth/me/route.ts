import { NextRequest, NextResponse } from 'next/server';
import { parseSessionToken, setSessionCookie } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('giziflow_session')?.value;
    if (!token) return NextResponse.json({ success: false, user: null }, { status: 401 });
    const sessionUser = await parseSessionToken(token);
    if (!sessionUser) return NextResponse.json({ success: false, user: null }, { status: 401 });
    let userToReturn = sessionUser;
    try {
      const dbUser = await prisma.adminUser.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, username: true, name: true, role: true },
      });
      if (dbUser) userToReturn = { ...dbUser, role: dbUser.role as UserRole };
    } catch { /* DB unreachable */ }

    const response = NextResponse.json({ success: true, user: userToReturn });
    // Rolling session: setiap kali user membuka aplikasi, perpanjang masa aktif 30 hari ke depan
    await setSessionCookie(response, userToReturn);
    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
