import prisma from '../src/lib/prisma';

async function resetStockAndPrices() {
  console.log('🔄 Mengosongkan stok dan harga bahan di PostgreSQL...');

  const cleanDistribution = {
    'SPPG-AA02': 0,
    'SPPG-BS02': 0,
    'SPPG-DR01': 0,
    'SPPG-SM01': 0,
  };

  const updateResult = await prisma.ingredient.updateMany({
    data: {
      currentStock: 0,
      lastPurchasePrice: 0,
      sppgDistribution: cleanDistribution,
    },
  });

  console.log('✅ Berhasil update tabel ingredient:', updateResult.count, 'baris');

  // Bersihkan juga di AppState singleton jika ada
  const appState = await prisma.appState.findUnique({ where: { id: 'singleton' } });
  if (appState && appState.payload) {
    const payload = appState.payload as any;
    if (Array.isArray(payload.ingredients)) {
      payload.ingredients = payload.ingredients.map((ing: any) => ({
        ...ing,
        currentStock: 0,
        lastPurchasePrice: 0,
        sppgDistribution: cleanDistribution,
      }));
      await prisma.appState.update({
        where: { id: 'singleton' },
        data: { payload },
      });
      console.log('✅ AppState singleton payload.ingredients juga berhasil di-nolkan');
    }
  }

  // Verifikasi hasil
  const check = await prisma.ingredient.findMany({
    select: { code: true, name: true, currentStock: true, lastPurchasePrice: true, sppgDistribution: true },
    orderBy: { code: 'asc' },
  });

  console.log('📊 Verifikasi database (Total ' + check.length + ' bahan):');
  for (const item of check) {
    console.log(
      '- [' + item.code + '] ' + item.name + ': Stok=' + item.currentStock + ', Harga=Rp ' + item.lastPurchasePrice + ', Dist=' + JSON.stringify(item.sppgDistribution)
    );
  }
}

resetStockAndPrices()
  .catch((err) => {
    console.error('❌ Gagal:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
    process.exit(0);
  });
