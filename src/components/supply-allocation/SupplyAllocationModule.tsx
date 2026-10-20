'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { SupplyDistribution, SupplyAllocationItem, MasterIngredient } from '@/lib/types';
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
  Pencil,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  FileSpreadsheet,
} from 'lucide-react';
import { OfficialSupplyDispatchDocument } from './OfficialSupplyDispatchDocument';

export function SupplyAllocationModule() {
  const {
    sppgUnits,
    procurements,
    ingredients,
    supplyDistributions,
    addSupplyDistribution,
    updateSupplyDistribution,
    deleteSupplyDistribution,
    updateIngredient,
    userRole,
  } = useStore();

  const isSuperadmin = userRole === 'SUPERADMIN';

  // State pencarian & filter riwayat
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'IN_DELIVERY'>('ALL');

  // State Modal Buat / Edit Alokasi
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDistribution, setEditingDistribution] = useState<SupplyDistribution | null>(null);

  const [selectedProcurementId, setSelectedProcurementId] = useState<string>('');
  const [manualSupplierName, setManualSupplierName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [itemsToAllocate, setItemsToAllocate] = useState<SupplyAllocationItem[]>([]);
  const [modalItemSearch, setModalItemSearch] = useState('');
  const [selectedAddIngredientId, setSelectedAddIngredientId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State Konfirmasi Hapus Modal
  const [distributionToDelete, setDistributionToDelete] = useState<SupplyDistribution | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State Accordion Expand / Collapse per Card Riwayat
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

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
          category: ing.category,
          totalPurchased: targetQty,
          unit: ing.defaultUnit,
          allocations: alloc,
          allocatedTotal: targetQty,
          remainingUnallocated: 0,
        };
      });

      setItemsToAllocate(mapped);
      return;
    }

    const proc = validProcurements.find((p) => p.id === procId);
    if (!proc) return;

    setManualSupplierName(proc.supplierName || 'CV Rekanan SPPG');
    setDriverName('Mas Joko Santoso (Driver Rekanan CV)');
    setDriverPhone('0812-3456-7890');
    setVehiclePlate('W 8923 AB (Pickup CV)');
    setDeliveryDate(proc.date ? new Date(proc.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));

    const mapped: SupplyAllocationItem[] = proc.items.map((it) => {
      const targetQty = Number(it.quantity) || 0;
      const count = sppgUnits.length || 4;
      const perUnit = Math.floor(targetQty / count);
      const remainder = targetQty - perUnit * count;

      const alloc: Record<string, number> = {};
      sppgUnits.forEach((u, idx) => {
        const code = u.code || u.id;
        alloc[code] = perUnit + (idx === 0 ? remainder : 0);
      });

      return {
        ingredientId: it.ingredientId,
        name: it.name,
        category: it.category,
        totalPurchased: targetQty,
        unit: it.unit,
        allocations: alloc,
        allocatedTotal: targetQty,
        remainingUnallocated: 0,
      };
    });

    setItemsToAllocate(mapped);
  };

  // Handler Alokasi Cepat dari Tabel Gudang Sementara
  const handleStartAllocationForSpecificIngredient = (ing: MasterIngredient) => {
    setEditingDistribution(null);
    setSelectedProcurementId('GUDANG_REALTIME');
    setManualSupplierName('Gudang Sementara Logistik (Hasil Belanja CV)');
    setDriverName('Mas Joko Santoso (Driver CV / Ekspedisi SPPG)');
    setDriverPhone('0812-3456-7890');
    setVehiclePlate('W 8923 AB (Pickup Logistik)');
    setDeliveryDate(new Date().toISOString().slice(0, 10));
    setNotes(`Penyebaran khusus bahan ${ing.name} dari Gudang Sementara ke Dapur SPPG.`);

    const totalAllocated = Object.values(ing.sppgDistribution || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
    const available = Math.max(0, (Number(ing.currentStock) || 0) - totalAllocated);
    const targetQty = available > 0 ? available : (Number(ing.currentStock) || 50);

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
        category: ing.category,
        totalPurchased: targetQty,
        unit: ing.defaultUnit,
        allocations: alloc,
        allocatedTotal: targetQty,
        remainingUnallocated: 0,
      },
    ]);

    setIsCreateModalOpen(true);
    setErrorMessage('');
  };

  // Handler Buka Form Buat Alokasi Baru
  const handleOpenCreateModal = () => {
    setEditingDistribution(null);
    setNotes('');
    setModalItemSearch('');
    setIsCreateModalOpen(true);
    handleSelectProcurement('GUDANG_REALTIME');
  };

  // Handler Mulai Edit Alokasi yang Sudah Ada
  const handleStartEdit = (dist: SupplyDistribution) => {
    setEditingDistribution(dist);
    setSelectedProcurementId(dist.procurementOrderId || 'MANUAL');
    setManualSupplierName(dist.supplierName || '');
    setDriverName(dist.driverName || '');
    setDriverPhone(dist.driverPhone || '');
    setVehiclePlate(dist.vehiclePlate || '');
    setDeliveryDate(dist.date ? new Date(dist.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    setNotes(dist.notes || '');
    setModalItemSearch('');

    const mapped: SupplyAllocationItem[] = (dist.items || []).map((it) => {
      const allocations = { ...(it.allocations || {}) };
      const allocatedSum = Object.values(allocations).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
      const totalPurchased = Number(it.totalPurchased) || 0;
      return {
        ...it,
        allocations,
        allocatedTotal: allocatedSum,
        remainingUnallocated: totalPurchased - allocatedSum,
      };
    });

    setItemsToAllocate(mapped);
    setIsCreateModalOpen(true);
    setErrorMessage('');
  };

  // Handler Konfirmasi Hapus Alokasi (Stok otomatis kembali ke Gudang Sementara)
  const handleConfirmDelete = async () => {
    if (!distributionToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteSupplyDistribution(distributionToDelete.id);
      if (res.ok) {
        setSuccessMessage(`✅ Alokasi ${distributionToDelete.dispatchNumber} berhasil dihapus. Seluruh bahan telah dikembalikan ke Gudang Sementara.`);
        setDistributionToDelete(null);
      } else {
        setErrorMessage(res.error || 'Gagal menghapus alokasi bahan.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler Tarik Kembali Semua Bahan pada Alokasi ke Gudang Sementara
  const handleReturnAllocation = async (dist: SupplyDistribution) => {
    if (!window.confirm(`Tarik kembali seluruh bahan pada surat jalan ${dist.dispatchNumber} dari 4 dapur SPPG ke Gudang Sementara?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await updateSupplyDistribution(dist.id, { action: 'return' });
      if (res.ok) {
        setSuccessMessage(`✅ Berhasil! Seluruh bahan dari surat jalan ${dist.dispatchNumber} telah ditarik kembali ke Gudang Sementara.`);
      } else {
        setErrorMessage(res.error || 'Gagal menarik kembali bahan ke gudang.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Accordion Rincian Bahan di Riwayat Card
  const toggleExpandCard = (id: string) => {
    setExpandedCardIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter Bahan Gudang Sementara
  const warehouseCategories = useMemo(() => {
    const set = new Set<string>();
    ingredients.forEach((ing) => {
      if (ing.category) set.add(ing.category);
    });
    return Array.from(set);
  }, [ingredients]);

  const warehouseIngredients = useMemo(() => {
    return ingredients.filter((ing) => {
      if (warehouseCategoryFilter !== 'ALL' && ing.category !== warehouseCategoryFilter) {
        return false;
      }
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

  // Hapus 1 baris bahan dari alokasi
  const handleRemoveItemFromAllocation = (index: number) => {
    setItemsToAllocate((prev) => prev.filter((_, i) => i !== index));
  };

  // Tambah bahan lain dari gudang secara manual
  const handleAddCustomIngredient = () => {
    if (!selectedAddIngredientId) return;
    const ing = ingredients.find((i) => i.id === selectedAddIngredientId);
    if (!ing) return;

    if (itemsToAllocate.some((it) => it.ingredientId === ing.id || it.name.toLowerCase() === ing.name.toLowerCase())) {
      setErrorMessage(`Bahan "${ing.name}" sudah ada di dalam daftar alokasi.`);
      return;
    }

    const totalAllocated = Object.values(ing.sppgDistribution || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
    const available = Math.max(0, (Number(ing.currentStock) || 0) - totalAllocated);
    const targetQty = available > 0 ? available : (Number(ing.currentStock) || 50);

    const count = sppgUnits.length || 4;
    const perUnit = Math.floor(targetQty / count);
    const remainder = targetQty - perUnit * count;

    const alloc: Record<string, number> = {};
    sppgUnits.forEach((u, idx) => {
      const code = u.code || u.id;
      alloc[code] = perUnit + (idx === 0 ? remainder : 0);
    });

    const newItem: SupplyAllocationItem = {
      ingredientId: ing.id,
      name: ing.name,
      category: ing.category,
      totalPurchased: targetQty,
      unit: ing.defaultUnit,
      allocations: alloc,
      allocatedTotal: targetQty,
      remainingUnallocated: 0,
    };

    setItemsToAllocate((prev) => [...prev, newItem]);
    setSelectedAddIngredientId('');
    setErrorMessage('');
  };

  // Submit Simpan Alokasi (Create atau Update)
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
      if (editingDistribution) {
        // Mode Edit / Revisi
        const payload = {
          supplierName: manualSupplierName || editingDistribution.supplierName,
          driverName: driverName.trim(),
          driverPhone: driverPhone.trim() || '-',
          vehiclePlate: vehiclePlate.trim() || '-',
          date: new Date(deliveryDate).toISOString(),
          notes: notes.trim() || null,
          items: itemsToAllocate,
        };

        const res = await updateSupplyDistribution(editingDistribution.id, payload);
        if (res.ok) {
          setIsCreateModalOpen(false);
          setEditingDistribution(null);
          setActiveTabMode('history');
          setSuccessMessage(`✅ Berhasil! Alokasi bahan ${editingDistribution.dispatchNumber} berhasil diperbarui.`);
        } else {
          setErrorMessage(res.error || 'Gagal memperbarui alokasi bahan.');
        }
      } else {
        // Mode Buat Baru
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
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered List Riwayat
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

  // Filtered Items to Allocate inside Modal
  const filteredModalItems = useMemo(() => {
    if (!modalItemSearch.trim()) return itemsToAllocate;
    const q = modalItemSearch.toLowerCase();
    return itemsToAllocate.filter(
      (it) => it.name.toLowerCase().includes(q) || (it.category || '').toLowerCase().includes(q)
    );
  }, [itemsToAllocate, modalItemSearch]);

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
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
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
        {isSuperadmin && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition transform active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Sebar Bahan ke 4 Dapur</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
              <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 flex-wrap">
                <span>Konsep Gudang Sementara & Sebar Bahan ke Dapur</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.2 rounded-full font-bold">Real-Time</span>
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Semua pembelanjaan dari CV/vendor langsung masuk ke <strong>Gudang Sementara</strong> ini. Dari gudang ini, Anda dapat menyebarkan bahan ke 4 dapur SPPG secara merata atau sesuai kebutuhan. Jika saat memasak di menu <strong>Distribusi Makanan</strong> jatah dapur kurang, sistem akan secara otomatis menarik kekurangan dari sisa stok cadangan di gudang sementara ini.
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
                placeholder="Cari kode atau nama bahan di gudang..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end overflow-x-auto scrollbar-none">
              <span className="text-xs text-slate-500 font-medium shrink-0">Kategori:</span>
              <select
                value={warehouseCategoryFilter}
                onChange={(e) => setWarehouseCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="ALL">Semua Kategori</option>
                {warehouseCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabel Stok Gudang Sementara */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 w-8">#</th>
                    <th className="py-2.5 px-3 w-28">Kode</th>
                    <th className="py-2.5 px-3">Nama Bahan</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-right">Gudang Sementara (Sisa Standby)</th>
                    <th className="py-2.5 px-3 text-center">Tersebar di 4 Dapur SPPG</th>
                    <th className="py-2.5 px-3 text-right">Total Fisik</th>
                    <th className="py-2.5 px-3 text-center">Satuan</th>
                    {isSuperadmin && <th className="py-2.5 px-3 text-right">Aksi Cepat</th>}
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
                          <div className="flex items-center justify-center gap-1 text-[10px] font-mono flex-wrap">
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
                            <div className="flex items-center justify-end gap-1.5">
                              {totalAllocated > 0 && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (window.confirm(`Tarik kembali ${totalAllocated} ${ing.defaultUnit} ${ing.name} dari 4 dapur SPPG ke Gudang Sementara?`)) {
                                      const res = await updateIngredient(ing.id, { sppgDistribution: { 'SPPG-AA02': 0, 'SPPG-BS02': 0, 'SPPG-DR01': 0, 'SPPG-SM01': 0 } });
                                      if (res.ok) {
                                        setSuccessMessage(`✅ Berhasil! Sebaran bahan ${ing.name} telah ditarik kembali ke Gudang Sementara.`);
                                      }
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 transition"
                                  title={`Tarik kembali ${totalAllocated} ${ing.defaultUnit} ke Gudang Sementara`}
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Tarik</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleStartAllocationForSpecificIngredient(ing)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Sebar Bahan</span>
                              </button>
                            </div>
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
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
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
                    onClick={handleOpenCreateModal}
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
                const isExpanded = !!expandedCardIds[dist.id];

                return (
                  <div
                    key={dist.id}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 p-4 sm:p-5 shadow-xs hover:shadow-md transition space-y-4"
                  >
                    {/* Header Kartu */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {dist.dispatchNumber}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              dist.status === 'RETURNED'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : dist.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {dist.status === 'RETURNED' ? 'Ditarik ke Gudang' : dist.status === 'COMPLETED' ? 'Selesai Disebar' : 'Dalam Perjalanan'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="font-semibold text-slate-700">{dist.supplierName}</span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {new Date(dist.date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons: Cetak, Tarik ke Gudang, Edit, Hapus */}
                      <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setSelectedForPrint(dist)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition"
                          title="Lihat & Cetak Surat Jalan Resmi Standar Pemerintah"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Cetak Surat Jalan</span>
                        </button>

                        {isSuperadmin && dist.status !== 'RETURNED' && (
                          <button
                            type="button"
                            onClick={() => handleReturnAllocation(dist)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs border border-amber-200 transition"
                            title="Tarik kembali bahan alokasi ini dari 4 dapur ke gudang sementara"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Tarik ke Gudang</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleStartEdit(dist)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition"
                          title="Edit Rincian Alokasi Pasokan"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDistributionToDelete(dist)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition"
                          title="Hapus Alokasi Pasokan (Bahan otomatis kembali ke Gudang)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
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
                          {items.length} Bahan ({totalKg.toLocaleString('id-ID')} Total Satuan)
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
                                  {unitQtySum.toLocaleString('id-ID')}
                                </span>
                                <span className="text-[9px] text-slate-400 block">Diterima</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Accordion / Toggle Rincian Bahan yang Disebar (Scrollable & Tidak Memanjang) */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => toggleExpandCard(dist.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 transition"
                        >
                          <span>{isExpanded ? 'Tutup Rincian Bahan' : `Lihat Rincian ${items.length} Bahan Lengkap`}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>

                        <span className="text-[11px] text-slate-400 font-medium">
                          {items.length} Bahan &bull; {totalKg.toLocaleString('id-ID')} Total Satuan
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden shadow-2xs animate-in fade-in">
                          <div className="max-h-60 overflow-y-auto overflow-x-auto scrollbar-thin">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="sticky top-0 bg-slate-100 font-bold text-slate-700 border-b border-slate-200 shadow-2xs">
                                <tr>
                                  <th className="py-2 px-2.5 w-10 text-center">No</th>
                                  <th className="py-2 px-3">Nama Bahan</th>
                                  <th className="py-2 px-2">Kategori</th>
                                  <th className="py-2 px-2 text-right">Total Beli</th>
                                  {sppgUnits.map((u) => (
                                    <th key={u.id} className="py-2 px-2 text-right w-24">
                                      {u.shortName}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {items.map((it, itIdx) => (
                                  <tr key={itIdx} className="hover:bg-slate-50/70 transition">
                                    <td className="py-2 px-2.5 text-center text-slate-400 font-mono text-[11px]">{itIdx + 1}</td>
                                    <td className="py-2 px-3 font-bold text-slate-900">{it.name}</td>
                                    <td className="py-2 px-2 text-slate-500 text-[11px]">{it.category}</td>
                                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                                      {it.totalPurchased} {it.unit}
                                    </td>
                                    {sppgUnits.map((u) => {
                                      const code = u.code || u.id;
                                      const val = it.allocations?.[code] || 0;
                                      return (
                                        <td key={u.id} className="py-2 px-2 text-right font-mono text-slate-700">
                                          {val > 0 ? `${val} ${it.unit}` : '-'}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MODAL BUAT / EDIT ALOKASI BAHAN (SCROLLABLE & FULL RESPONSIF) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2 flex-wrap">
                    <span>
                      {editingDistribution ? `Edit Alokasi: ${editingDistribution.dispatchNumber}` : 'Sebar Bahan Belanja ke Dapur SPPG'}
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                      {editingDistribution ? 'Mode Revisi' : 'Surat Jalan Pasokan'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingDistribution
                      ? 'Sesuaikan driver, tanggal, atau pembagian porsi bahan ke 4 dapur SPPG.'
                      : 'Bahan belanja dari CV langsung dibagi dan dikirim ke 4 dapur SPPG terdaftar.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingDistribution(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveAllocation} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Pilih Nota Belanja Sumber */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  1. Sumber Nota Pembelanjaan / Gudang:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    disabled={!!editingDistribution}
                    value={selectedProcurementId}
                    onChange={(e) => handleSelectProcurement(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
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
                    <span className="truncate">Supplier/CV: {manualSupplierName || '-'}</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold shrink-0">
                      {itemsToAllocate.length} Bahan Terpilih
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Informasi Pengantar / Driver CV & Tanggal */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  2. Informasi Kurir CV & Jadwal Pengantaran:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="sm:col-span-1">
                    <label className="text-[11px] text-slate-500 block mb-1">Tanggal Kirim *</label>
                    <input
                      type="date"
                      required
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-[11px] text-slate-500 block mb-1">Nama Driver CV *</label>
                    <input
                      type="text"
                      required
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Contoh: Mas Joko Santoso"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-[11px] text-slate-500 block mb-1">No. HP Driver</label>
                    <input
                      type="text"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="Contoh: 0812-3456-7890"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div className="sm:col-span-1">
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

              {/* 3. Matriks Alokasi ke 4 Dapur SPPG (SCROLLABLE & TIDAK MEMANJANG) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      3. Matriks Alokasi Pembagian ke 4 Dapur SPPG:
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Tentukan banyaknya bahan yang diserahkan ke masing-masing dapur. Tabel di bawah dapat di-scroll vertikal dan horizontal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleEqualSplitAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs transition border border-emerald-300 self-start sm:self-auto shrink-0"
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
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    {/* Toolbar Pencarian & Tambah Bahan di dalam Modal */}
                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-700">
                          Daftar Bahan ({itemsToAllocate.length} Item Terdaftar)
                        </span>
                        {itemsToAllocate.length > 5 && (
                          <span className="text-[10px] text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full font-medium">
                            Scroll ke bawah untuk melihat semua
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Input Pencarian Bahan dalam Modal */}
                        <div className="relative w-full sm:w-44">
                          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={modalItemSearch}
                            onChange={(e) => setModalItemSearch(e.target.value)}
                            placeholder="Cari nama bahan..."
                            className="w-full pl-7 pr-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Tambah Bahan Lain dari Gudang */}
                        <div className="flex items-center gap-1">
                          <select
                            value={selectedAddIngredientId}
                            onChange={(e) => setSelectedAddIngredientId(e.target.value)}
                            className="text-[11px] bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[150px]"
                          >
                            <option value="">+ Tambah Bahan Gudang</option>
                            {ingredients
                              .filter((ing) => !itemsToAllocate.some((it) => it.ingredientId === ing.id))
                              .map((ing) => (
                                <option key={ing.id} value={ing.id}>
                                  {ing.name} ({ing.currentStock} {ing.defaultUnit})
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            disabled={!selectedAddIngredientId}
                            onClick={handleAddCustomIngredient}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold text-xs transition"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Scrollable Container dengan Sticky Header (Batas Tinggi Aman max-h-72 s.d. max-h-80) */}
                    <div className="max-h-72 sm:max-h-80 overflow-y-auto overflow-x-auto scrollbar-thin">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 z-10 shadow-2xs">
                          <tr>
                            <th className="py-2.5 px-3">Bahan Makanan</th>
                            <th className="py-2.5 px-2 text-center w-24">Total Beli</th>
                            {sppgUnits.map((u) => (
                              <th key={u.id} className="py-2.5 px-2 text-center w-24 sm:w-28">
                                {u.shortName}
                              </th>
                            ))}
                            <th className="py-2.5 px-2 text-center w-20">Sisa</th>
                            <th className="py-2.5 px-2 text-center w-20">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredModalItems.map((it) => {
                            const originalIdx = itemsToAllocate.findIndex(
                              (orig) => orig.ingredientId === it.ingredientId && orig.name === it.name
                            );
                            const actualIdx = originalIdx >= 0 ? originalIdx : 0;
                            const isComplete = it.remainingUnallocated === 0;
                            const isOverflow = it.remainingUnallocated < 0;

                            return (
                              <tr key={actualIdx} className="hover:bg-slate-50/70 transition">
                                <td className="py-2 px-3">
                                  <span className="font-bold text-slate-900 block truncate max-w-[180px]">{it.name}</span>
                                  <span className="text-[10px] text-slate-400">{it.category}</span>
                                </td>
                                <td className="py-2 px-2 text-center font-mono font-bold text-slate-900 bg-slate-50/50">
                                  {it.totalPurchased} {it.unit}
                                </td>
                                {sppgUnits.map((u) => {
                                  const code = u.code || u.id;
                                  const val = it.allocations?.[code] ?? 0;
                                  return (
                                    <td key={u.id} className="py-1.5 px-1 text-center">
                                      <input
                                        type="number"
                                        min={0}
                                        value={val}
                                        onChange={(e) => handleUpdateItemAllocation(actualIdx, code, e.target.value)}
                                        className="w-16 sm:w-20 px-1.5 py-1 text-center font-mono font-bold text-xs rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                      />
                                    </td>
                                  );
                                })}
                                <td className="py-2 px-2 text-center font-mono text-xs">
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
                                <td className="py-2 px-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleEqualSplitRow(actualIdx)}
                                      className="p-1 rounded text-emerald-700 hover:bg-emerald-100 transition"
                                      title="Bagi rata bahan ini"
                                    >
                                      <Divide className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItemFromAllocation(actualIdx)}
                                      className="p-1 rounded text-rose-500 hover:bg-rose-50 transition"
                                      title="Hapus bahan ini dari alokasi"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
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
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingDistribution(null);
                  }}
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
                  <span>
                    {isSubmitting
                      ? 'Menyimpan...'
                      : editingDistribution
                      ? 'Simpan Perubahan Alokasi'
                      : 'Simpan & Terbitkan Surat Jalan'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS ALOKASI */}
      {distributionToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-slate-900">Konfirmasi Hapus Alokasi Pasokan</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus dokumen alokasi <strong className="text-slate-900">{distributionToDelete.dispatchNumber}</strong>?
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Pengembalian Stok Otomatis</span>
              </p>
              <p className="text-[11px] leading-relaxed text-amber-900">
                Sebanyak <strong>{distributionToDelete.items?.length || 0} item bahan</strong> yang dialokasikan ke 4 dapur akan otomatis ditarik kembali ke saldo <strong>Gudang Sementara (Belum Disebar)</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDistributionToDelete(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-300 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus & Tarik Kembali'}</span>
              </button>
            </div>
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
