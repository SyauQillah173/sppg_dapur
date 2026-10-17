'use client';

import React from 'react';
import { ProcurementTransaction } from '@/lib/types';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
  Download,
  ExternalLink,
} from 'lucide-react';

interface ViewReturnProofModalProps {
  transaction: ProcurementTransaction;
  onClose: () => void;
  onEditProof?: () => void;
}

export function ViewReturnProofModal({
  transaction,
  onClose,
  onEditProof,
}: ViewReturnProofModalProps) {
  const sisaKas = transaction.changeReturned > 0 
    ? transaction.changeReturned 
    : Math.max(0, transaction.amountRequested - transaction.actualReceiptTotal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-lg max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-emerald-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                Bukti TF Pengembalian Sisa Kasbon
              </h2>
              <p className="text-xs text-emerald-200">
                Status: Sisa Kas Lunas Disetorkan ke Kas Bendahara
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-slate-700">
          {/* Card Info Status */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Nomor Nota:</span>
              <span className="font-mono font-bold text-slate-900">{transaction.receiptNumber}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-y border-emerald-100">
              <span className="text-xs text-emerald-900 font-bold uppercase tracking-wider">
                Nominal Sisa Kas Disetorkan:
              </span>
              <span className="font-mono font-bold text-base sm:text-lg text-emerald-700">
                {formatRupiah(sisaKas)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div>
                <span className="text-slate-500 block">Disetor Oleh:</span>
                <span className="font-semibold text-slate-800">
                  {transaction.returnedBy || transaction.requesterName}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Diterima Oleh:</span>
                <span className="font-semibold text-slate-800">
                  {transaction.returnedTo || 'Bendahara SPPG'}
                </span>
              </div>
            </div>

            {transaction.returnedAt && (
              <div className="text-[11px] text-slate-600 flex items-center gap-1 pt-1">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  Waktu Setor:{' '}
                  <strong>{formatDateIndo(transaction.returnedAt.slice(0, 10))}</strong>
                </span>
              </div>
            )}

            {transaction.returnNotes && (
              <div className="rounded-lg bg-white/80 p-2 border border-emerald-100 text-[11px] text-slate-700">
                <span className="text-slate-500 block text-[10px]">Catatan / Ref Bank:</span>
                {transaction.returnNotes}
              </div>
            )}
          </div>

          {/* Gambar Bukti Transfer */}
          <div>
            <span className="font-semibold text-slate-800 block mb-1.5">
              Lampiran Slip / Tangkapan Layar Transfer Bank:
            </span>
            {transaction.returnProofUrl ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 text-center shadow-inner">
                <img
                  src={transaction.returnProofUrl}
                  alt="Bukti Transfer Sisa Kasbon"
                  className="w-full max-h-[380px] object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
                Foto bukti transfer belum diunggah.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50">
          {onEditProof ? (
            <button
              type="button"
              onClick={onEditProof}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Ubah Data Setoran
            </button>
          ) : <div />}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
