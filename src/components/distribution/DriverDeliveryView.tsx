'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { MealDelivery } from '@/lib/types';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  Navigation,
  FileText,
  Printer,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Thermometer,
  ShieldCheck,
  AlertCircle,
  X,
  PackageCheck,
  Camera,
  Layers,
  UtensilsCrossed,
} from 'lucide-react';
import { TouchSignaturePad } from './TouchSignaturePad';
import { OfficialBastDocument } from './OfficialBastDocument';

export function DriverDeliveryView() {
  const { currentUser, selectedSppgUnit, sppgUnits } = useStore();
  const [deliveries, setDeliveries] = useState<MealDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Modal State
  const [signingDelivery, setSigningDelivery] = useState<MealDelivery | null>(null);
  const [printDelivery, setPrintDelivery] = useState<MealDelivery | null>(null);

  // Form pengesahan BAST
  const [bastForm, setBastForm] = useState({
    recipientName: '',
    recipientNip: '',
    deliveredPortions: 0,
    absentStudents: 0,
    absentReason: 'Siswa Sakit / Absen',
    foodTemperature: '64.5°C',
    recipientSignature: '',
    notes: '',
  });

  // Fetch data pengiriman real-time
  const fetchDeliveries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/distribution');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Filter berdasarkan SPPG unit jika dipilih
        const filtered =
          selectedSppgUnit && selectedSppgUnit !== 'ALL'
            ? json.data.filter((d: MealDelivery) => d.sppgUnitId === selectedSppgUnit)
            : json.data;
        setDeliveries(filtered);
      }
    } catch (e) {
      console.error('Gagal mengambil data pengantaran driver:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [selectedSppgUnit]);

  // 1. Aksi: Driver Mulai Berangkat (OTW)
  const handleStartTransit = async (delivery: MealDelivery) => {
    setIsUpdating(delivery.id);
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    try {
      const res = await fetch(`/api/distribution/${delivery.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_TRANSIT',
          departureTime: nowTime,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDeliveries((prev) =>
          prev.map((d) => (d.id === delivery.id ? { ...d, status: 'IN_TRANSIT' as const, departureTime: nowTime } : d))
        );
      }
    } catch (err) {
      console.error('Gagal update status OTW:', err);
    } finally {
      setIsUpdating(null);
    }
  };

  // 2. Aksi: Driver Tiba di Sekolah
  const handleArriveSchool = async (delivery: MealDelivery) => {
    setIsUpdating(delivery.id);
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    try {
      const res = await fetch(`/api/distribution/${delivery.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ARRIVED',
          actualArrival: nowTime,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDeliveries((prev) =>
          prev.map((d) => (d.id === delivery.id ? { ...d, status: 'ARRIVED' as const, actualArrival: nowTime } : d))
        );
      }
    } catch (err) {
      console.error('Gagal update tiba di sekolah:', err);
    } finally {
      setIsUpdating(null);
    }
  };

  // Buka Modal Pengesahan BAST
  const handleOpenSigning = (delivery: MealDelivery) => {
    setSigningDelivery(delivery);
    setBastForm({
      recipientName: delivery.recipientName || delivery.contactPerson || '',
      recipientNip: delivery.recipientNip || '',
      deliveredPortions: delivery.deliveredPortions || delivery.targetPortions,
      absentStudents: delivery.absentStudents || 0,
      absentReason: 'Siswa Sakit / Absen',
      foodTemperature: delivery.foodTemperature || '64.5°C',
      recipientSignature: delivery.recipientSignature || '',
      notes: delivery.notes || '',
    });
  };

  // Simpan Pengesahan BAST
  const handleSaveSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signingDelivery) return;

    if (!bastForm.recipientSignature) {
      alert('Mohon minta Bapak/Ibu Guru untuk membubuhkan tanda tangan di layar sentuh HP terlebih dahulu.');
      return;
    }

    setIsUpdating(signingDelivery.id);
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    try {
      const payload = {
        status: 'COMPLETED' as const,
        recipientName: bastForm.recipientName,
        recipientNip: bastForm.recipientNip,
        deliveredPortions: Number(bastForm.deliveredPortions),
        absentStudents: Number(bastForm.absentStudents),
        foodTemperature: bastForm.foodTemperature,
        isSigned: true,
        recipientSignature: bastForm.recipientSignature,
        actualArrival: signingDelivery.actualArrival || nowTime,
        notes: bastForm.notes,
      };

      const res = await fetch(`/api/distribution/${signingDelivery.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setDeliveries((prev) =>
          prev.map((d) => (d.id === signingDelivery.id ? { ...d, ...payload } : d))
        );
        // Otomatis buka BAST resmi setelah disahkan
        const updatedDelivery = { ...signingDelivery, ...payload };
        setSigningDelivery(null);
        setPrintDelivery(updatedDelivery as MealDelivery);
      } else {
        alert(json.error || 'Gagal menyimpan tanda tangan BAST.');
      }
    } catch (err) {
      console.error('Error simpan BAST:', err);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setIsUpdating(null);
    }
  };

  // Hitung ringkasan hari ini
  const totalTasks = deliveries.length;
  const completedTasks = deliveries.filter((d) => d.status === 'COMPLETED').length;
  const inTransitTasks = deliveries.filter((d) => d.status === 'IN_TRANSIT' || d.status === 'ARRIVED').length;
  const totalPortions = deliveries.reduce((acc, d) => acc + (d.targetPortions || 0), 0);

  return (
    <div className="space-y-4 pb-12 max-w-3xl mx-auto">
      {/* 1. KARTU SAMBUTAN KHUSUS DRIVER / KURIR */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Truck className="w-3 h-3" />
                Mode Petugas Distribusi
              </span>
              <span className="text-xs text-slate-400">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              Halo, {currentUser?.name || 'Petugas Distribusi MBG'}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tugas Anda hari ini mengantarkan paket MBG tepat waktu, memeriksa suhu makanan (≥ 60°C), dan meminta tanda tangan BAST langsung di HP ini.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDeliveries}
            className="self-start sm:self-center p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            title="Muat ulang rute pengantaran"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-[11px]">Refresh</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-center">
          <div className="bg-white/5 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tujuan Sekolah</span>
            <span className="text-lg sm:text-xl font-black text-white">{totalTasks}</span>
            <span className="text-[9px] text-slate-400 block">Titik Antar</span>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="text-[10px] text-amber-300 uppercase font-semibold block">Total Ompreng</span>
            <span className="text-lg sm:text-xl font-black text-amber-400">{totalPortions}</span>
            <span className="text-[9px] text-slate-400 block">Porsi Siswa</span>
          </div>

          <div className="bg-white/5 rounded-xl p-2.5 backdrop-blur-xs">
            <span className="text-[10px] text-emerald-300 uppercase font-semibold block">Selesai (BAST)</span>
            <span className="text-lg sm:text-xl font-black text-emerald-400">{completedTasks}</span>
            <span className="text-[9px] text-slate-400 block">Dari {totalTasks} Sekolah</span>
          </div>
        </div>
      </div>

      {/* 2. DAFTAR TUGAS PENGANTARAN (MOBILE-FIRST TASK CARDS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-indigo-600" />
            <span>Rute Pengantaran Sekolah Hari Ini ({deliveries.length})</span>
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">
            {inTransitTasks > 0 ? `🚚 ${inTransitTasks} OTW/Tiba` : 'Semua Siap'}
          </span>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
            <p className="text-xs text-slate-600 font-medium">Memuat jadwal rute pengantaran...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Belum Ada Rute Pengantaran Aktif</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Jadwal pengiriman dari dapur SPPG belum dibuat untuk armada Anda hari ini. Hubungi admin operasional dapur untuk informasi penugasan.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchDeliveries}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              Cek Rute Lagi
            </button>
          </div>
        ) : (
          deliveries.map((delivery, index) => {
            const isCompleted = delivery.status === 'COMPLETED';
            const isInTransit = delivery.status === 'IN_TRANSIT';
            const isArrived = delivery.status === 'ARRIVED';
            const isPreparing = delivery.status === 'PREPARING';

            return (
              <div
                key={delivery.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 shadow-sm space-y-3.5 ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isInTransit || isArrived
                    ? 'border-indigo-300 ring-2 ring-indigo-500/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Header Kartu: Status Badge & Nomor Surat Jalan */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {delivery.dispatchNumber}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Selesai (BAST Sah)
                      </span>
                    ) : isArrived ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <MapPin className="w-3 h-3 text-amber-600" />
                        Tiba di Sekolah
                      </span>
                    ) : isInTransit ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">
                        <Truck className="w-3 h-3 text-blue-600" />
                        Sedang OTW
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <Clock className="w-3 h-3 text-slate-500" />
                        Siap di Dapur
                      </span>
                    )}
                  </div>
                </div>

                {/* Nama Sekolah & Alamat */}
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{delivery.schoolName}</h3>
                  <p className="text-xs text-slate-600 mt-0.5 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{delivery.schoolAddress}</span>
                  </p>
                </div>

                {/* Info Bar: Porsi & Kontak 1-Klik */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Jumlah Porsi */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Target Porsi MBG</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base font-black text-slate-900">{delivery.targetPortions}</span>
                      <span className="text-[10px] text-slate-500">Ompreng</span>
                    </div>
                  </div>

                  {/* Kontak Guru Piket */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Guru Piket / Kontak</span>
                      <span className="font-bold text-slate-900 text-[11px] truncate block">
                        {delivery.recipientName || delivery.contactPerson}
                      </span>
                    </div>
                    {delivery.contactPhone && (
                      <a
                        href={`tel:${delivery.contactPhone}`}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] text-indigo-600 font-bold hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        Hubungi ({delivery.contactPhone})
                      </a>
                    )}
                  </div>
                </div>

                {/* Rincian Menu Ringkas */}
                <div className="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[11px] text-indigo-950 flex items-center justify-between">
                  <div className="truncate">
                    <span className="font-bold block text-indigo-900 truncate">{delivery.menuTitle}</span>
                    <span className="text-[10px] text-indigo-700/80">
                      {delivery.menuDetails?.carb || 'Nasi'} • {delivery.menuDetails?.protein || 'Ayam'} • {delivery.menuDetails?.dairy || 'Susu'}
                    </span>
                  </div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded-md shrink-0">
                    QC: {delivery.foodTemperature || '64.5°C'}
                  </span>
                </div>

                {/* AREA TOMBOL AKSI UTAMA DRIVER (TOUCH FRIENDLY DI SMARTPHONE) */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  {/* Google Maps Shortcut */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${delivery.schoolName} ${delivery.schoolAddress}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Petunjuk Arah (Maps)</span>
                  </a>

                  {/* Tombol Alur Kerja Driver */}
                  <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                    {/* Alur 1: Dari Dapur ke OTW */}
                    {isPreparing && (
                      <button
                        type="button"
                        disabled={isUpdating === delivery.id}
                        onClick={() => handleStartTransit(delivery)}
                        className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
                      >
                        {isUpdating === delivery.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Truck className="w-3.5 h-3.5" />
                        )}
                        <span>Mulai Berangkat (OTW)</span>
                      </button>
                    )}

                    {/* Alur 2: Sedang OTW -> Tiba di Sekolah */}
                    {isInTransit && (
                      <button
                        type="button"
                        disabled={isUpdating === delivery.id}
                        onClick={() => handleArriveSchool(delivery)}
                        className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
                      >
                        {isUpdating === delivery.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5" />
                        )}
                        <span>Konfirmasi Tiba di Sekolah</span>
                      </button>
                    )}

                    {/* Alur 3: Sudah Tiba -> Sahkan BAST di Layar HP */}
                    {(isArrived || isInTransit) && (
                      <button
                        type="button"
                        onClick={() => handleOpenSigning(delivery)}
                        className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Sahkan BAST (TTD Layar HP)</span>
                      </button>
                    )}

                    {/* Alur 4: Selesai -> Buka / Cetak BAST Resmi Pemerintah */}
                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => setPrintDelivery(delivery)}
                        className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Buka BAST Resmi A4</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. MODAL PENGESAHAN TANDA TANGAN BAST LAYAR SENTUH HP */}
      {signingDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Pengesahan Serah Terima Resmi
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {signingDelivery.schoolName}
                </h3>
                <p className="text-xs text-slate-500">
                  Serahkan HP ini kepada Guru Piket untuk memeriksa porsi dan tanda tangan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSigningDelivery(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSignature} className="space-y-3.5 text-xs">
              {/* Rekapitulasi Realisasi Ompreng & Porsi Bersih */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-900 block text-[11px] uppercase">
                  Realisasi Fisik Ompreng / Porsi:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-[9.5px] text-slate-400 block font-medium">1. Dikirim Dapur</span>
                    <span className="font-black text-slate-900 text-sm">{signingDelivery.targetPortions}</span>
                    <span className="text-[9px] text-slate-400 block">Porsi</span>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-rose-200 text-center">
                    <span className="text-[9.5px] text-rose-500 block font-medium">2. Ompreng Retur</span>
                    <input
                      type="number"
                      min="0"
                      max={signingDelivery.targetPortions}
                      placeholder="0"
                      value={bastForm.absentStudents === 0 ? '' : bastForm.absentStudents}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/^0+(?=\d)/, '');
                        const retur = raw === '' ? 0 : Math.max(0, parseInt(raw, 10));
                        const net = Math.max(0, signingDelivery.targetPortions - retur);
                        setBastForm({
                          ...bastForm,
                          absentStudents: retur,
                          deliveredPortions: net,
                        });
                      }}
                      className="w-full text-center font-bold text-rose-700 text-sm border-b border-rose-300 focus:outline-none"
                    />
                    <span className="text-[9px] text-rose-400 block">Siswa Absen/Sakit</span>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-emerald-200 text-center">
                    <span className="text-[9.5px] text-emerald-600 block font-medium">3. Bersih Dimakan</span>
                    <span className="font-black text-emerald-700 text-sm">{bastForm.deliveredPortions}</span>
                    <span className="text-[9px] text-emerald-400 block">Porsi Netto</span>
                  </div>
                </div>
              </div>

              {/* Data Guru Penerima & Suhu Makanan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Guru / Penerima:</label>
                  <input
                    type="text"
                    required
                    value={bastForm.recipientName}
                    onChange={(e) => setBastForm({ ...bastForm, recipientName: e.target.value })}
                    placeholder="Contoh: Ibu Siti Rahayu, S.Pd"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Suhu Makanan Saat Diterima:</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={bastForm.foodTemperature}
                      onChange={(e) => setBastForm({ ...bastForm, foodTemperature: e.target.value })}
                      placeholder="64.5°C"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs pl-8 font-mono"
                    />
                    <Thermometer className="w-4 h-4 text-amber-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-[9.5px] text-slate-400">Standar keamanan pangan HACCP BGN: ≥ 60°C</span>
                </div>
              </div>

              {/* Komponen Tanda Tangan Digital Layar Sentuh HP */}
              <TouchSignaturePad
                value={bastForm.recipientSignature}
                onChange={(sig) => setBastForm({ ...bastForm, recipientSignature: sig })}
                signerName={bastForm.recipientName || 'Bapak/Ibu Guru'}
              />

              {/* Tombol Aksi Simpan */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSigningDelivery(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating === signingDelivery.id}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  {isUpdating === signingDelivery.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Sahkan & Terbitkan BAST Resmi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL DOKUMEN RESMI BAST STANDAR PEMERINTAH (BGN/SPPG) */}
      {printDelivery && (
        <OfficialBastDocument
          delivery={printDelivery}
          onClose={() => setPrintDelivery(null)}
        />
      )}
    </div>
  );
}
