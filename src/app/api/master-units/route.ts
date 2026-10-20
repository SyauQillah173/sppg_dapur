import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizeName } from '@/lib/master-helpers';
import { requireAuth, requireSuperadmin, parseSessionToken } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/safe-error';


export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const units = await prisma.masterUnit.findMany({
      orderBy: { symbol: 'asc' },
    });
    return NextResponse.json({ success: true, data: units });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {

    const body = await req.json();
    const { symbol, name, type } = body;

    const cleanSymbol = normalizeName(symbol);
    const cleanName = normalizeName(name);
    if (!cleanSymbol || !cleanName) {
      return NextResponse.json({ success: false, error: 'Simbol dan Nama Satuan wajib diisi!' }, { status: 400 });
    }

    // Anti duplikat: simbol satuan yang sudah ada dikembalikan apa adanya.
    const existing = await prisma.masterUnit.findFirst({
      where: { symbol: { equals: cleanSymbol, mode: 'insensitive' } },
    });
    if (existing) {
      return NextResponse.json({ success: true, data: existing, duplicate: true, message: 'Satuan sudah ada.' });
    }

    const newUnit = await prisma.masterUnit.create({
      data: {
        symbol: cleanSymbol,
        name: cleanName,
        type: normalizeName(type) || 'BERAT',
      },
    });

    return NextResponse.json({ success: true, data: newUnit, message: 'Satuan berhasil ditambahkan!' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {

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
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
}
