import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MovementType } from '@prisma/client';
import { parseSessionToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sppgUnitId = searchParams.get('sppgUnitId');

    const where: any = {};
    if (sppgUnitId && sppgUnitId !== 'ALL') {
      where.sppgUnitId = sppgUnitId;
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        sppgUnit: true,
        ingredient: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 100,
    });

    return NextResponse.json({ success: true, data: movements });
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
        { success: false, error: 'Hanya Superadmin yang berhak mencatat mutasi stok bahan!' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      sppgUnitId,
      ingredientId,
      type,
      quantity,
      unit,
      referenceNumber,
      purpose,
      recordedBy,
    } = body;

    const qty = Number(quantity);
    if (!sppgUnitId || !ingredientId || !qty || qty <= 0) {
      return NextResponse.json(
        { success: false, error: 'Data mutasi tidak lengkap atau kuantitas tidak valid!' },
        { status: 400 }
      );
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      return NextResponse.json({ success: false, error: 'Bahan makanan tidak ditemukan!' }, { status: 404 });
    }

    let currentStock = Number(ingredient.currentStock);
    let newStock = currentStock;

    if (type === 'MASUK') {
      newStock += qty;
    } else {
      newStock = Math.max(0, currentStock - qty);
    }

    // Update ingredient stock in database
    await prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        currentStock: newStock,
      },
    });

    // Create the ledger entry
    const movement = await prisma.stockMovement.create({
      data: {
        sppgUnitId,
        ingredientId,
        type: type === 'MASUK' ? MovementType.MASUK : MovementType.KELUAR,
        quantity: qty,
        unit: unit || ingredient.defaultUnit,
        referenceNumber: referenceNumber || `MUTASI-${Date.now().toString().slice(-6)}`,
        purpose: purpose || 'Pemakaian Masak Harian Dapur',
        recordedBy: recordedBy || session.name,
        remainingStockAfter: newStock,
      },
      include: {
        sppgUnit: true,
        ingredient: true,
      },
    });

    return NextResponse.json(
      { success: true, data: movement, message: 'Mutasi stok bahan berhasil disimpan!' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
