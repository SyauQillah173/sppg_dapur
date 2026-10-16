import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/api-auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { NOTA_DIR, NOTA_URL_PREFIX } from '@/lib/nota-storage';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * Simpan foto nota di disk server, di luar public/ (file yang masuk public/ setelah
 * build tidak disajikan oleh `next start`). URL blob: juga tidak ikut tersinkron.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'File tidak ditemukan.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'Ukuran foto maksimal 8 MB.' }, { status: 400 });
    }
    if (file.type && !ALLOWED.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Format foto harus JPG, PNG, WEBP, atau HEIC.' }, { status: 400 });
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
    const name = `nota-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const dir = NOTA_DIR;
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ success: true, url: `${NOTA_URL_PREFIX}${name}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
