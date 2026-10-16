'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { MasterIngredient, StockMutationType, SppgUnitId } from '@/lib/types';
import { formatIDR, formatNumber, formatDateIndo, formatDateTimeIndo } from '@/lib/utils';
import {
 Boxes,
 Plus,
 Search,
 Filter,
 ArrowDownLeft,
 ArrowUpRight,
 Layers,
 Tag,
 Scale,
 Edit2,
 Trash2,
 AlertCircle,
 CheckCircle2,
 PackageCheck,
 Building2,
 X,
} from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';

export function KitchenInventoryCMS() {
 const {
 ingredients,
 categories,
 units,
 stockLedgers,
 sppgUnits,
 selectedSppgUnit,
 setSelectedSppgUnit,
 addIngredient,
 updateIngredient,
 deleteIngredient,
 addCategory,
 addUnit,
 recordStockMutation,
 openModal,
 userRole,
 } = useStore();

 const [activeSubTab, setActiveSubTab] = useState<'master' | 'ledger' | 'categories' | 'units'>('master');
 const [deleteTargetIngredient, setDeleteTargetIngredient] = useState<MasterIngredient | null>(null);
 const [searchQuery, setSearchQuery] = useState<string>('');
 const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

 // Modals inside component
 const [showAddIngredientModal, setShowAddIngredientModal] = useState<boolean>(false);
 const [editingIngredient, setEditingIngredient] = useState<MasterIngredient | null>(null);
 const [showMutationModal, setShowMutationModal] = useState<boolean>(false);
 const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
 const [showUnitModal, setShowUnitModal] = useState<boolean>(false);

 // New Ingredient form state
 const [ingName, setIngName] = useState<string>('');
 const [ingCategory, setIngCategory] = useState<string>('Protein Hewani');
 const [ingUnit, setIngUnit] = useState<string>('Kg');
 const [ingStock, setIngStock] = useState<number>(10);
 const [ingMinAlert, setIngMinAlert] = useState<number>(5);
 const [ingPrice, setIngPrice] = useState<number>(25000);

 // Mutation form state
 const [mutationType, setMutationType] = useState<StockMutationType>('KELUAR');
 const [mutationIngId, setMutationIngId] = useState<string>(ingredients[0]?.id || '');
 const [mutationQty, setMutationQty] = useState<number>(10);
 const [mutationSppgUnit, setMutationSppgUnit] = useState<SppgUnitId>('SPPG-AA02');
 const [mutationRef, setMutationRef] = useState<string>('MENU-20261016-SIANG');
 const [mutationPurpose, setMutationPurpose] = useState<string>('Porsi Makan Siang Siswa (1.200 Porsi)');
 const [mutationOfficer, setMutationOfficer] = useState<string>('Dewi Lestari (Juru Masak)');

 // New Category form state
 const [newCatName, setNewCatName] = useState<string>('');
 const [newCatCode, setNewCatCode] = useState<string>('');
 const [newCatColor, setNewCatColor] = useState<string>('#3b82f6');
 const [newCatDesc, setNewCatDesc] = useState<string>('');

 // New Unit form state
 const [newUnitName, setNewUnitName] = useState<string>('');
 const [newUnitSymbol, setNewUnitSymbol] = useState<string>('');
 const [newUnitType, setNewUnitType] = useState<'WEIGHT' | 'VOLUME' | 'PIECE' | 'PACKAGING'>('WEIGHT');

 // Filtered ingredients
 const filteredList = useMemo(() => {
 return ingredients.filter((ing) => {
 if (selectedCategoryFilter !== 'ALL' && ing.category !== selectedCategoryFilter) return false;
 if (searchQuery.trim() !== '') {
 const q = searchQuery.toLowerCase();
 return ing.name.toLowerCase().includes(q) || ing.code.toLowerCase().includes(q);
 }
 return true;
 });
 }, [ingredients, selectedCategoryFilter, searchQuery]);

 // Filtered ledgers
 const filteredLedgers = useMemo(() => {
 if (selectedSppgUnit === 'ALL') return stockLedgers;
 return stockLedgers.filter((l) => l.sppgUnitId === selectedSppgUnit);
 }, [stockLedgers, selectedSppgUnit]);

 const handleSaveIngredient = (e: React.FormEvent) => {
 e.preventDefault();
 const catObj = categories.find((c) => c.name === ingCategory);
 if (editingIngredient) {
 updateIngredient(editingIngredient.id, {
 name: ingName,
 category: ingCategory,
 categoryId: catObj?.id || 'CAT-01',
 defaultUnit: ingUnit,
 currentStock: ingStock,
 minStockAlert: ingMinAlert,
 lastPurchasePrice: ingPrice,
 });
 setEditingIngredient(null);
 } else {
 addIngredient({
 name: ingName,
 category: ingCategory,
 categoryId: catObj?.id || 'CAT-01',
 defaultUnit: ingUnit,
 currentStock: ingStock,
 minStockAlert: ingMinAlert,
 lastPurchasePrice: ingPrice,
 sppgDistribution: {
 'SPPG-AA02': Math.round(ingStock * 0.35),
 'SPPG-BS02': Math.round(ingStock * 0.3),
 'SPPG-DR01': Math.round(ingStock * 0.2),
 'SPPG-SM01': Math.round(ingStock * 0.15),
 },
 });
 }
 setShowAddIngredientModal(false);
 resetIngForm();
 };

 const resetIngForm = () => {
 setIngName('');
 setIngCategory(categories[0]?.name || 'Sayuran');
 setIngUnit('Kg');
 setIngStock(10);
 setIngMinAlert(5);
 setIngPrice(25000);
 };

 const handleRecordMutation = (e: React.FormEvent) => {
 e.preventDefault();
 const targetIng = ingredients.find((i) => i.id === mutationIngId);
 const targetUnit = sppgUnits.find((u) => u.id === mutationSppgUnit);
 if (!targetIng) return;

 recordStockMutation({
 sppgUnitId: mutationSppgUnit,
 sppgUnitName: targetUnit?.name || '',
 ingredientId: targetIng.id,
 ingredientName: targetIng.name,
 category: targetIng.category,
 type: mutationType,
 quantity: mutationQty,
 unit: targetIng.defaultUnit,
 referenceNumber: mutationRef,
 purpose: mutationPurpose,
 recordedBy: mutationOfficer,
 });
 setShowMutationModal(false);
 };

 const handleSaveCategory = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newCatName) return;
 addCategory({
 name: newCatName,
 code: newCatCode || newCatName.slice(0, 4).toUpperCase(),
 color: newCatColor,
 description: newCatDesc || 'Kelompok bahan pangan SPPG',
 });
 setNewCatName('');
 setNewCatCode('');
 setShowCategoryModal(false);
 };

 const handleSaveUnit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newUnitSymbol) return;
 addUnit({
 name: newUnitName || newUnitSymbol,
 symbol: newUnitSymbol,
 type: newUnitType,
 });
 setNewUnitName('');
 setNewUnitSymbol('');
 setShowUnitModal(false);
 };

 return (
 <div className="space-y-4">
 {/* Title & Actions */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
 <div>
 <div className="flex items-center gap-2">
 <h1 className="text-xl font-bold tracking-tight text-slate-900">
 Master Bahan & Manajemen Logistik Dapur SPPG
 </h1>
 <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-mono font-semibold text-emerald-800">
 20 Bahan Real Client
 </span>
 </div>
 <p className="text-xs text-slate-500 mt-0.5">
 Pencatatan inventaris stok bahan makanan, kartu stok gudang keluar-masuk, kategori gizi & satuan ukur
 </p>
 </div>

 {userRole === 'SUPERADMIN' ? (
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => setShowMutationModal(true)}
 className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
 >
 <ArrowDownLeft className="h-3.5 w-3.5 text-blue-600" />
 <span>Catat Mutasi Masuk/Keluar</span>
 </button>

 <button
 type="button"
 onClick={() => {
 resetIngForm();
 setEditingIngredient(null);
 setShowAddIngredientModal(true);
 }}
 className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
 >
 <Plus className="h-3.5 w-3.5" />
 <span>Tambah Master Bahan</span>
 </button>
 </div>
 ) : (
 <div className="flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 border border-slate-200">
 <span>🔒 Mode Auditor Eksekutif (Akses Tambah/Edit/Hapus Bahan Terkunci - Read Only)</span>
 </div>
 )}
 </div>

 {/* Sub Tabs */}
 <div className="flex items-center gap-2 border-b border-slate-200">
 <button
 type="button"
 onClick={() => setActiveSubTab('master')}
 className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-semibold border-b-2 transition ${
 activeSubTab === 'master'
 ? 'border-slate-900 text-slate-900'
 : 'border-transparent text-slate-500 hover:text-slate-800'
 }`}
 >
 <Boxes className="h-3.5 w-3.5" />
 <span>Master Bahan ({ingredients.length})</span>
 </button>

 <button
 type="button"
 onClick={() => setActiveSubTab('ledger')}
 className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-semibold border-b-2 transition ${
 activeSubTab === 'ledger'
 ? 'border-slate-900 text-slate-900'
 : 'border-transparent text-slate-500 hover:text-slate-800'
 }`}
 >
 <Layers className="h-3.5 w-3.5" />
 <span>Buku Mutasi Keluar-Masuk ({stockLedgers.length})</span>
 </button>

 <button
 type="button"
 onClick={() => setActiveSubTab('categories')}
 className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-semibold border-b-2 transition ${
 activeSubTab === 'categories'
 ? 'border-slate-900 text-slate-900'
 : 'border-transparent text-slate-500 hover:text-slate-800'
 }`}
 >
 <Tag className="h-3.5 w-3.5" />
 <span>Master Kategori ({categories.length})</span>
 </button>

 <button
 type="button"
 onClick={() => setActiveSubTab('units')}
 className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-semibold border-b-2 transition ${
 activeSubTab === 'units'
 ? 'border-slate-900 text-slate-900'
 : 'border-transparent text-slate-500 hover:text-slate-800'
 }`}
 >
 <Scale className="h-3.5 w-3.5" />
 <span>Master Satuan ({units.length})</span>
 </button>
 </div>

 {/* SUBTAB 1: MASTER BAHAN */}
 {activeSubTab === 'master' && (
 <div className="space-y-4">
 {/* Search & Category Filter */}
 <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
 <div className="relative flex-1 max-w-sm w-full">
 <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Cari kode atau nama bahan dapur..."
 className="w-full rounded-md border border-slate-300 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400"
 />
 </div>

 <div className="flex items-center gap-1.5 flex-wrap">
 <button
 type="button"
 onClick={() => setSelectedCategoryFilter('ALL')}
 className={`px-2.5 py-1 rounded text-xs transition ${
 selectedCategoryFilter === 'ALL'
 ? 'bg-slate-900 text-white font-medium'
 : 'text-slate-600 hover:bg-slate-100'
 }`}
 >
 Semua Kategori
 </button>
 {categories.map((c) => (
 <button
 key={c.id}
 type="button"
 onClick={() => setSelectedCategoryFilter(c.name)}
 className={`px-2 py-1 rounded text-xs transition ${
 selectedCategoryFilter === c.name
 ? 'bg-slate-900 text-white font-medium'
 : 'text-slate-600 hover:bg-slate-100'
 }`}
 >
 {c.name}
 </button>
 ))}
 </div>
 </div>

 {/* Master Bahan Table */}
 <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs border-collapse">
 <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase">
 <tr>
 <th className="py-2.5 px-3">No</th>
 <th className="py-2.5 px-3">Kode Bahan</th>
 <th className="py-2.5 px-3">Nama Bahan Dapur</th>
 <th className="py-2.5 px-3">Kategori</th>
 <th className="py-2.5 px-3 text-right">Total Stok</th>
 <th className="py-2.5 px-3 text-center">Satuan</th>
 <th className="py-2.5 px-3 text-right">Estimasi Harga</th>
 <th className="py-2.5 px-3 text-center">Sebaran 4 SPPG</th>
 <th className="py-2.5 px-3 text-center">Status</th>
 {userRole === 'SUPERADMIN' && <th className="py-2.5 px-3 text-right">Aksi</th>}
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filteredList.map((item, idx) => {
 const isLowStock = item.currentStock <= item.minStockAlert;
 return (
 <tr key={item.id} className="hover:bg-slate-50/70">
 <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
 <td className="py-2.5 px-3 font-mono text-slate-600 font-medium">{item.code}</td>
 <td className="py-2.5 px-3 font-semibold text-slate-900">{item.name}</td>
 <td className="py-2.5 px-3">
 <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
 {item.category}
 </span>
 </td>
 <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
 {formatNumber(item.currentStock, item.currentStock % 1 === 0 ? 0 : 1)}
 </td>
 <td className="py-2.5 px-3 text-center font-mono text-slate-600">{item.defaultUnit}</td>
 <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
 {formatIDR(item.lastPurchasePrice)}
 </td>
 <td className="py-2.5 px-3 text-center">
 <div className="flex items-center justify-center gap-1 text-[10px] font-mono">
 <span title="Abar Abir 02" className="bg-blue-50 text-blue-700 px-1 rounded">
 AA:{item.sppgDistribution?.['SPPG-AA02'] || 0}
 </span>
 <span title="Banjarsari 02" className="bg-emerald-50 text-emerald-700 px-1 rounded">
 BS:{item.sppgDistribution?.['SPPG-BS02'] || 0}
 </span>
 <span title="Dahan Rejo 01" className="bg-amber-50 text-amber-700 px-1 rounded">
 DR:{item.sppgDistribution?.['SPPG-DR01'] || 0}
 </span>
 <span title="Semampir" className="bg-purple-50 text-purple-700 px-1 rounded">
 SM:{item.sppgDistribution?.['SPPG-SM01'] || 0}
 </span>
 </div>
 </td>
 <td className="py-2.5 px-3 text-center">
 {isLowStock ? (
 <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 border border-rose-200">
 Stok Menipis
 </span>
 ) : (
 <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
 Aman
 </span>
 )}
 </td>
 {userRole === 'SUPERADMIN' && (
 <td className="py-2.5 px-3 text-right">
 <div className="flex items-center justify-end gap-1">
 <button
 type="button"
 onClick={() => {
 setEditingIngredient(item);
 setIngName(item.name);
 setIngCategory(item.category);
 setIngUnit(item.defaultUnit);
 setIngStock(item.currentStock);
 setIngMinAlert(item.minStockAlert);
 setIngPrice(item.lastPurchasePrice);
 setShowAddIngredientModal(true);
 }}
 className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
 >
 <Edit2 className="h-3.5 w-3.5" />
 </button>
 <button
 type="button"
 onClick={() => setDeleteTargetIngredient(item)}
 className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
 >
 <Trash2 className="h-3.5 w-3.5" />
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

 {/* SUBTAB 2: MUTASI LEDGER */}
 {activeSubTab === 'ledger' && (
 <div className="space-y-4">
 <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
 <div className="flex items-center gap-2 text-xs">
 <span className="text-slate-500">Filter Dapur SPPG:</span>
 <select
 value={selectedSppgUnit}
 onChange={(e) => setSelectedSppgUnit(e.target.value as any)}
 className="rounded border border-slate-300 px-2 py-1 text-xs"
 >
 <option value="ALL">Semua SPPG (Konsolidasi)</option>
 {sppgUnits.map((u) => (
 <option key={u.id} value={u.id}>{u.name}</option>
 ))}
 </select>
 </div>
 <span className="text-xs text-slate-500 font-mono">
 Total Riwayat Mutasi: {filteredLedgers.length} Entri
 </span>
 </div>

 <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs border-collapse">
 <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase">
 <tr>
 <th className="py-2.5 px-3">Waktu</th>
 <th className="py-2.5 px-3">Unit Dapur SPPG</th>
 <th className="py-2.5 px-3">Jenis Mutasi</th>
 <th className="py-2.5 px-3">Bahan Dapur</th>
 <th className="py-2.5 px-3 text-right">Volume</th>
 <th className="py-2.5 px-3">Referensi Dokumen / Menu</th>
 <th className="py-2.5 px-3">Keperluan / Keterangan</th>
 <th className="py-2.5 px-3">Petugas Pencatat</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filteredLedgers.map((l) => (
 <tr key={l.id} className="hover:bg-slate-50/70">
 <td className="py-2.5 px-3 font-mono text-slate-500">{formatDateTimeIndo(l.timestamp)}</td>
 <td className="py-2.5 px-3 font-medium text-slate-900">{l.sppgUnitName}</td>
 <td className="py-2.5 px-3">
 {l.type === 'MASUK' ? (
 <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
 <ArrowDownLeft className="h-3 w-3" />
 MASUK (Pasokan)
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
 <ArrowUpRight className="h-3 w-3" />
 KELUAR (Masak)
 </span>
 )}
 </td>
 <td className="py-2.5 px-3 font-semibold text-slate-900">{l.ingredientName}</td>
 <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
 {l.quantity} {l.unit}
 </td>
 <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{l.referenceNumber}</td>
 <td className="py-2.5 px-3 text-slate-700">{l.purpose}</td>
 <td className="py-2.5 px-3 text-slate-600">{l.recordedBy}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {/* SUBTAB 3: MASTER KATEGORI */}
 {activeSubTab === 'categories' && (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <p className="text-xs text-slate-500">Kelola kelompok bahan pangan dan gizi seimbang siswa</p>
 {userRole === 'SUPERADMIN' && (
 <button
 type="button"
 onClick={() => setShowCategoryModal(true)}
 className="inline-flex items-center gap-1 rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
 >
 <Plus className="h-3.5 w-3.5" />
 Tambah Kategori
 </button>
 )}
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
 {categories.map((cat) => (
 <div key={cat.id} className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm space-y-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
 <h3 className="font-bold text-sm text-slate-900">{cat.name}</h3>
 </div>
 <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
 {cat.code}
 </span>
 </div>
 <p className="text-xs text-slate-500">{cat.description}</p>
 <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] font-mono text-slate-500">
 <span>Terdaftar: {ingredients.filter((i) => i.category === cat.name).length} Bahan</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* SUBTAB 4: MASTER SATUAN */}
 {activeSubTab === 'units' && (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <p className="text-xs text-slate-500">Kelola standar satuan ukur logistik (Kg, Pack, Karung, Botol, dll)</p>
 {userRole === 'SUPERADMIN' && (
 <button
 type="button"
 onClick={() => setShowUnitModal(true)}
 className="inline-flex items-center gap-1 rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
 >
 <Plus className="h-3.5 w-3.5" />
 Tambah Satuan Ukur
 </button>
 )}
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {units.map((u) => (
 <div key={u.id} className="p-3 rounded-lg border border-slate-200 bg-white shadow-sm text-center">
 <div className="text-2xl font-bold font-mono text-slate-900">{u.symbol}</div>
 <div className="text-xs text-slate-600 font-medium mt-1">{u.name}</div>
 <span className="inline-block mt-2 text-[10px] font-mono rounded bg-slate-100 px-1.5 py-0.2 text-slate-500">
 {u.type}
 </span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* MODAL: ADD / EDIT INGREDIENT */}
 {showAddIngredientModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
 <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
 <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
 <h3 className="font-bold text-sm text-slate-900">
 {editingIngredient ? 'Edit Master Bahan Dapur' : 'Tambah Master Bahan Baru'}
 </h3>
 <button onClick={() => setShowAddIngredientModal(false)}><X className="h-4 w-4 text-slate-400" /></button>
 </div>
 <form onSubmit={handleSaveIngredient} className="p-5 space-y-3 text-xs">
 <div>
 <label className="font-semibold text-slate-700">Nama Bahan Makanan:</label>
 <input
 type="text"
 required
 value={ingName}
 onChange={(e) => setIngName(e.target.value)}
 placeholder="Contoh: Daging sapi giling / Wortel brastagi"
 className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5"
 />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="font-semibold text-slate-700">Kategori Gizi:</label>
 <select
 value={ingCategory}
 onChange={(e) => setIngCategory(e.target.value)}
 className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
 >
 {categories.map((c) => (
 <option key={c.id} value={c.name}>{c.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="font-semibold text-slate-700">Satuan Ukur Standar:</label>
 <select
 value={ingUnit}
 onChange={(e) => setIngUnit(e.target.value)}
 className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
 >
 {units.map((u) => (
 <option key={u.id} value={u.symbol}>{u.symbol} - {u.name}</option>
 ))}
 </select>
 </div>
 </div>
 <div className="grid grid-cols-3 gap-3">
 <div>
 <label className="font-semibold text-slate-700">Stok Awal:</label>
 <input
 type="number"
 min={0}
 step="any"
 value={ingStock}
 onChange={(e) => setIngStock(Number(e.target.value))}
 className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 font-mono"
 />
 </div>
 <div>
 <label className="font-semibold text-slate-700">Batas Alert Min:</label>
 <input
 type="number"
 min={1}
 value={ingMinAlert}
 onChange={(e) => setIngMinAlert(Number(e.target.value))}
 className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 font-mono"
 />
 </div>
 <div>
 <label className="font-semibold text-slate-700">Harga Satuan (Rp):</label>
 <input
 type="number"
 min={0}
 step={500}
 value={ingPrice}
 onChange={(e) => setIngPrice(Number(e.target.value))}
 className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 font-mono"
 />
 </div>
 </div>
 <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
 <button
 type="button"
 onClick={() => setShowAddIngredientModal(false)}
 className="rounded px-3 py-1.5 border border-slate-300 text-slate-600"
 >
 Batal
 </button>
 <button
 type="submit"
 className="rounded bg-slate-900 text-white px-4 py-1.5 font-semibold"
 >
 Simpan Master Bahan
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* MODAL: RECORD STOCK MUTATION */}
 {showMutationModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
 <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
 <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
 <h3 className="font-bold text-sm text-slate-900">
 Pencatatan Mutasi Keluar/Masuk Dapur SPPG
 </h3>
 <button onClick={() => setShowMutationModal(false)}><X className="h-4 w-4 text-slate-400" /></button>
 </div>
 <form onSubmit={handleRecordMutation} className="p-5 space-y-3 text-xs">
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="font-semibold text-slate-700">Jenis Mutasi:</label>
 <select
 value={mutationType}
 onChange={(e) => setMutationType(e.target.value as StockMutationType)}
 className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 font-semibold"
 >
 <option value="KELUAR">KELUAR (Masak / Distribusi Menu Siswa)</option>
 <option value="MASUK">MASUK (Penerimaan Belanja Supplier)</option>
 </select>
 </div>
 <div>
 <label className="font-semibold text-slate-700">Dapur SPPG:</label>
 <select
 value={mutationSppgUnit}
 onChange={(e) => setMutationSppgUnit(e.target.value as SppgUnitId)}
 className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
 >
 {sppgUnits.map((u) => (
 <option key={u.id} value={u.id}>{u.name}</option>
 ))}
 </select>
 </div>
 </div>
 <div className="grid grid-cols-3 gap-3">
 <div className="col-span-2">
 <label className="font-semibold text-slate-700">Pilih Bahan Dapur:</label>
 <select
 value={mutationIngId}
 onChange={(e) => setMutationIngId(e.target.value)}
 className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
 >
 {ingredients.map((i) => (
 <option key={i.id} value={i.id}>
 {i.name} (Sisa Stok: {i.currentStock} {i.defaultUnit})
 </option>
 ))}
 </select>
 </div>
 <div>
 <label className="font-semibold text-slate-700">Kuantitas:</label>
 <input
 type="number"
 min={0.1}
 step="any"
 required
 value={mutationQty}
 onChange={(e) => setMutationQty(Number(e.target.value))}
 className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 font-mono"
 />
 </div>
 </div>
 <div>
 <label className="font-semibold text-slate-700">Nomor Referensi (Nota / Menu):</label>
 <input
 type="text"
 required
 value={mutationRef}
 onChange={(e) => setMutationRef(e.target.value)}
 className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-mono"
 />
 </div>
 <div>
 <label className="font-semibold text-slate-700">Keperluan Penggunaan:</label>
 <input
 type="text"
 required
 value={mutationPurpose}
 onChange={(e) => setMutationPurpose(e.target.value)}
 className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5"
 />
 </div>
 <div>
 <label className="font-semibold text-slate-700">Petugas Dapur Pelaksana:</label>
 <input
 type="text"
 required
 value={mutationOfficer}
 onChange={(e) => setMutationOfficer(e.target.value)}
 className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5"
 />
 </div>
 <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
 <button
 type="button"
 onClick={() => setShowMutationModal(false)}
 className="rounded px-3 py-1.5 border border-slate-300 text-slate-600"
 >
 Batal
 </button>
 <button
 type="submit"
 className="rounded bg-blue-600 text-white px-4 py-1.5 font-semibold"
 >
 Simpan Catatan Mutasi
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* MODAL: ADD CATEGORY */}
 {showCategoryModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
 <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-3 text-xs">
 <h3 className="font-bold text-sm text-slate-900">Tambah Kategori Bahan</h3>
 <form onSubmit={handleSaveCategory} className="space-y-3">
 <div>
 <label className="font-medium text-slate-700">Nama Kategori:</label>
 <input
 type="text"
 required
 value={newCatName}
 onChange={(e) => setNewCatName(e.target.value)}
 placeholder="e.g. Minuman & Susu"
 className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5"
 />
 </div>
 <div>
 <label className="font-medium text-slate-700">Kode Singkat:</label>
 <input
 type="text"
 value={newCatCode}
 onChange={(e) => setNewCatCode(e.target.value)}
 placeholder="e.g. SUSU"
 className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-mono"
 />
 </div>
 <div className="flex justify-end gap-2 pt-2">
 <button type="button" onClick={() => setShowCategoryModal(false)} className="rounded px-3 py-1 border border-slate-300">Batal</button>
 <button type="submit" className="rounded bg-slate-900 text-white px-3 py-1 font-semibold">Simpan</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* MODAL: ADD UNIT */}
 {showUnitModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
 <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-3 text-xs">
 <h3 className="font-bold text-sm text-slate-900">Tambah Satuan Ukur Baru</h3>
 <form onSubmit={handleSaveUnit} className="space-y-3">
 <div>
 <label className="font-medium text-slate-700">Simbol Satuan:</label>
 <input
 type="text"
 required
 value={newUnitSymbol}
 onChange={(e) => setNewUnitSymbol(e.target.value)}
 placeholder="e.g. Kaleng / Dus"
 className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-mono"
 />
 </div>
 <div>
 <label className="font-medium text-slate-700">Nama Lengkap Satuan:</label>
 <input
 type="text"
 value={newUnitName}
 onChange={(e) => setNewUnitName(e.target.value)}
 placeholder="e.g. Kaleng Logam Standar"
 className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5"
 />
 </div>
 <div className="flex justify-end gap-2 pt-2">
 <button type="button" onClick={() => setShowUnitModal(false)} className="rounded px-3 py-1 border border-slate-300">Batal</button>
 <button type="submit" className="rounded bg-slate-900 text-white px-3 py-1 font-semibold">Simpan</button>
 </div>
 </form>
 </div>
 </div>
 )}
  {/* Modern Confirm Delete Modal */}
  <ConfirmDeleteModal
    isOpen={!!deleteTargetIngredient}
    title="Hapus Bahan dari Gudang Dapur"
    description="Apakah Anda yakin ingin menghapus data bahan ini dari inventaris dapur?"
    itemName={deleteTargetIngredient ? `${deleteTargetIngredient.name} (${deleteTargetIngredient.category})` : undefined}
    warningNote="Data bahan makanan akan dihapus dari daftar master inventaris dapur."
    confirmText="Ya, Hapus Bahan"
    onConfirm={() => {
      if (deleteTargetIngredient) {
        deleteIngredient(deleteTargetIngredient.id);
        setDeleteTargetIngredient(null);
      }
    }}
    onClose={() => setDeleteTargetIngredient(null)}
  />
 </div>
 );
}
