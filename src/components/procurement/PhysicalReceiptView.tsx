'use client';

import React, { useState } from 'react';
import { ProcurementTransaction } from '@/lib/types';
import { formatIDR, formatKg, formatDateIndo } from '@/lib/utils';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface PhysicalReceiptViewProps {
  transaction: ProcurementTransaction;
}

export function PhysicalReceiptView({ transaction }: PhysicalReceiptViewProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 75));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoomLevel(100);
    setRotation(0);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
      {/* Top Toolbar for Receipt Viewer */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800 text-slate-300 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-400 font-semibold">{transaction.receiptNumber}</span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
            Fisik Asli Nota Toko
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            title="Perkecil (-)"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="font-mono text-[11px] px-1 text-slate-400">{zoomLevel}%</span>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Perbesar (+)"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <div className="h-3 w-px bg-slate-800 mx-1" />
          <button
            type="button"
            onClick={handleRotate}
            title="Putar 90 Derajat"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Viewport Area */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/90 relative select-none">
        <div
          style={{
            transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
          }}
          className="w-[430px] min-h-[580px] bg-[#fffef9] text-slate-900 shadow-2xl p-6 rounded-sm border border-amber-100/60 font-mono text-[11px] relative leading-relaxed"
        >
          {/* Paper Texture and Perforation Header */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-200/40 via-amber-100 to-amber-200/40" />

          {/* Supplier Header */}
          <div className="border-b-2 border-dashed border-slate-400 pb-3 text-center">
            <h3 className="font-bold text-sm tracking-wider uppercase text-slate-950 font-serif">
              {transaction.supplierName}
            </h3>
            <p className="text-[10px] text-slate-600 mt-0.5">{transaction.supplierAddress}</p>
            <p className="text-[9px] text-slate-500">Telp / WA: 0811-2345-6789 | NPWP: 31.849.029.1-612.000</p>
          </div>

          {/* Nota Metadata */}
          <div className="py-2.5 border-b border-dashed border-slate-300 text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span className="text-slate-600">NO. NOTA:</span>
              <span className="font-bold text-slate-900">{transaction.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">TANGGAL:</span>
              <span>{formatDateIndo(transaction.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">KEPADA:</span>
              <span className="font-semibold text-slate-800">{transaction.sppgUnitName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">PEMINTA:</span>
              <span>{transaction.requesterName}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-2 border-b-2 border-dashed border-slate-400">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600 text-[9px] uppercase">
                  <th className="text-left py-1 font-semibold">Bahan</th>
                  <th className="text-right py-1 font-semibold">Qty</th>
                  <th className="text-right py-1 font-semibold">Harga</th>
                  <th className="text-right py-1 font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {transaction.items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-1 pr-1 font-sans text-[10.5px] text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-1 text-right tabular-nums font-mono text-[10px] text-slate-700 whitespace-nowrap">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-1 text-right tabular-nums font-mono text-[10px] text-slate-600 whitespace-nowrap">
                      {formatIDR(item.unitPrice).replace('Rp', '').trim()}
                    </td>
                    <td className="py-1 text-right tabular-nums font-mono text-[10px] font-medium text-slate-900 whitespace-nowrap">
                      {formatIDR(item.subtotal).replace('Rp', '').trim()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="py-3 border-b-2 border-slate-700 text-[11px] space-y-1">
            <div className="flex justify-between font-bold text-slate-900 text-xs">
              <span>TOTAL FISIK NOTA:</span>
              <span className="font-mono tabular-nums">{formatIDR(transaction.actualReceiptTotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[10px]">
              <span>DANA TUNAI DITERIMA:</span>
              <span className="font-mono tabular-nums">{formatIDR(transaction.amountRequested)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[10px] font-semibold">
              <span>KEMBALI UANG KAS:</span>
              <span className="font-mono tabular-nums text-emerald-700">{formatIDR(transaction.changeReturned)}</span>
            </div>
          </div>

          {/* Signatures & Official Stamp */}
          <div className="pt-4 flex justify-between items-end relative min-h-[90px]">
            <div className="text-center text-[9px] text-slate-600">
              <p>Tanda Terima SPPG,</p>
              <div className="h-8 flex items-center justify-center font-serif italic text-slate-800 text-[10px] opacity-80">
                ({transaction.requesterName})
              </div>
              <p className="border-t border-slate-400 pt-0.5">Petugas Dapur</p>
            </div>

            {/* Official CV Rubber Stamp in Blue Ink */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 pointer-events-none transform -rotate-12 border-2 border-blue-600/80 rounded-full w-24 h-24 p-1 flex items-center justify-center text-center text-blue-700/80 opacity-90 mix-blend-multiply">
              <div className="border border-dashed border-blue-600 rounded-full w-full h-full flex flex-col items-center justify-center p-1">
                <span className="text-[7.5px] font-bold uppercase tracking-tight">CV SUMBER PANGAN</span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest my-0.5 text-blue-800">★ LUNAS ★</span>
                <span className="text-[7px] font-mono">GRESIK JAWA TIMUR</span>
              </div>
            </div>

            <div className="text-center text-[9px] text-slate-600">
              <p>Hormat Kami,</p>
              <div className="h-8 flex items-center justify-center font-serif italic text-slate-800 text-[10px] opacity-80">
                (H. Sudirman Santoso)
              </div>
              <p className="border-t border-slate-400 pt-0.5">CV / Supplier</p>
            </div>
          </div>

          {/* Verification Barcode footer */}
          <div className="mt-4 pt-2 border-t border-dashed border-slate-300 text-center text-[8px] text-slate-400 font-mono tracking-widest">
            * DOKUMEN FISIK SAH UNTUK AUDIT BPK/INSPEKTORAT SPPG *
          </div>
        </div>
      </div>
    </div>
  );
}
