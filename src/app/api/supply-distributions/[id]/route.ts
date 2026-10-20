import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperadmin } from '@/lib/api-auth';

const db = prisma as any;

/**
 * GET: Ambil detail 1 riwayat alokasi pasokan bahan belanja.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const record = await db.supplyDistribution.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json({ success: false, error: 'Data alokasi pasokan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

/**
 * DELETE: Hapus riwayat alokasi pasokan bahan, sekaligus kurangi kembali stok per unit di sppgDistribution.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const existing = await db.supplyDistribution.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: true, message: 'Data alokasi telah dihapus.' });
    }

    await prisma.$transaction(async (tx: any) => {
      const items = existing.items as any[];
      if (Array.isArray(items)) {
        for (const it of items) {
          if (!it.allocations || typeof it.allocations !== 'object') continue;

          let targetIngId = it.ingredientId;
          if (!targetIngId && it.name) {
            const found = await tx.ingredient.findFirst({
              where: { name: { equals: it.name.trim(), mode: 'insensitive' } },
            });
            if (found) targetIngId = found.id;
          }

          if (targetIngId) {
            const currentIng = await tx.ingredient.findUnique({ where: { id: targetIngId } });
            if (currentIng) {
              const currentDist = (currentIng.sppgDistribution as Record<string, number>) || {};
              const updatedDist = { ...currentDist };

              for (const [unitId, qty] of Object.entries(it.allocations)) {
                const numQty = Number(qty) || 0;
                if (numQty <= 0) continue;
                updatedDist[unitId] = Math.max(0, (Number(updatedDist[unitId]) || 0) - numQty);

                try {
                  await tx.stockMovement.create({
                    data: {
                      sppgUnitId: unitId,
                      ingredientId: targetIngId,
                      type: 'KELUAR',
                      quantity: numQty,
                      unit: it.unit || currentIng.defaultUnit,
                      referenceNumber: `BATAL-${existing.dispatchNumber}`,
                      purpose: `Pembatalan Alokasi Bahan (${existing.dispatchNumber})`,
                      recordedBy: 'Superadmin Logistik',
                      remainingStockAfter: updatedDist[unitId],
                    },
                  });
                } catch (smErr) {
                  console.warn('Gagal catat stock movement pembatalan alokasi:', smErr);
                }
              }

              await tx.ingredient.update({
                where: { id: targetIngId },
                data: { sppgDistribution: updatedDist },
              });
            }
          }
        }
      }

      await tx.supplyDistribution.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: 'Alokasi bahan berhasil dihapus dan stok unit telah disesuaikan kembali.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
