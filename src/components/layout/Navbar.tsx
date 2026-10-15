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

const tabs: { id: ActiveTab; icon: typeof LayoutDashboard; label: string; shortLabel: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: '1. Ringkasan Dashboard', shortLabel: 'Dashboard' },
  { id: 'budget', icon: WalletCards, label: '2. Uang Masuk & Anggaran', shortLabel: 'Anggaran' },
  { id: 'procurement', icon: ShoppingCart, label: '3. Catat Belanja & Nota', shortLabel: 'Belanja' },
  { id: 'inventory', icon: Boxes, label: '4. Stok & Pemakaian', shortLabel: 'Stok' },
  { id: 'cms', icon: Settings2, label: '5. Master Data / CMS', shortLabel: 'CMS' },
];

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { procurements, ingredients, userRole, budgetAllocations } = useStore();

  const pendingAuditCount = procurements.filter((p) => p.status === 'PENDING_AUDIT').length;
  const discrepancyCount = procurements.filter((p) => p.status === 'FLAGGED_DISCREPANCY').length;

  const getBadge = (id: ActiveTab) => {
    switch (id) {
      case 'budget':
        return budgetAllocations.length > 0 ? `${budgetAllocations.length} Alokasi` : null;
      case 'procurement': {
        const parts: string[] = [];
        if (pendingAuditCount > 0) parts.push(`${pendingAuditCount} Verif`);
        if (discrepancyCount > 0) parts.push(`${discrepancyCount} Selisih`);
        return parts.length > 0 ? parts.join(' · ') : null;
      }
      case 'inventory':
        return ingredients.length > 0 ? `${ingredients.length} Bahan` : null;
      case 'cms':
        return userRole === 'EXECUTIVE_AUDITOR' ? 'Audit Only' : 'Full CMS';
      default:
        return null;
    }
  };

  const getBadgeColor = (id: ActiveTab, isActive: boolean) => {
    if (id === 'procurement' && discrepancyCount > 0)
      return 'bg-rose-100 text-rose-800 border-rose-300';
    if (id === 'procurement' && pendingAuditCount > 0)
      return 'bg-amber-100 text-amber-800 border-amber-300';
    if (id === 'cms' && userRole === 'EXECUTIVE_AUDITOR')
      return 'bg-amber-100 text-amber-800 border-amber-200';
    if (id === 'cms')
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-1 overflow-x-auto py-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0" aria-label="Main Navigation">
          {tabs.map(({ id, icon: Icon, label, shortLabel }) => {
            const isActive = activeTab === id;
            const badge = getBadge(id);
            return (
              <button
                key={id}
                type="button"
                id={`nav-tab-${id}`}
                onClick={() => setActiveTab(id)}
                className={`inline-flex items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-lg px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-medium transition shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{shortLabel}</span>
                {badge && (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-medium border hidden sm:inline ${getBadgeColor(id, isActive)}`}>
                    {badge}
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
