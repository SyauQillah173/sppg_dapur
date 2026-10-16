'use client';

import React, { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { formatIDR, formatNumber, formatKg, formatDateIndo } from '@/lib/utils';
import { SppgUnitId } from '@/lib/types';
import {
 Wallet,
 TrendingDown,
 PiggyBank,
 Scale,
 Building2,
 Calendar,
 AlertTriangle,
 CheckCircle2,
 ArrowRight,
 Receipt,
 FileCheck2,
 Layers,
} from 'lucide-react';
import {
 ResponsiveContainer,
 BarChart,
 Bar,
 XAxis,
 YAxis,
 Tooltip,
 Legend,
 PieChart,
 Pie,
 Cell,
 CartesianGrid,
} from 'recharts';

interface ExecutiveDashboardProps {
 onNavigateToProcurement: () => void;
 onNavigateToInventory: () => void;
}

export function ExecutiveDashboard({ onNavigateToProcurement, onNavigateToInventory }: ExecutiveDashboardProps) {
 const {
    kpiSummary,
    selectedSppgUnit,
    setSelectedSppgUnit,
    sppgUnits,
    budgetAllocations,
    procurements,
    categories,
    openModal,
    userRole,
  } = useStore();

  // Unit Spending Comparison Chart Data (Single Source of Truth from budgetAllocations & procurements)
  const unitComparisonData = useMemo(() => {
    const totalAllBudget = budgetAllocations
      .filter((b) => b.sppgUnitId === 'ALL')
      .reduce((acc, b) => acc + b.amountAllocated, 0);
    const unitCount = sppgUnits.length || 1;
    const shareOfAll = totalAllBudget / unitCount;

    return sppgUnits.map((u) => {
      // Find actual procurements in this unit
      const unitProcurements = procurements.filter(
        (p) => p.sppgUnitId === u.id || p.sppgUnitId === u.code
      );
      const realized = unitProcurements.reduce((acc, p) => acc + p.actualReceiptTotal, 0);

      // Unit's direct budget + equal share of general ALL budget
      const directBudget = budgetAllocations
        .filter((b) => b.sppgUnitId === u.id || b.sppgUnitId === u.code)
        .reduce((acc, b) => acc + b.amountAllocated, 0);
      const totalUnitBudget = directBudget + shareOfAll;
      const remaining = Math.max(0, totalUnitBudget - realized);

      return {
        unitCode: u.code.replace('SPPG-', ''),
        shortName: u.shortName,
        fullName: u.name,
        anggaran: totalUnitBudget,
        realisasi: realized,
        sisaKas: remaining,
      };
    });
  }, [sppgUnits, budgetAllocations, procurements]);

 // Category Spending Breakdown Chart Data
 const categorySpendingData = useMemo(() => {
 const targetProcurements = selectedSppgUnit === 'ALL'
 ? procurements
 : procurements.filter((p) => p.sppgUnitId === selectedSppgUnit);

 const totalsByCategory: Record<string, number> = {};

 targetProcurements.forEach((proc) => {
 proc.items.forEach((item) => {
 totalsByCategory[item.category] = (totalsByCategory[item.category] || 0) + item.subtotal;
 });
 });

 const categoryColorMap: Record<string, string> = {
 'Protein Hewani': '#ef4444',
 'Protein Nabati': '#f97316',
 'Sayuran': '#10b981',
 'Buah-buahan': '#eab308',
 'Bumbu & Saus': '#8b5cf6',
 'Sembako & Tepung': '#0284c7',
 };

 const result = Object.entries(totalsByCategory).map(([name, value]) => ({
 name,
 value,
 color: categoryColorMap[name] || '#64748b',
 }));

 return result.sort((a, b) => b.value - a.value);
 }, [selectedSppgUnit, procurements]);

 // High-priority items needing audit attention
 const urgentAuditItems = useMemo(() => {
 return procurements.filter((p) => p.status === 'PENDING_AUDIT' || p.status === 'FLAGGED_DISCREPANCY').slice(0, 4);
 }, [procurements]);

 const activeUnitObject = selectedSppgUnit === 'ALL'
 ? null
 : sppgUnits.find((u) => u.id === selectedSppgUnit);

 return (
 <div className="space-y-6">
 {/* SPPG Unit Filter & Context Pill Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
 <div>
 <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
 {selectedSppgUnit === 'ALL' ? 'Konsolidasi Seluruh Unit SPPG' : activeUnitObject?.name}
 </h1>
 <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
 {selectedSppgUnit === 'ALL'
 ? 'Monitoring arus kas terpadu & mutasi bahan pada 4 Dapur SPPG Gresik'
 : `Alamat: ${activeUnitObject?.location} | PIC: ${activeUnitObject?.picName} (${activeUnitObject?.phone})`}
 </p>
 </div>

 {/* Quick Filter Tabs */}
 <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
 <button
 type="button"
 onClick={() => setSelectedSppgUnit('ALL')}
 className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
 selectedSppgUnit === 'ALL'
 ? 'bg-white text-slate-900 shadow-sm font-semibold'
 : 'text-slate-600 hover:text-slate-900'
 }`}
 >
 Semua Unit
 </button>
 {sppgUnits.map((u) => (
 <button
 key={u.id}
 type="button"
 onClick={() => setSelectedSppgUnit(u.id)}
 className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
 selectedSppgUnit === u.id
 ? 'bg-white text-slate-900 shadow-sm font-semibold'
 : 'text-slate-600 hover:text-slate-900'
 }`}
 >
 {u.shortName}
 </button>
 ))}
 </div>
 </div>

 {/* 4 TOP KPI SUMMARY CARDS */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {/* Card 1: Total Pemasukan Anggaran */}
 <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
 Total Pemasukan Anggaran
 </span>
 <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-50 text-blue-600">
 <Wallet className="h-4 w-4" />
 </div>
 </div>
 <div className="mt-2">
 <div className="text-2xl font-bold tracking-tight font-mono tabular-nums text-slate-900">
 {formatIDR(kpiSummary.totalBudgetIncome)}
 </div>
 <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
 <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-slate-100 font-mono text-slate-700">
 {selectedSppgUnit === 'ALL' ? '4 Unit SPPG' : '1 Unit Dapur'}
 </span>
 <span>Alokasi Periode Berjalan</span>
 </div>
 </div>
 </div>

 {/* Card 2: Total Realisasi Belanja */}
 <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
 Total Realisasi Belanja
 </span>
 <div className="flex h-7 w-7 items-center justify-center rounded bg-rose-50 text-rose-600">
 <TrendingDown className="h-4 w-4" />
 </div>
 </div>
 <div className="mt-2">
 <div className="text-2xl font-bold tracking-tight font-mono tabular-nums text-rose-600">
 {formatIDR(kpiSummary.totalActualSpending)}
 </div>
 <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
 <span className="font-mono font-medium text-slate-700">
 {formatNumber(kpiSummary.budgetUsedPercentage, 1)}%
 </span>
 <span>dari total pagu anggaran</span>
 </div>
 </div>
 </div>

 {/* Card 3: Sisa Uang Belanja / Kas Aktif */}
 <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
 Sisa Kas / Dana Aktif
 </span>
 <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-50 text-emerald-600">
 <PiggyBank className="h-4 w-4" />
 </div>
 </div>
 <div className="mt-2">
 <div className="text-2xl font-bold tracking-tight font-mono tabular-nums text-emerald-600">
 {formatIDR(kpiSummary.activeRemainingCash)}
 </div>
 {/* Progress bar */}
 <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
 <div
 className="h-full bg-emerald-500 rounded-full transition-all duration-500"
 style={{ width: `${Math.min(100, Math.max(0, 100 - kpiSummary.budgetUsedPercentage))}%` }}
 />
 </div>
 <div className="mt-1 text-[11px] text-slate-500 flex justify-between font-mono">
 <span>Sisa: {formatNumber(100 - kpiSummary.budgetUsedPercentage, 1)}%</span>
 <span>Likuid & Siap Belanja</span>
 </div>
 </div>
 </div>

 {/* Card 4: Total Volume Bahan Dapur */}
 <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
 Total Volume Bahan Dapur
 </span>
 <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-50 text-amber-600">
 <Scale className="h-4 w-4" />
 </div>
 </div>
 <div className="mt-2">
 <div className="text-2xl font-bold tracking-tight font-mono tabular-nums text-slate-900">
 {formatKg(kpiSummary.totalKitchenVolumeKg)}
 </div>
 <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
 <span>{kpiSummary.totalKitchenItemCount} Item Master Bahan</span>
 <span className="text-emerald-600 font-semibold">Terkontrol</span>
 </div>
 </div>
 </div>
 </div>

 {/* CHARTS ROW */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Chart 1: Cashflow & Spending Comparison across 4 SPPG units */}
 <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
 <div>
 <h2 className="text-sm font-semibold text-slate-900">
 Perbandingan Realisasi Belanja & Kas per Unit SPPG
 </h2>
 <p className="text-[11px] text-slate-500">
 Monitoring komparasi alokasi pagu anggaran vs realisasi nota fisik SPPG
 </p>
 </div>
 <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 self-start sm:self-auto">
 Mata Uang: IDR (Rp)
 </span>
 </div>

 <div className="h-72 w-full pt-4">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={unitComparisonData} margin={{ top: 10, right: 10, left: 15, bottom: 20 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
 <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
 <YAxis
 tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)} jt`}
 tick={{ fontSize: 10, fill: '#64748b' }}
 axisLine={false}
 tickLine={false}
 width={65}
 />
 <Tooltip
 formatter={(value: any) => [formatIDR(Number(value)), '']}
 labelFormatter={(label) => `Unit: ${label}`}
 contentStyle={{
 backgroundColor: '#0f172a',
 borderColor: '#334155',
 borderRadius: '6px',
 color: '#f8fafc',
 fontSize: '12px',
 fontFamily: 'monospace',
 }}
 />
 <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
 <Bar dataKey="anggaran" name="Pagu Anggaran" fill="#94a3b8" radius={[4, 4, 0, 0]} />
 <Bar dataKey="realisasi" name="Realisasi Belanja" fill="#ef4444" radius={[4, 4, 0, 0]} />
 <Bar dataKey="sisaKas" name="Sisa Kas Aktif" fill="#10b981" radius={[4, 4, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Chart 2: Spending Breakdown by Ingredient Category */}
 <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
 <div>
 <div className="border-b border-slate-100 pb-3">
 <h2 className="text-sm font-semibold text-slate-900">
 Porsi Belanja Bahan per Kategori
 </h2>
 <p className="text-[11px] text-slate-500">
 Distribusi realisasi nota berdasarkan kelompok gizi
 </p>
 </div>

 <div className="h-52 w-full pt-2">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={categorySpendingData}
 cx="50%"
 cy="50%"
 innerRadius={50}
 outerRadius={80}
 paddingAngle={3}
 dataKey="value"
 >
 {categorySpendingData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip
 formatter={(value: any) => [formatIDR(Number(value)), 'Subtotal']}
 contentStyle={{
 backgroundColor: '#0f172a',
 borderColor: '#334155',
 borderRadius: '6px',
 color: '#f8fafc',
 fontSize: '11px',
 fontFamily: 'monospace',
 }}
 />
 </PieChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* High-density Category Legend Table */}
 <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2">
 {categorySpendingData.slice(0, 5).map((cat) => (
 <div key={cat.name} className="flex items-center justify-between text-xs">
 <div className="flex items-center gap-1.5">
 <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
 <span className="text-slate-700 truncate max-w-[120px]">{cat.name}</span>
 </div>
 <span className="font-mono tabular-nums text-slate-900 font-medium text-[11px]">
 {formatIDR(cat.value)}
 </span>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* AUDIT ATTENTION QUEUE & RECENT ACTIVITY */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Left: High-Priority Physical Receipt Audit Queue */}
 <div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <div className="flex items-center gap-2">
 <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-100 text-amber-700">
 <Receipt className="h-3.5 w-3.5" />
 </div>
 <h2 className="text-sm font-semibold text-slate-900">
 Antrean Rekonsiliasi & Audit Nota Fisik
 </h2>
 </div>
 <button
 type="button"
 onClick={onNavigateToProcurement}
 className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
 >
 <span>Lihat Semua Transaksi</span>
 <ArrowRight className="h-3.5 w-3.5" />
 </button>
 </div>

 <div className="mt-3 divide-y divide-slate-100">
 {urgentAuditItems.length === 0 ? (
 <div className="py-8 text-center text-xs text-slate-400">
 Seluruh nota fisik telah selesai diverifikasi oleh Auditor Eksekutif.
 </div>
 ) : (
 urgentAuditItems.map((item) => (
 <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <span className="font-mono text-xs font-semibold text-slate-900">
 {item.receiptNumber}
 </span>
 <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-700">
 {item.sppgUnitName}
 </span>
 {item.status === 'FLAGGED_DISCREPANCY' ? (
 <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.2 text-[10px] font-semibold text-rose-700 border border-rose-200">
 <AlertTriangle className="h-3 w-3" />
 Ada Selisih Fisik
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.2 text-[10px] font-semibold text-amber-700 border border-amber-200">
 Menunggu Audit
 </span>
 )}
 </div>
 <p className="text-[11px] text-slate-500">
 Peminta: <span className="font-medium text-slate-700">{item.requesterName}</span> | Supplier: {item.supplierName} | {formatDateIndo(item.date)}
 </p>
 </div>

 <div className="flex items-center justify-between sm:justify-end gap-3">
 <div className="text-right">
 <div className="font-mono text-xs font-bold text-slate-900">
 {formatIDR(item.actualReceiptTotal)}
 </div>
 <div className="text-[10px] font-mono text-slate-500">
 Kembali: {formatIDR(item.changeReturned)}
 </div>
 </div>

 <button
 type="button"
 onClick={() => openModal('INSPECT_RECEIPT', item)}
 className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800 transition"
 >
 <FileCheck2 className="h-3.5 w-3.5" />
 <span>Inspeksi Nota</span>
 </button>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 {/* Right: Quick Action Hub & Kitchen Stock Highlight */}
 <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <h2 className="text-sm font-semibold text-slate-900">
 Pusat Kontrol Operasional
 </h2>
 <span className="text-[10px] font-mono text-slate-500">Akses Cepat</span>
 </div>

 <div className="mt-3 space-y-2">
 {userRole === 'SUPERADMIN' ? (
 <>
 <button
 type="button"
 onClick={() => openModal('ADD_PROCUREMENT')}
 className="w-full flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100 transition text-left"
 >
 <div className="flex items-center gap-2">
 <Receipt className="h-4 w-4 text-blue-600" />
 <div>
 <div className="font-semibold">+ Catat Pembelanjaan SPJ</div>
 <div className="text-[10px] text-slate-500">Input dana diminta & rincian nota</div>
 </div>
 </div>
 <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
 </button>

 <button
 type="button"
 onClick={() => openModal('AI_SCANNER')}
 className="w-full flex items-center justify-between rounded-md border border-blue-200 bg-blue-50/50 px-3 py-2 text-xs font-medium text-blue-900 hover:bg-blue-50 transition text-left"
 >
 <div className="flex items-center gap-2">
 <span className="flex h-4 w-4 items-center justify-center font-bold text-xs">⚡</span>
 <div>
 <div className="font-semibold">AI Smart Nota/PR Scanner</div>
 <div className="text-[10px] text-blue-700/80">Otomatis ekstraksi foto struk fisik</div>
 </div>
 </div>
 <ArrowRight className="h-3.5 w-3.5 text-blue-500" />
 </button>

 <button
 type="button"
 onClick={() => openModal('RECORD_MUTATION')}
 className="w-full flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100 transition text-left"
 >
 <div className="flex items-center gap-2">
 <Layers className="h-4 w-4 text-emerald-600" />
 <div>
 <div className="font-semibold">Catat Mutasi Dapur</div>
 <div className="text-[10px] text-slate-500">Bahan Masuk/Keluar untuk menu</div>
 </div>
 </div>
 <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
 </button>
 </>
 ) : (
 <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
 <div className="font-semibold flex items-center gap-1.5 mb-1">
 <CheckCircle2 className="h-4 w-4 text-amber-600" />
 Tugas Auditor Eksekutif
 </div>
 <p className="text-[11px] leading-relaxed opacity-90">
 Bandingkan foto nota fisik dengan rincian digital, pastikan stempel CV basah sesuai, dan bubuhkan status verifikasi.
 </p>
 </div>
 )}
 </div>
 </div>

 <div className="mt-4 border-t border-slate-100 pt-3">
 <button
 type="button"
 onClick={onNavigateToInventory}
 className="w-full text-center text-xs text-slate-600 hover:text-slate-900 font-medium py-1"
 >
 Buka Master Bahan & Mutasi Dapur &rarr;
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
