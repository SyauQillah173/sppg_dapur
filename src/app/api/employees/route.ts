import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const employees = await prisma.employee.findMany({
      include: { sppgUnit: true },
      orderBy: { employeeNumber: 'asc' },
    });
    return NextResponse.json({ success: true, data: employees });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const count = await prisma.employee.count();
    const unit = await prisma.sppgUnit.findUnique({ where: { id: body.sppgUnitId } });
    const unitCode = unit?.code.replace('SPPG-', '') || 'GEN';
    const employeeNumber = `EMP-${unitCode}-${(count + 1).toString().padStart(2, '0')}`;

    const newEmployee = await prisma.employee.create({
      data: {
        employeeNumber,
        name: body.name,
        roleTitle: body.roleTitle || 'Petugas Pengadaan Dapur',
        sppgUnitId: body.sppgUnitId,
        phone: body.phone || '',
        totalRequested: 0,
        totalRealized: 0,
        pendingBalance: 0,
        complianceScore: 100,
      },
      include: { sppgUnit: true },
    });

    return NextResponse.json({ success: true, data: newEmployee }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
