'use client';

import React, { useState } from 'react';
import { StoreProvider, useStore } from '@/lib/store';
import { Header } from '@/components/layout/Header';
import { Navbar, ActiveTab } from '@/components/layout/Navbar';
import { ExecutiveDashboard } from '@/components/dashboard/ExecutiveDashboard';
import { ProcurementModule } from '@/components/procurement/ProcurementModule';
import { KitchenInventoryCMS } from '@/components/inventory/KitchenInventoryCMS';
import { SupplierEmployeeModule } from '@/components/suppliers/SupplierEmployeeModule';
import { DatabaseViewerModal } from '@/components/database/DatabaseViewerModal';
import { SplitScreenReceiptModal } from '@/components/procurement/SplitScreenReceiptModal';
import { AIScannerModal } from '@/components/procurement/AIScannerModal';
import { AddProcurementModal } from '@/components/procurement/AddProcurementModal';

function AppContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const { modal, closeModal } = useStore();

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 antialiased font-sans flex flex-col selection:bg-slate-900 selection:text-white dark:selection:bg-slate-100 dark:selection:text-slate-900">
      {/* Top Header */}
      <Header />

      {/* Navigation Sub-header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <ExecutiveDashboard
            onNavigateToProcurement={() => setActiveTab('procurement')}
            onNavigateToInventory={() => setActiveTab('inventory')}
          />
        )}
        {activeTab === 'procurement' && <ProcurementModule />}
        {activeTab === 'inventory' && <KitchenInventoryCMS />}
        {activeTab === 'suppliers' && <SupplierEmployeeModule />}
        {activeTab === 'database' && <DatabaseViewerModal />}
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
      <footer className="border-t border-slate-200 bg-white py-4 dark:border-zinc-800 dark:bg-zinc-950 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-zinc-300">GiziFlow Enterprise</span>
            <span>&bull;</span>
            <span>Sistem Operasional, Logistik & Keuangan SPPG Dapur</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            4 SPPG Units &bull; 20 Client Items Pre-seeded &bull; Neon PostgreSQL ORM
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
