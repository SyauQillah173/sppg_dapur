'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { SppgUnitId, ProcurementItem } from '@/lib/types';
import { formatIDR } from '@/lib/utils';
import {
  X,
  Plus,
  Trash2,
  Receipt,
  CheckCircle2,
  Sparkles,
  Upload,
  RefreshCw,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';

interface AddProcurementModalProps {
  onClose: () => void;
}

export function AddProcurementModal({ onClose }: AddProcurementModalProps) {
  const { addProcurement, sppgUnits, suppliers, employees, categories, units, ingredients } = useStore();

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [receiptNumber, setReceiptNumber] = useState<string>(
    `NOTA-${sppgUnits[0]?.code.replace('SPPG-', '') || 'AA02'}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [sppgUnitId, setSppgUnitId] = useState<SppgUnitId>(sppgUnits[0]?.id || 'SPPG-AA02');
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [requesterId, setRequesterId] = useState<string>(employees[0]?.id || '');
  const [amountRequested, setAmountRequested] = useState<number>(150000000);
  const [notes, setNotes] = useState<string>('Pengadaan bahan dapur siklus makan siang bergizi siswa.');

  // AI OCR state inside form
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  // Line items
  const [items, setItems] = useState<ProcurementItem[]>([
    { id: '1', name: 'Ayam giling', category: 'Protein Hewani', quantity: 145, unit: 'Kg', unitPrice: 42000, subtotal: 6090000, isOcrMatched: true, isItemVerified: false },
    { id: '2', name: 'Melon', category: 'Buah-buahan', quantity: 235, unit: 'Kg', unitPrice: 16500, subtotal: 3877500, isOcrMatched: true, isItemVerified: false },
    { id: '3', name: 'Kacang tanah', category: 'Protein Nabati', quantity: 70, unit: 'Kg', unitPrice: 32000, subtotal: 2240000, isOcrMatched: true, isItemVerified: false },
    { id: '4', name: 'Telur horn', category: 'Protein Hewani', quantity: 5, unit: 'Kg', unitPrice: 28000, subtotal: 140000, isOcrMatched: true, isItemVerified: false },
    { id: '5', name: 'Beras Ramos Super (50 Kg)', category: 'Sembako & Tepung', quantity: 200, unit: 'Karung', unitPrice: 675000, subtotal: 135000000, isOcrMatched: true, isItemVerified: false },
  ]);

  const actualReceiptTotal = items.reduce((acc, it) => acc + it.subtotal, 0);
  const changeReturned = Math.max(0, amountRequested - actualReceiptTotal);

  // Check price anomaly (>20% price increase)
  const isItemAnomaly = (item: ProcurementItem) => {
    const matched = ingredients.find(
      (ing) => ing.name.toLowerCase() === item.name.toLowerCase()
    );
    if (matched && matched.lastPurchasePrice > 0) {
      return item.unitPrice > matched.lastPurchasePrice * 1.2;
    }
    return false;
  };

  const handleAddItem = () => {
    const newItem: ProcurementItem = {
      id: Date.now().toString(),
      name: '',
      category: categories[0]?.name || 'Sayuran',
      quantity: 1,
      unit: units[0]?.symbol || 'Kg',
      unitPrice: 0,
      subtotal: 0,
      isOcrMatched: true,
      isItemVerified: false,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof ProcurementItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[idx], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      item.subtotal = Number(item.quantity) * Number(item.unitPrice);
    }
    updated[idx] = item;
    setItems(updated);
  };

  // Upload receipt image & send to /api/scan-receipt (Gemini 2.5 Flash)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setAiSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.data) {
        const { receiptNumber: scannedNum, supplierName: scannedSup, items: scannedItems, totalAmount } = json.data;

        if (scannedNum) setReceiptNumber(scannedNum);

        // Find supplier by name match if possible
        const matchingSupplier = suppliers.find((s) =>
          scannedSup && s.name.toLowerCase().includes(scannedSup.toLowerCase())
        );
        if (matchingSupplier) setSupplierId(matchingSupplier.id);

        if (Array.isArray(scannedItems) && scannedItems.length > 0) {
          const mappedItems: ProcurementItem[] = scannedItems.map((it: any, i: number) => ({
            id: `OCR-${Date.now()}-${i}`,
            name: it.name,
            category: it.category || 'Sayuran',
            quantity: Number(it.quantity) || 1,
            unit: it.unit || 'Kg',
            unitPrice: Number(it.unitPrice) || 0,
            subtotal: Number(it.subtotal) || (Number(it.quantity) * Number(it.unitPrice)),
            isOcrMatched: true,
            isItemVerified: false,
          }));
          setItems(mappedItems);
        }

        setAiSuccessMessage(
          `AI Gemini 2.5 Flash berhasil mengekstrak ${scannedItems?.length || 0} bahan makanan dari foto nota!`
        );
      }
    } catch (err: any) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedUnitObj = sppgUnits.find((u) => u.id === sppgUnitId);
    const selectedSupplierObj = suppliers.find((s) => s.id === supplierId);
    const selectedEmpObj = employees.find((e) => e.id === requesterId);

    addProcurement({
      receiptNumber,
      date,
      sppgUnitId,
      sppgUnitName: selectedUnitObj?.name || '',
      requesterId,
      requesterName: selectedEmpObj?.name || 'Petugas Pengadaan',
      requesterRole: selectedEmpObj?.roleTitle || 'Staf Belanja',
      supplierId,
      supplierName: selectedSupplierObj?.name || 'CV Rekanan',
      supplierAddress: selectedSupplierObj?.address || '',
      amountRequested,
      actualReceiptTotal,
      changeReturned,
      status: 'PENDING_AUDIT',
      receiptPhotoUrl: '/receipts/nota-sample-01.webp',
      physicalReceiptImage: 'PHYSICAL_RECEIPT_NEW',
      notes,
      items,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-white rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100">
                Formulir Pembelanjaan & Rekonsiliasi Nota Fisik (SPJ)
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Input rincian belanja bahan dapur atau pindai foto struk via Google Gemini AI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* AI Receipt Upload Banner */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3.5 dark:border-blue-900/60 dark:bg-blue-950/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-blue-900 dark:text-blue-200">
                    AI Smart Scanner (Google Gemini 2.5 Flash)
                  </div>
                  <div className="text-[11px] text-blue-700/80 dark:text-blue-400">
                    Upload foto nota fisik toko / lembar daftar belanja kertas klien untuk otomatis mengisi baris item
                  </div>
                </div>
              </div>

              <label className="inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition cursor-pointer self-start sm:self-auto">
                {isScanning ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Foto Nota / PR</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  disabled={isScanning}
                  className="hidden"
                />
              </label>
            </div>

            {aiSuccessMessage && (
              <div className="mt-2.5 pt-2 border-t border-blue-200 dark:border-blue-900/50 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{aiSuccessMessage}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Tanggal Transaksi:</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Nomor Nota / Kwitansi:</label>
              <input
                type="text"
                required
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Unit SPPG Tujuan:</label>
              <select
                value={sppgUnitId}
                onChange={(e) => setSppgUnitId(e.target.value as SppgUnitId)}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 font-medium"
              >
                {sppgUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-zinc-300">CV / Rekanan Supplier:</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.suppliedCategory})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Peminta Belanja (Karyawan):</label>
              <select
                value={requesterId}
                onChange={(e) => setRequesterId(e.target.value)}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} - {e.roleTitle} ({e.sppgUnitName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-zinc-300">Dana Diminta (Kasbon Rp):</label>
              <input
                type="number"
                required
                min={0}
                step={1000}
                value={amountRequested}
                onChange={(e) => setAmountRequested(Number(e.target.value))}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              />
            </div>
          </div>

          {/* Dynamic Itemized Table */}
          <div className="rounded-lg border border-slate-200 overflow-hidden dark:border-zinc-800">
            <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 dark:bg-zinc-800 flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-800 dark:text-zinc-200">Rincian Pembelian Bahan Dapur</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-2 py-0.5 text-[11px]"
              >
                <Plus className="h-3 w-3" />
                Tambah Baris
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto p-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase border-b border-slate-200 dark:border-zinc-800">
                    <th className="text-left py-1 px-1">Nama Bahan</th>
                    <th className="text-left py-1 px-1">Kategori</th>
                    <th className="text-right py-1 px-1 w-20">Volume</th>
                    <th className="text-left py-1 px-1 w-16">Satuan</th>
                    <th className="text-right py-1 px-1 w-28">Harga (Rp)</th>
                    <th className="text-right py-1 px-1 w-32">Subtotal</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {items.map((item, idx) => {
                    const isAnomaly = isItemAnomaly(item);
                    return (
                      <tr key={item.id || idx} className={isAnomaly ? 'bg-rose-50/40' : ''}>
                        <td className="py-1 px-1">
                          <div className="relative">
                            <input
                              type="text"
                              required
                              value={item.name}
                              onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                              placeholder="Nama bahan..."
                              className="w-full rounded border border-slate-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                            />
                            {isAnomaly && (
                              <span className="text-[9px] text-rose-600 font-bold block mt-0.5">
                                ⚠ Anomali: Naik &gt;20%
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-1 px-1">
                          <select
                            value={item.category}
                            onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                            className="w-full rounded border border-slate-200 px-1 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            min={0.1}
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                            className="w-full rounded border border-slate-200 px-1 py-1 text-xs text-right font-mono dark:border-zinc-700 dark:bg-zinc-900"
                          />
                        </td>
                        <td className="py-1 px-1">
                          <select
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-full rounded border border-slate-200 px-1 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                          >
                            {units.map((u) => (
                              <option key={u.id} value={u.symbol}>{u.symbol}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1 px-1">
                          <input
                            type="number"
                            min={0}
                            step={500}
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                            className="w-full rounded border border-slate-200 px-1 py-1 text-xs text-right font-mono dark:border-zinc-700 dark:bg-zinc-900"
                          />
                        </td>
                        <td className="py-1 px-1 text-right font-mono font-semibold tabular-nums text-slate-800 dark:text-zinc-200">
                          {formatIDR(item.subtotal)}
                        </td>
                        <td className="py-1 px-1 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Dana Diminta:</span>
              <div className="font-mono font-bold text-slate-800 dark:text-zinc-200 text-sm">
                {formatIDR(amountRequested)}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Realisasi Nota:</span>
              <div className="font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                {formatIDR(actualReceiptTotal)}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Sisa Uang Kembali (Kas):</span>
              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {formatIDR(changeReturned)}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Catatan Belanja:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Simpan & Ajukan ke Antrean Audit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
