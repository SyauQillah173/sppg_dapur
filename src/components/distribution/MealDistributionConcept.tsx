'use client';

import React, { useState, useEffect } from 'react';
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
  Plus,
  Search,
  Filter,
  DollarSign,
  Calculator,
  Activity,
  Check,
  RefreshCw,
  Phone,
  MapPin,
  FileSpreadsheet,
  Award,
} from 'lucide-react';
import { useStore } from '@/lib/store';

// Interface Data Pengiriman Porsi Makanan
export interface MealDelivery {
  id: string;
  dispatchNumber: string; // e.g. SJ-20261018-01
  sppgUnitId: string;
  sppgUnitName: string;
  schoolName: string;
  schoolAddress: string;
  schoolType: 'SD' | 'SMP' | 'MI' | 'SMA';
  contactPerson: string;
  contactPhone: string;
  menuCode: string; // e.g. MENU-20261018-SIANG
  menuTitle: string;
  menuDetails: {
    carb: string;
    protein: string;
    veggie: string;
    fruit: string;
    dairy: string;
  };
  targetPortions: number;
  deliveredPortions: number;
  absentStudents: number;
  surplusHandling: string;
  status: 'PREPARING' | 'IN_TRANSIT' | 'ARRIVED' | 'COMPLETED';
  departureTime: string;
  estimatedArrival: string;
  actualArrival?: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  foodTemperature: string;
  foodSafetyWindow: string; // e.g. "Aman s.d 13:30 WIB (< 4 Jam)"
  recipientName: string;
  recipientNip?: string;
  bastNumber: string;
  isSigned: boolean;
  notes?: string;
  createdAt: string;
}

const STORAGE_KEY = 'sppg_meal_distributions_v1';

