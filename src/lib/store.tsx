'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
} from './initial-data';

interface ModalState {
  type: 'INSPECT_RECEIPT' | 'AI_SCANNER' | 'ADD_PROCUREMENT' | 'ADD_INGREDIENT' | 'EDIT_INGREDIENT' | 'RECORD_MUTATION' | 'ADD_SUPPLIER' | 'ADD_EMPLOYEE' | null;
  data?: any;
}

interface StoreContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  selectedSppgUnit: SppgUnitId | 'ALL';
  setSelectedSppgUnit: (unitId: SppgUnitId | 'ALL') => void;
  sppgUnits: SppgUnit[];
  procurements: ProcurementTransaction[];
  ingredients: MasterIngredient[];
  categories: IngredientCategory[];
  units: MasterUnit[];
  suppliers: SupplierDirectory[];
  employees: EmployeeDirectory[];
  stockLedgers: StockLedgerEntry[];
  modal: ModalState;
  openModal: (type: ModalState['type'], data?: any) => void;
  closeModal: () => void;

  // Actions
  addProcurement: (proc: Omit<ProcurementTransaction, 'id' | 'createdAt'>) => void;
  updateAuditStatus: (id: string, status: AuditStatus, auditorNotes: string, auditorName: string) => void;
  addIngredient: (ing: Omit<MasterIngredient, 'id' | 'code' | 'updatedAt'>) => void;
  updateIngredient: (id: string, ing: Partial<MasterIngredient>) => void;
  deleteIngredient: (id: string) => void;
  addCategory: (cat: Omit<IngredientCategory, 'id'>) => void;
  addUnit: (unit: Omit<MasterUnit, 'id'>) => void;
  recordStockMutation: (entry: Omit<StockLedgerEntry, 'id' | 'timestamp' | 'remainingStockAfter'>) => void;
  addSupplier: (sup: Omit<SupplierDirectory, 'id' | 'code' | 'totalDisbursed' | 'totalTransactions'>) => void;
  addEmployee: (emp: Omit<EmployeeDirectory, 'id' | 'employeeNumber' | 'totalRequested' | 'totalRealized' | 'pendingBalance'>) => void;
  resetToDefault: () => void;

  // Computed
  kpiSummary: KPISummary;
  filteredProcurements: ProcurementTransaction[];
  filteredIngredients: MasterIngredient[];
  filteredStockLedgers: StockLedgerEntry[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'giziflow_enterprise_store_v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>('SUPERADMIN');
  const [selectedSppgUnit, setSelectedSppgUnit] = useState<SppgUnitId | 'ALL'>('ALL');
  const [sppgUnits, setSppgUnits] = useState<SppgUnit[]>(INITIAL_SPPG_UNITS);
  const [procurements, setProcurements] = useState<ProcurementTransaction[]>(INITIAL_PROCUREMENTS);
  const [ingredients, setIngredients] = useState<MasterIngredient[]>(INITIAL_INGREDIENTS);
  const [categories, setCategories] = useState<IngredientCategory[]>(INITIAL_CATEGORIES);
  const [units, setUnits] = useState<MasterUnit[]>(INITIAL_UNITS);
  const [suppliers, setSuppliers] = useState<SupplierDirectory[]>(INITIAL_SUPPLIERS);
  const [employees, setEmployees] = useState<EmployeeDirectory[]>(INITIAL_EMPLOYEES);
  const [stockLedgers, setStockLedgers] = useState<StockLedgerEntry[]>(INITIAL_STOCK_LEDGERS);
  const [modal, setModal] = useState<ModalState>({ type: null });

  // Load from localStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.procurements) setProcurements(parsed.procurements);
        if (parsed.ingredients) setIngredients(parsed.ingredients);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.units) setUnits(parsed.units);
        if (parsed.suppliers) setSuppliers(parsed.suppliers);
        if (parsed.employees) setEmployees(parsed.employees);
        if (parsed.stockLedgers) setStockLedgers(parsed.stockLedgers);
        if (parsed.sppgUnits) setSppgUnits(parsed.sppgUnits);
      }
    } catch {
      // ignore
    }
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
  }) => {
    try {
      const current = {
        procurements: newState.procurements || procurements,
        ingredients: newState.ingredients || ingredients,
        categories: newState.categories || categories,
        units: newState.units || units,
        suppliers: newState.suppliers || suppliers,
        employees: newState.employees || employees,
        stockLedgers: newState.stockLedgers || stockLedgers,
        sppgUnits: newState.sppgUnits || sppgUnits,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  };

  const openModal = (type: ModalState['type'], data?: any) => {
    setModal({ type, data });
  };

  const closeModal = () => {
    setModal({ type: null });
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
    const updatedUnits = sppgUnits.map((u) => {
      if (u.id === proc.sppgUnitId) {
        const totalRealized = u.totalRealized + proc.actualReceiptTotal;
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

  const addUnit = (unit: Omit<MasterUnit, 'id'>) => {
    const id = `UNIT-${unit.symbol.toUpperCase()}`;
    const updated = [...units, { ...unit, id }];
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

  const resetToDefault = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setSppgUnits(INITIAL_SPPG_UNITS);
    setProcurements(INITIAL_PROCUREMENTS);
    setIngredients(INITIAL_INGREDIENTS);
    setCategories(INITIAL_CATEGORIES);
    setUnits(INITIAL_UNITS);
    setSuppliers(INITIAL_SUPPLIERS);
    setEmployees(INITIAL_EMPLOYEES);
    setStockLedgers(INITIAL_STOCK_LEDGERS);
  };

  // Filtered procurements based on selected SPPG Unit
  const filteredProcurements = useMemo(() => {
    if (selectedSppgUnit === 'ALL') return procurements;
    return procurements.filter((p) => p.sppgUnitId === selectedSppgUnit);
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

  // Computed KPI Summary
  const kpiSummary = useMemo<KPISummary>(() => {
    const targetUnits = selectedSppgUnit === 'ALL'
      ? sppgUnits
      : sppgUnits.filter((u) => u.id === selectedSppgUnit);

    const totalBudgetIncome = targetUnits.reduce((acc, u) => acc + u.activeBudget, 0);

    const targetProcurements = selectedSppgUnit === 'ALL'
      ? procurements
      : procurements.filter((p) => p.sppgUnitId === selectedSppgUnit);

    const totalActualSpending = targetProcurements.reduce((acc, p) => acc + p.actualReceiptTotal, 0);
    const activeRemainingCash = Math.max(0, totalBudgetIncome - totalActualSpending);
    const budgetUsedPercentage = totalBudgetIncome > 0 ? (totalActualSpending / totalBudgetIncome) * 100 : 0;

    // Kitchen Volume in Kg
    let totalKitchenVolumeKg = 0;
    ingredients.forEach((ing) => {
      if (ing.defaultUnit === 'Kg') {
        if (selectedSppgUnit === 'ALL') {
          totalKitchenVolumeKg += ing.currentStock;
        } else {
          totalKitchenVolumeKg += ing.sppgDistribution[selectedSppgUnit] || 0;
        }
      }
    });

    const totalKitchenItemCount = ingredients.length;

    return {
      totalBudgetIncome,
      totalActualSpending,
      activeRemainingCash,
      budgetUsedPercentage,
      totalKitchenVolumeKg,
      totalKitchenItemCount,
    };
  }, [selectedSppgUnit, sppgUnits, procurements, ingredients]);

  return (
    <StoreContext.Provider
      value={{
        userRole,
        setUserRole,
        selectedSppgUnit,
        setSelectedSppgUnit,
        sppgUnits,
        procurements,
        ingredients,
        categories,
        units,
        suppliers,
        employees,
        stockLedgers,
        modal,
        openModal,
        closeModal,
        addProcurement,
        updateAuditStatus,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        addCategory,
        addUnit,
        recordStockMutation,
        addSupplier,
        addEmployee,
        resetToDefault,
        kpiSummary,
        filteredProcurements,
        filteredIngredients,
        filteredStockLedgers,
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
