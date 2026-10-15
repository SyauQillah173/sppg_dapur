'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import {
  LayoutDashboard,
  WalletCards,
  ShoppingCart,
  Boxes,
  Settings2,
  ShieldAlert,
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'budget' | 'procurement' | 'inventory' | 'cms';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { procurements, ingredients, userRole, budgetAllocations } = useStore();

  const pendingAuditCount = procurements.filter((p) => p.status === 'PENDING_AUDIT').length;
  const discrepancyCount = procurements.filter((p) => p.status === 'FLAGGED_DISCREPANCY').length;

  return (
    <div className="border-b border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none" aria-label="Main Navigation">
          {/* Menu 1: Ringkasan Dashboard */}
          <button
            type="button"
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white shadow-sm font-semibold dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>1. Ringkasan Dashboard</span>
          </button>

          {/* Menu 2: Uang Masuk & Anggaran */}
          <button
            type="button"
            id="nav-tab-budget"
            onClick={() => setActiveTab('budget')}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition ${
              activeTab === 'budget'
                ? 'bg-slate-900 text-white shadow-sm font-semibold dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50'
            }`}
          >
            <WalletCards className="h-4 w-4" />
            <span>2. Uang Masuk & Anggaran</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-medium ${
              activeTab === 'budget' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {budgetAllocations.length} Alokasi
            </span>
          </button>

          {/* Menu 3: Catat Belanja & Nota */}
          <button
            type="button"
            id="nav-tab-procurement"
            onClick={() => setActiveTab('procurement')}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition relative ${
              activeTab === 'procurement'
                ? 'bg-slate-900 text-white shadow-sm font-semibold dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>3. Catat Belanja & Nota</span>
            {pendingAuditCount > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-mono font-bold text-amber-800 border border-amber-300">
                {pendingAuditCount} Verif
              </span>
            )}
            {discrepancyCount > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-rose-100 px-1.5 py-0.2 text-[10px] font-mono font-bold text-rose-800 border border-rose-300">
                {discrepancyCount} Selisih
              </span>
            )}
          </button>

          {/* Menu 4: Stok & Pemakaian Bahan */}
          <button
            type="button"
            id="nav-tab-inventory"
            onClick={() => setActiveTab('inventory')}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition ${
              activeTab === 'inventory'
                ? 'bg-slate-900 text-white shadow-sm font-semibold dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Boxes className="h-4 w-4" />
            <span>4. Stok & Pemakaian Bahan</span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-medium ${
              activeTab === 'inventory' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {ingredients.length} Bahan
            </span>
          </button>

          {/* Menu 5: Master Data / CMS */}
          <button
            type="button"
            id="nav-tab-cms"
            onClick={() => setActiveTab('cms')}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition ${
              activeTab === 'cms'
                ? 'bg-slate-900 text-white shadow-sm font-semibold dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50'
            }`}
          >
            <Settings2 className="h-4 w-4" />
            <span>5. Master Data / CMS</span>
            {userRole === 'EXECUTIVE_AUDITOR' ? (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-mono text-amber-800 border border-amber-200">
                Audit Only
              </span>
            ) : (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-mono text-emerald-800 border border-emerald-200">
                Full CMS
              </span>
            )}
          </button>
        </nav>
      </div>
    </div>
  );
}
