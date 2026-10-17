import { createHash } from 'crypto';
import prisma from './prisma';
import { parseUserAgent } from './device-parser';

export interface UserSessionDto {
  id: string;
  userId: string;
  deviceType: 'Mobile' | 'Tablet' | 'Desktop';
  deviceName: string;
  browserName: string;
  osName: string;
  ipAddress: string;
  location?: string | null;
  isActive: boolean;
  isCurrent: boolean;
  lastActiveAt: string;
  createdAt: string;
  revokedAt?: string | null;
  revokedBy?: string | null;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Daftarkan sesi baru saat login atau perbarui informasi perangkat.
 * Dilengkapi proteksi anti-spam: tidak membuat duplikat baris baru pada perangkat yang sama.
 */
export async function createOrUpdateSession(
  userId: string,
  token: string,
  req: { headers: { get: (name: string) => string | null } }
): Promise<void> {
  try {
    const tokenHash = hashToken(token);
    const uaString = req.headers.get('user-agent');
    const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    const { deviceType, deviceName, browserName, osName, ipAddress } = parseUserAgent(uaString, forwarded);

    // Casting ke any untuk kompatibilitas Proxy Prisma Client
    const db = prisma as any;

    const existing = await db.userSession.findUnique({
      where: { tokenHash },
    });

    if (existing) {
      await db.userSession.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          revokedAt: null,
          revokedBy: null,
          lastActiveAt: new Date(),
          ipAddress,
          deviceName,
          browserName,
          osName,
        },
      });
    } else {
      await db.userSession.create({
        data: {
          userId,
          tokenHash,
          deviceType,
          deviceName,
          browserName,
          osName,
          ipAddress,
          location: 'Indonesia',
          userAgent: (uaString || '').slice(0, 500),
          isActive: true,
          lastActiveAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Gagal mencatat sesi login device:', error);
  }
}

/**
 * Anti-Spam Heartbeat: Perbarui waktu aktif terakhir hanya jika sudah lewat > 3 menit.
 * Ini mencegah ratusan request per menit membebani database PostgreSQL.
 */
export async function touchSession(token: string): Promise<void> {
  try {
    const tokenHash = hashToken(token);
    const db = prisma as any;

    const session = await db.userSession.findUnique({
      where: { tokenHash },
      select: { id: true, lastActiveAt: true, isActive: true },
    });

    if (!session || !session.isActive) return;

    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    if (new Date(session.lastActiveAt) < threeMinutesAgo) {
      await db.userSession.update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() },
      });
    }
  } catch {
    // Abaikan kegagalan minor pada background heartbeat
  }
}

/**
 * Periksa apakah token sesi telah dicabut / di-logout secara jarak jauh.
 */
export async function isSessionRevoked(token: string): Promise<boolean> {
  try {
    const tokenHash = hashToken(token);
    const db = prisma as any;

    const session = await db.userSession.findUnique({
      where: { tokenHash },
      select: { isActive: true, revokedAt: true },
    });

    // Jika record sesi ada dan isActive = false, berarti sesi telah di-logout
    if (session && (!session.isActive || session.revokedAt !== null)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Logout perangkat saat user sengaja menekan tombol "Logout" di perangkatnya sendiri.
 * Statusnya otomatis menjadi riwayat (isActive: false, revokedBy: 'USER_SELF').
 */
export async function revokeCurrentSession(token: string): Promise<void> {
  try {
    const tokenHash = hashToken(token);
    const db = prisma as any;

    await db.userSession.updateMany({
      where: { tokenHash, isActive: true },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedBy: 'USER_SELF',
      },
    });
  } catch (e) {
    console.error('Gagal logout sesi sendiri:', e);
  }
}

/**
 * Logout perangkat tertentu secara jarak jauh (Remote Logout / Kick Device).
 */
export async function revokeSessionById(
  sessionId: string,
  userId: string,
  isSuperadmin = false
): Promise<boolean> {
  try {
    const db = prisma as any;
    const session = await db.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) return false;
    if (session.userId !== userId && !isSuperadmin) return false;

    await db.userSession.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedBy: 'REMOTE_LOGOUT',
      },
    });

    return true;
  } catch (e) {
    console.error('Gagal remote logout sesi:', e);
    return false;
  }
}

/**
 * Logout semua perangkat lain selain perangkat yang sedang digunakan saat ini.
 */
export async function revokeAllOtherSessions(userId: string, currentToken: string): Promise<number> {
  try {
    const currentTokenHash = hashToken(currentToken);
    const db = prisma as any;

    const result = await db.userSession.updateMany({
      where: {
        userId,
        isActive: true,
        tokenHash: { not: currentTokenHash },
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedBy: 'REMOTE_LOGOUT',
      },
    });

    return result.count;
  } catch (e) {
    console.error('Gagal logout perangkat lain:', e);
    return 0;
  }
}

/**
 * Hapus riwayat sesi yang sudah tidak aktif (hanya yang sudah logout).
 */
export async function deleteInactiveSession(
  sessionId: string,
  userId: string,
  isSuperadmin = false
): Promise<boolean> {
  try {
    const db = prisma as any;
    const session = await db.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) return false;
    if (session.userId !== userId && !isSuperadmin) return false;
    // Hanya boleh menghapus riwayat yang sudah non-aktif
    if (session.isActive) return false;

    await db.userSession.delete({
      where: { id: sessionId },
    });

    return true;
  } catch (e) {
    console.error('Gagal menghapus riwayat sesi:', e);
    return false;
  }
}

/**
 * Bersihkan semua riwayat sesi yang sudah nonaktif untuk pengguna tertentu.
 */
export async function clearAllInactiveSessions(userId: string): Promise<number> {
  try {
    const db = prisma as any;
    const result = await db.userSession.deleteMany({
      where: {
        userId,
        isActive: false,
      },
    });
    return result.count;
  } catch (e) {
    console.error('Gagal membersihkan riwayat nonaktif:', e);
    return 0;
  }
}

/**
 * Ambil daftar semua riwayat login & sesi perangkat untuk pengguna saat ini.
 */
export async function getUserSessionsList(
  userId: string,
  currentToken?: string
): Promise<UserSessionDto[]> {
  try {
    const db = prisma as any;
    const currentTokenHash = currentToken ? hashToken(currentToken) : null;

    const sessions = await db.userSession.findMany({
      where: { userId },
      orderBy: [{ isActive: 'desc' }, { lastActiveAt: 'desc' }],
      take: 50, // Batasi riwayat maksimal 50 agar tidak berat
    });

    return sessions.map((s: any) => ({
      id: s.id,
      userId: s.userId,
      deviceType: s.deviceType as 'Mobile' | 'Tablet' | 'Desktop',
      deviceName: s.deviceName,
      browserName: s.browserName,
      osName: s.osName,
      ipAddress: s.ipAddress,
      location: s.location || 'Indonesia',
      isActive: s.isActive,
      isCurrent: currentTokenHash ? s.tokenHash === currentTokenHash : false,
      lastActiveAt: s.lastActiveAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      revokedAt: s.revokedAt ? s.revokedAt.toISOString() : null,
      revokedBy: s.revokedBy,
    }));
  } catch (e) {
    console.error('Gagal mengambil daftar sesi:', e);
    return [];
  }
}
