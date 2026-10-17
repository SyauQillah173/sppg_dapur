import * as XLSX from 'xlsx-js-style';
import { ProcurementTransaction, BudgetAllocationItem, SppgUnit } from './types';
import { formatIDR, formatDateIndo } from './utils';

// ─── Helpers ────────────────────────────────────────────────────────────────

function colLetter(n: number): string {
  let s = '';
  let idx = n;
  while (idx >= 0) {
    s = String.fromCharCode(65 + (idx % 26)) + s;
    idx = Math.floor(idx / 26) - 1;
  }
  return s;
}

interface CellStyleOptions {
  bold?: boolean;
  bg?: string; // hex RGB without '#' e.g. '0F172A'
  color?: string; // hex RGB without '#' e.g. 'FFFFFF'
  size?: number;
  align?: 'left' | 'center' | 'right';
  numFmt?: string;
  borderStyle?: 'thin' | 'medium' | 'double';
  borderColor?: string;
}

function styleCell(ws: any, cell: string, opts: CellStyleOptions) {
  if (!ws[cell]) return;
  const bColor = opts.borderColor || 'CBD5E1';
  const bStyle = opts.borderStyle || 'thin';

  ws[cell].s = {
    font: {
      name: 'Calibri',
      bold: !!opts.bold,
      sz: opts.size ?? 10,
      color: opts.color ? { rgb: opts.color } : { rgb: '0F172A' },
    },
    fill: opts.bg ? { fgColor: { rgb: opts.bg }, patternType: 'solid' } : undefined,
    alignment: {
      horizontal: opts.align ?? 'left',
      vertical: 'center',
      wrapText: true,
    },
    numFmt: opts.numFmt,
    border: {
      top: { style: bStyle, color: { rgb: bColor } },
      bottom: { style: bStyle, color: { rgb: bColor } },
      left: { style: bStyle, color: { rgb: bColor } },
      right: { style: bStyle, color: { rgb: bColor } },
    },
  };
}

// ─── 1. Per-transaction SPJ export ──────────────────────────────────────────

