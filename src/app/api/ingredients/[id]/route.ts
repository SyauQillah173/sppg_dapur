import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/api-auth';
import { normalizeName } from '@/lib/master-helpers';
import { safeErrorMessage } from '@/lib/safe-error';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Bahan tidak ditemukan.' }, { status: 404 });
    }

    const data: any = {};
    if (body.name !== undefined) {
      const name = normalizeName(body.name);
      if (name.length < 2) {
        return NextResponse.json({ success: false, error: 'Nama bahan minimal 2 karakter.' }, { status: 400 });
      }
      const taken = await prisma.ingredient.findFirst({
        where: { name: { equals: name, mode: 'insensitive' }, NOT: { id } },
      });
      if (taken) {
        return NextResponse.json({ success: false, error: `Bahan "${name}" sudah terdaftar.` }, { status: 400 });
      }
      data.name = name;
    }
    if (body.categoryId) data.categoryId = body.categoryId;
    if (body.defaultUnit) data.defaultUnit = body.defaultUnit;
    if (body.currentStock !== undefined) data.currentStock = Number(body.currentStock) || 0;
    if (body.minStockAlert !== undefined) data.minStockAlert = Number(body.minStockAlert) || 0;
    if (body.lastPurchasePrice !== undefined) data.lastPurchasePrice = Number(body.lastPurchasePrice) || 0;
    if (body.sppgDistribution !== undefined) data.sppgDistribution = body.sppgDistribution;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada perubahan yang dikirim.' }, { status: 400 });
    }

    const updated = await prisma.ingredient.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated, message: 'Data bahan diperbarui.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const used = await prisma.procurementItem.count({ where: { ingredientId: id } });
    if (used > 0) {
      return NextResponse.json(
        { success: false, error: `Bahan tidak bisa dihapus: masih dipakai di ${used} rincian nota belanja.` },
        { status: 400 }
      );
    }

    await prisma.ingredient.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Bahan berhasil dihapus.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}
