import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const count = await prisma.supplier.count();
    const code = `CV-${body.name.slice(0, 3).toUpperCase()}-${(count + 1).toString().padStart(2, '0')}`;

    const newSupplier = await prisma.supplier.create({
      data: {
        code,
        name: body.name,
        picName: body.picName || '',
        phone: body.phone || '',
        address: body.address || '',
        bankAccount: body.bankAccount || '',
        suppliedCategory: body.suppliedCategory || 'Sayuran, Sembako',
        totalDisbursed: 0,
        totalTransactions: 0,
        rating: 5.0,
      },
    });

    return NextResponse.json({ success: true, data: newSupplier }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
