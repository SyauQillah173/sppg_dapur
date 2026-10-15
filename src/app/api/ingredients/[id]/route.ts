import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        name: body.name,
        categoryId: body.categoryId,
        defaultUnit: body.defaultUnit,
        currentStock: body.currentStock !== undefined ? Number(body.currentStock) : undefined,
        minStockAlert: body.minStockAlert !== undefined ? Number(body.minStockAlert) : undefined,
        lastPurchasePrice: body.lastPurchasePrice !== undefined ? Number(body.lastPurchasePrice) : undefined,
        sppgDistribution: body.sppgDistribution,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.ingredient.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: 'Bahan berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
