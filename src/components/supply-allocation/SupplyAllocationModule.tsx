'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { SupplyDistribution, SupplyAllocationItem } from '@/lib/types';
import {
  Truck,
  Plus,
  Search,
  Building2,
  Calendar,
  FileText,
  Printer,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Divide,
  PackageCheck,
  ChevronRight,
  Boxes,
  ArrowRight,
  Sparkles,
  X,
} from 'lucide-react';
import { OfficialSupplyDispatchDocument } from './OfficialSupplyDispatchDocument';

export function SupplyAllocationModule() {
  const {
    sppgUnits,
    procurements,
    ingredients,
    supplyDistributions,
    addSupplyDistribution,
    deleteSupplyDistribution,
    userRole,
  } = useStore();

  const isSuperadmin = userRole === 'SUPERADMIN';

  // State pencarian & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_DELIVERY'>('ALL');

  // State Modal Buat Alokasi Baru
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProcurementId, setSelectedProcurementId] = useState<string>('');
  const [manualSupplierName, setManualSupplierName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [itemsToAllocate, setItemsToAllocate] = useState<SupplyAllocationItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State Modal Pratinjau Surat Jalan Resmi
  const [selectedForPrint, setSelectedForPrint] = useState<SupplyDistribution | null>(null);

  // State Tab View: Gudang Sementara vs Riwayat Surat Jalan
  const [activeTabMode, setActiveTabMode] = useState<'warehouse' | 'history'>('warehouse');
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [warehouseCategoryFilter, setWarehouseCategoryFilter] = useState('ALL');

  // Filter pengadaan belanja yang punya rincian items
  const validProcurements = useMemo(() => {
    return procurements.filter((p) => Array.isArray(p.items) && p.items.length > 0);
  }, [procurements]);

  // Handler saat memilih nota belanja untuk dialokasikan
  const handleSelectProcurement = (procId: string) => {
    setSelectedProcurementId(procId);
    setErrorMessage('');

    if (procId === 'GUDANG_REALTIME' || !procId || procId === 'MANUAL') {
      setSelectedProcurementId(procId || 'GUDANG_REALTIME');
      setManualSupplierName('Gudang Sementara Logistik (Hasil Belanja CV)');
      setDriverName('Mas Joko Santoso (Driver CV / Ekspedisi SPPG)');
      setDriverPhone('0812-3456-7890');
      setVehiclePlate('W 8923 AB (Pickup Logistik)');
      setDeliveryDate(new Date().toISOString().slice(0, 10));

      const itemsWithStock = ingredients.filter((ing) => (Number(ing.currentStock) || 0) > 0);
      const sourceList = itemsWithStock.length > 0 ? itemsWithStock : ingredients.slice(0, 8);

      const mapped: SupplyAllocationItem[] = sourceList.map((ing) => {
        const totalAllocated = Object.values(ing.sppgDistribution || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
        const availableGudang = Math.max(0, (Number(ing.currentStock) || 0) - totalAllocated);
        const targetQty = availableGudang > 0 ? availableGudang : (Number(ing.currentStock) || 100);

        const count = sppgUnits.length || 4;
        const perUnit = Math.floor(targetQty / count);
        const remainder = targetQty - perUnit * count;

        const alloc: Record<string, number> = {};
        sppgUnits.forEach((u, idx) => {
          const code = u.code || u.id;
          alloc[code] = perUnit + (idx === 0 ? remainder : 0);
        });

        return {
          ingredientId: ing.id,
          name: ing.name,
          category: ing.category || 'Bahan Dapur',
          totalPurchased: targetQty,
          unit: ing.defaultUnit || 'Kg',
          allocations: alloc,
          allocatedTotal: targetQty,
          remainingUnallocated: 0,
        };
      });

      setItemsToAllocate(mapped);
      return;
    }

    const proc = procurements.find((p) => p.id === procId);
    if (!proc) return;

    setManualSupplierName(proc.supplierName || 'CV Sumber Pangan');
    setDriverName('Mas Joko Santoso (Driver CV)');
    setVehiclePlate('W 8923 AB');
    setDeliveryDate(proc.date ? new Date(proc.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));

    // Petakan items dari nota belanja
    const mapped: SupplyAllocationItem[] = proc.items.map((it) => {
      const qty = Number(it.quantity) || 0;
      // Otomatis hitung pembagian rata 4 dapur
      const perUnit = Math.floor(qty / (sppgUnits.length || 4));
      const remainder = qty - perUnit * (sppgUnits.length || 4);

      const alloc: Record<string, number> = {};
      sppgUnits.forEach((u, idx) => {
        const code = u.code || u.id;
        // Tambahkan sisa pembagian ke dapur pertama
        alloc[code] = perUnit + (idx === 0 ? remainder : 0);
      });

      return {
        ingredientId: it.ingredientId,
        name: it.name,
        category: it.category || 'Bahan Dapur',
        totalPurchased: qty,
        unit: it.unit || 'Kg',
        allocations: alloc,
        allocatedTotal: qty,
        remainingUnallocated: 0,
      };
    });

    setItemsToAllocate(mapped);
  };

  // Handler sebar spesifik 1 bahan dari gudang sementara
  const handleStartAllocationForSpecificIngredient = (ing: any) => {
    setSelectedProcurementId('GUDANG_REALTIME');
    setManualSupplierName('Gudang Sementara Logistik (Hasil Belanja CV)');
    setDriverName('Mas Joko Santoso (Driver CV / Ekspedisi SPPG)');
    setDriverPhone('0812-3456-7890');
    setVehiclePlate('W 8923 AB (Pickup Logistik)');
    setDeliveryDate(new Date().toISOString().slice(0, 10));

    const totalAllocated = Object.values(ing.sppgDistribution || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
    const availableGudang = Math.max(0, (Number(ing.currentStock) || 0) - totalAllocated);
    const targetQty = availableGudang > 0 ? availableGudang : (Number(ing.currentStock) || 100);

    const count = sppgUnits.length || 4;
    const perUnit = Math.floor(targetQty / count);
    const remainder = targetQty - perUnit * count;

    const alloc: Record<string, number> = {};
    sppgUnits.forEach((u, idx) => {
      const code = u.code || u.id;
      alloc[code] = perUnit + (idx === 0 ? remainder : 0);
    });

    setItemsToAllocate([
      {
        ingredientId: ing.id,
        name: ing.name,
        category: ing.category || 'Bahan Dapur',
        totalPurchased: targetQty,
        unit: ing.defaultUnit || 'Kg',
        allocations: alloc,
        allocatedTotal: targetQty,
        remainingUnallocated: 0,
      },
    ]);
    setIsCreateModalOpen(true);
  };

  // List Bahan Gudang Sementara dengan status real-time
  const warehouseIngredients = useMemo(() => {
    return ingredients.filter((ing) => {
      if (warehouseCategoryFilter !== 'ALL' && ing.category !== warehouseCategoryFilter) return false;
      if (warehouseSearch.trim()) {
        const q = warehouseSearch.toLowerCase();
        return ing.name.toLowerCase().includes(q) || ing.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [ingredients, warehouseCategoryFilter, warehouseSearch]);

  // Ubah kuantitas alokasi unit tertentu
  const handleUpdateItemAllocation = (itemIdx: number, unitCode: string, value: string) => {
    const num = Math.max(0, Number(value) || 0);
    setItemsToAllocate((prev) => {
      const next = [...prev];
      const target = { ...next[itemIdx] };
      const currentAlloc = { ...target.allocations, [unitCode]: num };

      const totalAllocated = Object.values(currentAlloc).reduce((a, b) => a + (Number(b) || 0), 0);
      target.allocations = currentAlloc;
      target.allocatedTotal = totalAllocated;
      target.remainingUnallocated = target.totalPurchased - totalAllocated;

      next[itemIdx] = target;
      return next;
    });
  };

  // Tombol Bagi Rata untuk 1 baris
  const handleEqualSplitRow = (itemIdx: number) => {
    setItemsToAllocate((prev) => {
      const next = [...prev];
      const target = { ...next[itemIdx] };
      const count = sppgUnits.length || 4;
      const base = Math.floor(target.totalPurchased / count);
      const rem = target.totalPurchased - base * count;

      const newAlloc: Record<string, number> = {};
      sppgUnits.forEach((u, i) => {
        const code = u.code || u.id;
        newAlloc[code] = base + (i === 0 ? rem : 0);
      });

      target.allocations = newAlloc;
      target.allocatedTotal = target.totalPurchased;
      target.remainingUnallocated = 0;
      next[itemIdx] = target;
      return next;
    });
  };

  // Tombol Bagi Rata SEMUA Bahan Sekaligus
  const handleEqualSplitAll = () => {
    setItemsToAllocate((prev) => {
      return prev.map((target) => {
        const count = sppgUnits.length || 4;
        const base = Math.floor(target.totalPurchased / count);
        const rem = target.totalPurchased - base * count;

        const newAlloc: Record<string, number> = {};
        sppgUnits.forEach((u, i) => {
          const code = u.code || u.id;
          newAlloc[code] = base + (i === 0 ? rem : 0);
        });

        return {
          ...target,
          allocations: newAlloc,
          allocatedTotal: target.totalPurchased,
          remainingUnallocated: 0,
        };
      });
    });
  };

  // Submit Simpan Alokasi
  const handleSaveAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) {
      setErrorMessage('Nama driver pengantar CV wajib diisi.');
      return;
    }
    if (itemsToAllocate.length === 0) {
      setErrorMessage('Pilih nota belanja atau tambahkan bahan makanan yang akan disebar.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const proc = procurements.find((p) => p.id === selectedProcurementId);
      const dispatchNumber = `SJ-BAHAN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

      const payload = {
        dispatchNumber,
        date: new Date(deliveryDate).toISOString(),
        procurementOrderId: selectedProcurementId === 'MANUAL' ? null : selectedProcurementId,
        receiptNumber: proc?.receiptNumber || 'ALOKASI-MANDIRI',
        supplierId: proc?.supplierId || null,
        supplierName: manualSupplierName || proc?.supplierName || 'CV Rekanan SPPG',
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim() || '-',
        vehiclePlate: vehiclePlate.trim() || '-',
        status: 'COMPLETED',
        notes: notes.trim() || null,
        items: itemsToAllocate,
        headSignerName: 'Drs. H. M. Zainudin, M.M.',
        headSignerTitle: 'Kepala Satuan Pelayanan Pemenuhan Gizi (SPPG)',
        headSignerNip: '19750812 199903 1 004',
      };

      const res = await addSupplyDistribution(payload);
      if (res.ok) {
        setIsCreateModalOpen(false);
        setActiveTabMode('history');
        setSuccessMessage(`✅ Berhasil! Bahan berhasil disebarkan ke 4 Dapur SPPG dengan Nomor Dokumen ${dispatchNumber}.`);
      } else {
        setErrorMessage(res.error || 'Gagal menyimpan alokasi bahan.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return supplyDistributions.filter((d) => {
      const matchSearch =
        (d.dispatchNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.receiptNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [supplyDistributions, searchTerm, statusFilter]);

  // Ringkasan KPI
  const totalSupplyCount = supplyDistributions.length;
  const totalItemsDistributed = supplyDistributions.reduce((acc, d) => {
    const list = Array.isArray(d.items) ? d.items : [];
    return acc + list.reduce((sub, it) => sub + (Number(it.totalPurchased) || 0), 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header & Sub-title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Alokasi Belanja ke Dapur SPPG</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Penyebaran Bahan
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Penyebaran bahan makanan yang baru dibeli dari CV/rekanan langsung disalurkan ke dapur-dapur SPPG terdaftar beserta Surat Jalan resmi.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {/* Action Button */}
        {isSuperadmin && (
          <button
            type="button"
            onClick={() => {
              setIsCreateModalOpen(true);
              handleSelectProcurement('GUDANG_REALTIME');
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Sebar Bahan ke 4 Dapur</span>
          </button>
        )}
      </div>

      {/* Alert Success Message */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs sm:text-sm font-bold">{successMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="p-1 text-emerald-700 hover:text-emerald-950 rounded-lg hover:bg-emerald-100 transition"
            title="Tutup Pesan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Pasokan Belanja</span>
            <PackageCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalSupplyCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Surat Jalan Pasokan Terbit</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Kuantitas Masuk</span>
            <Boxes className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {totalItemsDistributed.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Kg / Pack / Karung Bahan</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Dapur SPPG Terhubung</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900">{sppgUnits.length} Dapur</div>
          <p className="text-[11px] text-slate-500 mt-1">Penerima Alokasi Logistik</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Status Alokasi Stok</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-700 flex items-center gap-1.5 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sinkron DB</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Saldo unit ter-update otomatis</p>
        </div>
      </div>

      {/* Sub-Tab Navigation: Gudang Sementara vs Riwayat Surat Jalan */}
      <div className="flex items-center gap-2 border-b border-slate-200 pt-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTabMode('warehouse')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition shrink-0 whitespace-nowrap ${
            activeTabMode === 'warehouse'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4 text-emerald-600" />
          <span>📦 Stok Gudang Sementara Real-Time ({ingredients.length} Bahan)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabMode('history')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition shrink-0 whitespace-nowrap ${
            activeTabMode === 'history'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>📋 Riwayat Surat Jalan Pasokan ({supplyDistributions.length})</span>
        </button>
      </div>

      {/* VIEW 1: TAB GUDANG SEMENTARA & SEBAR CEPAT */}
      {activeTabMode === 'warehouse' && (
        <div className="space-y-4">
          {/* Informational Guidance Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Boxes className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <span>Konsep Gudang Sementara & Sebar Bahan ke Dapur</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.2 rounded-full font-bold">Real-Time</span>
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Semua pembelanjaan dari CV/vendor langsung masuk ke <strong>Gudang Sementara</strong> ini. Dari gudang ini, Anda dapat menyebarkan bahan ke 4 dapur SPPG (SPPG AA02, BS02, DR01, SM01) secara merata atau sesuai porsi. Jika sewaktu memasak di menu <strong>Distribusi Siswa</strong> stok jatah dapur kurang, sistem akan secara otomatis menarik kekurangan dari sisa stok cadangan di gudang sementara ini.
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={warehouseSearch}
                onChange={(e) => setWarehouseSearch(e.target.value)}
                placeholder="Cari nama atau kode bahan gudang..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(true);
                  handleSelectProcurement('GUDANG_REALTIME');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Sebar Semua Bahan Gudang</span>
              </button>
            </div>
          </div>

          {/* Warehouse Materials Realtime Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Kode</th>
                    <th className="py-2.5 px-3">Nama Bahan Dapur</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-right">Gudang Sementara (Sisa Standby)</th>
                    <th className="py-2.5 px-3 text-center">Sebaran di 4 Dapur SPPG</th>
                    <th className="py-2.5 px-3 text-right">Total Belanja Masuk</th>
                    <th className="py-2.5 px-3 text-center">Satuan</th>
                    {isSuperadmin && <th className="py-2.5 px-3 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {warehouseIngredients.map((ing, idx) => {
                    const totalAllocated = Object.values(ing.sppgDistribution || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
                    const gudangStock = Math.max(0, (Number(ing.currentStock) || 0) - totalAllocated);

                    return (
                      <tr key={ing.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 font-medium">{ing.code}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{ing.name}</td>
                        <td className="py-2.5 px-3">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                            {ing.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                            gudangStock > 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            {gudangStock.toLocaleString('id-ID')} {ing.defaultUnit}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1 text-[10px] font-mono">
                            <span title="SPPG Abar Abir 02" className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                              AA: {ing.sppgDistribution?.['SPPG-AA02'] || 0}
                            </span>
                            <span title="SPPG Banjarsari 02" className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">
                              BS: {ing.sppgDistribution?.['SPPG-BS02'] || 0}
                            </span>
                            <span title="SPPG Dahan Rejo 01" className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                              DR: {ing.sppgDistribution?.['SPPG-DR01'] || 0}
                            </span>
                            <span title="SPPG Semampir" className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                              SM: {ing.sppgDistribution?.['SPPG-SM01'] || 0}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-600 tabular-nums">
                          {Number(ing.currentStock).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">{ing.defaultUnit}</td>
                        {isSuperadmin && (
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleStartAllocationForSpecificIngredient(ing)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Sebar Bahan</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: TAB RIWAYAT SURAT JALAN PASOKAN */}
      {activeTabMode === 'history' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari Surat Jalan, Driver, atau CV..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="ALL">Semua Status</option>
                <option value="COMPLETED">Telah Diterima (Selesai)</option>
                <option value="IN_DELIVERY">Dalam Pengantaran</option>
              </select>
            </div>
          </div>

          {/* List Surat Jalan Alokasi Pasokan */}
          <div className="space-y-3">
            {filteredList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
                  <Truck className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Belum Ada Riwayat Alokasi Pasokan Bahan
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
                  Ketika selesai mencatat pembelanjaan dari CV/supplier, klik tombol di bawah untuk menyebar kuantitas bahan belanja tersebut ke 4 dapur SPPG.
                </p>
                {isSuperadmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(true);
                      handleSelectProcurement('GUDANG_REALTIME');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Mulai Buat Alokasi Bahan</span>
                  </button>
                )}
              </div>
            ) : (
              filteredList.map((dist) => {
                const items = Array.isArray(dist.items) ? dist.items : [];
                const totalKg = items.reduce((acc, it) => acc + (Number(it.totalPurchased) || 0), 0);

                return (
                  <div
                    key={dist.id}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 p-4 sm:p-5 shadow-xs hover:shadow-md transition space-y-4"
                  >
                    {/* Header Kartu */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {dist.dispatchNumber}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {dist.status === 'COMPLETED' ? 'Selesai Disebar' : 'Dalam Perjalanan'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{dist.supplierName}</span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(dist.date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setSelectedForPrint(dist)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition"
                          title="Lihat & Cetak Surat Jalan Resmi Standar Pemerintah"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Cetak Surat Jalan</span>
                        </button>

                        {isSuperadmin && (
                          <button
                            type="button"
                            onClick={async () => {
                              if (
                                confirm(
                                  `Apakah Anda yakin ingin menghapus alokasi ${dist.dispatchNumber}? Stok yang disebar ke dapur SPPG akan dikembalikan secara otomatis.`
                                )
                              ) {
                                await deleteSupplyDistribution(dist.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus Alokasi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Info Driver & Ekspedisi */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Driver CV</span>
                        <span className="font-semibold text-slate-800">{dist.driverName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">No. Polisi Armada</span>
                        <span className="font-semibold text-slate-800 font-mono">{dist.vehiclePlate || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Nota Asal Belanja</span>
                        <span className="font-semibold text-slate-800 font-mono">{dist.receiptNumber || 'Alokasi Mandiri'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Muatan</span>
                        <span className="font-black text-emerald-700 font-mono">
                          {items.length} Bahan ({totalKg} Total Satuan)
                        </span>
                      </div>
                    </div>

                    {/* Matriks Ringkasan Sebaran per SPPG */}
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        Penyebaran Bahan ke Tiap Unit Dapur:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {sppgUnits.map((u) => {
                          const code = u.code || u.id;
                          const unitItemCount = items.filter((it) => (it.allocations?.[code] || 0) > 0).length;
                          const unitQtySum = items.reduce((acc, it) => acc + (Number(it.allocations?.[code]) || 0), 0);

                          return (
                            <div
                              key={u.id}
                              className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-900 block truncate max-w-[130px]">
                                  {u.shortName}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {unitItemCount} jenis bahan
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-emerald-700 font-mono">
                                  {unitQtySum}
                                </span>
                                <span className="text-[9px] text-slate-400 block">Diterima</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal Buat Alokasi Bahan Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                    <span>Sebar Bahan Belanja ke Dapur SPPG</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Surat Jalan Pasokan
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bahan belanja dari CV langsung dibagi dan dikirim ke 4 dapur SPPG terdaftar.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveAllocation} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Pilih Nota Belanja Sumber */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  1. Pilih Nota Pembelanjaan Yang Ingin Disebar:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={selectedProcurementId}
                    onChange={(e) => handleSelectProcurement(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="GUDANG_REALTIME">📦 Ambil dari Stok Gudang Sementara Real-Time ({ingredients.length} Bahan)</option>
                    {validProcurements.map((p) => (
                      <option key={p.id} value={p.id}>
                        🧾 Nota {p.receiptNumber} &bull; {p.supplierName} &bull; {p.items.length} Bahan (Rp {p.actualReceiptTotal.toLocaleString('id-ID')})
                      </option>
                    ))}
                    <option value="MANUAL">📋 Alokasi Bebas Manual</option>
                  </select>

                  <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-semibold">
                    <span>Supplier/CV: {manualSupplierName || '-'}</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      {itemsToAllocate.length} Bahan Terpilih
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Informasi Pengantar / Driver CV */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  2. Informasi Kurir / Driver CV Pengirim:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Nama Driver CV *</label>
                    <input
                      type="text"
                      required
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Contoh: Joko Santoso (CV SPA)"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">No. HP Driver</label>
                    <input
                      type="text"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="Contoh: 0812-3456-7890"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">No. Polisi Armada</label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      placeholder="Contoh: W 8923 AB"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Matriks Alokasi ke 4 Dapur SPPG */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      3. Matriks Alokasi Pembagian ke 4 Dapur SPPG:
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Tentukan banyaknya bahan yang diserahkan ke masing-masing dapur sentral.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleEqualSplitAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs transition border border-emerald-300 self-start sm:self-auto"
                  >
                    <Divide className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Bagi Rata Semua Bahan (Equal Split)</span>
                  </button>
                </div>

                {itemsToAllocate.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                    Pilih nota belanja di langkah 1 untuk memuat daftar bahan yang baru dibeli.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="py-2.5 px-3">Bahan Makanan</th>
                          <th className="py-2.5 px-2 text-center w-24">Total Beli</th>
                          {sppgUnits.map((u) => (
                            <th key={u.id} className="py-2.5 px-2 text-center w-28">
                              {u.shortName}
                            </th>
                          ))}
                          <th className="py-2.5 px-2 text-center w-20">Sisa</th>
                          <th className="py-2.5 px-2 text-center w-16">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {itemsToAllocate.map((it, idx) => {
                          const isComplete = it.remainingUnallocated === 0;
                          const isOverflow = it.remainingUnallocated < 0;

                          return (
                            <tr key={idx} className="hover:bg-slate-50/70 transition">
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-900 block">{it.name}</span>
                                <span className="text-[10px] text-slate-400">{it.category}</span>
                              </td>
                              <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900 bg-slate-50/50">
                                {it.totalPurchased} {it.unit}
                              </td>
                              {sppgUnits.map((u) => {
                                const code = u.code || u.id;
                                const val = it.allocations?.[code] ?? 0;
                                return (
                                  <td key={u.id} className="py-2 px-1 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      value={val}
                                      onChange={(e) => handleUpdateItemAllocation(idx, code, e.target.value)}
                                      className="w-20 px-2 py-1.5 text-center font-mono font-bold text-xs rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    />
                                  </td>
                                );
                              })}
                              <td className="py-2.5 px-2 text-center font-mono text-xs">
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                    isComplete
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isOverflow
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {it.remainingUnallocated} {it.unit}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleEqualSplitRow(idx)}
                                  className="p-1 rounded text-emerald-700 hover:bg-emerald-100 transition"
                                  title="Bagi rata bahan ini"
                                >
                                  <Divide className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 4. Catatan */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">Catatan Tambahan Pengantaran:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Seluruh bahan telah ditimbang dan diantar menggunakan mobil pendingin CV."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || itemsToAllocate.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm shadow-md transition"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Terbitkan Surat Jalan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pratinjau Dokumen Surat Jalan Resmi A4 */}
      {selectedForPrint && (
        <OfficialSupplyDispatchDocument
          distribution={selectedForPrint}
          sppgUnits={sppgUnits}
          onClose={() => setSelectedForPrint(null)}
        />
      )}
    </div>
  );
}
