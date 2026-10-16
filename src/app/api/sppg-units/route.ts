import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperadmin, parseSessionToken } from '@/lib/api-auth';


export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const units = await prisma.sppgUnit.findMany({
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
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
        { success: false, error: 'Hanya Superadmin yang berhak menambah Unit SPPG baru!' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, shortName, location, picName, phone, activeBudget } = body;

    if (!name || !shortName) {
      return NextResponse.json(
        { success: false, error: 'Nama SPPG dan Nama Singkat wajib diisi!' },
        { status: 400 }
      );
    }

    const count = await prisma.sppgUnit.count();
    const code = body.code || `SPPG-${(count + 1).toString().padStart(2, '0')}`;
    const budget = Number(activeBudget) || 150000000;

    const newUnit = await prisma.sppgUnit.create({
      data: {
        code,
        name: name.trim(),
        shortName: shortName.trim(),
        location: location?.trim() || 'Gresik, Jawa Timur',
        picName: picName?.trim() || 'Koordinator Dapur',
        phone: phone?.trim() || '',
        activeBudget: budget,
        totalRealized: 0,
        totalRemaining: budget,
      },
    });

    return NextResponse.json({ success: true, data: newUnit, message: 'Unit SPPG berhasil ditambahkan!' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
