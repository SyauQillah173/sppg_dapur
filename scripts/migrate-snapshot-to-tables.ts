/**
 * Migrasi sekali jalan: pindahkan isi snapshot app_state ke tabel masing-masing.
 *
 * Latar: aplikasi menyimpan semua data dalam satu baris app_state (jsonb). Supaya
 * tiap menu punya tabel sendiri yang rapi, id di DB disamakan dengan id aplikasi
 * (SPPG-AA02, EMP-AA01, SUP-01, ING-01, CAT-01, UNIT-KG) lalu data dipindahkan.
 *
 * Jalankan: npx tsx scripts/migrate-snapshot-to-tables.ts
 * Aman diulang: master data ditulis ulang, tabel transaksi harus kosong dulu.
 */
import { PrismaClient, AuditStatus, MovementType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.appState.findMany({ select: { payload: true } });
  if (rows.length === 0) {
    console.log('Tidak ada snapshot app_state — tidak ada yang dimigrasikan.');
    return;
  }
  const s: any = rows[0].payload || {};

  const txCounts = {
    procurementOrder: await prisma.procurementOrder.count(),
    procurementItem: await prisma.procurementItem.count(),
    budgetAllocation: await prisma.budgetAllocation.count(),
    stockMovement: await prisma.stockMovement.count(),
  };
  console.log('Tabel transaksi sebelum migrasi:', txCounts);
  if (Object.values(txCounts).some((n) => n > 0)) {
    throw new Error('Tabel transaksi tidak kosong. Migrasi dibatalkan supaya data tidak tertimpa.');
  }

  // 1. Master data (urutan mengikuti relasi)
  //    Hapus dulu dari anak ke induk, supaya tidak melanggar foreign key.
  console.log('→ Bersihkan master data lama');
  await prisma.employee.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.ingredientCategory.deleteMany();
  await prisma.masterUnit.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.sppgUnit.deleteMany();

  console.log('→ SPPG Unit');
  for (const u of s.sppgUnits || []) {
    await prisma.sppgUnit.create({
      data: {
        id: u.id,
        code: u.code,
        name: u.name,
        shortName: u.shortName || u.code,
        location: u.location || '',
        picName: u.picName || '',
        phone: u.phone || '',
        activeBudget: Number(u.activeBudget) || 0,
        totalRealized: Number(u.totalRealized) || 0,
        totalRemaining: Number(u.totalRemaining) || 0,
      },
    });
  }

  console.log('→ Kategori bahan');
  for (const c of s.categories || []) {
    await prisma.ingredientCategory.create({
      data: {
        id: c.id,
        code: c.code || c.id,
        name: c.name,
        color: c.color || '#ef4444',
        description: c.description || '',
      },
    });
  }

  console.log('→ Satuan');
  for (const u of s.units || []) {
    await prisma.masterUnit.create({
      data: { id: u.id, symbol: u.symbol, name: u.name, type: u.type || 'BERAT' },
    });
  }

  console.log('→ Karyawan peminta');
  for (const e of s.employees || []) {
    await prisma.employee.create({
      data: {
        id: e.id,
        employeeNumber: e.employeeNumber || e.id,
        name: e.name,
        roleTitle: e.roleTitle || 'Staf Pengadaan',
        sppgUnitId: e.sppgUnitId,
        phone: e.phone || '-',
        totalRequested: Number(e.totalRequested) || 0,
        totalRealized: Number(e.totalRealized) || 0,
        pendingBalance: Number(e.pendingBalance) || 0,
        complianceScore: Number(e.complianceScore) || 100,
        status: e.status || 'ACTIVE',
      },
    });
  }

  console.log('→ Supplier / CV');
  for (const sup of s.suppliers || []) {
    await prisma.supplier.create({
      data: {
        id: sup.id,
        code: sup.code || sup.id,
        name: sup.name,
        picName: sup.picName || '-',
        phone: sup.phone || '-',
        address: sup.address || '-',
        bankAccount: sup.bankAccount || '-',
        suppliedCategory: sup.suppliedCategory || '-',
        totalDisbursed: Number(sup.totalDisbursed) || 0,
        totalTransactions: Number(sup.totalTransactions) || 0,
        rating: Number(sup.rating) || 5,
        activeStatus: sup.activeStatus !== false,
      },
    });
  }

  console.log('→ Bahan makanan');
  for (const ing of s.ingredients || []) {
    await prisma.ingredient.create({
      data: {
        id: ing.id,
        code: ing.code || ing.id,
        name: ing.name,
        categoryId: ing.categoryId || (s.categories || []).find((c: any) => c.name === ing.category)?.id,
        defaultUnit: ing.defaultUnit || 'Kg',
        currentStock: Number(ing.currentStock) || 0,
        minStockAlert: Number(ing.minStockAlert) || 10,
        lastPurchasePrice: Number(ing.lastPurchasePrice) || 0,
        sppgDistribution: ing.sppgDistribution || {},
      },
    });
  }

  // 2. Transaksi
  console.log('→ Pembelanjaan + rincian bahan');
  for (const p of s.procurements || []) {
    await prisma.procurementOrder.create({
      data: {
        id: p.id,
        receiptNumber: p.receiptNumber || '-',
        date: new Date(p.date || Date.now()),
        sppgUnitId: p.sppgUnitId,
        requesterId: p.requesterId,
        supplierId: p.supplierId,
        amountRequested: Number(p.amountRequested) || 0,
        actualReceiptTotal: Number(p.actualReceiptTotal) || 0,
        changeReturned: Number(p.changeReturned) || 0,
        status: (p.status as AuditStatus) || AuditStatus.PENDING_AUDIT,
        receiptPhotoUrl: p.receiptPhotoUrl || null,
        physicalReceiptImage: p.physicalReceiptImage || null,
        auditedBy: p.auditedBy || null,
        auditedAt: p.auditedAt ? new Date(p.auditedAt) : null,
        auditNotes: p.auditNotes || null,
        discrepancyReason: p.discrepancyReason || null,
        notes: p.notes || null,
        createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
        items: {
          create: (p.items || []).map((it: any, i: number) => ({
            id: it.id ? `${p.id}-I${i}` : undefined,
            name: it.name,
            category: it.category || 'Sayuran',
            quantity: Number(it.quantity) || 0,
            unit: it.unit || 'Kg',
            unitPrice: Number(it.unitPrice) || 0,
            subtotal: Number(it.subtotal) || 0,
            isOcrMatched: it.isOcrMatched !== false,
            isItemVerified: !!it.isItemVerified,
            hasPriceAnomaly: !!it.hasPriceAnomaly,
            previousAvgPrice: it.previousAvgPrice != null ? Number(it.previousAvgPrice) : null,
          })),
        },
      },
    });
  }

  console.log('→ Dana masuk / pagu kas');
  for (const b of s.budgetAllocations || []) {
    await prisma.budgetAllocation.create({
      data: {
        id: b.id,
        sppgUnitId: b.sppgUnitId,
        fiscalPeriod: b.fiscalPeriod || '-',
        amountAllocated: Number(b.amountAllocated) || 0,
        amountRealized: Number(b.amountRealized) || 0,
        remainingBudget: Number(b.remainingBudget) || 0,
        allocatedDate: b.allocatedDate ? new Date(b.allocatedDate) : new Date(),
        notes: b.notes || null,
      },
    });
  }

  console.log('→ Mutasi stok');
  for (const l of s.stockLedgers || []) {
    await prisma.stockMovement.create({
      data: {
        id: l.id,
        timestamp: l.timestamp ? new Date(l.timestamp) : new Date(),
        sppgUnitId: l.sppgUnitId,
        ingredientId: l.ingredientId,
        type: (l.type as MovementType) || MovementType.MASUK,
        quantity: Number(l.quantity) || 0,
        unit: l.unit || 'Kg',
        referenceNumber: l.referenceNumber || '-',
        purpose: l.purpose || '-',
        recordedBy: l.recordedBy || '-',
        remainingStockAfter: Number(l.remainingStockAfter) || 0,
      },
    });
  }

  const after = {
    sppgUnit: await prisma.sppgUnit.count(),
    ingredientCategory: await prisma.ingredientCategory.count(),
    masterUnit: await prisma.masterUnit.count(),
    employee: await prisma.employee.count(),
    supplier: await prisma.supplier.count(),
    ingredient: await prisma.ingredient.count(),
    procurementOrder: await prisma.procurementOrder.count(),
    procurementItem: await prisma.procurementItem.count(),
    budgetAllocation: await prisma.budgetAllocation.count(),
    stockMovement: await prisma.stockMovement.count(),
  };
  console.log('\nSelesai. Isi tabel sekarang:', after);
}

main()
  .catch((e) => {
    console.error('GAGAL:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
