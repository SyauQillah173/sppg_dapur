'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import {
  LayoutDashboard,
  WalletCards,
  ShoppingCart,
  Boxes,
  Settings2,
  UtensilsCrossed,
  Truck,
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'budget' | 'procurement' | 'supply_allocation' | 'inventory' | 'distribution_concept' | 'cms';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { procurements, userRole } = useStore();
  const pendingCount = procurements.filter((p) => p.status === 'PENDING_AUDIT' || p.status === 'FLAGGED_DISCREPANCY').length;

  const tabs: { id: ActiveTab; icon: typeof LayoutDashboard; label: string; short: string; isConcept?: boolean }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Ringkasan', short: 'Home' },
    { id: 'budget', icon: WalletCards, label: 'Anggaran', short: 'Kas' },
    { id: 'procurement', icon: ShoppingCart, label: 'Belanja', short: 'Belanja' },
    { id: 'inventory', icon: Boxes, label: 'Stok Bahan', short: 'Stok' },
    { id: 'supply_allocation', icon: Truck, label: 'Sebar Bahan', short: 'Sebar' },
    // Menu Konsep Distribusi Porsi Makanan HANYA muncul untuk SUPERADMIN, tersembunyi dari AUDITOR
    ...(userRole === 'SUPERADMIN'
      ? [
          {
            id: 'distribution_concept' as ActiveTab,
            icon: UtensilsCrossed,
            label: 'Distribusi Siswa',
            short: 'Distribusi',
            isConcept: true,
          },
        ]
      : []),
    { id: 'cms', icon: Settings2, label: 'Master Data', short: 'Data' },
  ];

  // Jika role adalah DISTRIBUTION_DRIVER (Kurir / Petugas Pengantaran),
  // sembunyikan semua menu pembukuan/admin dan tampilkan status pengantaran terfokus.
  if (userRole === 'DISTRIBUTION_DRIVER') {
    return (
      <div className="border-b border-emerald-200 bg-emerald-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between py-2" aria-label="Menu Kurir">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Tugas Pengantaran Makanan MBG Hari Ini</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Layar Khusus Driver Armada
            </span>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none justify-between sm:justify-start" aria-label="Menu Utama">
          {tabs.map(({ id, icon: Icon, label, short, isConcept }) => {
            const active = activeTab === id;
            const hasBadge = id === 'procurement' && pendingCount > 0;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-[13px] font-medium transition flex-1 sm:flex-initial shrink-0 ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
                {isConcept && (
                  <span className={`hidden md:inline-flex items-center ml-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded-md uppercase tracking-wider ${
                    active ? 'bg-indigo-500/30 text-indigo-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}>
                    Konsep
                  </span>
                )}
                {hasBadge && (
                  <span className={`ml-0.5 h-4 min-w-[16px] flex items-center justify-center rounded-full text-[10px] font-semibold px-1 ${
                    active ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
