'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import {
  LayoutDashboard,
  WalletCards,
  ShoppingCart,
  Boxes,
  Settings2,
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'budget' | 'procurement' | 'inventory' | 'cms';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const tabs: { id: ActiveTab; icon: typeof LayoutDashboard; label: string; short: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Ringkasan', short: 'Home' },
  { id: 'budget', icon: WalletCards, label: 'Anggaran', short: 'Kas' },
  { id: 'procurement', icon: ShoppingCart, label: 'Belanja', short: 'Belanja' },
  { id: 'inventory', icon: Boxes, label: 'Stok Bahan', short: 'Stok' },
  { id: 'cms', icon: Settings2, label: 'Master Data', short: 'Data' },
];

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { procurements, userRole } = useStore();
  const pendingCount = procurements.filter((p) => p.status === 'PENDING_AUDIT' || p.status === 'FLAGGED_DISCREPANCY').length;

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-0.5 overflow-x-auto py-1.5 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0" aria-label="Menu Utama">
          {tabs.map(({ id, icon: Icon, label, short }) => {
            const active = activeTab === id;
            const hasBadge = id === 'procurement' && pendingCount > 0;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-medium transition shrink-0 ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
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
