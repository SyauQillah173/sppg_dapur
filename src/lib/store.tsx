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

interface ModalState {
  type:
    | 'INSPECT_RECEIPT'
    | 'AI_SCANNER'
    | 'ADD_PROCUREMENT'
    | 'ADD_INGREDIENT'
    | 'EDIT_INGREDIENT'
    | 'RECORD_MUTATION'
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
  addProcurement: (proc: Omit<ProcurementTransaction, 'id' | 'createdAt'>) => void;
  deleteProcurement: (id: string) => void;
  updateAuditStatus: (id: string, status: AuditStatus, auditorNotes: string, auditorName: string) => void;
  addIngredient: (ing: Omit<MasterIngredient, 'id' | 'code' | 'updatedAt'>) => void;
  updateIngredient: (id: string, ing: Partial<MasterIngredient>) => void;
  deleteIngredient: (id: string) => void;
  addCategory: (cat: Omit<IngredientCategory, 'id'>) => void;
  deleteCategory: (id: string) => void;
  addUnit: (unit: Omit<MasterUnit, 'id'>) => void;
  deleteUnit: (id: string) => void;
  recordStockMutation: (entry: Omit<StockLedgerEntry, 'id' | 'timestamp' | 'remainingStockAfter'>) => void;
  addSupplier: (sup: Omit<SupplierDirectory, 'id' | 'code' | 'totalDisbursed' | 'totalTransactions'>) => void;
  addEmployee: (emp: Omit<EmployeeDirectory, 'id' | 'employeeNumber' | 'totalRequested' | 'totalRealized' | 'pendingBalance'>) => void;
  addBudgetAllocation: (item: Omit<BudgetAllocationItem, 'id' | 'allocatedDate'> & { allocatedDate?: string }) => void;
  addBudgetAllocationsBulk: (items: Array<Omit<BudgetAllocationItem, 'id' | 'allocatedDate'> & { allocatedDate?: string }>) => void;
  deleteBudgetAllocation: (id: string) => void;
  addSppgUnit: (unit: Omit<SppgUnit, 'id' | 'totalRealized' | 'totalRemaining'>) => void;
  updateSppgUnit: (id: string, data: Partial<SppgUnit>) => void;
  deleteSppgUnit: (id: string) => void;
  addAdminUser: (user: Omit<AdminUserItem, 'id' | 'createdAt'>) => void;
  deleteAdminUser: (id: string) => void;
  logout: () => Promise<void>;
  resetToDefault: () => void;

