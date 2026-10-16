import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperadmin, parseSessionToken } from '@/lib/api-auth';
import { normalizeName } from '@/lib/master-helpers';

/** Ubah data kategori bahan. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('giziflow_session')?.value;
    const session = token ? await parseSessionToken(token) : null;

    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, error: 'Hanya Superadmin yang berhak mengubah Kategori Bahan!' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.ingredientCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Kategori tidak ditemukan.' }, { status: 404 });
    }

    const updateData: any = {};
    let newName: string | undefined;

    if (body.name !== undefined) {
      const cleanName = normalizeName(body.name);
      if (cleanName.length < 2) {
        return NextResponse.json({ success: false, error: 'Nama Kategori minimal 2 karakter.' }, { status: 400 });
      }
      const duplicate = await prisma.ingredientCategory.findFirst({
        where: { name: { equals: cleanName, mode: 'insensitive' }, NOT: { id } },
      });
      if (duplicate) {
        return NextResponse.json({ success: false, error: `Kategori "${cleanName}" sudah terdaftar.` }, { status: 400 });
      }
      updateData.name = cleanName;
      newName = cleanName;
    }

    if (body.code !== undefined) updateData.code = normalizeName(body.code);
    if (body.color !== undefined) updateData.color = body.color;
    if (body.description !== undefined) updateData.description = normalizeName(body.description);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada perubahan yang dikirim.' }, { status: 400 });
    }

    const updated = await prisma.ingredientCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated, message: 'Kategori berhasil diperbarui!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export const PUT = PATCH;

/** Hapus kategori bahan. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('giziflow_session')?.value;
    const session = token ? await parseSessionToken(token) : null;

    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, error: 'Hanya Superadmin yang berhak menghapus Kategori Bahan!' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const linkedIngredients = await prisma.ingredient.count({
      where: { categoryId: id },
    });

    if (linkedIngredients > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Kategori tidak dapat dihapus karena masih digunakan oleh ${linkedIngredients} bahan makanan!`,
        },
        { status: 400 }
      );
    }

    await prisma.ingredientCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Kategori berhasil dihapus!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
