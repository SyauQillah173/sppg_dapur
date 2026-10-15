import * as XLSX from 'xlsx';
import { ProcurementTransaction, BudgetAllocationItem, SppgUnit } from './types';
import { formatIDR, formatDateIndo } from './utils';

// ─── Helpers ────────────────────────────────────────────────────────────────

function colLetter(n: number) {
  let s = '';
  let idx = n;
  while (idx >= 0) { s = String.fromCharCode(65 + (idx % 26)) + s; idx = Math.floor(idx / 26) - 1; }
  return s;
}

function styleCell(ws: XLSX.WorkSheet, cell: string, opts: {
  bold?: boolean; bg?: string; color?: string; size?: number; align?: string; numFmt?: string;
}) {
  if (!ws[cell]) return;
  ws[cell].s = {
    font: { bold: opts.bold, sz: opts.size ?? 10, color: opts.color ? { rgb: opts.color } : undefined },
    fill: opts.bg ? { fgColor: { rgb: opts.bg }, patternType: 'solid' } : undefined,
    alignment: { horizontal: opts.align ?? 'left', vertical: 'center', wrapText: true },
    numFmt: opts.numFmt,
    border: {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } },
    },
  };
}

// ─── 1. Per-transaction SPJ export ──────────────────────────────────────────

