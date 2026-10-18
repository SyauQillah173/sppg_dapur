'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  UserRole,
  SppgUnitId,
  SppgUnit,
  ProcurementTransaction,
  MasterIngredient,
  IngredientCategory,
  MasterUnit,
  SupplierDirectory,
  EmployeeDirectory,
  StockLedgerEntry,
  KPISummary,
  AuditStatus,
  BudgetAllocationItem,
  AdminUserItem,
} from './types';
import {
  INITIAL_SPPG_UNITS,
  INITIAL_CATEGORIES,
  INITIAL_UNITS,
  INITIAL_SUPPLIERS,
  INITIAL_EMPLOYEES,
  INITIAL_INGREDIENTS,
  INITIAL_PROCUREMENTS,
  INITIAL_STOCK_LEDGERS,
  INITIAL_BUDGET_ALLOCATIONS,
  INITIAL_ADMIN_USERS,
} from './initial-data';
import { toSppgUnit, toSupplier, toEmployee, toIngredient, toCategory, toMasterUnit, toStockLedger, toBudget, SEMUA_SPPG_NAME } from './db-map';

interface ModalState {
  type:
    | 'INSPECT_RECEIPT'
    | 'AI_SCANNER'
    | 'ADD_PROCUREMENT'
    | 'ADD_INGREDIENT'
    | 'EDIT_INGREDIENT'
    | 'ADD_SUPPLIER'
    | 'ADD_EMPLOYEE'
    | 'ADD_BUDGET'
    | 'ADD_SPPG_UNIT'
    | 'ADD_ADMIN_USER'
    | null;
  data?: any;
}

interface CurrentUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

interface StoreContextType {
  currentUser: CurrentUser | null;
  userRole: UserRole;
  serverRole: UserRole;
  isReadOnly: boolean;
  setUserRole: (role: UserRole) => void;
  selectedSppgUnit: SppgUnitId | 'ALL';
  setSelectedSppgUnit: (unitId: SppgUnitId | 'ALL') => void;
  sppgUnits: SppgUnit[];
  budgetAllocations: BudgetAllocationItem[];
  procurements: ProcurementTransaction[];
  ingredients: MasterIngredient[];
  categories: IngredientCategory[];
  units: MasterUnit[];
  suppliers: SupplierDirectory[];
  employees: EmployeeDirectory[];
  stockLedgers: StockLedgerEntry[];
  adminUsers: AdminUserItem[];
  modal: ModalState;
  openModal: (type: ModalState['type'], data?: any) => void;
  closeModal: () => void;

