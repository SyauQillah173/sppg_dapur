import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSessionToken } from '@/lib/auth';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { hashPassword, isLegacyPassword, verifyPassword } from '@/lib/password';
import { createOrUpdateSession } from '@/lib/session-manager';
import { sanitizeText } from '@/lib/sanitize';

// Dummy scrypt hash untuk timing attack protection
const DUMMY_HASH = 'scrypt$0123456789abcdef0123456789abcdef$0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const rlHeaders = getRateLimitHeaders(ip, 5, 60_000);
  if (!checkRateLimit(ip, 5, 60_000)) {
    return NextResponse.json(
      { success: false, error: 'Terlalu banyak percobaan login. Harap tunggu 1 menit demi keamanan sistem.' },
      { status: 429, headers: rlHeaders }
    );
  }

  try {
    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ success: false, error: 'Request tidak valid.' }, { status: 400 });
    }
    const { username, password } = body as Record<string, unknown>;
    if (
      typeof username !== 'string' || typeof password !== 'string' ||
      !username.trim() || !password || username.length > 64 || password.length > 128
    ) {
      return NextResponse.json({ success: false, error: 'Username dan Password wajib diisi.' }, { status: 400 });
    }

    const cleanUsername = sanitizeText(username).toLowerCase();
    if (!checkRateLimit('user:' + cleanUsername, 5, 60_000)) {
      return NextResponse.json(
        { success: false, error: 'Akun ini sementara dikunci karena terlalu banyak percobaan. Harap tunggu 1 menit.' },
        { status: 429 }
      );
    }

    let user = null;
    try {
      user = await prisma.adminUser.findUnique({ where: { username: cleanUsername } });
    } catch (dbErr) {
      console.error('DB error:', dbErr);
      return NextResponse.json({ success: false, error: 'Gangguan koneksi database.' }, { status: 503 });
    }

    // Proteksi Timing Attack: jika user tidak ada, lakukan kalkulasi verifikasi dummy
    // agar waktu respon identik dan hacker tidak bisa menebak username yang valid
    if (!user) {
      verifyPassword(password, DUMMY_HASH);
      return NextResponse.json({ success: false, error: 'Username atau Password salah.' }, { status: 401 });
    }

    if (!verifyPassword(password, user.password)) {
      return NextResponse.json({ success: false, error: 'Username atau Password salah.' }, { status: 401 });
    }

    // Password lama (masih plaintext) langsung di-upgrade ke scrypt setelah login berhasil
    if (isLegacyPassword(user.password)) {
      try {
        await prisma.adminUser.update({
          where: { id: user.id },
          data: { password: hashPassword(password) },
        });
      } catch (e) {
        console.error('Gagal upgrade hash password:', e);
      }
    }

    const sessionUser = { id: user.id, username: user.username, name: user.name, role: user.role as any };
    const token = await createSessionToken(sessionUser);

    // Catat / Perbarui sesi perangkat login (Riwayat Device + Anti-Spam)
    await createOrUpdateSession(user.id, token, req);

    const response = NextResponse.json({
      success: true,
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
      message: 'Login berhasil.',
    });

    response.cookies.set('giziflow_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 hari
    });

    return response;
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
