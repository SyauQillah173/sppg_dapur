'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { formatRupiah } from '@/lib/utils';
import {
  Wallet,
  Plus,
  Building2,
  TrendingUp,
  CreditCard,
  DollarSign,
  AlertCircle,
  Trash2,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';

export function BudgetAllocationModule() {
  const {
    filteredBudgetAllocations,
    sppgUnits,
    selectedSppgUnit,
    isReadOnly,
    addBudgetAllocation,
    deleteBudgetAllocation,
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sppgUnitId, setSppgUnitId] = useState(sppgUnits[0]?.id || 'SPPG-AA02');
  const [fiscalPeriod, setFiscalPeriod] = useState('Oktober 2026');
  const [amountAllocated, setAmountAllocated] = useState('150000000');
  const [notes, setNotes] = useState('Pagu Kas Operasional Pemenuhan Gizi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate totals
  const totalAllocated = filteredBudgetAllocations.reduce((acc, b) => acc + b.amountAllocated, 0);
  const totalRealized = filteredBudgetAllocations.reduce((acc, b) => acc + b.amountRealized, 0);
  const totalRemaining = totalAllocated - totalRealized;
  const absorptionRate = totalAllocated > 0 ? (totalRealized / totalAllocated) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setErrorMsg('');
    setIsSubmitting(true);

    const amount = Number(amountAllocated.replace(/[^0-9]/g, ''));
    if (!amount || amount <= 0) {
      setErrorMsg('Nominal anggaran harus berupa angka lebih dari 0');
      setIsSubmitting(false);
      return;
    }

    const targetUnit = sppgUnits.find((u) => u.id === sppgUnitId);
    const sppgUnitName = targetUnit?.name || sppgUnitId;

    try {
      // Send to backend API
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sppgUnitId,
          fiscalPeriod,
          amountAllocated: amount,
          notes,
        }),
      });

      // Also update local store
      addBudgetAllocation({
        sppgUnitId,
        sppgUnitName,
        fiscalPeriod,
        amountAllocated: amount,
        amountRealized: 0,
        remainingBudget: amount,
        notes,
      });

      setIsModalOpen(false);
      setAmountAllocated('150000000');
      setNotes('Pagu Kas Operasional Pemenuhan Gizi');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan alokasi anggaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly) return;
    if (confirm('Apakah Anda yakin ingin menghapus catatan alokasi anggaran ini?')) {
      try {
        await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
      } catch {
        // ignore
      }
      deleteBudgetAllocation(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Uang Masuk & Pagu Anggaran
            </h1>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200">
              Kas Operasional SPPG
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Catat dana masuk ratusan juta rupiah, alokasi per unit SPPG, dan pantau sisa saldo kas aktif secara real-time.
          </p>
        </div>

        <div>
          {isReadOnly ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800">
              <span>Mode Auditor: Hanya Bisa Memantau</span>
            </div>
          ) : (
            <button
              type="button"
              id="btn-tambah-kas-masuk"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
            >
              <Plus className="h-4 w-4" />
              <span>+ Catat Kas Masuk Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Dana Kas Masuk</span>
            <Wallet className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 font-mono tabular-nums">
            {formatRupiah(totalAllocated)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <span>Total pagu kas per SPPG aktif</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Realisasi Belanja</span>
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 font-mono tabular-nums">
            {formatRupiah(totalRealized)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <span>Terverifikasi dari nota fisik belanja</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Sisa Saldo Kas Aktif</span>
            <DollarSign className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-indigo-700 font-mono tabular-nums">
            {formatRupiah(totalRemaining)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <span>Saldo siap digunakan belanja dapur</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Tingkat Penyerapan Dana</span>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900 font-mono tabular-nums">
            {absorptionRate.toFixed(1)}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, absorptionRate)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Table: Riwayat Alokasi Dana Masuk */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              Daftar Alokasi Kas & Pagu Anggaran
            </h2>
            <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-mono text-slate-700">
              {filteredBudgetAllocations.length} Data
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {selectedSppgUnit === 'ALL' ? 'Semua Unit SPPG' : selectedSppgUnit}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Tanggal Masuk</th>
                <th className="py-3 px-4">Unit SPPG</th>
                <th className="py-3 px-4">Periode Fiskal</th>
                <th className="py-3 px-4 text-right">Dana Masuk (Pagu)</th>
                <th className="py-3 px-4 text-right">Realisasi Belanja</th>
                <th className="py-3 px-4 text-right">Sisa Saldo Kas</th>
                <th className="py-3 px-4">Penyerapan</th>
                <th className="py-3 px-4">Keterangan / Sumber</th>
                {!isReadOnly && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBudgetAllocations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Belum ada data alokasi dana masuk untuk unit ini.
                  </td>
                </tr>
              ) : (
                filteredBudgetAllocations.map((item) => {
                  const usedPct =
                    item.amountAllocated > 0
                      ? (item.amountRealized / item.amountAllocated) * 100
                      : 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        {new Date(item.allocatedDate).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {item.sppgUnitName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          {item.fiscalPeriod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatRupiah(item.amountAllocated)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 tabular-nums">
                        {formatRupiah(item.amountRealized)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700 tabular-nums">
                        {formatRupiah(item.remainingBudget)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, usedPct)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-600">
                            {usedPct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {item.notes || '-'}
                      </td>
                      {!isReadOnly && (
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            title="Hapus Alokasi"
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
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

      {/* Modal: Tambah Kas Masuk / Alokasi Dana */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-slate-800" />
                <h3 className="font-bold text-slate-900">Catat Dana Masuk / Pagu Kas Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Unit SPPG Tujuan
                </label>
                <select
                  value={sppgUnitId}
                  onChange={(e) => setSppgUnitId(e.target.value as any)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-800 focus:outline-none"
                >
                  {sppgUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Periode Fiskal / Bulan
                </label>
                <input
                  type="text"
                  required
                  value={fiscalPeriod}
                  onChange={(e) => setFiscalPeriod(e.target.value)}
                  placeholder="Misal: Oktober 2026, Q4 2026"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nominal Dana Masuk (Rupiah)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-mono text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    step="1000000"
                    required
                    value={amountAllocated}
                    onChange={(e) => setAmountAllocated(e.target.value)}
                    placeholder="150000000"
                    className="w-full rounded-md border border-slate-300 pl-10 pr-3 py-2 text-sm font-mono font-bold text-slate-900 focus:border-slate-800 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Terbaca: {formatRupiah(Number(amountAllocated) || 0)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Sumber Dana & Keterangan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Pagu Operasional Makan Bergizi APBN Tahap 2"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Alokasi Dana'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