  // Computed
  kpiSummary: KPISummary;
  filteredProcurements: ProcurementTransaction[];
  filteredIngredients: MasterIngredient[];
  filteredStockLedgers: StockLedgerEntry[];
  filteredBudgetAllocations: BudgetAllocationItem[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'sppg_private_portal_v1_clean';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>({
    id: 'admin-super-01',
    username: 'superadmin',
    name: 'Superadmin Pengelola SPPG',
    role: 'SUPERADMIN',
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

  // Sync role with current user
  useEffect(() => {
    // Fetch logged in session from server
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success && data.user) {
          setCurrentUser(data.user);
          setUserRole(data.user.role);
          setServerRole(data.user.role); // lock ceiling
        }
      })
      .catch(() => {
        // Fallback to default
      });
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

  // Terapkan snapshot dari server/localStorage ke state
  const applyState = (parsed: any) => {
    if (!parsed) return;
    if (parsed.procurements) setProcurements(parsed.procurements);
    if (parsed.ingredients) setIngredients(parsed.ingredients);
    if (parsed.categories) setCategories(parsed.categories);
    if (parsed.units) setUnits(parsed.units);
    if (parsed.suppliers) setSuppliers(parsed.suppliers);
    if (parsed.employees) setEmployees(parsed.employees);
    if (parsed.stockLedgers) setStockLedgers(parsed.stockLedgers);
    if (parsed.sppgUnits) setSppgUnits(parsed.sppgUnits);
    if (parsed.budgetAllocations) setBudgetAllocations(parsed.budgetAllocations);
    if (parsed.adminUsers) setAdminUsers(parsed.adminUsers);
  };

  // Ambil snapshot terbaru dari server (dipakai semua perangkat)
  const syncFromServer = async () => {
    try {
      const res = await fetch('/api/state', { cache: 'no-store' });
      if (!res.ok) return false;
      const json = await res.json();
      if (json?.success && json.state) {
        applyState(json.state);
        return true;
      }
    } catch {
      // offline / server mati
    }
    return false;
  };

  // Load awal: server dulu, fallback cache lokal
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const fromServer = await syncFromServer();
      if (cancelled) return;

      if (!fromServer) {
        try {
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (saved) applyState(JSON.parse(saved));
        } catch {
          // ignore
        }
      }

      hydratedRef.current = true;
      // Server belum punya snapshot → kirim seed awal supaya perangkat lain ikut.
      if (!fromServer) saveState({});
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Segarkan saat tab kembali aktif — supaya input dari perangkat lain langsung muncul
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && hydratedRef.current) syncFromServer();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  // Save changes to localStorage
  const saveState = (newState: {
    procurements?: ProcurementTransaction[];
    ingredients?: MasterIngredient[];
    categories?: IngredientCategory[];
    units?: MasterUnit[];
    suppliers?: SupplierDirectory[];
    employees?: EmployeeDirectory[];
    stockLedgers?: StockLedgerEntry[];
    sppgUnits?: SppgUnit[];
    budgetAllocations?: BudgetAllocationItem[];
    adminUsers?: AdminUserItem[];
  }) => {
    const current = {
      procurements: newState.procurements || procurements,
      ingredients: newState.ingredients || ingredients,
      categories: newState.categories || categories,
      units: newState.units || units,
      suppliers: newState.suppliers || suppliers,
      employees: newState.employees || employees,
      stockLedgers: newState.stockLedgers || stockLedgers,
      sppgUnits: newState.sppgUnits || sppgUnits,
      budgetAllocations: newState.budgetAllocations || budgetAllocations,
      adminUsers: newState.adminUsers || adminUsers,
    };

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }

    // Simpan ke server supaya PC dan HP lihat data yang sama.
    // ponytail: whole-document last-write-wins; pecah ke endpoint per-entitas kalau nanti perlu edit bersamaan.
    if (!hydratedRef.current) return;
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: current }),
    }).catch(() => {
      // offline — data tetap aman di cache lokal
    });
  };

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
    window.location.href = '/login';
  };

  const addProcurement = (proc: Omit<ProcurementTransaction, 'id' | 'createdAt'>) => {
    const id = `TRX-2026-${Date.now().toString().slice(-4)}`;
    const newProc: ProcurementTransaction = {
      ...proc,
      id,
      createdAt: new Date().toISOString(),
    };
    const updated = [newProc, ...procurements];
    setProcurements(updated);

    // Also update SPPG unit realized spending
    // Nota 'ALL' dibagi rata ke tiap unit supaya total KPI tidak berlipat.
    // ponytail: asumsi bagi rata; ganti ke rincian per unit kalau nanti diminta.
    const share = proc.sppgUnitId === 'ALL' ? proc.actualReceiptTotal / (sppgUnits.length || 1) : proc.actualReceiptTotal;
    const updatedUnits = sppgUnits.map((u) => {
      if (proc.sppgUnitId === 'ALL' || u.id === proc.sppgUnitId) {
        const totalRealized = u.totalRealized + share;
        const totalRemaining = u.activeBudget - totalRealized;
        return { ...u, totalRealized, totalRemaining };
      }
      return u;
    });
    setSppgUnits(updatedUnits);

    // Also update Supplier spent total
    const updatedSuppliers = suppliers.map((s) => {
      if (s.id === proc.supplierId) {
        return {
          ...s,
          totalDisbursed: s.totalDisbursed + proc.actualReceiptTotal,
          totalTransactions: s.totalTransactions + 1,
        };
      }
      return s;
    });
    setSuppliers(updatedSuppliers);

    saveState({ procurements: updated, sppgUnits: updatedUnits, suppliers: updatedSuppliers });
  };

  const deleteProcurement = (id: string) => {
    const target = procurements.find((p) => p.id === id);
    if (!target) return;

    const updated = procurements.filter((p) => p.id !== id);
    const share = target.sppgUnitId === 'ALL' ? target.actualReceiptTotal / (sppgUnits.length || 1) : target.actualReceiptTotal;
    const updatedUnits = sppgUnits.map((u) => {
      if (target.sppgUnitId === 'ALL' || u.id === target.sppgUnitId) {
        const totalRealized = Math.max(0, u.totalRealized - share);
        return { ...u, totalRealized, totalRemaining: u.activeBudget - totalRealized };
      }
      return u;
    });
    const updatedSuppliers = suppliers.map((s) =>
      s.id === target.supplierId
        ? {
            ...s,
            totalDisbursed: Math.max(0, s.totalDisbursed - target.actualReceiptTotal),
            totalTransactions: Math.max(0, s.totalTransactions - 1),
          }
        : s
    );

    setProcurements(updated);
    setSppgUnits(updatedUnits);
    setSuppliers(updatedSuppliers);
    saveState({ procurements: updated, sppgUnits: updatedUnits, suppliers: updatedSuppliers });
  };

  const updateAuditStatus = (id: string, status: AuditStatus, auditNotes: string, auditorName: string) => {
    const updated = procurements.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          status,
          auditNotes,
          auditedBy: auditorName,
          auditedAt: new Date().toISOString(),
          items: p.items.map((it) => ({
            ...it,
            isItemVerified: status === 'VERIFIED',
          })),
        };
      }
      return p;
    });
    setProcurements(updated);
    saveState({ procurements: updated });
  };

  const addIngredient = (ing: Omit<MasterIngredient, 'id' | 'code' | 'updatedAt'>) => {
    const id = `ING-${Date.now().toString().slice(-4)}`;
    const code = `ING-${ing.category.substring(0, 3).toUpperCase()}-${(ingredients.length + 1).toString().padStart(3, '0')}`;
    const newIng: MasterIngredient = {
      ...ing,
      id,
      code,
      updatedAt: new Date().toISOString(),
    };
    const updated = [newIng, ...ingredients];
    setIngredients(updated);
    saveState({ ingredients: updated });
  };

  const updateIngredient = (id: string, ingData: Partial<MasterIngredient>) => {
    const updated = ingredients.map((item) => (item.id === id ? { ...item, ...ingData, updatedAt: new Date().toISOString() } : item));
    setIngredients(updated);
    saveState({ ingredients: updated });
  };

  const deleteIngredient = (id: string) => {
    const updated = ingredients.filter((item) => item.id !== id);
    setIngredients(updated);
    saveState({ ingredients: updated });
  };

  const addCategory = (cat: Omit<IngredientCategory, 'id'>) => {
    const id = `CAT-${(categories.length + 1).toString().padStart(2, '0')}`;
    const updated = [...categories, { ...cat, id }];
    setCategories(updated);
    saveState({ categories: updated });
  };

  const deleteCategory = (id: string) => {
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    saveState({ categories: updated });
  };

  const addUnit = (unit: Omit<MasterUnit, 'id'>) => {
    const id = `UNIT-${unit.symbol.toUpperCase()}`;
    const updated = [...units, { ...unit, id }];
    setUnits(updated);
    saveState({ units: updated });
  };

  const deleteUnit = (id: string) => {
    const updated = units.filter((u) => u.id !== id);
    setUnits(updated);
    saveState({ units: updated });
  };

  const recordStockMutation = (entry: Omit<StockLedgerEntry, 'id' | 'timestamp' | 'remainingStockAfter'>) => {
    const targetIngredient = ingredients.find((i) => i.id === entry.ingredientId);
    if (!targetIngredient) return;

    let newStock = targetIngredient.currentStock;
    const currentUnitStock = targetIngredient.sppgDistribution[entry.sppgUnitId] || 0;
    let newUnitStock = currentUnitStock;

    if (entry.type === 'MASUK') {
      newStock += entry.quantity;
      newUnitStock += entry.quantity;
    } else {
      newStock = Math.max(0, newStock - entry.quantity);
      newUnitStock = Math.max(0, newUnitStock - entry.quantity);
    }

    const updatedIngredients = ingredients.map((i) => {
      if (i.id === entry.ingredientId) {
        return {
          ...i,
          currentStock: newStock,
          sppgDistribution: {
            ...i.sppgDistribution,
            [entry.sppgUnitId]: newUnitStock,
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return i;
    });
    setIngredients(updatedIngredients);

    const newLedger: StockLedgerEntry = {
      ...entry,
      id: `LED-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      remainingStockAfter: newStock,
    };
    const updatedLedgers = [newLedger, ...stockLedgers];
    setStockLedgers(updatedLedgers);

    saveState({ ingredients: updatedIngredients, stockLedgers: updatedLedgers });
  };

  const addSupplier = (sup: Omit<SupplierDirectory, 'id' | 'code' | 'totalDisbursed' | 'totalTransactions'>) => {
    const id = `SUP-${(suppliers.length + 1).toString().padStart(2, '0')}`;
    const code = `CV-${sup.name.slice(0, 3).toUpperCase()}-${id}`;
    const newSup: SupplierDirectory = {
      ...sup,
      id,
      code,
      totalDisbursed: 0,
      totalTransactions: 0,
    };
    const updated = [...suppliers, newSup];
    setSuppliers(updated);
    saveState({ suppliers: updated });
  };

  const addEmployee = (emp: Omit<EmployeeDirectory, 'id' | 'employeeNumber' | 'totalRequested' | 'totalRealized' | 'pendingBalance'>) => {
    const id = `EMP-${Date.now().toString().slice(-4)}`;
    const employeeNumber = `EMP-${emp.sppgUnitId.replace('SPPG-', '')}-${(employees.length + 1).toString().padStart(2, '0')}`;
    const newEmp: EmployeeDirectory = {
      ...emp,
      id,
      employeeNumber,
      totalRequested: 0,
      totalRealized: 0,
      pendingBalance: 0,
    };
    const updated = [...employees, newEmp];
    setEmployees(updated);
    saveState({ employees: updated });
  };

  // 'ALL' = dana gabungan semua unit → dibagi rata supaya total anggaran tidak berlipat
  // ponytail: asumsi bagi rata; ganti ke rincian per unit kalau nanti diminta.
  const applyBudgetToUnits = (units: SppgUnit[], sppgUnitId: string, delta: number) => {
    const share = sppgUnitId === 'ALL' ? delta / (units.length || 1) : delta;
    return units.map((u) => {
      if (sppgUnitId === 'ALL' || u.id === sppgUnitId) {
        const newBudgetTotal = Math.max(0, u.activeBudget + share);
        return { ...u, activeBudget: newBudgetTotal, totalRemaining: newBudgetTotal - u.totalRealized };
      }
      return u;
    });
  };

  const addBudgetAllocation = (
    item: Omit<BudgetAllocationItem, 'id' | 'allocatedDate'> & { allocatedDate?: string }
  ) => {
    addBudgetAllocationsBulk([item]);
  };

  /** Tambah banyak catatan sekaligus (dipakai import Excel) — satu simpan, satu sinkron. */
  const addBudgetAllocationsBulk = (
    items: Array<Omit<BudgetAllocationItem, 'id' | 'allocatedDate'> & { allocatedDate?: string }>
  ) => {
    if (items.length === 0) return;

    const created: BudgetAllocationItem[] = items.map((item, i) => ({
      ...item,
      id: `BUD-${Date.now().toString().slice(-6)}-${i}`,
      allocatedDate: item.allocatedDate || new Date().toISOString(),
    }));

    const updated = [...created, ...budgetAllocations];
    setBudgetAllocations(updated);

    const updatedUnits = created.reduce(
      (units, item) => applyBudgetToUnits(units, item.sppgUnitId, item.amountAllocated),
      sppgUnits
    );
    setSppgUnits(updatedUnits);

    saveState({ budgetAllocations: updated, sppgUnits: updatedUnits });
  };

  const deleteBudgetAllocation = (id: string) => {
    const target = budgetAllocations.find((b) => b.id === id);
    if (!target) return;

    const updated = budgetAllocations.filter((b) => b.id !== id);
    setBudgetAllocations(updated);

    const updatedUnits = applyBudgetToUnits(sppgUnits, target.sppgUnitId, -target.amountAllocated);
    setSppgUnits(updatedUnits);

    saveState({ budgetAllocations: updated, sppgUnits: updatedUnits });
  };

  const addSppgUnit = (unit: Omit<SppgUnit, 'id' | 'totalRealized' | 'totalRemaining'>) => {
    const id = `SPPG-${unit.code.replace('SPPG-', '')}` as SppgUnitId;
    const newUnit: SppgUnit = {
      ...unit,
      id,
      totalRealized: 0,
      totalRemaining: unit.activeBudget,
    };
    const updated = [...sppgUnits, newUnit];
    setSppgUnits(updated);
    saveState({ sppgUnits: updated });
  };

  const updateSppgUnit = (id: string, data: Partial<SppgUnit>) => {
    const updated = sppgUnits.map((u) => (u.id === id ? { ...u, ...data } : u));
    setSppgUnits(updated);
    saveState({ sppgUnits: updated });
  };

  const deleteSppgUnit = (id: string) => {
    const updated = sppgUnits.filter((u) => u.id !== id);
    setSppgUnits(updated);
    saveState({ sppgUnits: updated });
  };

  const addAdminUser = (user: Omit<AdminUserItem, 'id' | 'createdAt'>) => {
    const id = `ADM-${Date.now().toString().slice(-4)}`;
    const newAdmin: AdminUserItem = {
      ...user,
      id,
      createdAt: new Date().toISOString(),
    };
    const updated = [...adminUsers, newAdmin];
    setAdminUsers(updated);
    saveState({ adminUsers: updated });
  };

  const deleteAdminUser = (id: string) => {
    const updated = adminUsers.filter((u) => u.id !== id);
    setAdminUsers(updated);
    saveState({ adminUsers: updated });
  };

  const resetToDefault = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setSppgUnits(INITIAL_SPPG_UNITS);
    setBudgetAllocations(INITIAL_BUDGET_ALLOCATIONS);
    setProcurements(INITIAL_PROCUREMENTS);
    setIngredients(INITIAL_INGREDIENTS);
    setCategories(INITIAL_CATEGORIES);
    setUnits(INITIAL_UNITS);
    setSuppliers(INITIAL_SUPPLIERS);
    setEmployees(INITIAL_EMPLOYEES);
    setStockLedgers(INITIAL_STOCK_LEDGERS);
    setAdminUsers(INITIAL_ADMIN_USERS);
    saveState({
      sppgUnits: INITIAL_SPPG_UNITS,
      budgetAllocations: INITIAL_BUDGET_ALLOCATIONS,
      procurements: INITIAL_PROCUREMENTS,
      ingredients: INITIAL_INGREDIENTS,
      categories: INITIAL_CATEGORIES,
      units: INITIAL_UNITS,
      suppliers: INITIAL_SUPPLIERS,
      employees: INITIAL_EMPLOYEES,
      stockLedgers: INITIAL_STOCK_LEDGERS,
      adminUsers: INITIAL_ADMIN_USERS,
    });
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

  // Computed KPI Summary
  const kpiSummary = useMemo<KPISummary>(() => {
    const targetUnits =
      selectedSppgUnit === 'ALL'
        ? sppgUnits
        : sppgUnits.filter((u) => u.id === selectedSppgUnit);

    const totalBudgetIncome = targetUnits.reduce((acc, u) => acc + u.activeBudget, 0);
    const totalActualSpending = targetUnits.reduce((acc, u) => acc + u.totalRealized, 0);
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
  }, [selectedSppgUnit, sppgUnits, ingredients]);

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
        deleteCategory,
        addUnit,
        deleteUnit,
        recordStockMutation,
        addSupplier,
        addEmployee,
        addBudgetAllocation,
        addBudgetAllocationsBulk,
        deleteBudgetAllocation,
        addSppgUnit,
        updateSppgUnit,
        deleteSppgUnit,
        addAdminUser,
        deleteAdminUser,
        logout,
        resetToDefault,
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
