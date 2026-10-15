import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AuditStatus } from '@prisma/client';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, auditNotes, auditedBy, discrepancyReason } = body;

    const updated = await prisma.procurementOrder.update({
      where: { id },
      data: {
        status: status as AuditStatus,
        auditNotes,
        auditedBy,
        discrepancyReason,
        auditedAt: new Date(),
        items: {
          updateMany: {
            where: { procurementOrderId: id },
            data: { isItemVerified: status === AuditStatus.VERIFIED },
          },
        },
      },
      include: {
        sppgUnit: true,
        requester: true,
        supplier: true,
        items: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
