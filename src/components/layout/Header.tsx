'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { SppgUnitId } from '@/lib/types';
import {
  Building2,
  ShieldCheck,
  UserCheck,
  Download,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { exportConsolidatedSPPGSummaryToExcel } from '@/lib/excel-export';

export function Header() {
  const {
    currentUser,
    userRole,
    setUserRole,
    selectedSppgUnit,
    setSelectedSppgUnit,
    sppgUnits,
    procurements,
    ingredients,
    logout,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSppgUnit(e.target.value as SppgUnitId | 'ALL');
  };

  const handleExportExcel = () => {
    exportConsolidatedSPPGSummaryToExcel(sppgUnits, procurements, ingredients);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      {/* Auditor Mode Banner */}
      {userRole === 'EXECUTIVE_AUDITOR' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="font-semibold shrink-0">MODE PEMANTAU:</span>
            <span className="truncate">Hak akses View & Audit Only — tombol Tambah/Ubah/Hapus nonaktif.</span>
          </div>
          <span className="text-[10px] font-mono opacity-80 shrink-0 hidden sm:inline">Read-Only</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs sm:text-sm tracking-tight shadow-sm shrink-0">
              GF
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-base truncate">
                  SPPG Dapur
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-slate-700 uppercase tracking-wider border border-slate-200 shrink-0 hidden sm:inline">
                  Private
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-[160px] sm:max-w-none">
                Manajemen Operasional & Keuangan Gizi
              </p>
            </div>
          </div>

          {/* Desktop: SPPG Unit Switcher */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Building2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Unit:</span>
            </div>
            <select
              id="header-sppg-selector"
              value={selectedSppgUnit}
              onChange={handleUnitChange}
              aria-label="Pilih Unit SPPG"
              className="h-8 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:border-slate-800 focus:outline-none"
            >
              <option value="ALL">Semua SPPG (4 Dapur)</option>
              {sppgUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-2">
            {/* Role Switcher */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setUserRole('SUPERADMIN')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition ${
                  userRole === 'SUPERADMIN'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Superadmin (Full Control)"
              >
                <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                <span className="hidden lg:inline">Superadmin</span>
                <span className="lg:hidden">Admin 1</span>
              </button>
              <button
                type="button"
                onClick={() => setUserRole('EXECUTIVE_AUDITOR')}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition ${
                  userRole === 'EXECUTIVE_AUDITOR'
                    ? 'bg-amber-500 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Pemantau (Audit Only)"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Pemantau</span>
                <span className="lg:hidden">Admin 2</span>
              </button>
            </div>

            {/* Export */}
            <button
              type="button"
              onClick={handleExportExcel}
              title="Download Rekap Excel"
              className="hidden xl:flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Ekspor</span>
            </button>

            {/* User + Logout */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <div className="hidden xl:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser?.name || (userRole === 'SUPERADMIN' ? 'Superadmin' : 'Pemantau')}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {userRole === 'SUPERADMIN' ? 'Superadmin' : 'Pemantau'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Yakin ingin keluar dari sistem?')) logout();
                }}
                title="Logout"
                className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-rose-600 shadow-sm hover:bg-rose-50 hover:border-rose-300 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Keluar</span>
              </button>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white shadow-sm text-slate-700 hover:bg-slate-50 transition"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Mobile Expandable Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 pb-4 pt-3 space-y-3">
            {/* Mobile Unit Selector */}
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedSppgUnit}
                onChange={(e) => {
                  handleUnitChange(e);
                  setMobileMenuOpen(false);
                }}
                aria-label="Pilih Unit SPPG"
                className="h-8 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800"
              >
                <option value="ALL">Semua SPPG (4 Dapur)</option>
                {sppgUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Role Switcher */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => { setUserRole('SUPERADMIN'); setMobileMenuOpen(false); }}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium transition ${
                  userRole === 'SUPERADMIN'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>Superadmin</span>
              </button>
              <button
                type="button"
                onClick={() => { setUserRole('EXECUTIVE_AUDITOR'); setMobileMenuOpen(false); }}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium transition ${
                  userRole === 'EXECUTIVE_AUDITOR'
                    ? 'bg-amber-500 text-white shadow-sm font-semibold'
                    : 'text-slate-600'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Pemantau</span>
              </button>
            </div>

            {/* Mobile action row */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { handleExportExcel(); setMobileMenuOpen(false); }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                <span>Ekspor Excel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Yakin ingin keluar?')) logout();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-100 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar</span>
              </button>
            </div>

            {/* User info */}
            <div className="text-center text-[11px] text-slate-400">
              Login: <span className="font-medium text-slate-600">{currentUser?.name || (userRole === 'SUPERADMIN' ? 'Superadmin' : 'Pemantau')}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
