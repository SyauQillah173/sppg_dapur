'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Search,
  Filter,
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

  // Default mode: Pada layar kecil/ponsel (<768px) otomatis gunakan 'mobile' card view agar nyaman dibaca
  const [viewMode, setViewMode] = useState<'a4' | 'mobile'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'mobile';
    }
    return 'a4';
  });

  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL'); // 'ALL' or specific SPPG Unit Code
  const [mobileSearch, setMobileSearch] = useState('');

  // Kontrol Skala & Zoom Responsif untuk A4
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

  // Hitung jumlah item bahan untuk dynamic compact styling (khususnya jika 20 item seperti di lapangan)
  const itemCount = distribution.items?.length || 0;
  const isUltraCompact = itemCount > 15; // 16 - 25 items (misal 20 items pas)
  const isCompact = itemCount > 9 && itemCount <= 15; // 10 - 15 items

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

  // Keyboard Shortcuts: ESC (tutup), Ctrl+P (cetak)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  // Filtered items for mobile view
  const filteredMobileItems = useMemo(() => {
    let list = distribution.items || [];
    if (mobileSearch.trim()) {
      const q = mobileSearch.toLowerCase();
      list = list.filter(
        (it) => it.name.toLowerCase().includes(q) || it.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [distribution.items, mobileSearch]);

  const totalAllItemsPurchased = useMemo(() => {
    return (distribution.items || []).reduce((acc, it) => acc + (Number(it.totalPurchased) || 0), 0);
  }, [distribution.items]);

  const modalContent = (
    <div
      id="supply-dispatch-print-root"
      className="fixed inset-0 z-[99999] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-between overflow-hidden"
    >
      {/* =========================================================================
          TOOLBAR KONTROL ATAS (RESPONSIF MOBILE & DESKTOP - HIDDEN SAAT CETAK)
          ========================================================================= */}
      <header className="no-print w-full bg-slate-900 border-b border-slate-800 text-white shadow-xl z-50 shrink-0">
        {/* Baris 1: Judul & Tombol Tutup */}
        <div className="px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                  Surat Jalan Pasokan Dapur
                </h2>
                <span className="px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  Resmi Standar BGN
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {distribution.dispatchNumber} &bull; {distribution.supplierName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {/* Tombol Cetak Langsung */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition active:scale-95"
              title="Cetak A4 / Unduh PDF (Ctrl+P)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Tutup</span>
            </button>
          </div>
        </div>

        {/* Baris 2: Mode Tampilan & Kontrol Zoom */}
        <div className="px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none text-xs">
          {/* Mode Switch: Kertas A4 vs Ringkasan HP */}
          <div className="flex bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/80 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded text-xs font-semibold transition ${
                viewMode === 'mobile'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tampilan Ringkasan Nyaman untuk HP"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Ringkasan HP</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('a4')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded text-xs font-semibold transition ${
                viewMode === 'a4'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Pratinjau Kertas A4 Dokumen Fisik"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Kertas A4</span>
            </button>
          </div>

          {/* Unit Filter Selector (Semua atau Khusus 1 Unit) */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-1 text-xs shrink-0">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={selectedUnitFilter}
              onChange={(e) => setSelectedUnitFilter(e.target.value)}
              className="bg-slate-900 text-slate-200 border-none outline-none font-semibold text-xs cursor-pointer rounded px-1 py-0.5"
            >
              <option value="ALL">Semua Dapur (Rekap 4 SPPG)</option>
              {sppgUnits.map((u) => (
                <option key={u.id} value={u.code || u.id}>
                  Khusus {u.shortName || u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Zoom Controls for A4 Preview */}
          {viewMode === 'a4' && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-lg p-0.5 text-xs shrink-0">
              <button
                type="button"
                onClick={() => {
                  setZoomPreset('fit-width');
                  setCustomZoom(calculateFitScale());
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  zoomPreset === 'fit-width'
                    ? 'bg-slate-700 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Paskan dengan Lebar Layar"
              >
                Fit
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomPreset('100');
                  setCustomZoom(1.0);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  zoomPreset === '100'
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Ukuran Nyata 100%"
              >
                100%
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
            </div>
          )}
        </div>
      </header>

      {/* =========================================================================
          AREA KONTEN DOKUMEN SURAT JALAN (RESPONSIF MOBILE & DOKUMEN CETAK A4)
          ========================================================================= */}
      <main className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center p-2 sm:p-5 scrollbar-thin">
        {/* =====================================================================
            PILIHAN 1: TAMPILAN RINGKASAN PONSEL (RESPONSIF MOBILE SCREEN)
            ===================================================================== */}
        {viewMode === 'mobile' && (
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 text-slate-900 print:hidden animate-in fade-in">
            {/* Header Pengantaran */}
            <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Surat Jalan Pasokan CV
                </span>
                <span className="text-xs text-slate-300 font-mono font-bold">
                  {distribution.dispatchNumber}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black leading-tight text-white mb-1">
                {distribution.supplierName}
              </h3>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Driver: {distribution.driverName}</span>
                <span>&bull;</span>
                <span className="font-mono text-emerald-200">{distribution.vehiclePlate || 'Armada CV'}</span>
              </p>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {/* Info Detail Ekspedisi */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tanggal</span>
                  <span className="font-semibold text-slate-900">{formattedDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">No. Nota Belanja</span>
                  <span className="font-semibold text-slate-900 font-mono">{distribution.receiptNumber || 'ALOKASI-MANDIRI'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Kontak Driver</span>
                  <span className="font-semibold text-slate-900">{distribution.driverPhone || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status Penerimaan</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block text-[11px]">
                    {distribution.status === 'COMPLETED' ? 'Diterima Lengkap' : 'Dalam Pengiriman'}
                  </span>
                </div>
              </div>

              {/* Rincian Bahan yang Disebar */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Daftar Alokasi Bahan ({itemCount} Item)</span>
                  </h4>
                  <div className="relative w-full sm:w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={mobileSearch}
                      onChange={(e) => setMobileSearch(e.target.value)}
                      placeholder="Cari bahan..."
                      className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* List Bahan Card */}
                <div className="space-y-2.5">
                  {filteredMobileItems.map((it, idx) => {
                    const totalQty = Number(it.totalPurchased) || 0;
                    return (
                      <div key={idx} className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/90 shadow-2xs">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-mono text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-slate-900 text-xs block">{it.name}</span>
                              <span className="text-[10px] text-slate-500">{it.category}</span>
                            </div>
                          </div>
                          <span className="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-xs tabular-nums">
                            {totalQty} {it.unit}
                          </span>
                        </div>

                        {/* Rincian Alokasi ke tiap Dapur */}
                        <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-white p-2 rounded-lg border border-slate-100">
                          {sppgUnits.map((u) => {
                            const code = u.code || u.id;
                            const qty = it.allocations?.[code] || 0;
                            const isMatch = selectedUnitFilter === 'ALL' || selectedUnitFilter === code;
                            return (
                              <div
                                key={u.id}
                                className={`flex justify-between items-center px-1.5 py-0.5 rounded ${
                                  isMatch ? 'bg-slate-50' : 'opacity-40'
                                }`}
                              >
                                <span className="truncate pr-1 text-slate-500 text-[10px]">{u.shortName}:</span>
                                <span className="font-bold text-slate-800 text-[11px] tabular-nums">
                                  {qty} {it.unit}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Banner Total Rekapitulasi */}
                <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase block">
                      Total Rekap Bahan Masuk
                    </span>
                    <span className="text-xs text-slate-600 font-medium">Seluruh Pasokan Belanja</span>
                  </div>
                  <span className="text-base font-black text-emerald-800 font-mono">
                    {totalAllItemsPurchased.toLocaleString('id-ID')} items
                  </span>
                </div>
              </div>

              {/* Tanda Tangan & Otoritas Mobile */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Pengesah: <strong>{headSigner.name}</strong></span>
                </div>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sah BGN</span>
                </span>
              </div>

              {/* Tombol Aksi Bawah */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('a4')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>Lihat Format A4</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            PILIHAN 2: TAMPILAN KERTAS A4 RESMI STANDAR PEMERINTAH (BGN RI)
            (Selalu dirender untuk print `@media print`, dan untuk preview A4)
            ===================================================================== */}
        <div
          className={`a4-document-viewport relative flex justify-center w-full transition-transform duration-150 ease-out origin-top ${
            viewMode === 'mobile' ? 'hidden print:block' : 'block'
          }`}
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
              padding: isUltraCompact ? '16px 28px' : isCompact ? '24px 34px' : '36px 44px',
              fontFamily: "'Times New Roman', Times, serif",
              boxSizing: 'border-box',
            }}
          >
            {/* Top Content Group */}
            <div>
              {/* Header / Kop Surat Resmi Pemerintah */}
              <div className={`border-b-2 border-slate-900 ${isUltraCompact ? 'pb-1 mb-1.5' : 'pb-2 mb-3'}`}>
                <div className="flex items-center justify-between gap-3">
                  {/* Garuda / BGN Seal */}
                  <div className={`${isUltraCompact ? 'w-11 h-11' : 'w-14 h-14'} shrink-0 flex items-center justify-center`}>
                    <svg viewBox="0 0 100 100" className={`${isUltraCompact ? 'w-10 h-10' : 'w-13 h-13'} text-amber-700`} fill="currentColor">
                      <path d="M50 10 L58 35 L85 35 L63 50 L72 75 L50 60 L28 75 L37 50 L15 35 L42 35 Z" />
                      <circle cx="50" cy="45" r="12" fill="#b91c1c" />
                      <path d="M42 45 L48 51 L58 41" stroke="#ffffff" strokeWidth="3" fill="none" />
                    </svg>
                  </div>

                  {/* Teks Kop Surat */}
                  <div className="flex-1 text-center font-serif leading-tight">
                    <h4 className={`${isUltraCompact ? 'text-[11px]' : 'text-sm'} font-bold tracking-widest text-slate-800 uppercase`}>
                      BADAN GIZI NASIONAL REPUBLIK INDONESIA
                    </h4>
                    <h2 className={`${isUltraCompact ? 'text-xs font-black' : 'text-base font-black'} tracking-wider text-slate-950 uppercase mt-0.5`}>
                      SATUAN PELAYANAN PEMENUHAN GIZI (SPPG) KABUPATEN GRESIK
                    </h2>
                    <h5 className={`${isUltraCompact ? 'text-[9.5px]' : 'text-xs'} font-bold text-slate-800 tracking-wide uppercase`}>
                      SENTRA LOGISTIK & PENGADAAN BAHAN MAKANAN PROGRAM MAKAN BERGIZI GRATIS (MBG)
                    </h5>
                    <p className={`${isUltraCompact ? 'text-[8.5px]' : 'text-[10px]'} text-slate-600 mt-0.5 font-sans`}>
                      Kawasan Dapur Sentral SPPG Gresik, Jawa Timur &bull; Email: logistik.sppg@bgn.go.id &bull; Call Center: 0812-3456-7890
                    </p>
                  </div>

                  {/* Logo SPPG */}
                  <div className={`${isUltraCompact ? 'w-11 h-11' : 'w-14 h-14'} shrink-0 flex items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800`}>
                    <div className="text-center">
                      <span className={`block ${isUltraCompact ? 'text-[10px]' : 'text-xs'} font-black tracking-tighter`}>SPPG</span>
                      <span className="block text-[8px] font-bold text-emerald-600 uppercase">DAPUR</span>
                    </div>
                  </div>
                </div>
                {/* Garis Ganda Kop Surat */}
                <div className="border-b border-slate-900 mt-1" />
              </div>

              {/* Title & Surat Jalan Header */}
              <div className={`text-center ${isUltraCompact ? 'mb-1.5' : 'mb-3'}`}>
                <h1 className={`${isUltraCompact ? 'text-xs font-black tracking-normal' : isCompact ? 'text-sm font-black' : 'text-base font-black'} uppercase tracking-wider text-slate-950 underline decoration-slate-900 decoration-1 underline-offset-4`}>
                  SURAT JALAN & BERITA ACARA ALOKASI PASOKAN BAHAN DAPUR
                </h1>
                <p className={`${isUltraCompact ? 'text-[10px]' : 'text-xs'} font-mono font-bold text-slate-800 mt-0.5`}>
                  Nomor Dokumen: <span className="text-slate-950 font-bold">{distribution.dispatchNumber}</span>
                </p>
                {selectedUnitFilter !== 'ALL' && targetUnitObj && (
                  <p className="text-[10px] font-sans font-bold text-emerald-800 bg-emerald-50 inline-block px-2.5 py-0.5 rounded border border-emerald-200 mt-0.5">
                    LEMBAR KHUSUS PENERIMAAN: {targetUnitObj.name.toUpperCase()}
                  </p>
                )}
              </div>

              {/* Ekspedisi & Metadata Box */}
              <div className={`bg-slate-50/80 border border-slate-300 rounded-lg ${isUltraCompact ? 'py-1 px-2.5 mb-1.5 text-[10px]' : isCompact ? 'py-2 px-3 mb-2 text-[11px]' : 'p-3 mb-3 text-xs'} font-sans leading-relaxed`}>
                <div className={`grid grid-cols-2 ${isUltraCompact ? 'gap-x-4 gap-y-0.5' : 'gap-x-6 gap-y-1.5'}`}>
                  <div className="flex">
                    <span className={`${isUltraCompact ? 'w-32' : 'w-36'} text-slate-600 font-medium`}>Rekanan Supplier / CV</span>
                    <span className="font-bold text-slate-900">: {distribution.supplierName}</span>
                  </div>
                  <div className="flex">
                    <span className={`${isUltraCompact ? 'w-32' : 'w-36'} text-slate-600 font-medium`}>Hari / Tanggal Pengantaran</span>
                    <span className="font-bold text-slate-900">: {formattedDate}</span>
                  </div>
                  <div className="flex">
                    <span className={`${isUltraCompact ? 'w-32' : 'w-36'} text-slate-600 font-medium`}>Nama Driver / Kurir CV</span>
                    <span className="font-bold text-slate-900">: {distribution.driverName}</span>
                  </div>
                  <div className="flex">
                    <span className={`${isUltraCompact ? 'w-32' : 'w-36'} text-slate-600 font-medium`}>Nomor Nota Asal Belanja</span>
                    <span className="font-bold text-slate-900 font-mono">: {distribution.receiptNumber || 'ALOKASI-MANDIRI'}</span>
                  </div>
                  <div className="flex">
                    <span className={`${isUltraCompact ? 'w-32' : 'w-36'} text-slate-600 font-medium`}>Armada / No. Polisi</span>
                    <span className="font-bold text-slate-900 font-mono">: {distribution.vehiclePlate || 'Mobil Box Angkut'}</span>
                  </div>
                  <div className="flex">
                    <span className={`${isUltraCompact ? 'w-32' : 'w-36'} text-slate-600 font-medium`}>Status Pengiriman</span>
                    <span className="font-bold text-emerald-800">: DITERIMA LENGKAP & MEMENUHI STANDAR GIZI</span>
                  </div>
                </div>
              </div>

              {/* Rincian Alokasi Bahan Table */}
              <div className="mb-2">
                <table className="w-full border-collapse border border-slate-800 font-sans">
                  <thead>
                    <tr className="bg-slate-100 text-slate-950 font-bold border-b border-slate-800 text-center">
                      <th className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-0.5 w-6 text-[9px]' : 'py-1.5 px-1 w-8 text-xs'}`}>NO</th>
                      <th className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-1.5 text-[9px]' : 'py-1.5 px-2 text-xs'} text-left`}>NAMA BAHAN MAKANAN</th>
                      <th className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-1 w-20 text-[8.5px]' : 'py-1.5 px-1.5 w-24 text-xs'}`}>KATEGORI GIZI</th>
                      <th className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-1 w-14 text-[9px]' : 'py-1.5 px-1.5 w-16 text-xs'}`}>TOTAL BELI</th>
                      <th className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-0.5 w-10 text-[9px]' : 'py-1.5 px-1 w-12 text-xs'}`}>SAT</th>
                      {selectedUnitFilter === 'ALL' ? (
                        sppgUnits.map((u) => (
                          <th key={u.id} className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-0.5 text-[8.5px] w-16' : 'py-1 px-1 text-[10px] w-20'} leading-tight`}>
                            {u.shortName}
                          </th>
                        ))
                      ) : (
                        <th className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-1 text-[9px] w-24' : 'py-1 px-2 text-xs w-28'} text-center bg-emerald-50 text-emerald-950`}>
                          JUMLAH DITERIMA ({targetUnitObj?.shortName || selectedUnitFilter})
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(distribution.items || []).map((it, idx) => {
                      const totalPurchased = Number(it.totalPurchased) || 0;
                      return (
                        <tr key={idx} className="border-b border-slate-700/60 hover:bg-slate-50/50">
                          <td className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-0.5 text-[8.5px]' : 'py-1 px-1 text-xs'} text-center font-mono`}>
                            {idx + 1}
                          </td>
                          <td className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-1.5 text-[9px]' : 'py-1 px-2 text-xs'} font-bold text-slate-900`}>
                            {it.name}
                          </td>
                          <td className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-0.5 text-[8px]' : 'py-1 px-1.5 text-[10px]'} text-center text-slate-700`}>
                            {it.category}
                          </td>
                          <td className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-1 text-[9px]' : 'py-1 px-1.5 text-xs'} text-right font-bold text-slate-900 font-mono`}>
                            {totalPurchased}
                          </td>
                          <td className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-0.5 text-[8.5px]' : 'py-1 px-1 text-[11px]'} text-center text-slate-600`}>
                            {it.unit}
                          </td>
                          {selectedUnitFilter === 'ALL' ? (
                            sppgUnits.map((u) => {
                              const code = u.code || u.id;
                              const qty = it.allocations?.[code] || 0;
                              return (
                                <td key={u.id} className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-0.5 text-[8.5px]' : 'py-1 px-1 text-xs'} text-right font-mono font-semibold text-slate-800`}>
                                  {qty > 0 ? qty : '-'}
                                </td>
                              );
                            })
                          ) : (
                            <td className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-1 text-[9.5px]' : 'py-1 px-2 text-sm'} text-right font-mono font-black text-emerald-900 bg-emerald-50/40`}>
                              {it.allocations?.[selectedUnitFilter] || 0} {it.unit}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                      <td colSpan={3} className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-1.5 text-[9px]' : 'py-1.5 px-2 text-xs'} text-right uppercase`}>
                        TOTAL REKAPITULASI BAHAN MASUK
                      </td>
                      <td className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-1 text-[9px]' : 'py-1.5 px-1.5 text-xs'} text-right font-mono text-slate-950 font-black`}>
                        {totalAllItemsPurchased}
                      </td>
                      <td className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-0.5 text-[8px]' : 'py-1 px-1 text-[10px]'} text-center text-slate-600`}>
                        Items
                      </td>
                      {selectedUnitFilter === 'ALL' ? (
                        sppgUnits.map((u) => {
                          const code = u.code || u.id;
                          const sumUnit = (distribution.items || []).reduce(
                            (acc, it) => acc + (Number(it.allocations?.[code]) || 0),
                            0
                          );
                          return (
                            <td key={u.id} className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-0.5 text-[8.5px]' : 'py-1 px-1 text-xs'} text-right font-mono text-slate-950 font-black`}>
                              {sumUnit}
                            </td>
                          );
                        })
                      ) : (
                        <td className={`border border-slate-800 ${isUltraCompact ? 'py-0.5 px-1 text-[9.5px]' : 'py-1 px-2 text-xs'} text-right font-mono font-black text-emerald-950 bg-emerald-50`}>
                          {(distribution.items || []).reduce(
                            (acc, it) => acc + (Number(it.allocations?.[selectedUnitFilter]) || 0),
                            0
                          )}
                        </td>
                      )}
                    </tr>
                  </tfoot>
                </table>
                <p className={`${isUltraCompact ? 'text-[8px] mt-0.5' : 'text-[10px] mt-1'} text-slate-500 font-sans italic`}>
                  * Seluruh bahan makanan yang dikirim oleh pihak CV/rekanan telah ditimbang ulang dan diperiksa kualitas kesegarannya oleh tim logistik SPPG.
                </p>
              </div>
            </div>

            {/* Bottom Group: Tanda Tangan & Watermark */}
            <div>
              {/* Tanda Tangan Resmi Pemerintah (3 Kolom) */}
              <div className={`pt-1.5 border-t border-slate-400 font-sans ${isUltraCompact ? 'text-[9.5px]' : 'text-xs'}`}>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {/* Kolom 1: Pengirim / Driver CV */}
                  <div className={`flex flex-col justify-between ${isUltraCompact ? 'h-24' : isCompact ? 'h-28' : 'h-36'}`}>
                    <div>
                      <p className={`${isUltraCompact ? 'text-[9.5px]' : 'text-[11px]'} font-bold text-slate-800`}>Yang Menyerahkan,</p>
                      <p className={`${isUltraCompact ? 'text-[8.5px]' : 'text-[10px]'} text-slate-600 font-medium`}>Petugas / Driver {distribution.supplierName}</p>
                    </div>
                    <div className={`${isUltraCompact ? 'h-9' : 'h-14'} flex items-center justify-center my-auto`}>
                      <div className={`${isUltraCompact ? 'w-18 h-8 text-[8px]' : 'w-20 h-10 text-[9px]'} border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 font-mono`}>
                        ( Tanda Tangan )
                      </div>
                    </div>
                    <div>
                      <p className={`font-bold text-slate-950 uppercase underline ${isUltraCompact ? 'text-[9.5px]' : 'text-xs'}`}>
                        {distribution.driverName}
                      </p>
                      <p className={`${isUltraCompact ? 'text-[8px]' : 'text-[10px]'} text-slate-600`}>No. Pol: {distribution.vehiclePlate || '-'}</p>
                    </div>
                  </div>

                  {/* Kolom 2: Penerima (Dapur SPPG) */}
                  <div className={`flex flex-col justify-between ${isUltraCompact ? 'h-24' : isCompact ? 'h-28' : 'h-36'}`}>
                    <div>
                      <p className={`${isUltraCompact ? 'text-[9.5px]' : 'text-[11px]'} font-bold text-slate-800`}>Yang Menerima,</p>
                      <p className={`${isUltraCompact ? 'text-[8.5px]' : 'text-[10px]'} text-slate-600 font-medium`}>
                        {selectedUnitFilter !== 'ALL' && targetUnitObj
                          ? `Koordinator Dapur ${targetUnitObj.shortName}`
                          : 'Perwakilan Petugas Dapur SPPG'}
                      </p>
                    </div>
                    <div className={`${isUltraCompact ? 'h-9' : 'h-14'} flex items-center justify-center my-auto`}>
                      <div className={`${isUltraCompact ? 'w-18 h-8 text-[8px]' : 'w-20 h-10 text-[9px]'} border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 font-mono`}>
                        ( Cap & Paraf )
                      </div>
                    </div>
                    <div>
                      <p className={`font-bold text-slate-950 uppercase underline ${isUltraCompact ? 'text-[9.5px]' : 'text-xs'}`}>
                        {selectedUnitFilter !== 'ALL' && targetUnitObj?.picName
                          ? targetUnitObj.picName
                          : '( ................................... )'}
                      </p>
                      <p className={`${isUltraCompact ? 'text-[8px]' : 'text-[10px]'} text-slate-600`}>Pengelola Dapur Unit</p>
                    </div>
                  </div>

                  {/* Kolom 3: Mengetahui (Kepala SPPG / Pejabat BGN) */}
                  <div className={`flex flex-col justify-between ${isUltraCompact ? 'h-24' : isCompact ? 'h-28' : 'h-36'}`}>
                    <div>
                      <p className={`${isUltraCompact ? 'text-[9.5px]' : 'text-[11px]'} font-bold text-slate-800`}>Mengetahui & Menyetujui,</p>
                      <p className={`${isUltraCompact ? 'text-[8.5px]' : 'text-[10px]'} text-slate-600 font-medium truncate px-1`}>
                        {headSigner.title}
                      </p>
                    </div>
                    <div className={`${isUltraCompact ? 'h-9' : 'h-14'} flex items-center justify-center my-auto`}>
                      {headSigner.signatureType === 'qr' ? (
                        <div className={`flex items-center gap-1.5 ${isUltraCompact ? 'p-0.5' : 'p-1'} bg-slate-50 border border-slate-300 rounded text-left`}>
                          <QrCode className={`${isUltraCompact ? 'w-8 h-8' : 'w-10 h-10'} text-slate-900 shrink-0`} />
                          <div className={`${isUltraCompact ? 'text-[7.5px]' : 'text-[8px]'} leading-tight text-slate-600 font-sans`}>
                            <span className="font-bold text-emerald-800 block">TERVALIDASI BGN</span>
                            <span>ID: {distribution.dispatchNumber.slice(-8)}</span>
                          </div>
                        </div>
                      ) : (
                        <div className={`${isUltraCompact ? 'w-18 h-8 text-[8px]' : 'w-20 h-10 text-[9px]'} border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 font-mono`}>
                          ( Tanda Tangan )
                        </div>
                      )}
                    </div>
                    <div>
                      <p className={`font-bold text-slate-950 uppercase underline ${isUltraCompact ? 'text-[9.5px]' : 'text-xs'}`}>
                        {headSigner.name}
                      </p>
                      <p className={`${isUltraCompact ? 'text-[8px]' : 'text-[10px]'} text-slate-600 font-mono`}>NIP. {headSigner.nip}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Watermark Validasi BGN */}
              <div className={`${isUltraCompact ? 'mt-1 pt-0.5 text-[8px]' : 'mt-2 pt-1 text-[9px]'} border-t border-slate-200 flex justify-between items-center text-slate-400 font-sans`}>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Dokumen distribusi logistik sah Sistem SPPG Dapur Enterprise &bull; Dicetak: {new Date().toLocaleString('id-ID')}</span>
                </span>
                <span>Halaman 1 dari 1 (Dokumen Tunggal A4)</span>
              </div>
            </div>
          </div>
        </div>
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
            display: block !important;
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
            padding: ${isUltraCompact ? '7mm 10mm' : isCompact ? '9mm 12mm' : '12mm 15mm'} !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </div>
  );

  return portalNode ? createPortal(modalContent, portalNode) : null;
}
