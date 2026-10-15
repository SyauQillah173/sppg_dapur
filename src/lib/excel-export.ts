import * as XLSX from 'xlsx';
import { ProcurementTransaction } from './types';
import { formatIDR, formatDateIndo } from './utils';

export function exportProcurementToExcel(transaction: ProcurementTransaction) {
  // 1. Header Information Sheet
  const headerData = [
    ['BERITA ACARA REKONSILIASI PEMBELANJAAN & SPJ SPPG DAPUR'],
    ['SISTEM ENTERPRISE GIZIFLOW - AUDIT FINANSIAL RESMI'],
    [''],
    ['Nomor Nota Fisik', transaction.receiptNumber],
    ['Tanggal Transaksi', formatDateIndo(transaction.date)],
    ['Unit SPPG Dapur', transaction.sppgUnitName],
    ['Peminta Belanja (Karyawan)', transaction.requesterName],
    ['Jabatan Peminta', transaction.requesterRole],
    ['CV / Rekanan Supplier', transaction.supplierName],
    ['Alamat CV', transaction.supplierAddress],
    [''],
    ['RINGKASAN ANGGARAN & KAS'],
    ['Dana Diminta (Kasbon)', transaction.amountRequested],
    ['Total Realisasi Nota Fisik', transaction.actualReceiptTotal],
    ['Sisa Uang Kembali (Kas)', transaction.changeReturned],
    ['Status Audit', transaction.status],
    ['Auditor Pemeriksa', transaction.auditedBy || 'Drs. Supriyanto, Ak., CA'],
    ['Catatan Hasil Audit', transaction.auditNotes || '-'],
    [''],
    ['RINCIAN ITEM BELANJA BAHAN MAKANAN'],
  ];

  // 2. Line Items Table
  const itemHeaders = ['No', 'Nama Bahan Dapur', 'Kategori Gizi', 'Volume / Qty', 'Satuan', 'Harga Satuan (Rp)', 'Subtotal (Rp)', 'Status Verifikasi', 'Peringatan Anomali'];
  const itemRows = transaction.items.map((it, idx) => [
    idx + 1,
    it.name,
    it.category,
    it.quantity,
    it.unit,
    it.unitPrice,
    it.subtotal,
    it.isItemVerified ? 'VALID' : 'BELUM ACC',
    (it as any).hasPriceAnomaly ? 'ANOMALI HARGA (>20%)' : 'NORMAL',
  ]);

  const combinedData = [
    ...headerData,
    itemHeaders,
    ...itemRows,
    [''],
    ['TANDA TANGAN & PENGESAHAN'],
    ['Petugas Pengadaan SPPG (Superadmin)', '', '', '', '', 'Auditor Eksekutif (Admin 2)'],
    [''],
    [''],
    [`(${transaction.requesterName})`, '', '', '', '', `(${transaction.auditedBy || 'Drs. Supriyanto, Ak., CA'})`],
  ];

  const ws = XLSX.utils.aoa_to_sheet(combinedData);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 20 },
    { wch: 14 },
    { wch: 10 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 24 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Berita Acara SPJ');

  const fileName = `SPJ_${transaction.receiptNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportAllProcurementsToExcel(transactions: ProcurementTransaction[], unitFilter: string) {
  const summaryRows = transactions.map((t, idx) => [
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
    t.auditedBy || '-',
  ]);

  const headers = [
    ['LAPORAN REKAPITULASI PEMBELANJAAN & AUDIT NOTA SPPG'],
    [`Filter Unit: ${unitFilter} | Tanggal Ekspor: ${formatDateIndo(new Date().toISOString())}`],
    [''],
    ['No', 'Tanggal', 'No. Nota', 'Unit SPPG', 'Peminta Belanja', 'CV Supplier', 'Dana Diminta (Rp)', 'Total Nota (Rp)', 'Uang Kembali (Rp)', 'Status Audit', 'Jumlah Item', 'Auditor'],
    ...summaryRows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(headers);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 14 },
    { wch: 24 },
    { wch: 26 },
    { wch: 20 },
    { wch: 26 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 22 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Belanja SPPG');

  const fileName = `Rekap_SPJ_SPPG_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportConsolidatedSPPGSummaryToExcel(
  units: any[],
  transactions: ProcurementTransaction[],
  ingredients: any[]
) {
  exportAllProcurementsToExcel(transactions, 'Semua Unit SPPG (Konsolidasi 4 Dapur)');
}

