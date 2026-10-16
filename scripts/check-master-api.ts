/**
 * Cek API master data + anti duplikat.
 * Jalankan terhadap server yang sudah hidup: npx tsx scripts/check-master-api.ts http://127.0.0.1:3006
 * Butuh kredensial superadmin dari KREDENSIAL-BARU.txt (dibaca otomatis).
 */
import { readFileSync } from 'fs';

const BASE = process.argv[2] || 'http://127.0.0.1:3006';

let failed = 0;
const ok = (label: string, cond: boolean, extra?: unknown) => {
  if (cond) console.log('ok:', label);
  else {
    failed++;
    console.error('GAGAL:', label, extra ?? '');
  }
};

async function main() {
  const cred = readFileSync('KREDENSIAL-BARU.txt', 'utf-8');
  const password = /^superadmin\s*:\s*(\S+)/m.exec(cred)?.[1];
  if (!password) throw new Error('Password superadmin tidak ditemukan di KREDENSIAL-BARU.txt');

  const login = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'superadmin', password }),
  });
  ok('login superadmin', login.ok, login.status);
  const cookie = (login.headers.get('set-cookie') || '').split(';')[0];
  if (!cookie) throw new Error('Cookie sesi tidak didapat');

  const call = async (path: string, method: string, body?: unknown) => {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, json: await res.json().catch(() => ({})) };
  };

  const before = await call('/api/suppliers', 'GET');
  const beforeCount = before.json.data.length;

  // 1. Supplier: buat, lalu ulang dengan nama sama → harus dikembalikan baris yang sama
  const s1 = await call('/api/suppliers', 'POST', { name: 'CV Uji Anti Duplikat', phone: '0811' });
  ok('supplier baru dibuat (201)', s1.status === 201, s1.status);
  const s2 = await call('/api/suppliers', 'POST', { name: 'cv uji anti duplikat', phone: '0811' });
  ok('nama sama (beda huruf besar/kecil) tidak bikin baris baru', s2.json.duplicate === true, s2.json);
  const after = await call('/api/suppliers', 'GET');
  ok('jumlah supplier hanya bertambah 1', after.json.data.length === beforeCount + 1, {
    before: beforeCount,
    after: after.json.data.length,
  });
  const supplierId = s1.json.data.id;

  // 2. Supplier: ubah nama, lalu ubah lagi ke nama yang sudah dipakai → harus ditolak
  const s3 = await call(`/api/suppliers/${supplierId}`, 'PATCH', { phone: '0822-000' });
  ok('ubah data supplier', s3.status === 200 && s3.json.data.phone === '0822-000', s3.json);
  const s4 = await call(`/api/suppliers/${supplierId}`, 'PATCH', { name: after.json.data.find((x: any) => x.id !== supplierId)?.name });
  ok('nama supplier yang sudah dipakai ditolak', s4.status === 400, s4.json);

  // 3. Karyawan: nama sama di unit yang sama → tidak digandakan
  const e1 = await call('/api/employees', 'POST', { name: 'Uji Karyawan Dup', sppgUnitId: 'SPPG-AA02' });
  const e2 = await call('/api/employees', 'POST', { name: 'UJI KARYAWAN DUP', sppgUnitId: 'SPPG-AA02' });
  ok('karyawan baru dibuat', e1.status === 201, e1.status);
  ok('karyawan dengan nama sama di unit sama tidak digandakan', e2.json.duplicate === true, e2.json);

  // 4. Bahan: nama sama → tidak digandakan
  const cats = await call('/api/categories', 'GET');
  const categoryId = cats.json.data[0].id;
  const i1 = await call('/api/ingredients', 'POST', { name: 'Bahan Uji Dup', categoryId, defaultUnit: 'Kg' });
  const i2 = await call('/api/ingredients', 'POST', { name: 'bahan uji dup', categoryId, defaultUnit: 'Kg' });
  ok('bahan baru dibuat', i1.status === 201, i1.status);
  ok('bahan dengan nama sama tidak digandakan', i2.json.duplicate === true, i2.json);

  // 5. Dana masuk: baris identik dua kali → yang kedua dilewati
  const b1 = await call('/api/budgets', 'POST', {
    items: [{ sppgUnitId: 'SPPG-AA02', fiscalPeriod: 'Uji Dup', amountAllocated: 123456, allocatedDate: '2026-10-16T05:00:00.000Z' }],
  });
  ok('dana masuk pertama tersimpan', b1.json.data?.length === 1, b1.json);
  const b2 = await call('/api/budgets', 'POST', {
    items: [{ sppgUnitId: 'SPPG-AA02', fiscalPeriod: 'Uji Dup', amountAllocated: 123456, allocatedDate: '2026-10-16T05:00:00.000Z' }],
  });
  ok('dana masuk identik dilewati (anti duplikat)', b2.json.data?.length === 0 && b2.json.skipped?.length === 1, b2.json);

  // Bersihkan data uji
  await call(`/api/budgets/${b1.json.data[0].id}`, 'DELETE');
  await call(`/api/ingredients/${i1.json.data.id}`, 'DELETE');
  await call(`/api/employees/${e1.json.data.id}`, 'DELETE');
  await call(`/api/suppliers/${supplierId}`, 'DELETE');

  const finalSuppliers = await call('/api/suppliers', 'GET');
  ok('jumlah supplier kembali seperti semula', finalSuppliers.json.data.length === beforeCount, finalSuppliers.json.data.length);

  console.log(failed === 0 ? '\nSEMUA CEK LULUS' : `\n${failed} CEK GAGAL`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('GAGAL:', e.message);
  process.exit(1);
});
