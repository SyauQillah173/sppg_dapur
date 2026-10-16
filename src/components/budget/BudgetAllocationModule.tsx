'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '@/lib/store';
import { formatRupiah } from '@/lib/utils';
import { exportRekap, exportRekapPDF, RekapMode, RekapJenis } from '@/lib/excel-export';
import { parseBudgetWorkbook, downloadBudgetTemplate } from '@/lib/excel-import';
import {
  Wallet, Plus, Building2, TrendingUp, CreditCard, DollarSign,
  AlertCircle, Trash2, FileSpreadsheet, FileText, Calendar, Filter,
  Upload, Download, CheckCircle2,
} from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';

export function BudgetAllocationModule() {
  const {
    budgetAllocations,
    procurements,
    sppgUnits,
    selectedSppgUnit,
    isReadOnly,
    addBudgetAllocation,
    addBudgetAllocationsBulk,
    deleteBudgetAllocation,
  } = useStore();

  // ── local filters (independent of global header filter) ──────────────────
  const [localUnit, setLocalUnit] = useState<string>('ALL');
  const [periodeMode, setPeriodeMode] = useState<'tanggal' | 'bulan' | 'tahun'>('bulan');
  const [filterTanggal, setFilterTanggal] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [rekapMode, setRekapMode] = useState<RekapMode>('bulanan');
  const [rekapJenis, setRekapJenis] = useState<RekapJenis>('semua');

  // ── modal state ───────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sppgUnitId, setSppgUnitId] = useState<string>(sppgUnits[0]?.id || '');
  // Periode dana masuk: pilih tanggal, bulan, atau tahun
  const [periodeInputMode, setPeriodeInputMode] = useState<'tanggal' | 'bulan' | 'tahun'>('bulan');
  const [inputTanggal, setInputTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [inputBulan, setInputBulan] = useState<string>(new Date().toISOString().slice(0, 7));
  const [inputTahun, setInputTahun] = useState<string>(String(new Date().getFullYear()));
  const [amountAllocated, setAmountAllocated] = useState('150000000');
  const [notes, setNotes] = useState('Pagu Kas Operasional Pemenuhan Gizi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── import Excel ──────────────────────────────────────────────────────────
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; errors: string[] } | null>(null);

  // Periode dipilih → label fiskal + tanggal ISO untuk filter/rekap.
  // Jam 12 siang lokal supaya tanggal tidak bergeser saat jadi string ISO (UTC).
  const periodeInfo = useMemo(() => {
    if (periodeInputMode === 'tanggal' && inputTanggal) {
      const [y, m, d] = inputTanggal.split('-').map(Number);
      const dt = new Date(y, (m || 1) - 1, d || 1, 12);
      if (!isNaN(dt.getTime())) {
        return {
          allocatedDate: dt.toISOString(),
          label: dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
        };
      }
    }
    if (periodeInputMode === 'tahun' && inputTahun) {
      return { allocatedDate: new Date(Number(inputTahun), 0, 1, 12).toISOString(), label: `Tahun ${inputTahun}` };
    }
    if (inputBulan) {
      const [y, m] = inputBulan.split('-').map(Number);
      const dt = new Date(y, (m || 1) - 1, 1, 12);
      return {
        allocatedDate: dt.toISOString(),
        label: dt.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      };
    }
    return { allocatedDate: new Date().toISOString(), label: '-' };
  }, [periodeInputMode, inputTanggal, inputBulan, inputTahun]);

  // ── filter helpers ────────────────────────────────────────────────────────
  const matchesDateFilter = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (periodeMode === 'tanggal' && filterTanggal) {
      return dateStr.startsWith(filterTanggal);
    }
    if (periodeMode === 'bulan' && filterBulan) {
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return ym === filterBulan;
    }
    if (periodeMode === 'tahun' && filterTahun) {
      return String(d.getFullYear()) === filterTahun;
    }
    return true; // no filter active
  };

  const hasDateFilter = (periodeMode === 'tanggal' && !!filterTanggal)
    || (periodeMode === 'bulan' && !!filterBulan)
    || (periodeMode === 'tahun' && !!filterTahun);

  // ── filtered data ─────────────────────────────────────────────────────────
  const filteredBudgets = useMemo(() => {
    return budgetAllocations.filter(b => {
      // Catatan 'ALL' (dana gabungan) tetap tampil saat satu unit dipilih
      if (localUnit !== 'ALL' && b.sppgUnitId !== localUnit && b.sppgUnitId !== 'ALL') return false;
      if (hasDateFilter && !matchesDateFilter(b.allocatedDate)) return false;
      return true;
    });
  }, [budgetAllocations, localUnit, periodeMode, filterTanggal, filterBulan, filterTahun]);

  const filteredProcurements = useMemo(() => {
    return procurements.filter(p => {
      if (localUnit !== 'ALL' && p.sppgUnitId !== localUnit && p.sppgUnitId !== 'ALL') return false;
      if (hasDateFilter && !matchesDateFilter(p.date)) return false;
      return true;
    });
  }, [procurements, localUnit, periodeMode, filterTanggal, filterBulan, filterTahun]);

  // ── KPI totals ────────────────────────────────────────────────────────────
  const totalPemasukan = filteredBudgets.reduce((s, b) => s + b.amountAllocated, 0);
  const totalPengeluaran = filteredProcurements.reduce((s, p) => s + p.actualReceiptTotal, 0);
  const saldo = totalPemasukan - totalPengeluaran;
  const absorptionRate = totalPemasukan > 0 ? (totalPengeluaran / totalPemasukan) * 100 : 0;

  // ── unit name helper ──────────────────────────────────────────────────────
  const localUnitName = localUnit === 'ALL'
    ? 'Semua Unit SPPG'
    : sppgUnits.find(u => u.id === localUnit)?.name ?? localUnit;

  // ── export ────────────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    exportRekap(filteredBudgets, filteredProcurements, rekapMode, rekapJenis, localUnit, localUnitName);
  };

  const handleExportPDF = () => {
    exportRekapPDF(filteredBudgets, filteredProcurements, rekapMode, rekapJenis, localUnit, localUnitName);
  };

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setErrorMsg('');
    setIsSubmitting(true);

    const amount = Number(String(amountAllocated).replace(/[^0-9]/g, ''));
    if (!amount || amount <= 0) {
      setErrorMsg('Nominal harus lebih dari 0');
      setIsSubmitting(false);
      return;
    }

    const isAllUnits = sppgUnitId === 'ALL';
    const targetUnit = isAllUnits ? undefined : sppgUnits.find(u => u.id === sppgUnitId);

    addBudgetAllocation({
      sppgUnitId,
      sppgUnitName: isAllUnits ? 'Semua SPPG (Gabungan 4 Unit)' : targetUnit?.name || sppgUnitId,
      fiscalPeriod: periodeInfo.label,
      allocatedDate: periodeInfo.allocatedDate,
      amountAllocated: amount,
      amountRealized: 0,
      remainingBudget: amount,
      notes,
    });

    setIsModalOpen(false);
    setIsSubmitting(false);
    setAmountAllocated('150000000');
    setNotes('Pagu Kas Operasional Pemenuhan Gizi');
  };

  // ── import Excel ──────────────────────────────────────────────────────────
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || isReadOnly) return;

    setIsImporting(true);
    setImportResult(null);
    try {
      const { rows, errors } = await parseBudgetWorkbook(file, sppgUnits);
      if (rows.length > 0) {
        addBudgetAllocationsBulk(
          rows.map(r => ({ ...r, amountRealized: 0, remainingBudget: r.amountAllocated }))
        );
      }
      setImportResult({ ok: rows.length, errors });
    } catch (err) {
      setImportResult({ ok: 0, errors: [err instanceof Error ? err.message : 'Gagal membaca file Excel.'] });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (isReadOnly) return;
    setDeleteTargetId(id);
  };

  const handleConfirmDeleteBudget = () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    deleteBudgetAllocation(deleteTargetId);
    setIsDeleting(false);
    setDeleteTargetId(null);
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Catatan Pemasukan & Pengeluaran Dana</h1>
          <p className="text-xs text-slate-500 mt-0.5">Rekap keuangan per unit SPPG dengan filter periode dan ekspor laporan.</p>
        </div>
        {!isReadOnly && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Catat Kas Masuk Baru
          </button>
        )}
        {isReadOnly && (
          <div className="text-xs px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 font-medium">
            Mode Pemantau — hanya baca
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">

          {/* Unit SPPG */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Unit SPPG</label>
            <select
              value={localUnit}
              onChange={e => setLocalUnit(e.target.value)}
              className="h-8 rounded-md border border-slate-300 px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">Semua Unit (4 Dapur)</option>
              {sppgUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          {/* Periode mode */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Filter Berdasarkan</label>
            <div className="flex rounded-md border border-slate-200 overflow-hidden">
              {(['tanggal', 'bulan', 'tahun'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPeriodeMode(m)}
                  className={`px-3 py-1.5 text-xs font-medium transition ${periodeMode === m ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date input */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              {periodeMode === 'tanggal' ? 'Pilih Tanggal' : periodeMode === 'bulan' ? 'Pilih Bulan' : 'Pilih Tahun'}
            </label>
            {periodeMode === 'tanggal' && (
              <input type="date" value={filterTanggal} onChange={e => setFilterTanggal(e.target.value)}
                className="h-8 rounded-md border border-slate-300 px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900" />
            )}
            {periodeMode === 'bulan' && (
              <input type="month" value={filterBulan} onChange={e => setFilterBulan(e.target.value)}
                className="h-8 rounded-md border border-slate-300 px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900" />
            )}
            {periodeMode === 'tahun' && (
              <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)}
                className="h-8 rounded-md border border-slate-300 px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900">
                <option value="">Semua Tahun</option>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
          </div>

          {/* Rekap mode */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Rekapitulasi</label>
            <select value={rekapMode} onChange={e => setRekapMode(e.target.value as RekapMode)}
              className="h-8 rounded-md border border-slate-300 px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900">
              <option value="harian">Harian</option>
              <option value="mingguan">Mingguan</option>
              <option value="bulanan">Bulanan</option>
              <option value="tahunan">Tahunan</option>
            </select>
          </div>

          {/* Jenis */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Jenis Rekap</label>
            <select value={rekapJenis} onChange={e => setRekapJenis(e.target.value as RekapJenis)}
              className="h-8 rounded-md border border-slate-300 px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900">
              <option value="semua">Semua (Pemasukan & Pengeluaran)</option>
              <option value="pemasukan">Pemasukan Saja</option>
              <option value="pengeluaran">Pengeluaran Saja</option>
            </select>
          </div>

          {/* Export / Import buttons */}
          <div className="flex flex-wrap gap-2 ml-auto">
            {!isReadOnly && (
              <>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <button type="button" onClick={() => importInputRef.current?.click()} disabled={isImporting}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-blue-300 bg-blue-50 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition">
                  <Upload className="h-3.5 w-3.5" />
                  {isImporting ? 'Membaca...' : 'Import Excel'}
                </button>
                <button type="button" onClick={downloadBudgetTemplate}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                  <Download className="h-3.5 w-3.5" />
                  Template
                </button>
              </>
            )}
            <button type="button" onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-emerald-300 bg-emerald-50 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export Excel
            </button>
            <button type="button" onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-red-300 bg-red-50 text-xs font-medium text-red-700 hover:bg-red-100 transition">
              <FileText className="h-3.5 w-3.5" />
              Export PDF
            </button>
          </div>
        </div>

        {importResult && (
          <div className={`rounded-md border p-3 text-xs space-y-1 ${importResult.ok > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{importResult.ok} baris dana masuk berhasil diimpor{importResult.errors.length > 0 ? `, ${importResult.errors.length} baris dilewati` : ''}.</span>
              <button type="button" onClick={() => setImportResult(null)} className="ml-auto text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            {importResult.errors.length > 0 && (
              <ul className="list-disc pl-5 space-y-0.5">
                {importResult.errors.slice(0, 8).map((err, i) => <li key={i}>{err}</li>)}
                {importResult.errors.length > 8 && <li>…dan {importResult.errors.length - 8} baris lain.</li>}
              </ul>
            )}
          </div>
        )}

        {hasDateFilter && (
          <p className="text-[11px] text-slate-400">
            Menampilkan data berdasarkan filter aktif · {filteredBudgets.length} pemasukan, {filteredProcurements.length} pengeluaran
          </p>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Total Pemasukan</span>
            <Wallet className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">{formatRupiah(totalPemasukan)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Total Pengeluaran</span>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">{formatRupiah(totalPengeluaran)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Saldo Kas</span>
            <DollarSign className="h-4 w-4 text-indigo-500" />
          </div>
          <div className={`text-lg font-bold font-mono tabular-nums ${saldo >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>
            {formatRupiah(saldo)}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Penyerapan Dana</span>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">{absorptionRate.toFixed(1)}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, absorptionRate)}%` }} />
          </div>
        </div>
      </div>

      {/* Table: Riwayat Pemasukan */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-800">Riwayat Pemasukan Dana</h2>
          <span className="text-xs text-slate-500 font-mono">{filteredBudgets.length} Data · {localUnitName}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Unit SPPG</th>
                <th className="py-3 px-4">Periode Fiskal</th>
                <th className="py-3 px-4 text-right">Dana Masuk</th>
                <th className="py-3 px-4 text-right">Realisasi</th>
                <th className="py-3 px-4 text-right">Sisa Kas</th>
                <th className="py-3 px-4">Penyerapan</th>
                <th className="py-3 px-4">Keterangan</th>
                {!isReadOnly && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBudgets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 text-xs">
                    Belum ada data pemasukan untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredBudgets.map(item => {
                  const usedPct = item.amountAllocated > 0 ? (item.amountRealized / item.amountAllocated) * 100 : 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {new Date(item.allocatedDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{item.sppgUnitName}</td>
                      <td className="py-3 px-4">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{item.fiscalPeriod}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">{formatRupiah(item.amountAllocated)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 tabular-nums">{formatRupiah(item.amountRealized)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700 tabular-nums">{formatRupiah(item.remainingBudget)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-14 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, usedPct)}%` }} />
                          </div>
                          <span className="font-mono text-[11px] text-slate-600">{usedPct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-[180px] truncate">{item.notes || '-'}</td>
                      {!isReadOnly && (
                        <td className="py-3 px-4 text-center">
                          <button type="button" onClick={() => handleDelete(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table: Riwayat Pengeluaran ringkas */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-800">Riwayat Pengeluaran (Belanja)</h2>
          <span className="text-xs text-slate-500 font-mono">{filteredProcurements.length} Transaksi · {localUnitName}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">No. Nota</th>
                <th className="py-3 px-4">Unit SPPG</th>
                <th className="py-3 px-4">Peminta</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Total Nota</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProcurements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">Belum ada pengeluaran untuk filter ini.</td>
                </tr>
              ) : (
                filteredProcurements.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(p.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">{p.receiptNumber}</td>
                    <td className="py-2.5 px-4 text-slate-700">{p.sppgUnitName}</td>
                    <td className="py-2.5 px-4 text-slate-700">{p.requesterName}</td>
                    <td className="py-2.5 px-4 text-slate-600">{p.supplierName}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">{formatRupiah(p.actualReceiptTotal)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                        p.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                        p.status === 'FLAGGED_DISCREPANCY' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {p.status === 'VERIFIED' ? 'Terverifikasi' : p.status === 'FLAGGED_DISCREPANCY' ? 'Selisih' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredProcurements.length > 0 && (
              <tfoot>
                <tr className="bg-amber-50 border-t border-amber-200">
                  <td colSpan={5} className="py-2.5 px-4 text-xs font-bold text-slate-700">TOTAL PENGELUARAN</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {formatRupiah(totalPengeluaran)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal: Tambah Kas Masuk */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-slate-700" />
                <h3 className="font-semibold text-slate-900">Catat Dana Masuk / Pagu Kas</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Unit SPPG Tujuan</label>
                <select value={sppgUnitId} onChange={e => setSppgUnitId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900">
                  {sppgUnits.map(u => <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>)}
                  <option value="ALL">Semua SPPG (Gabungan 4 Unit)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Periode Dana Masuk</label>
                <div className="flex rounded-md border border-slate-200 overflow-hidden mb-2">
                  {(['tanggal', 'bulan', 'tahun'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPeriodeInputMode(m)}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium transition ${periodeInputMode === m ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
                {periodeInputMode === 'tanggal' && (
                  <input type="date" required value={inputTanggal} onChange={e => setInputTanggal(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900" />
                )}
                {periodeInputMode === 'bulan' && (
                  <input type="month" required value={inputBulan} onChange={e => setInputBulan(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900" />
                )}
                {periodeInputMode === 'tahun' && (
                  <select value={inputTahun} onChange={e => setInputTahun(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900">
                    {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                )}
                <p className="text-[11px] text-slate-400 mt-1">Tersimpan sebagai periode: <strong className="text-slate-600">{periodeInfo.label}</strong></p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nominal Dana Masuk (Rp)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-sm">Rp</span>
                  <input type="number" step="1000000" required value={amountAllocated} onChange={e => setAmountAllocated(e.target.value)}
                    className="w-full rounded-md border border-slate-300 pl-10 pr-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">= {formatRupiah(Number(amountAllocated) || 0)}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Sumber Dana & Keterangan</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Misal: Pagu Operasional APBN Tahap 2"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTargetId}
        title="Hapus Catatan Anggaran"
        description="Apakah Anda yakin ingin menghapus data alokasi kas operasional ini?"
        warningNote="Data alokasi anggaran kas ini akan dihapus secara permanen dari database."
        confirmText="Ya, Hapus Anggaran"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDeleteBudget}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
