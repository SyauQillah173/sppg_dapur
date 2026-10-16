import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperadmin, parseSessionToken } from '@/lib/api-auth';

export async function GET() {
  try {
    const units = await prisma.masterUnit.findMany({
      orderBy: { symbol: 'asc' },
    });
    return NextResponse.json({ success: true, data: units });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('giziflow_session')?.value;
    const session = token ? await parseSessionToken(token) : null;

    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, error: 'Hanya Superadmin yang berhak menambah Satuan Ukur!' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { symbol, name, type } = body;

    if (!symbol || !name) {
      return NextResponse.json({ success: false, error: 'Simbol dan Nama Satuan wajib diisi!' }, { status: 400 });
    }

    const newUnit = await prisma.masterUnit.create({
      data: {
        symbol: symbol.trim(),
        name: name.trim(),
        type: type || 'BERAT',
      },
    });

    return NextResponse.json({ success: true, data: newUnit, message: 'Satuan berhasil ditambahkan!' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('giziflow_session')?.value;
    const session = token ? await parseSessionToken(token) : null;

    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { success: false, error: 'Hanya Superadmin yang berhak menghapus Satuan Ukur!' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID Satuan wajib dicantumkan!' }, { status: 400 });
    }

    await prisma.masterUnit.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Satuan berhasil dihapus!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