  // Actions
  addProcurement: (proc: Omit<ProcurementTransaction, 'id' | 'createdAt'>) => Promise<{ ok: boolean; error?: string }>;
  deleteProcurement: (id: string) => Promise<{ ok: boolean; error?: string }>;
  updateAuditStatus: (id: string, status: AuditStatus, auditorNotes: string, auditorName: string) => Promise<{ ok: boolean; error?: string }>;
  addIngredient: (ing: Omit<MasterIngredient, 'id' | 'code' | 'updatedAt'>) => Promise<{ ok: boolean; error?: string }>;
  updateIngredient: (id: string, ing: Partial<MasterIngredient>) => Promise<{ ok: boolean; error?: string }>;
  deleteIngredient: (id: string) => Promise<{ ok: boolean; error?: string }>;
  addCategory: (cat: Omit<IngredientCategory, 'id'>) => Promise<{ ok: boolean; error?: string }>;
  updateCategory: (id: string, cat: Partial<IngredientCategory>) => Promise<{ ok: boolean; error?: string }>;
  deleteCategory: (id: string) => Promise<{ ok: boolean; error?: string }>;
  addUnit: (unit: Omit<MasterUnit, 'id'>) => Promise<{ ok: boolean; error?: string }>;
  deleteUnit: (id: string) => Promise<{ ok: boolean; error?: string }>;
  recordStockMutation: (entry: Omit<StockLedgerEntry, 'id' | 'timestamp' | 'remainingStockAfter'>) => Promise<{ ok: boolean; error?: string }>;
  updateStockMutation: (id: string, entry: Partial<StockLedgerEntry>) => Promise<{ ok: boolean; error?: string }>;
  deleteStockMutation: (id: string) => Promise<{ ok: boolean; error?: string }>;
  addSupplier: (sup: Omit<SupplierDirectory, 'id' | 'code' | 'totalDisbursed' | 'totalTransactions'>) => Promise<{ ok: boolean; error?: string }>;
  updateSupplier: (id: string, sup: Partial<SupplierDirectory>) => Promise<{ ok: boolean; error?: string }>;
  deleteSupplier: (id: string) => Promise<{ ok: boolean; error?: string }>;
  addEmployee: (emp: Omit<EmployeeDirectory, 'id' | 'employeeNumber' | 'totalRequested' | 'totalRealized' | 'pendingBalance'>) => Promise<{ ok: boolean; error?: string }>;
  updateEmployee: (id: string, emp: Partial<EmployeeDirectory>) => Promise<{ ok: boolean; error?: string }>;
  deleteEmployee: (id: string) => Promise<{ ok: boolean; error?: string }>;
  addBudgetAllocation: (item: Omit<BudgetAllocationItem, 'id' | 'allocatedDate'> & { allocatedDate?: string }) => Promise<{ ok: boolean; error?: string }>;
  addBudgetAllocationsBulk: (items: Array<Omit<BudgetAllocationItem, 'id' | 'allocatedDate'> & { allocatedDate?: string }>) => Promise<{ ok: boolean; error?: string }>;
  updateBudgetAllocation: (id: string, updates: Partial<BudgetAllocationItem>) => Promise<{ ok: boolean; error?: string }>;
  deleteBudgetAllocation: (id: string) => Promise<{ ok: boolean; error?: string }>;
  addSppgUnit: (unit: Omit<SppgUnit, 'id' | 'totalRealized' | 'totalRemaining'>) => Promise<{ ok: boolean; error?: string }>;
  updateSppgUnit: (id: string, data: Partial<SppgUnit>) => Promise<{ ok: boolean; error?: string }>;
  deleteSppgUnit: (id: string) => Promise<{ ok: boolean; error?: string }>;
  addAdminUser: (user: Omit<AdminUserItem, 'id' | 'createdAt'> & { id?: string }) => void;
  updateAdminUser: (id: string, user: { username?: string; name?: string; role?: string; password?: string }) => Promise<{ ok: boolean; error?: string }>;
  deleteAdminUser: (id: string) => void;
  logout: () => Promise<void>;
  resetToDefault: () => void;
  refreshFromDb: () => Promise<void>;
  refreshMasterFromDb: () => Promise<void>;

