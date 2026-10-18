// GiziFlow Enterprise Type Definitions

export type UserRole = 'SUPERADMIN' | 'EXECUTIVE_AUDITOR';

export type SppgUnitId = 'SPPG-AA02' | 'SPPG-BS02' | 'SPPG-DR01' | 'SPPG-SM01';

export interface SppgUnit {
  id: SppgUnitId;
  code: string;
  name: string;
  shortName: string;
  location: string;
  picName: string;
  phone: string;
  activeBudget: number;
  totalRealized: number;
  totalRemaining: number;
}

export type AuditStatus = 'VERIFIED' | 'PENDING_AUDIT' | 'FLAGGED_DISCREPANCY';

export interface ProcurementItem {
  id: string;
  ingredientId?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  isOcrMatched: boolean;
  isItemVerified: boolean;
  hasPriceAnomaly?: boolean;
  previousAvgPrice?: number;
}

export interface ProcurementTransaction {
  id: string;
  receiptNumber: string; // e.g. NOTA/2026/AA02/1042
  date: string; // YYYY-MM-DD
  sppgUnitId: SppgUnitId | 'ALL'; // 'ALL' = nota belanja gabungan semua unit
  sppgUnitName: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  supplierId: string;
  supplierName: string;
  supplierAddress: string;
  amountRequested: number; // e.g. Rp 150.000.000
  actualReceiptTotal: number; // e.g. Rp 147.850.000
  changeReturned: number; // e.g. Rp 2.150.000
  status: AuditStatus;
  receiptPhotoUrl: string;
  physicalReceiptImage: string; // high-resolution visual SVG / canvas representation
  items: ProcurementItem[];
  auditedBy?: string;
  auditedAt?: string;
  auditNotes?: string;
  discrepancyReason?: string;
  notes?: string;
  fundingSource?: 'DANA_HARI_INI' | 'SISA_SEBELUMNYA' | 'KAS_GABUNGAN';
  isChangeReturned?: boolean;
  returnProofUrl?: string;
  returnedAt?: string;
  returnedBy?: string;
  returnedTo?: string;
  returnNotes?: string;
  createdAt: string;
}

export interface IngredientCategory {
  id: string;
  name: string;
  code: string;
  color: string;
  description: string;
}

export interface MasterUnit {
  id: string;
  name: string;
  symbol: string;
  type: 'WEIGHT' | 'VOLUME' | 'PIECE' | 'PACKAGING';
}

export interface MasterIngredient {
  id: string;
  code: string;
  name: string;
  category: string;
  categoryId: string;
  defaultUnit: string;
  currentStock: number;
  minStockAlert: number;
  lastPurchasePrice: number;
  sppgDistribution: Record<SppgUnitId, number>; // stock per kitchen unit
  updatedAt: string;
}

export type StockMutationType = 'MASUK' | 'KELUAR';

export interface StockLedgerEntry {
  id: string;
  timestamp: string;
  sppgUnitId: SppgUnitId;
  sppgUnitName: string;
  ingredientId: string;
  ingredientName: string;
  category: string;
  type: StockMutationType;
  quantity: number;
  unit: string;
  referenceNumber: string;
  purpose: string;
  recordedBy: string;
  remainingStockAfter: number;
}

export interface SupplierDirectory {
  id: string;
  code: string;
  name: string;
  picName: string;
  phone: string;
  address: string;
  bankAccount: string;
  suppliedCategory: string;
  totalDisbursed: number;
  totalTransactions: number;
  activeStatus: boolean;
  rating: number;
}

export interface EmployeeDirectory {
  id: string;
  employeeNumber: string;
  name: string;
  roleTitle: string;
  sppgUnitId: SppgUnitId;
  sppgUnitName: string;
  phone: string;
  totalRequested: number;
  totalRealized: number;
  pendingBalance: number;
  complianceScore: number; // % on-time receipt submission
  status: 'ACTIVE' | 'FLAGGED' | 'ON_LEAVE';
}

export interface AuditActionPayload {
  procurementId: string;
  status: AuditStatus;
  auditorName: string;
  auditNotes: string;
}

export interface KPISummary {
  totalBudgetIncome: number; // Total Pemasukan Anggaran (Rp)
  totalActualSpending: number; // Total Realisasi Belanja (Rp)
  activeRemainingCash: number; // Sisa Uang Belanja / Kas Aktif (Rp)
  budgetUsedPercentage: number; // % terpakai
  totalKitchenVolumeKg: number; // Total Volume Bahan Dapur Masuk/Keluar (Kg)
  totalKitchenItemCount: number; // Total items
}

export interface BudgetAllocationItem {
  id: string;
  sppgUnitId: string;
  sppgUnitName: string;
  fiscalPeriod: string;
  amountAllocated: number;
  amountRealized: number;
  remainingBudget: number;
  allocatedDate: string;
  notes?: string;
  rawNotes?: string;
  requestedBy?: string;
  requesterFor?: string;
  cashHolder?: string;
  transferProofUrl?: string;
  withdrawnAmount?: number;
  withdrawnAt?: string;
  withdrawnBy?: string;
  withdrawnRecipient?: string;
  withdrawnSpender?: string;
  withdrawnProofUrl?: string;
  withdrawnNote?: string;
}

export interface AdminUserItem {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
}

export interface MealDelivery {
  id: string;
  dispatchNumber: string;
  sppgUnitId: string;
  sppgUnitName: string;
  schoolName: string;
  schoolAddress: string;
  schoolType: 'SD' | 'SMP' | 'MI' | 'SMA' | string;
  contactPerson: string;
  contactPhone: string;
  menuCode: string;
  menuTitle: string;
  menuDetails: {
    carb: string;
    protein: string;
    veggie: string;
    fruit: string;
    dairy: string;
  };
  targetPortions: number;
  deliveredPortions: number;
  absentStudents: number;
  surplusHandling?: string;
  status: 'PREPARING' | 'IN_TRANSIT' | 'ARRIVED' | 'COMPLETED';
  departureTime?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  foodTemperature?: string;
  foodSafetyWindow?: string;
  recipientName?: string;
  recipientNip?: string;
  bastNumber?: string;
  isSigned: boolean;
  deliveryPhotoUrl?: string;
  notes?: string;
  isStockDeducted?: boolean;
  deductedItems?: any[];
  createdAt: string;
}