const INITIAL_DELIVERIES: MealDelivery[] = [
  {
    id: 'del-1',
    dispatchNumber: 'SJ-SPPG-20261018-01',
    sppgUnitId: 'SPPG-AA02',
    sppgUnitName: 'SPPG ABAR ABIR 02',
    schoolName: 'SDN 1 Abar-Abir',
    schoolAddress: 'Jl. Raya Pendidikan No. 12, Kec. Bungah',
    schoolType: 'SD',
    contactPerson: 'Ibu Ratna, S.Pd',
    contactPhone: '0813-8890-1234',
    menuCode: 'MENU-20261018-SIANG',
    menuTitle: 'Paket Sehat Ceria (Ayam Teriyaki & Melon Segar)',
    menuDetails: {
      carb: 'Nasi Putih Pulen Wangi (150g)',
      protein: 'Ayam Fillet Teriyaki Panggang (60g)',
      veggie: 'Tumis Brokoli & Wortel Pipil (50g)',
      fruit: 'Melon Potong Segar (1 Potong)',
      dairy: 'Susu UHT Segar 125ml (1 Kotak)',
    },
    targetPortions: 450,
    deliveredPortions: 450,
    absentStudents: 3,
    surplusHandling: '3 Porsi dialihkan ke Guru Pendamping Kelas 1-3 & Petugas Piket',
    status: 'COMPLETED',
    departureTime: '10:45 WIB',
    estimatedArrival: '11:05 WIB',
    actualArrival: '11:02 WIB',
    driverName: 'Pak Joko Suwarno',
    driverPhone: '0812-9901-2345',
    vehiclePlate: 'W 1823 BX (Pickup Thermal Box)',
    foodTemperature: '64.5°C (Sangat Hangat & Optimal)',
    foodSafetyWindow: 'Batas Konsumsi: 13:30 WIB (Aman)',
    recipientName: 'Ibu Ratna, S.Pd (Guru Piket)',
    recipientNip: '19820412 200801 2 009',
    bastNumber: 'BAST-MBG-20261018-001',
    isSigned: true,
    notes: 'Kondisi makanan diterima lengkap, hangat, wadah tersegel rapi tanpa kendala.',
    createdAt: '2026-10-18T10:30:00Z',
  },
  {
    id: 'del-2',
    dispatchNumber: 'SJ-SPPG-20261018-02',
    sppgUnitId: 'SPPG-AA02',
    sppgUnitName: 'SPPG ABAR ABIR 02',
    schoolName: 'SMPN 2 Karang Anyar',
    schoolAddress: 'Jl. Pemuda Harapan No. 05, Bungah',
    schoolType: 'SMP',
    contactPerson: 'Bpk. Hendra Kusuma, M.Pd',
    contactPhone: '0812-4456-7890',
    menuCode: 'MENU-20261018-SIANG',
    menuTitle: 'Paket Sehat Ceria (Ayam Teriyaki & Melon Segar)',
    menuDetails: {
      carb: 'Nasi Putih Pulen Wangi (180g)',
      protein: 'Ayam Fillet Teriyaki Panggang (70g)',
      veggie: 'Tumis Brokoli & Wortel Pipil (60g)',
      fruit: 'Melon Potong Segar (1 Potong)',
      dairy: 'Susu UHT Segar 125ml (1 Kotak)',
    },
    targetPortions: 500,
    deliveredPortions: 500,
    absentStudents: 0,
    surplusHandling: 'Semua siswa hadir lengkap 100%',
    status: 'COMPLETED',
    departureTime: '11:00 WIB',
    estimatedArrival: '11:25 WIB',
    actualArrival: '11:20 WIB',
    driverName: 'Pak Budi Santoso',
    driverPhone: '0857-1122-3344',
    vehiclePlate: 'W 2940 DA (Mobil Box Insulated)',
    foodTemperature: '62.0°C (Hangat)',
    foodSafetyWindow: 'Batas Konsumsi: 13:30 WIB (Aman)',
    recipientName: 'Bpk. Hendra Kusuma, M.Pd (Waka Kesiswaan)',
    recipientNip: '19790615 200501 1 008',
    bastNumber: 'BAST-MBG-20261018-002',
    isSigned: true,
    notes: 'Didistribusikan ke 14 ruang kelas tepat saat jam istirahat siang.',
    createdAt: '2026-10-18T10:45:00Z',
  },
  {
    id: 'del-3',
    dispatchNumber: 'SJ-SPPG-20261018-03',
    sppgUnitId: 'SPPG-AA02',
    sppgUnitName: 'SPPG ABAR ABIR 02',
    schoolName: 'MI Miftahul Huda',
    schoolAddress: 'Desa Abar-Abir RT 03/RW 01',
    schoolType: 'MI',
    contactPerson: 'Ustadz Ahmad Fauzi',
    contactPhone: '0857-9912-3456',
    menuCode: 'MENU-20261018-SIANG',
    menuTitle: 'Paket Sehat Ceria (Ayam Teriyaki & Melon Segar)',
    menuDetails: {
      carb: 'Nasi Putih Pulen Wangi (150g)',
      protein: 'Ayam Fillet Teriyaki Panggang (60g)',
      veggie: 'Tumis Brokoli & Wortel Pipil (50g)',
      fruit: 'Melon Potong Segar (1 Potong)',
      dairy: 'Susu UHT Segar 125ml (1 Kotak)',
    },
    targetPortions: 250,
    deliveredPortions: 0,
    absentStudents: 0,
    surplusHandling: 'Menunggu konfirmasi kedatangan',
    status: 'IN_TRANSIT',
    departureTime: '11:30 WIB',
    estimatedArrival: '11:45 WIB',
    driverName: 'Pak Joko Suwarno (Rute 2)',
    driverPhone: '0812-9901-2345',
    vehiclePlate: 'W 1823 BX (Pickup Thermal Box)',
    foodTemperature: '65.0°C (Dalam Thermal Box)',
    foodSafetyWindow: 'Batas Konsumsi: 13:30 WIB (Aman)',
    recipientName: 'Ustadz Ahmad Fauzi',
    bastNumber: 'BAST-MBG-20261018-003 (Draft)',
    isSigned: false,
    notes: 'Driver sedang dalam perjalanan, jarak tempuh ~1.5 km.',
    createdAt: '2026-10-18T11:20:00Z',
  },
];

