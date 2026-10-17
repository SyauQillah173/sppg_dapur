import { NextRequest, NextResponse } from 'next/server';
import { parseSessionToken } from '@/lib/auth';
import {
  getUserSessionsList,
  revokeSessionById,
  revokeAllOtherSessions,
  deleteInactiveSession,
  clearAllInactiveSessions,
} from '@/lib/session-manager';

/**
 * GET /api/auth/sessions
 * Mengambil riwayat perangkat login dan sesi aktif pengguna
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('giziflow_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Akses ditolak. Sesi tidak ditemukan.' }, { status: 401 });
    }

    const sessionUser = await parseSessionToken(token);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Sesi tidak valid.' }, { status: 401 });
    }

    const sessions = await getUserSessionsList(sessionUser.id, token);
    const activeCount = sessions.filter((s) => s.isActive).length;
    const inactiveCount = sessions.filter((s) => !s.isActive).length;

    return NextResponse.json({
      success: true,
      sessions,
      summary: {
        total: sessions.length,
        activeCount,
        inactiveCount,
      },
    });
  } catch (error) {
    console.error('API Sessions GET error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

/**
 * POST /api/auth/sessions/revoke (atau action via body)
 * Melakukan logout jarak jauh pada perangkat tertentu atau semua perangkat lain
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('giziflow_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 401 });
    }

    const sessionUser = await parseSessionToken(token);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Sesi tidak valid.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, sessionId } = body as { action?: string; sessionId?: string };

    const isSuperadmin = sessionUser.role === 'SUPERADMIN';

    if (action === 'revoke-all-others') {
      const count = await revokeAllOtherSessions(sessionUser.id, token);
      return NextResponse.json({
        success: true,
        message: `${count} perangkat lain berhasil dikeluarkan dari sistem.`,
        revokedCount: count,
      });
    }

    if (action === 'revoke' && sessionId) {
      const ok = await revokeSessionById(sessionId, sessionUser.id, isSuperadmin);
      if (!ok) {
        return NextResponse.json(
          { success: false, error: 'Perangkat tidak ditemukan atau Anda tidak memiliki akses.' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Perangkat berhasil dikeluarkan dari sistem.',
      });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak valid.' }, { status: 400 });
  } catch (error) {
    console.error('API Sessions POST error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/sessions
 * Menghapus riwayat login yang sudah tidak aktif
 */
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('giziflow_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 401 });
    }

    const sessionUser = await parseSessionToken(token);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Sesi tidak valid.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    const isSuperadmin = sessionUser.role === 'SUPERADMIN';

    if (clearAll) {
      const count = await clearAllInactiveSessions(sessionUser.id);
      return NextResponse.json({
        success: true,
        message: `${count} riwayat sesi nonaktif berhasil dibersihkan.`,
        deletedCount: count,
      });
    }

    if (sessionId) {
      const ok = await deleteInactiveSession(sessionId, sessionUser.id, isSuperadmin);
      if (!ok) {
        return NextResponse.json(
          { success: false, error: 'Riwayat tidak ditemukan atau perangkat masih aktif.' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Riwayat sesi berhasil dihapus.',
      });
    }

    return NextResponse.json({ success: false, error: 'Parameter id atau clearAll diperlukan.' }, { status: 400 });
  } catch (error) {
    console.error('API Sessions DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
