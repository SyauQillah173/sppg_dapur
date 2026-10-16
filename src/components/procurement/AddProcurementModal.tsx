'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { SppgUnitId, ProcurementItem } from '@/lib/types';
import { formatIDR, formatRupiah, hitungSelisih } from '@/lib/utils';
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
  Building2,
  User,
  Store,
  Wallet,
  Camera,
} from 'lucide-react';

interface AddProcurementModalProps {
  onClose: () => void;
}

export function AddProcurementModal({ onClose }: AddProcurementModalProps) {
  const {
    addProcurement,
    sppgUnits,
    suppliers,
    employees,
    categories,
    units,
    ingredients,
    addSupplier,
    addEmployee,
  } = useStore();

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [receiptNumber, setReceiptNumber] = useState<string>(''); // opsional — boleh dikosongkan
  const [sppgUnitId, setSppgUnitId] = useState<SppgUnitId | 'ALL'>(sppgUnits[0]?.id || 'SPPG-AA02');

  // Supplier state (Dropdown or custom input)
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [isCustomSupplier, setIsCustomSupplier] = useState<boolean>(false);
  const [customSupplierName, setCustomSupplierName] = useState<string>('');

  // Requester / Employee state (Dropdown or custom input)
  const [requesterId, setRequesterId] = useState<string>(employees[0]?.id || '');
  const [isCustomRequester, setIsCustomRequester] = useState<boolean>(false);
  const [customRequesterName, setCustomRequesterName] = useState<string>('');

  // Cash / Kasbon Requested
  const [amountRequested, setAmountRequested] = useState<number>(150000000);
  const [notes, setNotes] = useState<string>('Pengadaan bahan dapur operasional gizi harian.');

  // Receipt photos — empty by default, only filled after real upload
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);

  // AI OCR state
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
  const selisih = hitungSelisih(amountRequested, actualReceiptTotal);
  const isAllUnits = sppgUnitId === 'ALL';

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
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const handleItemNameChange = (idx: number, nameValue: string) => {
    const updated = [...items];
    const item = { ...updated[idx], name: nameValue };

    // Check if name matches any ingredient in CMS
    const matchedIng = ingredients.find(
      (ing) => ing.name.toLowerCase() === nameValue.toLowerCase().trim()
    );

    if (matchedIng) {
      item.category = matchedIng.category;
      item.unit = matchedIng.defaultUnit;
      if (matchedIng.lastPurchasePrice > 0 && item.unitPrice === 0) {
        item.unitPrice = matchedIng.lastPurchasePrice;
      }
      item.subtotal = Number(item.quantity) * Number(item.unitPrice);
    }

    updated[idx] = item;
    setItems(updated);
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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsScanning(true);
    setAiSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Create preview URL
      const localUrl = URL.createObjectURL(file);
      setUploadedPhotos((prev) => [localUrl, ...prev]);

      // Upload ke server: URL blob: hanya hidup di perangkat ini, jadi tidak ikut tersinkron.
      try {
        const uploadData = new FormData();
        uploadData.append('file', file);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadData });
        const uploadJson = await uploadRes.json();
        if (uploadJson?.success && uploadJson.url) {
          setUploadedPhotos((prev) => [uploadJson.url, ...prev.filter((p) => p !== localUrl)]);
        }
      } catch {
        // gagal upload — preview lokal tetap dipakai
      }

      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.data) {
        const { receiptNumber: scannedNum, supplierName: scannedSup, items: scannedItems } = json.data;

        if (scannedNum) setReceiptNumber(scannedNum);

        if (scannedSup) {
          const matchingSupplier = suppliers.find((s) =>
            s.name.toLowerCase().includes(scannedSup.toLowerCase())
          );
          if (matchingSupplier) {
            setSupplierId(matchingSupplier.id);
            setIsCustomSupplier(false);
          } else {
            setCustomSupplierName(scannedSup);
            setIsCustomSupplier(true);
          }
        }

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

    const selectedUnitObj = isAllUnits ? undefined : sppgUnits.find((u) => u.id === sppgUnitId);
    const targetUnitName = isAllUnits ? 'Semua SPPG (Gabungan 4 Unit)' : selectedUnitObj?.name || sppgUnitId;

    // Supplier resolution
    let finalSupplierId = supplierId;
    let finalSupplierName = '';
    let finalSupplierAddress = '';

    if (isCustomSupplier && customSupplierName.trim()) {
      finalSupplierName = customSupplierName.trim();
      finalSupplierId = `SUP-QUICK-${Date.now().toString().slice(-4)}`;
      // Also register to store
      addSupplier({
        name: finalSupplierName,
        picName: 'Kontak Toko',
        phone: '-',
        address: 'Gresik, Jawa Timur',
        bankAccount: 'Tunai Kas',
        suppliedCategory: 'Bahan Dapur Segar',
        activeStatus: true,
        rating: 5.0,
      });
    } else {
      const selectedSupplierObj = suppliers.find((s) => s.id === supplierId);
      finalSupplierId = selectedSupplierObj?.id || 'SUP-01';
      finalSupplierName = selectedSupplierObj?.name || 'CV Rekanan Dapur';
      finalSupplierAddress = selectedSupplierObj?.address || '';
    }

    // Requester resolution
    let finalRequesterId = requesterId;
    let finalRequesterName = '';
    let finalRequesterRole = 'Staf Pengadaan Dapur';

    if (isCustomRequester && customRequesterName.trim()) {
      finalRequesterName = customRequesterName.trim();
      finalRequesterId = `EMP-QUICK-${Date.now().toString().slice(-4)}`;
      addEmployee({
        name: finalRequesterName,
        roleTitle: 'Petugas Pengadaan Lapangan',
        sppgUnitId: isAllUnits ? sppgUnits[0]?.id || 'SPPG-AA02' : sppgUnitId,
        sppgUnitName: targetUnitName,
        phone: '-',
        complianceScore: 100,
        status: 'ACTIVE',
      });
    } else {
      const selectedEmpObj = employees.find((e) => e.id === requesterId);
      finalRequesterId = selectedEmpObj?.id || 'EMP-01';
      finalRequesterName = selectedEmpObj?.name || 'Petugas Pengadaan';
      finalRequesterRole = selectedEmpObj?.roleTitle || 'Staf Belanja';
    }

    addProcurement({
      receiptNumber: receiptNumber.trim() || '-',
      date,
      sppgUnitId,
      sppgUnitName: targetUnitName,
      requesterId: finalRequesterId,
      requesterName: finalRequesterName,
      requesterRole: finalRequesterRole,
      supplierId: finalSupplierId,
      supplierName: finalSupplierName,
      supplierAddress: finalSupplierAddress,
      amountRequested,
      actualReceiptTotal,
      changeReturned,
      status: 'PENDING_AUDIT',
      receiptPhotoUrl: uploadedPhotos[0] || '',
      physicalReceiptImage: uploadedPhotos[0] ? 'PHYSICAL_RECEIPT_NEW' : '',
      notes,
      items,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Catat Belanja & Upload Nota Fisik (SPJ)
              </h2>
              <p className="text-xs text-slate-500">
                Input manual ala kasir/Excel atau gunakan scan otomatis AI Google Gemini
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* AI Receipt Upload Banner & Photo Attachment */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-blue-900">
                    Upload Foto Nota / Bukti Belanja Fisik
                  </div>
                  <div className="text-[11px] text-blue-700/80">
                    Bisa upload banyak foto struk belanjaan toko atau gunakan scan otomatis AI Gemini 2.5 Flash
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 transition cursor-pointer">
                  {isScanning ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Menganalisis Nota...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-3.5 w-3.5" />
                      <span>+ Ambil / Upload Foto Nota</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    disabled={isScanning}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Photos Preview Thumbnails */}
            {uploadedPhotos.length > 0 && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pt-2 border-t border-blue-200/60">
                <span className="text-[11px] font-medium text-blue-900 whitespace-nowrap">
                  Foto Terlampir ({uploadedPhotos.length}):
                </span>
                {uploadedPhotos.map((photo, i) => (
                  <div
                    key={i}
                    className="relative w-12 h-12 rounded-lg border border-blue-300 overflow-hidden bg-white shrink-0 shadow-xs"
                  >
                    <img src={photo} alt={`Nota ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {aiSuccessMessage && (
              <div className="mt-2.5 pt-2 border-t border-blue-200 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{aiSuccessMessage}</span>
              </div>
            )}
          </div>

          {/* Form Header Fields: Tujuan SPPG, Nomor Nota, Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Pilih Tujuan SPPG:
              </label>
              <select
                value={sppgUnitId}
                onChange={(e) => setSppgUnitId(e.target.value as SppgUnitId)}
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800 font-semibold focus:border-slate-800 focus:outline-none"
              >
                {sppgUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
                <option value="ALL">Semua SPPG (Gabungan 4 Unit)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Tanggal Belanja:
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 font-mono text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Nomor Nota / Kwitansi: <span className="text-slate-400 font-normal normal-case">(opsional)</span>
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="Boleh dikosongkan"
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 font-mono text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Form Middle Fields: Nama Peminta, Nama CV/Supplier, Nominal Uang Diminta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Requester / Employee with Inline Add */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 uppercase tracking-wider">
                  Nama Peminta Belanja:
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomRequester(!isCustomRequester)}
                  className="text-[10px] text-blue-600 hover:underline font-semibold"
                >
                  {isCustomRequester ? 'Pilih dari Daftar' : '+ Ketik Baru'}
                </button>
              </div>
              {isCustomRequester ? (
                <input
                  type="text"
                  required
                  value={customRequesterName}
                  onChange={(e) => setCustomRequesterName(e.target.value)}
                  placeholder="Ketik nama karyawan baru..."
                  className="w-full rounded-md border border-blue-400 bg-blue-50/30 px-2.5 py-2 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
                />
              ) : (
                <select
                  value={requesterId}
                  onChange={(e) => setRequesterId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.roleTitle})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Supplier / CV with Inline Add */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 uppercase tracking-wider">
                  Nama CV / Supplier:
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomSupplier(!isCustomSupplier)}
                  className="text-[10px] text-blue-600 hover:underline font-semibold"
                >
                  {isCustomSupplier ? 'Pilih dari Daftar' : '+ Ketik Baru'}
                </button>
              </div>
              {isCustomSupplier ? (
                <input
                  type="text"
                  required
                  value={customSupplierName}
                  onChange={(e) => setCustomSupplierName(e.target.value)}
                  placeholder="Ketik nama CV / Toko baru..."
                  className="w-full rounded-md border border-blue-400 bg-blue-50/30 px-2.5 py-2 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
                />
              ) : (
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.suppliedCategory})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Nominal Uang Diminta / Kasbon */}
            <div>
              <label className="font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Uang Diminta / Dibawa (Kasbon Rp):
              </label>
              <div className="relative rounded-md shadow-xs">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 font-mono text-xs font-bold">
                  Rp
                </span>
                <input
                  type="number"
                  required
                  min={0}
                  step={1000}
                  value={amountRequested}
                  onChange={(e) => setAmountRequested(Number(e.target.value))}
                  className="w-full rounded-md border border-slate-300 bg-white pl-9 pr-2.5 py-2 font-mono font-bold text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                {formatRupiah(amountRequested)}
              </span>
            </div>
          </div>

          {/* Datalist for Quick Ingredient Auto-Suggest from CMS */}
          <datalist id="cms-ingredients-datalist">
            {ingredients.map((ing) => (
              <option key={ing.id} value={ing.name}>
                {ing.name} &bull; {ing.category} &bull; Standar {ing.defaultUnit} &bull; {formatRupiah(ing.lastPurchasePrice)}
              </option>
            ))}
          </datalist>

          {/* Dynamic Itemized Table (Excel/Kasir Style) */}
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-slate-800 font-bold">Tabel Rincian Bahan Belanja</span>
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-mono text-slate-700">
                  {items.length} Baris Bahan
                </span>
              </div>
              <button
                type="button"
                id="btn-tambah-baris-bahan"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 text-white px-2.5 py-1 text-xs font-semibold shadow-xs hover:bg-slate-800 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Tambah Baris Bahan</span>
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto p-2 bg-white">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase font-semibold border-b border-slate-200">
                    <th className="text-left py-1.5 px-2">Nama Bahan (Pilih CMS / Ketik Baru)</th>
                    <th className="text-left py-1.5 px-1 w-32">Kategori</th>
                    <th className="text-right py-1.5 px-1 w-20">Banyaknya</th>
                    <th className="text-left py-1.5 px-1 w-20">Satuan</th>
                    <th className="text-right py-1.5 px-1 w-28">Harga (Rp)</th>
                    <th className="text-right py-1.5 px-2 w-32">Subtotal</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => {
                    const isAnomaly = isItemAnomaly(item);
                    return (
                      <tr key={item.id || idx} className={isAnomaly ? 'bg-rose-50/50' : 'hover:bg-slate-50'}>
                        <td className="py-1 px-1">
                          <input
                            list="cms-ingredients-datalist"
                            type="text"
                            required
                            value={item.name}
                            onChange={(e) => handleItemNameChange(idx, e.target.value)}
                            placeholder="Pilih atau ketik bahan..."
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-slate-800 focus:outline-none"
                          />
                          {isAnomaly && (
                            <span className="text-[9px] text-rose-600 font-bold block mt-0.5">
                              ⚠ Peringatan: Harga naik &gt;20% dari patokan
                            </span>
                          )}
                        </td>
                        <td className="py-1 px-1">
                          <select
                            value={item.category}
                            onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                            className="w-full rounded border border-slate-300 px-1 py-1 text-xs focus:border-slate-800 focus:outline-none"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
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
                            className="w-full rounded border border-slate-300 px-1 py-1 text-xs text-right font-mono tabular-nums focus:border-slate-800 focus:outline-none"
                          />
                        </td>
                        <td className="py-1 px-1">
                          <select
                            value={item.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-full rounded border border-slate-300 px-1 py-1 text-xs font-mono focus:border-slate-800 focus:outline-none"
                          >
                            {units.map((u) => (
                              <option key={u.id} value={u.symbol}>
                                {u.symbol}
                              </option>
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
                            className="w-full rounded border border-slate-300 px-1 py-1 text-xs text-right font-mono font-bold tabular-nums focus:border-slate-800 focus:outline-none"
                          />
                        </td>
                        <td className="py-1 px-2 text-right font-mono font-bold tabular-nums text-slate-900">
                          {formatRupiah(item.subtotal)}
                        </td>
                        <td className="py-1 px-1 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Hapus Baris"
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

          {/* Automatic Calculation Summary Box (Accurate/Jurnal Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs">
            <div className="border-r border-slate-200/80 pr-2">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">
                Uang Kasbon Dibawa:
              </span>
              <div className="font-mono font-bold text-slate-800 text-base mt-0.5">
                {formatRupiah(amountRequested)}
              </div>
              <span className="text-[10px] text-slate-400">Total modal belanja</span>
            </div>

            <div className="border-r border-slate-200/80 pr-2">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">
                Total Belanja Terpakai (Nota):
              </span>
              <div className="font-mono font-bold text-rose-600 text-base mt-0.5">
                {formatRupiah(actualReceiptTotal)}
              </div>
              <span className="text-[10px] text-slate-400">Jumlah seluruh item di nota</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">
                Sisa Uang Belanja (Kembalian):
              </span>
              <div className="font-mono font-bold text-emerald-600 text-base mt-0.5">
                {formatRupiah(changeReturned)}
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">
                {actualReceiptTotal <= amountRequested ? '✓ Kasbon tertutup sempurna' : '⚠ Belanja melebihi kasbon'}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">
                Selisih (Nota vs Kasbon):
              </span>
              <div className={`font-mono font-bold text-base mt-0.5 ${selisih.over ? 'text-rose-600' : 'text-slate-800'}`}>
                {selisih.nominalText}
              </div>
              <span className={`text-[10px] font-medium ${selisih.over ? 'text-rose-600' : 'text-slate-500'}`}>
                {selisih.persenText} dari kasbon · dihitung otomatis
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Catatan / Keterangan Pembelanjaan:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Pembelian bahan basah pasar pagi dan sembako grosir."
              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-simpan-belanja-modal"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Simpan Data Belanja & Ajukan Audit</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
