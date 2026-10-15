'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import {
  LayoutDashboard,
  Receipt,
  Boxes,
  Users2,
  Database,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'procurement' | 'inventory' | 'suppliers' | 'database';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { procurements, ingredients, userRole } = useStore();

  const pendingAuditCount = procurements.filter((p) => p.status === 'PENDING_AUDIT').length;
  const discrepancyCount = procurements.filter((p) => p.status === 'FLAGGED_DISCREPANCY').length;

  return (
    <div className="border-b border-slate-200 bg-slate-50/70 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {/* Tab 1: Executive Dashboard */}
          <button
            type="button"
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition ${
              activeTab === 'dashboard'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-semibold dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 text-slate-500" />
            <span>Ringkasan Eksekutif</span>
          </button>

          {/* Tab 2: Procurement & Audit */}
          <button
            type="button"
            id="nav-tab-procurement"
            onClick={() => setActiveTab('procurement')}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition relative ${
              activeTab === 'procurement'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-semibold dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Receipt className="h-4 w-4 text-slate-500" />
            <span>Pembelanjaan & Rekonsiliasi Nota</span>
            {pendingAuditCount > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-mono font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                {pendingAuditCount} Verif
              </span>
            )}
            {discrepancyCount > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-rose-100 px-1.5 py-0.2 text-[10px] font-mono font-bold text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                {discrepancyCount} Selisih
              </span>
            )}
          </button>

          {/* Tab 3: Inventory CMS & Mutasi */}
          <button
            type="button"
            id="nav-tab-inventory"
            onClick={() => setActiveTab('inventory')}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition ${
              activeTab === 'inventory'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-semibold dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Boxes className="h-4 w-4 text-slate-500" />
            <span>Master Bahan & Mutasi Dapur</span>
            <span className="rounded bg-slate-200/70 px-1.5 py-0.2 text-[10px] font-mono font-medium text-slate-700 dark:bg-zinc-700 dark:text-zinc-300">
              {ingredients.length} Item
            </span>
          </button>

          {/* Tab 4: Suppliers & Staff */}
          <button
            type="button"
            id="nav-tab-suppliers"
            onClick={() => setActiveTab('suppliers')}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition ${
              activeTab === 'suppliers'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-semibold dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Users2 className="h-4 w-4 text-slate-500" />
            <span>Rekanan CV & Karyawan SPPG</span>
          </button>

          {/* Tab 5: Database & Neon */}
          <button
            type="button"
            id="nav-tab-database"
            onClick={() => setActiveTab('database')}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition ${
              activeTab === 'database'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-semibold dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Database className="h-4 w-4 text-slate-500" />
            <span>Neon PostgreSQL & Prisma</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
