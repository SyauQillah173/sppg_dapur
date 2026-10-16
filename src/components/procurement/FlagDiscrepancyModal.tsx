'use client';

import React, { useState, useEffect } from 'react';
import { ProcurementTransaction } from '@/lib/types';
import { formatIDR } from '@/lib/utils';
import { AlertTriangle, X, Check, FileWarning, Tag, Sparkles } from 'lucide-react';

interface FlagDiscrepancyModalProps {
  isOpen: boolean;
  transaction: ProcurementTransaction;
  hasAnyAnomaly?: boolean;
  initialReason?: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

const PRESET_REASONS = [
  'Kenaikan harga satuan bahan melebihi batas toleransi wajar (+20%)',
  'Kuantitas fisik barang yang diterima di gudang kurang dari nota',
  'Stempel basah CV / tanda tangan toko tidak sah atau buram',
  'Barang belanja rusak / mutu gizi tidak memenuhi standar SPPG',
  'Sisa uang belanja (kembalian) kasbon tidak klop dengan fisik uang',
  'Nama barang pada nota fisik berbeda dengan rincian digital',
];

export function FlagDiscrepancyModal({
  isOpen,
  transaction,
  hasAnyAnomaly = false,
  initialReason = '',
  onConfirm,
  onClose,
}: FlagDiscrepancyModalProps) {
  const [reason, setReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialReason) {
        setReason(initialReason);
      } else if (hasAnyAnomaly) {
        setReason('Kenaikan harga satuan bahan melebihi batas toleransi wajar (+20%)');
      } else {
        setReason('');
      }
      setErrorMsg('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, initialReason, hasAnyAnomaly]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: string) => {
    if (!reason.trim()) {
      setReason(preset);
    } else if (reason.includes(preset)) {
      // already included
    } else {
      setReason((prev) => `${prev}. ${preset}`);
    }
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Harap masukkan atau pilih alasan selisih sebelum menandai.');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200/90 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-0.5 pr-6">
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Tandai Catatan Belanja: Ada Selisih
            </h3>
            <p className="text-xs text-slate-500">
              Dokumen audit resmi rekonsiliasi SPJ SPPG
            </p>
          </div>
        </div>

        {/* Transaction Brief Card */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-200/60 pb-2">
            <span className="font-mono font-semibold text-slate-700">
              {transaction.receiptNumber}
            </span>
            <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
              {transaction.sppgUnitName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block">CV / Supplier:</span>
              <span className="font-semibold text-slate-800">{transaction.supplierName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Peminta Belanja:</span>
              <span className="font-semibold text-slate-800">{transaction.requesterName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Uang Kasbon:</span>
              <span className="font-mono font-bold text-slate-800">
                {formatIDR(transaction.amountRequested)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Nota Toko:</span>
              <span className="font-mono font-bold text-rose-600">
                {formatIDR(transaction.actualReceiptTotal)}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Preset Reason Chips */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Pilih Cepat Kategori Selisih (Klik untuk Memasukkan):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_REASONS.map((preset, idx) => {
                const isSelected = reason.includes(preset);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition text-left ${
                      isSelected
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/70'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-amber-700 shrink-0" />}
                    <span>{preset}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Textarea */}
          <div>
            <label
              htmlFor="discrepancy-reason-input"
              className="text-xs font-semibold text-slate-800 block mb-1"
            >
              Uraian / Alasan Penandaan Selisih (Wajib):
            </label>
            <textarea
              id="discrepancy-reason-input"
              required
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Contoh: Kenaikan harga telur melebihi toleransi 20% dari patokan, serta jumlah fisik kubis kurang 5 kg dari nota toko."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition leading-relaxed"
            />
            {errorMsg && (
              <p className="mt-1 text-[11px] text-rose-600 font-medium">
                {errorMsg}
              </p>
            )}
          </div>

          {/* Advisory Notice */}
          <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 p-2.5 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
            <FileWarning className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              Status catatan belanja ini akan ditandai <strong>&quot;Ada Selisih&quot;</strong>. Nota tidak dapat di-ACC sampai ada klarifikasi resmi dari petugas pembelanjaan / CV supplier.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-amber-500 transition active:scale-98"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Simpan &amp; Tandai Ada Selisih</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
