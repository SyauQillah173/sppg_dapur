import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
    `select table_name from information_schema.tables where table_schema='public' order by table_name`
  );

  console.log('=== TABEL DI DATABASE NEON ===');
  for (const t of tables) {
    const rows = await prisma.$queryRawUnsafe<{ n: bigint }[]>(`select count(*)::bigint as n from "${t.table_name}"`);
    console.log(` ${t.table_name.padEnd(24)} ${String(rows[0].n).padStart(4)} baris`);
  }

  const uniques = await prisma.$queryRawUnsafe<{ table_name: string; indexdef: string }[]>(
    `select tablename as table_name, indexdef from pg_indexes
     where schemaname='public' and indexdef like '%UNIQUE%'
     order by tablename, indexname`
  );

  console.log('\n=== KUNCI UNIK (anti duplikat) ===');
  for (const u of uniques) {
    const cols = /\(([^)]+)\)/.exec(u.indexdef)?.[1] ?? '';
    console.log(` ${u.table_name.padEnd(24)} ${cols}`);
  }
}

main()
  .catch((e) => {
    console.error('GAGAL:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
