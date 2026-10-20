import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperadmin } from '@/lib/api-auth';
import { sanitizeObject } from '@/lib/sanitize';
import { safeErrorMessage } from '@/lib/safe-error';

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
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}

/**
 * PUT: Edit / update riwayat alokasi pasokan bahan belanja atau tarik kembali ke gudang sementara.
 * Menyesuaikan saldo stok per unit di sppgDistribution secara akurat.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await params;
    const existing = await db.supplyDistribution.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Data alokasi pasokan tidak ditemukan.' }, { status: 404 });
    }

    const rawBody = await req.json();
    const body = sanitizeObject(rawBody) as any;

    // Aksi khusus: Tarik Kembali Bahan ke Gudang Sementara tanpa menghapus arsip
    if (body.action === 'return') {
      const updated = await prisma.$transaction(async (tx: any) => {
        const items = (existing.items as any[]) || [];
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
              let totalReturned = 0;

              for (const [unitId, qty] of Object.entries(it.allocations)) {
                const num = Number(qty) || 0;
                if (num <= 0) continue;
                totalReturned += num;
                updatedDist[unitId] = Math.max(0, (Number(updatedDist[unitId]) || 0) - num);

                try {
                  await tx.stockMovement.create({
                    data: {
                      sppgUnitId: unitId,
                      ingredientId: targetIngId,
                      type: 'KELUAR',
                      quantity: num,
                      unit: it.unit || currentIng.defaultUnit,
                      referenceNumber: `TARIK-${existing.dispatchNumber}`,
                      purpose: `Pengembalian Bahan dari Dapur ke Gudang Sementara (${existing.dispatchNumber})`,
                      recordedBy: 'Superadmin Logistik',
                      remainingStockAfter: updatedDist[unitId],
                    },
                  });
                } catch (smErr) {
                  console.warn('Gagal catat stock movement tarik alokasi:', smErr);
                }
              }

              const newAllocated = Object.values(updatedDist).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
              const currentStockNum = Number(currentIng.currentStock) || 0;
              const neededStock = Math.max(currentStockNum, newAllocated + totalReturned);

              await tx.ingredient.update({
                where: { id: targetIngId },
                data: {
                  sppgDistribution: updatedDist,
                  currentStock: neededStock,
                },
              });
            }
          }
        }

        const record = await tx.supplyDistribution.update({
          where: { id },
          data: { status: 'RETURNED' },
        });

        return record;
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Seluruh bahan pada alokasi ini berhasil ditarik kembali ke Gudang Sementara.',
      });
    }

    // Aksi normal: Update / Edit data alokasi
    const {
      supplierName,
      driverName,
      driverPhone,
      vehiclePlate,
      date,
      notes,
      status,
      items: newItems,
      headSignerName,
      headSignerTitle,
      headSignerNip,
    } = body;

    const updated = await prisma.$transaction(async (tx: any) => {
      // 1. Revert alokasi lama dari existing.items
      const oldItems = (existing.items as any[]) || [];
      if (existing.status !== 'RETURNED') {
        for (const it of oldItems) {
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
              const revertedDist = { ...currentDist };
              for (const [unitId, qty] of Object.entries(it.allocations)) {
                const num = Number(qty) || 0;
                if (num <= 0) continue;
                revertedDist[unitId] = Math.max(0, (Number(revertedDist[unitId]) || 0) - num);
              }
              await tx.ingredient.update({
                where: { id: targetIngId },
                data: { sppgDistribution: revertedDist },
              });
            }
          }
        }
      }

      // 2. Terapkan alokasi baru dari newItems
      const safeNewItems = Array.isArray(newItems) ? newItems : oldItems;
      for (const it of safeNewItems) {
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
            const appliedDist = { ...currentDist };
            for (const [unitId, qty] of Object.entries(it.allocations)) {
              const num = Number(qty) || 0;
              if (num <= 0) continue;
              appliedDist[unitId] = (Number(appliedDist[unitId]) || 0) + num;

              try {
                await tx.stockMovement.create({
                  data: {
                    sppgUnitId: unitId,
                    ingredientId: targetIngId,
                    type: 'MASUK',
                    quantity: num,
                    unit: it.unit || currentIng.defaultUnit,
                    referenceNumber: `REVISI-${existing.dispatchNumber}`,
                    purpose: `Revisi Alokasi Pasokan (${existing.dispatchNumber})`,
                    recordedBy: 'Superadmin Logistik',
                    remainingStockAfter: appliedDist[unitId],
                  },
                });
              } catch (smErr) {
                console.warn('Gagal catat stock movement revisi alokasi:', smErr);
              }
            }

            const totalAllocated = Object.values(appliedDist).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
            const currentStockNum = Number(currentIng.currentStock) || 0;
            const neededStock = Math.max(currentStockNum, totalAllocated);

            await tx.ingredient.update({
              where: { id: targetIngId },
              data: {
                sppgDistribution: appliedDist,
                currentStock: neededStock,
              },
            });
          }
        }
      }

      // 3. Update data pada supplyDistribution
      const record = await tx.supplyDistribution.update({
        where: { id },
        data: {
          supplierName: supplierName !== undefined ? supplierName : existing.supplierName,
          driverName: driverName !== undefined ? driverName : existing.driverName,
          driverPhone: driverPhone !== undefined ? driverPhone : existing.driverPhone,
          vehiclePlate: vehiclePlate !== undefined ? vehiclePlate : existing.vehiclePlate,
          date: date ? new Date(date) : existing.date,
          notes: notes !== undefined ? notes : existing.notes,
          status: status !== undefined ? status : (existing.status === 'RETURNED' ? 'COMPLETED' : existing.status),
          items: safeNewItems,
          headSignerName: headSignerName !== undefined ? headSignerName : existing.headSignerName,
          headSignerTitle: headSignerTitle !== undefined ? headSignerTitle : existing.headSignerTitle,
          headSignerNip: headSignerNip !== undefined ? headSignerNip : existing.headSignerNip,
        },
      });

      return record;
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Alokasi bahan belanja berhasil diperbarui.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}

/**
 * DELETE: Hapus riwayat alokasi pasokan bahan, sekaligus kembalikan 100% stok bahan ke Gudang Sementara.
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
      if (Array.isArray(items) && existing.status !== 'RETURNED') {
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
              let totalReturned = 0;

              for (const [unitId, qty] of Object.entries(it.allocations)) {
                const numQty = Number(qty) || 0;
                if (numQty <= 0) continue;
                totalReturned += numQty;
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
                      purpose: `Pengembalian Bahan ke Stok Gudang Sementara (${existing.dispatchNumber})`,
                      recordedBy: 'Superadmin Logistik',
                      remainingStockAfter: updatedDist[unitId],
                    },
                  });
                } catch (smErr) {
                  console.warn('Gagal catat stock movement pembatalan alokasi:', smErr);
                }
              }

              const newTotalAllocated = Object.values(updatedDist).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
              const currentStockNum = Number(currentIng.currentStock) || 0;
              const neededStock = Math.max(currentStockNum, newTotalAllocated + totalReturned);

              await tx.ingredient.update({
                where: { id: targetIngId },
                data: {
                  sppgDistribution: updatedDist,
                  currentStock: neededStock,
                },
              });
            }
          }
        }
      }

      await tx.supplyDistribution.delete({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      message: 'Alokasi bahan berhasil dihapus dan seluruh stok bahan telah dikembalikan ke Gudang Sementara.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}
