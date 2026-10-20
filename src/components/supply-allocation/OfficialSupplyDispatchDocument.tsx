'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SupplyDistribution, SppgUnit } from '@/lib/types';
import {
  Printer,
  X,
  Smartphone,
  FileText,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  ZoomIn,
  ZoomOut,
  Truck,
  Building2,
} from 'lucide-react';
import { DEFAULT_HEAD_SIGNER, HeadSignerConfig, STORAGE_KEY_HEAD_SIGNER } from '../distribution/OfficialBastDocument';

interface OfficialSupplyDispatchDocumentProps {
  distribution: SupplyDistribution;
  sppgUnits: SppgUnit[];
  onClose: () => void;
}

type ZoomPreset = 'fit-width' | '100' | 'custom';

export function OfficialSupplyDispatchDocument({
  distribution,
  sppgUnits,
  onClose,
}: OfficialSupplyDispatchDocumentProps) {
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  const [viewMode, setViewMode] = useState<'a4' | 'mobile'>('a4');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL'); // 'ALL' or specific SPPG Unit Code

  // Kontrol Skala & Zoom Responsif
  const [zoomPreset, setZoomPreset] = useState<ZoomPreset>('fit-width');
  const [customZoom, setCustomZoom] = useState<number>(1);
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  // Konfigurasi Pejabat Pengesah
  const [headSigner, setHeadSigner] = useState<HeadSignerConfig>(DEFAULT_HEAD_SIGNER);

  const a4BaseWidth = 794;
  const a4BaseHeight = 1123;

  useEffect(() => {
    let node = document.getElementById('official-supply-portal');
    if (!node) {
      node = document.createElement('div');
      node.id = 'official-supply-portal';
      document.body.appendChild(node);
    }
    setPortalNode(node);

    try {
      const saved = localStorage.getItem(STORAGE_KEY_HEAD_SIGNER);
      if (saved) {
        setHeadSigner(JSON.parse(saved));
      }
    } catch {
      // ignore
    }

    return () => {
      if (node && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const calculateFitScale = useCallback(() => {
    const availableWidth = viewport.width < 640 ? viewport.width - 24 : viewport.width - 64;
    return Math.min(1.0, Math.max(0.35, availableWidth / a4BaseWidth));
  }, [viewport.width, a4BaseWidth]);

  const activeScale = zoomPreset === 'fit-width' ? calculateFitScale() : customZoom;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(distribution.date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Target Unit Name if filtered
  const targetUnitObj = sppgUnits.find((u) => u.id === selectedUnitFilter || u.code === selectedUnitFilter);

  const modalContent = (
    <div
      id="supply-dispatch-print-root"
      className="fixed inset-0 z-[99999] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-between overflow-hidden"
    >
      {/* Top Controls Toolbar (Hidden during print) */}
      <header className="no-print w-full bg-slate-900 border-b border-slate-800 text-white px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-lg z-50 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>Surat Jalan Pasokan Dapur</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Resmi BGN
                </span>
              </h2>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[200px] sm:max-w-md">
              {distribution.dispatchNumber} &bull; {distribution.supplierName}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Unit Filter Selector (Semua atau Khusus 1 Unit) */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-1 text-xs">
            <span className="text-slate-400 font-medium">Tampilan:</span>
            <select
              value={selectedUnitFilter}
              onChange={(e) => setSelectedUnitFilter(e.target.value)}
              className="bg-slate-900 text-slate-200 border-none outline-none font-semibold text-xs cursor-pointer rounded px-1.5 py-0.5"
            >
              <option value="ALL">Rekap Gabungan (4 Dapur SPPG)</option>
              {sppgUnits.map((u) => (
                <option key={u.id} value={u.code || u.id}>
                  Khusus {u.shortName || u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switch: Kertas A4 vs Ringkasan HP */}
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/80">
            <button
              type="button"
              onClick={() => setViewMode('a4')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded text-xs font-semibold transition ${
                viewMode === 'a4'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Pratinjau Kertas A4 Standar Pemerintah"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kertas A4</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded text-xs font-semibold transition ${
                viewMode === 'mobile'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tampilan Ringkasan Ponsel"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ringkasan HP</span>
            </button>
          </div>

          {/* Zoom Controls for A4 Preview */}
          {viewMode === 'a4' && (
            <div className="hidden md:flex items-center gap-1 bg-slate-800/80 border border-slate-700/80 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setZoomPreset('fit-width');
                  setCustomZoom(calculateFitScale());
                }}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                  zoomPreset === 'fit-width'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Paskan dengan Lebar Layar"
              >
                Fit
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomPreset('custom');
                  setCustomZoom((prev) => Math.min(prev + 0.1, 1.5));
                }}
                className="p-1 hover:text-white text-slate-400"
                title="Perbesar"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomPreset('custom');
                  setCustomZoom((prev) => Math.max(prev - 0.1, 0.4));
                }}
                className="p-1 hover:text-white text-slate-400"
                title="Perkecil"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-slate-400 font-mono px-1">
                {Math.round(activeScale * 100)}%
              </span>
            </div>
          )}

          {/* Cetak / Download PDF Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>

          {/* Close Modal */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Tutup Pratinjau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Preview Container */}
      <main className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center p-2 sm:p-6 scrollbar-thin">
        {viewMode === 'mobile' ? (
          /* Mobile Ringkasan Card View */
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto text-slate-900">
            <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Surat Jalan Pasokan
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {distribution.dispatchNumber}
                </span>
              </div>
              <h3 className="text-lg font-black leading-tight text-white mb-1">
                {distribution.supplierName}
              </h3>
              <p className="text-xs text-slate-300 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                Driver: {distribution.driverName} ({distribution.vehiclePlate || 'Armada CV'})
              </p>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tanggal</span>
                  <span className="font-semibold text-slate-900">{formattedDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">No. Nota Belanja</span>
                  <span className="font-semibold text-slate-900">{distribution.receiptNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Kontak Driver</span>
                  <span className="font-semibold text-slate-900">{distribution.driverPhone || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                    {distribution.status === 'COMPLETED' ? 'Telah Diterima' : 'Dalam Pengiriman'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Rincian Alokasi ke 4 Dapur SPPG
                </h4>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {distribution.items.map((it, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="font-bold text-slate-900">{it.name}</span>
                        <span className="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                          {it.totalPurchased} {it.unit}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                        {sppgUnits.map((u) => {
                          const code = u.code || u.id;
                          const qty = it.allocations?.[code] || 0;
                          return (
                            <div key={u.id} className="flex justify-between border-b border-slate-50 pb-0.5">
                              <span className="truncate pr-1 text-slate-500">{u.shortName}:</span>
                              <span className="font-bold text-slate-800">{qty} {it.unit}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
                <span>Pengesah: {headSigner.name}</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Valid BGN
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* A4 Paper View */
          <div
            className="a4-document-viewport relative flex justify-center w-full transition-transform duration-150 ease-out origin-top"
            style={{
              transform: `scale(${activeScale})`,
              transformOrigin: 'top center',
              width: `${a4BaseWidth}px`,
              minHeight: `${a4BaseHeight}px`,
              marginBottom: `${Math.max(20, a4BaseHeight * (activeScale - 1) + 40)}px`,
            }}
          >
            <div
              id="a4-paper-page"
              className="a4-paper-sheet bg-white text-slate-900 shadow-2xl relative flex flex-col justify-between"
              style={{
                width: `${a4BaseWidth}px`,
                minHeight: `${a4BaseHeight}px`,
                padding: '36px 44px',
                fontFamily: "'Times New Roman', Times, serif",
                boxSizing: 'border-box',
              }}
            >
              {/* Header / Kop Surat Resmi Pemerintah */}
              <div className="border-b-[3px] border-slate-900 pb-2 mb-3">
                <div className="flex items-center justify-between gap-3">
                  {/* Garuda / BGN Seal */}
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-14 h-14 text-amber-700" fill="currentColor">
                      <path d="M50 10 L58 35 L85 35 L63 50 L72 75 L50 60 L28 75 L37 50 L15 35 L42 35 Z" />
                      <circle cx="50" cy="45" r="12" fill="#b91c1c" />
                      <path d="M42 45 L48 51 L58 41" stroke="#ffffff" strokeWidth="3" fill="none" />
                    </svg>
                  </div>

                  {/* Teks Kop Surat */}
                  <div className="flex-1 text-center font-serif leading-tight">
                    <h4 className="text-sm font-bold tracking-widest text-slate-800 uppercase">
                      BADAN GIZI NASIONAL REPUBLIK INDONESIA
                    </h4>
                    <h2 className="text-base font-black tracking-wider text-slate-950 uppercase mt-0.5">
                      SATUAN PELAYANAN PEMENUHAN GIZI (SPPG) KABUPATEN GRESIK
                    </h2>
                    <h5 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                      SENTRA LOGISTIK & PENGADAAN BAHAN MAKANAN PROGRAM MAKAN BERGIZI GRATIS (MBG)
                    </h5>
                    <p className="text-[10px] text-slate-600 mt-0.5 font-sans">
                      Kawasan Dapur Sentral SPPG Gresik, Jawa Timur &bull; Email: logistik.sppg@bgn.go.id &bull; Call Center: 0812-3456-7890
                    </p>
                  </div>

                  {/* Logo SPPG */}
                  <div className="w-16 h-16 shrink-0 flex items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                    <div className="text-center">
                      <span className="block text-xs font-black tracking-tighter">SPPG</span>
                      <span className="block text-[8px] font-bold text-emerald-600 uppercase">DAPUR</span>
                    </div>
                  </div>
                </div>
                {/* Garis Ganda Kop Surat */}
                <div className="border-b border-slate-900 mt-1" />
              </div>

              {/* Title & Surat Jalan Header */}
              <div className="text-center mb-3">
                <h1 className="text-base font-black uppercase tracking-wider text-slate-950 underline decoration-slate-900 decoration-1 underline-offset-4">
                  SURAT JALAN & BERITA ACARA ALOKASI PASOKAN BAHAN DAPUR
                </h1>
                <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                  Nomor Dokumen: <span className="text-slate-950">{distribution.dispatchNumber}</span>
                </p>
                {selectedUnitFilter !== 'ALL' && targetUnitObj && (
                  <p className="text-xs font-sans font-bold text-emerald-800 bg-emerald-50 inline-block px-3 py-0.5 rounded border border-emerald-200 mt-1">
                    LEMBAR KHUSUS PENERIMAAN: {targetUnitObj.name.toUpperCase()}
                  </p>
                )}
              </div>

              {/* Ekspedisi & Metadata Box */}
              <div className="bg-slate-50/80 border border-slate-300 rounded-lg p-3 mb-3 text-xs font-sans leading-relaxed">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">Rekanan Supplier / CV</span>
                    <span className="font-bold text-slate-900">: {distribution.supplierName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">Hari / Tanggal Pengantaran</span>
                    <span className="font-bold text-slate-900">: {formattedDate}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">Nama Driver / Kurir CV</span>
                    <span className="font-bold text-slate-900">: {distribution.driverName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">Nomor Nota Asal Belanja</span>
                    <span className="font-bold text-slate-900 font-mono">: {distribution.receiptNumber || 'Pembelanjaan Terverifikasi'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">Armada / No. Polisi</span>
                    <span className="font-bold text-slate-900 font-mono">: {distribution.vehiclePlate || 'Mobil Box Angkut'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">Status Pengiriman</span>
                    <span className="font-bold text-emerald-800">: DITERIMA LENGKAP & MEMENUHI STANDAR GIZI</span>
                  </div>
                </div>
              </div>

              {/* Rincian Alokasi Bahan Table */}
              <div className="flex-1 mb-3">
                <table className="w-full border-collapse border border-slate-800 text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-100 text-slate-950 font-bold border-b border-slate-800 text-center">
                      <th className="border border-slate-800 py-1.5 px-1 w-8">NO</th>
                      <th className="border border-slate-800 py-1.5 px-2 text-left">NAMA BAHAN MAKANAN</th>
                      <th className="border border-slate-800 py-1.5 px-1.5 w-24">KATEGORI GIZI</th>
                      <th className="border border-slate-800 py-1.5 px-1.5 w-16">TOTAL BELI</th>
                      <th className="border border-slate-800 py-1.5 px-1 w-12">SAT</th>
                      {selectedUnitFilter === 'ALL' ? (
                        sppgUnits.map((u) => (
                          <th key={u.id} className="border border-slate-800 py-1 px-1 text-[10px] w-20 leading-tight">
                            {u.shortName}
                          </th>
                        ))
                      ) : (
                        <th className="border border-slate-800 py-1 px-2 text-center w-28 bg-emerald-50 text-emerald-950">
                          JUMLAH DITERIMA ({targetUnitObj?.shortName || selectedUnitFilter})
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {distribution.items.map((it, idx) => {
                      const totalPurchased = Number(it.totalPurchased) || 0;
                      return (
                        <tr key={idx} className="border-b border-slate-700/60 hover:bg-slate-50/50">
                          <td className="border border-slate-800 py-1 px-1 text-center font-mono">{idx + 1}</td>
                          <td className="border border-slate-800 py-1 px-2 font-bold text-slate-900">{it.name}</td>
                          <td className="border border-slate-800 py-1 px-1.5 text-center text-[10px] text-slate-700">{it.category}</td>
                          <td className="border border-slate-800 py-1 px-1.5 text-right font-bold text-slate-900 font-mono">
                            {totalPurchased}
                          </td>
                          <td className="border border-slate-800 py-1 px-1 text-center text-[11px] text-slate-600">{it.unit}</td>
                          {selectedUnitFilter === 'ALL' ? (
                            sppgUnits.map((u) => {
                              const code = u.code || u.id;
                              const qty = it.allocations?.[code] || 0;
                              return (
                                <td key={u.id} className="border border-slate-800 py-1 px-1 text-right font-mono font-semibold text-slate-800">
                                  {qty > 0 ? qty : '-'}
                                </td>
                              );
                            })
                          ) : (
                            <td className="border border-slate-800 py-1 px-2 text-right font-mono font-black text-emerald-900 bg-emerald-50/40 text-sm">
                              {it.allocations?.[selectedUnitFilter] || 0} {it.unit}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                      <td colSpan={3} className="border border-slate-800 py-1.5 px-2 text-right uppercase">
                        TOTAL REKAPITULASI BAHAN MASUK
                      </td>
                      <td className="border border-slate-800 py-1.5 px-1.5 text-right font-mono text-slate-950 font-black">
                        {distribution.items.reduce((acc, it) => acc + (Number(it.totalPurchased) || 0), 0)}
                      </td>
                      <td className="border border-slate-800 py-1 px-1 text-center text-[10px] text-slate-600">Items</td>
                      {selectedUnitFilter === 'ALL' ? (
                        sppgUnits.map((u) => {
                          const code = u.code || u.id;
                          const sumUnit = distribution.items.reduce(
                            (acc, it) => acc + (Number(it.allocations?.[code]) || 0),
                            0
                          );
                          return (
                            <td key={u.id} className="border border-slate-800 py-1 px-1 text-right font-mono text-slate-950 font-black">
                              {sumUnit}
                            </td>
                          );
                        })
                      ) : (
                        <td className="border border-slate-800 py-1 px-2 text-right font-mono font-black text-emerald-950 bg-emerald-50">
                          {distribution.items.reduce(
                            (acc, it) => acc + (Number(it.allocations?.[selectedUnitFilter]) || 0),
                            0
                          )}
                        </td>
                      )}
                    </tr>
                  </tfoot>
                </table>
                <p className="text-[10px] text-slate-500 font-sans mt-1 italic">
                  * Seluruh bahan makanan yang dikirim oleh pihak CV/rekanan telah ditimbang ulang dan diperiksa kualitas kesegarannya oleh tim logistik SPPG.
                </p>
              </div>

              {/* Tanda Tangan Resmi Pemerintah (3 Kolom) */}
              <div className="pt-2 border-t border-slate-400 text-xs font-sans">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {/* Kolom 1: Pengirim / Driver CV */}
                  <div className="flex flex-col justify-between h-36">
                    <div>
                      <p className="text-[11px] font-bold text-slate-800">Yang Menyerahkan,</p>
                      <p className="text-[10px] text-slate-600 font-medium">Petugas / Driver {distribution.supplierName}</p>
                    </div>
                    <div className="h-16 flex items-center justify-center my-auto">
                      <div className="w-20 h-10 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 font-mono">
                        ( Tanda Tangan )
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-950 uppercase underline">{distribution.driverName}</p>
                      <p className="text-[10px] text-slate-600">No. Pol: {distribution.vehiclePlate || '-'}</p>
                    </div>
                  </div>

                  {/* Kolom 2: Penerima (Dapur SPPG) */}
                  <div className="flex flex-col justify-between h-36">
                    <div>
                      <p className="text-[11px] font-bold text-slate-800">Yang Menerima,</p>
                      <p className="text-[10px] text-slate-600 font-medium">
                        {selectedUnitFilter !== 'ALL' && targetUnitObj
                          ? `Koordinator Dapur ${targetUnitObj.shortName}`
                          : 'Perwakilan Petugas Dapur SPPG'}
                      </p>
                    </div>
                    <div className="h-16 flex items-center justify-center my-auto">
                      <div className="w-20 h-10 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 font-mono">
                        ( Cap & Paraf )
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-950 uppercase underline">
                        {selectedUnitFilter !== 'ALL' && targetUnitObj?.picName
                          ? targetUnitObj.picName
                          : '( ................................... )'}
                      </p>
                      <p className="text-[10px] text-slate-600">Pengelola Dapur Unit</p>
                    </div>
                  </div>

                  {/* Kolom 3: Mengetahui (Kepala SPPG / Pejabat BGN) */}
                  <div className="flex flex-col justify-between h-36">
                    <div>
                      <p className="text-[11px] font-bold text-slate-800">Mengetahui & Menyetujui,</p>
                      <p className="text-[10px] text-slate-600 font-medium truncate px-1">
                        {headSigner.title}
                      </p>
                    </div>
                    <div className="h-16 flex items-center justify-center my-auto">
                      {headSigner.signatureType === 'qr' ? (
                        <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-300 rounded text-left">
                          <QrCode className="w-10 h-10 text-slate-900 shrink-0" />
                          <div className="text-[8px] leading-tight text-slate-600 font-sans">
                            <span className="font-bold text-emerald-800 block">TERVALIDASI BGN</span>
                            <span>ID: {distribution.dispatchNumber.slice(-8)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-20 h-10 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 font-mono">
                          ( Tanda Tangan )
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-950 uppercase underline">{headSigner.name}</p>
                      <p className="text-[10px] text-slate-600 font-mono">NIP. {headSigner.nip}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Watermark Validasi BGN */}
              <div className="mt-2 pt-1 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400 font-sans">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Dokumen distribusi logistik sah Sistem SPPG Dapur Enterprise &bull; Dicetak: {new Date().toLocaleString('id-ID')}
                </span>
                <span>Halaman 1 dari 1 (Dokumen Tunggal A4)</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Print Isolation CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body > *:not(#official-supply-portal) {
            display: none !important;
          }
          #official-supply-portal {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
          }
          #supply-dispatch-print-root {
            position: static !important;
            display: block !important;
            background: transparent !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
          .a4-document-viewport {
            transform: none !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #a4-paper-page {
            width: 100% !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            box-shadow: none !important;
            border: none !important;
            padding: 12mm 15mm !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );

  return portalNode ? createPortal(modalContent, portalNode) : null;
}
