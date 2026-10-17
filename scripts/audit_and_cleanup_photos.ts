import prisma from '../src/lib/prisma';

async function main() {
  const photos = await prisma.notaPhoto.findMany({
    select: { name: true, mime: true, createdAt: true },
  });
  console.log(`📸 Total foto di tabel nota_photos: ${photos.length}`);

  const orders = await prisma.procurementOrder.findMany({
    select: { id: true, receiptNumber: true, receiptPhotoUrl: true, returnProofUrl: true },
  });
  console.log(`🛒 Total pesanan/belanja di DB: ${orders.length}`);

  const budgets = await prisma.budgetAllocation.findMany({
    select: { id: true, notes: true },
  });
  console.log(`💰 Total alokasi anggaran: ${budgets.length}`);

  // Kumpulkan semua nama foto yang valid terhubung ke transaksi aktif
  const usedNames = new Set<string>();

  for (const o of orders) {
    if (o.receiptPhotoUrl) {
      const match = o.receiptPhotoUrl.match(/nota-[^/?"'\s]+\.[a-z0-9]+/i);
      if (match) usedNames.add(match[0]);
    }
    if (o.returnProofUrl) {
      const match = o.returnProofUrl.match(/nota-[^/?"'\s]+\.[a-z0-9]+/i);
      if (match) usedNames.add(match[0]);
    }
  }

  for (const b of budgets) {
    if (b.notes) {
      const matches = b.notes.matchAll(/nota-[^/?"'\s]+\.[a-z0-9]+/gi);
      for (const m of matches) {
        usedNames.add(m[0]);
      }
    }
  }

  console.log(`✅ Foto yang aktif terpakai: ${usedNames.size}`);
  for (const name of usedNames) {
    console.log(`   ✓ Terpakai: ${name}`);
  }

  const orphaned = photos.filter((p) => !usedNames.has(p.name));
  console.log(`🗑️ Foto yatim/sampah (orphaned): ${orphaned.length}`);
  for (const p of orphaned) {
    console.log(`   ❌ Menghapus sampah: ${p.name}`);
  }

  if (orphaned.length > 0) {
    const res = await prisma.notaPhoto.deleteMany({
      where: { name: { in: orphaned.map((p) => p.name) } },
    });
    console.log(`✨ Sukses menghapus ${res.count} foto sampah dari database!`);
  } else {
    console.log(`✨ Database bersih! Tidak ada foto sampah.`);
  }

  const remaining = await prisma.notaPhoto.count();
  console.log(`📊 Sisa foto di tabel nota_photos sekarang: ${remaining}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
