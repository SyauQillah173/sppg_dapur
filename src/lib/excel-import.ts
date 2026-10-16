import * as XLSX from 'xlsx';
import { SppgUnit } from './types';

export interface BudgetImportRow {
  sppgUnitId: string;
  sppgUnitName: string;
  fiscalPeriod: string;
  allocatedDate: string;
  amountAllocated: number;
  notes: string;
}

export interface BudgetImportResult {
  rows: BudgetImportRow[];
  errors: string[];
}

const TEMPLATE_HEADERS = ['Tanggal (YYYY-MM-DD)', 'Unit SPPG', 'Periode Fiskal', 'Dana Masuk', 'Keterangan'];

/** Nomor gaya Indonesia: "Rp 1.500.000", "1500000", "1.500.000,50". */
export function parseAngka(v: unknown): number {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (v == null) return 0;
  const s = String(v).replace(/[^0-9.,-]/g, '').trim();
  if (!s) return 0;
  // Titik = pemisah ribuan, koma = desimal (format id-ID)
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/\./g, '');
  const n = Number(normalized);
  return isFinite(n) ? n : 0;
}

function toIsoDate(v: unknown): string | null {
  if (v == null || v === '') return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString();
  if (typeof v === 'number') {
    // Serial date Excel → hari sejak 1899-12-30
    const ms = Math.round((v - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  const s = String(v).trim();
  // Tanggal tanpa jam disimpan di tengah hari lokal supaya tidak bergeser
  // sehari saat diserialisasi ke UTC (filter tanggal memakai string ISO).
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 12).toISOString();
  }
  const idn = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
  if (idn) {
    return new Date(Number(idn[3]), Number(idn[2]) - 1, Number(idn[1]), 12).toISOString();
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function matchUnit(raw: unknown, units: SppgUnit[]): SppgUnit | 'ALL' | null {
  const s = String(raw ?? '').trim().toLowerCase();
  if (!s) return null;
  if (['all', 'semua', 'semua sppg', 'semua unit', 'semua unit sppg', 'gabungan'].includes(s)) return 'ALL';
  const byCode = units.find((u) => u.code.toLowerCase() === s || u.id.toLowerCase() === s);
  if (byCode) return byCode;
  const byName = units.find((u) => u.name.toLowerCase() === s || u.shortName.toLowerCase() === s);
  if (byName) return byName;
  return units.find((u) => u.name.toLowerCase().includes(s) || s.includes(u.shortName.toLowerCase())) ?? null;
}

/** Baca file Excel dana masuk. Header dicocokkan longgar supaya file lama tetap bisa diimpor. */
export async function parseBudgetWorkbook(file: File, units: SppgUnit[]): Promise<BudgetImportResult> {
  const errors: string[] = [];
  const rows: BudgetImportRow[] = [];

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return { rows, errors: ['File tidak punya sheet data.'] };

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });
  if (matrix.length === 0) return { rows, errors: ['Sheet kosong.'] };

  // Cari baris header: baris dengan kecocokan kata kunci terbanyak (judul di atas
  // tabel sering memuat kata "DANA"/"REKAP" juga, jadi tidak boleh asal baris pertama).
  const HEADER_KEYS = ['tanggal', 'tgl', 'date', 'unit', 'sppg', 'dapur', 'periode', 'fiskal', 'dana', 'nominal', 'jumlah', 'masuk', 'amount', 'keterangan', 'catatan'];
  let headerIdx = 0;
  let bestScore = 0;
  matrix.slice(0, 10).forEach((r, i) => {
    const score = r.reduce<number>((acc, c) => {
      const s = String(c ?? '').toLowerCase();
      return acc + (s && HEADER_KEYS.some((k) => s.includes(k)) ? 1 : 0);
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      headerIdx = i;
    }
  });

  const header = matrix[headerIdx].map((c) => String(c ?? '').toLowerCase());
  const findCol = (...keys: string[]) => header.findIndex((h) => keys.some((k) => h.includes(k)));

  const colTanggal = findCol('tanggal', 'date', 'tgl');
  const colUnit = findCol('unit', 'sppg', 'dapur');
  const colPeriode = findCol('periode', 'fiskal', 'bulan');
  const colJumlah = findCol('dana masuk', 'dana', 'nominal', 'jumlah', 'masuk', 'amount');
  const colNotes = findCol('keterangan', 'catatan', 'notes', 'sumber');

  if (colJumlah < 0) {
    return { rows, errors: ['Kolom "Dana Masuk" tidak ditemukan. Unduh template dulu supaya formatnya pas.'] };
  }

  for (let i = headerIdx + 1; i < matrix.length; i++) {
    const r = matrix[i];
    const excelRow = i + 1;
    if (!r || r.every((c) => c == null || String(c).trim() === '')) continue;

    const amount = parseAngka(colJumlah >= 0 ? r[colJumlah] : 0);
    if (amount <= 0) {
      errors.push(`Baris ${excelRow}: nominal dana masuk kosong/0 — dilewati.`);
      continue;
    }

    const unitRaw = colUnit >= 0 ? r[colUnit] : '';
    const matched = matchUnit(unitRaw, units);
    if (!matched) {
      errors.push(`Baris ${excelRow}: unit "${String(unitRaw ?? '')}" tidak dikenal — dilewati.`);
      continue;
    }

    const isoDate = toIsoDate(colTanggal >= 0 ? r[colTanggal] : null) ?? new Date().toISOString();
    const periodeRaw = colPeriode >= 0 ? String(r[colPeriode] ?? '').trim() : '';
    const bulanId = new Date(isoDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    rows.push({
      sppgUnitId: matched === 'ALL' ? 'ALL' : matched.id,
      sppgUnitName: matched === 'ALL' ? 'Semua SPPG (Gabungan 4 Unit)' : matched.name,
      fiscalPeriod: periodeRaw || bulanId,
      allocatedDate: isoDate,
      amountAllocated: amount,
      notes: colNotes >= 0 ? String(r[colNotes] ?? '').trim() : '',
    });
  }

  if (rows.length === 0 && errors.length === 0) errors.push('Tidak ada baris data yang bisa dibaca.');
  return { rows, errors };
}

/** Template kosong dengan header resmi + satu baris contoh. */
export function downloadBudgetTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['TEMPLATE IMPORT DANA MASUK — SPPG DAPUR'],
    ['Isi kolom Tanggal (YYYY-MM-DD), Unit SPPG (nama/kode, atau "Semua SPPG"), Periode Fiskal, Dana Masuk, Keterangan'],
    [],
    TEMPLATE_HEADERS,
    ['2026-10-16', 'SPPG ABAR ABIR 02', 'Oktober 2026', 150000000, 'Pagu Operasional Tahap 2'],
    ['2026-10-16', 'Semua SPPG', 'Oktober 2026', 400000000, 'Dana gabungan 4 dapur'],
  ]);
  ws['!cols'] = [{ wch: 20 }, { wch: 28 }, { wch: 18 }, { wch: 16 }, { wch: 40 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template Dana Masuk');
  XLSX.writeFile(wb, 'Template-Import-Dana-Masuk.xlsx');
}
