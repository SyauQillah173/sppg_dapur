'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { ProcurementTransaction } from '@/lib/types';
import { PhysicalReceiptView } from './PhysicalReceiptView';
import { FlagDiscrepancyModal } from './FlagDiscrepancyModal';
import { formatIDR, formatDateIndo, hitungSelisih } from '@/lib/utils';
import { exportProcurementToExcel } from '@/lib/excel-export';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  ShieldCheck,
  Printer,
  Scale,
  FileSpreadsheet,
  AlertOctagon,
} from 'lucide-react';

interface SplitScreenReceiptModalProps {
  transaction: ProcurementTransaction;
  onClose: () => void;
}

export function SplitScreenReceiptModal({ transaction, onClose }: SplitScreenReceiptModalProps) {
  const { updateAuditStatus, userRole, currentUser, ingredients } = useStore();

  const [auditNotes, setAuditNotes] = useState<string>(
    transaction.auditNotes || 'Pemeriksaan fisik nota toko telah diverifikasi kesesuaian stempel basah, tanda tangan penerima, dan kuantitas barang masuk gudang.'
  );
  const defaultApprover = transaction.auditedBy && !transaction.auditedBy.includes('Supriyanto')
    ? transaction.auditedBy
    : (currentUser?.name || (userRole === 'SUPERADMIN' ? 'Abdullah Syauqillah, S.Kom' : 'Drs. Supriyanto, Ak., CA'));

  const [auditorName, setAuditorName] = useState<string>(defaultApprover);
  const [isSuccessNotification, setIsSuccessNotification] = useState<boolean>(false);
  const [isFlagModalOpen, setIsFlagModalOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'receipt' | 'reconciliation'>('reconciliation');

  // Check balance variance
  const calculatedChange = transaction.amountRequested - transaction.actualReceiptTotal;
  const isBalanceMatch = Math.abs(calculatedChange - transaction.changeReturned) < 1;
  const selisih = hitungSelisih(transaction.amountRequested, transaction.actualReceiptTotal);

  // Price Anomaly Detection helper: checks if price exceeds 20% of ingredient benchmark
  const getItemAnomaly = (item: any) => {
    if (item.hasPriceAnomaly) {
      const prev = item.previousAvgPrice || 28000;
      const pct = Math.round(((item.unitPrice - prev) / prev) * 100);
      return { isAnomaly: true, pct, prevPrice: prev };
    }

    const matched = ingredients.find(
      (ing) => ing.name.toLowerCase() === item.name.toLowerCase()
    );
    if (matched && matched.lastPurchasePrice > 0) {
      const benchmark = matched.lastPurchasePrice;
      if (item.unitPrice > benchmark * 1.2) {
        const pct = Math.round(((item.unitPrice - benchmark) / benchmark) * 100);
        return { isAnomaly: true, pct, prevPrice: benchmark };
      }
    }
    return { isAnomaly: false, pct: 0, prevPrice: item.unitPrice };
  };

  const hasAnyAnomaly = transaction.items.some((it) => getItemAnomaly(it).isAnomaly);

  const handleApprove = async () => {
    await updateAuditStatus(transaction.id, 'VERIFIED', auditNotes, auditorName);
    setIsSuccessNotification(true);
    setTimeout(() => {
      setIsSuccessNotification(false);
      onClose();
    }, 1200);
  };

  const handleFlagConfirm = async (reason: string) => {
    await updateAuditStatus(
      transaction.id,
      'FLAGGED_DISCREPANCY',
      `[SELISIH DITEMUKAN] ${reason}. Catatan: ${auditNotes}`,
      auditorName
    );
    setIsFlagModalOpen(false);
    onClose();
  };

  const handleExportExcel = () => {
    exportProcurementToExcel(transaction);
  };

  const handlePrintAuditSheet = () => {
    window.print();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative flex flex-col w-full max-w-7xl h-[94vh] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Modal Header */}
          <div className="px-3 sm:px-5 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white mt-0.5 sm:mt-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                      Inspeksi Nota &amp; Rekonsiliasi SPJ
                    </h2>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold shrink-0">
                      {transaction.receiptNumber}
                    </span>
                    {transaction.status === 'VERIFIED' && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-300 shrink-0">
                        Terverifikasi (ACC)
                      </span>
                    )}
                    {transaction.status === 'FLAGGED_DISCREPANCY' && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-800 border border-rose-300 shrink-0">
                        Ada Selisih
                      </span>
                    )}
                    {hasAnyAnomaly && (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-300 flex items-center gap-1 shrink-0">
                        <AlertOctagon className="h-3 w-3" />
                        Anomali Harga
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-normal">
                    Unit: <span className="font-semibold text-slate-700">{transaction.sppgUnitName}</span> &bull; CV: {transaction.supplierName} &bull; Tanggal: {formatDateIndo(transaction.date)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 shadow-xs"
                    title="Unduh format spreadsheet resmi .xlsx"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Export Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintAuditSheet}
                    className="hidden md:flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
                  >
                    <Printer className="h-3.5 w-3.5 text-slate-500" />
                    <span>Cetak PDF</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition"
                  aria-label="Tutup Modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mobile View Switcher (Only visible on screens smaller than lg) */}
            <div className="flex lg:hidden mt-2.5 rounded-lg bg-slate-200/90 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMobileTab('receipt')}
                className={`flex-1 py-1.5 rounded-md transition text-center ${
                  mobileTab === 'receipt'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📷 Fisik Asli Nota Toko
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('reconciliation')}
                className={`flex-1 py-1.5 rounded-md transition text-center ${
                  mobileTab === 'reconciliation'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📋 Rincian &amp; Audit Kas
              </button>
            </div>
          </div>

          {/* Modal Body: Split-Screen Layout on Desktop, Tabbed on Mobile */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* LEFT PANE (5 Columns): Physical Receipt Inspector */}
            <div
              className={`lg:col-span-5 h-full border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-950 p-2 sm:p-3 overflow-hidden flex flex-col ${
                mobileTab === 'receipt' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              {transaction.receiptPhotoUrl && (
                <a
                  href={transaction.receiptPhotoUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Buka foto nota ukuran penuh"
                  className="mb-2 block shrink-0 rounded-md border border-slate-700 bg-black/40 overflow-hidden"
                >
                  <img
                    src={transaction.receiptPhotoUrl}
                    alt="Foto nota asli"
                    className="w-full h-36 sm:h-44 object-contain"
                  />
                </a>
              )}
              <PhysicalReceiptView transaction={transaction} />
            </div>

            {/* RIGHT PANE (7 Columns): Digital Reconciliation Table & Audit Controls */}
            <div
              className={`lg:col-span-7 h-full overflow-y-auto p-3 sm:p-6 bg-slate-50/50 flex flex-col justify-between ${
                mobileTab === 'reconciliation' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              <div className="space-y-4">
                {/* Top Financial Comparison Card (Non-overlapping, responsive grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="p-1 sm:p-0">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                      Dana Diminta (Kasbon)
                    </span>
                    <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 mt-0.5 break-words">
                      {formatIDR(transaction.amountRequested)}
                    </div>
                    <span className="text-[10px] text-slate-400">Pagu Disetujui</span>
                  </div>

                  <div className="p-1 sm:p-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                      Total Nota Fisik (Belanja)
                    </span>
                    <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-rose-600 mt-0.5 break-words">
                      {formatIDR(transaction.actualReceiptTotal)}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {transaction.items.length} Rincian Bahan
                    </span>
                  </div>

                  <div className="p-1 sm:p-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                      Sisa Uang Kembali (Kas)
                    </span>
                    <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-emerald-600 mt-0.5 break-words">
                      {formatIDR(transaction.changeReturned)}
                    </div>
                    <div className={`flex items-center gap-1 text-[10px] font-medium mt-0.5 ${selisih.over ? 'text-rose-600' : 'text-emerald-700'}`}>
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      <span className="break-words">
                        Selisih {selisih.nominalText} ({selisih.persenText}) {isBalanceMatch ? '· klop' : '· ada varian'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price Anomaly Alert Callout if Detected */}
                {hasAnyAnomaly && (
                  <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 sm:p-3.5 text-xs text-rose-900 flex items-start gap-2.5">
                    <AlertOctagon className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-rose-800">
                        Peringatan Audit Finansial: Anomali Kenaikan Harga Ditemukan!
                      </div>
                      <div className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                        Satu atau lebih bahan makanan pada nota ini mengalami kenaikan harga satuan di atas <strong>+20%</strong> dibanding patokan historis. Periksa badge merah sebelum memberikan persetujuan ACC.
                      </div>
                    </div>
                  </div>
                )}

                {/* Itemized Ingredients Verification Table with Anomaly Badges */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                  <div className="px-3 sm:px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Rincian Digital Bahan Dapur &amp; Audit
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        {transaction.items.length} Baris
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-700">
                      Total: {formatIDR(transaction.actualReceiptTotal)}
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto overflow-x-auto">
                    <table className="w-full text-xs min-w-[540px]">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="py-2 px-3 text-left">Nama Bahan</th>
                          <th className="py-2 px-2 text-left">Kategori</th>
                          <th className="py-2 px-2 text-right">Volume</th>
                          <th className="py-2 px-2 text-right">Harga Satuan</th>
                          <th className="py-2 px-3 text-right">Subtotal</th>
                          <th className="py-2 px-2 text-center">Status Audit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transaction.items.map((item, index) => {
                          const anomaly = getItemAnomaly(item);
                          return (
                            <tr
                              key={item.id || index}
                              className={`hover:bg-slate-50 ${
                                anomaly.isAnomaly ? 'bg-rose-50/50' : ''
                              }`}
                            >
                              <td className="py-2 px-3 font-medium text-slate-900">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                  <span>{item.name}</span>
                                  {anomaly.isAnomaly && (
                                    <span className="rounded bg-rose-100 text-rose-800 px-1.5 py-0.2 text-[9px] font-bold font-mono whitespace-nowrap self-start">
                                      +{anomaly.pct}% (Patokan: {formatIDR(anomaly.prevPrice)})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-2">
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                                  {item.category}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-800 font-medium whitespace-nowrap">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                                {formatIDR(item.unitPrice)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                                {formatIDR(item.subtotal)}
                              </td>
                              <td className="py-2 px-2 text-center whitespace-nowrap">
                                {anomaly.isAnomaly ? (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600">
                                    <AlertTriangle className="h-3 w-3" />
                                    Perlu Cek
                                  </span>
                                ) : item.isItemVerified || transaction.status === 'VERIFIED' ? (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Valid
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                                    Sesuai
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Auditor Remarks Section */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="auditor-notes" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <FileCheck2 className="h-3.5 w-3.5 text-blue-600" />
                      Catatan Audit &amp; Berita Acara Rekonsiliasi Kas
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">Stempel Sah Auditor</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">Petugas ACC / Penanggung Jawab:</label>
                      <input
                        type="text"
                        value={auditorName}
                        onChange={(e) => setAuditorName(e.target.value)}
                        className="mt-0.5 w-full rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium">Kesesuaian Fisik Gudang:</label>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 truncate">
                        <Scale className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Fisik Diterima Lengkap di Gudang SPPG</span>
                      </div>
                    </div>
                  </div>

                  <textarea
                    id="auditor-notes"
                    value={auditNotes}
                    onChange={(e) => setAuditNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-xs text-slate-800 focus:outline-none focus:border-slate-500"
                    placeholder="Ketik catatan audit resmi..."
                  />
                </div>
              </div>

              {/* Bottom Actions for Auditor */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Mode saat ini: <span className="font-semibold text-slate-800">{userRole === 'EXECUTIVE_AUDITOR' ? 'Auditor Eksekutif (Admin 2)' : 'Superadmin'}</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFlagModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Tandai Ada Selisih</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApprove}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 transition active:scale-98"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>ACC &amp; Verifikasi Nota (Sah)</span>
                  </button>
                </div>
              </div>

              {/* Success flash */}
              {isSuccessNotification && (
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Nota {transaction.receiptNumber} Berhasil Diverifikasi!</span>
                </div>
              )}
            </div>
          </div>

          {/* PRINT ONLY: OFFICIAL SPJ AUDIT REPORT */}
          <div className="hidden print:block p-8 bg-white text-black text-xs space-y-4">
            <div className="text-center border-b-2 border-black pb-3">
              <h1 className="text-lg font-bold uppercase tracking-wider">PEMERINTAH KABUPATEN GRESIK</h1>
              <h2 className="text-sm font-semibold uppercase">SATUAN PELAYANAN PROGRAM GIZI (SPPG)</h2>
              <h3 className="text-xs font-mono">BERITA ACARA REKONSILIASI PEMBELANJAAN &amp; SURAT PERTANGGUNGJAWABAN (SPJ)</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p><strong>Nomor Dokumen:</strong> {transaction.receiptNumber}</p>
                <p><strong>Unit SPPG:</strong> {transaction.sppgUnitName}</p>
                <p><strong>Tanggal SPJ:</strong> {formatDateIndo(transaction.date)}</p>
              </div>
              <div>
                <p><strong>Peminta Belanja:</strong> {transaction.requesterName} ({transaction.requesterRole})</p>
                <p><strong>Rekanan CV / Supplier:</strong> {transaction.supplierName}</p>
                <p><strong>Status Verifikasi:</strong> {transaction.status}</p>
              </div>
            </div>

            <div className="border border-black p-3 my-2 space-y-1">
              <p><strong>Dana Diminta (Kasbon):</strong> {formatIDR(transaction.amountRequested)}</p>
              <p><strong>Total Realisasi Nota Toko:</strong> {formatIDR(transaction.actualReceiptTotal)}</p>
              <p><strong>Sisa Uang Kembali ke Kasir:</strong> {formatIDR(transaction.changeReturned)}</p>
              <p><strong>Catatan Auditor:</strong> {auditNotes}</p>
            </div>

            <table className="w-full border-collapse border border-black text-[10px]">
              <thead>
                <tr className="border-b border-black bg-gray-100 font-bold">
                  <th className="border border-black p-1 text-center w-8">No</th>
                  <th className="border border-black p-1 text-left">Nama Bahan Makanan</th>
                  <th className="border border-black p-1 text-left">Kategori Gizi</th>
                  <th className="border border-black p-1 text-right">Volume</th>
                  <th className="border border-black p-1 text-right">Harga Satuan</th>
                  <th className="border border-black p-1 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {transaction.items.map((it, idx) => (
                  <tr key={it.id || idx}>
                    <td className="border border-black p-1 text-center">{idx + 1}</td>
                    <td className="border border-black p-1">{it.name}</td>
                    <td className="border border-black p-1">{it.category}</td>
                    <td className="border border-black p-1 text-right">{it.quantity} {it.unit}</td>
                    <td className="border border-black p-1 text-right">{formatIDR(it.unitPrice)}</td>
                    <td className="border border-black p-1 text-right font-bold">{formatIDR(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-8 grid grid-cols-2 text-center text-xs">
              <div>
                <p>Petugas Belanja (Superadmin),</p>
                <div className="h-16"></div>
                <p className="font-bold border-t border-black inline-block px-8">{transaction.requesterName}</p>
              </div>
              <div>
                <p>Auditor Eksekutif (Admin 2),</p>
                <div className="h-16"></div>
                <p className="font-bold border-t border-black inline-block px-8">{auditorName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Flag Discrepancy Modal */}
      <FlagDiscrepancyModal
        isOpen={isFlagModalOpen}
        transaction={transaction}
        hasAnyAnomaly={hasAnyAnomaly}
        initialReason={transaction.discrepancyReason}
        onConfirm={handleFlagConfirm}
        onClose={() => setIsFlagModalOpen(false)}
      />
    </>
  );
}
