'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { formatRupiah } from '@/lib/utils';
import {
  Eye, Wallet, CreditCard, DollarSign, TrendingUp,
  Building2, Search, Receipt, ExternalLink, CheckCircle2,
  Clock, AlertTriangle, FileSearch,
} from 'lucide-react';

/**
 * AuditorDashboard — tampilan khusus mode Pemantau (EXECUTIVE_AUDITOR).
 * Clean, sederhana, fokus pada data realtime: siapa mengajukan, total masuk,
 * nota foto, status audit. Read-only.
 */
export function AuditorDashboard() {
  const {
    budgetAllocations,
    procurements,
    sppgUnits,
    openModal,
  } = useStore();

  const [unitFilter, setUnitFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // ── filtered procurements ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return procurements.filter(p => {
      if (unitFilter !== 'ALL' && p.sppgUnitId !== unitFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.receiptNumber.toLowerCase().includes(q) ||
          p.requesterName.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q) ||
          p.sppgUnitName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [procurements, unitFilter, search]);

  // ── KPI ──────────────────────────────────────────────────────────────────
  const totalPemasukan = useMemo(() => {
    const bFiltered = unitFilter === 'ALL' ? budgetAllocations : budgetAllocations.filter(b => b.sppgUnitId === unitFilter);
    return bFiltered.reduce((s, b) => s + b.amountAllocated, 0);
  }, [budgetAllocations, unitFilter]);

  const totalPengeluaran = useMemo(() => filtered.reduce((s, p) => s + p.actualReceiptTotal, 0), [filtered]);
  const saldo = totalPemasukan - totalPengeluaran;
  const absorpsi = totalPemasukan > 0 ? (totalPengeluaran / totalPemasukan) * 100 : 0;

  const countVerified = filtered.filter(p => p.status === 'VERIFIED').length;
  const countPending = filtered.filter(p => p.status === 'PENDING_AUDIT').length;
  const countFlagged = filtered.filter(p => p.status === 'FLAGGED_DISCREPANCY').length;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Eye className="h-5 w-5 text-amber-500" />
          <h1 className="text-xl font-bold text-slate-900">Dashboard Pemantau</h1>
          <span className="rounded bg-amber-100 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
            Read-Only
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Pantau seluruh transaksi, pemasukan, dan nota belanja secara realtime. Data tidak bisa diubah di mode ini.
        </p>
      </div>

      {/* Filter bar — sangat sederhana, 1 baris */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-slate-200 rounded-lg px-4 py-3">
        <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
        <select
          value={unitFilter}
          onChange={e => setUnitFilter(e.target.value)}
          className="h-8 rounded-md border border-slate-200 px-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="ALL">Semua Unit SPPG (4 Dapur)</option>
          {sppgUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nota, peminta, supplier..."
            className="w-full h-8 rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* KPI Cards — 4 kartu besar, mudah dibaca */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
            <Wallet className="h-4 w-4 text-blue-500" />
            <span>Total Uang Masuk</span>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">{formatRupiah(totalPemasukan)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Dari {budgetAllocations.length} pencatatan</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
            <CreditCard className="h-4 w-4 text-emerald-500" />
            <span>Total Belanja</span>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">{formatRupiah(totalPengeluaran)}</div>
          <p className="text-[11px] text-slate-400 mt-1">Dari {filtered.length} transaksi nota</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
            <DollarSign className="h-4 w-4 text-indigo-500" />
            <span>Sisa Kas</span>
          </div>
          <div className={`text-xl font-bold font-mono tabular-nums ${saldo >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>
            {formatRupiah(saldo)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{saldo >= 0 ? 'Kas cukup' : 'Kas minus!'}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <span>Penyerapan</span>
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">{absorpsi.toFixed(1)}%</div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-2 rounded-full ${absorpsi > 90 ? 'bg-red-500' : absorpsi > 70 ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, absorpsi)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span className="font-medium text-emerald-700">{countVerified} Terverifikasi</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-medium text-amber-700">{countPending} Menunggu Audit</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          <span className="font-medium text-red-700">{countFlagged} Ada Selisih</span>
        </div>
      </div>

      {/* Tabel transaksi — simpel, besar, mudah dibaca */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-800">Daftar Transaksi Belanja</h2>
            <span className="text-xs text-slate-400 font-mono">{filtered.length} nota</span>
          </div>
          <span className="text-[11px] text-slate-400">Klik ikon mata untuk lihat nota</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">No. Nota</th>
                <th className="py-3 px-4">Unit SPPG</th>
                <th className="py-3 px-4">Pengaju (Peminta)</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Nominal Nota</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <FileSearch className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs">Tidak ada data untuk filter ini.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                      {new Date(p.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">{p.receiptNumber}</td>
                    <td className="py-3 px-4 text-xs">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700">{p.sppgUnitName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-slate-800">{p.requesterName}</div>
                      <div className="text-[11px] text-slate-400">{p.requesterRole}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{p.supplierName}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm tabular-nums">
                      {formatRupiah(p.actualReceiptTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${
                        p.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                        p.status === 'FLAGGED_DISCREPANCY' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {p.status === 'VERIFIED' ? '✓ ACC' : p.status === 'FLAGGED_DISCREPANCY' ? '⚠ Selisih' : '○ Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.receiptPhotoUrl || p.physicalReceiptImage ? (
                        <button
                          type="button"
                          onClick={() => openModal('INSPECT_RECEIPT', p)}
                          title="Lihat nota"
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-400 transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-amber-50 border-t-2 border-amber-200">
                  <td colSpan={5} className="py-3 px-4 text-xs font-bold text-slate-700">TOTAL ({filtered.length} nota)</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {formatRupiah(totalPengeluaran)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
