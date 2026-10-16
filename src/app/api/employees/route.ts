import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperadmin } from '@/lib/api-auth';
import { createWithCode, normalizeName } from '@/lib/master-helpers';

/** Daftar karyawan peminta belanja. */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const employees = await prisma.employee.findMany({
      include: { sppgUnit: { select: { name: true } } },
      orderBy: [{ sppgUnitId: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json({ success: true, data: employees });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

/**
 * Tambah karyawan. Nama yang sama di unit yang sama tidak dibuat ulang (anti duplikat).
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const body = await req.json();
    const name = normalizeName(body.name);
    const sppgUnitId = String(body.sppgUnitId || '').trim();

    if (name.length < 3 || !sppgUnitId) {
      return NextResponse.json({ success: false, error: 'Nama karyawan dan unit SPPG wajib diisi.' }, { status: 400 });
    }

    const unit = await prisma.sppgUnit.findUnique({ where: { id: sppgUnitId } });
    if (!unit) {
      return NextResponse.json({ success: false, error: `Unit SPPG "${sppgUnitId}" tidak ditemukan.` }, { status: 400 });
    }

    const existing = await prisma.employee.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, sppgUnitId },
      include: { sppgUnit: { select: { name: true } } },
    });
    if (existing) {
      return NextResponse.json({ success: true, data: existing, duplicate: true, message: 'Karyawan sudah terdaftar di unit ini.' });
    }

    const unitCode = unit.code.replace('SPPG-', '');
    const numbers = (
      await prisma.employee.findMany({ where: { sppgUnitId }, select: { employeeNumber: true } })
    ).map((e) => e.employeeNumber);

    const created = await createWithCode(
      (code) =>
        prisma.employee.create({
          data: {
            employeeNumber: code,
            name,
            roleTitle: normalizeName(body.roleTitle) || 'Petugas Pengadaan Dapur',
            sppgUnitId,
            phone: normalizeName(body.phone) || '-',
            totalRequested: 0,
            totalRealized: 0,
            pendingBalance: 0,
            complianceScore: Number(body.complianceScore) || 100,
            status: body.status || 'ACTIVE',
          },
          include: { sppgUnit: { select: { name: true } } },
        }),
      `EMP-${unitCode}-`,
      numbers,
      2
    );

    return NextResponse.json({ success: true, data: created, message: 'Karyawan berhasil ditambahkan.' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
