import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperadmin, parseSessionToken } from '@/lib/api-auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = req.cookies.get('giziflow_session')?.value;
    const session = token ? await parseSessionToken(token) : null;

    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, error: 'Hanya Superadmin yang berhak mengubah Unit SPPG!' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateData: any = {};
    if (body.name) updateData.name = body.name.trim();
    if (body.shortName) updateData.shortName = body.shortName.trim();
    if (body.location) updateData.location = body.location.trim();
    if (body.picName) updateData.picName = body.picName.trim();
    if (body.phone) updateData.phone = body.phone.trim();
    if (body.activeBudget !== undefined) {
      updateData.activeBudget = Number(body.activeBudget);
    }

    const updated = await prisma.sppgUnit.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated, message: 'Unit SPPG berhasil diperbarui!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

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
        { success: false, error: 'Hanya Superadmin yang berhak menghapus Unit SPPG!' },
        { status: 403 }
      );
    }

    // Check if unit has procurement orders
    const ordersCount = await prisma.procurementOrder.count({
      where: { sppgUnitId: id },
    });

    if (ordersCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Unit SPPG tidak dapat dihapus karena sudah memiliki ${ordersCount} transaksi belanja tersimpan!`,
        },
        { status: 400 }
      );
    }

    await prisma.sppgUnit.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Unit SPPG berhasil dihapus!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
