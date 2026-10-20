'use client';

import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from '@/lib/store';
import { Header } from '@/components/layout/Header';
import { Navbar, ActiveTab } from '@/components/layout/Navbar';
import { ExecutiveDashboard } from '@/components/dashboard/ExecutiveDashboard';
import { AuditorDashboard } from '@/components/dashboard/AuditorDashboard';
import { BudgetAllocationModule } from '@/components/budget/BudgetAllocationModule';
import { ProcurementModule } from '@/components/procurement/ProcurementModule';
import { KitchenInventoryCMS } from '@/components/inventory/KitchenInventoryCMS';
import { MasterDataCMS } from '@/components/cms/MasterDataCMS';
import { MealDistributionConcept } from '@/components/distribution/MealDistributionConcept';
import { SupplyAllocationModule } from '@/components/supply-allocation/SupplyAllocationModule';
import { DriverDeliveryView } from '@/components/distribution/DriverDeliveryView';
import { SplitScreenReceiptModal } from '@/components/procurement/SplitScreenReceiptModal';
import { AIScannerModal } from '@/components/procurement/AIScannerModal';
import { AddProcurementModal } from '@/components/procurement/AddProcurementModal';
import { AlertModal, AlertModalType } from '@/components/ui/AlertModal';

function AppContent() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const { modal, closeModal, userRole } = useStore();
  const isAuditor = userRole === 'EXECUTIVE_AUDITOR';
  const isDriver = userRole === 'DISTRIBUTION_DRIVER';

  // Jika role pemantau/auditor mencoba akses tab konsep, otomatis redirect ke dashboard
  useEffect(() => {
    if (isAuditor && activeTab === 'distribution_concept') {
      setActiveTab('dashboard');
    }
  }, [isAuditor, activeTab]);

  // Global listener untuk menggantikan semua alert bawaan browser
  const [globalAlert, setGlobalAlert] = useState<{
    isOpen: boolean;
    type?: AlertModalType;
    title: string;
    message: string;
    highlightNote?: string;
  } | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setGlobalAlert({
          isOpen: true,
          type: customEvent.detail.type || 'error',
          title: customEvent.detail.title || 'Pemberitahuan Sistem',
          message: customEvent.detail.message || '',
          highlightNote: customEvent.detail.highlightNote,
        });
      }
    };
    window.addEventListener('app:alert', handler);
    return () => window.removeEventListener('app:alert', handler);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans flex flex-col selection:bg-slate-900 selection:text-white">
      {/* Top Header with User Info, Role Badge & SPPG Filter */}
      <Header onNavigateTab={setActiveTab} />

      {/* 5 Main Menus Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tampilan Khusus Petugas Pengantaran (Driver) */}
        {isDriver ? (
          <DriverDeliveryView />
        ) : (
          <>
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
            {activeTab === 'procurement' && (
              <ProcurementModule onNavigateToAllocation={() => setActiveTab('supply_allocation')} />
            )}

            {/* Menu Alokasi: Penyebaran Pasokan Belanja ke Dapur SPPG */}
            {activeTab === 'supply_allocation' && <SupplyAllocationModule />}

            {/* Menu 4: Stok & Pemakaian Bahan (Gudang Sementara) */}
            {activeTab === 'inventory' && (
              <KitchenInventoryCMS onNavigateToSupplyAllocation={() => setActiveTab('supply_allocation')} />
            )}

            {/* Menu 5: Master Data / CMS */}
            {activeTab === 'cms' && <MasterDataCMS />}

            {/* Menu Konsep: Distribusi Makanan Siap Santap ke Siswa (Khusus Superadmin, Tersembunyi dari Auditor) */}
            {activeTab === 'distribution_concept' && !isAuditor && <MealDistributionConcept />}
          </>
        )}
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

      {/* Global Alert / Notification Modal */}
      {globalAlert && (
        <AlertModal
          isOpen={globalAlert.isOpen}
          type={globalAlert.type || 'error'}
          title={globalAlert.title}
          message={globalAlert.message}
          highlightNote={globalAlert.highlightNote}
          onClose={() => setGlobalAlert(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">SPPG Dapur Enterprise</span>
            <span>&bull;</span>
            <span>Sistem Manajemen Operasional & Keuangan Pemenuhan Gizi</span>
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
