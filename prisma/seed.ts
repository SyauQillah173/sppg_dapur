import { PrismaClient, MovementType, AuditStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding database Neon PostgreSQL GiziFlow Enterprise...');

  // 1. Bersihkan tabel dalam urutan aman (jika ada data lama)
  try {
    await prisma.procurementItem.deleteMany();
    await prisma.procurementOrder.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.budgetAllocation.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.ingredient.deleteMany();
    await prisma.ingredientCategory.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.sppgUnit.deleteMany();
  } catch (e) {
    console.log('Tabel awal bersih / belum ada relasi:', e);
  }

  // 2. Masukkan 4 SPPG Units Mandatori
  console.log('🏢 Menambahkan 4 Unit SPPG Mandatori...');
  const sppgAA02 = await prisma.sppgUnit.create({
    data: {
      code: 'SPPG-AA02',
      name: 'SPPG ABAR ABIR 02',
      shortName: 'Abar Abir 02',
      location: 'Jl. Raya Abar Abir No. 12, Manyar, Gresik',
      picName: 'Budi Santoso',
      phone: '0812-3456-7890',
      activeBudget: 250000000,
      totalRealized: 168450000,
      totalRemaining: 81550000,
    },
  });

  const sppgBS02 = await prisma.sppgUnit.create({
    data: {
      code: 'SPPG-BS02',
      name: 'SPPG BANJARSARI 02 LERAN MANYAR',
      shortName: 'Banjarsari 02 Leran Manyar',
      location: 'Desa Banjarsari - Leran, Kec. Manyar, Gresik',
      picName: 'Siti Rahmawati',
      phone: '0813-9876-5432',
      activeBudget: 220000000,
      totalRealized: 149200000,
      totalRemaining: 70800000,
    },
  });

  const sppgDR01 = await prisma.sppgUnit.create({
    data: {
      code: 'SPPG-DR01',
      name: 'SPPG DAHAN REJO 01',
      shortName: 'Dahan Rejo 01',
      location: 'Jl. Pemuda No. 45, Dahan Rejo, Kec. Kebomas, Gresik',
      picName: 'Hendra Wijaya',
      phone: '0821-4567-8901',
      activeBudget: 200000000,
      totalRealized: 132600000,
      totalRemaining: 67400000,
    },
  });

  const sppgSM01 = await prisma.sppgUnit.create({
    data: {
      code: 'SPPG-SM01',
      name: 'SPPG SEMAMPIR',
      shortName: 'Semampir',
      location: 'Kawasan Sentra Dapur Semampir No. 08, Gresik',
      picName: 'Agus Prasetyo',
      phone: '0857-1234-5678',
      activeBudget: 180000000,
      totalRealized: 112150000,
      totalRemaining: 67850000,
    },
  });

  // 3. Masukkan Kategori Bahan Makanan
  console.log('🏷️ Menambahkan Kategori Bahan...');
  const catHewani = await prisma.ingredientCategory.create({
    data: {
      code: 'PRO-HEW',
      name: 'Protein Hewani',
      color: '#ef4444',
      description: 'Daging ayam segar, telur, olahan daging dan ikan',
    },
  });

  const catNabati = await prisma.ingredientCategory.create({
    data: {
      code: 'PRO-NAB',
      name: 'Protein Nabati',
      color: '#f97316',
      description: 'Kacang tanah, tahu, tempe, dan polong-polongan',
    },
  });

  const catSayuran = await prisma.ingredientCategory.create({
    data: {
      code: 'SAYUR',
      name: 'Sayuran',
      color: '#10b981',
      description: 'Sayuran hijau, tomat, selada, bawang bombai, dan daun bawang',
    },
  });

  const catBuah = await prisma.ingredientCategory.create({
    data: {
      code: 'BUAH',
      name: 'Buah-buahan',
      color: '#eab308',
      description: 'Melon, pisang, dan buah segar pelengkap nutrisi',
    },
  });

  const catBumbu = await prisma.ingredientCategory.create({
    data: {
      code: 'BUMBU',
      name: 'Bumbu & Saus',
      color: '#8b5cf6',
      description: 'Rempah bubuk, saus sachet, knorr, garam, dan minyak wijen',
    },
  });

  const catSembako = await prisma.ingredientCategory.create({
    data: {
      code: 'SEMBAKO',
      name: 'Sembako & Tepung',
      color: '#0284c7',
      description: 'Beras, tepung panir, tepung terigu, gula, dan mentega',
    },
  });

  // 4. Masukkan Rekanan CV / Suppliers
  console.log('🏢 Menambahkan CV / Supplier...');
  const supSPA = await prisma.supplier.create({
    data: {
      code: 'CV-SPA-01',
      name: 'CV Sumber Pangan Abadi',
      picName: 'H. Sudirman Santoso',
      phone: '0811-2345-6789',
      address: 'Kawasan Pergudangan Manyar Mas Blok C-12, Gresik',
      bankAccount: 'Bank Mandiri 142-00-9876543-1 an CV Sumber Pangan Abadi',
      suppliedCategory: 'Protein Hewani, Sembako & Tepung',
      totalDisbursed: 215400000,
      totalTransactions: 14,
      rating: 4.9,
    },
  });

  const supBSL = await prisma.supplier.create({
    data: {
      code: 'CV-BSL-02',
      name: 'CV Berkah Sayur Leran Manyar',
      picName: 'Ibu Hj. Aminah',
      phone: '0812-9876-1234',
      address: 'Pasar Tradisional Leran Kios 04-06, Manyar',
      bankAccount: 'Bank Jatim 028-11-23456 an Berkah Sayur Leran',
      suppliedCategory: 'Sayuran, Buah-buahan',
      totalDisbursed: 142800000,
      totalTransactions: 12,
      rating: 4.8,
    },
  });

  const supDRM = await prisma.supplier.create({
    data: {
      code: 'CV-DRM-03',
      name: 'CV Dahan Rejo Mandiri Sejahtera',
      picName: 'Kuswanto Broto',
      phone: '0813-3344-5566',
      address: 'Kavling Sentra Niaga Dahan Rejo No. 19, Kebomas',
      bankAccount: 'BCA 788-0912-331 an CV Dahan Rejo Mandiri',
      suppliedCategory: 'Bumbu & Saus, Sembako',
      totalDisbursed: 98750000,
      totalTransactions: 9,
      rating: 4.7,
    },
  });

  const supSPF = await prisma.supplier.create({
    data: {
      code: 'CV-SPF-04',
      name: 'CV Semampir Fresh Poultry',
      picName: 'drh. Ridwan Hakim',
      phone: '0822-8899-0011',
      address: 'Jl. Sentra Ternak Semampir Barat Kav. 7, Gresik',
      bankAccount: 'BRI 0018-01-002345-50-8 an CV Semampir Fresh',
      suppliedCategory: 'Protein Hewani (Ayam & Telur)',
      totalDisbursed: 105450000,
      totalTransactions: 8,
      rating: 5.0,
    },
  });

  // 5. Masukkan Pegawai / Peminta Belanja
  console.log('👥 Menambahkan Karyawan Dapur...');
  const empBudi = await prisma.employee.create({
    data: {
      employeeNumber: 'EMP-AA02-01',
      name: 'Budi Santoso',
      roleTitle: 'Koordinator Pengadaan & Logistik Dapur',
      sppgUnitId: sppgAA02.id,
      phone: '0812-3456-7890',
      totalRequested: 250000000,
      totalRealized: 168450000,
      pendingBalance: 2150000,
      complianceScore: 98,
    },
  });

  const empSiti = await prisma.employee.create({
    data: {
      employeeNumber: 'EMP-BS02-01',
      name: 'Siti Rahmawati',
      roleTitle: 'Kepala Bagian Pembelanjaan',
      sppgUnitId: sppgBS02.id,
      phone: '0813-9876-5432',
      totalRequested: 220000000,
      totalRealized: 149200000,
      pendingBalance: 1450000,
      complianceScore: 100,
    },
  });

  const empHendra = await prisma.employee.create({
    data: {
      employeeNumber: 'EMP-DR01-01',
      name: 'Hendra Wijaya',
      roleTitle: 'Manajer Logistik Dapur',
      sppgUnitId: sppgDR01.id,
      phone: '0821-4567-8901',
      totalRequested: 200000000,
      totalRealized: 132600000,
      pendingBalance: 850000,
      complianceScore: 95,
    },
  });

  const empAgus = await prisma.employee.create({
    data: {
      employeeNumber: 'EMP-SM01-01',
      name: 'Agus Prasetyo',
      roleTitle: 'Petugas Belanja Bahan Harian',
      sppgUnitId: sppgSM01.id,
      phone: '0857-1234-5678',
      totalRequested: 180000000,
      totalRealized: 112150000,
      pendingBalance: 3200000,
      complianceScore: 92,
    },
  });

  // 6. Masukkan Alokasi Pagu Anggaran
  console.log('💰 Menambahkan Alokasi Pagu Anggaran...');
  await prisma.budgetAllocation.createMany({
    data: [
      { sppgUnitId: sppgAA02.id, fiscalPeriod: 'Oktober 2026', amountAllocated: 250000000, amountRealized: 168450000, remainingBudget: 81550000, notes: 'Pagu Makan Siang Bergizi SPPG Abar Abir 02' },
      { sppgUnitId: sppgBS02.id, fiscalPeriod: 'Oktober 2026', amountAllocated: 220000000, amountRealized: 149200000, remainingBudget: 70800000, notes: 'Pagu Makan Siang Bergizi SPPG Banjarsari 02 Leran' },
      { sppgUnitId: sppgDR01.id, fiscalPeriod: 'Oktober 2026', amountAllocated: 200000000, amountRealized: 132600000, remainingBudget: 67400000, notes: 'Pagu Makan Siang Bergizi SPPG Dahan Rejo 01' },
      { sppgUnitId: sppgSM01.id, fiscalPeriod: 'Oktober 2026', amountAllocated: 180000000, amountRealized: 112150000, remainingBudget: 67850000, notes: 'Pagu Makan Siang Bergizi SPPG Semampir' },
    ],
  });

  // 7. Masukkan EXACT 20 Real Client Items
  console.log('📦 Menambahkan 20 Bahan Makanan Riil Klien...');
  const clientIngredients = [
    { code: 'ING-PRO-001', name: 'Ayam giling', categoryId: catHewani.id, defaultUnit: 'Kg', currentStock: 145, minStockAlert: 30, lastPurchasePrice: 42000, dist: { 'SPPG-AA02': 45, 'SPPG-BS02': 40, 'SPPG-DR01': 35, 'SPPG-SM01': 25 } },
    { code: 'ING-PRO-002', name: 'Kacang tanah', categoryId: catNabati.id, defaultUnit: 'Kg', currentStock: 70, minStockAlert: 15, lastPurchasePrice: 32000, dist: { 'SPPG-AA02': 25, 'SPPG-BS02': 20, 'SPPG-DR01': 15, 'SPPG-SM01': 10 } },
    { code: 'ING-SAY-001', name: 'Selada', categoryId: catSayuran.id, defaultUnit: 'Kg', currentStock: 25, minStockAlert: 10, lastPurchasePrice: 24000, dist: { 'SPPG-AA02': 10, 'SPPG-BS02': 8, 'SPPG-DR01': 4, 'SPPG-SM01': 3 } },
    { code: 'ING-SAY-002', name: 'Tomat', categoryId: catSayuran.id, defaultUnit: 'Kg', currentStock: 15, minStockAlert: 8, lastPurchasePrice: 14000, dist: { 'SPPG-AA02': 5, 'SPPG-BS02': 5, 'SPPG-DR01': 3, 'SPPG-SM01': 2 } },
    { code: 'ING-BUA-001', name: 'Melon', categoryId: catBuah.id, defaultUnit: 'Kg', currentStock: 235, minStockAlert: 50, lastPurchasePrice: 16500, dist: { 'SPPG-AA02': 80, 'SPPG-BS02': 65, 'SPPG-DR01': 50, 'SPPG-SM01': 40 } },
    { code: 'ING-PRO-003', name: 'Telur horn', categoryId: catHewani.id, defaultUnit: 'Kg', currentStock: 5, minStockAlert: 10, lastPurchasePrice: 28000, dist: { 'SPPG-AA02': 2, 'SPPG-BS02': 1, 'SPPG-DR01': 1, 'SPPG-SM01': 1 } },
    { code: 'ING-BUM-001', name: 'Saus tomat sachet', categoryId: catBumbu.id, defaultUnit: 'Pack', currentStock: 57, minStockAlert: 15, lastPurchasePrice: 18500, dist: { 'SPPG-AA02': 20, 'SPPG-BS02': 17, 'SPPG-DR01': 12, 'SPPG-SM01': 8 } },
    { code: 'ING-BUM-002', name: 'Saus sambal sachet', categoryId: catBumbu.id, defaultUnit: 'Pack', currentStock: 40, minStockAlert: 15, lastPurchasePrice: 19500, dist: { 'SPPG-AA02': 15, 'SPPG-BS02': 12, 'SPPG-DR01': 8, 'SPPG-SM01': 5 } },
    { code: 'ING-SEM-001', name: 'Tepung panir', categoryId: catSembako.id, defaultUnit: 'Karung', currentStock: 3, minStockAlert: 1, lastPurchasePrice: 285000, dist: { 'SPPG-AA02': 1, 'SPPG-BS02': 1, 'SPPG-DR01': 1, 'SPPG-SM01': 0 } },
    { code: 'ING-SAY-003', name: 'Bawang bombai', categoryId: catSayuran.id, defaultUnit: 'Kg', currentStock: 5, minStockAlert: 3, lastPurchasePrice: 32000, dist: { 'SPPG-AA02': 2, 'SPPG-BS02': 1, 'SPPG-DR01': 1, 'SPPG-SM01': 1 } },
    { code: 'ING-BUM-003', name: 'Saus tiram lee kum kee', categoryId: catBumbu.id, defaultUnit: 'Botol', currentStock: 2, minStockAlert: 1, lastPurchasePrice: 48000, dist: { 'SPPG-AA02': 1, 'SPPG-BS02': 1, 'SPPG-DR01': 0, 'SPPG-SM01': 0 } },
    { code: 'ING-BUM-004', name: 'Ladaku lada bubuk', categoryId: catBumbu.id, defaultUnit: 'Renteng', currentStock: 6, minStockAlert: 2, lastPurchasePrice: 12000, dist: { 'SPPG-AA02': 2, 'SPPG-BS02': 2, 'SPPG-DR01': 1, 'SPPG-SM01': 1 } },
    { code: 'ING-BUM-005', name: 'Bawang putih bubuk desaku', categoryId: catBumbu.id, defaultUnit: 'Renteng', currentStock: 3, minStockAlert: 2, lastPurchasePrice: 12500, dist: { 'SPPG-AA02': 1, 'SPPG-BS02': 1, 'SPPG-DR01': 1, 'SPPG-SM01': 0 } },
    { code: 'ING-BUM-006', name: 'Knorr', categoryId: catBumbu.id, defaultUnit: 'Kg', currentStock: 4, minStockAlert: 2, lastPurchasePrice: 65000, dist: { 'SPPG-AA02': 1, 'SPPG-BS02': 1, 'SPPG-DR01': 1, 'SPPG-SM01': 1 } },
    { code: 'ING-SEM-002', name: 'Gula', categoryId: catSembako.id, defaultUnit: 'Kg', currentStock: 3, minStockAlert: 2, lastPurchasePrice: 18000, dist: { 'SPPG-AA02': 1, 'SPPG-BS02': 1, 'SPPG-DR01': 1, 'SPPG-SM01': 0 } },
    { code: 'ING-BUM-007', name: 'Garam', categoryId: catBumbu.id, defaultUnit: 'Kg', currentStock: 2, minStockAlert: 1, lastPurchasePrice: 6000, dist: { 'SPPG-AA02': 1, 'SPPG-BS02': 0.5, 'SPPG-DR01': 0.5, 'SPPG-SM01': 0 } },
    { code: 'ING-SEM-003', name: 'Tepung terigu', categoryId: catSembako.id, defaultUnit: 'Kg', currentStock: 15, minStockAlert: 5, lastPurchasePrice: 13000, dist: { 'SPPG-AA02': 5, 'SPPG-BS02': 4, 'SPPG-DR01': 3, 'SPPG-SM01': 3 } },
    { code: 'ING-SEM-004', name: 'Mentega', categoryId: catSembako.id, defaultUnit: 'Kg', currentStock: 3, minStockAlert: 1, lastPurchasePrice: 28000, dist: { 'SPPG-AA02': 1, 'SPPG-BS02': 1, 'SPPG-DR01': 1, 'SPPG-SM01': 0 } },
    { code: 'ING-BUM-008', name: 'Minyak wijen 620ml', categoryId: catBumbu.id, defaultUnit: 'Botol', currentStock: 2, minStockAlert: 1, lastPurchasePrice: 58000, dist: { 'SPPG-AA02': 1, 'SPPG-BS02': 1, 'SPPG-DR01': 0, 'SPPG-SM01': 0 } },
    { code: 'ING-SAY-004', name: 'Daun bawang', categoryId: catSayuran.id, defaultUnit: 'Kg', currentStock: 2, minStockAlert: 1, lastPurchasePrice: 22000, dist: { 'SPPG-AA02': 1, 'SPPG-BS02': 0.5, 'SPPG-DR01': 0.5, 'SPPG-SM01': 0 } },
  ];

  const createdIngredients: Record<string, any> = {};
  for (const item of clientIngredients) {
    const created = await prisma.ingredient.create({
      data: {
        code: item.code,
        name: item.name,
        categoryId: item.categoryId,
        defaultUnit: item.defaultUnit,
        currentStock: item.currentStock,
        minStockAlert: item.minStockAlert,
        lastPurchasePrice: item.lastPurchasePrice,
        sppgDistribution: item.dist,
      },
    });
    createdIngredients[item.name] = created;
  }

  // 8. Masukkan Contoh Transaksi Pengadaan Ratusan Juta Rupiah (ProcurementOrder)
  console.log('🧾 Menambahkan Transaksi Belanja Ratusan Juta Rupiah...');
  const order1 = await prisma.procurementOrder.create({
    data: {
      receiptNumber: 'NOTA-AA02-20261014-089',
      date: new Date('2026-10-14'),
      sppgUnitId: sppgAA02.id,
      requesterId: empBudi.id,
      supplierId: supSPA.id,
      amountRequested: 150000000,
      actualReceiptTotal: 147850000,
      changeReturned: 2150000,
      status: AuditStatus.VERIFIED,
      receiptPhotoUrl: '/receipts/nota-sample-01.webp',
      physicalReceiptImage: 'PHYSICAL_RECEIPT_01',
      auditedBy: 'Drs. Supriyanto, Ak., CA',
      auditedAt: new Date('2026-10-15T10:14:00Z'),
      auditNotes: 'Fisik nota asli bercap basah CV Sumber Pangan Abadi telah dicocokkan dengan timbangan gudang. Sisa kas Rp 2.150.000 telah disetor tunai ke kasir.',
      notes: 'Pengadaan bahan baku segar & sembako untuk siklus menu siswa minggu ke-2 Oktober.',
    },
  });

  // Items untuk order 1
  await prisma.procurementItem.createMany({
    data: [
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Ayam giling']?.id, name: 'Ayam giling', category: 'Protein Hewani', quantity: 145, unit: 'Kg', unitPrice: 42000, subtotal: 6090000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Melon']?.id, name: 'Melon', category: 'Buah-buahan', quantity: 235, unit: 'Kg', unitPrice: 16500, subtotal: 3877500, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Kacang tanah']?.id, name: 'Kacang tanah', category: 'Protein Nabati', quantity: 70, unit: 'Kg', unitPrice: 32000, subtotal: 2240000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Selada']?.id, name: 'Selada', category: 'Sayuran', quantity: 25, unit: 'Kg', unitPrice: 24000, subtotal: 600000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Tomat']?.id, name: 'Tomat', category: 'Sayuran', quantity: 15, unit: 'Kg', unitPrice: 14000, subtotal: 210000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Telur horn']?.id, name: 'Telur horn', category: 'Protein Hewani', quantity: 5, unit: 'Kg', unitPrice: 28000, subtotal: 140000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Saus tomat sachet']?.id, name: 'Saus tomat sachet', category: 'Bumbu & Saus', quantity: 57, unit: 'Pack', unitPrice: 18500, subtotal: 1054500, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Saus sambal sachet']?.id, name: 'Saus sambal sachet', category: 'Bumbu & Saus', quantity: 40, unit: 'Pack', unitPrice: 19500, subtotal: 780000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Tepung panir']?.id, name: 'Tepung panir', category: 'Sembako & Tepung', quantity: 3, unit: 'Karung', unitPrice: 285000, subtotal: 855000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Bawang bombai']?.id, name: 'Bawang bombai', category: 'Sayuran', quantity: 5, unit: 'Kg', unitPrice: 32000, subtotal: 160000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Saus tiram lee kum kee']?.id, name: 'Saus tiram lee kum kee', category: 'Bumbu & Saus', quantity: 2, unit: 'Botol', unitPrice: 48000, subtotal: 96000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Ladaku lada bubuk']?.id, name: 'Ladaku lada bubuk', category: 'Bumbu & Saus', quantity: 6, unit: 'Renteng', unitPrice: 12000, subtotal: 72000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Bawang putih bubuk desaku']?.id, name: 'Bawang putih bubuk desaku', category: 'Bumbu & Saus', quantity: 3, unit: 'Renteng', unitPrice: 12500, subtotal: 37500, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Knorr']?.id, name: 'Knorr', category: 'Bumbu & Saus', quantity: 4, unit: 'Kg', unitPrice: 65000, subtotal: 260000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Gula']?.id, name: 'Gula', category: 'Sembako & Tepung', quantity: 3, unit: 'Kg', unitPrice: 18000, subtotal: 54000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Garam']?.id, name: 'Garam', category: 'Bumbu & Saus', quantity: 2, unit: 'Kg', unitPrice: 6000, subtotal: 12000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Tepung terigu']?.id, name: 'Tepung terigu', category: 'Sembako & Tepung', quantity: 15, unit: 'Kg', unitPrice: 13000, subtotal: 195000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Mentega']?.id, name: 'Mentega', category: 'Sembako & Tepung', quantity: 3, unit: 'Kg', unitPrice: 28000, subtotal: 84000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Minyak wijen 620ml']?.id, name: 'Minyak wijen 620ml', category: 'Bumbu & Saus', quantity: 2, unit: 'Botol', unitPrice: 58000, subtotal: 116000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, ingredientId: createdIngredients['Daun bawang']?.id, name: 'Daun bawang', category: 'Sayuran', quantity: 2, unit: 'Kg', unitPrice: 22000, subtotal: 44000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, name: 'Beras Premium Ramos (50 Kg)', category: 'Sembako & Tepung', quantity: 180, unit: 'Karung', unitPrice: 675000, subtotal: 121500000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order1.id, name: 'Minyak Goreng Sawit 18L', category: 'Sembako & Tepung', quantity: 35, unit: 'Pack', unitPrice: 270000, subtotal: 9450000, isItemVerified: true, hasPriceAnomaly: false },
    ],
  });

  // Order 2 untuk SPPG Banjarsari
  const order2 = await prisma.procurementOrder.create({
    data: {
      receiptNumber: 'NOTA-BS02-20261015-042',
      date: new Date('2026-10-15'),
      sppgUnitId: sppgBS02.id,
      requesterId: empSiti.id,
      supplierId: supBSL.id,
      amountRequested: 75000000,
      actualReceiptTotal: 73550000,
      changeReturned: 1450000,
      status: AuditStatus.PENDING_AUDIT,
      receiptPhotoUrl: '/receipts/nota-sample-02.webp',
      physicalReceiptImage: 'PHYSICAL_RECEIPT_02',
      notes: 'Pasokan sayur segar harian dan buah melon untuk dapur SPPG Banjarsari.',
    },
  });

  await prisma.procurementItem.createMany({
    data: [
      { procurementOrderId: order2.id, ingredientId: createdIngredients['Melon']?.id, name: 'Melon', category: 'Buah-buahan', quantity: 65, unit: 'Kg', unitPrice: 16500, subtotal: 1072500, isItemVerified: false, hasPriceAnomaly: false },
      { procurementOrderId: order2.id, ingredientId: createdIngredients['Kacang tanah']?.id, name: 'Kacang tanah', category: 'Protein Nabati', quantity: 20, unit: 'Kg', unitPrice: 32000, subtotal: 640000, isItemVerified: false, hasPriceAnomaly: false },
      { procurementOrderId: order2.id, name: 'Paket Logistik Dapur Terpadu Banjarsari', category: 'Sembako & Tepung', quantity: 1, unit: 'Pack', unitPrice: 71837500, subtotal: 71837500, isItemVerified: false, hasPriceAnomaly: false },
    ],
  });

  // Order 3 dengan Anomali Harga untuk demonstrasi Audit Admin 2
  const order3 = await prisma.procurementOrder.create({
    data: {
      receiptNumber: 'NOTA-SM01-20261015-099',
      date: new Date('2026-10-15'),
      sppgUnitId: sppgSM01.id,
      requesterId: empAgus.id,
      supplierId: supSPF.id,
      amountRequested: 50000000,
      actualReceiptTotal: 46800000,
      changeReturned: 3200000,
      status: AuditStatus.FLAGGED_DISCREPANCY,
      receiptPhotoUrl: '/receipts/nota-sample-04.webp',
      physicalReceiptImage: 'PHYSICAL_RECEIPT_04',
      auditedBy: 'Drs. Supriyanto, Ak., CA',
      auditedAt: new Date('2026-10-15T15:30:00Z'),
      auditNotes: 'Terdapat anomali kenaikan harga telur horn (+28.5% dibanding harga patokan Rp 28.000/Kg). Perlu klarifikasi nota fisik.',
      discrepancyReason: 'Kenaikan harga satuan Telur Horn melebihi toleransi wajar (+28.5%).',
      notes: 'Pengadaan telur dan unggas SPPG Semampir.',
    },
  });

  await prisma.procurementItem.createMany({
    data: [
      { procurementOrderId: order3.id, ingredientId: createdIngredients['Telur horn']?.id, name: 'Telur horn', category: 'Protein Hewani', quantity: 300, unit: 'Kg', unitPrice: 36000, subtotal: 10800000, isItemVerified: false, hasPriceAnomaly: true, previousAvgPrice: 28000 },
      { procurementOrderId: order3.id, ingredientId: createdIngredients['Ayam giling']?.id, name: 'Ayam giling', category: 'Protein Hewani', quantity: 850, unit: 'Kg', unitPrice: 42000, subtotal: 35700000, isItemVerified: true, hasPriceAnomaly: false },
      { procurementOrderId: order3.id, name: 'Bumbu Pelengkap Dapur', category: 'Bumbu & Saus', quantity: 1, unit: 'Pack', unitPrice: 300000, subtotal: 300000, isItemVerified: true, hasPriceAnomaly: false },
    ],
  });

  // 9. Masukkan Mutasi Stok Keluar-Masuk Dapur (StockMovement)
  console.log('📊 Menambahkan Mutasi Stok Dapur...');
  await prisma.stockMovement.createMany({
    data: [
      { sppgUnitId: sppgAA02.id, ingredientId: createdIngredients['Ayam giling']?.id, type: MovementType.MASUK, quantity: 80, unit: 'Kg', referenceNumber: 'NOTA-AA02-20261014-089', purpose: 'Penerimaan Belanja CV Sumber Pangan Abadi', recordedBy: 'Budi Santoso', remainingStockAfter: 80 },
      { sppgUnitId: sppgAA02.id, ingredientId: createdIngredients['Ayam giling']?.id, type: MovementType.KELUAR, quantity: 35, unit: 'Kg', referenceNumber: 'MENU-AA02-20261015-SIANG', purpose: 'Menu Makan Siang Siswa: Bola Ayam Asam Manis (1.200 Porsi)', recordedBy: 'Dewi Lestari (Juru Masak)', remainingStockAfter: 45 },
      { sppgUnitId: sppgBS02.id, ingredientId: createdIngredients['Melon']?.id, type: MovementType.KELUAR, quantity: 45, unit: 'Kg', referenceNumber: 'MENU-BS02-20261015-FRUIT', purpose: 'Porsi Buah Potong Segar Siswa Shift 1 & 2', recordedBy: 'Ahmad Fauzi', remainingStockAfter: 65 },
    ],
  });

  console.log('✅ Seeding database Neon PostgreSQL selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('❌ Gagal melakukan seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
