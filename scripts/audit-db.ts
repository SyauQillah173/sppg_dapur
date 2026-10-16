import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const dup = (rows: any[], f: (r: any) => string) => {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = f(r);
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].filter(([, c]) => c > 1);
};

async function main() {
  const sup = await prisma.supplier.findMany({ select: { id: true, name: true, code: true } });
  const emp = await prisma.employee.findMany({ select: { id: true, name: true, sppgUnitId: true, employeeNumber: true } });
  const ing = await prisma.ingredient.findMany({ select: { id: true, name: true, code: true } });
  const cat = await prisma.ingredientCategory.findMany({ select: { id: true, name: true, code: true } });
  const mu = await prisma.masterUnit.findMany({ select: { id: true, symbol: true, name: true } });
  const su = await prisma.sppgUnit.findMany({ select: { id: true, code: true, name: true } });

  console.log('DUPLIKAT supplier (nama):', JSON.stringify(dup(sup, (r) => r.name.trim().toLowerCase())));
  console.log('DUPLIKAT karyawan (nama+unit):', JSON.stringify(dup(emp, (r) => r.name.trim().toLowerCase() + '@' + r.sppgUnitId)));
  console.log('DUPLIKAT karyawan (nomor):', JSON.stringify(dup(emp, (r) => r.employeeNumber)));
  console.log('DUPLIKAT bahan (nama):', JSON.stringify(dup(ing, (r) => r.name.trim().toLowerCase())));
  console.log('DUPLIKAT bahan (kode):', JSON.stringify(dup(ing, (r) => r.code)));
  console.log('DUPLIKAT kategori (nama):', JSON.stringify(dup(cat, (r) => r.name.trim().toLowerCase())));
  console.log('DUPLIKAT satuan (simbol):', JSON.stringify(dup(mu, (r) => r.symbol.trim().toLowerCase())));
  console.log('DUPLIKAT unit SPPG (kode):', JSON.stringify(dup(su, (r) => r.code)));

  console.log('\n--- jumlah baris tiap tabel ---');
  const models: [string, any][] = [
    ['admin_users', prisma.adminUser],
    ['sppg_units', prisma.sppgUnit],
    ['employees', prisma.employee],
    ['suppliers', prisma.supplier],
    ['ingredient_categories', prisma.ingredientCategory],
    ['ingredients', prisma.ingredient],
    ['master_units', prisma.masterUnit],
    ['procurement_orders', prisma.procurementOrder],
    ['procurement_items', prisma.procurementItem],
    ['budget_allocations', prisma.budgetAllocation],
    ['stock_movements', prisma.stockMovement],
    ['nota_photos', prisma.notaPhoto],
    ['app_state', prisma.appState],
  ];
  for (const [label, model] of models) console.log(' ', label.padEnd(22), await model.count());
}

main()
  .catch((e) => {
    console.error('GAGAL:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
