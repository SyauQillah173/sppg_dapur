/**
 * Pemetaan baris tabel → bentuk yang dipakai aplikasi.
 * Angka Decimal dari Prisma datang sebagai string di JSON, jadi selalu di-Number().
 */
import { SppgUnit, SupplierDirectory, EmployeeDirectory, MasterIngredient, IngredientCategory, MasterUnit, BudgetAllocationItem, StockLedgerEntry } from './types';

const num = (v: unknown) => Number(v) || 0;
export const SEMUA_SPPG_NAME = 'Semua SPPG (Gabungan 4 Unit)';

export function toSppgUnit(row: any): SppgUnit {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    shortName: row.shortName || row.code,
    location: row.location || '',
    picName: row.picName || '',
    phone: row.phone || '',
    activeBudget: num(row.activeBudget),
    totalRealized: num(row.totalRealized),
    totalRemaining: num(row.totalRemaining),
  };
}

export function toSupplier(row: any): SupplierDirectory {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    picName: row.picName || '-',
    phone: row.phone || '-',
    address: row.address || '-',
    bankAccount: row.bankAccount || '-',
    suppliedCategory: row.suppliedCategory || '-',
    totalDisbursed: num(row.totalDisbursed),
    totalTransactions: num(row.totalTransactions),
    rating: num(row.rating),
    activeStatus: row.activeStatus !== false,
  };
}

export function toEmployee(row: any): EmployeeDirectory {
  return {
    id: row.id,
    employeeNumber: row.employeeNumber || row.id,
    name: row.name,
    roleTitle: row.roleTitle || 'Staf Pengadaan',
    sppgUnitId: row.sppgUnitId,
    sppgUnitName: row.sppgUnit?.name || row.sppgUnitId,
    phone: row.phone || '-',
    totalRequested: num(row.totalRequested),
    totalRealized: num(row.totalRealized),
    pendingBalance: num(row.pendingBalance),
    complianceScore: num(row.complianceScore) || 100,
    status: row.status || 'ACTIVE',
  };
}

export function toIngredient(row: any): MasterIngredient {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category?.name || '',
    categoryId: row.categoryId,
    defaultUnit: row.defaultUnit || 'Kg',
    currentStock: num(row.currentStock),
    minStockAlert: num(row.minStockAlert),
    lastPurchasePrice: num(row.lastPurchasePrice),
    sppgDistribution: (row.sppgDistribution || {}) as Record<string, number>,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export function toCategory(row: any): IngredientCategory {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    color: row.color || '#ef4444',
    description: row.description || '',
  };
}

export function toMasterUnit(row: any): MasterUnit {
  return { id: row.id, symbol: row.symbol, name: row.name, type: row.type || 'BERAT' };
}

export function toStockLedger(row: any): StockLedgerEntry {
  return {
    id: row.id,
    timestamp: new Date(row.timestamp).toISOString(),
    sppgUnitId: row.sppgUnitId,
    sppgUnitName: row.sppgUnit?.name || row.sppgUnitId,
    ingredientId: row.ingredientId,
    ingredientName: row.ingredient?.name || row.ingredientId,
    category: row.ingredient?.category?.name || '',
    type: row.type,
    quantity: num(row.quantity),
    unit: row.unit || 'Kg',
    referenceNumber: row.referenceNumber || '-',
    purpose: row.purpose || '-',
    recordedBy: row.recordedBy || '-',
    remainingStockAfter: num(row.remainingStockAfter),
  };
}

/** Nama unit ditampilkan di UI; baris 'ALL' tidak punya baris di tabel sppg_units. */
export function budgetUnitName(sppgUnitId: string, units: SppgUnit[]): string {
  if (sppgUnitId === 'ALL') return SEMUA_SPPG_NAME;
  return units.find((u) => u.id === sppgUnitId)?.name || sppgUnitId;
}

export function toBudget(row: any, units: SppgUnit[]): BudgetAllocationItem {
  let meta: any = {};
  let noteText = row.notes || '';
  if (row.notes && typeof row.notes === 'string' && (row.notes.startsWith('{') || row.notes.startsWith('['))) {
    try {
      meta = JSON.parse(row.notes);
      noteText = meta.note || '';
    } catch {
      // not JSON, keep as is
    }
  }

  return {
    id: row.id,
    sppgUnitId: row.sppgUnitId,
    sppgUnitName: budgetUnitName(row.sppgUnitId, units),
    fiscalPeriod: row.fiscalPeriod,
    amountAllocated: num(row.amountAllocated),
    amountRealized: num(row.amountRealized),
    remainingBudget: num(row.remainingBudget),
    allocatedDate: new Date(row.allocatedDate).toISOString(),
    notes: noteText,
    rawNotes: row.notes || '',
    requestedBy: row.requestedBy || meta.requestedBy || '',
    requesterFor: row.requesterFor || meta.requesterFor || '',
    cashHolder: row.cashHolder || meta.cashHolder || '',
    transferProofUrl: row.transferProofUrl || meta.transferProofUrl || '',
    withdrawnAmount: num(row.withdrawnAmount ?? meta.withdrawnAmount),
    withdrawnAt: row.withdrawnAt || meta.withdrawnAt || undefined,
    withdrawnBy: row.withdrawnBy || meta.withdrawnBy || '',
    withdrawnRecipient: row.withdrawnRecipient || meta.withdrawnRecipient || '',
    withdrawnSpender: row.withdrawnSpender || meta.withdrawnSpender || '',
    withdrawnProofUrl: row.withdrawnProofUrl || meta.withdrawnProofUrl || '',
    withdrawnNote: row.withdrawnNote || meta.withdrawnNote || '',
  };
}
