import { NextRequest, NextResponse } from 'next/server';
import { parseSessionToken, setSessionCookie } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = body?.token || req.cookies.get('giziflow_session')?.value;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ success: false, error: 'Token sesi tidak ditemukan.' }, { status: 401 });
    }

    const sessionUser = await parseSessionToken(token);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Token sesi telah kadaluwarsa (lebih dari 30 hari) atau tidak valid.' }, { status: 401 });
    }

    let userToReturn = sessionUser;
    try {
      const dbUser = await prisma.adminUser.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, username: true, name: true, role: true },
      });
      if (dbUser) userToReturn = { ...dbUser, role: dbUser.role as UserRole };
    } catch {
      // offline / DB unreachable, fallback to verified token payload
    }

    const res = NextResponse.json({
      success: true,
      user: userToReturn,
      message: 'Sesi login berhasil dipulihkan secara otomatis.',
    });

    // Re-issue cookie with 30-day rolling expiration
    await setSessionCookie(res, userToReturn);
    return res;
  } catch (error: unknown) {
    console.error('Session restore error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
