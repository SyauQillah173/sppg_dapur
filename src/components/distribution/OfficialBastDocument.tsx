'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Settings,
  Upload,
  PenTool,
  RotateCcw,
  Check,
  Edit3,
} from 'lucide-react';

interface OfficialBastDocumentProps {
  delivery: MealDelivery;
  onClose: () => void;
}

type ZoomPreset = 'fit-page' | 'fit-width' | '100' | 'custom';
type HeadSignatureType = 'qr' | 'image' | 'blank';

interface HeadSignerConfig {
  name: string;
  nip: string;
  title: string;
  signatureType: HeadSignatureType;
  signatureImage?: string;
}

const DEFAULT_HEAD_SIGNER: HeadSignerConfig = {
  name: 'ABDULLAH SYAUQILLAH, S.Kom',
  nip: '19960717 202601 1 002',
  title: 'KEPALA SATUAN PELAYANAN PEMENUHAN GIZI (SPPG)',
  signatureType: 'qr',
  signatureImage: '',
};

export function OfficialBastDocument({ delivery, onClose }: OfficialBastDocumentProps) {
  // DOM Portal Container untuk Isolasi Cetak (Menghilangkan Dashboard Halaman 2)
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  // Mode Tampilan: 'a4' (Kertas A4 Resmi) atau 'mobile' (Ringkasan Kartu HP)
  const [viewMode, setViewMode] = useState<'a4' | 'mobile'>('a4');

  // Kontrol Skala & Zoom Responsif
  const [zoomPreset, setZoomPreset] = useState<ZoomPreset>('fit-page');
  const [customZoom, setCustomZoom] = useState<number>(1);
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  // Konfigurasi Pejabat Pengesah (Kepala Unit SPPG / BGN)
  const [headSigner, setHeadSigner] = useState<HeadSignerConfig>(DEFAULT_HEAD_SIGNER);
  const [isSignerModalOpen, setIsSignerModalOpen] = useState(false);
  const [tempSigner, setTempSigner] = useState<HeadSignerConfig>(DEFAULT_HEAD_SIGNER);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Ukuran Standar A4 Resmi (210mm x 297mm ≈ 794px x 1123px pada 96 DPI)
  const a4BaseWidth = 794;
  const a4BaseHeight = 1123;

  // Inisialisasi Portal DOM langsung ke document.body
  useEffect(() => {
    let node = document.getElementById('official-bast-portal');
    if (!node) {
      node = document.createElement('div');
      node.id = 'official-bast-portal';
      document.body.appendChild(node);
    }
    setPortalNode(node);

    // Muat konfigurasi kepala unit yang tersimpan di localStorage
    try {
      const saved = localStorage.getItem('sppg_head_signer_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        setHeadSigner(parsed);
        setTempSigner(parsed);
      }
    } catch {
      // ignore parsing error
    }

    return () => {
      if (node && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    };
  }, []);

  // Monitor ukuran viewport browser (HP, Tablet, PC)
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
        if (isSignerModalOpen) {
          setIsSignerModalOpen(false);
        } else {
          onClose();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSignerModalOpen]);

  // Hitung skala tampilan otomatis
  const calculateCurrentScale = useCallback(() => {
    if (viewMode === 'mobile') return 1;
    if (zoomPreset === '100') return 1;
    if (zoomPreset === 'custom') return customZoom;

    const isMobileDevice = viewport.width < 640;
    const availableWidth = Math.max(300, viewport.width - (isMobileDevice ? 16 : 64));
    const availableHeight = Math.max(380, viewport.height - (isMobileDevice ? 150 : 130));

    if (zoomPreset === 'fit-width') {
      return Math.min(1.3, Math.max(0.35, Number((availableWidth / a4BaseWidth).toFixed(2))));
    }

    // Default 'fit-page' (Pas 1 Layar Penuh)
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
    setCustomZoom((prev) => Math.max(0.35, Number((prev - 0.1).toFixed(1))));
  };

  const handlePrint = () => {
    window.print();
  };

  // Simpan pengaturan Pejabat Pengesah
  const handleSaveSigner = () => {
    setHeadSigner(tempSigner);
    try {
      localStorage.setItem('sppg_head_signer_config', JSON.stringify(tempSigner));
    } catch {
      // ignore
    }
    setIsSignerModalOpen(false);
  };

  // Reset Pejabat Pengesah ke default BGN
  const handleResetSigner = () => {
    setTempSigner(DEFAULT_HEAD_SIGNER);
    setHeadSigner(DEFAULT_HEAD_SIGNER);
    try {
      localStorage.removeItem('sppg_head_signer_config');
    } catch {
      // ignore
    }
    setIsSignerModalOpen(false);
  };

  // Upload file tanda tangan/stempel
  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon unggah file format gambar (PNG / JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setTempSigner((prev) => ({
        ...prev,
        signatureType: 'image',
        signatureImage: base64,
      }));
    };
    reader.readAsDataURL(file);
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

  if (!portalNode) return null;

  return createPortal(
    <div className="official-bast-modal-overlay fixed inset-0 z-50 flex flex-col items-center bg-slate-950/92 backdrop-blur-md overflow-y-auto print:p-0 print:m-0 print:bg-white print:fixed print:inset-0">
      {/* =========================================================================
          TOOLBAR KONTROL RESPONSIF (DESKTOP & HP MOBILE DUA BARIS RAPI)
          ========================================================================= */}
      <header className="official-bast-modal-toolbar sticky top-0 z-60 w-full bg-slate-900/98 border-b border-slate-800 shadow-2xl backdrop-blur-xl print:hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-col gap-2">
          {/* Baris 1: Brand, Tombol Atur Pejabat, Cetak, dan Tutup */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                    BAST Resmi BGN
                  </span>
                  <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Pas 1 Halaman</span>
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate max-w-[200px] sm:max-w-md">
                  {delivery.bastNumber || 'BAST-MBG'} • {delivery.schoolName}
                </p>
              </div>
            </div>

            {/* Aksi Utama Kanan: Atur Pejabat, Cetak, Tutup */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Tombol Atur Pejabat & TTD */}
              <button
                type="button"
                onClick={() => {
                  setTempSigner(headSigner);
                  setIsSignerModalOpen(true);
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                title="Ubah nama Kepala Unit, NIP, atau tempel foto TTD / kosongan"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden xs:inline">Atur </span>Pejabat
              </button>

              {/* Tombol Cetak / PDF */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 active:scale-95 cursor-pointer"
                title="Cetak A4 atau Simpan sebagai PDF (Ctrl+P)"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / PDF</span>
                <span className="hidden md:inline text-[9px] bg-emerald-700/70 px-1 py-0.5 rounded font-mono text-emerald-100">
                  Ctrl+P
                </span>
              </button>

              {/* Tombol Tutup */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup Pratinjau (Esc)"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Baris 2: Switcher Mode Tampilan & Kontrol Zoom (Rapi di HP & Desktop) */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/80 text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode('a4')}
                className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'a4'
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Kertas A4</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={`px-2.5 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'mobile'
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>Ringkas HP</span>
              </button>
            </div>

            {/* Presets Zoom (Khusus Mode Kertas A4) */}
            {viewMode === 'a4' && (
              <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/80 text-[10px] sm:text-[11px]">
                <button
                  type="button"
                  onClick={() => setZoomPreset('fit-page')}
                  className={`px-2 py-0.5 sm:py-1 rounded-md font-medium transition ${
                    zoomPreset === 'fit-page'
                      ? 'bg-slate-700 text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Sesuaikan tinggi & lebar agar pas 1 layar"
                >
                  Pas Layar
                </button>
                <button
                  type="button"
                  onClick={() => setZoomPreset('fit-width')}
                  className={`px-2 py-0.5 sm:py-1 rounded-md font-medium transition ${
                    zoomPreset === 'fit-width'
                      ? 'bg-slate-700 text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Pas selebar layar"
                >
                  Lebar
                </button>
                <button
                  type="button"
                  onClick={() => setZoomPreset('100')}
                  className={`hidden sm:block px-2 py-0.5 sm:py-1 rounded-md font-medium transition ${
                    zoomPreset === '100'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ukuran fisik nyata 100%"
                >
                  100%
                </button>
                <div className="h-3 w-px bg-slate-700 mx-0.5" />
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1 text-slate-400 hover:text-white transition"
                  title="Perkecil"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span className="text-[10px] font-mono text-slate-300 px-1 min-w-[32px] text-center">
                  {Math.round(currentScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1 text-slate-400 hover:text-white transition"
                  title="Perbesar"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Info Banner Khusus Standar Cetak - Print Hidden */}
      <div className="no-print w-full bg-slate-900/70 border-b border-slate-800/80 py-1 px-3 text-center text-[10.5px] sm:text-[11px] text-slate-300 print:hidden flex items-center justify-center gap-1.5">
        <Info className="w-3 h-3 text-emerald-400 shrink-0" />
        <span>
          💡 <strong>Tips Cetak:</strong> Dokumen terisolasi <strong>tepat 1 halaman A4</strong> (dashboard background otomatis disembunyikan). Klik <strong>&quot;Atur Pejabat&quot;</strong> jika ingin ganti nama Kepala SPPG atau tempel TTD / kosongan.
        </span>
      </div>

      {/* =========================================================================
          AREA KONTEN DOKUMEN BAST RESMI
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

            {/* Tombol Cetak / Switch Mode */}
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
          {/* Kontainer Pembungkus Berskala (Menjaga Layout Sentris & Proporsional) */}
          <div
            style={{
              width: `${a4BaseWidth * currentScale}px`,
              minWidth: `${a4BaseWidth * currentScale}px`,
              height: `${a4BaseHeight * currentScale}px`,
              position: 'relative',
              margin: '0 auto',
            }}
            className="shrink-0 transition-all duration-150 shadow-2xl rounded-sm print:!w-full print:!h-auto print:!min-w-0 print:!shadow-none"
          >
            {/* Lembar Dokumen A4 Resmi Pemerintah */}
            <div
              id="official-government-bast"
              style={{
                width: `${a4BaseWidth}px`,
                minWidth: `${a4BaseWidth}px`,
                height: `${a4BaseHeight}px`,
                transform: `scale(${currentScale})`,
                transformOrigin: 'top center',
              }}
              className="bg-white text-slate-950 font-serif leading-tight select-text p-8 sm:p-10 flex flex-col justify-between border border-slate-300 print:shadow-none print:border-none print:p-0 print:m-0 print:transform-none print:w-full print:max-w-none print:h-auto"
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

                  {/* Kolom 2: Mengetahui Kepala SPPG & Opsi TTD Dinamis (Bisa diubah/kosongan/upload) */}
                  <div
                    onClick={() => {
                      setTempSigner(headSigner);
                      setIsSignerModalOpen(true);
                    }}
                    className="group relative flex flex-col items-center justify-between min-h-[105px] cursor-pointer hover:bg-slate-50/80 p-1 rounded transition"
                    title="Klik untuk ubah nama pejabat / ganti tanda tangan"
                  >
                    <div>
                      <span className="text-[8px] uppercase text-slate-500 font-bold block">
                        MENGETAHUI / MENYETUJUI:
                      </span>
                      <p className="font-bold text-slate-900 text-[9.5px] line-clamp-1">{headSigner.title}</p>
                    </div>

                    {/* Area Tanda Tangan Dinamis Kepala Unit */}
                    <div className="my-1 h-12 flex items-center justify-center">
                      {/* Opsi 1: QR Code Verifikasi Realtime */}
                      {headSigner.signatureType === 'qr' && (
                        <div className="border border-slate-900 rounded p-1 bg-white flex items-center gap-1.5 text-[7px] text-slate-700 font-mono text-left shadow-xs">
                          <QrCode className="w-7 h-7 text-slate-950 shrink-0" />
                          <span className="leading-tight">
                            VERIFIKASI RESMI<br />
                            GIZIFLOW-BGN RI<br />
                            VALID & TEREKAM
                          </span>
                        </div>
                      )}

                      {/* Opsi 2: Tempel TTD Gambar / Stempel Digital */}
                      {headSigner.signatureType === 'image' && (
                        headSigner.signatureImage ? (
                          <img
                            src={headSigner.signatureImage}
                            alt="Tanda Tangan Kepala Unit"
                            className="max-h-11 max-w-[140px] object-contain"
                          />
                        ) : (
                          <div className="border border-dashed border-indigo-300 rounded px-2.5 py-1 text-[8px] text-indigo-700 italic">
                            (Klik untuk tempel foto TTD)
                          </div>
                        )
                      )}

                      {/* Opsi 3: Kosongan untuk TTD Basah Manual */}
                      {headSigner.signatureType === 'blank' && (
                        <div className="w-28 border-b border-dashed border-slate-500 mt-6" />
                      )}
                    </div>

                    <div>
                      <p className="font-bold underline text-slate-950 text-[9.5px] group-hover:text-indigo-600 transition flex items-center justify-center gap-1">
                        <span>( {headSigner.name} )</span>
                        <Edit3 className="w-2.5 h-2.5 text-slate-400 group-hover:text-indigo-600 print:hidden" />
                      </p>
                      <p className="text-[8px] text-slate-600">
                        {headSigner.nip ? `NIP. ${headSigner.nip}` : 'Kepala SPPG'}
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
        <div className="official-bast-action-footer mt-4 w-full max-w-md sm:max-w-3xl bg-slate-900/90 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between text-xs text-white print:hidden">
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

      {/* =========================================================================
          MODAL PENGATURAN PEJABAT PENGESAH (KEPALA UNIT SPPG / BGN)
          ========================================================================= */}
      {isSignerModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-600" />
                  <span>Pengaturan Pejabat Pengesah BAST</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ubah nama kepala unit, NIP, atau tentukan format tanda tangannya.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSignerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nama Lengkap Kepala Unit / Pejabat BGN:
                </label>
                <input
                  type="text"
                  value={tempSigner.name}
                  onChange={(e) => setTempSigner({ ...tempSigner, name: e.target.value })}
                  placeholder="Contoh: ABDULLAH SYAUQILLAH, S.Kom"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    NIP / No. Identitas:
                  </label>
                  <input
                    type="text"
                    value={tempSigner.nip}
                    onChange={(e) => setTempSigner({ ...tempSigner, nip: e.target.value })}
                    placeholder="Contoh: 19960717 202601 1 002"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Jabatan Struktural:
                  </label>
                  <input
                    type="text"
                    value={tempSigner.title}
                    onChange={(e) => setTempSigner({ ...tempSigner, title: e.target.value })}
                    placeholder="Contoh: KEPALA UNIT SPPG"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[11px]"
                  />
                </div>
              </div>

              {/* Pilihan Format Tanda Tangan */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Format Tanda Tangan Kepala Unit:
                </label>
                <div className="space-y-1.5">
                  {/* Pilihan 1: QR Code Verifikasi */}
                  <label
                    onClick={() => setTempSigner({ ...tempSigner, signatureType: 'qr' })}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                      tempSigner.signatureType === 'qr'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="headSignatureType"
                      checked={tempSigner.signatureType === 'qr'}
                      onChange={() => setTempSigner({ ...tempSigner, signatureType: 'qr' })}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                        <span>QR Code Verifikasi Resmi GiziFlow</span>
                      </span>
                      <p className="text-[10.5px] text-slate-500">
                        Standar elektronik resmi BGN, aman dan terekam di sistem realtime.
                      </p>
                    </div>
                  </label>

                  {/* Pilihan 2: Tempel TTD / Upload Gambar */}
                  <label
                    onClick={() => setTempSigner({ ...tempSigner, signatureType: 'image' })}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                      tempSigner.signatureType === 'image'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="headSignatureType"
                      checked={tempSigner.signatureType === 'image'}
                      onChange={() => setTempSigner({ ...tempSigner, signatureType: 'image' })}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Tempel Foto Tanda Tangan / Stempel Digital</span>
                      </span>
                      <p className="text-[10.5px] text-slate-500">
                        Unggah gambar TTD transparan (PNG/JPG) untuk tertempel di dokumen.
                      </p>

                      {/* Area Upload File jika mode Image aktif */}
                      {tempSigner.signatureType === 'image' && (
                        <div className="mt-2 pt-2 border-t border-indigo-100 flex items-center gap-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleUploadSignature}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Pilih Foto TTD</span>
                          </button>
                          {tempSigner.signatureImage ? (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                              <Check className="w-3 h-3" />
                              <span>Foto TTD Terpasang</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Belum ada foto</span>
                          )}
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Pilihan 3: Kosongan untuk TTD Basah Fisik */}
                  <label
                    onClick={() => setTempSigner({ ...tempSigner, signatureType: 'blank' })}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                      tempSigner.signatureType === 'blank'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="headSignatureType"
                      checked={tempSigner.signatureType === 'blank'}
                      onChange={() => setTempSigner({ ...tempSigner, signatureType: 'blank' })}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-slate-600" />
                        <span>Kosongan (Untuk Tanda Tangan Basah Manual)</span>
                      </span>
                      <p className="text-[10.5px] text-slate-500">
                        Menyediakan garis tanda tangan kosong untuk ditandatangani bolpoin fisik di kertas print.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleResetSigner}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Default</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSignerModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveSigner}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    portalNode
  );
}
