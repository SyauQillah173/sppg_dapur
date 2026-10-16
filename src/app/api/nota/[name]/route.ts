import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { readFile } from 'fs/promises';
import path from 'path';
import { NOTA_DIR, notaMime, safeNotaName } from '@/lib/nota-storage';

/** Sajikan foto nota ke user yang sudah login (nota tidak boleh publik). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  const { name } = await params;
  const safe = safeNotaName(name);
  if (!safe) return NextResponse.json({ success: false, error: 'Nama file tidak valid.' }, { status: 400 });

  try {
    const file = await readFile(path.join(NOTA_DIR, safe));
    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': notaMime(safe),
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Foto tidak ditemukan.' }, { status: 404 });
  }
}