export function exportProcurementToExcel(transaction: ProcurementTransaction) {
  const approver = transaction.auditedBy && !transaction.auditedBy.includes('Supriyanto')
    ? transaction.auditedBy
    : (transaction.status === 'VERIFIED' ? 'Abdullah Syauqillah, S.Kom' : (transaction.auditedBy || 'Abdullah Syauqillah, S.Kom'));

  const itemRows = transaction.items.map((it, idx) => [
    idx + 1,
    it.name,
    it.category,
    it.quantity,
    it.unit,
    it.unitPrice,
    it.subtotal,
    it.isItemVerified ? 'VALID' : 'BELUM ACC',
    (it as any).hasPriceAnomaly ? 'ANOMALI' : 'NORMAL',
  ]);

  const HEADER_ROWS = 19;
  const DATA_START = HEADER_ROWS;
  const DATA_END = DATA_START + itemRows.length - 1;

  const data = [
    ['BERITA ACARA PEMBELANJAAN & SPJ SPPG DAPUR'],
    ['Badan Gizi Nasional • SPPG Sentra Operasional & Keuangan'],
    [''],
    ['Nomor Nota', transaction.receiptNumber],
    ['Tanggal Pembelian', formatDateIndo(transaction.date)],
    ['Unit SPPG', transaction.sppgUnitName],
    ['Peminta Belanja', transaction.requesterName],
    ['Jabatan Peminta', transaction.requesterRole],
    ['Supplier / CV', transaction.supplierName],
    ['Alamat Rekanan', transaction.supplierAddress],
    [''],
    ['Dana Diminta (Kasbon)', transaction.amountRequested],
    ['Total Nota Fisik', transaction.actualReceiptTotal],
    ['Uang Kembali', transaction.changeReturned],
    ['Status Pemeriksaan', transaction.status],
    ['Disetujui Oleh (ACC)', approver],
    ['Catatan Verifikasi', transaction.auditNotes || 'Lolos verifikasi nota fisik dan kesesuaian barang'],
    [''],
    ['No', 'Nama Bahan Makanan', 'Kategori Nutrisi', 'Qty', 'Satuan', 'Harga Satuan (Rp)', 'Subtotal (Rp)', 'Status Fisik', 'Status Harga'],
    ...itemRows,
    [
      '', '', '', '', '', 'TOTAL REALISASI NOTA',
      { t: 'n', v: transaction.actualReceiptTotal, f: `SUM(G${DATA_START}:G${DATA_END})` },
      '', '',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 20 },
    { wch: 10 },
    { wch: 10 },
    { wch: 20 },
    { wch: 22 },
    { wch: 15 },
    { wch: 15 },
  ];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
  ];

  // Title & Subtitle styling
  styleCell(ws, 'A1', { bold: true, bg: '0F172A', color: 'FFFFFF', size: 13, align: 'center' });
  styleCell(ws, 'A2', { bg: '1E293B', color: '94A3B8', size: 10, align: 'center' });

  // Metadata rows styling
  [4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17].forEach((rowNum) => {
    styleCell(ws, `A${rowNum}`, { bold: true, bg: 'F1F5F9', color: '334155', size: 10 });
    styleCell(ws, `B${rowNum}`, {
      bg: 'FFFFFF',
      color: '0F172A',
      numFmt: [12, 13, 14].includes(rowNum) ? '#,##0' : undefined,
    });
  });

  // Table header styling (Row 19)
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((col) => {
    styleCell(ws, `${col}19`, {
      bold: true,
      bg: '1E3A8A',
      color: 'FFFFFF',
      align: ['A', 'D', 'E', 'H', 'I'].includes(col) ? 'center' : ['F', 'G'].includes(col) ? 'right' : 'left',
    });
  });

  // Data rows styling
  itemRows.forEach((_, idx) => {
    const rowNum = DATA_START + idx;
    const bg = idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((col) => {
      styleCell(ws, `${col}${rowNum}`, {
        bg,
        align: ['A', 'D', 'E', 'H', 'I'].includes(col) ? 'center' : ['F', 'G'].includes(col) ? 'right' : 'left',
        numFmt: ['F', 'G'].includes(col) ? '#,##0' : undefined,
      });
    });
  });

  // Total Row styling
  const totRow = DATA_END + 1;
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach((col) => {
    styleCell(ws, `${col}${totRow}`, {
      bold: true,
      bg: 'FEF08A',
      color: '0F172A',
      align: col === 'G' ? 'right' : col === 'F' ? 'right' : 'center',
      numFmt: col === 'G' ? '#,##0' : undefined,
      borderStyle: 'double',
      borderColor: '0F172A',
    });
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Berita Acara SPJ');
  XLSX.writeFile(wb, `SPJ_${transaction.receiptNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`);
}

// ─── 2. Procurement rekap ────────────────────────────────────────────────────

export function exportAllProcurementsToExcel(transactions: ProcurementTransaction[], unitFilter: string) {
  const now = new Date();

  // Resolve approver accurately
  const dataRows = transactions.map((t, idx) => {
    const approver = t.auditedBy && !t.auditedBy.includes('Supriyanto')
      ? t.auditedBy
      : (t.status === 'VERIFIED' ? 'Abdullah Syauqillah, S.Kom' : (t.auditedBy || 'Abdullah Syauqillah, S.Kom'));

    return [
      idx + 1,
      formatDateIndo(t.date),
      t.receiptNumber,
      t.sppgUnitName,
      t.requesterName,
      t.supplierName,
      t.amountRequested,
      t.actualReceiptTotal,
      t.changeReturned,
      t.status,
      t.items.length,
      approver,
    ];
  });

  const HEADER_ROW = 4;
  const DATA_START = HEADER_ROW + 1;
  const DATA_END = dataRows.length > 0 ? DATA_START + dataRows.length - 1 : DATA_START;

  const cols = [
    'No',
    'Tanggal',
    'No. Nota',
    'Unit SPPG',
    'Peminta Belanja',
    'Supplier / CV',
    'Dana Diminta (Rp)',
    'Total Nota (Rp)',
    'Uang Kembali (Rp)',
    'Status SPJ',
    'Jml Item',
    'Disetujui Oleh (ACC)',
  ];

  const totReq = transactions.reduce((sum, t) => sum + (t.amountRequested || 0), 0);
  const totAct = transactions.reduce((sum, t) => sum + (t.actualReceiptTotal || 0), 0);
  const totChange = transactions.reduce((sum, t) => sum + (t.changeReturned || 0), 0);

  const totalRow = dataRows.length > 0
    ? [
        '', '', '', '', '', 'TOTAL',
        { t: 'n', v: totReq, f: `SUM(G${DATA_START}:G${DATA_END})` },
        { t: 'n', v: totAct, f: `SUM(H${DATA_START}:H${DATA_END})` },
        { t: 'n', v: totChange, f: `SUM(I${DATA_START}:I${DATA_END})` },
        '', '', '',
      ]
    : ['', '', '', '', '', 'TOTAL', 0, 0, 0, '', '', ''];

  const ws = XLSX.utils.aoa_to_sheet([
    ['LAPORAN REKAPITULASI PEMBELANJAAN & REALISASI NOTA SPPG DAPUR'],
    [`Filter Unit: ${unitFilter} | Dicetak: ${formatDateIndo(now.toISOString())}`],
    [''],
    cols,
    ...dataRows,
    totalRow,
  ]);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 24 },
    { wch: 28 },
    { wch: 22 },
    { wch: 28 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
    { wch: 10 },
    { wch: 28 },
  ];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
  ];

  // Header Title
  styleCell(ws, 'A1', { bold: true, bg: '0F172A', color: 'FFFFFF', size: 13, align: 'center' });
  styleCell(ws, 'A2', { bg: '1E293B', color: 'CBD5E1', size: 10, align: 'center' });

  // Column Headers (Row 4)
  cols.forEach((_, ci) => {
    const col = colLetter(ci);
    styleCell(ws, `${col}4`, {
      bold: true,
      bg: '1E3A8A',
      color: 'FFFFFF',
      align: ['No', 'Tanggal', 'Status SPJ', 'Jml Item'].includes(cols[ci]) ? 'center' : ['Dana Diminta (Rp)', 'Total Nota (Rp)', 'Uang Kembali (Rp)'].includes(cols[ci]) ? 'right' : 'left',
    });
  });

  // Data rows
  dataRows.forEach((_, ri) => {
    const row = DATA_START + ri;
    const bg = ri % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
    cols.forEach((h, ci) => {
      const col = colLetter(ci);
      const isNum = h.includes('(Rp)');
      const isCenter = ['No', 'Tanggal', 'Status SPJ', 'Jml Item'].includes(h);

      styleCell(ws, `${col}${row}`, {
        bg,
        align: isNum ? 'right' : isCenter ? 'center' : 'left',
        numFmt: isNum ? '#,##0' : undefined,
      });
    });
  });

  // TOTAL Row
  if (dataRows.length > 0) {
    const totalRowNum = DATA_END + 1;
    cols.forEach((h, ci) => {
      const col = colLetter(ci);
      const isNum = h.includes('(Rp)');
      styleCell(ws, `${col}${totalRowNum}`, {
        bold: true,
        bg: 'FEF08A',
        color: '0F172A',
        align: isNum ? 'right' : col === 'F' ? 'right' : 'center',
        numFmt: isNum ? '#,##0' : undefined,
        borderStyle: 'double',
        borderColor: '0F172A',
      });
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Belanja');
  XLSX.writeFile(wb, `Rekap_Belanja_SPPG_${now.toISOString().slice(0, 10)}.xlsx`);
}

export function exportConsolidatedSPPGSummaryToExcel(
  units: SppgUnit[],
  transactions: ProcurementTransaction[],
  ingredients: any[]
) {
  exportAllProcurementsToExcel(transactions, 'Semua Unit SPPG (Konsolidasi 4 Dapur)');
}

// ─── 3. Rekap Keuangan types & helpers ──────────────────────────────────────

export type RekapMode = 'harian' | 'mingguan' | 'bulanan' | 'tahunan';
export type RekapJenis = 'semua' | 'pemasukan' | 'pengeluaran';

interface RekapRow {
  periode: string;
  unit: string;
  pemasukan: number;
  pengeluaran: number;
  saldo: number;
}

function getPeriodeLabel(dateStr: string, mode: RekapMode): string {
  const d = new Date(dateStr);
  if (mode === 'harian') return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  if (mode === 'mingguan') {
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  }
  if (mode === 'bulanan') return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  return d.getFullYear().toString();
}

function getPeriodeKey(dateStr: string, mode: RekapMode): string {
  const d = new Date(dateStr);
  if (mode === 'harian') return d.toISOString().slice(0, 10);
  if (mode === 'mingguan') {
    const s = new Date(d);
    s.setDate(d.getDate() - d.getDay());
    return s.toISOString().slice(0, 10);
  }
  if (mode === 'bulanan') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return d.getFullYear().toString();
}

function buildRekapRows(
  budgets: BudgetAllocationItem[],
  transactions: ProcurementTransaction[],
  mode: RekapMode,
  jenis: RekapJenis
): RekapRow[] {
  const map = new Map<string, RekapRow>();
  if (jenis !== 'pengeluaran') {
    for (const b of budgets) {
      const key = getPeriodeKey(b.allocatedDate, mode) + '|' + b.sppgUnitName;
      if (!map.has(key)) {
        map.set(key, { periode: getPeriodeLabel(b.allocatedDate, mode), unit: b.sppgUnitName, pemasukan: 0, pengeluaran: 0, saldo: 0 });
      }
      map.get(key)!.pemasukan += b.amountAllocated;
    }
  }
  if (jenis !== 'pemasukan') {
    for (const t of transactions) {
      const key = getPeriodeKey(t.date, mode) + '|' + t.sppgUnitName;
      if (!map.has(key)) {
        map.set(key, { periode: getPeriodeLabel(t.date, mode), unit: t.sppgUnitName, pemasukan: 0, pengeluaran: 0, saldo: 0 });
      }
      map.get(key)!.pengeluaran += t.actualReceiptTotal;
    }
  }
  const rows = Array.from(map.values()).sort((a, b) => a.periode.localeCompare(b.periode));
  rows.forEach((r) => {
    r.saldo = r.pemasukan - r.pengeluaran;
  });
  return rows;
}

// ─── 4. Export Rekap Excel (Formatted with formulas & colors) ────────────────

export function exportRekap(
  budgets: BudgetAllocationItem[],
  transactions: ProcurementTransaction[],
  mode: RekapMode,
  jenis: RekapJenis,
  unitFilter: string,
  unitName: string
) {
  const now = new Date();
  const rows = buildRekapRows(budgets, transactions, mode, jenis);
  const modeLabel = { harian: 'Harian', mingguan: 'Mingguan', bulanan: 'Bulanan', tahunan: 'Tahunan' }[mode];
  const judul =
    jenis === 'pemasukan'
      ? 'REKAP PEMASUKAN ANGGARAN SPPG'
      : jenis === 'pengeluaran'
      ? 'REKAP PENGELUARAN BELANJA SPPG'
      : 'REKAP KEUANGAN (PEMASUKAN & PENGELUARAN) SPPG';

  const colHeaders: string[] = ['No', 'Periode', 'Unit SPPG'];
  if (jenis !== 'pengeluaran') colHeaders.push('Pemasukan (Rp)');
  if (jenis !== 'pemasukan') colHeaders.push('Pengeluaran (Rp)');
  if (jenis === 'semua') colHeaders.push('Saldo (Rp)');

  const dataRows = rows.map((r, i) => {
    const row: (string | number)[] = [i + 1, r.periode, r.unit];
    if (jenis !== 'pengeluaran') row.push(r.pemasukan);
    if (jenis !== 'pemasukan') row.push(r.pengeluaran);
    if (jenis === 'semua') row.push(r.saldo);
    return row;
  });

  const HEADER_ROW = 4;
  const DATA_START = HEADER_ROW + 1;
  const DATA_END = dataRows.length > 0 ? DATA_START + dataRows.length - 1 : DATA_START;

  const totP = rows.reduce((s, r) => s + r.pemasukan, 0);
  const totK = rows.reduce((s, r) => s + r.pengeluaran, 0);
  const totS = totP - totK;

  // Build total row with BOTH evaluated value and SUM formulas
  const totalRow: any[] = ['', '', 'TOTAL'];
  let co = 3;
  if (jenis !== 'pengeluaran') {
    const colName = colLetter(co);
    totalRow.push({
      t: 'n',
      v: totP,
      f: `SUM(${colName}${DATA_START}:${colName}${DATA_END})`,
    });
    co++;
  }
  if (jenis !== 'pemasukan') {
    const colName = colLetter(co);
    totalRow.push({
      t: 'n',
      v: totK,
      f: `SUM(${colName}${DATA_START}:${colName}${DATA_END})`,
    });
    co++;
  }
  if (jenis === 'semua') {
    // Saldo = Pemasukan - Pengeluaran formula
    const pemCol = 'D';
    const pengCol = 'E';
    const totalLine = DATA_END + 1;
    totalRow.push({
      t: 'n',
      v: totS,
      f: `${pemCol}${totalLine}-${pengCol}${totalLine}`,
    });
  }

  const ws = XLSX.utils.aoa_to_sheet([
    [judul],
    [`Rekap ${modeLabel} | Unit: ${unitName} | Dicetak: ${formatDateIndo(now.toISOString())}`],
    [''],
    colHeaders,
    ...dataRows,
    totalRow,
  ]);

  ws['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 30 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
  ];
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colHeaders.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colHeaders.length - 1 } },
  ];

  // Header Title
  styleCell(ws, 'A1', { bold: true, bg: '0F172A', color: 'FFFFFF', size: 13, align: 'center' });
  styleCell(ws, 'A2', { bg: '1E293B', color: 'CBD5E1', size: 10, align: 'center' });

  // Column headers row
  colHeaders.forEach((h, ci) => {
    const col = colLetter(ci);
    styleCell(ws, `${col}${HEADER_ROW}`, {
      bold: true,
      bg: '1E3A8A',
      color: 'FFFFFF',
      align: h === 'No' ? 'center' : h.includes('(Rp)') ? 'right' : 'left',
    });
  });

  // Data rows
  dataRows.forEach((r, ri) => {
    const row = DATA_START + ri;
    const bg = ri % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
    colHeaders.forEach((h, ci) => {
      const col = colLetter(ci);
      const isNum = h.includes('(Rp)');
      const isSaldo = h.includes('Saldo');
      const saldoVal = Number(r[ci]);

      styleCell(ws, `${col}${row}`, {
        bg,
        align: h === 'No' ? 'center' : isNum ? 'right' : 'left',
        numFmt: isNum ? '#,##0' : undefined,
        bold: isSaldo,
        color: isSaldo ? (saldoVal >= 0 ? '166534' : '991B1B') : '0F172A',
      });
    });
  });

  // TOTAL Row
  if (dataRows.length > 0) {
    const totalRowNum = DATA_END + 1;
    colHeaders.forEach((h, ci) => {
      const col = colLetter(ci);
      const isNum = h.includes('(Rp)');
      styleCell(ws, `${col}${totalRowNum}`, {
        bold: true,
        bg: 'FEF08A',
        color: '0F172A',
        align: isNum ? 'right' : col === 'C' ? 'right' : 'center',
        numFmt: isNum ? '#,##0' : undefined,
        borderStyle: 'double',
        borderColor: '0F172A',
      });
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Rekap ${modeLabel}`);
  const fname = `Rekap_${jenis === 'semua' ? 'Keuangan' : jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}_${modeLabel}_${now.toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fname);
}

// ─── 5. Export Rekap PDF (Keuangan) ──────────────────────────────────────────

export function exportRekapPDF(
  budgets: BudgetAllocationItem[],
  transactions: ProcurementTransaction[],
  mode: RekapMode,
  jenis: RekapJenis,
  unitFilter: string,
  unitName: string
) {
  const rows = buildRekapRows(budgets, transactions, mode, jenis);
  const modeLabel = { harian: 'Harian', mingguan: 'Mingguan', bulanan: 'Bulanan', tahunan: 'Tahunan' }[mode];
  const judul =
    jenis === 'pemasukan'
      ? 'REKAPITULASI PEMASUKAN ANGGARAN'
      : jenis === 'pengeluaran'
      ? 'REKAPITULASI PENGELUARAN BELANJA'
      : 'REKAPITULASI KEUANGAN (PEMASUKAN & PENGELUARAN)';
  const now = new Date();

  const totP = rows.reduce((s, r) => s + r.pemasukan, 0);
  const totK = rows.reduce((s, r) => s + r.pengeluaran, 0);
  const totS = totP - totK;

  const colsHtml: string[] = ['No', 'Periode', 'Unit SPPG'];
  if (jenis !== 'pengeluaran') colsHtml.push('Pemasukan (Rp)');
  if (jenis !== 'pemasukan') colsHtml.push('Pengeluaran (Rp)');
  if (jenis === 'semua') colsHtml.push('Saldo (Rp)');

  // Header cells with explicit alignment matching data cells
  const headerCells = colsHtml
    .map((h) => {
      const isNum = h.includes('(Rp)');
      const isCenter = h === 'No';
      return `<th class="${isNum ? 'num' : isCenter ? 'center' : ''}">${h}</th>`;
    })
    .join('');

  const bodyRows = rows
    .map((r, i) => {
      const cells: string[] = [
        `<td class="center">${i + 1}</td>`,
        `<td>${r.periode}</td>`,
        `<td style="font-weight:600">${r.unit}</td>`,
      ];
      if (jenis !== 'pengeluaran') cells.push(`<td class="num">${formatIDR(r.pemasukan)}</td>`);
      if (jenis !== 'pemasukan') cells.push(`<td class="num">${formatIDR(r.pengeluaran)}</td>`);
      if (jenis === 'semua') cells.push(`<td class="num ${r.saldo >= 0 ? 'pos' : 'neg'}">${formatIDR(r.saldo)}</td>`);
      return `<tr>${cells.join('')}</tr>`;
    })
    .join('');

  const totCells: string[] = [`<td colspan="3" class="total-label">TOTAL</td>`];
  if (jenis !== 'pengeluaran') totCells.push(`<td class="num total-val">${formatIDR(totP)}</td>`);
  if (jenis !== 'pemasukan') totCells.push(`<td class="num total-val">${formatIDR(totK)}</td>`);
  if (jenis === 'semua') totCells.push(`<td class="num total-val ${totS >= 0 ? 'pos' : 'neg'}">${formatIDR(totS)}</td>`);

  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8">
<title>${judul} – SPPG Dapur</title>
<style>
  @media print {
    @page { size: A4 landscape; margin: 10mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; color: #0f172a; background: #fff; padding: 12px; }
  
  /* Kop Surat Resmi Badan Gizi SPPG */
  .kop { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 14px; }
  .kop-left { display: flex; align-items: center; gap: 14px; }
  .kop-logo { width: 62px; height: 62px; object-fit: contain; }
  .kop-text h2 { font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; text-transform: uppercase; }
  .kop-text h3 { font-size: 12px; font-weight: 700; color: #1e3a8a; }
  .kop-text p { font-size: 10px; color: #475569; margin-top: 2px; }
  .kop-right { text-align: right; font-size: 10px; color: #64748b; line-height: 1.4; }

  .doc-title { text-align: center; margin: 12px 0 16px 0; }
  .doc-title h1 { font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
  .doc-title .badge { display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 3px 10px; border-radius: 4px; font-size: 10px; color: #334155; margin-top: 4px; font-weight: 600; }

  /* Table styling */
  table { width: 100%; border-collapse: collapse; margin-top: 8px; border: 1px solid #94a3b8; }
  thead th { background: #1e3a8a; color: #ffffff; padding: 8px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; border: 1px solid #475569; }
  tbody td { padding: 6px 10px; border: 1px solid #cbd5e1; font-size: 10.5px; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  
  .center { text-align: center; }
  .num { text-align: right; font-family: 'Consolas', 'Courier New', monospace; font-variant-numeric: tabular-nums; }
  th.num { text-align: right; }
  th.center { text-align: center; }

  .pos { color: #166534; font-weight: 700; }
  .neg { color: #991b1b; font-weight: 700; }

  tfoot td { border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; }
  .total-label { font-weight: 800; text-align: right; background: #fef08a; padding: 7px 10px; font-size: 11px; }
  .total-val { font-weight: 800; background: #fef08a; padding: 7px 10px; font-size: 11px; }

  /* Signature Block */
  .signatures { margin-top: 32px; display: flex; justify-content: space-between; page-break-inside: avoid; }
  .sig-box { width: 220px; text-align: center; font-size: 10.5px; }
  .sig-space { height: 55px; }
  .sig-name { font-weight: 700; text-decoration: underline; color: #0f172a; }
  .sig-title { font-size: 10px; color: #64748b; margin-top: 2px; }

  .footer { margin-top: 20px; font-size: 9px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
</style>
</head>
<body>
  <div class="kop">
    <div class="kop-left">
      <img src="/badan-gizi.png" alt="Logo Badan Gizi" class="kop-logo" />
      <div class="kop-text">
        <h2>Badan Gizi Nasional Republik Indonesia</h2>
        <h3>Satuan Pelayanan Pemenuhan Gizi (SPPG) Dapur</h3>
        <p>Sistem Pengelolaan Operasional, Logistik Dapur &amp; Akuntansi Anggaran</p>
      </div>
    </div>
    <div class="kop-right">
      <strong>Dokumen Resmi</strong><br />
      Dicetak: ${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}<br />
      Pukul: ${now.toLocaleTimeString('id-ID')}<br />
      Status: Sah &amp; Terverifikasi
    </div>
  </div>

  <div class="doc-title">
    <h1>${judul}</h1>
    <div class="badge">Periode: Rekap ${modeLabel} &bull; Unit: ${unitName}</div>
  </div>

  <table>
    <colgroup>
      <col style="width: 50px;">
      <col style="width: 22%;">
      <col style="width: 28%;">
      ${jenis !== 'pengeluaran' ? '<col style="width: 15%;">' : ''}
      ${jenis !== 'pemasukan' ? '<col style="width: 15%;">' : ''}
      ${jenis === 'semua' ? '<col style="width: 15%;">' : ''}
    </colgroup>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
    <tfoot><tr>${totCells.join('')}</tr></tfoot>
  </table>

  <div class="signatures">
    <div class="sig-box">
      <p>Petugas Administrasi &amp; Verifikasi,</p>
      <div class="sig-space"></div>
      <p class="sig-name">Staf Keuangan SPPG</p>
      <p class="sig-title">NIP / ID: SPPG-KEU-01</p>
    </div>
    <div class="sig-box">
      <p>Mengetahui / Penanggung Jawab,</p>
      <div class="sig-space"></div>
      <p class="sig-name">Abdullah Syauqillah, S.Kom</p>
      <p class="sig-title">Superadmin Pengelola Dapur SPPG</p>
    </div>
  </div>

  <p class="footer">Sistem SPPG Dapur Enterprise &bull; Rekapitulasi Otomatis &bull; Halaman ini dapat dicetak langsung atau disimpan sebagai file PDF.</p>
  <script>setTimeout(()=>{window.print();},400);</script>
</body></html>`;

  const win = window.open('', '_blank', 'width=1150,height=800');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ─── 6. Export Rekap PDF (Belanja & SPJ) ──────────────────────────────────────

export function exportAllProcurementsPDF(transactions: ProcurementTransaction[], unitFilter: string) {
  const now = new Date();
  const judul = 'LAPORAN REKAPITULASI PEMBELANJAAN & REALISASI NOTA (SPJ)';

  const totReq = transactions.reduce((s, t) => s + (t.amountRequested || 0), 0);
  const totAct = transactions.reduce((s, t) => s + (t.actualReceiptTotal || 0), 0);
  const totChange = transactions.reduce((s, t) => s + (t.changeReturned || 0), 0);

  const bodyRows = transactions
    .map((t, i) => {
      const approver = t.auditedBy && !t.auditedBy.includes('Supriyanto')
        ? t.auditedBy
        : (t.status === 'VERIFIED' ? 'Abdullah Syauqillah, S.Kom' : (t.auditedBy || 'Abdullah Syauqillah, S.Kom'));

      const statusBadge = t.status === 'VERIFIED'
        ? '<span style="color:#166534;font-weight:700">VERIFIED</span>'
        : t.status === 'FLAGGED_DISCREPANCY'
        ? '<span style="color:#991b1b;font-weight:700">SELISIH</span>'
        : '<span style="color:#854d0e;font-weight:700">PENDING</span>';

      return `<tr>
        <td class="center">${i + 1}</td>
        <td class="center">${formatDateIndo(t.date)}</td>
        <td class="mono font-bold">${t.receiptNumber}</td>
        <td>${t.sppgUnitName}</td>
        <td>${t.requesterName}</td>
        <td>${t.supplierName}</td>
        <td class="num">${formatIDR(t.amountRequested)}</td>
        <td class="num font-bold">${formatIDR(t.actualReceiptTotal)}</td>
        <td class="num">${formatIDR(t.changeReturned)}</td>
        <td class="center">${statusBadge}</td>
        <td style="font-size:10px;font-weight:600">${approver}</td>
      </tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8">
<title>${judul} – SPPG Dapur</title>
<style>
  @media print {
    @page { size: A4 landscape; margin: 8mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10px; color: #0f172a; background: #fff; padding: 12px; }
  
  .kop { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #0f172a; padding-bottom: 10px; margin-bottom: 12px; }
  .kop-left { display: flex; align-items: center; gap: 12px; }
  .kop-logo { width: 56px; height: 56px; object-fit: contain; }
  .kop-text h2 { font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
  .kop-text h3 { font-size: 11.5px; font-weight: 700; color: #1e3a8a; }
  .kop-text p { font-size: 9.5px; color: #475569; }
  .kop-right { text-align: right; font-size: 9.5px; color: #64748b; line-height: 1.35; }

  .doc-title { text-align: center; margin: 10px 0 14px 0; }
  .doc-title h1 { font-size: 13.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
  .doc-title .badge { display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; padding: 2.5px 10px; border-radius: 4px; font-size: 9.5px; color: #334155; margin-top: 3px; font-weight: 600; }

  table { width: 100%; border-collapse: collapse; margin-top: 6px; border: 1px solid #94a3b8; }
  thead th { background: #1e3a8a; color: #ffffff; padding: 7px 6px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; border: 1px solid #475569; }
  tbody td { padding: 5px 6px; border: 1px solid #cbd5e1; font-size: 9.5px; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  
  .center { text-align: center; }
  .num { text-align: right; font-family: 'Consolas', 'Courier New', monospace; font-variant-numeric: tabular-nums; }
  .mono { font-family: 'Consolas', 'Courier New', monospace; font-size: 9px; }
  .font-bold { font-weight: 700; }
  th.num { text-align: right; }
  th.center { text-align: center; }

  tfoot td { border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; }
  .total-label { font-weight: 800; text-align: right; background: #fef08a; padding: 6px 8px; font-size: 10.5px; }
  .total-val { font-weight: 800; background: #fef08a; padding: 6px 8px; font-size: 10.5px; }

  .signatures { margin-top: 26px; display: flex; justify-content: space-between; page-break-inside: avoid; }
  .sig-box { width: 220px; text-align: center; font-size: 10px; }
  .sig-space { height: 50px; }
  .sig-name { font-weight: 700; text-decoration: underline; color: #0f172a; font-size: 10.5px; }
  .sig-title { font-size: 9.5px; color: #64748b; margin-top: 2px; }

  .footer { margin-top: 16px; font-size: 8.5px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 6px; }
</style>
</head>
<body>
  <div class="kop">
    <div class="kop-left">
      <img src="/badan-gizi.png" alt="Logo Badan Gizi" class="kop-logo" />
      <div class="kop-text">
        <h2>Badan Gizi Nasional Republik Indonesia</h2>
        <h3>Satuan Pelayanan Pemenuhan Gizi (SPPG) Dapur</h3>
        <p>Buku Catatan Pembelanjaan Logistik, Kasbon Belanja &amp; Rekonsiliasi Nota Toko</p>
      </div>
    </div>
    <div class="kop-right">
      <strong>Laporan Resmi SPJ</strong><br />
      Dicetak: ${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}<br />
      Pukul: ${now.toLocaleTimeString('id-ID')}<br />
      Total Transaksi: ${transactions.length} Entri
    </div>
  </div>

  <div class="doc-title">
    <h1>${judul}</h1>
    <div class="badge">Filter Unit: ${unitFilter} &bull; Total Realisasi: ${formatIDR(totAct)}</div>
  </div>

  <table>
    <colgroup>
      <col style="width: 35px;">
      <col style="width: 80px;">
      <col style="width: 120px;">
      <col style="width: 130px;">
      <col style="width: 100px;">
      <col style="width: 130px;">
      <col style="width: 95px;">
      <col style="width: 95px;">
      <col style="width: 85px;">
      <col style="width: 75px;">
      <col style="width: 120px;">
    </colgroup>
    <thead>
      <tr>
        <th class="center">No</th>
        <th class="center">Tanggal</th>
        <th class="center">No. Nota</th>
        <th>Unit SPPG</th>
        <th>Peminta</th>
        <th>Supplier</th>
        <th class="num">Kasbon (Rp)</th>
        <th class="num">Nota (Rp)</th>
        <th class="num">Kembali (Rp)</th>
        <th class="center">Status</th>
        <th>Disetujui (ACC)</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
    <tfoot>
      <tr>
        <td colspan="6" class="total-label">TOTAL KESELURUHAN</td>
        <td class="num total-val">${formatIDR(totReq)}</td>
        <td class="num total-val">${formatIDR(totAct)}</td>
        <td class="num total-val">${formatIDR(totChange)}</td>
        <td colspan="2" class="total-val"></td>
      </tr>
    </tfoot>
  </table>

  <div class="signatures">
    <div class="sig-box">
      <p>Koordinator Pengadaan &amp; Belanja,</p>
      <div class="sig-space"></div>
      <p class="sig-name">Budi Santoso</p>
      <p class="sig-title">Staf Logistik SPPG</p>
    </div>
    <div class="sig-box">
      <p>Mengetahui / Penanggung Jawab,</p>
      <div class="sig-space"></div>
      <p class="sig-name">Abdullah Syauqillah, S.Kom</p>
      <p class="sig-title">Superadmin Pengelola Dapur SPPG</p>
    </div>
  </div>

  <p class="footer">Sistem SPPG Dapur Enterprise &bull; Rekonsiliasi Nota &bull; Halaman ini dapat dicetak langsung atau disimpan sebagai file PDF.</p>
  <script>setTimeout(()=>{window.print();},400);</script>
</body></html>`;

  const win = window.open('', '_blank', 'width=1200,height=800');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
