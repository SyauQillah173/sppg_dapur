import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/api-auth';
import { normalizeName } from '@/lib/master-helpers';
import { safeErrorMessage } from '@/lib/safe-error';

/** Ubah data karyawan. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Karyawan tidak ditemukan.' }, { status: 404 });
    }

    const data: any = {};
    if (body.name !== undefined) {
      const name = normalizeName(body.name);
      if (name.length < 3) {
        return NextResponse.json({ success: false, error: 'Nama karyawan minimal 3 karakter.' }, { status: 400 });
      }
      data.name = name;
    }
    if (body.roleTitle !== undefined) data.roleTitle = normalizeName(body.roleTitle);
    if (body.phone !== undefined) data.phone = normalizeName(body.phone);
    if (body.status !== undefined) data.status = body.status;
    if (body.complianceScore !== undefined) data.complianceScore = Number(body.complianceScore) || 100;

    if (body.sppgUnitId && body.sppgUnitId !== existing.sppgUnitId) {
      const unit = await prisma.sppgUnit.findUnique({ where: { id: body.sppgUnitId } });
      if (!unit) {
        return NextResponse.json({ success: false, error: 'Unit SPPG tujuan tidak ditemukan.' }, { status: 400 });
      }
      data.sppgUnitId = body.sppgUnitId;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada perubahan yang dikirim.' }, { status: 400 });
    }

    const updated = await prisma.employee.update({
      where: { id },
      data,
      include: { sppgUnit: { select: { name: true } } },
    });
    return NextResponse.json({ success: true, data: updated, message: 'Data karyawan diperbarui.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}

export const PUT = PATCH;

/** Hapus karyawan. Ditolak kalau sudah dipakai di nota belanja. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const used = await prisma.procurementOrder.count({ where: { requesterId: id } });
    if (used > 0) {
      return NextResponse.json(
        { success: false, error: `Karyawan tidak bisa dihapus: masih tercatat di ${used} nota belanja.` },
        { status: 400 }
      );
    }

    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Karyawan berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}
