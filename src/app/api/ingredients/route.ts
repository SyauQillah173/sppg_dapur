import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

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
  try {
    const body = await req.json();
    const { name, categoryId, defaultUnit, currentStock, minStockAlert, lastPurchasePrice, sppgDistribution } = body;

    const count = await prisma.ingredient.count();
    const code = `ING-${(count + 1).toString().padStart(3, '0')}`;

    const newIngredient = await prisma.ingredient.create({
      data: {
        code,
        name,
        categoryId,
        defaultUnit: defaultUnit || 'Kg',
        currentStock: Number(currentStock) || 0,
        minStockAlert: Number(minStockAlert) || 5,
        lastPurchasePrice: Number(lastPurchasePrice) || 0,
        sppgDistribution: sppgDistribution || {},
      },
    });

    return NextResponse.json({ success: true, data: newIngredient }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
