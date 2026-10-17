import prisma from '../src/lib/prisma';

export const BENCHMARK_INGREDIENTS = [
  { code: 'ING-PRO-001', name: 'Ayam giling', price: 42000, stock: 50 },
  { code: 'ING-PRO-002', name: 'Kacang tanah', price: 32000, stock: 50 },
  { code: 'ING-PRO-003', name: 'Telur horn', price: 28000, stock: 50 },
  { code: 'ING-SAY-001', name: 'Selada', price: 20000, stock: 50 },
  { code: 'ING-SAY-002', name: 'Tomat', price: 14000, stock: 50 },
  { code: 'ING-SAY-003', name: 'Bawang bombai', price: 28000, stock: 50 },
  { code: 'ING-SAY-004', name: 'Daun bawang', price: 22000, stock: 50 },
  { code: 'ING-BUA-001', name: 'Melon', price: 16500, stock: 50 },
  { code: 'ING-BUM-001', name: 'Saus tomat sachet', price: 14500, stock: 50 },
  { code: 'ING-BUM-002', name: 'Saus sambal sachet', price: 15500, stock: 50 },
  { code: 'ING-BUM-003', name: 'Saus tiram lee kum kee', price: 42000, stock: 50 },
  { code: 'ING-BUM-004', name: 'Ladaku lada bubuk', price: 12500, stock: 50 },
  { code: 'ING-BUM-005', name: 'Bawang putih bubuk desaku', price: 13000, stock: 50 },
  { code: 'ING-BUM-006', name: 'Knorr', price: 88000, stock: 50 },
  { code: 'ING-BUM-007', name: 'Garam', price: 7500, stock: 50 },
  { code: 'ING-BUM-008', name: 'Minyak wijen 620ml', price: 48000, stock: 50 },
  { code: 'ING-SEM-001', name: 'Tepung panir', price: 215000, stock: 50 },
  { code: 'ING-SEM-002', name: 'Gula', price: 17500, stock: 50 },
  { code: 'ING-SEM-003', name: 'Tepung terigu', price: 12000, stock: 50 },
  { code: 'ING-SEM-004', name: 'Mentega', price: 32000, stock: 50 },
];

async function applyBenchmarkPricesAndStock() {
  console.log('🔄 Memperbarui 20 bahan makanan dengan harga pasar acuan & stok 50...');

  const distribution50 = {
    'SPPG-AA02': 15,
    'SPPG-BS02': 15,
    'SPPG-DR01': 10,
    'SPPG-SM01': 10,
  };

  for (const item of BENCHMARK_INGREDIENTS) {
    const updated = await prisma.ingredient.updateMany({
      where: { code: item.code },
      data: {
        currentStock: item.stock,
        lastPurchasePrice: item.price,
        sppgDistribution: distribution50,
      },
    });
    console.log(`✅ [${item.code}] ${item.name}: Stok=${item.stock}, Harga Pasar=Rp ${item.price.toLocaleString('id-ID')}`);
  }

  // Update AppState jika ada
  const appState = await prisma.appState.findUnique({ where: { id: 'singleton' } });
  if (appState && appState.payload) {
    const payload = appState.payload as any;
    if (Array.isArray(payload.ingredients)) {
      payload.ingredients = payload.ingredients.map((ing: any) => {
        const found = BENCHMARK_INGREDIENTS.find(b => b.code === ing.code);
        return {
          ...ing,
          currentStock: found ? found.stock : 50,
          lastPurchasePrice: found ? found.price : 0,
          sppgDistribution: distribution50,
        };
      });
      await prisma.appState.update({
        where: { id: 'singleton' },
        data: { payload },
      });
      console.log('✅ AppState singleton payload.ingredients disinkronkan.');
    }
  }

  console.log('🎉 Selesai! Semua 20 bahan memiliki stok 50 dan estimasi harga pasar resmi.');
}

applyBenchmarkPricesAndStock()
  .catch((e) => {
    console.error('❌ Gagal:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
    process.exit(0);
  });
