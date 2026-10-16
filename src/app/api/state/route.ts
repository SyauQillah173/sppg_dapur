import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperadmin } from '@/lib/api-auth';

const SINGLETON_ID = 'singleton';

/** Semua perangkat baca state yang sama dari DB — bukan localStorage per-browser. */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const row = await prisma.appState.findUnique({ where: { id: SINGLETON_ID } });
    return NextResponse.json({ success: true, state: row?.payload ?? null, updatedAt: row?.updatedAt ?? null });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const state = body?.state;
    if (!state || typeof state !== 'object') {
      return NextResponse.json({ success: false, error: 'Payload state tidak valid.' }, { status: 400 });
    }

    const row = await prisma.appState.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, payload: state },
      update: { payload: state },
    });

    return NextResponse.json({ success: true, updatedAt: row.updatedAt });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