export function exportProcurementToExcel(transaction: ProcurementTransaction) {
  const itemRows = transaction.items.map((it, idx) => [
    idx + 1, it.name, it.category, it.quantity, it.unit,
    it.unitPrice, it.subtotal,
    it.isItemVerified ? 'VALID' : 'BELUM ACC',
    (it as any).hasPriceAnomaly ? 'ANOMALI' : 'NORMAL',
  ]);

  const HEADER_ROWS = 19;
  const data = [
    ['BERITA ACARA PEMBELANJAAN & SPJ SPPG DAPUR'],
    [''],
    ['Nomor Nota', transaction.receiptNumber],
    ['Tanggal', formatDateIndo(transaction.date)],
    ['Unit SPPG', transaction.sppgUnitName],
    ['Peminta', transaction.requesterName],
    ['Jabatan', transaction.requesterRole],
    ['Supplier', transaction.supplierName],
    ['Alamat Supplier', transaction.supplierAddress],
    [''],
    ['Dana Diminta (Kasbon)', transaction.amountRequested],
    ['Total Nota Fisik', transaction.actualReceiptTotal],
    ['Uang Kembali', transaction.changeReturned],
    ['Status Audit', transaction.status],
    ['Auditor', transaction.auditedBy || '-'],
    ['Catatan Audit', transaction.auditNotes || '-'],
    [''],
    ['No', 'Nama Bahan', 'Kategori', 'Qty', 'Satuan', 'Harga Satuan (Rp)', 'Subtotal (Rp)', 'Status', 'Anomali'],
    ...itemRows,
    ['', '', '', '', '', '', { f: `SUM(G${HEADER_ROWS}:G${HEADER_ROWS + itemRows.length - 1})` }],
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 6 }, { wch: 32 }, { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 }];
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];
  styleCell(ws, 'A1', { bold: true, bg: '0F172A', color: 'FFFFFF', size: 12, align: 'center' });
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].forEach(c => {
    styleCell(ws, c + '18', { bold: true, bg: '334155', color: 'FFFFFF', align: 'center' });
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SPJ');
  XLSX.writeFile(wb, `SPJ_${transaction.receiptNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`);
}

// ─── 2. Procurement rekap ────────────────────────────────────────────────────

export function exportAllProcurementsToExcel(transactions: ProcurementTransaction[], unitFilter: string) {
  const now = new Date();
  const dataRows = transactions.map((t, idx) => [
    idx + 1, formatDateIndo(t.date), t.receiptNumber, t.sppgUnitName,
    t.requesterName, t.supplierName,
    t.amountRequested, t.actualReceiptTotal, t.changeReturned,
    t.status, t.items.length, t.auditedBy || '-',
  ]);

  const HEADER_ROW = 4;
  const DATA_START = HEADER_ROW + 1;
  const DATA_END = DATA_START + dataRows.length - 1;
  const cols = ['No','Tanggal','No. Nota','Unit SPPG','Peminta','Supplier',
    'Dana Diminta (Rp)','Total Nota (Rp)','Uang Kembali (Rp)','Status','Jml Item','Auditor'];

  const totalRow = dataRows.length > 0
    ? ['','','','','','TOTAL',
        { f: `SUM(G${DATA_START}:G${DATA_END})` },
        { f: `SUM(H${DATA_START}:H${DATA_END})` },
        { f: `SUM(I${DATA_START}:I${DATA_END})` },
        '','','']
    : ['','','','','','TOTAL',0,0,0,'','',''];

  const ws = XLSX.utils.aoa_to_sheet([
    [`LAPORAN REKAPITULASI PEMBELANJAAN SPPG DAPUR`],
    [`Filter Unit: ${unitFilter} | Dicetak: ${formatDateIndo(now.toISOString())}`],
    [''],
    cols, ...dataRows, totalRow,
  ]);

  ws['!cols'] = [{ wch: 4 },{ wch: 13 },{ wch: 26 },{ wch: 26 },{ wch: 20 },{ wch: 26 },
    { wch: 18 },{ wch: 18 },{ wch: 16 },{ wch: 20 },{ wch: 9 },{ wch: 22 }];
  ws['!merges'] = [{ s:{r:0,c:0},e:{r:0,c:11} },{ s:{r:1,c:0},e:{r:1,c:11} }];

  styleCell(ws,'A1',{ bold:true,bg:'0F172A',color:'FFFFFF',size:13,align:'center' });
  styleCell(ws,'A2',{ bg:'1E293B',color:'94A3B8',size:10,align:'center' });
  cols.forEach((_,ci) => styleCell(ws, colLetter(ci)+'4', { bold:true,bg:'334155',color:'FFFFFF',align:'center' }));
  dataRows.forEach((_,ri) => {
    const row = DATA_START + ri;
    if (ri % 2 === 0) cols.forEach((_,ci) => {
      const c = colLetter(ci) + row;
      if (!ws[c]) ws[c] = { v:'',t:'s' };
      ws[c].s = { fill: { fgColor: { rgb: 'F8FAFC' }, patternType: 'solid' } };
    });
  });
  if (dataRows.length > 0) cols.forEach((_,ci) => {
    const c = colLetter(ci) + (DATA_END + 1);
    if (!ws[c]) ws[c] = { v:'',t:'s' };
    ws[c].s = { font:{bold:true}, fill:{ fgColor:{rgb:'FEF9C3'},patternType:'solid' } };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Belanja');
  XLSX.writeFile(wb, `Rekap_SPJ_SPPG_${now.toISOString().slice(0,10)}.xlsx`);
}

export function exportConsolidatedSPPGSummaryToExcel(units: SppgUnit[], transactions: ProcurementTransaction[], ingredients: any[]) {
  exportAllProcurementsToExcel(transactions, 'Semua Unit SPPG (Konsolidasi 4 Dapur)');
}

// ─── 3. Rekap Keuangan types & helpers ──────────────────────────────────────

export type RekapMode = 'harian' | 'mingguan' | 'bulanan' | 'tahunan';
export type RekapJenis = 'semua' | 'pemasukan' | 'pengeluaran';

interface RekapRow { periode: string; unit: string; pemasukan: number; pengeluaran: number; saldo: number; }

function getPeriodeLabel(dateStr: string, mode: RekapMode): string {
  const d = new Date(dateStr);
  if (mode === 'harian') return d.toLocaleDateString('id-ID', { day:'2-digit',month:'short',year:'numeric' });
  if (mode === 'mingguan') {
    const start = new Date(d); start.setDate(d.getDate()-d.getDay());
    const end = new Date(start); end.setDate(start.getDate()+6);
    return `${start.toLocaleDateString('id-ID',{day:'2-digit',month:'short'})} – ${end.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'})}`;
  }
  if (mode === 'bulanan') return d.toLocaleDateString('id-ID', { month:'long',year:'numeric' });
  return d.getFullYear().toString();
}

function getPeriodeKey(dateStr: string, mode: RekapMode): string {
  const d = new Date(dateStr);
  if (mode === 'harian') return d.toISOString().slice(0,10);
  if (mode === 'mingguan') { const s=new Date(d); s.setDate(d.getDate()-d.getDay()); return s.toISOString().slice(0,10); }
  if (mode === 'bulanan') return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  return d.getFullYear().toString();
}

function buildRekapRows(
  budgets: BudgetAllocationItem[], transactions: ProcurementTransaction[],
  mode: RekapMode, jenis: RekapJenis
): RekapRow[] {
  const map = new Map<string, RekapRow>();
  if (jenis !== 'pengeluaran') {
    for (const b of budgets) {
      const key = getPeriodeKey(b.allocatedDate, mode) + '|' + b.sppgUnitName;
      if (!map.has(key)) map.set(key, { periode: getPeriodeLabel(b.allocatedDate, mode), unit: b.sppgUnitName, pemasukan:0, pengeluaran:0, saldo:0 });
      map.get(key)!.pemasukan += b.amountAllocated;
    }
  }
  if (jenis !== 'pemasukan') {
    for (const t of transactions) {
      const key = getPeriodeKey(t.date, mode) + '|' + t.sppgUnitName;
      if (!map.has(key)) map.set(key, { periode: getPeriodeLabel(t.date, mode), unit: t.sppgUnitName, pemasukan:0, pengeluaran:0, saldo:0 });
      map.get(key)!.pengeluaran += t.actualReceiptTotal;
    }
  }
  const rows = Array.from(map.values()).sort((a,b) => a.periode.localeCompare(b.periode));
  rows.forEach(r => { r.saldo = r.pemasukan - r.pengeluaran; });
  return rows;
}

// ─── 4. Export Rekap Excel ───────────────────────────────────────────────────

export function exportRekap(
  budgets: BudgetAllocationItem[], transactions: ProcurementTransaction[],
  mode: RekapMode, jenis: RekapJenis, unitFilter: string, unitName: string,
) {
  const now = new Date();
  const rows = buildRekapRows(budgets, transactions, mode, jenis);
  const modeLabel = { harian:'Harian',mingguan:'Mingguan',bulanan:'Bulanan',tahunan:'Tahunan' }[mode];
  const judul = jenis==='pemasukan' ? 'REKAP PEMASUKAN' : jenis==='pengeluaran' ? 'REKAP PENGELUARAN' : 'REKAP KEUANGAN (PEMASUKAN & PENGELUARAN)';

  const colHeaders: string[] = ['No','Periode','Unit SPPG'];
  if (jenis !== 'pengeluaran') colHeaders.push('Pemasukan (Rp)');
  if (jenis !== 'pemasukan') colHeaders.push('Pengeluaran (Rp)');
  if (jenis === 'semua') colHeaders.push('Saldo (Rp)');

  const dataRows = rows.map((r, i) => {
    const row: (string|number)[] = [i+1, r.periode, r.unit];
    if (jenis !== 'pengeluaran') row.push(r.pemasukan);
    if (jenis !== 'pemasukan') row.push(r.pengeluaran);
    if (jenis === 'semua') row.push(r.saldo);
    return row;
  });

  const HEADER_ROW = 4;
  const DATA_START = HEADER_ROW + 1;
  const DATA_END = DATA_START + dataRows.length - 1;

  const totalRow: any[] = ['','','TOTAL'];
  let co = 3;
  if (jenis !== 'pengeluaran') { totalRow.push({ f:`SUM(${colLetter(co)}${DATA_START}:${colLetter(co)}${DATA_END})` }); co++; }
  if (jenis !== 'pemasukan')   { totalRow.push({ f:`SUM(${colLetter(co)}${DATA_START}:${colLetter(co)}${DATA_END})` }); co++; }
  if (jenis === 'semua')       { totalRow.push({ f:`SUM(${colLetter(co)}${DATA_START}:${colLetter(co)}${DATA_END})` }); }

  const ws = XLSX.utils.aoa_to_sheet([
    [judul],
    [`Rekap ${modeLabel} | Unit: ${unitName} | Dicetak: ${formatDateIndo(now.toISOString())}`],
    [''],
    colHeaders, ...dataRows, totalRow,
  ]);

  ws['!cols'] = [{ wch:4 },{ wch:28 },{ wch:26 },{ wch:20 },{ wch:20 },{ wch:18 }];
  ws['!merges'] = [{ s:{r:0,c:0},e:{r:0,c:colHeaders.length-1} },{ s:{r:1,c:0},e:{r:1,c:colHeaders.length-1} }];

  styleCell(ws,'A1',{ bold:true,bg:'0F172A',color:'FFFFFF',size:13,align:'center' });
  styleCell(ws,'A2',{ bg:'1E293B',color:'94A3B8',size:10,align:'center' });
  colHeaders.forEach((_,ci) => styleCell(ws, colLetter(ci)+HEADER_ROW, { bold:true,bg:'334155',color:'FFFFFF',align:'center' }));

  dataRows.forEach((_,ri) => {
    const row = DATA_START + ri;
    colHeaders.forEach((h,ci) => {
      const c = colLetter(ci)+row;
      if (!ws[c]) ws[c] = { v:'',t:'s' };
      ws[c].s = {
        fill: ri%2===0 ? { fgColor:{rgb:'F8FAFC'},patternType:'solid' } : undefined,
        numFmt: h.includes('Rp') ? '#,##0' : undefined,
        alignment: { horizontal: h.includes('Rp') ? 'right' : 'left' },
      };
    });
  });

  colHeaders.forEach((h,ci) => {
    const c = colLetter(ci)+(DATA_END+1);
    if (!ws[c]) ws[c] = { v:'',t:'s' };
    ws[c].s = { font:{bold:true}, fill:{fgColor:{rgb:'FEF9C3'},patternType:'solid'}, numFmt: h.includes('Rp') ? '#,##0' : undefined };
  });

  // Saldo merah/hijau
  if (jenis === 'semua') {
    const saldoCI = colHeaders.length - 1;
    rows.forEach((r,ri) => {
      const c = colLetter(saldoCI)+(DATA_START+ri);
      if (!ws[c]) return;
      ws[c].s = { ...ws[c].s, font: { color:{ rgb: r.saldo>=0 ? '166534' : '991B1B' }, bold:true }, numFmt:'#,##0' };
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Rekap ${modeLabel}`);
  const fname = `Rekap_${jenis==='semua'?'Keuangan':jenis==='pemasukan'?'Pemasukan':'Pengeluaran'}_${modeLabel}_${now.toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, fname);
}

// ─── 5. Export Rekap PDF (window.print approach, zero deps) ──────────────────

export function exportRekapPDF(
  budgets: BudgetAllocationItem[], transactions: ProcurementTransaction[],
  mode: RekapMode, jenis: RekapJenis, unitFilter: string, unitName: string,
) {
  const rows = buildRekapRows(budgets, transactions, mode, jenis);
  const modeLabel = { harian:'Harian',mingguan:'Mingguan',bulanan:'Bulanan',tahunan:'Tahunan' }[mode];
  const judul = jenis==='pemasukan'?'REKAP PEMASUKAN':jenis==='pengeluaran'?'REKAP PENGELUARAN':'REKAP KEUANGAN';
  const now = new Date();

  const totP = rows.reduce((s,r)=>s+r.pemasukan,0);
  const totK = rows.reduce((s,r)=>s+r.pengeluaran,0);
  const totS = totP-totK;

  const colsHtml: string[] = ['No','Periode','Unit SPPG'];
  if (jenis !== 'pengeluaran') colsHtml.push('Pemasukan (Rp)');
  if (jenis !== 'pemasukan')   colsHtml.push('Pengeluaran (Rp)');
  if (jenis === 'semua')       colsHtml.push('Saldo (Rp)');

  const headerCells = colsHtml.map(h => `<th>${h}</th>`).join('');

  const bodyRows = rows.map((r,i) => {
    const cells: string[] = [`<td style="text-align:center">${i+1}</td>`,`<td>${r.periode}</td>`,`<td>${r.unit}</td>`];
    if (jenis !== 'pengeluaran') cells.push(`<td class="num">${formatIDR(r.pemasukan)}</td>`);
    if (jenis !== 'pemasukan')   cells.push(`<td class="num">${formatIDR(r.pengeluaran)}</td>`);
    if (jenis === 'semua')       cells.push(`<td class="num ${r.saldo>=0?'pos':'neg'}">${formatIDR(r.saldo)}</td>`);
    return `<tr>${cells.join('')}</tr>`;
  }).join('');

  const totCells: string[] = [`<td colspan="3" style="font-weight:700;background:#fef9c3">TOTAL</td>`];
  if (jenis !== 'pengeluaran') totCells.push(`<td class="num" style="font-weight:700;background:#fef9c3">${formatIDR(totP)}</td>`);
  if (jenis !== 'pemasukan')   totCells.push(`<td class="num" style="font-weight:700;background:#fef9c3">${formatIDR(totK)}</td>`);
  if (jenis === 'semua')       totCells.push(`<td class="num ${totS>=0?'pos':'neg'}" style="font-weight:700;background:#fef9c3">${formatIDR(totS)}</td>`);

  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8">
<title>${judul} – SPPG Dapur</title>
<style>
  @media print { @page { size: A4 landscape; margin: 12mm; } body { -webkit-print-color-adjust: exact; } }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; }
  .hdr { background:#0f172a; color:#fff; padding: 12px 16px; border-radius:4px 4px 0 0; }
  .hdr h1 { font-size:15px; font-weight:700; letter-spacing:.5px; }
  .hdr p  { font-size:10px; color:#94a3b8; margin-top:4px; }
  table { width:100%; border-collapse:collapse; margin-top:0; }
  thead th { background:#334155; color:#fff; padding:8px 10px; text-align:left; font-size:10px; }
  tbody tr:nth-child(even) td { background:#f8fafc; }
  td { padding:7px 10px; border-bottom:1px solid #e2e8f0; }
  .num { text-align:right; font-family:monospace; }
  .pos { color:#166534; font-weight:700; }
  .neg { color:#991b1b; font-weight:700; }
  tfoot td { border-top: 2px solid #fbbf24; }
  .footer { margin-top:16px; font-size:9px; color:#94a3b8; text-align:center; }
</style></head><body>
<div class="hdr">
  <h1>${judul} – SPPG DAPUR</h1>
  <p>Rekap ${modeLabel} &bull; Unit: ${unitName} &bull; Dicetak: ${now.toLocaleString('id-ID')}</p>
</div>
<table>
  <thead><tr>${headerCells}</tr></thead>
  <tbody>${bodyRows}</tbody>
  <tfoot><tr>${totCells.join('')}</tr></tfoot>
</table>
<p class="footer">Sistem SPPG Dapur &bull; Laporan otomatis &bull; Halaman ini dapat disimpan sebagai PDF melalui dialog cetak browser.</p>
<script>setTimeout(()=>{window.print();},400);</script>
</body></html>`;

  const win = window.open('', '_blank', 'width=1100,height=750');
  if (win) { win.document.write(html); win.document.close(); }
}
