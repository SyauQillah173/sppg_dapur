'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { formatRupiah, formatNumber } from '@/lib/utils';
import { UserRole } from '@/lib/types';
import {
  Settings,
  Building2,
  Tags,
  Apple,
  Store,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Search,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  UserPlus,
  Sparkles,
  Calculator,
  Share2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';

export function MasterDataCMS() {
  const {
    sppgUnits,
    addSppgUnit,
    updateSppgUnit,
    deleteSppgUnit,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    units,
    addUnit,
    deleteUnit,
    ingredients,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    adminUsers,
    addAdminUser,
    updateAdminUser,
    deleteAdminUser,
    isReadOnly,
    userRole,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'sppg' | 'categories_units' | 'ingredients' | 'suppliers' | 'employees' | 'admins'
  >('sppg');

  const [searchQuery, setSearchQuery] = useState('');

  // 1. Modals state
  const [modalType, setModalType] = useState<string | null>(null);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Form states for SPPG
  const [sppgForm, setSppgForm] = useState({
    id: '',
    name: '',
    shortName: '',
    code: '',
    location: '',
    picName: '',
    phone: '',
    activeBudget: '0',
  });

  // Form states for Category
  const [catForm, setCatForm] = useState({ id: '', name: '', code: '', description: '', color: '#0284c7' });

  // Form states for Unit
  const [unitForm, setUnitForm] = useState({ symbol: '', name: '', type: 'BERAT' as const });

  // Form states for Ingredient
  const [ingForm, setIngForm] = useState<{
    id: string;
    name: string;
    category: string;
    categoryId: string;
    defaultUnit: string;
    currentStock: string;
    minStockAlert: string;
    lastPurchasePrice: string;
    sppgDistribution: Record<string, number>;
  }>({
    id: '',
    name: '',
    category: 'Protein Hewani',
    categoryId: 'CAT-01',
    defaultUnit: 'Kg',
    currentStock: '0',
    minStockAlert: '5',
    lastPurchasePrice: '0',
    sppgDistribution: {},
  });

  // Form states for Supplier
  const [supForm, setSupForm] = useState({
    id: '',
    name: '',
    picName: '',
    phone: '',
    address: '',
    bankAccount: '',
    suppliedCategory: 'Protein Hewani, Sayuran',
  });

  // Form states for Employee
  const [empForm, setEmpForm] = useState<{
    id: string;
    name: string;
    roleTitle: string;
    sppgUnitId: string;
    phone: string;
    status: 'ACTIVE' | 'FLAGGED' | 'ON_LEAVE';
  }>({
    id: '',
    name: '',
    roleTitle: 'Koordinator Pengadaan & Dapur',
    sppgUnitId: sppgUnits[0]?.id || 'SPPG-AA02',
    phone: '',
    status: 'ACTIVE',
  });

  // Form states for Admin User
  const [adminForm, setAdminForm] = useState<{
    id: string;
    username: string;
    password: string;
    name: string;
    role: UserRole;
  }>({
    id: '',
    username: '',
    password: '',
    name: '',
    role: 'EXECUTIVE_AUDITOR',
  });

  // Sebaran helpers for Ingredient Form
  const totalIngDistribution = useMemo(() => {
    return Object.values(ingForm.sppgDistribution || {}).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }, [ingForm.sppgDistribution]);

  const handleIngDistributionChange = (unitId: string, val: number) => {
    setIngForm((prev) => ({
      ...prev,
      sppgDistribution: {
        ...(prev.sppgDistribution || {}),
        [unitId]: Math.max(0, val),
      },
    }));
  };

  const handleIngDistributeEvenly = () => {
    if (sppgUnits.length === 0) return;
    const total = Number(ingForm.currentStock) || 0;
    const perUnit = Math.floor((total / sppgUnits.length) * 100) / 100;
    const newDist: Record<string, number> = {};
    sppgUnits.forEach((u, idx) => {
      if (idx === sppgUnits.length - 1) {
        const currentSum = Object.values(newDist).reduce((a, b) => a + b, 0);
        newDist[u.id] = Math.max(0, Math.round((total - currentSum) * 100) / 100);
      } else {
        newDist[u.id] = perUnit;
      }
    });
    setIngForm((prev) => ({ ...prev, sppgDistribution: newDist }));
  };

  const handleIngCalcTotalFromDistribution = () => {
    setIngForm((prev) => ({ ...prev, currentStock: String(totalIngDistribution) }));
  };

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    itemName: string;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    itemName: '',
    onConfirm: () => {},
  });
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Handlers
  const handleSaveSppg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    try {
      if (sppgForm.id) {
        updateSppgUnit(sppgForm.id, {
          name: sppgForm.name,
          shortName: sppgForm.shortName,
          location: sppgForm.location,
          picName: sppgForm.picName,
          phone: sppgForm.phone,
          activeBudget: Number(sppgForm.activeBudget) || 0,
        });
        showFeedback('Unit SPPG berhasil diperbarui!');
      } else {
        addSppgUnit({
          code: sppgForm.code || `SPPG-${(sppgUnits.length + 1).toString().padStart(2, '0')}`,
          name: sppgForm.name,
          shortName: sppgForm.shortName,
          location: sppgForm.location,
          picName: sppgForm.picName,
          phone: sppgForm.phone,
          activeBudget: Number(sppgForm.activeBudget) || 0,
        });
        showFeedback('Unit SPPG baru berhasil ditambahkan!');
      }
      setModalType(null);
    } catch (err: any) {
      showFeedback(err.message || 'Gagal menyimpan unit SPPG', 'error');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (catForm.id) {
      const res = await updateCategory(catForm.id, {
        name: catForm.name,
        code: catForm.code,
        color: catForm.color,
        description: catForm.description,
      });
      if (res.ok) {
        showFeedback('Kategori nutrisi berhasil diperbarui!');
      }
    } else {
      const res = await addCategory({
        name: catForm.name,
        code: catForm.code || `CAT-${(categories.length + 1).toString().padStart(2, '0')}`,
        color: catForm.color,
        description: catForm.description || 'Kategori nutrisi gizi SPPG',
      });
      if (res.ok) {
        showFeedback('Kategori bahan baru berhasil ditambahkan!');
      }
    }
    setModalType(null);
  };

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    addUnit({
      symbol: unitForm.symbol,
      name: unitForm.name,
      type: 'WEIGHT',
    });
    showFeedback('Satuan ukur baru berhasil ditambahkan!');
    setModalType(null);
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (ingForm.id) {
      const res = await updateIngredient(ingForm.id, {
        name: ingForm.name,
        category: ingForm.category,
        defaultUnit: ingForm.defaultUnit,
        currentStock: Number(ingForm.currentStock) || 0,
        minStockAlert: Number(ingForm.minStockAlert) || 5,
        lastPurchasePrice: Number(ingForm.lastPurchasePrice) || 0,
        sppgDistribution: ingForm.sppgDistribution,
      });
      if (res.ok) {
        showFeedback('Data bahan makanan & sebaran stok berhasil diperbarui!');
      }
    } else {
      const res = await addIngredient({
        name: ingForm.name,
        category: ingForm.category,
        categoryId: ingForm.categoryId,
        defaultUnit: ingForm.defaultUnit,
        currentStock: Number(ingForm.currentStock) || 0,
        minStockAlert: Number(ingForm.minStockAlert) || 5,
        lastPurchasePrice: Number(ingForm.lastPurchasePrice) || 0,
        sppgDistribution: ingForm.sppgDistribution,
      });
      if (res.ok) {
        showFeedback('Bahan makanan baru berhasil didaftarkan ke CMS!');
      }
    }
    setModalType(null);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (supForm.id) {
      const res = await updateSupplier(supForm.id, {
        name: supForm.name,
        picName: supForm.picName,
        phone: supForm.phone,
        address: supForm.address,
        bankAccount: supForm.bankAccount,
        suppliedCategory: supForm.suppliedCategory,
      });
      if (res.ok) {
        showFeedback('Data CV / Supplier berhasil diperbarui!');
      }
    } else {
      const res = await addSupplier({
        name: supForm.name,
        picName: supForm.picName,
        phone: supForm.phone,
        address: supForm.address,
        bankAccount: supForm.bankAccount,
        suppliedCategory: supForm.suppliedCategory,
        activeStatus: true,
        rating: 5.0,
      });
      if (res.ok) {
        showFeedback('Data CV / Supplier baru berhasil ditambahkan!');
      }
    }
    setModalType(null);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (empForm.id) {
      const targetUnit = sppgUnits.find((u) => u.id === empForm.sppgUnitId);
      const res = await updateEmployee(empForm.id, {
        name: empForm.name,
        roleTitle: empForm.roleTitle,
        sppgUnitId: empForm.sppgUnitId as any,
        sppgUnitName: targetUnit?.shortName || targetUnit?.name || 'SPPG Unit',
        phone: empForm.phone,
        status: empForm.status,
      });
      if (res.ok) {
        showFeedback('Data karyawan peminta belanja berhasil diperbarui!');
      }
    } else {
      const targetUnit = sppgUnits.find((u) => u.id === empForm.sppgUnitId);
      const res = await addEmployee({
        name: empForm.name,
        roleTitle: empForm.roleTitle,
        sppgUnitId: empForm.sppgUnitId as any,
        sppgUnitName: targetUnit?.shortName || targetUnit?.name || 'SPPG Unit',
        phone: empForm.phone,
        complianceScore: 100,
        status: empForm.status,
      });
      if (res.ok) {
        showFeedback('Karyawan peminta belanja baru berhasil ditambahkan!');
      }
    }
    setModalType(null);
  };

  const handleSaveAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    try {
      if (adminForm.id) {
        const updatePayload: any = {
          username: adminForm.username,
          name: adminForm.name,
          role: adminForm.role,
        };
        if (adminForm.password && adminForm.password.trim().length > 0) {
          updatePayload.password = adminForm.password;
        }
        const res = await updateAdminUser(adminForm.id, updatePayload);
        if (!res.ok) throw new Error(res.error || 'Gagal memperbarui akun admin');
        showFeedback(`Akun admin "${adminForm.username}" berhasil diperbarui!`);
      } else {
        const res = await fetch('/api/admin-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(adminForm),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Gagal membuat akun admin');
        }
        addAdminUser({
          id: data.data?.id,
          username: data.data?.username ?? adminForm.username,
          name: data.data?.name ?? adminForm.name,
          role: data.data?.role ?? adminForm.role,
        });
        showFeedback(`Akun login admin "${adminForm.username}" berhasil dibuat!`);
      }
      setModalType(null);
      setAdminForm({ id: '', username: '', password: '', name: '', role: 'EXECUTIVE_AUDITOR' });
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleDeleteAdmin = (id: string, username: string) => {
    if (isReadOnly) return;
    setDeleteDialog({
      isOpen: true,
      title: 'Hapus Akun Akses Admin',
      description: 'Apakah Anda yakin ingin menghapus akun akses ini?',
      itemName: `Akun Admin: ${username}`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin-users/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Gagal menghapus admin');
          }
          deleteAdminUser(id);
          showFeedback(`Akun admin "${username}" berhasil dihapus!`);
        } catch (err: any) {
          showFeedback(err.message, 'error');
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* CMS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Master Data & Kontrol Penuh CMS
            </h1>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
              100% Dynamic Database
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pusat konfigurasi tanpa kodingan: kelola lokasi SPPG, bahan makanan, kategori, satuan, supplier, karyawan, dan akun login admin.
          </p>
        </div>

        {isReadOnly && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800">
            <Lock className="h-3.5 w-3.5 text-amber-600" />
            <span>Mode Pemantau: Pengaturan CMS Terkunci (Read-Only)</span>
          </div>
        )}
      </div>

      {feedbackMsg && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-xs ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span className="font-medium">{feedbackMsg.text}</span>
        </div>
      )}

      {/* 6 Dynamic CMS Tabs */}
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('sppg')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
            activeTab === 'sppg'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>1. Unit SPPG ({sppgUnits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories_units')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
            activeTab === 'categories_units'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Tags className="h-3.5 w-3.5" />
          <span>2. Kategori & Satuan ({categories.length} / {units.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ingredients')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
            activeTab === 'ingredients'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Apple className="h-3.5 w-3.5" />
          <span>3. Master Bahan ({ingredients.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
            activeTab === 'suppliers'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Store className="h-3.5 w-3.5" />
          <span>4. Data CV / Supplier ({suppliers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
            activeTab === 'employees'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>5. Karyawan Peminta ({employees.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('admins')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
            activeTab === 'admins'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" />
          <span>6. Kelola Akun Admin ({adminUsers.length})</span>
        </button>
      </div>

      {/* TAB 1: UNIT SPPG */}
      {activeTab === 'sppg' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Daftar Lokasi & Sentra Unit SPPG</h2>
              <p className="text-xs text-slate-500">
                Kelola unit dapur, nama sentra, penanggung jawab (PIC), dan pagu kas operasional.
              </p>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => {
                  setSppgForm({
                    id: '',
                    name: '',
                    shortName: '',
                    code: `SPPG-0${sppgUnits.length + 1}`,
                    location: 'Gresik, Jawa Timur',
                    picName: '',
                    phone: '',
                    activeBudget: '0',
                  });
                  setModalType('sppg');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Tambah Unit SPPG</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sppgUnits.map((u, idx) => (
              <div key={u.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Unit #{idx + 1} &bull; {u.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{u.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{u.location}</p>
                  </div>
                  {!isReadOnly && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSppgForm({
                            id: u.id,
                            name: u.name,
                            shortName: u.shortName,
                            code: u.code,
                            location: u.location,
                            picName: u.picName,
                            phone: u.phone,
                            activeBudget: u.activeBudget.toString(),
                          });
                          setModalType('sppg');
                        }}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                        title="Edit SPPG"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteDialog({
                            isOpen: true,
                            title: 'Hapus Unit SPPG',
                            description: 'Apakah Anda yakin ingin menghapus unit pelayanan ini?',
                            itemName: `Unit: ${u.name} (${u.code})`,
                            onConfirm: () => {
                              deleteSppgUnit(u.id);
                              showFeedback('Unit SPPG dihapus!');
                            },
                          });
                        }}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Hapus SPPG"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Koordinator (PIC):</span>
                    <span className="font-semibold text-slate-800">{u.picName || '-'}</span>
                    <span className="text-slate-500 block text-[11px] font-mono">{u.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Pagu Kas Aktif:</span>
                    <span className="font-bold font-mono text-slate-900 tabular-nums">
                      {formatRupiah(u.activeBudget)}
                    </span>
                    <span className="text-[11px] text-emerald-600 block">
                      Terpakai: {formatRupiah(u.totalRealized)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: KATEGORI & SATUAN */}
      {activeTab === 'categories_units' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Categories Sub-Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Kategori Nutrisi Bahan</h3>
                <p className="text-xs text-slate-500">Protein Hewani, Nabati, Sayuran, dll.</p>
              </div>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setCatForm({ id: '', name: '', code: '', description: '', color: '#0284c7' });
                    setModalType('category');
                  }}
                  className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  + Kategori
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {categories.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <div>
                      <span className="font-bold text-slate-800">{c.name}</span>
                      <span className="text-[11px] text-slate-400 ml-2 font-mono">{c.code}</span>
                      <p className="text-[11px] text-slate-500">{c.description}</p>
                    </div>
                  </div>
                  {!isReadOnly && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCatForm({
                            id: c.id,
                            name: c.name,
                            code: c.code,
                            description: c.description || '',
                            color: c.color || '#0284c7',
                          });
                          setModalType('category');
                        }}
                        className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100"
                        title="Edit Kategori"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteDialog({
                            isOpen: true,
                            title: 'Hapus Kategori Bahan',
                            description: 'Apakah Anda yakin ingin menghapus kategori bahan ini?',
                            itemName: `Kategori: ${c.name}`,
                            onConfirm: () => {
                              deleteCategory(c.id);
                              showFeedback('Kategori dihapus!');
                            },
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Master Units Sub-Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Satuan Ukur & Kemasan</h3>
                <p className="text-xs text-slate-500">Kg, Pack, Karung, Botol, Renteng, dll.</p>
              </div>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setUnitForm({ symbol: '', name: '', type: 'BERAT' });
                    setModalType('unit');
                  }}
                  className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  + Satuan
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {units.map((u) => (
                <div
                  key={u.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-900 text-sm block">
                      {u.symbol}
                    </span>
                    <span className="text-[11px] text-slate-500">{u.name}</span>
                  </div>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteDialog({
                          isOpen: true,
                          title: 'Hapus Satuan Pengukuran',
                          description: 'Apakah Anda yakin ingin menghapus satuan ini?',
                          itemName: `Satuan: ${u.symbol} (${u.name})`,
                          onConfirm: () => {
                            deleteUnit(u.id);
                            showFeedback('Satuan dihapus!');
                          },
                        });
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER BAHAN MAKANAN */}
      {activeTab === 'ingredients' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Katalog Bahan Makanan & Standar Harga (20 Bahan Klien + Baru)
              </h2>
              <p className="text-xs text-slate-500">
                Daftar bahan makanan dapur, kategori gizi, satuan standar, dan patokan harga pasar.
              </p>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => {
                  setIngForm({
                    id: '',
                    name: '',
                    category: 'Protein Hewani',
                    categoryId: categories[0]?.id || 'CAT-01',
                    defaultUnit: 'Kg',
                    currentStock: '0',
                    minStockAlert: '5',
                    lastPurchasePrice: '25000',
                    sppgDistribution: {},
                  });
                  setModalType('ingredient');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Tambah Bahan Baru</span>
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Kode</th>
                    <th className="py-3 px-4">Nama Bahan</th>
                    <th className="py-3 px-4">Kategori Nutrisi</th>
                    <th className="py-3 px-4">Satuan</th>
                    <th className="py-3 px-4 text-right">Patokan Harga</th>
                    <th className="py-3 px-4 text-right">Stok Gudang</th>
                    {!isReadOnly && <th className="py-3 px-4 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ingredients.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-600">{item.code}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{item.name}</td>
                      <td className="py-2.5 px-4">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-700">{item.defaultUnit}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800 tabular-nums">
                        {formatRupiah(item.lastPurchasePrice)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-700 tabular-nums">
                        {formatNumber(item.currentStock)} {item.defaultUnit}
                      </td>
                      {!isReadOnly && (
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIngForm({
                                  id: item.id,
                                  name: item.name,
                                  category: item.category,
                                  categoryId: item.categoryId || 'CAT-01',
                                  defaultUnit: item.defaultUnit,
                                  currentStock: item.currentStock.toString(),
                                  minStockAlert: item.minStockAlert.toString(),
                                  lastPurchasePrice: item.lastPurchasePrice.toString(),
                                  sppgDistribution: item.sppgDistribution || {},
                                });
                                setModalType('ingredient');
                              }}
                              className="p-1 rounded text-slate-400 hover:text-slate-800"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteDialog({
                                  isOpen: true,
                                  title: 'Hapus Master Bahan Makanan',
                                  description: 'Apakah Anda yakin ingin menghapus bahan ini dari katalog CMS?',
                                  itemName: `${item.name} (${item.category})`,
                                  onConfirm: () => {
                                    deleteIngredient(item.id);
                                    showFeedback('Bahan makanan dihapus!');
                                  },
                                });
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATA CV / SUPPLIER */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Daftar Rekanan CV & Toko Supplier Dapur</h2>
              <p className="text-xs text-slate-500">
                Penyedia bahan makanan resmi yang menerbitkan nota pembelanjaan dapur SPPG.
              </p>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => {
                  setSupForm({
                    id: '',
                    name: '',
                    picName: '',
                    phone: '',
                    address: '',
                    bankAccount: '',
                    suppliedCategory: 'Protein Hewani, Sembako & Tepung',
                  });
                  setModalType('supplier');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Tambah CV / Supplier</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map((sup) => (
              <div key={sup.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                      {sup.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{sup.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{sup.address}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Aktif
                    </span>
                    {!isReadOnly && (
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSupForm({
                              id: sup.id,
                              name: sup.name,
                              picName: sup.picName,
                              phone: sup.phone,
                              address: sup.address,
                              bankAccount: sup.bankAccount,
                              suppliedCategory: sup.suppliedCategory,
                            });
                            setModalType('supplier');
                          }}
                          title="Edit CV / Supplier"
                          className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteDialog({
                              isOpen: true,
                              title: 'Hapus Rekanan CV / Toko Supplier',
                              description: 'Apakah Anda yakin ingin menghapus rekanan CV ini dari sistem?',
                              itemName: `${sup.name} (${sup.picName})`,
                              onConfirm: async () => {
                                const res = await deleteSupplier(sup.id);
                                if (res.ok) {
                                  showFeedback('Rekanan CV berhasil dihapus!');
                                } else {
                                  showFeedback(res.error || 'Gagal menghapus rekanan CV', 'error');
                                }
                              },
                            });
                          }}
                          title="Hapus CV / Supplier"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Kontak / PIC:</span>
                    <span className="font-semibold text-slate-800">{sup.picName}</span>
                    <span className="text-slate-500 text-[11px] font-mono block">{sup.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Rekening Bank:</span>
                    <span className="font-mono text-slate-800 font-medium">{sup.bankAccount}</span>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-500">
                  <span className="text-[11px] text-slate-400 block">Kategori Pasokan:</span>
                  <span className="font-medium text-slate-700">{sup.suppliedCategory}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: KARYAWAN & PEMINTA BELANJA */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Daftar Karyawan & Peminta Belanja</h2>
              <p className="text-xs text-slate-500">
                Staf dapur yang meminta kasbon belanja dan bertanggung jawab menyerahkan nota fisik.
              </p>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => {
                  setEmpForm({
                    id: '',
                    name: '',
                    roleTitle: 'Koordinator Pengadaan & Logistik Dapur',
                    sppgUnitId: sppgUnits[0]?.id || 'SPPG-AA02',
                    phone: '',
                    status: 'ACTIVE',
                  });
                  setModalType('employee');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Tambah Karyawan</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employees.map((emp) => (
              <div key={emp.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {emp.employeeNumber}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{emp.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{emp.roleTitle}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                      {emp.sppgUnitName}
                    </span>
                    {!isReadOnly && (
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEmpForm({
                              id: emp.id,
                              name: emp.name,
                              roleTitle: emp.roleTitle,
                              sppgUnitId: emp.sppgUnitId,
                              phone: emp.phone || '',
                              status: emp.status as any,
                            });
                            setModalType('employee');
                          }}
                          title="Edit Karyawan"
                          className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteDialog({
                              isOpen: true,
                              title: 'Hapus Data Karyawan Peminta Belanja',
                              description: 'Apakah Anda yakin ingin menghapus karyawan ini?',
                              itemName: `${emp.name} (${emp.roleTitle})`,
                              onConfirm: async () => {
                                const res = await deleteEmployee(emp.id);
                                if (res.ok) {
                                  showFeedback('Data karyawan berhasil dihapus!');
                                } else {
                                  showFeedback(res.error || 'Gagal menghapus karyawan', 'error');
                                }
                              },
                            });
                          }}
                          title="Hapus Karyawan"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[11px] block">No. Telepon:</span>
                    <span className="font-mono text-slate-800">{emp.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Skor Tertib Nota:</span>
                    <span className="font-bold text-emerald-600 font-mono">
                      {emp.complianceScore}% Tertib
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: KELOLA AKUN ADMIN */}
      {activeTab === 'admins' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Pusat Kelola Akun Login Admin (Private Security)
              </h2>
              <p className="text-xs text-slate-500">
                Superadmin dapat membuatkan username & password baru untuk staf pengelola atau auditor. Sistem tertutup dari pendaftaran publik.
              </p>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => {
                  setAdminForm({
                    id: '',
                    username: '',
                    password: '',
                    name: '',
                    role: 'EXECUTIVE_AUDITOR',
                  });
                  setModalType('admin_user');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Buat Akun Admin Baru</span>
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Username Login</th>
                    <th className="py-3 px-4">Hak Akses (Role)</th>
                    <th className="py-3 px-4">Kewenangan Sistem</th>
                    <th className="py-3 px-4">Tanggal Dibuat</th>
                    {!isReadOnly && <th className="py-3 px-4 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{user.name}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        @{user.username}
                      </td>
                      <td className="py-3 px-4">
                        {user.role === 'SUPERADMIN' ? (
                          <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200">
                            Superadmin
                          </span>
                        ) : user.role === 'DISTRIBUTION_DRIVER' ? (
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                            Kurir / Pengantaran
                          </span>
                        ) : (
                          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                            Admin 2 (Pemantau)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {user.role === 'SUPERADMIN' ? (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            Full Control (Input, Edit, Hapus, Kelola Akun & CMS)
                          </span>
                        ) : user.role === 'DISTRIBUTION_DRIVER' ? (
                          <span className="text-[11px] text-emerald-700 font-medium">
                            Distribusi Khusus (Rute Sekolah, Status OTW, Sahkan BAST HP & Tanda Tangan)
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-medium">
                            Audit Only (Lihat Dashboard, Cek Nota, Filter SPPG)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      {!isReadOnly && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setAdminForm({
                                  id: user.id,
                                  username: user.username,
                                  name: user.name,
                                  role: user.role,
                                  password: '',
                                });
                                setModalType('admin_user');
                              }}
                              title="Edit Username & Password"
                              className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            {user.username !== 'superadmin' ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteAdmin(user.id, user.username)}
                                title="Hapus Akun"
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTAINER */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
            {/* Modal: SPPG */}
            {modalType === 'sppg' && (
              <form onSubmit={handleSaveSppg}>
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-900">
                    {sppgForm.id ? 'Edit Unit SPPG' : 'Tambah Unit SPPG Baru'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="text-slate-400 hover:text-slate-600 text-lg"
                  >
                    &times;
                  </button>
                </div>
                <div className="p-6 space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Nama Lengkap SPPG
                    </label>
                    <input
                      type="text"
                      required
                      value={sppgForm.name}
                      onChange={(e) => setSppgForm({ ...sppgForm, name: e.target.value })}
                      placeholder="Misal: SPPG ABAR ABIR 02"
                      className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Nama Singkat
                    </label>
                    <input
                      type="text"
                      required
                      value={sppgForm.shortName}
                      onChange={(e) => setSppgForm({ ...sppgForm, shortName: e.target.value })}
                      placeholder="Misal: Abar Abir 02"
                      className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Lokasi / Alamat Dapur
                    </label>
                    <input
                      type="text"
                      value={sppgForm.location}
                      onChange={(e) => setSppgForm({ ...sppgForm, location: e.target.value })}
                      placeholder="Gresik, Jawa Timur"
                      className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">
                        Nama PIC / Koordinator
                      </label>
                      <input
                        type="text"
                        value={sppgForm.picName}
                        onChange={(e) => setSppgForm({ ...sppgForm, picName: e.target.value })}
                        placeholder="Nama penanggung jawab"
                        className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">
                        No. HP / WA
                      </label>
                      <input
                        type="text"
                        value={sppgForm.phone}
                        onChange={(e) => setSppgForm({ ...sppgForm, phone: e.target.value })}
                        placeholder="0812-xxxx-xxxx"
                        className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                      />
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 p-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 border rounded text-xs font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold"
                  >
                    Simpan Unit
                  </button>
                </div>
              </form>
            )}

            {/* Modal: Category */}
            {modalType === 'category' && (
              <form onSubmit={handleSaveCategory}>
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-900">Tambah Kategori Bahan Makanan</h3>
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="text-slate-400 hover:text-slate-600 text-lg"
                  >
                    &times;
                  </button>
                </div>
                <div className="p-6 space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Nama Kategori
                    </label>
                    <input
                      type="text"
                      required
                      value={catForm.name}
                      onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                      placeholder="Misal: Protein Hewani, Bumbu & Rempah"
                      className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Keterangan Nutrisi
                    </label>
                    <input
                      type="text"
                      value={catForm.description}
                      onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                      placeholder="Kategori asupan gizi makro/mikro"
                      className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                    />
                  </div>
                </div>
                <div className="border-t border-slate-100 p-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 border rounded text-xs font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold"
                  >
                    Simpan Kategori
                  </button>
                </div>
              </form>
            )}

            {/* Modal: Unit */}
            {modalType === 'unit' && (
              <form onSubmit={handleSaveUnit}>
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-900">Tambah Satuan Ukur Baru</h3>
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="text-slate-400 hover:text-slate-600 text-lg"
                  >
                    &times;
                  </button>
                </div>
                <div className="p-6 space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Simbol Satuan
                    </label>
                    <input
                      type="text"
                      required
                      value={unitForm.symbol}
                      onChange={(e) => setUnitForm({ ...unitForm, symbol: e.target.value })}
                      placeholder="Misal: Kg, Pack, Karung, Botol, Renteng"
                      className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Nama Panjang Satuan
                    </label>
                    <input
                      type="text"
                      required
                      value={unitForm.name}
                      onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                      placeholder="Misal: Kilogram, Pack Plastik, Botol Kaca"
                      className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                    />
                  </div>
                </div>
                <div className="border-t border-slate-100 p-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 border rounded text-xs font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold"
                  >
                    Simpan Satuan
                  </button>
                </div>
              </form>
            )}

            {/* Modal: Ingredient */}
            {modalType === 'ingredient' && (
              <form onSubmit={handleSaveIngredient}>
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-900">
                    {ingForm.id ? 'Edit Bahan Makanan' : 'Tambah Bahan Makanan Baru'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="text-slate-400 hover:text-slate-600 text-lg"
                  >
                    &times;
                  </button>
                </div>
                <div className="p-6 space-y-3 text-xs max-h-[75vh] overflow-y-auto">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Nama Bahan Makanan
                    </label>
                    <input
                      type="text"
                      required
                      value={ingForm.name}
                      onChange={(e) => setIngForm({ ...ingForm, name: e.target.value })}
                      placeholder="Misal: Ayam giling, Telur horn, Minyak wijen"
                      className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">
                        Kategori Gizi
                      </label>
                      <select
                        value={ingForm.category}
                        onChange={(e) => {
                          const cat = categories.find((c) => c.name === e.target.value);
                          setIngForm({
                            ...ingForm,
                            category: e.target.value,
                            categoryId: cat?.id || 'CAT-01',
                          });
                        }}
                        className="w-full rounded border border-slate-300 p-2 text-xs text-slate-800"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">
                        Satuan Bawaan
                      </label>
                      <select
                        value={ingForm.defaultUnit}
                        onChange={(e) => setIngForm({ ...ingForm, defaultUnit: e.target.value })}
                        className="w-full rounded border border-slate-300 p-2 text-xs text-slate-800"
                      >
                        {units.map((u) => (
                          <option key={u.id} value={u.symbol}>
                            {u.symbol} ({u.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">
                        Stok Total
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={ingForm.currentStock}
                        onChange={(e) => setIngForm({ ...ingForm, currentStock: e.target.value })}
                        placeholder="0"
                        className="w-full rounded border border-slate-300 p-2 text-sm font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">
                        Alert Min
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={ingForm.minStockAlert}
                        onChange={(e) => setIngForm({ ...ingForm, minStockAlert: e.target.value })}
                        placeholder="5"
                        className="w-full rounded border border-slate-300 p-2 text-sm font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">
                        Harga (Rp)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={ingForm.lastPurchasePrice}
                        onChange={(e) =>
                          setIngForm({ ...ingForm, lastPurchasePrice: e.target.value })
                        }
                        placeholder="Harga per satuan"
                        className="w-full rounded border border-slate-300 p-2 text-sm font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Sebaran Stok per Unit SPPG */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                          <Share2 className="h-3.5 w-3.5 text-blue-600" />
                          Alokasi & Sebaran Stok per SPPG
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Tentukan kuantitas alokasi stok untuk masing-masing dapur SPPG ({ingForm.defaultUnit})
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleIngDistributeEvenly}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-100 shadow-xs transition"
                          title="Bagi rata total stok ke semua unit SPPG"
                        >
                          <Sparkles className="h-3 w-3 text-amber-500" />
                          Bagi Rata Otomatis
                        </button>
                        <button
                          type="button"
                          onClick={handleIngCalcTotalFromDistribution}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-100 shadow-xs transition"
                          title="Hitung dan sesuaikan total stok dari penjumlahan sebaran unit"
                        >
                          <Calculator className="h-3 w-3 text-blue-500" />
                          Hitung Total
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {sppgUnits.map((unit) => (
                        <div key={unit.id} className="rounded-md border border-slate-200 bg-white p-2 text-[11px]">
                          <div className="font-semibold text-slate-800 truncate" title={unit.name}>
                            {unit.shortName || unit.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mb-1">{unit.code}</div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={ingForm.sppgDistribution?.[unit.id] ?? 0}
                              onChange={(e) =>
                                handleIngDistributionChange(unit.id, Number(e.target.value))
                              }
                              className="w-full rounded border border-slate-200 px-1.5 py-1 text-right font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                            />
                            <span className="text-[10px] text-slate-400 font-mono">
                              {ingForm.defaultUnit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-600 border-t border-slate-200/60">
                      <span>Total Sebaran Unit:</span>
                      <span
                        className={`font-bold ${
                          totalIngDistribution !== Number(ingForm.currentStock)
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {totalIngDistribution} {ingForm.defaultUnit}{' '}
                        {totalIngDistribution !== Number(ingForm.currentStock) &&
                          `(Selisih: ${Number(ingForm.currentStock) - totalIngDistribution})`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 p-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 border rounded text-xs font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold"
                  >
                    {ingForm.id ? 'Simpan Perubahan Bahan' : 'Simpan Bahan'}
                  </button>
                </div>
              </form>
            )}

            {/* Modal: Admin User */}
            {modalType === 'admin_user' && (
              <form onSubmit={handleSaveAdminUser}>
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-slate-800" />
                    <h3 className="font-bold text-slate-900">
                      {adminForm.id ? 'Edit Akun & Password Admin' : 'Buat Akun Login Admin Baru'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="text-slate-400 hover:text-slate-600 text-lg"
                  >
                    &times;
                  </button>
                </div>
                <div className="p-6 space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Nama Lengkap Petugas
                    </label>
                    <input
                      type="text"
                      required
                      value={adminForm.name}
                      onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                      placeholder="Misal: Ahmad Fauzi, S.E. (Staf Keuangan)"
                      className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Username Login (Huruf Kecil / Angka)
                    </label>
                    <input
                      type="text"
                      required
                      value={adminForm.username}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, username: e.target.value.toLowerCase().trim() })
                      }
                      placeholder="Misal: staf_keuangan"
                      className="w-full rounded border border-slate-300 p-2 text-sm font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      {adminForm.id
                        ? 'Password Baru (Kosongkan jika tidak diganti)'
                        : 'Password Login'}
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        required={!adminForm.id}
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        placeholder={
                          adminForm.id
                            ? 'Kosongkan jika password lama tetap dipakai...'
                            : 'Masukkan password aman...'
                        }
                        className="w-full rounded border border-slate-300 p-2 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword((prev) => !prev)}
                        tabIndex={-1}
                        title={showAdminPassword ? 'Sembunyikan password' : 'Lihat password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded transition"
                      >
                        {showAdminPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Pilih Hak Akses (Role)
                    </label>
                    <select
                      value={adminForm.role}
                      onChange={(e) =>
                        setAdminForm({
                          ...adminForm,
                          role: e.target.value as UserRole,
                        })
                      }
                      className="w-full rounded border border-slate-300 p-2 text-xs text-slate-800 font-medium"
                    >
                      <option value="EXECUTIVE_AUDITOR">
                        2. ADMIN 2 / PEMANTAU (View & Audit Only - Aman untuk Staf/Pengawas)
                      </option>
                      <option value="SUPERADMIN">
                        1. SUPERADMIN (Penanggung Jawab Utama - Full Input, Edit, & CMS)
                      </option>
                      <option value="DISTRIBUTION_DRIVER">
                        3. PETUGAS PENGANTARAN / DRIVER (Tampilan Khusus Layar HP, Rute, TTD Digital & BAST)
                      </option>
                    </select>
                  </div>
                </div>
                <div className="border-t border-slate-100 p-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 border rounded text-xs font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold shadow hover:bg-slate-800"
                  >
                    {adminForm.id ? 'Simpan Perubahan Akun' : 'Buat Akun Admin'}
                  </button>
                </div>
              </form>
            )}

            {/* Modal: Supplier */}
            {modalType === 'supplier' && (
              <form onSubmit={handleSaveSupplier}>
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-900">
                    {supForm.id ? 'Edit Rekanan CV / Toko Supplier' : 'Tambah CV / Supplier Baru'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="text-slate-400 hover:text-slate-600 text-lg"
                  >
                    &times;
                  </button>
                </div>
                <div className="p-6 space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Nama CV / Toko Supplier
                    </label>
                    <input
                      type="text"
                      required
                      value={supForm.name}
                      onChange={(e) => setSupForm({ ...supForm, name: e.target.value })}
                      placeholder="Misal: CV Berkah Pangan Mandiri"
                      className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">
                        Nama PIC
                      </label>
                      <input
                        type="text"
                        value={supForm.picName}
                        onChange={(e) => setSupForm({ ...supForm, picName: e.target.value })}
                        placeholder="Nama kontak"
                        className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">
                        No. HP
                      </label>
                      <input
                        type="text"
                        value={supForm.phone}
                        onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })}
                        placeholder="08xx-xxxx-xxxx"
                        className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Alamat
                    </label>
                    <input
                      type="text"
                      value={supForm.address}
                      onChange={(e) => setSupForm({ ...supForm, address: e.target.value })}
                      placeholder="Alamat distributor"
                      className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      No. Rekening
                    </label>
                    <input
                      type="text"
                      value={supForm.bankAccount}
                      onChange={(e) => setSupForm({ ...supForm, bankAccount: e.target.value })}
                      placeholder="BCA 1234567890 a/n CV Berkah"
                      className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                    />
                  </div>
                </div>
                <div className="border-t border-slate-100 p-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 border rounded text-xs font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold"
                  >
                    {supForm.id ? 'Simpan Perubahan CV' : 'Simpan Supplier'}
                  </button>
                </div>
              </form>
            )}

            {/* Modal: Employee */}
            {modalType === 'employee' && (
              <form onSubmit={handleSaveEmployee}>
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-900">
                    {empForm.id
                      ? 'Edit Data Karyawan Peminta Belanja'
                      : 'Tambah Karyawan Peminta Belanja'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="text-slate-400 hover:text-slate-600 text-lg"
                  >
                    &times;
                  </button>
                </div>
                <div className="p-6 space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Nama Karyawan
                    </label>
                    <input
                      type="text"
                      required
                      value={empForm.name}
                      onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                      placeholder="Misal: Bambang Pamungkas"
                      className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={empForm.roleTitle}
                      onChange={(e) => setEmpForm({ ...empForm, roleTitle: e.target.value })}
                      placeholder="Koordinator Logistik Dapur"
                      className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      Asal SPPG Unit
                    </label>
                    <select
                      value={empForm.sppgUnitId}
                      onChange={(e) => setEmpForm({ ...empForm, sppgUnitId: e.target.value })}
                      className="w-full rounded border border-slate-300 p-2 text-xs text-slate-800"
                    >
                      {sppgUnits.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">
                      No. HP
                    </label>
                    <input
                      type="text"
                      value={empForm.phone}
                      onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full rounded border border-slate-300 p-2 text-sm text-slate-800"
                    />
                  </div>
                </div>
                <div className="border-t border-slate-100 p-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 border rounded text-xs font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold"
                  >
                    {empForm.id ? 'Simpan Perubahan Karyawan' : 'Simpan Karyawan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modern Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteDialog.isOpen}
        title={deleteDialog.title}
        description={deleteDialog.description}
        itemName={deleteDialog.itemName}
        isDeleting={isDeletingItem}
        onConfirm={async () => {
          setIsDeletingItem(true);
          try {
            await deleteDialog.onConfirm();
          } finally {
            setIsDeletingItem(false);
            setDeleteDialog((prev) => ({ ...prev, isOpen: false }));
          }
        }}
        onClose={() => setDeleteDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
