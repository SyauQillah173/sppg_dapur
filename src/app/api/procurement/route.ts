import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditStatus } from '@prisma/client';
import { requireAuth, requireSuperadmin } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const orders = await prisma.procurementOrder.findMany({
      include: {
        sppgUnit: true,
        requester: true,
        supplier: true,
        items: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const {
      receiptNumber,
      date,
      sppgUnitId,
      requesterId,
      supplierId,
      amountRequested,
      actualReceiptTotal,
      changeReturned,
      notes,
      items,
      receiptPhotoUrl,
    } = body;

    // Check price anomaly for each item against ingredient benchmark
    const itemsWithAnomalyCheck = await Promise.all(
      (items || []).map(async (item: any) => {
        let hasPriceAnomaly = false;
        let previousAvgPrice = null;

        // Try to find matching ingredient by name
        const existingIng = await prisma.ingredient.findFirst({
          where: {
            name: {
              equals: item.name,
              mode: 'insensitive',
            },
          },
        });

        if (existingIng && Number(existingIng.lastPurchasePrice) > 0) {
          const benchmark = Number(existingIng.lastPurchasePrice);
          previousAvgPrice = benchmark;
          // If price increases by more than 20%
          if (Number(item.unitPrice) > benchmark * 1.2) {
            hasPriceAnomaly = true;
          }
        }

        return {
          name: item.name,
          category: item.category || 'Sayuran',
          quantity: Number(item.quantity) || 1,
          unit: item.unit || 'Kg',
          unitPrice: Number(item.unitPrice) || 0,
          subtotal: Number(item.subtotal) || (Number(item.quantity) * Number(item.unitPrice)),
          isOcrMatched: true,
          isItemVerified: false,
          hasPriceAnomaly,
          previousAvgPrice,
          ingredientId: existingIng?.id,
        };
      })
    );

    const newOrder = await prisma.procurementOrder.create({
      data: {
        receiptNumber,
        date: new Date(date || Date.now()),
        sppgUnitId,
        requesterId,
        supplierId,
        amountRequested: Number(amountRequested) || 0,
        actualReceiptTotal: Number(actualReceiptTotal) || 0,
        changeReturned: Number(changeReturned) || 0,
        status: AuditStatus.PENDING_AUDIT,
        receiptPhotoUrl: receiptPhotoUrl || '',
        physicalReceiptImage: receiptPhotoUrl ? 'PHYSICAL_RECEIPT_NEW' : '',
        notes: notes || '',
        items: {
          create: itemsWithAnomalyCheck,
        },
      },
      include: {
        sppgUnit: true,
        requester: true,
        supplier: true,
        items: true,
      },
    });

    // Also update Supplier spent total
    await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        totalDisbursed: { increment: Number(actualReceiptTotal) || 0 },
        totalTransactions: { increment: 1 },
      },
    });

    // Update SppgUnit realized total
    await prisma.sppgUnit.update({
      where: { id: sppgUnitId },
      data: {
        totalRealized: { increment: Number(actualReceiptTotal) || 0 },
        totalRemaining: { decrement: Number(actualReceiptTotal) || 0 },
      },
    });

    return NextResponse.json({ success: true, data: newOrder }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
