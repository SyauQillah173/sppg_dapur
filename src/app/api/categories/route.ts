import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseSessionToken } from '@/lib/auth';

export async function GET() {
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
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('giziflow_session')?.value;
    const session = token ? parseSessionToken(token) : null;

    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, error: 'Hanya Superadmin yang berhak menambah Kategori Bahan!' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, code, color, description } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Nama Kategori wajib diisi!' }, { status: 400 });
    }

    const count = await prisma.ingredientCategory.count();
    const catCode = code?.trim() || `CAT-${(count + 1).toString().padStart(2, '0')}`;

    const newCategory = await prisma.ingredientCategory.create({
      data: {
        code: catCode,
        name: name.trim(),
        color: color || '#0284c7',
        description: description?.trim() || 'Kategori nutrisi bahan dapur SPPG',
      },
    });

    return NextResponse.json({ success: true, data: newCategory, message: 'Kategori berhasil ditambahkan!' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('giziflow_session')?.value;
    const session = token ? parseSessionToken(token) : null;

    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, error: 'Hanya Superadmin yang berhak menghapus Kategori Bahan!' },
        { status: 403 }
      );
    }

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
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
