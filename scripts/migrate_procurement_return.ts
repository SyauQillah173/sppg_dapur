import prisma from '../src/lib/prisma';

async function migrate() {
  console.log('🔄 Menambahkan kolom pengembalian sisa kas ke PostgreSQL...');
  const sqls = [
    `ALTER TABLE "procurement_orders" ADD COLUMN IF NOT EXISTS "isChangeReturned" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "procurement_orders" ADD COLUMN IF NOT EXISTS "returnProofUrl" TEXT`,
    `ALTER TABLE "procurement_orders" ADD COLUMN IF NOT EXISTS "returnedAt" TIMESTAMP(3)`,
    `ALTER TABLE "procurement_orders" ADD COLUMN IF NOT EXISTS "returnedBy" TEXT`,
    `ALTER TABLE "procurement_orders" ADD COLUMN IF NOT EXISTS "returnedTo" TEXT`,
    `ALTER TABLE "procurement_orders" ADD COLUMN IF NOT EXISTS "returnNotes" TEXT`,
  ];

  for (const sql of sqls) {
    await prisma.$executeRawUnsafe(sql);
  }
  console.log('✅ Berhasil menambahkan kolom pengembalian sisa kas ke procurement_orders!');
}

migrate()
  .catch((e) => {
    console.error('❌ Gagal:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
    process.exit(0);
  });
