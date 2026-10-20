import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MovementType } from '@prisma/client';
import { requireSuperadmin } from '@/lib/api-auth';
import { normalizeName } from '@/lib/master-helpers';
import { safeErrorMessage } from '@/lib/safe-error';

/** Ubah catatan mutasi stok keluar/masuk. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.stockMovement.findUnique({
      where: { id },
      include: { ingredient: true, sppgUnit: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Catatan mutasi tidak ditemukan.' }, { status: 404 });
    }

    const newType = body.type ? (body.type === 'MASUK' ? MovementType.MASUK : MovementType.KELUAR) : existing.type;
    const newQty = body.quantity !== undefined ? Number(body.quantity) : Number(existing.quantity);
    const newRef = body.referenceNumber !== undefined ? normalizeName(body.referenceNumber) : existing.referenceNumber;
    const newPurpose = body.purpose !== undefined ? normalizeName(body.purpose) : existing.purpose;
    const newOfficer = body.recordedBy !== undefined ? normalizeName(body.recordedBy) : existing.recordedBy;
    const newUnitId = body.sppgUnitId || existing.sppgUnitId;

    if (newQty <= 0) {
      return NextResponse.json({ success: false, error: 'Kuantitas mutasi harus lebih besar dari 0.' }, { status: 400 });
    }

    // Hitung penyesuaian stok bahan
    // 1. Revert efek mutasi lama
    let stock = Number(existing.ingredient.currentStock);
    if (existing.type === MovementType.MASUK) {
      stock = Math.max(0, stock - Number(existing.quantity));
    } else {
      stock = stock + Number(existing.quantity);
    }

    // 2. Terapkan efek mutasi baru
    let finalStock = stock;
    if (newType === MovementType.MASUK) {
      finalStock += newQty;
    } else {
      finalStock = Math.max(0, finalStock - newQty);
    }

    // Penyesuaian sebaran SPPG jika ada
    let distribution = (existing.ingredient.sppgDistribution as Record<string, number>) || {};
    if (distribution && typeof distribution === 'object') {
      distribution = { ...distribution };
      // Revert lama
      const oldUnitQty = Number(distribution[existing.sppgUnitId] || 0);
      if (existing.type === MovementType.MASUK) {
        distribution[existing.sppgUnitId] = Math.max(0, oldUnitQty - Number(existing.quantity));
      } else {
        distribution[existing.sppgUnitId] = oldUnitQty + Number(existing.quantity);
      }
      // Terapkan baru
      const targetUnitQty = Number(distribution[newUnitId] || 0);
      if (newType === MovementType.MASUK) {
        distribution[newUnitId] = targetUnitQty + newQty;
      } else {
        distribution[newUnitId] = Math.max(0, targetUnitQty - newQty);
      }
    }

    // Update stok bahan
    await prisma.ingredient.update({
      where: { id: existing.ingredientId },
      data: {
        currentStock: finalStock,
        sppgDistribution: distribution,
      },
    });

    // Update catatan mutasi
    const updated = await prisma.stockMovement.update({
      where: { id },
      data: {
        type: newType,
        quantity: newQty,
        sppgUnitId: newUnitId,
        referenceNumber: newRef,
        purpose: newPurpose,
        recordedBy: newOfficer,
        remainingStockAfter: finalStock,
      },
      include: {
        sppgUnit: true,
        ingredient: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Catatan mutasi stok berhasil diperbarui dan stok bahan telah disesuaikan!',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}

export const PUT = PATCH;

/** Hapus catatan mutasi stok keluar/masuk dan kembalikan stok bahan secara otomatis. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {

    const { id } = await params;

    const existing = await prisma.stockMovement.findUnique({
      where: { id },
      include: { ingredient: true, sppgUnit: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Catatan mutasi tidak ditemukan.' }, { status: 404 });
    }

    // Revert efek mutasi pada stok bahan:
    // Jika mutasi adalah MASUK (stok bertambah), maka saat dihapus, stok bahan dikurangi kembali.
    // Jika mutasi adalah KELUAR (stok berkurang), maka saat dihapus, stok bahan dikembalikan (bertambah).
    let stock = Number(existing.ingredient.currentStock);
    const qty = Number(existing.quantity);

    if (existing.type === MovementType.MASUK) {
      stock = Math.max(0, stock - qty);
    } else {
      stock = stock + qty;
    }

    // Revert sebaran per SPPG jika ada
    let distribution = (existing.ingredient.sppgDistribution as Record<string, number>) || {};
    if (distribution && typeof distribution === 'object') {
      distribution = { ...distribution };
      const currentUnitQty = Number(distribution[existing.sppgUnitId] || 0);
      if (existing.type === MovementType.MASUK) {
        distribution[existing.sppgUnitId] = Math.max(0, currentUnitQty - qty);
      } else {
        distribution[existing.sppgUnitId] = currentUnitQty + qty;
      }
    }

    // Update stok bahan
    await prisma.ingredient.update({
      where: { id: existing.ingredientId },
      data: {
        currentStock: stock,
        sppgDistribution: distribution,
      },
    });

    // Hapus baris mutasi
    await prisma.stockMovement.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Mutasi berhasil dihapus. Stok ${existing.ingredient.name} disesuaikan kembali menjadi ${stock} ${existing.unit}.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}
