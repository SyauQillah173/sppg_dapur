import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/api-auth';
import { normalizeName } from '@/lib/master-helpers';
import { safeErrorMessage } from '@/lib/safe-error';

/** Ubah data supplier (nama, kontak, rekening, kategori). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Supplier tidak ditemukan.' }, { status: 404 });
    }

    const data: any = {};
    if (body.name !== undefined) {
      const name = normalizeName(body.name);
      if (name.length < 3) {
        return NextResponse.json({ success: false, error: 'Nama CV / Supplier minimal 3 karakter.' }, { status: 400 });
      }
      const taken = await prisma.supplier.findFirst({
        where: { name: { equals: name, mode: 'insensitive' }, NOT: { id } },
      });
      if (taken) {
        return NextResponse.json({ success: false, error: `Supplier "${name}" sudah terdaftar.` }, { status: 400 });
      }
      data.name = name;
    }
    if (body.picName !== undefined) data.picName = normalizeName(body.picName);
    if (body.phone !== undefined) data.phone = normalizeName(body.phone);
    if (body.address !== undefined) data.address = normalizeName(body.address);
    if (body.bankAccount !== undefined) data.bankAccount = normalizeName(body.bankAccount);
    if (body.suppliedCategory !== undefined) data.suppliedCategory = normalizeName(body.suppliedCategory);
    if (body.rating !== undefined) data.rating = Number(body.rating) || 5;
    if (body.activeStatus !== undefined) data.activeStatus = !!body.activeStatus;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada perubahan yang dikirim.' }, { status: 400 });
    }

    const updated = await prisma.supplier.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated, message: 'Data supplier diperbarui.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}

export const PUT = PATCH;

/** Hapus supplier. Ditolak kalau sudah dipakai di nota belanja. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const used = await prisma.procurementOrder.count({ where: { supplierId: id } });
    if (used > 0) {
      return NextResponse.json(
        { success: false, error: `Supplier tidak bisa dihapus: masih dipakai di ${used} nota belanja.` },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Supplier berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}
