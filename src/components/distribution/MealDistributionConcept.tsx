'use client';

import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Truck,
  School,
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Sparkles,
  Layers,
  ShieldCheck,
  ChevronRight,
  Users,
  Camera,
  Calendar,
  ThermometerSun,
  Flame,
  ArrowRight,
  ClipboardList,
  FileText,
  Printer,
  Info,
  X,
  BadgeAlert,
} from 'lucide-react';
import { useStore } from '@/lib/store';

export function MealDistributionConcept() {
  const { userRole, selectedSppgUnit, sppgUnits } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'monitoring' | 'bast_preview' | 'sop'>('pipeline');
  const [selectedSchoolModal, setSelectedSchoolModal] = useState<any | null>(null);

  // Verifikasi proteksi role (hanya Superadmin yang bisa mengakses)
  if (userRole === 'EXECUTIVE_AUDITOR') {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center max-w-lg mx-auto shadow-sm my-12">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <BadgeAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Akses Dibatasi (Mode Pemantau / Auditor)</h3>
        <p className="text-xs text-slate-500 mt-2">
          Menu Konsep Distribusi Porsi Makanan hanya dapat diakses oleh Superadmin. Tampilan Auditor difokuskan khusus pada pengawasan anggaran dan belanja.
        </p>
      </div>
    );
  }

  const activeUnitName =
    selectedSppgUnit === 'ALL'
      ? 'Semua Unit Dapur SPPG'
      : sppgUnits.find((u) => u.id === selectedSppgUnit)?.name || 'Dapur SPPG';

  // Data Simulasi Distribusi Berdasarkan Menu Makan Siang
  const simulatedSchools = [
    {
      id: 'sch-1',
      name: 'SDN 1 Abar-Abir',
      address: 'Jl. Raya Pendidikan No. 12, Kec. Bungah',
      targetPortions: 450,
      deliveredPortions: 450,
      deliveryTime: '11:15 WIB',
      driver: 'Pak Joko (Armada Pickup 01)',
      recipient: 'Ibu Ratna, S.Pd (Guru Piket)',
      recipientPhone: '0813-8890-1234',
      status: 'DELIVERED',
      bastNumber: 'BAST-20261018-01',
      temperature: '62°C (Hangat)',
      menuNote: 'Nasi Pulen, Ayam Fillet Teriyaki, Tumis Brokoli Wortel, Melon Segar, Susu UHT',
      photoNote: 'Foto BAST dan foto 450 siswa menikmati makan siang telah terarsip',
    },
    {
      id: 'sch-2',
      name: 'SMPN 2 Karang Anyar',
      address: 'Jl. Pemuda Harapan No. 05, Bungah',
      targetPortions: 500,
      deliveredPortions: 500,
      deliveryTime: '11:30 WIB',
      driver: 'Pak Budi (Armada Box 02)',
      recipient: 'Bpk. Hendra Kusuma (Waka Kesiswaan)',
      recipientPhone: '0812-4456-7890',
      status: 'DELIVERED',
      bastNumber: 'BAST-20261018-02',
      temperature: '60°C (Hangat)',
      menuNote: 'Nasi Pulen, Ayam Fillet Teriyaki, Tumis Brokoli Wortel, Melon Segar, Susu UHT',
      photoNote: 'Diterima serentak di 14 ruang kelas, kondisi higienis 100%',
    },
    {
      id: 'sch-3',
      name: 'MI Miftahul Huda',
      address: 'Desa Abar-Abir RT 03/RW 01',
      targetPortions: 250,
      deliveredPortions: 0,
      deliveryTime: 'Estimasi 11:45 WIB',
      driver: 'Pak Joko (Rute Ke-2)',
      recipient: 'Ustadz Ahmad Fauzi',
      recipientPhone: '0857-9912-3456',
      status: 'IN_TRANSIT',
      bastNumber: 'BAST-20261018-03 (Draft)',
      temperature: 'Siap Saji dalam Thermal Box',
      menuNote: 'Nasi Pulen, Ayam Fillet Teriyaki, Tumis Brokoli Wortel, Melon Segar, Susu UHT',
      photoNote: 'Driver sedang dalam perjalanan (1,2 km dari lokasi sekolah)',
    },
  ];

  const totalTarget = simulatedSchools.reduce((acc, s) => acc + s.targetPortions, 0);
  const totalDelivered = simulatedSchools.reduce((acc, s) => acc + s.deliveredPortions, 0);

  const handlePrintConcept = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner Superadmin Exclusive */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-md border border-indigo-900/50">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-6 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Khusus Superadmin
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Cetak Biru (Draft Rencana Masa Depan)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                🔒 Tersembunyi dari Auditor
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <UtensilsCrossed className="w-6 h-6 text-indigo-400" />
              Konsep Distribusi Makanan Siap Santap ke Siswa
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Arsitektur alur hilir Program Makan Bergizi Gratis (MBG): Menghubungkan bahan baku yang dimasak di dapur SPPG
              hingga menjadi porsi makanan siap santap yang dibagikan dan diverifikasi di sekolah-sekolah sasaran.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <button
              onClick={handlePrintConcept}
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-300" />
              Cetak / Simpan Konsep
            </button>
          </div>
        </div>

        {/* Highlight Note */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-start gap-3 text-xs text-indigo-200/90 bg-indigo-950/40 p-3 rounded-xl border border-indigo-800/40">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Status Operasional Anda:</strong> Tugas utama Anda saat ini tetap fokus 100% pada{' '}
            <span className="text-emerald-300 font-semibold underline decoration-emerald-400">
              Pencatatan Keuangan (Kas Masuk/Keluar), Pembelanjaan Bahan, dan Audit Nota Belanja
            </span>
            . Menu konsep ini dirancang sebagai kesiapan sistem agar sewaktu-waktu jika pimpinan menginstruksikan pelacakan
            porsi siswa secara digital, SPPG Dapur telah memiliki skema matang yang tinggal diaktifkan.
          </p>
        </div>
      </div>

      {/* 2. Sub Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-xs overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab('pipeline')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeSubTab === 'pipeline'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          Peta Alur Rantai Pasok (Hulu ke Hilir)
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('monitoring')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeSubTab === 'monitoring'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          Simulasi Monitoring Distribusi Sekolah
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-bold">
            Simulasi
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('bast_preview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeSubTab === 'bast_preview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Draft BAST Digital & Tanda Tangan
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('sop')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeSubTab === 'sop'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Standar Operasional (SOP Food Safety)
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: PETA ALUR RANTAI PASOK */}
      {activeSubTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Rantai Pasok Terintegrasi: Dari Uang Anggaran Hingga Piring Siswa
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menghubungkan pencatatan keuangan yang Anda kelola saat ini dengan fase hilir konsumsi siswa
                </p>
              </div>
              <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                Unit: <strong className="text-slate-700">{activeUnitName}</strong>
              </span>
            </div>

            {/* Stepper Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Step 1 */}
              <div className="relative p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-600 text-white">
                      FASE 1
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      AKTIF (Tugas Anda)
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">1. Alokasi Anggaran & Kasbon</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                    Penerimaan dana kasbon dari bendahara pusat per periode untuk unit SPPG.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-800 font-medium">
                  ✓ Menu Anggaran & Kas
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-600 text-white">
                      FASE 2
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      AKTIF (Tugas Anda)
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">2. Belanja Bahan & Audit Nota</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                    Belanja ke CV/Supplier, upload nota foto, validasi OCR AI, dan pengembalian sisa kas.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-800 font-medium">
                  ✓ Menu Belanja & Audit
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-600 text-white">
                      FASE 3
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      AKTIF (Tugas Anda)
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">3. Stok Masuk & Ekstraksi Masak</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                    Bahan mentah masuk gudang dapur, dikeluarkan saat juru masak mulai mengolah menu porsi.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-800 font-medium">
                  ✓ Menu Stok Bahan Dapur
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative p-4 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-600 text-white">
                      FASE 4
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                      DRAFT KONSEP
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-indigo-950">4. Batching Porsi & Quality Control</h4>
                  <p className="text-[11px] text-indigo-900/80 mt-1 leading-snug">
                    Makanan matang diuji rasa, dicek suhu (&gt;60°C), lalu di-packing ke box/ompreng bersekat.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-indigo-200/60 text-[10px] text-indigo-700 font-medium">
                  ⏳ Rencana Menu Dapur
                </div>
              </div>

              {/* Step 5 */}
              <div className="relative p-4 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-600 text-white">
                      FASE 5
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                      DRAFT KONSEP
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-indigo-950">5. Distribusi Sekolah & BAST</h4>
                  <p className="text-[11px] text-indigo-900/80 mt-1 leading-snug">
                    Armada kurir mengantar ke sekolah, diterima guru piket, tanda tangan BAST & foto santap siswa.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-indigo-200/60 text-[10px] text-indigo-700 font-medium">
                  ⏳ Rencana BAST Sekolah
                </div>
              </div>
            </div>

            {/* Hubungan Mutasi Bahan dengan Porsi Makanan */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UtensilsCrossed className="w-4 h-4 text-slate-600" />
                Mengapa Catatan Mutasi Dapur di Modal Sebelumnya Berhubungan?
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Di modal yang Anda tanyakan tadi: saat juru masak mengeluarkan{' '}
                <strong className="text-slate-800">Melon 10 Kg</strong> dengan catatan{' '}
                <em className="text-slate-700">&quot;MENU-20261016-SIANG: Porsi Makan Siang Siswa (1.200 Porsi)&quot;</em>,
                itu adalah <strong>hulu dari masakan</strong>. Dari 10 Kg melon tersebut, diiris menjadi 1.200 potong buah
                pencuci mulut yang dimasukkan ke dalam 1.200 ompreng makan siang. Jika modul distribusi ini diaktifkan,
                sistem dapat otomatis menghitung rasio: <em>10 Kg Melon / 1.200 siswa = ~8.3 gram melon per siswa</em> (Audit
                Kecukupan Gizi).
              </p>
            </div>
          </div>

          {/* Blueprint Fitur Masa Depan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <School className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800">1. Master Data Sekolah Sasaran</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Menyimpan data daftar sekolah (SD/MI/SMP/SMA), jumlah siswa aktif per kelas, nomor kontak Kepala Sekolah & Guru
                Piket, serta titik koordinat GPS lokasi pengantaran.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <Truck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800">2. Manajemen Rute & Armada</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Pengelompokan rute pengantaran porsi makanan berdasarkan radius dapur SPPG. Memastikan makanan terkirim dalam
                jendela waktu emas (&lt; 2 jam dari wajan ke meja sekolah).
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800">3. BAST Digital & Tanda Tangan</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Sekolah langsung menandatangani penerimaan di HP kurir/driver tanpa ribet kertas. Dilengkapi foto serah terima
                dan verifikasi apakah ada siswa yang absen / porsi berlebih.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SIMULASI MONITORING DISTRIBUSI SEKOLAH */}
      {activeSubTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Target Porsi Hari Ini</span>
                <UtensilsCrossed className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {totalTarget.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">Porsi</span>
              </p>
              <div className="text-[11px] text-slate-500 mt-1">Sesuai porsi masak 1.200 siswa</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Porsi Telah Diterima</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {totalDelivered.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">Porsi</span>
              </p>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">2 dari 3 Sekolah Selesai</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Dalam Pengantaran</span>
                <Truck className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {(totalTarget - totalDelivered).toLocaleString('id-ID')}{' '}
                <span className="text-xs font-normal text-slate-500">Porsi</span>
              </p>
              <div className="text-[11px] text-amber-700 font-medium mt-1">1 Sekolah Menunggu Driver</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Food Safety (Suhu)</span>
                <ThermometerSun className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                61.2°C <span className="text-xs font-normal text-emerald-600 font-medium">Optimal</span>
              </p>
              <div className="text-[11px] text-slate-500 mt-1">Batas aman konsumsi &gt; 60°C</div>
            </div>
          </div>

          {/* Daftar Sekolah Penerima (Simulasi Interaktif) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Daftar Pengiriman Porsi ke Sekolah Sasaran (Simulasi Hari Ini)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menu: <strong>Nasi Pulen + Ayam Fillet Teriyaki + Tumis Brokoli + Melon Segar + Susu</strong>
                </p>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">
                Klik kartu untuk lihat BAST & Detail
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {simulatedSchools.map((school) => {
                const isDelivered = school.status === 'DELIVERED';
                return (
                  <div
                    key={school.id}
                    onClick={() => setSelectedSchoolModal(school)}
                    className="p-4 sm:p-5 hover:bg-slate-50/80 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isDelivered ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700 animate-pulse'
                        }`}
                      >
                        {isDelivered ? <CheckCircle2 className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{school.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isDelivered
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isDelivered ? '✓ DITERIMA LENGKAP' : '🚚 DALAM PERJALANAN'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-0.5">{school.address}</p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-600">
                          <span>
                            Target: <strong className="text-slate-800">{school.targetPortions} Porsi</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Jam: <strong className="text-slate-800">{school.deliveryTime}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Armada: <strong className="text-slate-800">{school.driver}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <span className="text-xs font-semibold text-slate-700">
                        {isDelivered ? (
                          <span className="text-emerald-700 font-bold">BAST Selesai</span>
                        ) : (
                          <span className="text-amber-700 font-medium">Menunggu Verifikasi</span>
                        )}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        Lihat Berkas <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DRAFT BAST DIGITAL & FORM */}
      {activeSubTab === 'bast_preview' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-800">
              Format Digital: Berita Acara Serah Terima (BAST) Porsi Makanan
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Rancangan dokumen digital tanpa kertas yang akan diisi oleh driver SPPG bersama pihak sekolah saat serah terima
              makanan
            </p>
          </div>

          <div className="max-w-2xl mx-auto bg-slate-50 p-6 rounded-2xl border border-slate-300 shadow-sm space-y-5">
            <div className="text-center border-b border-slate-200 pb-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                KEMENTERIAN / BADAN GIZI NASIONAL
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                BERITA ACARA SERAH TERIMA MAKANAN BERGIZI GRATIS (MBG)
              </h3>
              <p className="text-[11px] text-slate-500">Nomor Dokumen: BAST-SPPG-20261018-001</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Unit Dapur Penyedia:</span>
                <p className="font-semibold text-slate-800">{activeUnitName}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Tanggal & Waktu:</span>
                <p className="font-semibold text-slate-800">18 Oktober 2026 • 11:15 WIB</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Sekolah Penerima:</span>
                <p className="font-semibold text-slate-800">SDN 1 Abar-Abir</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Jumlah Porsi Diserahkan:</span>
                <p className="font-bold text-emerald-700 text-sm">450 Porsi Lengkap</p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Verifikasi Kelayakan Makanan:</span>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Kondisi wadah/ompreng tertutup rapat, bersih, higienis</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Suhu makanan saat diterima: 62°C (Hangat & Layak Santap)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Lauk, sayur, buah melon & susu dalam kondisi segar utuh</span>
              </div>
            </div>

            {/* Tanda Tangan Digital */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-center">
              <div className="space-y-8">
                <span className="text-[11px] text-slate-500 font-medium">Petugas Pengantar / Driver:</span>
                <div className="h-12 border-b border-dashed border-slate-300 flex items-center justify-center text-xs italic text-indigo-700 font-serif">
                  (Tanda Tangan Digital Tersimpan)
                </div>
                <p className="text-xs font-semibold text-slate-800">Pak Joko</p>
              </div>

              <div className="space-y-8">
                <span className="text-[11px] text-slate-500 font-medium">Pihak Sekolah Penerima:</span>
                <div className="h-12 border-b border-dashed border-slate-300 flex items-center justify-center text-xs italic text-emerald-700 font-serif">
                  (Tanda Tangan Digital Tersimpan)
                </div>
                <p className="text-xs font-semibold text-slate-800">Ibu Ratna, S.Pd (NIP. 19820412...)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STANDAR OPERASIONAL (SOP FOOD SAFETY) */}
      {activeSubTab === 'sop' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-800">Standar Operasional (SOP) Distribusi Makanan Bergizi</h2>
            <p className="text-xs text-slate-500 mt-1">
              Panduan keamanan pangan (Food Safety) yang wajib dipatuhi dari kuali dapur hingga dinikmati siswa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
                <Clock className="w-4 h-4" />
                <span>1. Golden Time Window (Maksimal 4 Jam)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Makanan matang harus sudah dibagikan dan dikonsumsi oleh siswa maksimal dalam tempo <strong>4 jam</strong>{' '}
                sejak selesai dimasak oleh juru masak di dapur. Makanan yang melebihi batas 4 jam wajib diuji ulang sebelum
                dibagikan.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
                <ThermometerSun className="w-4 h-4" />
                <span>2. Suhu Kontrol Penyimpanan & Transport</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Makanan panas (nasi, lauk berkuah/tumis) wajib disimpan di wadah insulated thermal box agar suhu terjaga di
                atas <strong>60°C</strong>. Buah segar dan susu disimpan di chiller box terpisah (&lt; 10°C).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>3. Food Sample Archiving (Sampel Uji)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dapur SPPG wajib menyisihkan 1 porsi sampel dari setiap menu harian ke dalam wadah steril dan disimpan di lemari
                pendingin selama 2 x 24 jam untuk keperluan uji laboratorium bila sewaktu-waktu terjadi audit kesehatan.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
                <FileCheck2 className="w-4 h-4" />
                <span>4. Penanganan Porsi Berlebih (Surplus Handling)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bila ada siswa yang sakit/absen, sisa porsi yang masih higienis dan belum dibuka dapat dibagikan kepada tenaga
                pendidik atau siswa lain yang membutuhkan dengan persetujuan Kepala Sekolah dan dicatat di form BAST.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Sekolah (Simulasi) */}
      {selectedSchoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  DETAIL PENGIRIMAN
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedSchoolModal.name}</h3>
                <p className="text-xs text-slate-500">{selectedSchoolModal.address}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSchoolModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Nomor BAST:</span>
                <span className="font-bold text-slate-800">{selectedSchoolModal.bastNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Porsi:</span>
                <span className="font-bold text-emerald-700">
                  {selectedSchoolModal.deliveredPortions} / {selectedSchoolModal.targetPortions} Porsi
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Sampai:</span>
                <span className="font-semibold text-slate-800">{selectedSchoolModal.deliveryTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Driver & Armada:</span>
                <span className="font-semibold text-slate-800">{selectedSchoolModal.driver}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Penerima di Sekolah:</span>
                <span className="font-semibold text-slate-800">
                  {selectedSchoolModal.recipient} ({selectedSchoolModal.recipientPhone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Suhu Makanan:</span>
                <span className="font-semibold text-slate-800">{selectedSchoolModal.temperature}</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <strong className="text-indigo-950 block">Menu Makanan Siang:</strong>
              <p>{selectedSchoolModal.menuNote}</p>
            </div>

            <div className="text-[11px] text-slate-500 italic bg-amber-50 p-3 rounded-lg border border-amber-200">
              📌 {selectedSchoolModal.photoNote}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSchoolModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
