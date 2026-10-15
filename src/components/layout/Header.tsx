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
  ChevronDown,
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

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleUnit = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSppgUnit(e.target.value as SppgUnitId | 'ALL');
  };

  const handleExport = () => {
    exportConsolidatedSPPGSummaryToExcel(sppgUnits, procurements, ingredients);
  };

  const roleName = currentUser?.name || (userRole === 'SUPERADMIN' ? 'Superadmin' : 'Pemantau');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white">
      {/* Auditor banner */}
      {userRole === 'EXECUTIVE_AUDITOR' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-[12px] text-amber-700 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>Mode Pemantau — akses baca saja, perubahan data nonaktif</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-3">
          {/* Left: logo */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-md bg-slate-900 flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-semibold">GF</span>
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-slate-900 truncate block">SPPG Dapur</span>
              <span className="text-[11px] text-slate-500 hidden sm:block">Manajemen Operasional & Keuangan</span>
            </div>
          </div>

          {/* Center: unit selector (desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedSppgUnit}
              onChange={handleUnit}
              aria-label="Pilih Unit SPPG"
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">Semua Unit (4 Dapur)</option>
              {sppgUnits.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Right: controls (desktop) */}
          <div className="hidden md:flex items-center gap-1.5">
            {/* Role toggle */}
            <div className="flex items-center rounded-md border border-slate-200 p-0.5 text-[12px]">
              <button
                type="button"
                onClick={() => setUserRole('SUPERADMIN')}
                className={`px-2.5 py-1 rounded-[5px] font-medium transition ${
                  userRole === 'SUPERADMIN' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setUserRole('EXECUTIVE_AUDITOR')}
                className={`px-2.5 py-1 rounded-[5px] font-medium transition ${
                  userRole === 'EXECUTIVE_AUDITOR' ? 'bg-amber-500 text-white' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pemantau
              </button>
            </div>

            <button
              type="button"
              onClick={handleExport}
              title="Ekspor Excel"
              className="hidden xl:flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-slate-200 text-[12px] text-slate-600 hover:bg-slate-50 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Ekspor</span>
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            <span className="text-[12px] text-slate-600 hidden xl:inline">{roleName}</span>

            <button
              type="button"
              onClick={() => { if (confirm('Keluar dari sistem?')) logout(); }}
              className="h-8 px-2.5 rounded-md border border-slate-200 text-[12px] text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Mobile panel */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-3">
            <select
              value={selectedSppgUnit}
              onChange={(e) => { handleUnit(e); setMobileOpen(false); }}
              className="w-full h-9 rounded-md border border-slate-200 px-3 text-[13px] text-slate-700"
            >
              <option value="ALL">Semua Unit (4 Dapur)</option>
              {sppgUnits.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>

            <div className="flex rounded-md border border-slate-200 p-0.5 text-[12px]">
              <button
                type="button"
                onClick={() => { setUserRole('SUPERADMIN'); setMobileOpen(false); }}
                className={`flex-1 py-1.5 rounded-[5px] font-medium text-center transition ${
                  userRole === 'SUPERADMIN' ? 'bg-slate-900 text-white' : 'text-slate-500'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => { setUserRole('EXECUTIVE_AUDITOR'); setMobileOpen(false); }}
                className={`flex-1 py-1.5 rounded-[5px] font-medium text-center transition ${
                  userRole === 'EXECUTIVE_AUDITOR' ? 'bg-amber-500 text-white' : 'text-slate-500'
                }`}
              >
                Pemantau
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { handleExport(); setMobileOpen(false); }}
                className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-md border border-slate-200 text-[12px] text-slate-600 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" />
                Ekspor Excel
              </button>
              <button
                type="button"
                onClick={() => { if (confirm('Keluar?')) logout(); }}
                className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-md border border-red-200 text-[12px] text-red-600 bg-red-50 hover:bg-red-100"
              >
                <LogOut className="h-3.5 w-3.5" />
                Keluar
              </button>
            </div>

            <div className="text-center text-[11px] text-slate-400">
              {roleName}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
