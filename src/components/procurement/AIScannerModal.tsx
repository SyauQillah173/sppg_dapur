'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { SppgUnitId, ProcurementItem } from '@/lib/types';
import { formatIDR, formatKg, formatDateIndo } from '@/lib/utils';
import {
 X,
 Sparkles,
 Upload,
 FileCheck2,
 CheckCircle2,
 Cpu,
 RefreshCw,
 ArrowRight,
 ShieldAlert,
 Layers,
} from 'lucide-react';

interface AIScannerModalProps {
 onClose: () => void;
}

export function AIScannerModal({ onClose }: AIScannerModalProps) {
 const { addProcurement, sppgUnits, suppliers, employees } = useStore();

 const [scanStep, setScanStep] = useState<'SELECT' | 'SCANNING' | 'RESULT'>('SELECT');
 const [scanProgress, setScanProgress] = useState<number>(0);
 const [selectedReceiptPreset, setSelectedReceiptPreset] = useState<number>(1);

 // Scanned item mock results based on the 20 pre-seeded items
 const presetResults = [
 {
 title: 'Nota Pengadaan Siklus 2: Protein Hewani & Buah-buahan',
 receiptNumber: `NOTA-AA02-20261016-${Math.floor(100 + Math.random() * 900)}`,
 sppgUnitId: 'SPPG-AA02' as SppgUnitId,
 sppgUnitName: 'SPPG ABAR ABIR 02',
 supplierId: 'SUP-01',
 supplierName: 'CV Sumber Pangan Abadi',
 supplierAddress: 'Kawasan Pergudangan Manyar Mas Blok C-12, Gresik',
 requesterId: 'EMP-AA01',
 requesterName: 'Budi Santoso',
 requesterRole: 'Koordinator Pengadaan',
 amountRequested: 150000000,
 actualReceiptTotal: 147850000,
 changeReturned: 2150000,
 confidence: 98.8,
 items: [
 { id: 'ITM-OCR-01', name: 'Ayam giling', category: 'Protein Hewani', quantity: 145, unit: 'Kg', unitPrice: 42000, subtotal: 6090000, isOcrMatched: true, isItemVerified: true },
 { id: 'ITM-OCR-02', name: 'Melon', category: 'Buah-buahan', quantity: 235, unit: 'Kg', unitPrice: 16500, subtotal: 3877500, isOcrMatched: true, isItemVerified: true },
 { id: 'ITM-OCR-03', name: 'Kacang tanah', category: 'Protein Nabati', quantity: 70, unit: 'Kg', unitPrice: 32000, subtotal: 2240000, isOcrMatched: true, isItemVerified: true },
 { id: 'ITM-OCR-04', name: 'Telur horn', category: 'Protein Hewani', quantity: 5, unit: 'Kg', unitPrice: 28000, subtotal: 140000, isOcrMatched: true, isItemVerified: true },
 { id: 'ITM-OCR-05', name: 'Saus tomat sachet', category: 'Bumbu & Saus', quantity: 57, unit: 'Pack', unitPrice: 18500, subtotal: 1054500, isOcrMatched: true, isItemVerified: true },
 { id: 'ITM-OCR-06', name: 'Saus sambal sachet', category: 'Bumbu & Saus', quantity: 40, unit: 'Pack', unitPrice: 19500, subtotal: 780000, isOcrMatched: true, isItemVerified: true },
 { id: 'ITM-OCR-07', name: 'Tepung panir', category: 'Sembako & Tepung', quantity: 3, unit: 'Karung', unitPrice: 285000, subtotal: 855000, isOcrMatched: true, isItemVerified: true },
 { id: 'ITM-OCR-08', name: 'Beras Ramos Super (50 Kg)', category: 'Sembako & Tepung', quantity: 196, unit: 'Karung', unitPrice: 675000, subtotal: 132813000, isOcrMatched: true, isItemVerified: true },
 ],
 },
 {
 title: 'Nota Pasokan Sayuran & Bumbu Dapur Segar Leran',
 receiptNumber: `NOTA-BS02-20261016-${Math.floor(100 + Math.random() * 900)}`,
 sppgUnitId: 'SPPG-BS02' as SppgUnitId,
 sppgUnitName: 'SPPG BANJARSARI 02 LERAN MANYAR',
 supplierId: 'SUP-02',
 supplierName: 'CV Berkah Sayur Leran Manyar',
 supplierAddress: 'Pasar Tradisional Leran Kios 04-06, Manyar',
 requesterId: 'EMP-BS01',
 requesterName: 'Siti Rahmawati',
 requesterRole: 'Kepala Bagian Pembelanjaan',
 amountRequested: 35000000,
 actualReceiptTotal: 34180000,
 changeReturned: 820000,
 confidence: 97.4,
 items: [
 { id: 'ITM-OCR-10', name: 'Selada', category: 'Sayuran', quantity: 25, unit: 'Kg', unitPrice: 24000, subtotal: 600000, isOcrMatched: true, isItemVerified: true },
 { id: 'ITM-OCR-11', name: 'Tomat', category: 'Sayuran', quantity: 15, unit: 'Kg', unitPrice: 14000, subtotal: 210000, isOcrMatched: true, isItemVerified: true },
 { id: 'ITM-OCR-12', name: 'Bawang bombai', category: 'Sayuran', quantity: 5, unit: 'Kg', unitPrice: 32000, subtotal: 160000, isOcrMatched: true, isItemVerified: true },
 { id: 'ITM-OCR-13', name: 'Daun bawang', category: 'Sayuran', quantity: 2, unit: 'Kg', unitPrice: 22000, subtotal: 44000, isOcrMatched: true, isItemVerified: true },
 { id: 'ITM-OCR-14', name: 'Sayur Sop Campur & Wortel Segar', category: 'Sayuran', quantity: 180, unit: 'Kg', unitPrice: 18000, subtotal: 3240000, isOcrMatched: true, isItemVerified: true },
 { id: 'ITM-OCR-15', name: 'Paket Sayuran Dapur Banjarsari Konsolidasi', category: 'Sayuran', quantity: 1, unit: 'Pack', unitPrice: 29926000, subtotal: 29926000, isOcrMatched: true, isItemVerified: true },
 ],
 },
 ];

 const currentResult = presetResults[selectedReceiptPreset - 1] || presetResults[0];

 const startScan = () => {
 setScanStep('SCANNING');
 setScanProgress(5);
 };

 useEffect(() => {
 if (scanStep === 'SCANNING') {
 const interval = setInterval(() => {
 setScanProgress((prev) => {
 if (prev >= 100) {
 clearInterval(interval);
 setTimeout(() => setScanStep('RESULT'), 400);
 return 100;
 }
 return prev + 15;
 });
 }, 250);
 return () => clearInterval(interval);
 }
 }, [scanStep]);

 const handleImportToProcurement = async () => {
 const result = await addProcurement({
 receiptNumber: currentResult.receiptNumber,
 date: new Date().toISOString().slice(0, 10),
 sppgUnitId: currentResult.sppgUnitId,
 sppgUnitName: currentResult.sppgUnitName,
 requesterId: currentResult.requesterId,
 requesterName: currentResult.requesterName,
 requesterRole: currentResult.requesterRole,
 supplierId: currentResult.supplierId,
 supplierName: currentResult.supplierName,
 supplierAddress: currentResult.supplierAddress,
 amountRequested: currentResult.amountRequested,
 actualReceiptTotal: currentResult.actualReceiptTotal,
 changeReturned: currentResult.changeReturned,
 status: 'PENDING_AUDIT',
 receiptPhotoUrl: '',
 physicalReceiptImage: '',
 notes: `Di-import otomatis via AI Smart Nota Scanner (Akurasi ${currentResult.confidence}%). Memerlukan verifikasi fisik akhir oleh Auditor.`,
 items: currentResult.items,
 });
 if (!result.ok) {
 window.alert(result.error || 'Gagal menyimpan hasil scan ke database.');
 return;
 }
 onClose();
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
 <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
 {/* Header */}
 <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
 <div className="flex items-center gap-2.5">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
 <Sparkles className="h-4 w-4" />
 </div>
 <div>
 <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
 AI Smart Nota & Purchase Requisition (PR) Scanner
 <span className="rounded bg-blue-100 text-blue-800 px-1.5 py-0.5 text-[10px] font-mono font-semibold">
 OCR Engine v2.4
 </span>
 </h2>
 <p className="text-xs text-slate-500">
 Ekstraksi otomatis baris bahan dapur, kuantitas (Kg/Pack), harga satuan, dan stempel supplier
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
 >
 <X className="h-4 w-4" />
 </button>
 </div>

 {/* Content Body */}
 <div className="flex-1 overflow-y-auto p-5 space-y-5">
 {scanStep === 'SELECT' && (
 <div className="space-y-4">
 <div className="rounded-lg border-2 border-dashed border-slate-300 p-6 text-center hover:border-slate-400 bg-slate-50/50">
 <Upload className="mx-auto h-10 w-10 text-slate-400 mb-2" />
 <h3 className="text-sm font-semibold text-slate-900">
 Unggah Dokumen Nota Fisik / SPJ Toko
 </h3>
 <p className="text-xs text-slate-500 mt-1">
 Format gambar JPG, PNG, atau PDF resolusi tinggi (nota kasir, faktur cap basah, struk timbangan)
 </p>
 <div className="mt-3 flex justify-center gap-2">
 <span className="text-[11px] text-slate-400 font-mono">atau pilih sampel nota riil di bawah ini:</span>
 </div>
 </div>

 {/* Sample Receipts Selector */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {presetResults.map((preset, index) => (
 <button
 key={preset.receiptNumber}
 type="button"
 onClick={() => setSelectedReceiptPreset(index + 1)}
 className={`p-3.5 rounded-lg border text-left transition ${
 selectedReceiptPreset === index + 1
 ? 'border-blue-500 bg-blue-50/60 shadow-sm'
 : 'border-slate-200 bg-white hover:bg-slate-50'
 }`}
 >
 <div className="flex items-center justify-between">
 <span className="font-mono text-xs font-bold text-slate-900">
 {preset.receiptNumber}
 </span>
 <span className="text-[10px] rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
 {preset.sppgUnitName}
 </span>
 </div>
 <div className="text-xs font-semibold text-slate-800 mt-1">
 {preset.title}
 </div>
 <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-mono">
 <span>Total: {formatIDR(preset.actualReceiptTotal)}</span>
 <span className="text-blue-600 font-semibold">{preset.items.length} Bahan Dapur</span>
 </div>
 </button>
 ))}
 </div>

 <div className="flex justify-end pt-2">
 <button
 type="button"
 onClick={startScan}
 className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition"
 >
 <Cpu className="h-4 w-4" />
 <span>Jalankan AI OCR Scanning Simulator</span>
 </button>
 </div>
 </div>
 )}

 {scanStep === 'SCANNING' && (
 <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
 <div className="relative w-44 h-56 bg-slate-950 border border-slate-700 rounded-lg p-3 overflow-hidden shadow-xl text-left font-mono text-[9px] text-slate-400">
 {/* Laser scanline */}
 <div
 className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] transition-all duration-300"
 style={{ top: `${scanProgress}%` }}
 />
 <div className="opacity-70 space-y-1">
 <div className="font-bold text-slate-200">CV SUMBER PANGAN ABADI</div>
 <div>NOTA: {currentResult.receiptNumber}</div>
 <div>SPPG: {currentResult.sppgUnitName}</div>
 <div className="border-t border-slate-700 pt-1">
 <div>AYAM GILING 145 KG</div>
 <div>MELON 235 KG</div>
 <div>TELUR HORN 5 KG</div>
 <div>SAUS TIRAM 2 BTL</div>
 </div>
 <div className="border-t border-slate-700 pt-1 text-cyan-300">
 TOTAL: {formatIDR(currentResult.actualReceiptTotal)}
 </div>
 </div>
 </div>

 <div>
 <h3 className="text-sm font-bold text-slate-900 flex items-center justify-center gap-2">
 <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
 Memproses Dokumen Nota Fisik ({scanProgress}%)...
 </h3>
 <p className="text-xs text-slate-500 mt-1 max-w-md">
 Mendeteksi koordinat baris teks, kuantitas numerik, stempel supplier basah, dan validasi aritmatika subtotal.
 </p>
 </div>
 </div>
 )}

 {scanStep === 'RESULT' && (
 <div className="space-y-4">
 {/* Scan Success Pill */}
 <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <CheckCircle2 className="h-4 w-4 text-emerald-600" />
 <span className="font-semibold">
 Ekstraksi OCR Berhasil! Tingkat Akurasi AI: {currentResult.confidence}%
 </span>
 </div>
 <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
 {currentResult.items.length} Baris Bahan Teridentifikasi
 </span>
 </div>

 {/* Extracted Fields Summary */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs">
 <div>
 <span className="text-[10px] text-slate-500 uppercase">Nomor Nota:</span>
 <div className="font-mono font-bold text-slate-800">{currentResult.receiptNumber}</div>
 </div>
 <div>
 <span className="text-[10px] text-slate-500 uppercase">Supplier CV:</span>
 <div className="font-medium text-slate-800">{currentResult.supplierName}</div>
 </div>
 <div>
 <span className="text-[10px] text-slate-500 uppercase">Unit SPPG Tujuan:</span>
 <div className="font-medium text-slate-800">{currentResult.sppgUnitName}</div>
 </div>
 <div>
 <span className="text-[10px] text-slate-500 uppercase">Total Nilai Nota:</span>
 <div className="font-mono font-bold text-slate-900">{formatIDR(currentResult.actualReceiptTotal)}</div>
 </div>
 </div>

 {/* Extracted Items Table */}
 <div className="rounded-lg border border-slate-200 overflow-hidden">
 <div className="px-3.5 py-2 bg-slate-100/70 border-b border-slate-200 text-xs font-semibold text-slate-700">
 Daftar Bahan Dapur Hasil Pindaian AI
 </div>
 <div className="max-h-56 overflow-y-auto">
 <table className="w-full text-xs">
 <thead className="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-200">
 <tr>
 <th className="py-1.5 px-3 text-left">Nama Bahan</th>
 <th className="py-1.5 px-2 text-left">Kategori</th>
 <th className="py-1.5 px-2 text-right">Volume</th>
 <th className="py-1.5 px-2 text-right">Harga Satuan</th>
 <th className="py-1.5 px-3 text-right">Subtotal</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {currentResult.items.map((item) => (
 <tr key={item.id} className="hover:bg-slate-50">
 <td className="py-1.5 px-3 font-medium text-slate-900">{item.name}</td>
 <td className="py-1.5 px-2">
 <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
 {item.category}
 </span>
 </td>
 <td className="py-1.5 px-2 text-right font-mono tabular-nums font-medium text-slate-800">
 {item.quantity} {item.unit}
 </td>
 <td className="py-1.5 px-2 text-right font-mono tabular-nums text-slate-600">
 {formatIDR(item.unitPrice)}
 </td>
 <td className="py-1.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
 {formatIDR(item.subtotal)}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Bottom Actions */}
 <div className="flex items-center justify-between pt-2">
 <button
 type="button"
 onClick={() => setScanStep('SELECT')}
 className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
 >
 Pindai Ulang
 </button>

 <button
 type="button"
 onClick={handleImportToProcurement}
 className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition"
 >
 <FileCheck2 className="h-4 w-4" />
 <span>Import ke Formulir Pembelanjaan & Rekonsiliasi</span>
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
