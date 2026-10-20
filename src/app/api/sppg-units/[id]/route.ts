import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireSuperadmin } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/safe-error';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
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
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;

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
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}
