'use client';

import React, { useState } from 'react';
import { ProcurementTransaction } from '@/lib/types';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { compressImageHD } from '@/lib/image-compress';
import { useStore } from '@/lib/store';
import {
  X,
  Upload,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Wallet,
  Receipt,
  User,
  Building2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface ReturnChangeModalProps {
  transaction: ProcurementTransaction;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReturnChangeModal({ transaction, onClose, onSuccess }: ReturnChangeModalProps) {
  const { employees, refreshFromDb } = useStore();

  const [returnedBy, setReturnedBy] = useState<string>(
    transaction.requesterName || 'Pemegang Kasbon'
  );
  const [returnedTo, setReturnedTo] = useState<string>(
    'Bendahara Pengeluaran SPPG'
  );
  const [returnedAt, setReturnedAt] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [returnProofUrl, setReturnProofUrl] = useState<string>(
    transaction.returnProofUrl || ''
  );
  const [returnNotes, setReturnNotes] = useState<string>(
    transaction.returnNotes || 'Pengembalian sisa uang kasbon belanja via Transfer Bank'
  );
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Remaining change to return
  const sisaKas = transaction.changeReturned > 0 
    ? transaction.changeReturned 
    : Math.max(0, transaction.amountRequested - transaction.actualReceiptTotal);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setCompressionInfo('Mengompresi bukti transfer bank (kualitas HD)...');
    try {
      const compressed = await compressImageHD(file);
      setReturnProofUrl(compressed.dataUrl);
      setCompressionInfo(
        `Foto Bukti TF Siap: ${compressed.formattedCompressed} (Hemat ${compressed.reductionPercentage}%)`
      );
    } catch (err: any) {
      setError(err?.message || 'Gagal memproses gambar bukti transfer');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnProofUrl) {
      setError('Wajib mengunggah foto Bukti Transfer / Kwitansi Setoran Sisa Kas ke Bendahara demi transparansi audit!');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/procurement/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isChangeReturned: true,
          returnProofUrl,
          returnedAt: new Date(returnedAt).toISOString(),
          returnedBy: returnedBy.trim(),
          returnedTo: returnedTo.trim(),
          returnNotes: returnNotes.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyimpan bukti setoran sisa kas');
      }

      // Refresh store data so state updates globally across all modules
      await refreshFromDb();
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Terjadi gangguan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                Setor Bukti TF Sisa Kasbon
                <span className="text-[10px] font-semibold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                  Transparansi SPPG
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Verifikasi pengembalian kelebihan dana belanja ke Bendahara
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-slate-700">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-800 flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs font-medium">{error}</div>
            </div>
          )}

          {/* Rincian Kasbon & Sisa */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
              <span className="text-xs text-slate-600 font-medium">Nomor Nota / SPJ:</span>
              <span className="font-mono font-bold text-slate-900">{transaction.receiptNumber}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">Dana Kasbon Awal:</span>
                <span className="font-mono font-semibold text-slate-800 text-xs sm:text-sm">
                  {formatRupiah(transaction.amountRequested)}
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">Total Belanja Riil:</span>
                <span className="font-mono font-semibold text-rose-600 text-xs sm:text-sm">
                  {formatRupiah(transaction.actualReceiptTotal)}
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-emerald-300 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 block uppercase tracking-wider">
                  Sisa Kas Wajib Ditransfer Balik:
                </span>
                <span className="text-[10px] text-slate-500">
                  Kelebihan uang di tangan peminta yang harus kembali ke kas
                </span>
              </div>
              <span className="text-base sm:text-lg font-bold font-mono text-emerald-700">
                {formatRupiah(sisaKas)}
              </span>
            </div>
          </div>

          {/* Input Data Setoran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Disetor Oleh (Nama Peminta):
              </label>
              <input
                type="text"
                required
                value={returnedBy}
                onChange={(e) => setReturnedBy(e.target.value)}
                placeholder="Contoh: Budi Santoso (Koordinator Pengadaan)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Diterima Oleh (Bendahara SPPG):
              </label>
              <input
                type="text"
                required
                value={returnedTo}
                onChange={(e) => setReturnedTo(e.target.value)}
                placeholder="Contoh: Bendahara Pengeluaran SPPG"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Tanggal Transfer Pengembalian:
            </label>
            <input
              type="date"
              required
              value={returnedAt}
              onChange={(e) => setReturnedAt(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
            />
          </div>

          {/* Upload Bukti TF Pengembalian */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Foto Bukti Transfer Bank / Slip Setoran Sisa Kas:
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 text-center bg-slate-50/50 transition">
              {returnProofUrl ? (
                <div className="space-y-3">
                  <div className="relative mx-auto max-w-[240px] rounded-lg overflow-hidden border border-slate-300 shadow-sm">
                    <img
                      src={returnProofUrl}
                      alt="Bukti Transfer Sisa Kas"
                      className="w-full max-h-48 object-contain bg-slate-900"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition">
                      <Camera className="h-3.5 w-3.5" />
                      Ganti Foto Bukti
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setReturnProofUrl('');
                        setCompressionInfo(null);
                      }}
                      className="px-3 py-1.5 border border-rose-200 text-rose-600 rounded-lg text-xs font-semibold hover:bg-rose-50 transition"
                    >
                      Hapus Foto
                    </button>
                  </div>
                  {compressionInfo && (
                    <p className="text-[10px] text-emerald-600 font-mono font-medium">
                      ✓ {compressionInfo}
                    </p>
                  )}
                </div>
              ) : (
                <label className="cursor-pointer block space-y-2 py-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    {isUploading ? (
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6" />
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    Klik untuk upload foto slip transfer bank
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Mendukung JPG, PNG, screenshot m-Banking (Auto kompresi HD)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Catatan Rekening / No. Referensi Transfer:
            </label>
            <input
              type="text"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              placeholder="Contoh: Transfer via BCA ke Rekening SPPG (Ref: 9812481)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-slate-800 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Konfirmasi & Simpan Setoran Sisa Kas
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
