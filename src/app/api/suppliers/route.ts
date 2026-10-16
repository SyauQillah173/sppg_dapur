import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperadmin } from '@/lib/api-auth';
import { createWithCode, normalizeName } from '@/lib/master-helpers';

/** Daftar supplier / CV. */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

/**
 * Tambah supplier. Nama yang sudah ada tidak dibuat ulang (anti duplikat) —
 * yang dikembalikan adalah baris yang sudah ada, dengan penanda duplicate.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const name = normalizeName(body.name);
    if (name.length < 3) {
      return NextResponse.json({ success: false, error: 'Nama CV / Supplier minimal 3 karakter.' }, { status: 400 });
    }

    const existing = await prisma.supplier.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) {
      return NextResponse.json({ success: true, data: existing, duplicate: true, message: 'Supplier sudah terdaftar.' });
    }

    const codes = (await prisma.supplier.findMany({ select: { code: true } })).map((s) => s.code);
    const created = await createWithCode(
      (code) =>
        prisma.supplier.create({
          data: {
            code,
            name,
            picName: normalizeName(body.picName) || 'Kontak Toko',
            phone: normalizeName(body.phone) || '-',
            address: normalizeName(body.address) || 'Gresik, Jawa Timur',
            bankAccount: normalizeName(body.bankAccount) || 'Tunai Kas',
            suppliedCategory: normalizeName(body.suppliedCategory) || 'Bahan Dapur Segar',
            totalDisbursed: 0,
            totalTransactions: 0,
            rating: Number(body.rating) || 5,
            activeStatus: body.activeStatus !== false,
          },
        }),
      'CV-',
      codes,
      2
    );

    return NextResponse.json({ success: true, data: created, message: 'Supplier berhasil ditambahkan.' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
