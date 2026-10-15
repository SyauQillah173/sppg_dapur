'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import {
  Database,
  CheckCircle2,
  Copy,
  Download,
  Server,
  Layers,
  FileCode,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

export function DatabaseViewerModal() {
  const { sppgUnits, procurements, ingredients, categories, units, suppliers, employees, stockLedgers } = useStore();
  const [copied, setCopied] = useState<boolean>(false);

  const neonConnectionString = 'postgresql://neondb_owner:npg_password@ep-giziflow-sppg-production.us-east-2.aws.neon.tech/giziflow_db?sslmode=require';

  const handleCopy = () => {
    navigator.clipboard.writeText(neonConnectionString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportFullJSON = () => {
    const fullBackup = {
      meta: {
        system: 'GiziFlow Enterprise ERP',
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        dbDriver: 'Neon PostgreSQL / Prisma',
      },
      sppgUnits,
      procurements,
      ingredients,
      categories,
      units,
      suppliers,
      employees,
      stockLedgers,
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GiziFlow_DB_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="border-b border-slate-200 pb-3 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Arsitektur Database Neon PostgreSQL & ORM Prisma
            </h1>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-mono font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Manajemen skema database relasional multi-unit SPPG, isolasi data transaksi keuangan, dan backup SPJ
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportFullJSON}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 transition"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Ekspor Full Database (JSON)</span>
        </button>
      </div>

      {/* Database Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Tabel SppgUnit</span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">4 Unit</div>
          <span className="text-[10px] text-slate-400">Pre-configured</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Tabel Procurement & Items</span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">
            {procurements.length} Nota / {procurements.reduce((acc, p) => acc + p.items.length, 0)} Items
          </div>
          <span className="text-[10px] text-slate-400">Ratusan Juta Rp</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Tabel Master Ingredient</span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">
            {ingredients.length} Bahan
          </div>
          <span className="text-[10px] text-slate-400">20 Real Client Data</span>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Tabel StockLedger</span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">
            {stockLedgers.length} Mutasi
          </div>
          <span className="text-[10px] text-slate-400">Audit Trail Dapur</span>
        </div>
      </div>

      {/* Connection string snippet */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-blue-600" />
            Neon PostgreSQL Serverless Connection URI
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium"
          >
            <Copy className="h-3 w-3" />
            <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Connection String'}</span>
          </button>
        </div>
        <div className="rounded bg-slate-950 p-2.5 font-mono text-xs text-slate-200 overflow-x-auto select-all">
          {neonConnectionString}
        </div>
      </div>

      {/* Prisma Schema Code Preview */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
            <FileCode className="h-3.5 w-3.5 text-emerald-600" />
            Prisma Schema Definition (`prisma/schema.prisma`)
          </span>
          <span className="font-mono text-[10px] text-slate-400">PostgreSQL Provider</span>
        </div>

        <pre className="rounded bg-slate-950 p-3.5 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
{`datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model SppgUnit {
  id           String        @id @default(cuid())
  code         String        @unique // SPPG-AA02, SPPG-BS02, SPPG-DR01, SPPG-SM01
  name         String        // "SPPG ABAR ABIR 02", dll
  location     String
  picName      String
  phone        String
  activeBudget Decimal       @db.Decimal(15, 2)
  procurements Procurement[]
  stockLedgers StockLedger[]
}

model Procurement {
  id                 String            @id @default(cuid())
  receiptNumber      String            @unique // NOTA-AA02-xxxx
  date               DateTime
  sppgUnitId         String
  amountRequested    Decimal           @db.Decimal(15, 2) // e.g. Rp 150.000.000
  actualReceiptTotal Decimal           @db.Decimal(15, 2) // e.g. Rp 147.850.000
  changeReturned     Decimal           @db.Decimal(15, 2) // e.g. Rp 2.150.000
  status             AuditStatus       @default(PENDING_AUDIT)
  receiptPhotoUrl    String?
  items              ProcurementItem[]
  auditLogs          AuditLog[]
}

model ProcurementItem {
  id             String      @id @default(cuid())
  procurementId  String
  name           String      // "Ayam giling", "Melon", dll
  category       String
  quantity       Decimal     @db.Decimal(10, 2)
  unit           String      // "Kg", "Pack", "Karung", dll
  unitPrice      Decimal     @db.Decimal(15, 2)
  subtotal       Decimal     @db.Decimal(15, 2)
  isItemVerified Boolean     @default(false)
}

model Ingredient {
  id            String        @id @default(cuid())
  code          String        @unique
  name          String        // 20 pre-seeded client items
  currentStock  Decimal       @db.Decimal(10, 2)
  defaultUnit   String
  stockLedgers  StockLedger[]
}`}
        </pre>
      </div>

      {/* CLI Migration Commands Helper */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60 text-xs text-slate-700 dark:text-zinc-300 space-y-2">
        <div className="font-semibold flex items-center gap-1.5 text-slate-900 dark:text-zinc-100">
          <Terminal className="h-4 w-4" />
          Perintah Sinkronisasi Database Prisma ke Neon PostgreSQL:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
          <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
            <span className="text-slate-400"># Validasi skema Prisma:</span>
            <div className="text-blue-600 dark:text-blue-400 font-bold">npx prisma validate</div>
          </div>
          <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
            <span className="text-slate-400"># Push skema ke Neon DB:</span>
            <div className="text-blue-600 dark:text-blue-400 font-bold">npx prisma db push</div>
          </div>
        </div>
      </div>
    </div>
  );
}
