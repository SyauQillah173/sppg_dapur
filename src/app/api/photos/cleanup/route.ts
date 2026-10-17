import { NextRequest, NextResponse } from 'next/server';
import { requireSuperadmin } from '@/lib/api-auth';
import { cleanupOrphanedPhotos } from '@/lib/nota-storage';

export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const result = await cleanupOrphanedPhotos();
    return NextResponse.json({
      success: true,
      message: `Berhasil membersihkan ${result.deletedCount} berkas foto yang tidak terpakai dari database.`,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
