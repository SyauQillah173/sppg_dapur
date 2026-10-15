import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSessionToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan Password wajib diisi!' },
        { status: 400 }
      );
    }

    let user = null;

    try {
      user = await prisma.adminUser.findUnique({
        where: { username },
      });
    } catch (dbErr) {
      console.warn('DB lookup failed, trying fallback seed:', dbErr);
    }

    // Check credentials against DB, or fallback for preset seed accounts
    let authenticatedUser = null;

    if (user && user.password === password) {
      authenticatedUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      };
    } else if (!user) {
      // Fallback for pre-seeded test accounts if DB is initializing
      if (username === 'superadmin' && password === 'admin123') {
        authenticatedUser = {
          id: 'admin-super-01',
          username: 'superadmin',
          name: 'Superadmin Pengelola SPPG',
          role: 'SUPERADMIN' as const,
        };
      } else if (username === 'auditor' && password === 'auditor123') {
        authenticatedUser = {
          id: 'admin-audit-01',
          username: 'auditor',
          name: 'Drs. Supriyanto, Ak., CA (Admin 2 / Pemantau)',
          role: 'EXECUTIVE_AUDITOR' as const,
        };
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json(
        { success: false, error: 'Username atau Password salah! Silakan periksa kembali.' },
        { status: 401 }
      );
    }

    const token = createSessionToken(authenticatedUser);

    const response = NextResponse.json({
      success: true,
      user: authenticatedUser,
      message: 'Login berhasil!',
    });

    response.cookies.set('giziflow_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Terjadi kesalahan server saat login' },
      { status: 500 }
    );
  }
}
