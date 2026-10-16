'use client';

import React, { useState } from 'react';
import { StoreProvider, useStore } from '@/lib/store';
import { Header } from '@/components/layout/Header';
import { Navbar, ActiveTab } from '@/components/layout/Navbar';
import { ExecutiveDashboard } from '@/components/dashboard/ExecutiveDashboard';
import { AuditorDashboard } from '@/components/dashboard/AuditorDashboard';
import { BudgetAllocationModule } from '@/components/budget/BudgetAllocationModule';
import { ProcurementModule } from '@/components/procurement/ProcurementModule';
import { KitchenInventoryCMS } from '@/components/inventory/KitchenInventoryCMS';
import { MasterDataCMS } from '@/components/cms/MasterDataCMS';
import { SplitScreenReceiptModal } from '@/components/procurement/SplitScreenReceiptModal';
import { AIScannerModal } from '@/components/procurement/AIScannerModal';
import { AddProcurementModal } from '@/components/procurement/AddProcurementModal';

function AppContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const { modal, closeModal, userRole } = useStore();
  const isAuditor = userRole === 'EXECUTIVE_AUDITOR';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans flex flex-col selection:bg-slate-900 selection:text-white">
      {/* Top Header with User Info, Role Badge & SPPG Filter */}
      <Header onNavigateTab={setActiveTab} />

      {/* 5 Main Menus Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Menu 1: Ringkasan Dashboard */}
        {activeTab === 'dashboard' && (
          isAuditor ? (
            <AuditorDashboard />
          ) : (
            <ExecutiveDashboard
              onNavigateToProcurement={() => setActiveTab('procurement')}
              onNavigateToInventory={() => setActiveTab('inventory')}
            />
          )
        )}

        {/* Menu 2: Uang Masuk & Anggaran */}
        {activeTab === 'budget' && <BudgetAllocationModule />}

        {/* Menu 3: Catat Belanja & Nota */}
        {activeTab === 'procurement' && <ProcurementModule />}

        {/* Menu 4: Stok & Pemakaian Bahan */}
        {activeTab === 'inventory' && <KitchenInventoryCMS />}

        {/* Menu 5: Master Data / CMS */}
        {activeTab === 'cms' && <MasterDataCMS />}
      </main>

      {/* Modals Container */}
      {modal.type === 'INSPECT_RECEIPT' && modal.data && (
        <SplitScreenReceiptModal transaction={modal.data} onClose={closeModal} />
      )}

      {modal.type === 'AI_SCANNER' && (
        <AIScannerModal onClose={closeModal} />
      )}

      {modal.type === 'ADD_PROCUREMENT' && (
        <AddProcurementModal onClose={closeModal} />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">SPPG Dapur Enterprise</span>
            <span>&bull;</span>
            <span>Sistem Manajemen Operasional & Keuangan Pemenuhan Gizi</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            4 SPPG Sentra &bull; 20 Client Ingredients Pre-seeded &bull; Neon PostgreSQL ORM
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
