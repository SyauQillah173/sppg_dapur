import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperadmin, parseSessionToken } from '@/lib/api-auth';
import { UserRole } from '@prisma/client';
import { hashPassword } from '@/lib/password';
import { sanitizeText } from '@/lib/sanitize';
import { safeErrorMessage } from '@/lib/safe-error';


export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('giziflow_session')?.value;
    const session = token ? await parseSessionToken(token) : null;

    if (!session) {
      return NextResponse.json({ success: false, error: 'Silakan login terlebih dahulu' }, { status: 401 });
    }

    const users = await prisma.adminUser.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('giziflow_session')?.value;
    const session = token ? await parseSessionToken(token) : null;

    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, error: 'Hanya Superadmin yang berhak menambah akun admin baru!' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { username, password, name, role } = body;

    if (!username || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Username, Password, dan Nama Lengkap wajib diisi!' },
        { status: 400 }
      );
    }

    const cleanUsername = sanitizeText(username).toLowerCase();
    const cleanName = sanitizeText(name);
    if (cleanUsername.length < 3 || cleanUsername.length > 64) {
      return NextResponse.json({ success: false, error: 'Username harus 3-64 karakter.' }, { status: 400 });
    }
    if (String(password).length < 8) {
      return NextResponse.json({ success: false, error: 'Password minimal 8 karakter.' }, { status: 400 });
    }

    const existing = await prisma.adminUser.findUnique({
      where: { username: cleanUsername },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Username "${cleanUsername}" sudah digunakan! Silakan gunakan username lain.` },
        { status: 400 }
      );
    }

    const newUser = await prisma.adminUser.create({
      data: {
        username: cleanUsername,
        password: hashPassword(String(password)),
        name: String(name).trim(),
        role:
          role === 'SUPERADMIN'
            ? UserRole.SUPERADMIN
            : role === 'DISTRIBUTION_DRIVER'
            ? UserRole.DISTRIBUTION_DRIVER
            : UserRole.EXECUTIVE_AUDITOR,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: newUser, message: 'Akun admin berhasil dibuat!' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}
