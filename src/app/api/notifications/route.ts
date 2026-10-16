import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const since = searchParams.get('since');
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20));

    const whereClause: any = {};
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        whereClause.createdAt = { gt: sinceDate };
      }
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.systemNotification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.systemNotification.count({
        where: { isRead: false },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          actorName: n.actorName,
          amount: n.amount ? Number(n.amount) : null,
          unitName: n.unitName,
          referenceId: n.referenceId,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
        })),
        unreadCount,
        serverTime: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { action, id } = body;

    if (action === 'MARK_ALL_READ') {
      await prisma.systemNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'Semua notifikasi ditandai dibaca.' });
    }

    if (action === 'MARK_READ' && id) {
      await prisma.systemNotification.update({
        where: { id },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'Notifikasi ditandai dibaca.' });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak dikenal.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
