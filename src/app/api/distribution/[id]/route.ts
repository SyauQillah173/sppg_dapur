import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperadmin, requireDistributionAccess } from '@/lib/api-auth';
import { sanitizeObject } from '@/lib/sanitize';
import { safeErrorMessage } from '@/lib/safe-error';

const db = prisma as any;

/**
 * GET: Ambil detail 1 data pengiriman distribusi makanan beserta rincian BAST resmi.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const distribution = await db.mealDistribution.findUnique({
      where: { id },
    });

    if (!distribution) {
      return NextResponse.json({ success: false, error: 'Data pengiriman tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: distribution });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}

/**
 * PATCH: Update status pengiriman (IN_TRANSIT, ARRIVED, COMPLETED), tanda tangan BAST, foto, dsb.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireDistributionAccess(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const rawBody = await req.json();
    const body = sanitizeObject(rawBody) as any;

    const existing = await db.mealDistribution.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Data pengiriman tidak ditemukan.' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const data: any = {};

      if (body.status !== undefined) data.status = body.status;
      if (body.actualArrival !== undefined) data.actualArrival = body.actualArrival;
      if (body.foodTemperature !== undefined) data.foodTemperature = body.foodTemperature;
      if (body.recipientName !== undefined) data.recipientName = body.recipientName;
      if (body.recipientNip !== undefined) data.recipientNip = body.recipientNip;
      if (body.isSigned !== undefined) data.isSigned = Boolean(body.isSigned);
      if (body.recipientSignature !== undefined) data.recipientSignature = body.recipientSignature;
      if (body.deliveryPhotoUrl !== undefined) data.deliveryPhotoUrl = body.deliveryPhotoUrl;
      if (body.notes !== undefined) data.notes = body.notes;
      if (body.absentStudents !== undefined) data.absentStudents = Number(body.absentStudents);
      if (body.deliveredPortions !== undefined) data.deliveredPortions = Number(body.deliveredPortions);
      if (body.surplusHandling !== undefined) data.surplusHandling = body.surplusHandling;

      // Jika ada instruksi potong stok bahan dan belum pernah dipotong
      if (body.deductStockNow && !existing.isStockDeducted && Array.isArray(body.deductedItems)) {
        const recordedDeducted: any[] = [];
        for (const item of body.deductedItems) {
          const qty = Number(item.quantity) || 0;
          if (qty <= 0) continue;

          let targetIngId = item.ingredientId;
          if (!targetIngId && item.name) {
            const found = await tx.ingredient.findFirst({
              where: { name: { equals: item.name.trim(), mode: 'insensitive' } },
            });
            if (found) targetIngId = found.id;
          }

          if (targetIngId) {
            const updatedIng = await tx.ingredient.update({
              where: { id: targetIngId },
              data: { currentStock: { decrement: qty } },
            });

            await tx.stockMovement.create({
              data: {
                sppgUnitId: existing.sppgUnitId === 'ALL' ? 'SPPG-AA02' : existing.sppgUnitId,
                ingredientId: targetIngId,
                type: 'KELUAR',
                quantity: qty,
                unit: item.unit || updatedIng.defaultUnit,
                referenceNumber: existing.dispatchNumber,
                purpose: `Distribusi ${existing.targetPortions} Porsi (${existing.menuTitle}) ke ${existing.schoolName}`,
                recordedBy: 'Superadmin Logistik Distribusi',
                remainingStockAfter: updatedIng.currentStock,
              },
            });

            recordedDeducted.push({
              ingredientId: targetIngId,
              name: updatedIng.name,
              quantity: qty,
              unit: item.unit || updatedIng.defaultUnit,
              remainingStockAfter: Number(updatedIng.currentStock),
            });
          }
        }
        data.isStockDeducted = true;
        data.deductedItems = recordedDeducted;
      }

      const res = await tx.mealDistribution.update({
        where: { id },
        data,
      });

      // Notifikasi jika selesai diterima sekolah (BAST ditandatangani)
      if (body.isSigned && !existing.isSigned) {
        try {
          await tx.systemNotification.create({
            data: {
              type: 'BAST_SIGNED',
              title: 'BAST Distribusi Ditandatangani Sekolah',
              message: `BAST ${existing.bastNumber} telah ditandatangani oleh ${body.recipientName || 'Kepala Sekolah'} (${existing.schoolName}). Makanan telah diterima lengkap.`,
              actorName: body.recipientName || 'Pihak Sekolah',
              referenceId: existing.id,
              unitName: existing.sppgUnitName,
            },
          });
        } catch (e) {
          console.warn('Gagal catat notifikasi BAST:', e);
        }
      }

      return res;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}

/**
 * DELETE: Hapus data pengiriman. Jika stok pernah dipotong, kembalikan stok bahan ke gudang.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const existing = await db.mealDistribution.findUnique({ where: { id } });
    if (!existing) {
      // Idempotent: jika ID tidak ditemukan atau sudah terhapus, anggap sukses agar UI tidak memunculkan popup error palsu
      return NextResponse.json({ success: true, message: 'Data pengiriman telah dihapus.' });
    }

    await prisma.$transaction(async (tx: any) => {
      // Jika stok pernah dipotong dari pengiriman ini, kembalikan stok bahan
      if (existing.isStockDeducted && Array.isArray(existing.deductedItems)) {
        for (const it of existing.deductedItems as any[]) {
          const qty = Number(it.quantity) || 0;
          if (qty <= 0) continue;

          if (it.ingredientId) {
            const restored = await tx.ingredient.update({
              where: { id: it.ingredientId },
              data: { currentStock: { increment: qty } },
            });

            await tx.stockMovement.create({
              data: {
                sppgUnitId: existing.sppgUnitId === 'ALL' ? 'SPPG-AA02' : existing.sppgUnitId,
                ingredientId: it.ingredientId,
                type: 'MASUK',
                quantity: qty,
                unit: it.unit || restored.defaultUnit,
                referenceNumber: `BATAL-${existing.dispatchNumber}`,
                purpose: `Pembatalan Pengiriman Distribusi ${existing.dispatchNumber} (Stok Dikembalikan)`,
                recordedBy: 'Superadmin Logistik Distribusi',
                remainingStockAfter: restored.currentStock,
              },
            });
          }
        }
      }

      await tx.mealDistribution.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: 'Data pengiriman berhasil dihapus dan stok telah disesuaikan.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}
