import { PrismaClient, UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Menyiapkan Database Bersih untuk Produksi (Clean Seed)...');

  // 1. Bersihkan seluruh transaksi lama
  console.log('🧹 Mengosongkan transaksi pembelanjaan, nota, kas masuk, dan mutasi...');
  try {
    await prisma.procurementItem.deleteMany();
    await prisma.procurementOrder.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.budgetAllocation.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.ingredient.deleteMany();
    await prisma.ingredientCategory.deleteMany();
    await prisma.masterUnit.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.sppgUnit.deleteMany();
    await prisma.adminUser.deleteMany();
  } catch (e) {
    console.log('Info pembersihan:', e);
  }

  // 2. Buat TEPAT 2 Akun Admin Default untuk Login
  //    Password TIDAK ditulis di file ini: repo publik, jadi password ikut ke publik.
  //    Isi lewat env SEED_SUPERADMIN_PASSWORD / SEED_AUDITOR_PASSWORD, atau dibuat acak.
  console.log('🔐 Menambahkan 2 Akun Admin Resmi...');
  const superadminPassword = process.env.SEED_SUPERADMIN_PASSWORD || randomBytes(12).toString('base64url');
  const auditorPassword = process.env.SEED_AUDITOR_PASSWORD || randomBytes(12).toString('base64url');
  await prisma.adminUser.createMany({
    data: [
      {
        username: 'superadmin',
        password: hashPassword(superadminPassword),
        name: 'Abdullah Syauqillah, S.Kom',
        role: UserRole.SUPERADMIN,
      },
      {
        username: 'auditor',
        password: hashPassword(auditorPassword),
        name: 'Drs. Supriyanto, Ak., CA (Admin 2 / Pemantau)',
        role: UserRole.EXECUTIVE_AUDITOR,
      },
    ],
  });
  if (!process.env.SEED_SUPERADMIN_PASSWORD || !process.env.SEED_AUDITOR_PASSWORD) {
    console.log('   Password acak (catat sekarang, tidak akan ditampilkan lagi):');
    console.log('   superadmin :', superadminPassword);
    console.log('   auditor    :', auditorPassword);
  }

  // 3. Masukkan Master Satuan Ukur Standar
  console.log('⚖️ Menambahkan Master Satuan Ukur...');
  await prisma.masterUnit.createMany({
    data: [
      { symbol: 'Kg', name: 'Kilogram', type: 'BERAT' },
      { symbol: 'Pack', name: 'Pack Kemasan', type: 'KEMASAN' },
      { symbol: 'Karung', name: 'Karung Sak', type: 'KEMASAN' },
      { symbol: 'Botol', name: 'Botol Kaca/Plastik', type: 'VOLUME' },
      { symbol: 'Renteng', name: 'Renteng Sachet', type: 'KEMASAN' },
      { symbol: 'Liter', name: 'Liter Cairan', type: 'VOLUME' },
      { symbol: 'Ikat', name: 'Ikat Sayuran', type: 'SATUAN' },
      { symbol: 'Gram', name: 'Gram', type: 'BERAT' },
    ],
  });

  // 4. Masukkan 4 SPPG Units dengan Saldo Transaksi Awal KOSONG (0 Rupiah)
  console.log('🏢 Menambahkan 4 Master Unit SPPG (Saldo Awal Rp 0)...');
  const sppgAA02 = await prisma.sppgUnit.create({
    data: {
      code: 'SPPG-AA02',
      name: 'SPPG ABAR ABIR 02',
      shortName: 'Abar Abir 02',
      location: 'Jl. Raya Abar Abir No. 12, Manyar, Gresik',
      picName: 'Budi Santoso',
      phone: '0812-3456-7890',
      activeBudget: 0,
      totalRealized: 0,
      totalRemaining: 0,
    },
  });

  const sppgBS02 = await prisma.sppgUnit.create({
    data: {
      code: 'SPPG-BS02',
      name: 'SPPG BANJARSARI 02 LERAN MANYAR',
      shortName: 'Banjarsari 02',
      location: 'Desa Banjarsari - Leran, Kec. Manyar, Gresik',
      picName: 'Siti Rahmawati',
      phone: '0813-9876-5432',
      activeBudget: 0,
      totalRealized: 0,
      totalRemaining: 0,
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
      activeBudget: 0,
      totalRealized: 0,
      totalRemaining: 0,
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
      activeBudget: 0,
      totalRealized: 0,
      totalRemaining: 0,
    },
  });

  // 5. Masukkan Kategori Bahan Nutrisi Standar
  console.log('🥗 Menambahkan Kategori Bahan Nutrisi...');
  const catHewani = await prisma.ingredientCategory.create({
    data: {
      code: 'CAT-01',
      name: 'Protein Hewani',
      color: '#ef4444',
      description: 'Daging ayam, sapi, telur, ikan, dan olahan protein hewani',
    },
  });

  const catNabati = await prisma.ingredientCategory.create({
    data: {
      code: 'CAT-02',
      name: 'Protein Nabati',
      color: '#f97316',
      description: 'Kacang-kacangan, tahu, tempe, dan polong-polongan',
    },
  });

  const catSayur = await prisma.ingredientCategory.create({
    data: {
      code: 'CAT-03',
      name: 'Sayuran',
      color: '#22c55e',
      description: 'Sayuran daun, sayuran buah, dan umbi sayur segar',
    },
  });

  const catBuah = await prisma.ingredientCategory.create({
    data: {
      code: 'CAT-04',
      name: 'Buah-buahan',
      color: '#eab308',
      description: 'Buah potong dan buah pencuci mulut siswa',
    },
  });

  const catBumbu = await prisma.ingredientCategory.create({
    data: {
      code: 'CAT-05',
      name: 'Bumbu & Saus',
      color: '#a855f7',
      description: 'Bumbu dapur, rempah bubuk, saus sachet, dan penyedap rasa',
    },
  });

  const catSembako = await prisma.ingredientCategory.create({
    data: {
      code: 'CAT-06',
      name: 'Sembako & Tepung',
      color: '#3b82f6',
      description: 'Beras, tepung terigu, panir, minyak, gula, dan garam',
    },
  });

  // 6. Masukkan 20 Bahan Makanan Klien (Stok Awal = 0 Kg)
  console.log('🌾 Menambahkan 20 Master Bahan Makanan Klien (Stok Awal 0)...');
  const ingredientsData = [
    { code: 'ING-01', name: 'Ayam giling', categoryId: catHewani.id, defaultUnit: 'Kg', price: 42000 },
    { code: 'ING-02', name: 'Kacang tanah', categoryId: catNabati.id, defaultUnit: 'Kg', price: 32000 },
    { code: 'ING-03', name: 'Selada', categoryId: catSayur.id, defaultUnit: 'Kg', price: 18000 },
    { code: 'ING-04', name: 'Tomat', categoryId: catSayur.id, defaultUnit: 'Kg', price: 14000 },
    { code: 'ING-05', name: 'Melon', categoryId: catBuah.id, defaultUnit: 'Kg', price: 16500 },
    { code: 'ING-06', name: 'Telur horn', categoryId: catHewani.id, defaultUnit: 'Kg', price: 28000 },
    { code: 'ING-07', name: 'Saus tomat sachet', categoryId: catBumbu.id, defaultUnit: 'Pack', price: 12500 },
    { code: 'ING-08', name: 'Saus sambal sachet', categoryId: catBumbu.id, defaultUnit: 'Pack', price: 13500 },
    { code: 'ING-09', name: 'Tepung panir', categoryId: catSembako.id, defaultUnit: 'Karung', price: 215000 },
    { code: 'ING-10', name: 'Bawang bombai', categoryId: catBumbu.id, defaultUnit: 'Kg', price: 26000 },
    { code: 'ING-11', name: 'Saus tiram lee kum kee', categoryId: catBumbu.id, defaultUnit: 'Botol', price: 38500 },
    { code: 'ING-12', name: 'Ladaku lada bubuk', categoryId: catBumbu.id, defaultUnit: 'Renteng', price: 14000 },
    { code: 'ING-13', name: 'Bawang putih bubuk desaku', categoryId: catBumbu.id, defaultUnit: 'Renteng', price: 13000 },
    { code: 'ING-14', name: 'Knorr', categoryId: catBumbu.id, defaultUnit: 'Kg', price: 95000 },
    { code: 'ING-15', name: 'Gula', categoryId: catSembako.id, defaultUnit: 'Kg', price: 17500 },
    { code: 'ING-16', name: 'Garam', categoryId: catSembako.id, defaultUnit: 'Kg', price: 8000 },
    { code: 'ING-17', name: 'Tepung terigu', categoryId: catSembako.id, defaultUnit: 'Kg', price: 12000 },
    { code: 'ING-18', name: 'Mentega', categoryId: catSembako.id, defaultUnit: 'Kg', price: 34000 },
    { code: 'ING-19', name: 'Minyak wijen 620ml', categoryId: catBumbu.id, defaultUnit: 'Botol', price: 48000 },
    { code: 'ING-20', name: 'Daun bawang', categoryId: catSayur.id, defaultUnit: 'Kg', price: 22000 },
  ];

  for (const ing of ingredientsData) {
    await prisma.ingredient.create({
      data: {
        code: ing.code,
        name: ing.name,
        categoryId: ing.categoryId,
        defaultUnit: ing.defaultUnit,
        currentStock: 0, // Stok awal bersih 0
        minStockAlert: 5,
        lastPurchasePrice: ing.price,
        sppgDistribution: {
          'SPPG-AA02': 0,
          'SPPG-BS02': 0,
          'SPPG-DR01': 0,
          'SPPG-SM01': 0,
        },
      },
    });
  }

  // 7. Masukkan Rekanan Supplier Standar
  console.log('🏪 Menambahkan Rekanan Supplier (Transaksi 0)...');
  await prisma.supplier.createMany({
    data: [
      {
        code: 'CV-SPA-01',
        name: 'CV Sumber Pangan Abadi',
        picName: 'H. Sudirman',
        phone: '0811-2233-4455',
        address: 'Jl. Raya Veteran No. 102, Gresik',
        bankAccount: 'BCA 1234567890 a/n CV Sumber Pangan Abadi',
        suppliedCategory: 'Protein Hewani, Sembako & Tepung',
        totalDisbursed: 0,
        totalTransactions: 0,
      },
      {
        code: 'CV-BMS-02',
        name: 'CV Berkah Makmur Sejahtera',
        picName: 'Hj. Endang',
        phone: '0812-3344-5566',
        address: 'Kompleks Pasar Grosir Gresik Blok B-12',
        bankAccount: 'Mandiri 1420009876543 a/n CV Berkah Makmur',
        suppliedCategory: 'Sayuran, Buah-buahan & Bumbu Dapur',
        totalDisbursed: 0,
        totalTransactions: 0,
      },
    ],
  });

  // 8. Masukkan Master Karyawan Peminta Belanja
  console.log('👷 Menambahkan Master Karyawan Peminta Belanja (Saldo 0)...');
  await prisma.employee.createMany({
    data: [
      {
        employeeNumber: 'EMP-AA02-01',
        name: 'Budi Santoso',
        roleTitle: 'Koordinator Pengadaan & Logistik Dapur',
        sppgUnitId: sppgAA02.id,
        phone: '0812-3456-7890',
        totalRequested: 0,
        totalRealized: 0,
        pendingBalance: 0,
        complianceScore: 100,
      },
      {
        employeeNumber: 'EMP-BS02-01',
        name: 'Siti Rahmawati',
        roleTitle: 'Koordinator Pengadaan Dapur',
        sppgUnitId: sppgBS02.id,
        phone: '0813-9876-5432',
        totalRequested: 0,
        totalRealized: 0,
        pendingBalance: 0,
        complianceScore: 100,
      },
      {
        employeeNumber: 'EMP-DR01-01',
        name: 'Hendra Wijaya',
        roleTitle: 'Kepala Bagian Pembelanjaan',
        sppgUnitId: sppgDR01.id,
        phone: '0821-4567-8901',
        totalRequested: 0,
        totalRealized: 0,
        pendingBalance: 0,
        complianceScore: 100,
      },
      {
        employeeNumber: 'EMP-SM01-01',
        name: 'Agus Prasetyo',
        roleTitle: 'Penanggung Jawab Belanja & Logistik',
        sppgUnitId: sppgSM01.id,
        phone: '0857-1234-5678',
        totalRequested: 0,
        totalRealized: 0,
        pendingBalance: 0,
        complianceScore: 100,
      },
    ],
  });

  console.log('✅ DATABASE BERHASIL DI-RESET BERSIH!');
  console.log('📊 Status Data:');
  console.log('- Total Akun Login: 2 Akun (superadmin & auditor)');
  console.log('- Transaksi Belanja & Nota: 0 (Kosong Bersih)');
  console.log('- Alokasi Pagu Kas Masuk: 0 (Kosong Bersih)');
  console.log('- Riwayat Mutasi Masak: 0 (Kosong Bersih)');
  console.log('- Master CMS Siap Pakai: 4 SPPG, 6 Kategori, 8 Satuan, 20 Bahan Klien (Stok 0 Kg)');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
