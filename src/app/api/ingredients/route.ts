import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperadmin } from '@/lib/api-auth';
import { createWithCode, normalizeName } from '@/lib/master-helpers';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const ingredients = await prisma.ingredient.findMany({
      include: {
        category: true,
      },
      orderBy: {
        code: 'asc',
      },
    });

    return NextResponse.json({ success: true, data: ingredients });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const name = normalizeName(body.name);
    const categoryId = String(body.categoryId || '').trim();

    if (name.length < 2) {
      return NextResponse.json({ success: false, error: 'Nama bahan minimal 2 karakter.' }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ success: false, error: 'Kategori bahan wajib dipilih.' }, { status: 400 });
    }
    const category = await prisma.ingredientCategory.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ success: false, error: 'Kategori bahan tidak ditemukan.' }, { status: 400 });
    }

    // Anti duplikat: nama yang sudah ada dikembalikan, bukan dibuat baris baru.
    const existing = await prisma.ingredient.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      return NextResponse.json({ success: true, data: existing, duplicate: true, message: 'Bahan sudah terdaftar.' });
    }

    const codes = (await prisma.ingredient.findMany({ select: { code: true } })).map((i) => i.code);
    const newIngredient = await createWithCode(
      (code) =>
        prisma.ingredient.create({
          data: {
            code,
            name,
            categoryId,
            defaultUnit: body.defaultUnit || 'Kg',
            currentStock: Number(body.currentStock) || 0,
            minStockAlert: Number(body.minStockAlert) || 5,
            lastPurchasePrice: Number(body.lastPurchasePrice) || 0,
            sppgDistribution: body.sppgDistribution || {},
          },
        }),
      'ING-',
      codes,
      3
    );

    return NextResponse.json({ success: true, data: newIngredient, message: 'Bahan berhasil ditambahkan.' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
