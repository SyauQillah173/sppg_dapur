'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { SppgUnitId } from '@/lib/types';
import {
  Building2,
  ShieldCheck,
  UserCheck,
  RotateCcw,
  Database,
  ArrowUpDown,
  Download,
} from 'lucide-react';

export function Header() {
  const {
    userRole,
    setUserRole,
    selectedSppgUnit,
    setSelectedSppgUnit,
    sppgUnits,
    resetToDefault,
  } = useStore();

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSppgUnit(e.target.value as SppgUnitId | 'ALL');
  };

  const handleExportSPJ = () => {
    const reportData = {
      appName: 'GiziFlow Enterprise ERP',
      exportTimestamp: new Date().toISOString(),
      activeUnit: selectedSppgUnit,
      generatedByRole: userRole,
      note: 'Laporan Rekonsiliasi Anggaran & SPJ SPPG Dapur Resmi',
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SPJ_Report_${selectedSppgUnit}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      {/* Top Banner for Auditor Mode if Active */}
      {userRole === 'EXECUTIVE_AUDITOR' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-semibold">MODE AUDITOR EKSEKUTIF AKTIF:</span>
            <span>Akses pantau langsung live cash flow, verifikasi fisik nota, dan cross-check item belanja per SPPG unit.</span>
          </div>
          <span className="text-[11px] font-mono opacity-80">Read-Only Live Monitor & Approval Stamping</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Enterprise Identity */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white font-bold text-sm tracking-tight dark:bg-slate-100 dark:text-slate-900">
              GF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-zinc-100 tracking-tight text-base">
                  GiziFlow
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 uppercase tracking-wider dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                  Enterprise ERP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate max-w-[280px] sm:max-w-none">
                Sistem Operasional, Logistik & Keuangan SPPG
              </p>
            </div>
          </div>

          {/* Center: SPPG Unit Switcher */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-zinc-400">
              <Building2 className="h-3.5 w-3.5" />
              <span>Unit SPPG:</span>
            </div>
            <div className="relative">
              <select
                id="header-sppg-selector"
                value={selectedSppgUnit}
                onChange={handleUnitChange}
                aria-label="Pilih Unit SPPG Dapur"
                className="h-8 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 focus:border-slate-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <option value="ALL">Semua SPPG (Konsolidasi 4 Dapur)</option>
                <option value="SPPG-AA02">A. SPPG ABAR ABIR 02</option>
                <option value="SPPG-BS02">B. SPPG BANJARSARI 02 LERAN MANYAR</option>
                <option value="SPPG-DR01">C. SPPG DAHAN REJO 01</option>
                <option value="SPPG-SM01">D. SPPG SEMAMPIR</option>
              </select>
            </div>
          </div>

          {/* Right Controls: Role Switcher, Database Status, Demo Reset */}
          <div className="flex items-center gap-2.5">
            {/* Database indicator */}
            <div
              className="hidden lg:flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-mono text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
              title="Neon PostgreSQL Schema Configured"
            >
              <Database className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span>Neon DB</span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>

            {/* Quick Role Switcher Pill */}
            <div className="flex items-center rounded-lg border border-slate-300 bg-slate-100 p-0.5 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800">
              <button
                type="button"
                id="role-btn-superadmin"
                onClick={() => setUserRole('SUPERADMIN')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition ${
                  userRole === 'SUPERADMIN'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold dark:bg-zinc-900 dark:text-zinc-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Superadmin</span>
                <span className="sm:hidden">Admin 1</span>
              </button>
              <button
                type="button"
                id="role-btn-auditor"
                onClick={() => setUserRole('EXECUTIVE_AUDITOR')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition ${
                  userRole === 'EXECUTIVE_AUDITOR'
                    ? 'bg-amber-500 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Auditor Eksekutif</span>
                <span className="sm:hidden">Auditor</span>
              </button>
            </div>

            {/* Export SPJ Button */}
            <button
              type="button"
              id="export-spj-button"
              onClick={handleExportSPJ}
              title="Ekspor Laporan Pertanggungjawaban (SPJ)"
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden md:inline">Ekspor SPJ</span>
            </button>

            {/* Reset Demo Data Button */}
            <button
              type="button"
              id="reset-demo-button"
              onClick={() => {
                if (confirm('Kembalikan seluruh data simulasi ke data awal SPPG (20 bahan client & 4 unit)?')) {
                  resetToDefault();
                }
              }}
              title="Reset data ke default 20 bahan client & 4 SPPG"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile SPPG Unit Selector */}
        <div className="flex md:hidden pb-2.5 pt-1 items-center justify-between gap-2 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400">
            <Building2 className="h-3.5 w-3.5" />
            <span className="font-medium">Unit:</span>
          </div>
          <select
            value={selectedSppgUnit}
            onChange={handleUnitChange}
            aria-label="Pilih Unit SPPG Dapur Mobile"
            className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="ALL">Semua SPPG (4 Dapur)</option>
            <option value="SPPG-AA02">A. SPPG ABAR ABIR 02</option>
            <option value="SPPG-BS02">B. BANJARSARI 02 LERAN</option>
            <option value="SPPG-DR01">C. DAHAN REJO 01</option>
            <option value="SPPG-SM01">D. SEMAMPIR</option>
          </select>
        </div>
      </div>
    </header>
  );
}
