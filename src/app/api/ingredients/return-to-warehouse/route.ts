import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/safe-error';

export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { ingredientIds, returnAll } = body;

    const emptyDist = { 'SPPG-AA02': 0, 'SPPG-BS02': 0, 'SPPG-DR01': 0, 'SPPG-SM01': 0 };

    let targetIngredients;
    if (returnAll) {
      targetIngredients = await prisma.ingredient.findMany();
    } else if (Array.isArray(ingredientIds) && ingredientIds.length > 0) {
      targetIngredients = await prisma.ingredient.findMany({
        where: { id: { in: ingredientIds } },
      });
    } else {
      return NextResponse.json({ success: false, error: 'Tidak ada bahan yang dipilih untuk ditarik.' }, { status: 400 });
    }

    if (targetIngredients.length === 0) {
      return NextResponse.json({ success: true, message: 'Tidak ada bahan yang perlu ditarik.', count: 0 });
    }

    // For each ingredient, ensure currentStock has adequate headroom so gudangStock = currentStock - 0 increases accurately
    const updates = targetIngredients.map((ing) => {
      const dist = (ing.sppgDistribution as Record<string, number>) || {};
      const totalAllocated = Object.values(dist).reduce((a, b) => a + (Number(b) || 0), 0);
      const currentStockNum = Number(ing.currentStock) || 0;
      const safeStock = Math.max(currentStockNum, totalAllocated);

      return prisma.ingredient.update({
        where: { id: ing.id },
        data: {
          currentStock: safeStock,
          sppgDistribution: emptyDist,
        },
      });
    });

    await prisma.$transaction(updates);

    return NextResponse.json({
      success: true,
      message: `${targetIngredients.length} bahan berhasil ditarik kembali ke Gudang Sementara.`,
      count: targetIngredients.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error, 'Gagal memproses penarikan bahan.') }, { status: 500 });
  }
}
