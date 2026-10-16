import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperadmin, parseSessionToken } from '@/lib/api-auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.cookies.get('giziflow_session')?.value;
    const session = token ? await parseSessionToken(token) : null;

    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, error: 'Hanya Superadmin yang berhak menghapus alokasi anggaran!' },
        { status: 403 }
      );
    }

    const allocation = await prisma.budgetAllocation.findUnique({
      where: { id },
    });

    if (!allocation) {
      return NextResponse.json({ success: false, error: 'Data anggaran tidak ditemukan!' }, { status: 404 });
    }

    // Decrement from SPPG Unit activeBudget
    await prisma.sppgUnit.update({
      where: { id: allocation.sppgUnitId },
      data: {
        activeBudget: {
          decrement: allocation.amountAllocated,
        },
        totalRemaining: {
          decrement: allocation.remainingBudget,
        },
      },
    });

    await prisma.budgetAllocation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Alokasi anggaran berhasil dihapus!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
