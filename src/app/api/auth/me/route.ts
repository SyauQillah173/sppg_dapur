import { NextRequest, NextResponse } from 'next/server';
import { parseSessionToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('giziflow_session')?.value;
    if (!token) return NextResponse.json({ success: false, user: null }, { status: 401 });
    const sessionUser = await parseSessionToken(token);
    if (!sessionUser) return NextResponse.json({ success: false, user: null }, { status: 401 });
    try {
      const dbUser = await prisma.adminUser.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, username: true, name: true, role: true },
      });
      if (dbUser) return NextResponse.json({ success: true, user: dbUser });
    } catch { /* DB unreachable */ }
    return NextResponse.json({ success: true, user: sessionUser });
  } catch {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
