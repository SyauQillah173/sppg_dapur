'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { ProcurementTransaction, AuditStatus, SppgUnitId } from '@/lib/types';
import { formatIDR, formatDateIndo } from '@/lib/utils';
import { exportAllProcurementsToExcel } from '@/lib/excel-export';
import {
  Receipt,
  Plus,
  Sparkles,
  Search,
  Filter,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  ExternalLink,
  ChevronDown,
  ArrowUpDown,
  FileSpreadsheet,
  AlertOctagon,
  Lock,
} from 'lucide-react';

export function ProcurementModule() {
  const {
    filteredProcurements,
    selectedSppgUnit,
    setSelectedSppgUnit,
    sppgUnits,
    openModal,
    userRole,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<AuditStatus | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<'date' | 'actualReceiptTotal' | 'receiptNumber'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Check if a transaction has any item with price anomaly
  const hasAnomaly = (trx: ProcurementTransaction) => {
    return trx.items.some((it: any) => it.hasPriceAnomaly || (it.unitPrice > 30000 && it.name.toLowerCase().includes('telur')));
  };

  // Filtered & Sorted Transactions
  const processedTransactions = useMemo(() => {
    return filteredProcurements
      .filter((p) => {
        if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchReceipt = p.receiptNumber.toLowerCase().includes(q);
          const matchSupplier = p.supplierName.toLowerCase().includes(q);
          const matchRequester = p.requesterName.toLowerCase().includes(q);
          const matchUnit = p.sppgUnitName.toLowerCase().includes(q);
          const matchItem = p.items.some((it) => it.name.toLowerCase().includes(q));
          if (!matchReceipt && !matchSupplier && !matchRequester && !matchUnit && !matchItem) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortField === 'date') {
          return sortAsc
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortField === 'actualReceiptTotal') {
          return sortAsc
            ? a.actualReceiptTotal - b.actualReceiptTotal
            : b.actualReceiptTotal - a.actualReceiptTotal;
        }
        return sortAsc
          ? a.receiptNumber.localeCompare(b.receiptNumber)
          : b.receiptNumber.localeCompare(a.receiptNumber);
      });
  }, [filteredProcurements, statusFilter, searchQuery, sortField, sortAsc]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportAllExcel = () => {
    exportAllProcurementsToExcel(processedTransactions, selectedSppgUnit);
  };

  return (
    <div className="space-y-4">
      {/* Module Title & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Pembelanjaan & Rekonsiliasi Nota Fisik (SPJ)
            </h1>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
              {processedTransactions.length} Transaksi
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Pencatatan kasbon belanja, deteksi anomali kenaikan harga (+20%), dan audit kesesuaian anggaran 4 unit SPPG
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Rekap Excel Button */}
          <button
            type="button"
            onClick={handleExportAllExcel}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-emerald-400 transition"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          {/* AI Scanner Button */}
          <button
            type="button"
            onClick={() => openModal('AI_SCANNER')}
            className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>AI Smart Nota Scanner</span>
          </button>

          {/* Add Procurement Button (Superadmin Only / Locked for Auditor) */}
          {userRole === 'SUPERADMIN' ? (
            <button
              type="button"
              onClick={() => openModal('ADD_PROCUREMENT')}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Catat Pembelanjaan</span>
            </button>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed border border-slate-200 dark:border-zinc-700"
              title="Aksi penambahan dikunci saat dalam Mode Auditor Eksekutif (Read-Only)"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Input Belanja (Terkunci)</span>
            </div>
          )}
        </div>
      </div>

      {/* Auditor Notice Banner */}
      {userRole === 'EXECUTIVE_AUDITOR' && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Petunjuk Auditor Eksekutif:</strong> Seluruh kontrol modifikasi data dinonaktifkan (Read-Only). Perhatikan tanda merah <strong>"Anomali Harga"</strong> jika terjadi kenaikan harga satuan bahan di atas toleransi 20%.
            </span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no nota, CV, peminta, atau nama bahan..."
              className="w-full rounded-md border border-slate-300 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <option value="ALL">Semua Status</option>
              <option value="VERIFIED">Terverifikasi (ACC)</option>
              <option value="PENDING_AUDIT">Menunggu Audit</option>
              <option value="FLAGGED_DISCREPANCY">Ada Selisih / Anomali</option>
            </select>
          </div>
        </div>

        {/* Quick SPPG tabs */}
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedSppgUnit('ALL')}
            className={`px-2.5 py-1 rounded text-xs transition ${
              selectedSppgUnit === 'ALL'
                ? 'bg-slate-900 text-white font-medium dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            Semua SPPG
          </button>
          {sppgUnits.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelectedSppgUnit(u.id)}
              className={`px-2 py-1 rounded text-xs transition ${
                selectedSppgUnit === u.id
                  ? 'bg-slate-900 text-white font-medium dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              {u.code.replace('SPPG-', '')}
            </button>
          ))}
        </div>
      </div>

      {/* High-Density Data Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 dark:bg-zinc-800/60 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-zinc-200"
                  onClick={() => toggleSort('date')}
                >
                  <div className="flex items-center gap-1">
                    <span>Tanggal</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-zinc-200"
                  onClick={() => toggleSort('receiptNumber')}
                >
                  <div className="flex items-center gap-1">
                    <span>Nomor Nota Fisik</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Tujuan SPPG</th>
                <th className="py-2.5 px-3">Peminta (Karyawan)</th>
                <th className="py-2.5 px-3">CV / Supplier</th>
                <th className="py-2.5 px-3 text-right">Dana Diminta</th>
                <th
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-900 dark:hover:text-zinc-200"
                  onClick={() => toggleSort('actualReceiptTotal')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Nota</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right">Uang Kembali</th>
                <th className="py-2.5 px-3 text-center">Status Audit</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {processedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data pembelanjaan dengan kriteria filter aktif.
                  </td>
                </tr>
              ) : (
                processedTransactions.map((trx) => {
                  const anomalyDetected = hasAnomaly(trx);
                  return (
                    <tr
                      key={trx.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition ${
                        anomalyDetected ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                        {formatDateIndo(trx.date)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">
                            {trx.receiptNumber}
                          </span>
                          {anomalyDetected && (
                            <span
                              className="rounded bg-rose-100 px-1 py-0.2 text-[9px] font-bold text-rose-800 border border-rose-300"
                              title="Terdeteksi anomali harga pada bahan di nota ini"
                            >
                              Anomali
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700">
                          {trx.sppgUnitName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-zinc-200 whitespace-nowrap">
                        {trx.requesterName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-300 truncate max-w-[160px]">
                        {trx.supplierName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                        {formatIDR(trx.amountRequested)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {formatIDR(trx.actualReceiptTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatIDR(trx.changeReturned)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {trx.status === 'VERIFIED' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="h-3 w-3" />
                            Terverifikasi
                          </span>
                        )}
                        {trx.status === 'PENDING_AUDIT' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="h-3 w-3" />
                            Menunggu
                          </span>
                        )}
                        {trx.status === 'FLAGGED_DISCREPANCY' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="h-3 w-3" />
                            Ada Selisih
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openModal('INSPECT_RECEIPT', trx)}
                          className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 shadow-sm transition"
                        >
                          <FileCheck2 className="h-3.5 w-3.5 text-blue-600" />
                          <span>Inspeksi Nota</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 bg-slate-50 border-t border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-xs text-slate-500 font-mono">
          <div>
            Menampilkan {processedTransactions.length} dari {filteredProcurements.length} transaksi nota
          </div>
          <div className="flex items-center gap-4">
            <span>
              Total Nilai Belanja: <strong className="text-slate-900 dark:text-zinc-100">{formatIDR(processedTransactions.reduce((acc, t) => acc + t.actualReceiptTotal, 0))}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
