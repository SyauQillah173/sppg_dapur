import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createWithCode, normalizeName } from '@/lib/master-helpers';
import { requireAuth, requireSuperadmin, parseSessionToken } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/safe-error';


export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const categories = await prisma.ingredientCategory.findMany({
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: { ingredients: true },
        },
      },
    });
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {

    const body = await req.json();
    const { name, code, color, description } = body;

    const cleanName = normalizeName(name);
    if (cleanName.length < 3) {
      return NextResponse.json({ success: false, error: 'Nama Kategori minimal 3 karakter.' }, { status: 400 });
    }

    // Anti duplikat: nama kategori yang sudah ada dikembalikan apa adanya.
    const existing = await prisma.ingredientCategory.findFirst({
      where: { name: { equals: cleanName, mode: 'insensitive' } },
    });
    if (existing) {
      return NextResponse.json({ success: true, data: existing, duplicate: true, message: 'Kategori sudah ada.' });
    }

    const codes = (await prisma.ingredientCategory.findMany({ select: { code: true } })).map((c) => c.code);
    const newCategory = await createWithCode(
      (generated) =>
        prisma.ingredientCategory.create({
          data: {
            code: normalizeName(code) || generated,
            name: cleanName,
            color: color || '#0284c7',
            description: normalizeName(description) || 'Kategori nutrisi bahan dapur SPPG',
          },
        }),
      'CAT-',
      codes,
      2
    );

    return NextResponse.json({ success: true, data: newCategory, message: 'Kategori berhasil ditambahkan!' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID Kategori wajib dicantumkan!' }, { status: 400 });
    }

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
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}
