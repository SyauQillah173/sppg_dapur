/**
 * Cek parser import Excel dana masuk.
 * Jalankan: npx tsx scripts/check-excel-import.ts
 */
import * as XLSX from 'xlsx';
import { parseAngka, parseBudgetWorkbook } from '../src/lib/excel-import';
import { rescueLocalOnly } from '../src/lib/state-merge';
import { SppgUnit } from '../src/lib/types';

const units: SppgUnit[] = [
  { id: 'SPPG-AA02', code: 'SPPG-AA02', name: 'SPPG ABAR ABIR 02', shortName: 'Abar Abir', location: '', picName: '', phone: '', activeBudget: 0, totalRealized: 0, totalRemaining: 0 },
  { id: 'SPPG-BS02', code: 'SPPG-BS02', name: 'SPPG BANJARSARI 02 LERAN MANYAR', shortName: 'Banjarsari', location: '', picName: '', phone: '', activeBudget: 0, totalRealized: 0, totalRemaining: 0 },
];

let failed = 0;
const assert = (label: string, cond: boolean, extra?: unknown) => {
  if (!cond) {
    failed++;
    console.error('GAGAL:', label, extra ?? '');
  } else {
    console.log('ok:', label);
  }
};

// parseAngka: format Indonesia, angka polos, dan teks ber-Rp
assert('parseAngka "Rp 1.500.000" = 1500000', parseAngka('Rp 1.500.000') === 1500000, parseAngka('Rp 1.500.000'));
assert('parseAngka "1.500.000,50" = 1500000.5', parseAngka('1.500.000,50') === 1500000.5, parseAngka('1.500.000,50'));
assert('parseAngka 250000000 = 250000000', parseAngka(250000000) === 250000000);
assert('parseAngka "" = 0', parseAngka('') === 0);

async function main() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['REKAP DANA MASUK'],
    [],
    ['Tanggal', 'Unit SPPG', 'Periode Fiskal', 'Dana Masuk', 'Keterangan'],
    ['2026-10-05', 'SPPG ABAR ABIR 02', 'Oktober 2026', 'Rp 150.000.000', 'Pagu tahap 2'],
    ['05/10/2026', 'Semua SPPG', '', 400000000, 'Gabungan 4 dapur'],
    ['2026-10-06', 'SPPG TIDAK ADA', 'Oktober 2026', 5000000, 'unit salah'],
    ['2026-10-07', 'SPPG BANJARSARI 02 LERAN MANYAR', 'Oktober 2026', 0, 'nominal nol'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

  const file = new File([buf], 'uji.xlsx');
  const { rows, errors } = await parseBudgetWorkbook(file, units);

  assert('2 baris valid terbaca', rows.length === 2, rows);
  assert('baris 1 unit ter-map ke kode', rows[0]?.sppgUnitId === 'SPPG-AA02', rows[0]);
  assert('baris 1 nominal terparse', rows[0]?.amountAllocated === 150000000, rows[0]?.amountAllocated);
  assert('baris 2 "Semua SPPG" jadi ALL', rows[1]?.sppgUnitId === 'ALL', rows[1]);
  assert('baris 2 label periode diisi otomatis', !!rows[1]?.fiscalPeriod, rows[1]?.fiscalPeriod);
  assert('tanggal dd/mm/yyyy terbaca sebagai 5 Okt lokal', new Date(rows[1]?.allocatedDate).getDate() === 5, rows[1]?.allocatedDate);
  assert('filter tanggal ISO cocok', rows[1]?.allocatedDate?.startsWith('2026-10-05') === true, rows[1]?.allocatedDate);
  assert('2 baris bermasalah dilaporkan', errors.length === 2, errors);

  // rescueLocalOnly: server kosong + perangkat punya data → data lokal dipakai
  const rescuedEmpty = rescueLocalOnly(
    { procurements: [], budgetAllocations: [], ingredients: [1, 2] },
    { procurements: [{ id: 'a' }], budgetAllocations: [{ id: 'b' }] }
  );
  assert('server kosong → 2 jenis data diselamatkan', rescuedEmpty.procurements?.length === 1 && rescuedEmpty.budgetAllocations?.length === 1, rescuedEmpty);
  assert('kunci lain tidak ikut diselamatkan', rescuedEmpty.ingredients === undefined, Object.keys(rescuedEmpty));

  const rescuedFull = rescueLocalOnly(
    { procurements: [{ id: 'server' }], budgetAllocations: [] },
    { procurements: [{ id: 'lokal1' }, { id: 'lokal2' }] }
  );
  assert('server sudah ada isi → tidak ditimpa cache lama', rescuedFull.procurements === undefined, rescuedFull);

  assert('tanpa cache lokal → tidak ada yang diselamatkan', Object.keys(rescueLocalOnly({ procurements: [] }, null)).length === 0);

  console.log(failed === 0 ? '\nSEMUA CEK LULUS' : `\n${failed} CEK GAGAL`);
  process.exit(failed === 0 ? 0 : 1);
}

main();
