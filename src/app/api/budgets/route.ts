import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireSuperadmin } from '@/lib/api-auth';
import { applyBudgetToUnits, budgetToApp } from '@/lib/budget-db';
import { sanitizeObject } from '@/lib/sanitize';


/** Daftar dana masuk / pagu kas (tabel budget_allocations). */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const sppgUnitId = searchParams.get('sppgUnitId');

    const where: any = {};
    if (sppgUnitId && sppgUnitId !== 'ALL') {
      // Catatan gabungan 'ALL' tetap ikut tampil saat satu unit dipilih
      where.OR = [{ sppgUnitId }, { sppgUnitId: 'ALL' }];
    }

    const [rows, units] = await Promise.all([
      prisma.budgetAllocation.findMany({
        where,
        orderBy: { allocatedDate: 'desc' },
      }),
      prisma.sppgUnit.findMany({ select: { id: true, name: true } }),
    ]);

    const unitMap = new Map(units.map((u) => [u.id, u.name]));

    return NextResponse.json(
      { success: true, data: rows.map((r) => budgetToApp(r, unitMap)) },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

/**
 * Catat dana masuk. Terima satu baris atau banyak sekaligus ({ items: [...] })
 * supaya import Excel tidak perlu puluhan request.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if ('error' in auth) return auth.error;

  try {
    const rawBody = await req.json();
    const body = sanitizeObject(rawBody) as any;
    const rows: any[] = Array.isArray(body?.items) ? body.items : [body];
    const skipped: string[] = [];

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada data yang dikirim.' }, { status: 400 });
    }
    if (rows.length > 500) {
      return NextResponse.json({ success: false, error: 'Maksimal 500 baris per import.' }, { status: 400 });
    }

    for (const r of rows) {
      if (!r?.sppgUnitId) {
        return NextResponse.json({ success: false, error: 'Unit SPPG wajib diisi di setiap baris.' }, { status: 400 });
      }
      const amount = Number(r.amountAllocated);
      if (!isFinite(amount) || amount <= 0) {
        return NextResponse.json({ success: false, error: 'Nominal dana masuk harus lebih dari 0.' }, { status: 400 });
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const out = [];
      for (const r of rows) {
        const amount = Number(r.amountAllocated);
        const allocatedDate = r.allocatedDate ? new Date(r.allocatedDate) : new Date();
        const fiscalPeriod = String(r.fiscalPeriod || '-').trim() || '-';

        // Anti duplikat: baris dengan unit + periode + nominal + tanggal sama dilewati,
        // supaya import Excel yang sama dua kali tidak menggandakan catatan.
        const dayStart = new Date(allocatedDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const duplicate = await tx.budgetAllocation.findFirst({
          where: {
            sppgUnitId: r.sppgUnitId,
            fiscalPeriod,
            amountAllocated: amount,
            allocatedDate: { gte: dayStart, lte: dayEnd },
          },
          select: { id: true },
        });
        if (duplicate) {
          skipped.push(`${r.sppgUnitId} ${fiscalPeriod} Rp ${amount.toLocaleString('id-ID')} — sudah ada, dilewati`);
          continue;
        }

        const hasMeta = r.requestedBy || r.requesterFor || r.cashHolder || r.transferProofUrl || r.withdrawnAmount;
        const serializedNotes = hasMeta
          ? JSON.stringify({
              note: r.notes || '',
              requestedBy: r.requestedBy || '',
              requesterFor: r.requesterFor || '',
              cashHolder: r.cashHolder || '',
              transferProofUrl: r.transferProofUrl || '',
              withdrawnAmount: Number(r.withdrawnAmount) || 0,
              withdrawnAt: r.withdrawnAt || undefined,
              withdrawnBy: r.withdrawnBy || '',
              withdrawnNote: r.withdrawnNote || '',
            })
          : (r.notes || null);

        const row = await tx.budgetAllocation.create({
          data: {
            ...(r.id ? { id: r.id } : {}),
            sppgUnitId: r.sppgUnitId,
            fiscalPeriod,
            amountAllocated: amount,
            amountRealized: Number(r.amountRealized) || 0,
            remainingBudget: r.remainingBudget !== undefined ? Number(r.remainingBudget) : amount,
            allocatedDate,
            notes: serializedNotes,
          },
        });
        await applyBudgetToUnits(tx, r.sppgUnitId, amount);
        out.push(row);
      }
      return out;
    });

    const units = await prisma.sppgUnit.findMany({ select: { id: true, name: true, shortName: true } });
    const unitMap = new Map(units.map((u) => [u.id, u.name]));

    // Log system notification for Pemantau / Auditor in real-time
    if (created.length > 0) {
      try {
        const notifData = created.map((row) => {
          const unitLabel = row.sppgUnitId === 'ALL' ? 'Semua Unit (4 Dapur)' : (unitMap.get(row.sppgUnitId) || row.sppgUnitId);
          const appBudget = budgetToApp(row, unitMap);
          const pengajuText = appBudget.requestedBy ? ` oleh ${appBudget.requestedBy}` : '';
          const picText = appBudget.cashHolder ? ` (Pemegang Kas: ${appBudget.cashHolder})` : '';
          return {
            type: 'BUDGET_ADDED',
            title: 'Kas Masuk Baru Diinput',
            message: `Kas masuk diajukan${pengajuText} sebesar Rp ${Number(row.amountAllocated).toLocaleString('id-ID')} untuk ${unitLabel} (${row.fiscalPeriod})${picText}.`,
            actorName: appBudget.requestedBy || 'Superadmin Pengelola',
            amount: row.amountAllocated,
            unitName: unitLabel,
            referenceId: row.id,
          };
        });
        await prisma.systemNotification.createMany({ data: notifData });
      } catch (e) {
        console.error('Failed to log budget notification:', e);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: created.map((r) => budgetToApp(r, unitMap)),
        skipped,
        message:
          created.length === 1
            ? 'Dana masuk tersimpan.'
            : `${created.length} baris dana masuk tersimpan${skipped.length ? `, ${skipped.length} duplikat dilewati` : ''}.`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
