import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperadmin } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const sppgUnitId = searchParams.get('sppgUnitId');

    const where: any = {};
    if (sppgUnitId && sppgUnitId !== 'ALL') {
      where.sppgUnitId = sppgUnitId;
    }

    const allocations = await prisma.budgetAllocation.findMany({
      where,
      include: {
        sppgUnit: true,
      },
      orderBy: {
        allocatedDate: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: allocations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const { sppgUnitId, fiscalPeriod, amountAllocated, notes } = body;

    if (!sppgUnitId || !fiscalPeriod || !amountAllocated) {
      return NextResponse.json(
        { success: false, error: 'Unit SPPG, Periode Fiskal, dan Nominal Anggaran wajib diisi!' },
        { status: 400 }
      );
    }

    const amount = Number(amountAllocated);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Nominal Anggaran harus berupa angka lebih dari 0!' },
        { status: 400 }
      );
    }

    // Create the allocation
    const newAllocation = await prisma.budgetAllocation.create({
      data: {
        sppgUnitId,
        fiscalPeriod: fiscalPeriod.trim(),
        amountAllocated: amount,
        amountRealized: 0,
        remainingBudget: amount,
        notes: notes?.trim() || 'Alokasi Pagu Kas Operasional SPPG',
      },
      include: {
        sppgUnit: true,
      },
    });

    // Update activeBudget on the target SPPG Unit
    await prisma.sppgUnit.update({
      where: { id: sppgUnitId },
      data: {
        activeBudget: {
          increment: amount,
        },
        totalRemaining: {
          increment: amount,
        },
      },
    });

    return NextResponse.json(
      { success: true, data: newAllocation, message: 'Alokasi dana kas masuk berhasil dicatat!' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
