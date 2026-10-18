'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MealDelivery } from '@/lib/types';
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
  Maximize2,
  Info,
  Layers,
} from 'lucide-react';

interface OfficialBastDocumentProps {
  delivery: MealDelivery;
  onClose: () => void;
}

type ZoomPreset = 'fit-page' | 'fit-width' | '100' | 'custom';

export function OfficialBastDocument({ delivery, onClose }: OfficialBastDocumentProps) {
  // Mode Tampilan: 'a4' (Kertas A4 Resmi Standar Tata Naskah Dinas BGN) atau 'mobile' (Ringkasan Kartu HP)
  const [viewMode, setViewMode] = useState<'a4' | 'mobile'>('a4');

  // Kontrol Skala & Zoom Responsif untuk PC Desktop & Smartphone
  const [zoomPreset, setZoomPreset] = useState<ZoomPreset>('fit-page');
  const [customZoom, setCustomZoom] = useState<number>(1);
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  // Base A4 dimensions in pixels at 96 DPI (210mm x 297mm ≈ 794px x 1123px)
  const a4BaseWidth = 794;
  const a4BaseHeight = 1123;

  // Monitor perubahan ukuran jendela browser (PC Desktop, Laptop, Tablet, HP)
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

  // Shortcut Keyboard: ESC untuk menutup, Ctrl+P / Cmd+P untuk cetak
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

  // Hitung skala tampilan responsif
  const calculateCurrentScale = useCallback(() => {
    if (viewMode === 'mobile') return 1;

    if (zoomPreset === '100') return 1;
    if (zoomPreset === 'custom') return customZoom;

    // Hitung area viewport yang tersedia (dikurangi header toolbar & padding)
    const availableWidth = Math.max(300, viewport.width - (viewport.width < 640 ? 16 : 80));
    const availableHeight = Math.max(400, viewport.height - (viewport.width < 640 ? 120 : 130));

    if (zoomPreset === 'fit-width') {
      // Pas lebar layar
      return Math.min(1.3, Math.max(0.35, Number((availableWidth / a4BaseWidth).toFixed(2))));
    }

    // Default 'fit-page': Pas 1 Layar Penuh (Tinggi & Lebar muat sekaligus tanpa scroll)
    const scaleX = availableWidth / a4BaseWidth;
    const scaleY = availableHeight / a4BaseHeight;
    const fitScale = Math.min(scaleX, scaleY);
    return Math.min(1.2, Math.max(0.35, Number(fitScale.toFixed(2))));
  }, [viewMode, zoomPreset, customZoom, viewport.width, viewport.height, a4BaseWidth, a4BaseHeight]);

  const currentScale = calculateCurrentScale();

  const handleZoomIn = () => {
    setZoomPreset('custom');
    setCustomZoom((prev) => Math.min(1.5, Number((prev + 0.1).toFixed(1))));
  };

  const handleZoomOut = () => {
    setZoomPreset('custom');
    setCustomZoom((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(1))));
  };

  const handlePrint = () => {
    window.print();
  };

  // Format tanggal Indonesia resmi
  const deliveryDate = new Date(delivery.createdAt || Date.now());
  const formattedDate = deliveryDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const netConsumed = delivery.deliveredPortions || (delivery.targetPortions - (delivery.absentStudents || 0));
  const returCount = delivery.absentStudents || 0;

  return (
    <div className="official-bast-modal-overlay fixed inset-0 z-50 flex flex-col items-center bg-slate-950/92 backdrop-blur-md overflow-y-auto print:p-0 print:m-0 print:bg-white print:fixed print:inset-0">
      {/* =========================================================================
          TOOLBAR KONTROL ATAS RESPONSIF (DESKTOP PC, TABLET & HP) - PRINT HIDDEN
          ========================================================================= */}
      <header className="sticky top-0 z-60 w-full bg-slate-900/98 border-b border-slate-800 shadow-2xl backdrop-blur-xl print:hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Sisi Kiri: Judul Dokumen & Badge Pas 1 Halaman */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  Pratinjau BAST Resmi BGN
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span className="hidden xs:inline">Standar</span> Pas 1 Lembar A4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                {delivery.bastNumber || 'BAST-MBG'} • {delivery.schoolName}
              </p>
            </div>
          </div>

          {/* Sisi Tengah: Switcher Mode Tampilan & Presets Zoom */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Switcher Mode: Kertas A4 vs Ringkas HP */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/80 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('a4')}
                className={`px-2.5 sm:px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'a4'
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Format Dokumen Resmi Cetak Kertas A4"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Kertas A4</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={`px-2.5 sm:px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'mobile'
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Kartu Ringkas Layar HP"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Ringkas HP</span>
              </button>
            </div>

            {/* Presets Zoom (Khusus Mode Kertas A4) */}
            {viewMode === 'a4' && (
              <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/80 text-[11px]">
                <button
                  type="button"
                  onClick={() => setZoomPreset('fit-page')}
                  className={`px-2 sm:px-2.5 py-1 rounded-md font-medium transition ${
                    zoomPreset === 'fit-page'
                      ? 'bg-slate-700 text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Sesuaikan tinggi & lebar agar pas 1 layar PC tanpa scroll"
                >
                  <span className="hidden sm:inline">Pas </span>1 Layar
                </button>
                <button
                  type="button"
                  onClick={() => setZoomPreset('fit-width')}
                  className={`px-2 sm:px-2.5 py-1 rounded-md font-medium transition ${
                    zoomPreset === 'fit-width'
                      ? 'bg-slate-700 text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Sesuaikan selebar layar"
                >
                  Lebar
                </button>
                <button
                  type="button"
                  onClick={() => setZoomPreset('100')}
                  className={`hidden md:block px-2 sm:px-2.5 py-1 rounded-md font-medium transition ${
                    zoomPreset === '100'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ukuran fisik nyata 100%"
                >
                  100%
                </button>
                <div className="hidden sm:block h-3.5 w-px bg-slate-700 mx-1" />
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1 text-slate-400 hover:text-white transition"
                  title="Perkecil"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-slate-300 px-1 min-w-[34px] text-center">
                  {Math.round(currentScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1 text-slate-400 hover:text-white transition"
                  title="Perbesar"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Sisi Kanan: Tombol Aksi Cetak / PDF & Tutup */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-emerald-950/50 active:scale-95 cursor-pointer"
              title="Cetak A4 atau Simpan sebagai PDF (Ctrl+P)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
              <span className="hidden md:inline text-[9px] bg-emerald-700/70 px-1.5 py-0.5 rounded font-mono text-emerald-100">
                Ctrl+P
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Pratinjau (Esc)"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Info Banner Khusus Standar Cetak Kedinasan - Print Hidden */}
      <div className="w-full bg-slate-900/70 border-b border-slate-800/80 py-1 px-4 text-center text-[11px] text-slate-300 print:hidden flex items-center justify-center gap-2">
        <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>
          <strong>Standar Kedinasan BGN:</strong> Dokumen BAST ini terstandar <strong>pas 1 lembar A4 utuh</strong>. Di jendela cetak browser, gunakan tujuan <strong>&quot;Simpan sebagai PDF&quot;</strong> atau cetak langsung.
        </span>
      </div>

      {/* =========================================================================
          AREA KONTEN UTAMA: DOKUMEN RESMI BAST
          ========================================================================= */}
      <main className="w-full flex-1 flex flex-col items-center p-2 sm:p-6 print:p-0 print:m-0 print:w-full">
        {/* =====================================================================
            PILIHAN 1: MODE RINGKAS KARTU HP (UNTUK DRIVER DI LAPANGAN)
            ===================================================================== */}
        {viewMode === 'mobile' && (
          <div className="w-full max-w-md bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 space-y-3.5 print:hidden">
            {/* Header Sekolah */}
            <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {delivery.sppgUnitName}
                </span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  {delivery.bastNumber || 'BAST-MBG'}
                </span>
              </div>
              <h2 className="text-sm font-extrabold text-white">{delivery.schoolName}</h2>
              <p className="text-[11px] text-slate-300 leading-snug">{delivery.schoolAddress}</p>
            </div>

            {/* Status & Petugas */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Driver / Armada</span>
                <p className="font-bold text-slate-900 truncate">{delivery.driverName}</p>
                <p className="text-[11px] text-slate-600 font-mono">{delivery.vehiclePlate}</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Penerima Sekolah</span>
                <p className="font-bold text-slate-900 truncate">{delivery.recipientName || delivery.contactPerson}</p>
                <p className="text-[11px] text-slate-600 font-mono">{delivery.contactPhone}</p>
              </div>
            </div>

            {/* Menu 5 Pilar MBG */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950">{delivery.menuTitle}</span>
                <span className="text-[10px] bg-indigo-200/70 text-indigo-900 px-2 py-0.5 rounded-md font-bold">
                  QC: {delivery.foodTemperature || '64.5°C'}
                </span>
              </div>
              <ul className="text-[11px] text-indigo-900/90 space-y-0.5 pl-1">
                <li>• Karbohidrat: {delivery.menuDetails?.carb || 'Nasi Putih Pulen (150g)'}</li>
                <li>• Lauk Hewani: {delivery.menuDetails?.protein || 'Ayam Fillet Teriyaki (60g)'}</li>
                <li>• Sayur: {delivery.menuDetails?.veggie || 'Tumis Brokoli & Wortel (50g)'}</li>
                <li>• Buah Segar: {delivery.menuDetails?.fruit || 'Melon Potong (1 Potong)'}</li>
                <li>• Susu Pelengkap: {delivery.menuDetails?.dairy || 'Susu UHT Segar 125ml'}</li>
              </ul>
            </div>

            {/* Realisasi Wadah */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wide block">
                Realisasi Wadah Ompreng Lapangan:
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 block">Dikirim</span>
                  <span className="text-xs font-black text-slate-900">{delivery.targetPortions}</span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-rose-200">
                  <span className="text-[9px] text-rose-500 block">Retur</span>
                  <span className="text-xs font-black text-rose-700">{returCount}</span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-emerald-200">
                  <span className="text-[9px] text-emerald-600 block">Konsumsi</span>
                  <span className="text-xs font-black text-emerald-700">{netConsumed}</span>
                </div>
              </div>
            </div>

            {/* Tanda Tangan Digital Guru */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                Tanda Tangan Digital Pihak Sekolah:
              </span>
              {delivery.recipientSignature ? (
                <div className="h-16 flex items-center justify-center bg-white rounded-lg border border-slate-200 p-1">
                  <img
                    src={delivery.recipientSignature}
                    alt="Tanda Tangan Guru Penerima"
                    className="max-h-14 max-w-[200px] object-contain"
                  />
                </div>
              ) : (
                <div className="h-14 flex items-center justify-center bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-[11px] font-medium">
                  Belum ditandatangani di layar sentuh
                </div>
              )}
              <p className="text-[11px] font-bold text-slate-900">
                {delivery.recipientName || delivery.contactPerson}
              </p>
              {delivery.recipientNip && (
                <p className="text-[10px] text-slate-500">NIP: {delivery.recipientNip}</p>
              )}
            </div>

            {/* Tombol Cetak Dokumen Lengkap */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
              >
                <Printer className="w-4 h-4" />
                Cetak Format Kertas Resmi A4
              </button>
              <button
                type="button"
                onClick={() => setViewMode('a4')}
                className="w-full py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs text-center hover:bg-slate-50 transition"
              >
                Buka Pratinjau Kertas A4 Lengkap
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            PILIHAN 2: FORMAT RESMI TATA NASKAH DINAS PEMERINTAH (KERTAS A4)
            DIRANCANG PRESISI AGAR 100% PAS DI 1 HALAMAN A4 TANPA TERPOTONG
            ===================================================================== */}
        <div
          className={`${
            viewMode === 'mobile' ? 'hidden sm:flex' : 'flex'
          } official-bast-canvas-wrapper w-full justify-center items-start overflow-visible transition-all duration-150`}
        >
          {/* Kontainer Pembungkus Berskala (Menjaga Layout PC Rapi & Sentris) */}
          <div
            style={{
              width: `${a4BaseWidth * currentScale}px`,
              minWidth: `${a4BaseWidth * currentScale}px`,
              height: `${a4BaseHeight * currentScale}px`,
              position: 'relative',
            }}
            className="shrink-0 transition-all duration-150 print:!w-full print:!h-auto print:!min-w-0"
          >
            {/* Lembar Dokumen A4 Resmi Pemerintah */}
            <div
              id="official-government-bast"
              style={{
                width: `${a4BaseWidth}px`,
                minWidth: `${a4BaseWidth}px`,
                height: `${a4BaseHeight}px`,
                transform: `scale(${currentScale})`,
                transformOrigin: 'top left',
              }}
              className="bg-white text-slate-950 font-serif leading-tight select-text shadow-2xl p-8 sm:p-10 flex flex-col justify-between border border-slate-300 print:shadow-none print:border-none print:p-0 print:m-0 print:transform-none print:w-full print:max-w-none print:h-auto"
            >
              {/* SISI ATAS & KONTEN DOKUMEN */}
              <div className="space-y-2">
                {/* 1. KOP SURAT RESMI KEDINASAN PEMERINTAH */}
                <div className="border-b-[2.5px] border-double border-slate-950 pb-2 mb-2 text-center relative">
                  <div className="flex items-center justify-center gap-3.5">
                    {/* Logo Badan Gizi Nasional Resmi */}
                    <img
                      src="/badan-gizi.png"
                      alt="Logo Badan Gizi Nasional"
                      className="w-12 h-12 object-contain shrink-0"
                    />
                    <div className="leading-tight">
                      <h3 className="text-[11px] font-bold tracking-wider uppercase text-slate-800">
                        REPUBLIK INDONESIA
                      </h3>
                      <h1 className="text-[14px] font-extrabold tracking-wide uppercase text-slate-950">
                        BADAN GIZI NASIONAL (BGN)
                      </h1>
                      <h2 className="text-[12px] font-bold uppercase text-slate-900">
                        SATUAN PELAYANAN PEMENUHAN GIZI (SPPG)
                      </h2>
                      <p className="text-[9.5px] font-sans text-slate-600 mt-0.5">
                        Unit Pelaksana Teknis: {delivery.sppgUnitName} • Kab. Gresik - Jawa Timur
                      </p>
                      <p className="text-[8.5px] font-sans text-slate-500">
                        Surel Resmi: sppg.mbg@bgn.go.id | Sistem Distribusi MBG Realtime GiziFlow RI
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. JUDUL RESMI & NOMOR BAST */}
                <div className="text-center my-1.5 space-y-0.5">
                  <h2 className="text-[13px] font-extrabold uppercase tracking-wide underline decoration-1 underline-offset-4 text-slate-950">
                    BERITA ACARA SERAH TERIMA (BAST)
                  </h2>
                  <h3 className="text-[11px] font-bold uppercase text-slate-800 tracking-wider">
                    PROGRAM MAKAN BERGIZI GRATIS (MBG)
                  </h3>
                  <div className="text-[9.5px] font-sans text-slate-700 flex items-center justify-center gap-2 pt-0.5">
                    <span>
                      Nomor Dokumen: <strong className="font-mono">{delivery.bastNumber || 'BAST/MBG/BGN/2026/001'}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Lampiran Surat Jalan No: <span className="font-mono">{delivery.dispatchNumber}</span>
                    </span>
                  </div>
                </div>

                {/* 3. KLAUSUL PEMBUKA LEGALITAS */}
                <div className="text-[9.5px] font-sans text-slate-800 space-y-1.5 my-1.5 text-justify leading-snug">
                  <p>
                    Pada hari ini, <strong>{formattedDate}</strong>, bertempat di <strong>{delivery.schoolName}</strong>,
                    kami yang bertanda tangan di bawah ini:
                  </p>

                  {/* Rincian Pihak Pertama & Kedua (2 Kolom Berdampingan) */}
                  <div className="grid grid-cols-2 gap-3 pt-0.5 pb-0.5">
                    {/* Pihak Pertama: SPPG */}
                    <div className="p-2 rounded border border-slate-900 bg-slate-50/40 space-y-0.5">
                      <span className="font-bold block text-[9px] uppercase text-slate-900 border-b border-slate-300 pb-0.5">
                        I. PIHAK PERTAMA (YANG MENYERAHKAN):
                      </span>
                      <table className="w-full text-[9px]">
                        <tbody>
                          <tr>
                            <td className="w-20 text-slate-600">Nama Petugas</td>
                            <td>: <strong>{delivery.driverName}</strong></td>
                          </tr>
                          <tr>
                            <td className="text-slate-600">Jabatan</td>
                            <td>: Petugas Distribusi & Logistik SPPG</td>
                          </tr>
                          <tr>
                            <td className="text-slate-600">Unit Satuan</td>
                            <td>: {delivery.sppgUnitName}</td>
                          </tr>
                          <tr>
                            <td className="text-slate-600">Armada / Nopol</td>
                            <td>: {delivery.vehiclePlate} (Thermal Box)</td>
                          </tr>
                          <tr>
                            <td className="text-slate-600">Waktu Berangkat</td>
                            <td>: {delivery.departureTime || '10:30'} WIB</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Pihak Kedua: Sekolah */}
                    <div className="p-2 rounded border border-slate-900 bg-slate-50/40 space-y-0.5">
                      <span className="font-bold block text-[9px] uppercase text-slate-900 border-b border-slate-300 pb-0.5">
                        II. PIHAK KEDUA (YANG MENERIMA):
                      </span>
                      <table className="w-full text-[9px]">
                        <tbody>
                          <tr>
                            <td className="w-20 text-slate-600">Nama Penerima</td>
                            <td>: <strong>{delivery.recipientName || delivery.contactPerson}</strong></td>
                          </tr>
                          <tr>
                            <td className="text-slate-600">NIP / Jabatan</td>
                            <td>: {delivery.recipientNip || '-'} / Guru Piket / Tim MBG</td>
                          </tr>
                          <tr>
                            <td className="text-slate-600">Nama Sekolah</td>
                            <td>: {delivery.schoolName}</td>
                          </tr>
                          <tr>
                            <td className="text-slate-600">Alamat Lengkap</td>
                            <td>: {delivery.schoolAddress}</td>
                          </tr>
                          <tr>
                            <td className="text-slate-600">Waktu Tiba</td>
                            <td>: {delivery.actualArrival || delivery.estimatedArrival || '11:15'} WIB</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <p className="pt-0.5">
                    Dengan ini menyatakan bahwa <strong>PIHAK PERTAMA</strong> telah menyerahkan paket Makanan Bergizi Gratis (MBG)
                    kepada <strong>PIHAK KEDUA</strong>, dan <strong>PIHAK KEDUA</strong> telah menerima, memeriksa fisik, dan menguji
                    kelayakan paket makanan tersebut sesuai standar operasional Badan Gizi Nasional (BGN) dengan rincian sebagai berikut:
                  </p>
                </div>

                {/* 4. TABEL OBJEK SERAH TERIMA: 5 PILAR MBG (RINGKAS & TEGAS) */}
                <div className="my-1.5 border border-slate-950 font-sans text-[9px]">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-950 text-slate-950 font-bold text-center">
                        <th className="p-1 border-r border-slate-950 w-7">No</th>
                        <th className="p-1 border-r border-slate-950 text-left">Nama Paket & Komposisi 5 Pilar Gizi MBG</th>
                        <th className="p-1 border-r border-slate-950 w-24">Satuan Kemasan</th>
                        <th className="p-1 border-r border-slate-950 w-16">Porsi Target</th>
                        <th className="p-1 border-r border-slate-950 w-18">Porsi Diterima</th>
                        <th className="p-1 border-r border-slate-950 w-20">QC Suhu (°C)</th>
                        <th className="p-1 w-20">Status Fisik</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-950 align-top">
                        <td className="p-1.5 border-r border-slate-950 text-center font-bold">1</td>
                        <td className="p-1.5 border-r border-slate-950">
                          <p className="font-bold text-slate-950 text-[9.5px]">{delivery.menuTitle}</p>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8.5px] text-slate-700 mt-0.5 leading-tight">
                            <p>• Karbo: {delivery.menuDetails?.carb || 'Nasi Pulen (150g)'}</p>
                            <p>• Hewani: {delivery.menuDetails?.protein || 'Ayam Teriyaki (60g)'}</p>
                            <p>• Sayur: {delivery.menuDetails?.veggie || 'Tumis Brokoli (50g)'}</p>
                            <p>• Buah: {delivery.menuDetails?.fruit || 'Melon Potong (1 Ptg)'}</p>
                            <p className="col-span-2">• Pelengkap: {delivery.menuDetails?.dairy || 'Susu UHT Segar 125ml'}</p>
                          </div>
                        </td>
                        <td className="p-1.5 border-r border-slate-950 text-center text-[8.5px]">
                          Ompreng Stainless Food-Grade Tersegel
                        </td>
                        <td className="p-1.5 border-r border-slate-950 text-center font-bold text-slate-950">
                          {delivery.targetPortions} Porsi
                        </td>
                        <td className="p-1.5 border-r border-slate-950 text-center font-bold text-emerald-800">
                          {delivery.deliveredPortions || delivery.targetPortions} Porsi
                        </td>
                        <td className="p-1.5 border-r border-slate-950 text-center font-bold text-slate-950">
                          {delivery.foodTemperature || '64.5°C'}
                          <span className="block text-[7.5px] font-normal text-slate-500">(≥ 60°C)</span>
                        </td>
                        <td className="p-1.5 text-center text-emerald-800 font-bold text-[8.5px]">
                          Baik & Higienis
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 5. REKAPITULASI FISIK WADAH OMPRENG & ZERO WASTE MANAGEMENT */}
                <div className="border border-slate-950 rounded p-1.5 my-1 bg-slate-50/50 font-sans text-[9px] space-y-1">
                  <span className="font-bold uppercase text-[8.5px] text-slate-900 block border-b border-slate-300 pb-0.5">
                    REKAPITULASI PENGAWASAN FISIK WADAH OMPRENG & SISA PORSI (ZERO WASTE BGN):
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-1 rounded border border-slate-300">
                      <span className="text-[8.5px] text-slate-500 block">Total Wadah Dikirim SPPG</span>
                      <span className="font-extrabold text-slate-900 text-xs">{delivery.targetPortions} Ompreng</span>
                    </div>
                    <div className="bg-white p-1 rounded border border-slate-300">
                      <span className="text-[8.5px] text-slate-500 block">Wadah Balik / Retur Dapur</span>
                      <span className="font-bold text-rose-700 text-xs">
                        {returCount} Ompreng
                      </span>
                    </div>
                    <div className="bg-white p-1 rounded border border-slate-300">
                      <span className="text-[8.5px] text-slate-500 block">Porsi Bersih Dikonsumsi Siswa</span>
                      <span className="font-extrabold text-emerald-700 text-xs">
                        {netConsumed} Porsi
                      </span>
                    </div>
                  </div>
                  <p className="text-[8px] text-slate-600 italic">
                    * Keterangan: {delivery.surplusHandling || 'Sesuai dengan SOP Zero Waste BGN. Makanan aman dikonsumsi maksimal dalam jendela 4 jam sejak waktu keberangkatan dapur.'}
                  </p>
                </div>

                {/* 6. KLAUSUL PENUTUP */}
                <p className="text-[9px] font-sans text-slate-800 text-justify my-1 leading-snug">
                  Demikian Berita Acara Serah Terima (BAST) ini dibuat dalam keadaan sadar, sah, dan berkekuatan hukum untuk
                  dipergunakan sebagaimana mestinya sebagai bukti pertanggungjawaban fisik dan administrasi operasional Program MBG.
                </p>
              </div>

              {/* SISI BAWAH: PENGESAHAN & TANDA TANGAN TRIPARTIT (3 KOLOM BERDAMPINGAN) */}
              <div className="pt-2 border-t border-slate-950 font-sans text-[9.5px] text-slate-950 space-y-2">
                <div className="grid grid-cols-3 gap-3 text-center items-end">
                  {/* Kolom 1: Pihak Kedua (Sekolah) */}
                  <div className="flex flex-col items-center justify-between min-h-[105px]">
                    <div>
                      <span className="text-[8px] uppercase text-slate-500 font-bold block">
                        PIHAK KEDUA (PENERIMA):
                      </span>
                      <p className="font-bold text-slate-900 text-[9.5px] line-clamp-1">{delivery.schoolName}</p>
                    </div>

                    {/* Area Tanda Tangan Touchscreen Guru */}
                    <div className="my-1 h-12 flex items-center justify-center">
                      {delivery.recipientSignature ? (
                        <img
                          src={delivery.recipientSignature}
                          alt="Tanda Tangan Guru Penerima"
                          className="max-h-11 max-w-[140px] object-contain"
                        />
                      ) : (
                        <div className="border border-dashed border-slate-300 rounded px-3 py-1 text-[8.5px] text-slate-400 italic">
                          (Tanda Tangan Digital Guru)
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-bold underline text-slate-950 text-[9.5px]">
                        ( {delivery.recipientName || delivery.contactPerson} )
                      </p>
                      <p className="text-[8px] text-slate-600">
                        {delivery.recipientNip ? `NIP. ${delivery.recipientNip}` : 'Kepala Sekolah / Guru Piket'}
                      </p>
                    </div>
                  </div>

                  {/* Kolom 2: Mengetahui Kepala SPPG & QR Code Verifikasi */}
                  <div className="flex flex-col items-center justify-between min-h-[105px]">
                    <div>
                      <span className="text-[8px] uppercase text-slate-500 font-bold block">
                        MENGETAHUI / MENYETUJUI:
                      </span>
                      <p className="font-bold text-slate-900 text-[9.5px]">KEPALA UNIT SPPG</p>
                    </div>

                    {/* Badge Verifikasi QR Code Realtime */}
                    <div className="my-1 h-12 flex items-center justify-center">
                      <div className="border border-slate-900 rounded p-1 bg-white flex items-center gap-1.5 text-[7px] text-slate-700 font-mono text-left shadow-xs">
                        <QrCode className="w-7 h-7 text-slate-950 shrink-0" />
                        <span className="leading-tight">
                          VERIFIKASI RESMI<br />
                          GIZIFLOW-BGN RI<br />
                          VALID & TEREKAM
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="font-bold underline text-slate-950 text-[9.5px]">
                        ( ABDULLAH SYAUQILLAH, S.Kom )
                      </p>
                      <p className="text-[8px] text-slate-600">
                        NIP. 19960717 202601 1 002
                      </p>
                    </div>
                  </div>

                  {/* Kolom 3: Pihak Pertama (Driver SPPG) */}
                  <div className="flex flex-col items-center justify-between min-h-[105px]">
                    <div>
                      <span className="text-[8px] uppercase text-slate-500 font-bold block">
                        PIHAK PERTAMA (PENGIRIM):
                      </span>
                      <p className="font-bold text-slate-900 text-[9.5px] line-clamp-1">{delivery.sppgUnitName}</p>
                    </div>

                    {/* Tanda Tangan Driver */}
                    <div className="my-1 h-12 flex items-center justify-center font-serif italic text-slate-900 text-sm font-semibold">
                      {delivery.driverName}
                    </div>

                    <div>
                      <p className="font-bold underline text-slate-950 text-[9.5px]">
                        ( {delivery.driverName} )
                      </p>
                      <p className="text-[8px] text-slate-600">
                        Petugas Distribusi MBG
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Dokumen Kedinasan Resmi */}
                <div className="pt-1 border-t border-slate-300 text-[8px] text-slate-500 font-sans flex items-center justify-between">
                  <span>Dicetak otomatis melalui GiziFlow BGN Enterprise • Standar A4 Tata Naskah Dinas BGN RI</span>
                  <span>Dokumen Sah Elektronik Berdasarkan UU ITE No. 11/2008</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions (Hidden on Print) */}
        <div className="mt-4 w-full max-w-md sm:max-w-3xl bg-slate-900/90 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between text-xs text-white print:hidden">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px]">Siap dicetak fisik A4 atau simpan file PDF dokumen kedinasan</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / Simpan PDF
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
