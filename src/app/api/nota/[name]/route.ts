import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import prisma from '@/lib/prisma';
import { safeNotaName } from '@/lib/nota-storage';
import { safeErrorMessage } from '@/lib/safe-error';

/** Sajikan foto nota ke user yang sudah login (nota tidak boleh publik). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  const { name } = await params;
  const safe = safeNotaName(name);
  if (!safe) return NextResponse.json({ success: false, error: 'Nama file tidak valid.' }, { status: 400 });

  try {
    const row = await prisma.notaPhoto.findUnique({ where: { name: safe } });
    if (!row) {
      return NextResponse.json({ success: false, error: 'Foto tidak ditemukan.' }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(row.data), {
      headers: {
        'Content-Type': row.mime || 'image/jpeg',
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}