export function MealDistributionConcept() {
  const { userRole, selectedSppgUnit, sppgUnits, procurements } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<'monitoring' | 'food_costing' | 'pipeline' | 'bast_preview' | 'sop'>('monitoring');

  // State List Deliveries
  const [deliveries, setDeliveries] = useState<MealDelivery[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return INITIAL_DELIVERIES;
  });

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PREPARING' | 'IN_TRANSIT' | 'ARRIVED' | 'COMPLETED'>('ALL');

  // Modals
  const [selectedDelivery, setSelectedDelivery] = useState<MealDelivery | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDelivery, setPrintDelivery] = useState<MealDelivery | null>(null);

  // Form State untuk Tambah Pengiriman Baru
  const [newForm, setNewForm] = useState({
    schoolName: '',
    schoolAddress: '',
    schoolType: 'SD' as 'SD' | 'SMP' | 'MI' | 'SMA',
    contactPerson: '',
    contactPhone: '',
    targetPortions: 200,
    menuTitle: 'Paket Sehat Ceria (Ayam Teriyaki & Melon Segar)',
    carb: 'Nasi Putih Pulen (150g)',
    protein: 'Ayam Fillet Teriyaki (60g)',
    veggie: 'Tumis Sayur Segar (50g)',
    fruit: 'Melon Potong (1 Potong)',
    dairy: 'Susu UHT 125ml (1 Kotak)',
    driverName: 'Pak Joko Suwarno',
    vehiclePlate: 'W 1823 BX',
    departureTime: '11:00 WIB',
    estimatedArrival: '11:25 WIB',
    sppgUnitId: (selectedSppgUnit === 'ALL' ? 'SPPG-AA02' : (selectedSppgUnit as string)) as string,
  });

  // Kalkulator Costing State
  const [costingPortions, setCostingPortions] = useState(1200);
  const [costingBudget, setCostingBudget] = useState(18000000); // Rp 18.000.000 (Rp 15.000 / porsi)

  // Simpan ke LocalStorage tiap perubahan
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deliveries));
    }
  }, [deliveries]);

  // Proteksi Role Superadmin
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

  // Filter Deliveries
  const filteredDeliveries = deliveries.filter((d) => {
    if (selectedSppgUnit !== 'ALL' && d.sppgUnitId !== selectedSppgUnit) return false;
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.schoolName.toLowerCase().includes(q) ||
        d.dispatchNumber.toLowerCase().includes(q) ||
        d.driverName.toLowerCase().includes(q) ||
        d.contactPerson.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI Metrics
  const totalTargetPortions = filteredDeliveries.reduce((acc, d) => acc + d.targetPortions, 0);
  const totalDeliveredPortions = filteredDeliveries.reduce((acc, d) => acc + d.deliveredPortions, 0);
  const totalCompletedSchools = filteredDeliveries.filter((d) => d.status === 'COMPLETED').length;
  const totalTransitSchools = filteredDeliveries.filter((d) => d.status === 'IN_TRANSIT').length;

  // Handle Tambah Pengiriman Baru
  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.schoolName.trim()) {
      alert('Nama sekolah penerima wajib diisi');
      return;
    }

    const unitObj = sppgUnits.find((u) => u.id === newForm.sppgUnitId);
    const unitName = unitObj?.name || 'SPPG ABAR ABIR 02';
    const randomId = 'del-' + Date.now();
    const count = deliveries.length + 1;
    const pad = String(count).padStart(2, '0');

    const created: MealDelivery = {
      id: randomId,
      dispatchNumber: `SJ-SPPG-20261018-${pad}`,
      sppgUnitId: newForm.sppgUnitId,
      sppgUnitName: unitName,
      schoolName: newForm.schoolName,
      schoolAddress: newForm.schoolAddress || 'Kecamatan Bungah',
      schoolType: newForm.schoolType,
      contactPerson: newForm.contactPerson || 'Pihak Sekolah',
      contactPhone: newForm.contactPhone || '0812-xxxx-xxxx',
      menuCode: 'MENU-20261018-SIANG',
      menuTitle: newForm.menuTitle,
      menuDetails: {
        carb: newForm.carb,
        protein: newForm.protein,
        veggie: newForm.veggie,
        fruit: newForm.fruit,
        dairy: newForm.dairy,
      },
      targetPortions: Number(newForm.targetPortions) || 100,
      deliveredPortions: 0,
      absentStudents: 0,
      surplusHandling: 'Porsi lebih dialokasikan untuk guru/staf TU dengan verifikasi',
      status: 'PREPARING',
      departureTime: newForm.departureTime,
      estimatedArrival: newForm.estimatedArrival,
      driverName: newForm.driverName,
      driverPhone: '0812-9901-2345',
      vehiclePlate: newForm.vehiclePlate,
      foodTemperature: '65°C (Dalam Thermal Box)',
      foodSafetyWindow: 'Batas Konsumsi: 13:30 WIB (Maks 4 Jam)',
      recipientName: newForm.contactPerson || 'Kepala Sekolah / Guru Piket',
      bastNumber: `BAST-MBG-20261018-${pad} (Draft)`,
      isSigned: false,
      notes: 'Surat jalan dibuat oleh Superadmin.',
      createdAt: new Date().toISOString(),
    };

    setDeliveries([created, ...deliveries]);
    setIsAddModalOpen(false);
    // Reset Form
    setNewForm({
      schoolName: '',
      schoolAddress: '',
      schoolType: 'SD',
      contactPerson: '',
      contactPhone: '',
      targetPortions: 200,
      menuTitle: 'Paket Sehat Ceria (Ayam Teriyaki & Melon Segar)',
      carb: 'Nasi Putih Pulen (150g)',
      protein: 'Ayam Fillet Teriyaki (60g)',
      veggie: 'Tumis Sayur Segar (50g)',
      fruit: 'Melon Potong (1 Potong)',
      dairy: 'Susu UHT 125ml (1 Kotak)',
      driverName: 'Pak Joko Suwarno',
      vehiclePlate: 'W 1823 BX',
      departureTime: '11:00 WIB',
      estimatedArrival: '11:25 WIB',
      sppgUnitId: (selectedSppgUnit === 'ALL' ? 'SPPG-AA02' : (selectedSppgUnit as string)) as string,
    });
  };

  // Update Status Cepat
  const handleUpdateStatus = (id: string, nextStatus: MealDelivery['status']) => {
    setDeliveries((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        let delivered = item.deliveredPortions;
        let isSigned = item.isSigned;
        let actualArr = item.actualArrival;

        if (nextStatus === 'COMPLETED') {
          delivered = item.targetPortions;
          isSigned = true;
          actualArr = actualArr || '11:15 WIB';
        } else if (nextStatus === 'ARRIVED') {
          actualArr = actualArr || '11:10 WIB';
        }

        return {
          ...item,
          status: nextStatus,
          deliveredPortions: delivered,
          isSigned,
          actualArrival: actualArr,
        };
      })
    );

    if (selectedDelivery && selectedDelivery.id === id) {
      setSelectedDelivery((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }
  };

  // Reset ke data awal jika ingin restart demo
  const handleResetDemoData = () => {
    if (confirm('Kembalikan data simulasi distribusi ke awal?')) {
      setDeliveries(INITIAL_DELIVERIES);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Kalkulasi Food Costing
  const costPerPortion = costingPortions > 0 ? Math.round(costingBudget / costingPortions) : 0;
  const totalWeightPerPortion = 150 + 60 + 50 + 80 + 125; // Gramasi ~465 gram per siswa

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner Superadmin Exclusive */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-md border border-indigo-900/50">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-6 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Khusus Superadmin
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Sistem Terpadu Distribusi Makanan MBG
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                🔒 Tidak Ditampilkan ke Auditor
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <UtensilsCrossed className="w-6 h-6 text-indigo-400" />
              Manajemen Distribusi & Pengiriman Makanan Siap Santap
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Modul cerdas hilir Program Makan Bergizi Gratis (MBG): Menjadwalkan pengiriman armada dapur, melacak status tiba di
              sekolah secara real-time, menerbitkan Surat Jalan & BAST Digital, serta menghitung HPP (Costing) per porsi siswa.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              + Buat Surat Jalan Baru
            </button>
            <button
              onClick={handleResetDemoData}
              type="button"
              title="Reset data demo ke awal"
              className="inline-flex items-center justify-center p-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-300 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Highlight Note */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-start gap-3 text-xs text-indigo-200/90 bg-indigo-950/40 p-3 rounded-xl border border-indigo-800/40">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Fokus Kerja Superadmin:</strong> Pembukuan belanja dan kas tetap menjadi prioritas
            harian Anda. Modul konsep pengiriman ini kini telah aktif dengan data interaktif (tersimpan lokal di browser Anda)
            sehingga Anda sudah dapat mensimulasikan pencatatan surat jalan pengiriman dan serah terima sekolah secara lengkap!
          </p>
        </div>
      </div>

      {/* 2. Sub Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-xs overflow-x-auto scrollbar-none">
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
          1. Pengiriman & Monitoring Sekolah
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
            {filteredDeliveries.length} Rute
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('food_costing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeSubTab === 'food_costing'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-4 h-4" />
          2. Kalkulator HPP & Gizi per Porsi
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
          3. Cetak Surat Jalan & BAST Digital
        </button>

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
          4. Peta Alur Rantai Pasok MBG
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
          5. Standar Operasional (SOP)
        </button>
      </div>

      {/* 3. TAB 1: PENGIRIMAN & MONITORING SEKOLAH */}
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
                {totalTargetPortions.toLocaleString('id-ID')}{' '}
                <span className="text-xs font-normal text-slate-500">Porsi</span>
              </p>
              <div className="text-[11px] text-slate-500 mt-1">Total di {filteredDeliveries.length} sekolah tujuan</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Porsi Tiba & Diterima</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {totalDeliveredPortions.toLocaleString('id-ID')}{' '}
                <span className="text-xs font-normal text-slate-500">Porsi</span>
              </p>
              <div className="text-[11px] text-emerald-700 font-medium mt-1">{totalCompletedSchools} Sekolah Telah Lengkap</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Dalam Perjalanan Kurir</span>
                <Truck className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {(totalTargetPortions - totalDeliveredPortions).toLocaleString('id-ID')}{' '}
                <span className="text-xs font-normal text-slate-500">Porsi</span>
              </p>
              <div className="text-[11px] text-amber-700 font-medium mt-1">
                {totalTransitSchools > 0 ? `${totalTransitSchools} Armada OTW` : 'Semua Selesai'}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Keamanan Pangan (Suhu)</span>
                <ThermometerSun className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                63.5°C <span className="text-xs font-normal text-emerald-600 font-medium">Hangat Optimal</span>
              </p>
              <div className="text-[11px] text-slate-500 mt-1">Standar wajib: &gt; 60°C saat diterima</div>
            </div>
          </div>

          {/* Filter Toolbar & Search */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama sekolah, no. surat jalan, driver..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs bg-slate-50">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    statusFilter === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({deliveries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('IN_TRANSIT')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    statusFilter === 'IN_TRANSIT'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  OTW
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('COMPLETED')}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    statusFilter === 'COMPLETED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Selesai
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Rute
              </button>
            </div>
          </div>

          {/* Delivery Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDeliveries.map((delivery) => {
              const isCompleted = delivery.status === 'COMPLETED';
              const isInTransit = delivery.status === 'IN_TRANSIT';
              const isPreparing = delivery.status === 'PREPARING';

              return (
                <div
                  key={delivery.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {delivery.dispatchNumber}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isInTransit
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                        {isInTransit && <Truck className="w-3 h-3" />}
                        {isPreparing && <Clock className="w-3 h-3" />}
                        {isCompleted ? 'SELESAI DITERIMA' : isInTransit ? 'SEDANG DIKIRIM (OTW)' : 'SEDANG PACKING'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{delivery.schoolName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {delivery.schoolAddress}
                    </p>

                    {/* Progress Porsi */}
                    <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">Jumlah Porsi:</span>
                        <span className="font-bold text-slate-800">
                          {delivery.deliveredPortions} / {delivery.targetPortions} Porsi
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{
                            width: `${(delivery.deliveredPortions / delivery.targetPortions) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Body Information */}
                  <div className="p-5 space-y-2.5 text-xs text-slate-600 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Driver & Armada:</span>
                      <span className="font-medium text-slate-800 text-right">{delivery.driverName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Jam Pengantaran:</span>
                      <span className="font-medium text-slate-800">
                        {delivery.departureTime} (Tiba: {delivery.estimatedArrival})
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Penerima Sekolah:</span>
                      <span className="font-medium text-slate-800 text-right">{delivery.contactPerson}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Suhu Makanan:</span>
                      <span className="font-semibold text-rose-600 flex items-center gap-1">
                        <ThermometerSun className="w-3.5 h-3.5" />
                        {delivery.foodTemperature}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
                      🍱 {delivery.menuTitle}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDelivery(delivery)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-2xs flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      Detail & BAST
                    </button>

                    {/* Quick Status Buttons */}
                    {isPreparing && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(delivery.id, 'IN_TRANSIT')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition flex items-center gap-1 shadow-2xs"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Mulai Kirim (OTW)
                      </button>
                    )}

                    {isInTransit && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(delivery.id, 'COMPLETED')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Konfirmasi Selesai
                      </button>
                    )}

                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => {
                          setPrintDelivery(delivery);
                          setIsPrintModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Cetak BAST
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB 2: KALKULATOR HPP & GIZI PER PORSI */}
      {activeSubTab === 'food_costing' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Calculator className="w-4 h-4" />
              Smart Food Costing & Nutrition Engine
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Kalkulator Biaya Bahan & Konversi Gramasi Gizi per Siswa
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Simulasi perhitungan otomatis yang menghubungkan total biaya belanja dapur dengan jumlah porsi siswa yang dihasilkan.
              Menghitung Harga Pokok Porsi (HPP) serta proporsi gramasi bahan makanan per piring siswa.
            </p>
          </div>

          {/* Interactive Calculator Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Total Biaya Belanja Bahan Dapur (Rp):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  step="500000"
                  value={costingBudget}
                  onChange={(e) => setCostingBudget(Number(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-bold text-slate-800 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Contoh: Rp 18.000.000 (total nota belanja hari ini)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Porsi Makanan Siap Santap:
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="50"
                  value={costingPortions}
                  onChange={(e) => setCostingPortions(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 text-sm font-bold text-slate-800 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">Porsi</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Sesuai total porsi siswa 1.200 porsi</span>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 rounded-xl flex flex-col justify-between">
              <span className="text-xs text-indigo-200 font-medium">HPP Makanan per Siswa:</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Rp {costPerPortion.toLocaleString('id-ID')}
                <span className="text-xs font-normal text-indigo-300 ml-1">/ Porsi</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium mt-1">
                ✓ Sesuai standar pagu anggaran MBG Nasional (~Rp 15.000)
              </span>
            </div>
          </div>

          {/* Rincian Komposisi Makanan per Siswa */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              Distribusi Gramasi Bahan & Nilai Gizi per Ompreng Siswa (Menu Siang):
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-amber-600 uppercase">Karbohidrat</span>
                <h4 className="text-xs font-bold text-slate-800">Nasi Putih Pulen</h4>
                <p className="text-base font-bold text-slate-900">~150 Gram</p>
                <div className="text-[11px] text-slate-500">Kebutuhan Beras: 120 Kg / 1.200 Porsi</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-rose-600 uppercase">Protein Hewani</span>
                <h4 className="text-xs font-bold text-slate-800">Ayam Fillet Teriyaki</h4>
                <p className="text-base font-bold text-slate-900">~60-70 Gram</p>
                <div className="text-[11px] text-slate-500">Kebutuhan Daging: 75 Kg / 1.200 Porsi</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Sayur & Serat</span>
                <h4 className="text-xs font-bold text-slate-800">Tumis Brokoli Wortel</h4>
                <p className="text-base font-bold text-slate-900">~50 Gram</p>
                <div className="text-[11px] text-slate-500">Kebutuhan Sayur: 60 Kg / 1.200 Porsi</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 uppercase">Buah Segar</span>
                <h4 className="text-xs font-bold text-slate-800">Melon Potong</h4>
                <p className="text-base font-bold text-slate-900">~1 Potong (80g)</p>
                <div className="text-[11px] text-slate-500">Kebutuhan Melon: 10 Kg / 1.200 Porsi</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase">Susu Sehat</span>
                <h4 className="text-xs font-bold text-slate-800">Susu UHT Fresh</h4>
                <p className="text-base font-bold text-slate-900">125 ml</p>
                <div className="text-[11px] text-slate-500">Kebutuhan Susu: 1.200 Kotak</div>
              </div>
            </div>
          </div>

          {/* Audit Ringkasan Kalori */}
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-indigo-950">Estimasi Energi & Gizi Lengkap per Porsi:</h4>
                <p className="text-indigo-800/80">
                  Total Energi: <strong>~635 Kkal</strong> | Protein: <strong>~23.5 g</strong> | Karbohidrat:{' '}
                  <strong>~82 g</strong> | Lemak Sehat: <strong>~14 g</strong>
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0">
              ✓ 100% Memenuhi Standar Gizi Anak Sekolah
            </span>
          </div>
        </div>
      )}

      {/* 5. TAB 3: CETAK SURAT JALAN & BAST DIGITAL */}
      {activeSubTab === 'bast_preview' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Pusat Dokumen Resmi Pengiriman Makanan</h2>
              <p className="text-xs text-slate-500 mt-1">
                Pilih surat jalan / BAST untuk dicetak atau diekspor ke PDF dengan tata letak resmi
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {deliveries.map((del) => (
              <div key={del.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-900">{del.dispatchNumber}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-bold text-slate-700">{del.bastNumber}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        del.isSigned ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {del.isSigned ? 'Telah Ditandatangani' : 'Draft Siap Tanda Tangan'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{del.schoolName}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {del.deliveredPortions || del.targetPortions} Porsi • Pengantar: {del.driverName} ({del.vehiclePlate}) • Penerima: {del.recipientName}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPrintDelivery(del);
                      setIsPrintModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Buka Lembar Cetak
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TAB 4: PETA ALUR RANTAI PASOK MBG */}
      {activeSubTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Rantai Pasok Terintegrasi: Dari Uang Anggaran Hingga Piring Siswa
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Menghubungkan pencatatan keuangan yang Anda kelola saat ini dengan fase hilir konsumsi siswa
              </p>
            </div>

            {/* Stepper Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-600 text-white mb-2 inline-block">
                    FASE 1
                  </span>
                  <h4 className="text-xs font-bold text-slate-800">1. Alokasi Anggaran & Kas</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                    Penerimaan dana kasbon dari bendahara pusat per periode untuk unit SPPG.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-800 font-medium">
                  ✓ Menu Anggaran & Kas
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-600 text-white mb-2 inline-block">
                    FASE 2
                  </span>
                  <h4 className="text-xs font-bold text-slate-800">2. Belanja CV & Audit Nota</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                    Belanja ke CV/Supplier, upload nota foto, validasi OCR AI, dan pengembalian sisa kas.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-800 font-medium">
                  ✓ Menu Belanja & Audit
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-600 text-white mb-2 inline-block">
                    FASE 3
                  </span>
                  <h4 className="text-xs font-bold text-slate-800">3. Stok Bahan & Olah Dapur</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                    Bahan mentah masuk gudang dapur, dikeluarkan saat juru masak mulai mengolah menu porsi.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-800 font-medium">
                  ✓ Menu Stok Bahan Dapur
                </div>
              </div>

              <div className="p-4 rounded-xl border border-indigo-300 bg-indigo-50/50 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-600 text-white mb-2 inline-block">
                    FASE 4
                  </span>
                  <h4 className="text-xs font-bold text-indigo-950">4. Batching Porsi & QC Suhu</h4>
                  <p className="text-[11px] text-indigo-900/80 mt-1 leading-snug">
                    Makanan matang diuji rasa, dicek suhu (&gt;60°C), lalu di-packing ke box/ompreng bersekat.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-indigo-200/60 text-[10px] text-indigo-700 font-medium">
                  ⚡ Modul Distribusi Siap Santap
                </div>
              </div>

              <div className="p-4 rounded-xl border border-indigo-300 bg-indigo-50/50 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-600 text-white mb-2 inline-block">
                    FASE 5
                  </span>
                  <h4 className="text-xs font-bold text-indigo-950">5. Distribusi Sekolah & BAST</h4>
                  <p className="text-[11px] text-indigo-900/80 mt-1 leading-snug">
                    Armada kurir mengantar ke sekolah, diterima guru piket, tanda tangan BAST & foto santap siswa.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-indigo-200/60 text-[10px] text-indigo-700 font-medium">
                  ⚡ Modul Distribusi Siap Santap
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 5: STANDAR OPERASIONAL (SOP) */}
      {activeSubTab === 'sop' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
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

      {/* MODAL 1: TAMBAH SURAT JALAN BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Buat Surat Jalan & Jadwal Pengiriman Baru</h3>
                <p className="text-xs text-slate-500">Mendaftarkan armada dan porsi makanan siap santap ke sekolah sasaran</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Sekolah Penerima:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: SDN 2 Bungah Mandiri"
                    value={newForm.schoolName}
                    onChange={(e) => setNewForm({ ...newForm, schoolName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenjang Sekolah:</label>
                  <select
                    value={newForm.schoolType}
                    onChange={(e) => setNewForm({ ...newForm, schoolType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="SD">SD (Sekolah Dasar)</option>
                    <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                    <option value="MI">MI (Madrasah Ibtidaiyah)</option>
                    <option value="SMA">SMA/SMK</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Sekolah:</label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Diponegoro No. 45, Bungah"
                  value={newForm.schoolAddress}
                  onChange={(e) => setNewForm({ ...newForm, schoolAddress: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Porsi yang Dikirim:</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newForm.targetPortions}
                    onChange={(e) => setNewForm({ ...newForm, targetPortions: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dapur SPPG Pengirim:</label>
                  <select
                    value={newForm.sppgUnitId}
                    onChange={(e) => setNewForm({ ...newForm, sppgUnitId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {sppgUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Driver & Armada:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pak Joko Suwarno"
                    value={newForm.driverName}
                    onChange={(e) => setNewForm({ ...newForm, driverName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Plat Kendaraan:</label>
                  <input
                    type="text"
                    placeholder="Contoh: W 1823 BX"
                    value={newForm.vehiclePlate}
                    onChange={(e) => setNewForm({ ...newForm, vehiclePlate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kontak Person Sekolah (Penerima):</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ibu Guru Piket / Kepala Sekolah"
                    value={newForm.contactPerson}
                    onChange={(e) => setNewForm({ ...newForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. HP Penerima:</label>
                  <input
                    type="text"
                    placeholder="Contoh: 0812-3456-7890"
                    value={newForm.contactPhone}
                    onChange={(e) => setNewForm({ ...newForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs"
                >
                  Simpan & Terbitkan Surat Jalan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL PENGIRIMAN & BAST LENGKAP */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  {selectedDelivery.dispatchNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedDelivery.schoolName}</h3>
                <p className="text-xs text-slate-500">{selectedDelivery.schoolAddress}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDelivery(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Progress Bar */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">Status Pengiriman:</span>
                <span className="font-bold text-slate-900">
                  {selectedDelivery.status === 'COMPLETED'
                    ? '✅ Selesai Diterima Lengkap'
                    : selectedDelivery.status === 'IN_TRANSIT'
                    ? '🚚 Sedang Diantar Driver (OTW)'
                    : '📦 Sedang Dipersiapkan di Dapur'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px]">TARGET PORSI:</span>
                  <span className="font-bold text-slate-800">{selectedDelivery.targetPortions} Porsi</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">PORSI TERVERIFIKASI:</span>
                  <span className="font-bold text-emerald-700">
                    {selectedDelivery.deliveredPortions || selectedDelivery.targetPortions} Porsi
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">DRIVER & ARMADA:</span>
                  <span className="font-medium text-slate-800">
                    {selectedDelivery.driverName} ({selectedDelivery.vehiclePlate})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">PENERIMA SEKOLAH:</span>
                  <span className="font-medium text-slate-800">{selectedDelivery.recipientName}</span>
                </div>
              </div>
            </div>

            {/* Menu Rincian */}
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-2">
              <span className="text-[10px] font-bold text-indigo-900 uppercase">Rincian Menu Makan Siang:</span>
              <ul className="space-y-1 text-indigo-950 font-medium">
                <li>• Karbohidrat: {selectedDelivery.menuDetails.carb}</li>
                <li>• Lauk Protein: {selectedDelivery.menuDetails.protein}</li>
                <li>• Sayur Segar: {selectedDelivery.menuDetails.veggie}</li>
                <li>• Buah Segar: {selectedDelivery.menuDetails.fruit}</li>
                <li>• Minuman Sehat: {selectedDelivery.menuDetails.dairy}</li>
              </ul>
            </div>

            {/* Catatan Penanganan Porsi Lebih */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <strong className="block text-amber-950">Catatan Zero Waste / Porsi Lebih:</strong>
              <p>{selectedDelivery.surplusHandling}</p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setPrintDelivery(selectedDelivery);
                  setIsPrintModalOpen(true);
                  setSelectedDelivery(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                Cetak Lembar BAST
              </button>

              <div className="flex items-center gap-2">
                {selectedDelivery.status !== 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedDelivery.id, 'COMPLETED')}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
                  >
                    ✓ Tandai Selesai & Sahkan BAST
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDelivery(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CETAK SURAT JALAN & BAST RESMI SIAP PRINT */}
      {isPrintModalOpen && printDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 my-8 print:m-0 print:p-0 print:shadow-none print:border-none">
            {/* Header Surat Jalan Resmi */}
            <div className="border-b-2 border-slate-900 pb-4 text-center">
              <h2 className="text-xs uppercase font-extrabold tracking-widest text-slate-500">
                BADAN GIZI NASIONAL • SATUAN PELAYANAN PEMENUHAN GIZI (SPPG)
              </h2>
              <h1 className="text-base sm:text-lg font-black text-slate-950 mt-1">
                BERITA ACARA SERAH TERIMA (BAST) & SURAT JALAN PENGIRIMAN MAKANAN
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Nomor Surat: <strong>{printDelivery.bastNumber}</strong> / SJ: <strong>{printDelivery.dispatchNumber}</strong>
              </p>
            </div>

            {/* Detail Informasi */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Dapur SPPG Pengirim:</span>
                <p className="font-bold text-slate-900">{printDelivery.sppgUnitName}</p>
                <p className="text-slate-500">Driver: {printDelivery.driverName}</p>
                <p className="text-slate-500">Armada / Nopol: {printDelivery.vehiclePlate}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Sekolah Sasaran Penerima:</span>
                <p className="font-bold text-slate-900">{printDelivery.schoolName}</p>
                <p className="text-slate-500">Alamat: {printDelivery.schoolAddress}</p>
                <p className="text-slate-500">
                  Penerima: {printDelivery.recipientName} ({printDelivery.contactPhone})
                </p>
              </div>
            </div>

            {/* Tabel Porsi */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Menu Makanan</th>
                    <th className="p-2.5">Rincian Komponen</th>
                    <th className="p-2.5 text-center">Target</th>
                    <th className="p-2.5 text-center">Diterima</th>
                    <th className="p-2.5 text-right">Kondisi / Suhu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-bold text-slate-900 align-top">{printDelivery.menuTitle}</td>
                    <td className="p-2.5 text-slate-600 text-[11px] align-top">
                      • {printDelivery.menuDetails.carb}
                      <br />• {printDelivery.menuDetails.protein}
                      <br />• {printDelivery.menuDetails.veggie}
                      <br />• {printDelivery.menuDetails.fruit}
                      <br />• {printDelivery.menuDetails.dairy}
                    </td>
                    <td className="p-2.5 font-bold text-center align-top">{printDelivery.targetPortions}</td>
                    <td className="p-2.5 font-bold text-emerald-700 text-center align-top">
                      {printDelivery.deliveredPortions || printDelivery.targetPortions}
                    </td>
                    <td className="p-2.5 text-right align-top text-slate-800 font-semibold">
                      {printDelivery.foodTemperature}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Catatan Verifikasi */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Keterangan Khusus / Zero Waste:</span>
              <p className="text-slate-600 italic">{printDelivery.surplusHandling}</p>
            </div>

            {/* Lembar Tanda Tangan */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center text-xs">
              <div className="space-y-12">
                <span className="text-slate-500 font-medium">Petugas Pengantar / Driver:</span>
                <div className="h-10 border-b border-slate-300 font-serif italic text-indigo-700 text-sm">
                  ( {printDelivery.driverName} )
                </div>
                <p className="text-[11px] text-slate-400">Dapur SPPG Pelaksana</p>
              </div>

              <div className="space-y-12">
                <span className="text-slate-500 font-medium">Pihak Sekolah Penerima:</span>
                <div className="h-10 border-b border-slate-300 font-serif italic text-emerald-700 text-sm">
                  ( {printDelivery.recipientName} )
                </div>
                <p className="text-[11px] text-slate-400">Kepala Sekolah / Guru Piket</p>
              </div>
            </div>

            {/* Print Footer Controls */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between print:hidden">
              <span className="text-xs text-slate-400">Gunakan tombol cetak untuk print fisik atau simpan PDF.</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Lembar Resmi Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
