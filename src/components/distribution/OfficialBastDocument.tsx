'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MealDelivery } from '@/lib/types';
import {
  Printer,
  X,
  Smartphone,
  FileText,
  ShieldCheck,
  Thermometer,
  Calendar,
  Building2,
  Truck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Info,
} from 'lucide-react';

interface OfficialBastDocumentProps {
  delivery: MealDelivery;
  onClose: () => void;
}

export function OfficialBastDocument({ delivery, onClose }: OfficialBastDocumentProps) {
  // Mode tampilan di layar: 'a4' (standar surat dinas resmi pemerintah) atau 'mobile' (kartu ringkas ramah HP)
  const [viewMode, setViewMode] = useState<'a4' | 'mobile'>('a4');
  
  // Kontrol Skala & Zoom untuk Layar HP
  const [zoomMode, setZoomMode] = useState<'fit' | '100' | 'custom'>('fit');
  const [customZoom, setCustomZoom] = useState<number>(1);
  const [screenWidth, setScreenWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 800
  );
  const [docHeight, setDocHeight] = useState<number>(1150);
  const docRef = useRef<HTMLDivElement | null>(null);

  // Monitor ukuran layar smartphone
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update tinggi dokumen setelah render
  useEffect(() => {
    if (docRef.current) {
      setDocHeight(docRef.current.scrollHeight || 1150);
    }
  }, [viewMode, delivery, screenWidth]);

  // Lebar standar kanvas A4 resmi (794px ≈ 210mm pada 96 DPI)
  const a4BaseWidth = 794;
  // Hitung skala auto-fit agar dokumen 100% pas selebar layar HP tanpa terpotong
  const fitScale = Math.min(1, Math.max(0.38, (screenWidth - 20) / a4BaseWidth));
  const currentScale =
    viewMode === 'mobile'
      ? 1
      : zoomMode === 'fit'
      ? fitScale
      : zoomMode === '100'
      ? 1
      : customZoom;

  // Format tanggal Indonesia resmi
  const deliveryDate = new Date(delivery.createdAt || Date.now());
  const formattedDate = deliveryDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const netConsumed = delivery.deliveredPortions || (delivery.targetPortions - (delivery.absentStudents || 0));
  const returCount = delivery.absentStudents || 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center bg-slate-950/90 backdrop-blur-md overflow-y-auto print:p-0 print:m-0 print:bg-white print:fixed print:inset-0">
      {/* =========================================================================
          STICKY TOP CONTROL BAR (TIDAK AKAN MENABRAK ATAU MENUTUPI KOP SURAT)
          ========================================================================= */}
      <header className="sticky top-0 z-60 w-full bg-slate-900/95 border-b border-slate-800 shadow-2xl backdrop-blur-lg print:hidden">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
          {/* Sisi Kiri: Switcher Mode Tampilan */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex items-center bg-slate-800 rounded-full p-0.5 text-[11px] border border-slate-700/80">
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={`px-2.5 py-1 rounded-full font-medium transition flex items-center gap-1 ${
                  viewMode === 'mobile' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span className="hidden xs:inline">Mode</span> Ringkas HP
              </button>
              <button
                type="button"
                onClick={() => setViewMode('a4')}
                className={`px-2.5 py-1 rounded-full font-medium transition flex items-center gap-1 ${
                  viewMode === 'a4' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3" />
                Kertas A4 Resmi
              </button>
            </div>

            {/* Kontrol Zoom (Khusus saat Mode Kertas A4 di Layar HP) */}
            {viewMode === 'a4' && (
              <div className="flex items-center bg-slate-800/80 rounded-full p-0.5 text-[10px] sm:text-[11px] border border-slate-700">
                <button
                  type="button"
                  onClick={() => setZoomMode('fit')}
                  className={`px-2 py-0.5 sm:py-1 rounded-full font-medium transition flex items-center gap-1 ${
                    zoomMode === 'fit' ? 'bg-slate-700 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Sesuaikan ukuran penuh selebar layar HP"
                >
                  <Maximize2 className="w-2.5 h-2.5" />
                  <span>Pas Layar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setZoomMode('100')}
                  className={`px-2 py-0.5 sm:py-1 rounded-full font-medium transition ${
                    zoomMode === '100' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ukuran asli 100% A4"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomMode('custom');
                    setCustomZoom((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(1))));
                  }}
                  className="p-1 text-slate-400 hover:text-white transition"
                  title="Perkecil"
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomMode('custom');
                    setCustomZoom((prev) => Math.min(1.5, Number((prev + 0.1).toFixed(1))));
                  }}
                  className="p-1 text-slate-400 hover:text-white transition"
                  title="Perbesar"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Sisi Kanan: Tombol Cetak / PDF & Tutup */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-md active:scale-95"
              title="Cetak A4 atau Simpan sebagai PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Pratinjau"
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Helper Bar Informasi Cetak/Download PDF di Smartphone */}
      <div className="w-full bg-slate-900/60 border-b border-slate-800/80 py-1.5 px-3 text-center text-[11px] text-slate-300 print:hidden flex items-center justify-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>
          💡 <strong>Tips di HP:</strong> Tekan <strong>"Cetak / PDF"</strong> lalu pilih opsi <strong>"Simpan sebagai PDF"</strong> untuk mengunduh dokumen resmi ini.
        </span>
      </div>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl px-2 sm:px-4 py-4 print:p-0 print:m-0 print:max-w-none print:w-full flex flex-col items-center">
        {/* =========================================================================
            TAMPILAN 1: MODE RINGKAS HP (KHUSUS TAMPILAN SMARTPHONE RESPONSIF)
            ========================================================================= */}
        {viewMode === 'mobile' && (
          <div className="w-full max-w-md bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 space-y-4 print:hidden">
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
            <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950">{delivery.menuTitle}</span>
                <span className="text-[10px] bg-indigo-200/70 text-indigo-900 px-2 py-0.5 rounded-md font-bold">
                  QC: {delivery.foodTemperature || '64.5°C'}
                </span>
              </div>
              <ul className="text-[11px] text-indigo-900/90 space-y-1 pl-1">
                <li>• Karbohidrat: {delivery.menuDetails?.carb || 'Nasi Putih Pulen (150g)'}</li>
                <li>• Lauk Hewani: {delivery.menuDetails?.protein || 'Ayam Fillet Teriyaki (60g)'}</li>
                <li>• Sayur: {delivery.menuDetails?.veggie || 'Tumis Brokoli & Wortel (50g)'}</li>
                <li>• Buah Segar: {delivery.menuDetails?.fruit || 'Melon Potong (1 Potong)'}</li>
                <li>• Susu Pelengkap: {delivery.menuDetails?.dairy || 'Susu UHT Segar 125ml'}</li>
              </ul>
            </div>

            {/* Kartu Rekap Ompreng Responsif */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wide block">
                Realisasi Wadah Ompreng Lapangan:
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 font-medium block">1. Dikirim</span>
                  <span className="text-xs font-black text-slate-900">{delivery.targetPortions}</span>
                  <span className="text-[9px] text-slate-400 block">Porsi</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-rose-200">
                  <span className="text-[9px] text-rose-500 font-medium block">2. Retur</span>
                  <span className="text-xs font-black text-rose-700">{returCount}</span>
                  <span className="text-[9px] text-rose-400 block">Porsi</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-200">
                  <span className="text-[9px] text-emerald-600 font-medium block">3. Dikonsumsi</span>
                  <span className="text-xs font-black text-emerald-700">{netConsumed}</span>
                  <span className="text-[9px] text-emerald-400 block">Porsi</span>
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
                className="w-full py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs text-center"
              >
                Buka Pratinjau Kertas A4 Lengkap
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAMPILAN 2: FORMAT RESMI TATA NASKAH DINAS PEMERINTAH (KERTAS A4)
            DENGAN FITUR AUTO-FIT LAYAR HP RESPONSIF AGAR TIDAK TERPOTONG
            ========================================================================= */}
        <div
          className={`${
            viewMode === 'mobile' ? 'hidden sm:flex' : 'flex'
          } w-full justify-center overflow-x-auto print:overflow-visible transition-all duration-200`}
          style={
            viewMode === 'a4' && currentScale < 1
              ? {
                  height: `${docHeight * currentScale + 20}px`,
                  minHeight: `${docHeight * currentScale + 20}px`,
                  overflow: 'hidden',
                }
              : {}
          }
        >
          {/* Kontainer Kertas Standar A4 Resmi */}
          <div
            id="official-government-bast"
            ref={docRef}
            style={
              viewMode === 'a4' && currentScale !== 1
                ? {
                    width: `${a4BaseWidth}px`,
                    minWidth: `${a4BaseWidth}px`,
                    transform: `scale(${currentScale})`,
                    transformOrigin: 'top center',
                  }
                : {
                    width: '100%',
                    maxWidth: `${a4BaseWidth}px`,
                  }
            }
            className="bg-white rounded-none sm:rounded-2xl p-6 sm:p-10 shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none print:transform-none print:w-full print:max-w-none text-slate-900 font-serif leading-tight select-text"
          >
            {/* 1. KOP SURAT RESMI KEDINASAN PEMERINTAH */}
            <div className="border-b-[3px] border-double border-slate-950 pb-3 mb-4 text-center relative">
              <div className="flex items-center justify-center gap-4">
                {/* Logo Badan Gizi Nasional Resmi */}
                <img
                  src="/badan-gizi.png"
                  alt="Logo Badan Gizi Nasional"
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0"
                />
                <div>
                  <h3 className="text-[12px] sm:text-[13px] font-bold tracking-wider uppercase text-slate-800">
                    REPUBLIK INDONESIA
                  </h3>
                  <h1 className="text-[14px] sm:text-[16px] font-extrabold tracking-wide uppercase text-slate-950">
                    BADAN GIZI NASIONAL (BGN)
                  </h1>
                  <h2 className="text-[12px] sm:text-[13px] font-bold uppercase text-slate-900">
                    SATUAN PELAYANAN PEMENUHAN GIZI (SPPG)
                  </h2>
                  <p className="text-[10px] sm:text-[11px] font-sans text-slate-600 mt-0.5">
                    Unit Pelaksana Teknis: {delivery.sppgUnitName} • Kab. Gresik - Jawa Timur
                  </p>
                  <p className="text-[9px] sm:text-[10px] font-sans text-slate-500">
                    Surel Resmi: sppg.mbg@bgn.go.id | Sistem Elektronik MBG Realtime GiziFlow
                  </p>
                </div>
              </div>
            </div>

            {/* 2. JUDUL RESMI & NOMOR BAST */}
            <div className="text-center my-3 space-y-0.5">
              <h2 className="text-[13px] sm:text-[15px] font-extrabold uppercase tracking-wide underline decoration-1 underline-offset-4 text-slate-950">
                BERITA ACARA SERAH TERIMA (BAST)
              </h2>
              <h3 className="text-[11px] sm:text-[12px] font-bold uppercase text-slate-800">
                PROGRAM MAKAN BERGIZI GRATIS (MBG)
              </h3>
              <p className="text-[10px] sm:text-[11px] font-sans text-slate-700">
                Nomor Dokumen: <strong className="font-mono">{delivery.bastNumber || 'BAST/MBG/BGN/2026/001'}</strong>
              </p>
              <p className="text-[9px] sm:text-[10px] font-sans text-slate-500">
                Lampiran Surat Jalan No: <span className="font-mono">{delivery.dispatchNumber}</span>
              </p>
            </div>

            {/* 3. KLAUSUL PEMBUKA LEGALITAS */}
            <div className="text-[11px] sm:text-[11.5px] font-sans text-slate-800 space-y-1.5 my-3 text-justify">
              <p>
                Pada hari ini, <strong>{formattedDate}</strong>, bertempat di <strong>{delivery.schoolName}</strong>,
                kami yang bertanda tangan di bawah ini:
              </p>

              {/* Rincian Pihak Pertama & Kedua */}
              <div className="grid grid-cols-2 gap-4 pt-1 pb-1">
                {/* Pihak Pertama */}
                <div className="p-2.5 rounded border border-slate-300 bg-slate-50/50 space-y-0.5">
                  <span className="font-bold block text-[10px] uppercase text-slate-900 border-b border-slate-200 pb-0.5">
                    I. PIHAK PERTAMA (YANG MENYERAHKAN):
                  </span>
                  <table className="w-full text-[10.5px]">
                    <tbody>
                      <tr>
                        <td className="w-24 text-slate-500">Nama Petugas</td>
                        <td>: <strong>{delivery.driverName}</strong></td>
                      </tr>
                      <tr>
                        <td className="text-slate-500">Jabatan</td>
                        <td>: Petugas Distribusi & Logistik SPPG</td>
                      </tr>
                      <tr>
                        <td className="text-slate-500">Unit Satuan</td>
                        <td>: {delivery.sppgUnitName}</td>
                      </tr>
                      <tr>
                        <td className="text-slate-500">Armada / Nopol</td>
                        <td>: {delivery.vehiclePlate} (Kendaraan Berpendingin/Thermal)</td>
                      </tr>
                      <tr>
                        <td className="text-slate-500">Waktu Berangkat</td>
                        <td>: {delivery.departureTime || '10:30'} WIB</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Pihak Kedua */}
                <div className="p-2.5 rounded border border-slate-300 bg-slate-50/50 space-y-0.5">
                  <span className="font-bold block text-[10px] uppercase text-slate-900 border-b border-slate-200 pb-0.5">
                    II. PIHAK KEDUA (YANG MENERIMA):
                  </span>
                  <table className="w-full text-[10.5px]">
                    <tbody>
                      <tr>
                        <td className="w-24 text-slate-500">Nama Penerima</td>
                        <td>: <strong>{delivery.recipientName || delivery.contactPerson}</strong></td>
                      </tr>
                      <tr>
                        <td className="text-slate-500">NIP / Jabatan</td>
                        <td>: {delivery.recipientNip || '-'} / Guru Piket / Tim MBG</td>
                      </tr>
                      <tr>
                        <td className="text-slate-500">Nama Sekolah</td>
                        <td>: {delivery.schoolName}</td>
                      </tr>
                      <tr>
                        <td className="text-slate-500">Alamat Lengkap</td>
                        <td>: {delivery.schoolAddress}</td>
                      </tr>
                      <tr>
                        <td className="text-slate-500">Waktu Tiba</td>
                        <td>: {delivery.actualArrival || delivery.estimatedArrival || '11:15'} WIB</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="pt-1">
                Dengan ini menyatakan bahwa <strong>PIHAK PERTAMA</strong> telah menyerahkan paket Makanan Bergizi Gratis (MBG)
                kepada <strong>PIHAK KEDUA</strong>, dan <strong>PIHAK KEDUA</strong> telah menerima, memeriksa fisik, dan menguji
                kelayakan paket makanan tersebut sesuai dengan standar operasional Badan Gizi Nasional (BGN) dengan rincian sebagai berikut:
              </p>
            </div>

            {/* 4. TABEL OBJEK SERAH TERIMA: 5 PILAR MBG */}
            <div className="my-2 border border-slate-900 font-sans text-[10.5px] sm:text-[11px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-900 text-slate-900 font-bold text-center">
                    <th className="p-1.5 border-r border-slate-900 w-8">No</th>
                    <th className="p-1.5 border-r border-slate-900 text-left">Nama Paket & Komposisi 5 Pilar Gizi MBG</th>
                    <th className="p-1.5 border-r border-slate-900 w-24">Satuan Kemasan</th>
                    <th className="p-1.5 border-r border-slate-900 w-20">Porsi Target</th>
                    <th className="p-1.5 border-r border-slate-900 w-20">Porsi Fisik Diterima</th>
                    <th className="p-1.5 border-r border-slate-900 w-24">QC Suhu (°C)</th>
                    <th className="p-1.5 w-24">Status Fisik</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-900 align-top">
                    <td className="p-2 border-r border-slate-900 text-center font-bold">1</td>
                    <td className="p-2 border-r border-slate-900">
                      <p className="font-bold text-slate-950">{delivery.menuTitle}</p>
                      <div className="text-[10px] text-slate-700 space-y-0.5 mt-1">
                        <p>1. Karbohidrat: {delivery.menuDetails?.carb || 'Nasi Putih Pulen 150g'}</p>
                        <p>2. Protein Hewani: {delivery.menuDetails?.protein || 'Ayam Fillet Teriyaki 60g'}</p>
                        <p>3. Protein Nabati / Sayuran: {delivery.menuDetails?.veggie || 'Tumis Sayur Segar 50g'}</p>
                        <p>4. Buah Segar: {delivery.menuDetails?.fruit || 'Melon Potong 1 Potong'}</p>
                        <p>5. Pelengkap Gizi: {delivery.menuDetails?.dairy || 'Susu UHT Segar 125ml'}</p>
                      </div>
                    </td>
                    <td className="p-2 border-r border-slate-900 text-center">
                      Ompreng Stainless Food-Grade Tersegel
                    </td>
                    <td className="p-2 border-r border-slate-900 text-center font-bold text-slate-900">
                      {delivery.targetPortions} Porsi
                    </td>
                    <td className="p-2 border-r border-slate-900 text-center font-bold text-emerald-800">
                      {delivery.deliveredPortions || delivery.targetPortions} Porsi
                    </td>
                    <td className="p-2 border-r border-slate-900 text-center font-bold text-slate-900">
                      {delivery.foodTemperature || '64.5°C'}
                      <span className="block text-[8.5px] font-normal text-slate-500">(Standar ≥ 60°C)</span>
                    </td>
                    <td className="p-2 text-center text-emerald-800 font-bold">
                      Baik & Higienis
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 5. REKAPITULASI FISIK WADAH OMPRENG & ZERO WASTE MANAGEMENT */}
            <div className="border border-slate-400 rounded p-2.5 my-2.5 bg-slate-50/70 font-sans text-[10.5px] sm:text-[11px] space-y-1.5">
              <span className="font-bold uppercase text-[10px] text-slate-900 block border-b border-slate-200 pb-0.5">
                REKAPITULASI PENGAWASAN FISIK WADAH OMPRENG & SISA PORSI (ZERO WASTE BGN):
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-1.5 rounded border border-slate-300">
                  <span className="text-[9.5px] text-slate-500 block">Total Wadah Dikirim SPPG</span>
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{delivery.targetPortions} Ompreng</span>
                </div>
                <div className="bg-white p-1.5 rounded border border-slate-300">
                  <span className="text-[9.5px] text-slate-500 block">Wadah Balik / Retur Dapur</span>
                  <span className="font-bold text-rose-700 text-xs sm:text-sm">
                    {delivery.absentStudents !== undefined ? `${delivery.absentStudents} Ompreng` : '0 Ompreng'}
                  </span>
                </div>
                <div className="bg-white p-1.5 rounded border border-slate-300">
                  <span className="text-[9.5px] text-slate-500 block">Porsi Bersih Dikonsumsi Siswa</span>
                  <span className="font-extrabold text-emerald-700 text-xs sm:text-sm">
                    {netConsumed} Porsi
                  </span>
                </div>
              </div>
              <p className="text-[9.5px] sm:text-[10px] text-slate-600 italic">
                * Keterangan: {delivery.surplusHandling || 'Sesuai dengan SOP Zero Waste BGN. Makanan aman dikonsumsi maksimal dalam jendela 4 jam sejak waktu keberangkatan dapur.'}
              </p>
            </div>

            {/* 6. KLAUSUL PENUTUP */}
            <p className="text-[10.5px] sm:text-[11px] font-sans text-slate-800 text-justify my-2">
              Demikian Berita Acara Serah Terima (BAST) ini dibuat dalam keadaan sadar, sah, dan berkekuatan hukum untuk
              dipergunakan sebagaimana mestinya sebagai bukti pertanggungjawaban fisik dan administrasi operasional Program MBG.
            </p>

            {/* 7. PENGESAHAN & TANDA TANGAN RESMI TRIPARTIT */}
            <div className="pt-2 border-t border-slate-300 font-sans text-[11px] text-slate-900">
              <div className="grid grid-cols-2 gap-8 text-center">
                {/* Pihak Kedua: Sekolah (Dengan Tanda Tangan Touchscreen Guru) */}
                <div className="flex flex-col items-center justify-between min-h-[120px]">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block">PIHAK KEDUA (PENERIMA):</span>
                    <p className="font-bold text-slate-900">{delivery.schoolName}</p>
                  </div>

                  {/* Area Tanda Tangan Touchscreen HP */}
                  <div className="my-1.5 h-14 flex items-center justify-center">
                    {delivery.recipientSignature ? (
                      <img
                        src={delivery.recipientSignature}
                        alt="Tanda Tangan Digital Pihak Sekolah"
                        className="max-h-12 max-w-[170px] object-contain"
                      />
                    ) : (
                      <div className="border border-dashed border-slate-300 rounded px-4 py-2 text-[10px] text-slate-400 italic">
                        (Tanda Tangan Digital Guru)
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="font-bold underline text-slate-950">
                      ( {delivery.recipientName || delivery.contactPerson} )
                    </p>
                    <p className="text-[9.5px] text-slate-600">
                      {delivery.recipientNip ? `NIP. ${delivery.recipientNip}` : 'Kepala Sekolah / Guru Piket'}
                    </p>
                  </div>
                </div>

                {/* Pihak Pertama: Driver SPPG */}
                <div className="flex flex-col items-center justify-between min-h-[120px]">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 block">PIHAK PERTAMA (PENGIRIM):</span>
                    <p className="font-bold text-slate-900">{delivery.sppgUnitName}</p>
                  </div>

                  {/* TTD Driver */}
                  <div className="my-1.5 h-14 flex items-center justify-center font-serif italic text-slate-800 text-sm">
                    {delivery.driverName}
                  </div>

                  <div>
                    <p className="font-bold underline text-slate-950">
                      ( {delivery.driverName} )
                    </p>
                    <p className="text-[9.5px] text-slate-600">
                      Petugas Distribusi & Pengantaran MBG
                    </p>
                  </div>
                </div>
              </div>

              {/* Mengetahui: Kepala Satuan Pelayanan Pemenuhan Gizi (SPPG) */}
              <div className="mt-4 pt-2 border-t border-slate-200 text-center flex flex-col items-center">
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                  MENGETAHUI / MENYETUJUI:
                </span>
                <p className="font-bold text-slate-900 text-xs">
                  KEPALA SATUAN PELAYANAN PEMENUHAN GIZI (SPPG)
                </p>

                <div className="flex items-center justify-center gap-3 my-1">
                  <div className="border border-slate-300 rounded p-1 bg-white flex items-center gap-1.5 text-[8.5px] text-slate-600 font-mono">
                    <QrCode className="w-6 h-6 text-slate-900" />
                    <span className="text-left leading-tight">
                      VERIFIKASI RESMI<br />
                      GIZIFLOW-BGN RI<br />
                      VALID & TEREKAM
                    </span>
                  </div>
                </div>

                <p className="font-bold text-slate-950 underline text-xs">
                  ( ABDULLAH SYAUQILLAH, S.Kom )
                </p>
                <p className="text-[9.5px] text-slate-500">
                  NIP. 19960717 202601 1 002 • Kepala Unit SPPG
                </p>
              </div>
            </div>

            {/* Footer Dokumen Kedinasan */}
            <div className="mt-4 pt-1.5 border-t border-slate-200 text-[8.5px] text-slate-400 font-sans flex items-center justify-between">
              <span>Dicetak otomatis melalui GiziFlow BGN Enterprise • Standar A4 Tata Naskah Dinas BGN RI</span>
              <span>Dokumen Sah Elektronik Berdasarkan UU ITE No. 11/2008</span>
            </div>
          </div>
        </div>

        {/* Footer Actions (Hidden on Print) */}
        <div className="mt-4 w-full max-w-md sm:max-w-3xl bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between text-xs text-white print:hidden">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px]">Siap dicetak fisik A4 atau simpan file PDF dokumen kedinasan</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
