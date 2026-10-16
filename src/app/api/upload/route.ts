import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/api-auth';
import prisma from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { NOTA_URL_PREFIX } from '@/lib/nota-storage';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * Foto nota masuk Postgres (bytea), bukan disk: FS serverless Vercel read-only dan
 * sementara, dan URL blob: cuma hidup di browser pengunggah.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  if (!checkRateLimit('upload:' + ip, 40, 60_000)) {
    return NextResponse.json({ success: false, error: 'Terlalu banyak upload. Coba lagi sebentar.' }, { status: 429 });
  }

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
    await prisma.notaPhoto.create({
      data: {
        name,
        mime: file.type || 'image/jpeg',
        data: Buffer.from(await file.arrayBuffer()),
      },
    });

    return NextResponse.json({ success: true, url: `${NOTA_URL_PREFIX}${name}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