  // Computed
  kpiSummary: KPISummary;
  filteredProcurements: ProcurementTransaction[];
  filteredIngredients: MasterIngredient[];
  filteredStockLedgers: StockLedgerEntry[];
  filteredBudgetAllocations: BudgetAllocationItem[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('giziflow_session_user');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      id: 'admin-super-01',
      username: 'superadmin',
      name: 'Superadmin Pengelola SPPG',
      role: 'SUPERADMIN',
    };
  });
  const [userRole, setUserRole] = useState<UserRole>('SUPERADMIN');
  // serverRole = actual role from DB — ceiling for UI switching
  const [serverRole, setServerRole] = useState<UserRole>('SUPERADMIN');
  const [selectedSppgUnit, setSelectedSppgUnit] = useState<SppgUnitId | 'ALL'>('ALL');
  const [sppgUnits, setSppgUnits] = useState<SppgUnit[]>(INITIAL_SPPG_UNITS);
  const [budgetAllocations, setBudgetAllocations] = useState<BudgetAllocationItem[]>(INITIAL_BUDGET_ALLOCATIONS);
  const [procurements, setProcurements] = useState<ProcurementTransaction[]>(INITIAL_PROCUREMENTS);
  const [ingredients, setIngredients] = useState<MasterIngredient[]>(INITIAL_INGREDIENTS);
  const [categories, setCategories] = useState<IngredientCategory[]>(INITIAL_CATEGORIES);
  const [units, setUnits] = useState<MasterUnit[]>(INITIAL_UNITS);
  const [suppliers, setSuppliers] = useState<SupplierDirectory[]>(INITIAL_SUPPLIERS);
  const [employees, setEmployees] = useState<EmployeeDirectory[]>(INITIAL_EMPLOYEES);
  const [stockLedgers, setStockLedgers] = useState<StockLedgerEntry[]>(INITIAL_STOCK_LEDGERS);
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[]>(INITIAL_ADMIN_USERS);
  const [modal, setModal] = useState<ModalState>({ type: null });
  // Jangan push ke server sebelum state awal selesai dimuat (hindari seed menimpa data server)
  const hydratedRef = useRef(false);

  // Sync role with current user & persist active session
  useEffect(() => {
    const syncSession = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data?.user) {
            setCurrentUser(data.user);
            setUserRole(data.user.role);
            setServerRole(data.user.role); // lock ceiling
            if (typeof window !== 'undefined') {
              try {
                if (data.token) localStorage.setItem('giziflow_session_token', data.token);
                localStorage.setItem('giziflow_session_user', JSON.stringify(data.user));
              } catch {}
            }
            return;
          }
        }

        // Jika cookie tertahan pada standalone PWA launcher, coba restore via token
        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem('giziflow_session_token');
          if (storedToken) {
            const rRes = await fetch('/api/auth/restore', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: storedToken }),
            });
            if (rRes.ok) {
              const rData = await rRes.json();
              if (rData?.success && rData?.user) {
                setCurrentUser(rData.user);
                setUserRole(rData.user.role);
                setServerRole(rData.user.role);
                try {
                  if (rData.token) localStorage.setItem('giziflow_session_token', rData.token);
                  localStorage.setItem('giziflow_session_user', JSON.stringify(rData.user));
                } catch {}
              }
            }
          }
        }
      } catch {
        // Fallback to cached user
      }
    };

    syncSession();
  }, []);

  // Sync userRole when changed — AUDITOR cannot escalate to SUPERADMIN
  const handleSetUserRole = (newRole: UserRole) => {
    // Server-verified role is the ceiling — auditor can never switch up
    if (serverRole === 'EXECUTIVE_AUDITOR' && newRole === 'SUPERADMIN') return;
    setUserRole(newRole);
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        role: newRole,
        name:
          newRole === 'SUPERADMIN'
            ? 'Superadmin Pengelola SPPG'
            : currentUser.name,
      });
    }
  };

  // ── Helper API ────────────────────────────────────────────────────────────
  const postJson = async (url: string, body: unknown, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'POST') => {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'DELETE' ? undefined : JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) {
      return { ok: false, error: json?.error || `Gagal menyimpan (HTTP ${res.status}).` };
    }
    return { ok: true };
  };

  const failNotify = (result: { ok: boolean; error?: string }) => {
    if (!result.ok && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app:alert', {
          detail: {
            type: 'error',
            title: 'Gagal Menyimpan Data',
            message: result.error || 'Gagal menyimpan perubahan ke database.',
          },
        })
      );
    }
    return result;
  };

  const refreshAdminUsers = async () => {
    try {
      const res = await fetch(`/api/admin-users?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          setAdminUsers(
            json.data.map((u: any) => ({
              id: u.id,
              username: u.username,
              name: u.name,
              role: u.role,
              createdAt: u.createdAt ?? new Date().toISOString(),
              updatedAt: u.updatedAt ?? undefined,
            }))
          );
        }
      }
    } catch {
      // offline
    }
  };

  /**
   * Semua transaksi & total dihitung server dari tabelnya, jadi setelah setiap
   * perubahan cukup ambil ulang — tidak ada perhitungan ganda di sisi klien.
   */
  const refreshFromDb = async () => {
    try {
      const t = Date.now();
      const [pRes, bRes, uRes, sRes] = await Promise.all([
        fetch(`/api/procurement?_t=${t}`, { cache: 'no-store' }),
        fetch(`/api/budgets?_t=${t}`, { cache: 'no-store' }),
        fetch(`/api/sppg-units?_t=${t}`, { cache: 'no-store' }),
        fetch(`/api/suppliers?_t=${t}`, { cache: 'no-store' }),
      ]);
      const [pJson, bJson, uJson, sJson] = await Promise.all([
        pRes.json(), bRes.json(), uRes.json(), sRes.json(),
      ]);

      const units = uJson?.success && Array.isArray(uJson.data) ? uJson.data.map(toSppgUnit) : sppgUnits;
      if (units) setSppgUnits(units);
      if (pJson?.success && Array.isArray(pJson.data)) setProcurements(pJson.data);
      if (bJson?.success && Array.isArray(bJson.data)) {
        setBudgetAllocations(bJson.data.map((row: any) => toBudget(row, units || [])));
      }
      if (sJson?.success && Array.isArray(sJson.data)) setSuppliers(sJson.data.map(toSupplier));
    } catch {
      // offline — biarkan data yang sudah tampil
    }
  };

  const refreshMasterFromDb = async () => {
    try {
      const t = Date.now();
      const [sup, emp, ing, cat, unit, stock] = await Promise.all([
        fetch(`/api/suppliers?_t=${t}`, { cache: 'no-store' }),
        fetch(`/api/employees?_t=${t}`, { cache: 'no-store' }),
        fetch(`/api/ingredients?_t=${t}`, { cache: 'no-store' }),
        fetch(`/api/categories?_t=${t}`, { cache: 'no-store' }),
        fetch(`/api/master-units?_t=${t}`, { cache: 'no-store' }),
        fetch(`/api/stock-movements?_t=${t}`, { cache: 'no-store' }),
      ]);
      const [sJ, eJ, iJ, cJ, uJ, kJ] = await Promise.all([
        sup.json(), emp.json(), ing.json(), cat.json(), unit.json(), stock.json(),
      ]);
      if (sJ?.success && Array.isArray(sJ.data)) setSuppliers(sJ.data.map(toSupplier));
      if (eJ?.success && Array.isArray(eJ.data)) setEmployees(eJ.data.map(toEmployee));
      if (iJ?.success && Array.isArray(iJ.data)) setIngredients(iJ.data.map(toIngredient));
      if (cJ?.success && Array.isArray(cJ.data)) setCategories(cJ.data.map(toCategory));
      if (uJ?.success && Array.isArray(uJ.data)) setUnits(uJ.data.map(toMasterUnit));
      if (kJ?.success && Array.isArray(kJ.data)) setStockLedgers(kJ.data.map(toStockLedger));
    } catch {
      // offline — pakai data yang sudah tampil
    }
  };

  const refreshAllFromDb = async () => {
    await Promise.all([
      refreshFromDb(),
      refreshMasterFromDb(),
      refreshAdminUsers(),
    ]);
  };

  // Muat data awal langsung dari tabel database
  useEffect(() => {
    let cancelled = false;

    (async () => {
      await refreshAllFromDb();
      if (cancelled) return;
      hydratedRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Realtime Live Sync: auto-polling setiap 3 detik agar sinkron seketika saat DB diedit/dihapus
  useEffect(() => {
    let isFetching = false;
    const interval = setInterval(async () => {
      if (document.visibilityState === 'visible' && hydratedRef.current && !isFetching) {
        isFetching = true;
        try {
          await refreshFromDb();
        } finally {
          isFetching = false;
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Realtime Master Data Sync: auto-polling setiap 8 detik
  useEffect(() => {
    let isMasterFetching = false;
    const interval = setInterval(async () => {
      if (document.visibilityState === 'visible' && hydratedRef.current && !isMasterFetching) {
        isMasterFetching = true;
        try {
          await refreshMasterFromDb();
        } finally {
          isMasterFetching = false;
        }
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Segarkan saat tab kembali aktif — selalu baca dari database, anti-hilang
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && hydratedRef.current) {
        refreshAllFromDb();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  const openModal = (type: ModalState['type'], data?: any) => {
    setModal({ type, data });
  };

  const closeModal = () => {
    setModal({ type: null });
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem('giziflow_session_token');
      localStorage.removeItem('giziflow_session_user');
    } catch {
      // ignore
    }
    window.location.href = '/login';
  };

  const addProcurement = async (proc: Omit<ProcurementTransaction, 'id' | 'createdAt'>) => {
    const result = await postJson('/api/procurement', proc);
    if (result.ok) await refreshFromDb();
    return result;
  };

  const deleteProcurement = async (id: string) => {
    const result = await postJson(`/api/procurement/${id}`, null, 'DELETE');
    if (result.ok) await refreshFromDb();
    return result;
  };

  const updateAuditStatus = async (id: string, status: AuditStatus, auditNotes: string, auditorName: string) => {
    const result = await postJson(
      `/api/procurement/${id}`,
      { status, auditNotes, auditedBy: auditorName },
      'PUT'
    );
    if (result.ok) await refreshFromDb();
    return result;
  };

  const addIngredient = async (ing: Omit<MasterIngredient, 'id' | 'code' | 'updatedAt'>) => {
    const category = categories.find((c) => c.name === ing.category) || categories.find((c) => c.id === ing.categoryId);
    const result = await postJson('/api/ingredients', {
      name: ing.name,
      categoryId: category?.id,
      defaultUnit: ing.defaultUnit,
      currentStock: ing.currentStock,
      minStockAlert: ing.minStockAlert,
      lastPurchasePrice: ing.lastPurchasePrice,
      sppgDistribution: ing.sppgDistribution,
    });
    if (result.ok) await refreshMasterFromDb();
    return failNotify(result);
  };

  const updateIngredient = async (id: string, ingData: Partial<MasterIngredient>) => {
    const category = ingData.category
      ? categories.find((c) => c.name === ingData.category)
      : undefined;
    const result = await postJson(
      `/api/ingredients/${id}`,
      {
        ...(ingData.name !== undefined ? { name: ingData.name } : {}),
        ...(category ? { categoryId: category.id } : {}),
        ...(ingData.defaultUnit !== undefined ? { defaultUnit: ingData.defaultUnit } : {}),
        ...(ingData.currentStock !== undefined ? { currentStock: ingData.currentStock } : {}),
        ...(ingData.minStockAlert !== undefined ? { minStockAlert: ingData.minStockAlert } : {}),
        ...(ingData.lastPurchasePrice !== undefined ? { lastPurchasePrice: ingData.lastPurchasePrice } : {}),
        ...(ingData.sppgDistribution !== undefined ? { sppgDistribution: ingData.sppgDistribution } : {}),
      },
      'PUT'
    );
    if (result.ok) await refreshMasterFromDb();
    return failNotify(result);
  };

  const deleteIngredient = async (id: string) => {
    const result = await postJson(`/api/ingredients/${id}`, null, 'DELETE');
    if (result.ok) await refreshMasterFromDb();
    return failNotify(result);
  };

  const addCategory = async (cat: Omit<IngredientCategory, 'id'>) => {
    const result = await postJson('/api/categories', {
      name: cat.name,
      code: cat.code,
      color: cat.color,
      description: cat.description,
    });
    if (result.ok) await refreshMasterFromDb();
    return failNotify(result);
  };

  const updateCategory = async (id: string, cat: Partial<IngredientCategory>) => {
    const result = await postJson(`/api/categories/${id}`, cat, 'PATCH');
    if (result.ok) await refreshMasterFromDb();
    return failNotify(result);
  };

  const deleteCategory = async (id: string) => {
    const result = await postJson(`/api/categories/${id}`, null, 'DELETE');
    if (result.ok) await refreshMasterFromDb();
    return failNotify(result);
  };

  const addUnit = async (unit: Omit<MasterUnit, 'id'>) => {
    const result = await postJson('/api/master-units', {
      symbol: unit.symbol,
      name: unit.name,
      type: unit.type,
    });
    if (result.ok) await refreshMasterFromDb();
    return failNotify(result);
  };

  const deleteUnit = async (id: string) => {
    const result = await postJson(`/api/master-units?id=${encodeURIComponent(id)}`, null, 'DELETE');
    if (result.ok) await refreshMasterFromDb();
    return failNotify(result);
  };

  const recordStockMutation = async (entry: Omit<StockLedgerEntry, 'id' | 'timestamp' | 'remainingStockAfter'>) => {
    const result = await postJson('/api/stock-movements', {
      sppgUnitId: entry.sppgUnitId,
      ingredientId: entry.ingredientId,
      type: entry.type,
      quantity: entry.quantity,
      unit: entry.unit,
      referenceNumber: entry.referenceNumber,
      purpose: entry.purpose,
      recordedBy: entry.recordedBy,
    });
    if (result.ok) await refreshMasterFromDb();
    return failNotify(result);
  };

  const updateStockMutation = async (id: string, entry: Partial<StockLedgerEntry>) => {
    const result = await postJson(`/api/stock-movements/${id}`, entry, 'PATCH');
    if (result.ok) await refreshMasterFromDb();
    return failNotify(result);
  };

  const deleteStockMutation = async (id: string) => {
    const result = await postJson(`/api/stock-movements/${id}`, null, 'DELETE');
    if (result.ok) await refreshMasterFromDb();
    return failNotify(result);
  };

  const addSupplier = async (sup: Omit<SupplierDirectory, 'id' | 'code' | 'totalDisbursed' | 'totalTransactions'>) => {
    const result = await postJson('/api/suppliers', {
      name: sup.name,
      picName: sup.picName,
      phone: sup.phone,
      address: sup.address,
      bankAccount: sup.bankAccount,
      suppliedCategory: sup.suppliedCategory,
      rating: sup.rating,
      activeStatus: sup.activeStatus,
    });
    if (result.ok) await refreshMasterFromDb();
    return failNotify(result);
  };

  const updateSupplier = async (id: string, sup: Partial<SupplierDirectory>) => {
    const result = await postJson(`/api/suppliers/${id}`, sup, 'PATCH');
    if (result.ok) await refreshMasterFromDb();
    return failNotify(result);
  };

  const deleteSupplier = async (id: string) => {
    const result = await postJson(`/api/suppliers/${id}`, null, 'DELETE');
    if (result.ok) await refreshMasterFromDb();
    return failNotify(result);
  };

  const addEmployee = async (emp: Omit<EmployeeDirectory, 'id' | 'employeeNumber' | 'totalRequested' | 'totalRealized' | 'pendingBalance'>) => {
    const result = await postJson('/api/employees', {
      name: emp.name,
      roleTitle: emp.roleTitle,
      sppgUnitId: emp.sppgUnitId,
      phone: emp.phone,
      complianceScore: emp.complianceScore,
      status: emp.status,
    });
    if (result.ok) await refreshMasterFromDb();
    return failNotify(result);
  };

  const updateEmployee = async (id: string, emp: Partial<EmployeeDirectory>) => {
    const result = await postJson(`/api/employees/${id}`, emp, 'PATCH');
    if (result.ok) await refreshMasterFromDb();
    return failNotify(result);
  };

  const deleteEmployee = async (id: string) => {
    const result = await postJson(`/api/employees/${id}`, null, 'DELETE');
    if (result.ok) await refreshMasterFromDb();
    return failNotify(result);
  };

  // Dana masuk: server yang menyesuaikan pagu kas tiap unit (tabel budget_allocations).
  const addBudgetAllocation = async (
    item: Omit<BudgetAllocationItem, 'id' | 'allocatedDate'> & { allocatedDate?: string }
  ) => {
    return addBudgetAllocationsBulk([item]);
  };

  /** Tambah banyak catatan sekaligus (dipakai import Excel) dalam satu request. */
  const addBudgetAllocationsBulk = async (
    items: Array<Omit<BudgetAllocationItem, 'id' | 'allocatedDate'> & { allocatedDate?: string }>
  ) => {
    if (items.length === 0) return { ok: true };

    const result = await postJson('/api/budgets', {
      items: items.map((item) => ({
        sppgUnitId: item.sppgUnitId,
        fiscalPeriod: item.fiscalPeriod,
        amountAllocated: item.amountAllocated,
        amountRealized: item.amountRealized,
        remainingBudget: item.remainingBudget,
        allocatedDate: item.allocatedDate,
        notes: item.notes,
        requestedBy: item.requestedBy,
        requesterFor: item.requesterFor,
        cashHolder: item.cashHolder,
        transferProofUrl: item.transferProofUrl,
        withdrawnAmount: item.withdrawnAmount,
        withdrawnAt: item.withdrawnAt,
        withdrawnBy: item.withdrawnBy,
        withdrawnRecipient: item.withdrawnRecipient,
        withdrawnSpender: item.withdrawnSpender,
        withdrawnProofUrl: item.withdrawnProofUrl,
        withdrawnNote: item.withdrawnNote,
      })),
    });
    if (result.ok) await refreshFromDb();
    return result;
  };

  const updateBudgetAllocation = async (id: string, updates: Partial<BudgetAllocationItem>) => {
    const result = await postJson(`/api/budgets/${id}`, updates, 'PATCH');
    if (result.ok) await refreshFromDb();
    return result;
  };

  const deleteBudgetAllocation = async (id: string) => {
    const result = await postJson(`/api/budgets/${id}`, null, 'DELETE');
    if (result.ok) await refreshFromDb();
    return result;
  };

  const addSppgUnit = async (unit: Omit<SppgUnit, 'id' | 'totalRealized' | 'totalRemaining'>) => {
    const result = await postJson('/api/sppg-units', {
      code: unit.code,
      name: unit.name,
      shortName: unit.shortName,
      location: unit.location,
      picName: unit.picName,
      phone: unit.phone,
      activeBudget: unit.activeBudget,
    });
    if (result.ok) await refreshFromDb();
    return failNotify(result);
  };

  const updateSppgUnit = async (id: string, data: Partial<SppgUnit>) => {
    const result = await postJson(`/api/sppg-units/${id}`, data, 'PATCH');
    if (result.ok) await refreshFromDb();
    return failNotify(result);
  };

  const deleteSppgUnit = async (id: string) => {
    const result = await postJson(`/api/sppg-units/${id}`, null, 'DELETE');
    if (result.ok) await refreshFromDb();
    return failNotify(result);
  };

  const addAdminUser = (user: Omit<AdminUserItem, 'id' | 'createdAt'> & { id?: string }) => {
    const id = user.id || `ADM-${Date.now().toString().slice(-4)}`;
    const newAdmin: AdminUserItem = {
      ...user,
      id,
      createdAt: new Date().toISOString(),
    };
    setAdminUsers((prev) => [...prev, newAdmin]);
  };

  const updateAdminUser = async (id: string, user: { username?: string; name?: string; role?: string; password?: string }) => {
    const result = await postJson(`/api/admin-users/${id}`, user, 'PATCH');
    if (result.ok) {
      setAdminUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                username: user.username || u.username,
                name: user.name || u.name,
                role: (user.role as any) || u.role,
              }
            : u
        )
      );
    }
    return failNotify(result);
  };

  const deleteAdminUser = (id: string) => {
    setAdminUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const resetToDefault = () => {
    refreshAllFromDb();
  };

  // Filtered procurements based on selected SPPG Unit
  const filteredProcurements = useMemo(() => {
    if (selectedSppgUnit === 'ALL') return procurements;
    // Nota 'ALL' (gabungan semua unit) tetap tampil saat satu unit dipilih
    return procurements.filter((p) => p.sppgUnitId === selectedSppgUnit || p.sppgUnitId === 'ALL');
  }, [procurements, selectedSppgUnit]);

  // Filtered ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients;
  }, [ingredients]);

  // Filtered stock ledgers
  const filteredStockLedgers = useMemo(() => {
    if (selectedSppgUnit === 'ALL') return stockLedgers;
    return stockLedgers.filter((l) => l.sppgUnitId === selectedSppgUnit);
  }, [stockLedgers, selectedSppgUnit]);

  // Filtered budget allocations
  const filteredBudgetAllocations = useMemo(() => {
    if (selectedSppgUnit === 'ALL') return budgetAllocations;
    // Catatan 'ALL' (dana gabungan) tetap tampil saat satu unit dipilih
    return budgetAllocations.filter((b) => b.sppgUnitId === selectedSppgUnit || b.sppgUnitId === 'ALL');
  }, [budgetAllocations, selectedSppgUnit]);

  // Computed KPI Summary (Single Source of Truth: derive directly from budgetAllocations & procurements)
  const kpiSummary = useMemo<KPISummary>(() => {
    const activeUnit = selectedSppgUnit === 'ALL' ? null : sppgUnits.find((u) => u.id === selectedSppgUnit);

    const totalAllBudget = budgetAllocations
      .filter((b) => b.sppgUnitId === 'ALL')
      .reduce((acc, b) => acc + b.amountAllocated, 0);
    const unitCount = sppgUnits.length || 1;
    const shareOfAll = totalAllBudget / unitCount;

    const totalBudgetIncome =
      selectedSppgUnit === 'ALL'
        ? budgetAllocations.reduce((acc, b) => acc + b.amountAllocated, 0)
        : (budgetAllocations
            .filter((b) => b.sppgUnitId === selectedSppgUnit || (activeUnit && b.sppgUnitId === activeUnit.code))
            .reduce((acc, b) => acc + b.amountAllocated, 0) + shareOfAll);

    const targetProcurements =
      selectedSppgUnit === 'ALL'
        ? procurements
        : procurements.filter(
            (p) => p.sppgUnitId === selectedSppgUnit || (activeUnit && p.sppgUnitId === activeUnit.code)
          );

    const totalActualSpending = targetProcurements.reduce((acc, p) => acc + p.actualReceiptTotal, 0);
    const activeRemainingCash = totalBudgetIncome - totalActualSpending;
    const budgetUsedPercentage =
      totalBudgetIncome > 0 ? (totalActualSpending / totalBudgetIncome) * 100 : 0;

    // Total kitchen volume (approximate in Kg)
    const targetIngredients =
      selectedSppgUnit === 'ALL'
        ? ingredients
        : ingredients.map((ing) => ({
            ...ing,
            currentStock: ing.sppgDistribution[selectedSppgUnit] || 0,
          }));

    const totalKitchenVolumeKg = targetIngredients.reduce((acc, item) => {
      if (item.defaultUnit === 'Kg') return acc + item.currentStock;
      if (item.defaultUnit === 'Karung') return acc + item.currentStock * 25;
      return acc + item.currentStock;
    }, 0);

    return {
      totalBudgetIncome,
      totalActualSpending,
      activeRemainingCash,
      budgetUsedPercentage,
      totalKitchenVolumeKg,
      totalKitchenItemCount: ingredients.length,
    };
  }, [selectedSppgUnit, sppgUnits, ingredients, budgetAllocations, procurements]);

  const isReadOnly = userRole === 'EXECUTIVE_AUDITOR';

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        userRole,
        serverRole,
        isReadOnly,
        setUserRole: handleSetUserRole,
        selectedSppgUnit,
        setSelectedSppgUnit,
        sppgUnits,
        budgetAllocations,
        procurements,
        ingredients,
        categories,
        units,
        suppliers,
        employees,
        stockLedgers,
        adminUsers,
        modal,
        openModal,
        closeModal,
        addProcurement,
        deleteProcurement,
        updateAuditStatus,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        addCategory,
        updateCategory,
        deleteCategory,
        addUnit,
        deleteUnit,
        recordStockMutation,
        updateStockMutation,
        deleteStockMutation,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addBudgetAllocation,
        addBudgetAllocationsBulk,
        updateBudgetAllocation,
        deleteBudgetAllocation,
        addSppgUnit,
        updateSppgUnit,
        deleteSppgUnit,
        addAdminUser,
        updateAdminUser,
        deleteAdminUser,
        logout,
        resetToDefault,
        refreshFromDb,
        refreshMasterFromDb,
        kpiSummary,
        filteredProcurements,
        filteredIngredients,
        filteredStockLedgers,
        filteredBudgetAllocations,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
