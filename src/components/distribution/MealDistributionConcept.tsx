'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Trash2,
  Box,
  PackageCheck,
  AlertTriangle,
  ArrowUpRight,
  FileBadge,
  CheckSquare,
  PenTool,
  RotateCcw,
  Eraser,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { MealDelivery, MasterIngredient } from '@/lib/types';

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
    isStockDeducted: true,
    deductedItems: [
      { name: 'Beras Super Pulen', quantity: 27, unit: 'Kg' },
      { name: 'Ayam giling', quantity: 27, unit: 'Kg' },
      { name: 'Brokoli Segar', quantity: 22.5, unit: 'Kg' },
      { name: 'Melon Segar', quantity: 22.5, unit: 'Kg' },
      { name: 'Susu UHT Fresh', quantity: 450, unit: 'Pack' },
    ],
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
    isStockDeducted: true,
    deductedItems: [
      { name: 'Beras Super Pulen', quantity: 30, unit: 'Kg' },
      { name: 'Ayam giling', quantity: 30, unit: 'Kg' },
      { name: 'Brokoli Segar', quantity: 25, unit: 'Kg' },
      { name: 'Melon Segar', quantity: 25, unit: 'Kg' },
      { name: 'Susu UHT Fresh', quantity: 500, unit: 'Pack' },
    ],
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
    isStockDeducted: true,
    deductedItems: [
      { name: 'Beras Super Pulen', quantity: 15, unit: 'Kg' },
      { name: 'Ayam giling', quantity: 15, unit: 'Kg' },
      { name: 'Brokoli Segar', quantity: 12.5, unit: 'Kg' },
      { name: 'Melon Segar', quantity: 12.5, unit: 'Kg' },
      { name: 'Susu UHT Fresh', quantity: 250, unit: 'Pack' },
    ],
    notes: 'Driver sedang dalam perjalanan, jarak tempuh ~1.5 km.',
    createdAt: '2026-10-18T11:20:00Z',
  },
];

/**
 * Helper untuk menghitung estimasi bahan gudang dapur MBG berdasarkan gramasi resmi per porsi siswa
 */
function computeMBGDeductionList(targetPortions: number, allIngredients: MasterIngredient[]) {
  const portions = Math.max(1, Number(targetPortions) || 1);

  // Standar Gramasi Bahan Mentah MBG per porsi anak sekolah:
  // 1. Karbohidrat (Beras): ~60 gram beras mentah / porsi -> (portions * 60) / 1000 Kg
  // 2. Protein (Daging Ayam/Sapi): ~60 gram mentah / porsi -> (portions * 60) / 1000 Kg
  // 3. Sayuran (Brokoli/Wortel/Sayur): ~50 gram mentah / porsi -> (portions * 50) / 1000 Kg
  // 4. Buah Segar (Melon/Semangka): ~50 gram / porsi -> (portions * 50) / 1000 Kg
  // 5. Susu UHT / Minuman: 1 pack (kotak/botol) / porsi -> portions Pack

  const specs = [
    {
      category: 'Karbohidrat (Beras)',
      keywords: ['beras', 'nasi'],
      defaultName: 'Beras Super Pulen',
      qtyNeeded: Number(((portions * 60) / 1000).toFixed(1)),
      unit: 'Kg',
    },
    {
      category: 'Protein Hewani (Ayam/Daging)',
      keywords: ['ayam', 'daging', 'telur'],
      defaultName: 'Ayam giling',
      qtyNeeded: Number(((portions * 60) / 1000).toFixed(1)),
      unit: 'Kg',
    },
    {
      category: 'Sayuran (Brokoli/Wortel)',
      keywords: ['brokoli', 'wortel', 'sayur', 'selada'],
      defaultName: 'Brokoli Segar',
      qtyNeeded: Number(((portions * 50) / 1000).toFixed(1)),
      unit: 'Kg',
    },
    {
      category: 'Buah Segar (Melon/Semangka)',
      keywords: ['melon', 'semangka', 'pisang', 'buah'],
      defaultName: 'Melon Segar',
      qtyNeeded: Number(((portions * 50) / 1000).toFixed(1)),
      unit: 'Kg',
    },
    {
      category: 'Minuman Bergizi (Susu UHT)',
      keywords: ['susu', 'uht'],
      defaultName: 'Susu UHT Fresh 125ml',
      qtyNeeded: portions,
      unit: 'Pack',
    },
  ];

  return specs.map((spec) => {
    // Cari kecocokan di database master ingredients
    const matched = allIngredients.find((ing) => {
      const nameLower = ing.name.toLowerCase();
      return spec.keywords.some((k) => nameLower.includes(k));
    });

    const currentStock = matched ? Number(matched.currentStock) || 0 : 50;
    const remainingStock = Math.max(0, currentStock - spec.qtyNeeded);
    const isDeficit = currentStock < spec.qtyNeeded;

    return {
      ingredientId: matched?.id,
      name: matched?.name || spec.defaultName,
      category: spec.category,
      unit: matched?.defaultUnit || spec.unit,
      currentStock,
      quantity: spec.qtyNeeded,
      remainingStock,
      isDeficit,
    };
  });
}

// Komponen Canvas Tanda Tangan Digital Layar Sentuh HP
interface TouchSignaturePadProps {
  value?: string;
  onChange: (dataUrl: string) => void;
  signerName: string;
}

function TouchSignaturePad({ value, onChange, signerName }: TouchSignaturePadProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasSignature, setHasSignature] = React.useState(Boolean(value));

  // Inisialisasi canvas saat load
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = value;
      setHasSignature(true);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  }, [value]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('cancelable' in e && e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e1b4b'; // warna tinta hitam pekat kebiruan
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if ('cancelable' in e && e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange('');
  };

  return (
    <div className="space-y-1.5 p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-200">
      <div className="flex items-center justify-between">
        <label className="block font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
          <PenTool className="w-3.5 h-3.5 text-indigo-600" />
          <span>Tanda Tangan Guru di Layar HP (Tunjukkan ke Guru):</span>
        </label>
        {hasSignature && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-white border border-rose-200 px-2.5 py-0.5 rounded-md transition flex items-center gap-1 shadow-2xs"
          >
            <RotateCcw className="w-3 h-3" />
            Hapus / Ulangi TTD
          </button>
        )}
      </div>

      <div className="relative rounded-xl border-2 border-dashed border-indigo-300 bg-white overflow-hidden shadow-2xs touch-none">
        <canvas
          ref={canvasRef}
          width={450}
          height={150}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-36 cursor-crosshair bg-slate-50/30"
        />

        {/* Garis Dasar Tanda Tangan */}
        <div className="absolute bottom-5 left-5 right-5 border-b border-dashed border-slate-300 pointer-events-none" />

        {/* Helper Watermark Text */}
        {!hasSignature && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 select-none">
            <span className="text-xs font-semibold text-slate-500">
              ✍️ Silakan Bapak/Ibu Guru tanda tangan di sini pakai jari
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              (Otomatis tersimpan & tertera di Lembar BAST resmi SPPG)
            </span>
          </div>
        )}

        {hasSignature && (
          <div className="absolute bottom-1 right-2 text-[10px] font-semibold text-emerald-700 pointer-events-none bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
            ✓ Tanda Tangan Guru Terekam
          </div>
        )}
      </div>
      <p className="text-[10px] text-indigo-800/80">
        💡 Driver cukup memperlihatkan HP ini ke guru penerima di sekolah untuk membubuhkan tanda tangan langsung di layar.
      </p>
    </div>
  );
}

export function MealDistributionConcept() {
  const {
    userRole,
    selectedSppgUnit,
    sppgUnits,
    procurements,
    distributions,
    addDistribution,
    updateDistribution,
    deleteDistribution,
    refreshDistributions,
    ingredients,
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'monitoring' | 'food_costing' | 'pipeline' | 'bast_preview' | 'sop'>('monitoring');

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PREPARING' | 'IN_TRANSIT' | 'ARRIVED' | 'COMPLETED'>('ALL');

  // Modals
  const [selectedDelivery, setSelectedDelivery] = useState<MealDelivery | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDelivery, setPrintDelivery] = useState<MealDelivery | null>(null);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [signingDelivery, setSigningDelivery] = useState<MealDelivery | null>(null);
  const [viewStockItemsModal, setViewStockItemsModal] = useState<any[] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MealDelivery | null>(null);
  const [seedConfirmModal, setSeedConfirmModal] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-App Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Form State untuk Tambah Pengiriman Baru
  const [newForm, setNewForm] = useState({
    schoolName: '',
    schoolAddress: '',
    schoolType: 'SD' as 'SD' | 'SMP' | 'MI' | 'SMA',
    contactPerson: '',
    contactPhone: '',
    targetPortions: 250,
    menuTitle: 'Paket Sehat Ceria (Ayam Teriyaki & Melon Segar)',
    carb: 'Nasi Putih Pulen (150g)',
    protein: 'Ayam Fillet Teriyaki (60g)',
    veggie: 'Tumis Brokoli & Wortel (50g)',
    fruit: 'Melon Potong (1 Potong)',
    dairy: 'Susu UHT 125ml (1 Kotak)',
    driverName: 'Pak Joko Suwarno',
    driverPhone: '0812-9901-2345',
    vehiclePlate: 'W 1823 BX (Pickup Thermal)',
    departureTime: '10:45 WIB',
    estimatedArrival: '11:15 WIB',
    sppgUnitId: (selectedSppgUnit === 'ALL' ? 'SPPG-AA02' : (selectedSppgUnit as string)) as string,
    deductStockNow: true, // Otomatis potong stok gudang
  });

  // Form State untuk Sahkan BAST Kertas & Catat Ompreng Balik
  const [bastForm, setBastForm] = useState({
    recipientName: '',
    recipientNip: '',
    foodTemperature: '64.5°C (Optimal)',
    returnedPortions: 0, // Jumlah ompreng balik / retur
    returnReason: '100% Habis (Tidak Ada Balik)',
    surplusHandling: 'Dibawa kembali ke dapur SPPG (Zero Waste)',
    recipientSignature: '', // Base64 tanda tangan layar sentuh HP
    deliveryPhotoUrl: '',
    notes: 'Tanda tangan digital telah disahkan oleh pihak sekolah melalui HP driver.',
  });

  // Kalkulator Costing State
  const [costingPortions, setCostingPortions] = useState(1200);
  const [costingBudget, setCostingBudget] = useState(18000000); // Rp 18.000.000 (Rp 15.000 / porsi)
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // Ambil data pengiriman riil dari database PostgreSQL saat load
  useEffect(() => {
    refreshDistributions().finally(() => setIsDbLoaded(true));
  }, [refreshDistributions]);

  // Gabungkan list data: gunakan data database riil saat sudah ter-load
  const activeDeliveriesList: MealDelivery[] = useMemo(() => {
    if (isDbLoaded) {
      return distributions;
    }
    return distributions && distributions.length > 0 ? distributions : INITIAL_DELIVERIES;
  }, [distributions, isDbLoaded]);

  // Hitung estimasi bahan yang akan dipotong untuk form penambahan
  const estimatedDeductions = useMemo(() => {
    return computeMBGDeductionList(newForm.targetPortions, ingredients);
  }, [newForm.targetPortions, ingredients]);

  // Proteksi Role Superadmin
  if (userRole === 'EXECUTIVE_AUDITOR') {
    return (
      <div className="bg-white rounded-xl border border-rose-200 p-8 text-center max-w-lg mx-auto shadow-sm my-12">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <BadgeAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Akses Dibatasi (Mode Pemantau / Auditor)</h3>
        <p className="text-xs text-slate-500 mt-2">
          Menu Distribusi Porsi Makanan hanya dapat diakses oleh Superadmin. Tampilan Auditor difokuskan khusus pada pengawasan anggaran dan belanja.
        </p>
      </div>
    );
  }

  const activeUnitName =
    selectedSppgUnit === 'ALL'
      ? 'Semua Unit Dapur SPPG'
      : sppgUnits.find((u) => u.id === selectedSppgUnit)?.name || 'Dapur SPPG';

  // Filter Deliveries
  const filteredDeliveries = activeDeliveriesList.filter((d) => {
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
  const totalTargetPortions = filteredDeliveries.reduce((acc, d) => acc + (d.targetPortions || 0), 0);
  const totalDeliveredPortions = filteredDeliveries.reduce((acc, d) => acc + (d.deliveredPortions || 0), 0);
  const totalCompletedSchools = filteredDeliveries.filter((d) => d.status === 'COMPLETED').length;
  const totalTransitSchools = filteredDeliveries.filter((d) => d.status === 'IN_TRANSIT').length;

  // Handle Tambah Pengiriman Baru ke Database PostgreSQL
  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.schoolName.trim()) {
      showToast('Nama sekolah penerima wajib diisi', 'error');
      return;
    }

    const unitObj = sppgUnits.find((u) => u.id === newForm.sppgUnitId);
    const unitName = unitObj?.name || 'SPPG ABAR ABIR 02';
    const timestamp = Date.now().toString().slice(-4);
    const pad = String(activeDeliveriesList.length + 1).padStart(2, '0');

    setIsSubmitting(true);
    try {
      const payload = {
        dispatchNumber: `SJ-SPPG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${pad}`,
        sppgUnitId: newForm.sppgUnitId,
        sppgUnitName: unitName,
        schoolName: newForm.schoolName.trim(),
        schoolAddress: newForm.schoolAddress.trim() || 'Kecamatan Manyar / Bungah',
        schoolType: newForm.schoolType,
        contactPerson: newForm.contactPerson.trim() || 'Pihak Sekolah',
        contactPhone: newForm.contactPhone.trim() || '0812-xxxx-xxxx',
        menuCode: `MENU-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-SIANG`,
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
        surplusHandling: 'Porsi lebih dialokasikan untuk guru pendamping dan piket dengan verifikasi',
        status: 'PREPARING',
        departureTime: newForm.departureTime,
        estimatedArrival: newForm.estimatedArrival,
        driverName: newForm.driverName,
        driverPhone: newForm.driverPhone,
        vehiclePlate: newForm.vehiclePlate,
        foodTemperature: '64.5°C (Thermal Box)',
        foodSafetyWindow: 'Batas Konsumsi: 13:30 WIB (Maksimal 4 Jam)',
        recipientName: newForm.contactPerson || 'Kepala Sekolah / Guru Piket',
        bastNumber: `BAST-MBG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${pad}`,
        isSigned: false,
        notes: 'Surat jalan diterbitkan resmi oleh Superadmin Logistik.',
        deductStockNow: newForm.deductStockNow,
        deductedItems: newForm.deductStockNow
          ? estimatedDeductions.map((item) => ({
              ingredientId: item.ingredientId,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
            }))
          : [],
      };

      const res = await addDistribution(payload);
      if (res && !res.ok) {
        showToast('Gagal menyimpan pengiriman: ' + (res.error || 'Terjadi kendala pada server'), 'error');
        return;
      }

      showToast('Surat jalan berhasil diterbitkan & stok bahan otomatis terpotong!', 'success');
      setIsAddModalOpen(false);
      // Reset Form
      setNewForm({
        schoolName: '',
        schoolAddress: '',
        schoolType: 'SD',
        contactPerson: '',
        contactPhone: '',
        targetPortions: 250,
        menuTitle: 'Paket Sehat Ceria (Ayam Teriyaki & Melon Segar)',
        carb: 'Nasi Putih Pulen (150g)',
        protein: 'Ayam Fillet Teriyaki (60g)',
        veggie: 'Tumis Brokoli & Wortel (50g)',
        fruit: 'Melon Potong (1 Potong)',
        dairy: 'Susu UHT 125ml (1 Kotak)',
        driverName: 'Pak Joko Suwarno',
        driverPhone: '0812-9901-2345',
        vehiclePlate: 'W 1823 BX (Pickup Thermal)',
        departureTime: '10:45 WIB',
        estimatedArrival: '11:15 WIB',
        sppgUnitId: (selectedSppgUnit === 'ALL' ? 'SPPG-AA02' : (selectedSppgUnit as string)) as string,
        deductStockNow: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Status Cepat (Kirim Driver / Tiba)
  const handleUpdateStatus = async (id: string, nextStatus: MealDelivery['status']) => {
    const target = activeDeliveriesList.find((d) => d.id === id);
    if (!target) return;

    const updates: any = { status: nextStatus };
    if (nextStatus === 'IN_TRANSIT') {
      updates.departureTime = `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')} WIB`;
    } else if (nextStatus === 'ARRIVED') {
      updates.actualArrival = `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')} WIB`;
    }

    await updateDistribution(id, updates);
    if (selectedDelivery && selectedDelivery.id === id) {
      setSelectedDelivery((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  // Buka Modal Pengesahan BAST Fisik & Catat Ompreng Balik
  const handleOpenSigningModal = (delivery: MealDelivery) => {
    setSigningDelivery(delivery);
    const returned = delivery.absentStudents || 0;
    const parts = (delivery.surplusHandling || '').split(' - ');
    setBastForm({
      recipientName: delivery.recipientName || delivery.contactPerson || 'Kepala Sekolah / Guru Piket',
      recipientNip: delivery.recipientNip || '',
      foodTemperature: delivery.foodTemperature || '64.5°C (Optimal)',
      returnedPortions: returned,
      returnReason: returned > 0 ? (parts[0] || 'Siswa Sakit / Tidak Masuk') : '100% Habis (Tidak Ada Balik)',
      surplusHandling: parts[1] || 'Dibawa kembali ke dapur SPPG (Zero Waste)',
      recipientSignature: delivery.recipientSignature || '',
      deliveryPhotoUrl: delivery.deliveryPhotoUrl || '',
      notes: delivery.notes || 'Tanda tangan digital telah disahkan oleh pihak sekolah melalui HP driver.',
    });
    setIsSigningModalOpen(true);
  };

  // Upload Foto Lembar Kertas Bertanda Tangan Basah
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBastForm((prev) => ({ ...prev, deliveryPhotoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Submit Pengesahan BAST
  const handleConfirmBAST = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signingDelivery) return;

    setIsSubmitting(true);
    try {
      const target = signingDelivery.targetPortions;
      const returned = Math.max(0, Number(bastForm.returnedPortions) || 0);
      const netEaten = Math.max(0, target - returned);

      const surplusText =
        returned > 0
          ? `${bastForm.returnReason} - ${bastForm.surplusHandling}`
          : 'Semua ompreng habis termakan siswa 100%';

      const updates = {
        status: 'COMPLETED' as const,
        isSigned: true,
        recipientName: bastForm.recipientName.trim() || 'Pihak Sekolah',
        recipientNip: bastForm.recipientNip.trim() || undefined,
        foodTemperature: bastForm.foodTemperature.trim(),
        deliveredPortions: netEaten,
        absentStudents: returned,
        surplusHandling: surplusText,
        recipientSignature: bastForm.recipientSignature || undefined,
        deliveryPhotoUrl: bastForm.deliveryPhotoUrl || undefined,
        notes: bastForm.notes.trim(),
        actualArrival:
          signingDelivery.actualArrival ||
          `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')} WIB`,
      };

      const res = await updateDistribution(signingDelivery.id, updates);
      if (res && !res.ok) {
        showToast('Gagal mengesahkan BAST: ' + (res.error || 'Terjadi kendala pada server'), 'error');
        return;
      }

      showToast(`BAST ${signingDelivery.schoolName} resmi disahkan & tanda tangan tersimpan!`, 'success');
      setIsSigningModalOpen(false);
      setSigningDelivery(null);
      if (selectedDelivery && selectedDelivery.id === signingDelivery.id) {
        setSelectedDelivery((prev) => (prev ? { ...prev, ...updates } : null));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eksekusi Hapus Pengiriman dari Custom In-App Modal
  const confirmExecuteDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const wasDeducted = deleteTarget.isStockDeducted;
      const schoolName = deleteTarget.schoolName;
      const res = await deleteDistribution(deleteTarget.id);
      if (res && !res.ok) {
        showToast('Gagal menghapus pengiriman: ' + (res.error || 'Terjadi kendala server'), 'error');
        return;
      }
      if (selectedDelivery?.id === deleteTarget.id) setSelectedDelivery(null);
      setDeleteTarget(null);
      showToast(
        wasDeducted
          ? `Surat jalan ${schoolName} dihapus & stok bahan otomatis dikembalikan (restore) ke gudang!`
          : `Surat jalan ${schoolName} berhasil dihapus.`,
        'success'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eksekusi Simpan Contoh Data ke PostgreSQL dari Custom In-App Modal
  const confirmExecuteSeed = async () => {
    setIsSubmitting(true);
    try {
      for (const item of INITIAL_DELIVERIES) {
        await addDistribution({
          ...item,
          deductStockNow: false, // jangan dobel potong stok untuk seed awal
        });
      }
      await refreshDistributions();
      setSeedConfirmModal(false);
      showToast('Berhasil menyimpan 3 contoh data distribusi ke database PostgreSQL!', 'success');
    } catch (err: any) {
      showToast('Gagal menyimpan ke database: ' + err?.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kalkulasi Food Costing Tab 2
  const costPerPortion = costingPortions > 0 ? Math.round(costingBudget / costingPortions) : 0;

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
              Modul cerdas hilir Program Makan Bergizi Gratis (MBG): Menjadwalkan pengiriman armada dapur, otomatis memotong stok bahan mentah gudang, melacak status tiba di sekolah secara real-time, menerbitkan Surat Jalan & BAST resmi, serta menghitung HPP per porsi siswa.
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
            {distributions.length === 0 && (
              <button
                onClick={() => setSeedConfirmModal(true)}
                type="button"
                disabled={isSubmitting}
                title="Sinkronkan contoh data awal ke PostgreSQL"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-indigo-200 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                Simpan ke Database
              </button>
            )}
          </div>
        </div>

        {/* Highlight Note */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-start gap-3 text-xs text-indigo-200/90 bg-indigo-950/40 p-3 rounded-xl border border-indigo-800/40">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Ekosistem Terintegrasi:</strong> Setiap kali Anda membuat pengiriman baru, sistem secara cerdas menghitung kebutuhan gramasi beras, daging ayam, sayuran, buah, dan susu, lalu otomatis mengurangi stok gudang dapur (Stok KELUAR) di Menu 4 (Stok Bahan) dengan audit trail lengkap!
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
              <div className="text-[11px] text-slate-500 mt-1">Total di {filteredDeliveries.length} sekolah sasaran</div>
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
              <div className="text-[11px] text-emerald-700 font-medium mt-1">{totalCompletedSchools} Sekolah Telah BAST</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Dalam Perjalanan Kurir</span>
                <Truck className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {Math.max(0, totalTargetPortions - totalDeliveredPortions).toLocaleString('id-ID')}{' '}
                <span className="text-xs font-normal text-slate-500">Porsi</span>
              </p>
              <div className="text-[11px] text-amber-700 font-medium mt-1">
                {totalTransitSchools > 0 ? `${totalTransitSchools} Armada OTW` : 'Semua Tiba'}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Keamanan Pangan (Suhu)</span>
                <ThermometerSun className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                64.5°C <span className="text-xs font-normal text-emerald-600 font-medium">Hangat Optimal</span>
              </p>
              <div className="text-[11px] text-slate-500 mt-1">Standar BGN: &gt; 60°C saat diterima</div>
            </div>
          </div>

          {/* Filter Toolbar & Search */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari sekolah, no. surat jalan, driver..."
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
                  Semua ({activeDeliveriesList.length})
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
              const isArrived = delivery.status === 'ARRIVED';

              return (
                <div
                  key={delivery.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {delivery.dispatchNumber}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isInTransit
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            : isArrived
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                        {isInTransit && <Truck className="w-3 h-3" />}
                        {isArrived && <MapPin className="w-3 h-3" />}
                        {isPreparing && <Clock className="w-3 h-3" />}
                        {isCompleted
                          ? 'SELESAI (BAST SAH)'
                          : isInTransit
                          ? 'SEDANG DIKIRIM (OTW)'
                          : isArrived
                          ? 'TIBA DI SEKOLAH'
                          : 'SEDANG PACKING'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{delivery.schoolName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {delivery.schoolAddress}
                    </p>

                    {/* Progress Porsi & Info Ompreng Balik */}
                    <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">Realisasi Porsi:</span>
                        <span className="font-bold text-slate-800">
                          {delivery.deliveredPortions || (isCompleted ? delivery.targetPortions : 0)} / {delivery.targetPortions} Porsi
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{
                            width: `${
                              (((delivery.deliveredPortions || (isCompleted ? delivery.targetPortions : 0)) /
                                (delivery.targetPortions || 1)) *
                                100)
                            }%`,
                          }}
                        />
                      </div>

                      {/* Detail Ompreng Balik Bila Ada */}
                      {delivery.absentStudents > 0 ? (
                        <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            ↩️ {delivery.absentStudents} Ompreng Balik
                          </span>
                          <span className="text-slate-500 text-[10px] truncate max-w-[150px]" title={delivery.surplusHandling}>
                            {delivery.surplusHandling?.split(' - ')[0] || 'Siswa tidak makan'}
                          </span>
                        </div>
                      ) : isCompleted ? (
                        <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-emerald-700 text-[10px]">
                            ✓ 100% Habis Termakan Siswa
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Card Body Information */}
                  <div className="p-5 space-y-2.5 text-xs text-slate-600 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Driver & Armada:</span>
                      <span className="font-medium text-slate-800 text-right">{delivery.driverName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Plat Kendaraan:</span>
                      <span className="font-mono text-slate-700">{delivery.vehiclePlate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Jam Pengantaran:</span>
                      <span className="font-medium text-slate-800">
                        {delivery.departureTime} &rarr; {delivery.actualArrival || delivery.estimatedArrival}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Penerima Sekolah:</span>
                      <span className="font-medium text-slate-800">{delivery.recipientName || delivery.contactPerson}</span>
                    </div>

                    {/* Foto Bukti Kertas TTD & Tanda Tangan Digital & Badge Pemotongan Stok */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
                      {delivery.recipientSignature ? (
                        <button
                          type="button"
                          onClick={() => setPreviewPhotoUrl(delivery.recipientSignature || null)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition"
                          title="Lihat Tanda Tangan Digital Layar HP"
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                          TTD HP Sah
                        </button>
                      ) : delivery.deliveryPhotoUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewPhotoUrl(delivery.deliveryPhotoUrl || null)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md hover:bg-indigo-100 transition"
                          title="Lihat Foto Kertas TTD Fisik"
                        >
                          <Camera className="w-3.5 h-3.5 text-indigo-600" />
                          Foto Kertas TTD
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Belum Ada TTD</span>
                      )}

                      {delivery.isStockDeducted ? (
                        <button
                          type="button"
                          onClick={() => setViewStockItemsModal(delivery.deductedItems || [])}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition"
                        >
                          <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Stok Terpotong
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Belum Dipotong</span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedDelivery(delivery)}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition"
                        title="Lihat Detail Lengkap"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPrintDelivery(delivery);
                          setIsPrintModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100 transition"
                        title="Cetak Surat Jalan & BAST"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(delivery)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 transition"
                        title="Hapus Pengiriman (Restore Stok)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isPreparing && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(delivery.id, 'IN_TRANSIT')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition flex items-center gap-1 shadow-2xs"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Kirim Armada
                        </button>
                      )}

                      {isInTransit && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(delivery.id, 'ARRIVED')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1 shadow-2xs"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Tiba di Sekolah
                        </button>
                      )}

                      {(isArrived || isInTransit) && (
                        <button
                          type="button"
                          onClick={() => handleOpenSigningModal(delivery)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Sahkan BAST
                        </button>
                      )}

                      {isCompleted && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Selesai
                        </span>
                      )}
                    </div>
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
              Simulasi perhitungan otomatis yang menghubungkan total biaya belanja dapur dengan jumlah porsi siswa yang dihasilkan. Menghitung Harga Pokok Porsi (HPP) serta proporsi gramasi bahan makanan per piring siswa.
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
                Contoh: Rp 18.000.000 (total belanja bahan)
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
              <span className="text-[11px] text-slate-400 mt-1 block">Total porsi siswa sasaran</span>
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
                <div className="text-[11px] text-slate-500">
                  Kebutuhan Beras: {((costingPortions * 60) / 1000).toFixed(0)} Kg / {costingPortions} Porsi
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-rose-600 uppercase">Protein Hewani</span>
                <h4 className="text-xs font-bold text-slate-800">Ayam Fillet Teriyaki</h4>
                <p className="text-base font-bold text-slate-900">~60-70 Gram</p>
                <div className="text-[11px] text-slate-500">
                  Kebutuhan Ayam: {((costingPortions * 60) / 1000).toFixed(0)} Kg / {costingPortions} Porsi
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Sayur & Serat</span>
                <h4 className="text-xs font-bold text-slate-800">Tumis Brokoli Wortel</h4>
                <p className="text-base font-bold text-slate-900">~50 Gram</p>
                <div className="text-[11px] text-slate-500">
                  Kebutuhan Sayur: {((costingPortions * 50) / 1000).toFixed(0)} Kg / {costingPortions} Porsi
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 uppercase">Buah Segar</span>
                <h4 className="text-xs font-bold text-slate-800">Melon Potong</h4>
                <p className="text-base font-bold text-slate-900">~1 Potong (80g)</p>
                <div className="text-[11px] text-slate-500">
                  Kebutuhan Buah: {((costingPortions * 50) / 1000).toFixed(0)} Kg / {costingPortions} Porsi
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase">Susu Sehat</span>
                <h4 className="text-xs font-bold text-slate-800">Susu UHT Fresh</h4>
                <p className="text-base font-bold text-slate-900">125 ml</p>
                <div className="text-[11px] text-slate-500">Kebutuhan Susu: {costingPortions} Kotak</div>
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
                  Total Energi: <strong>~635 Kkal</strong> | Protein: <strong>~23.5 g</strong> | Karbohidrat: <strong>~82 g</strong> | Lemak Sehat: <strong>~14 g</strong>
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0">
              ✓ 100% Memenuhi Standar Gizi Anak Sekolah BGN
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
                Pilih surat jalan / BAST untuk dicetak atau diekspor ke PDF dengan format kop resmi BGN SPPG
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {activeDeliveriesList.map((del) => (
              <div
                key={del.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition"
              >
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
                    {del.deliveredPortions || del.targetPortions} Porsi • Driver: {del.driverName} ({del.vehiclePlate}) • Penerima: {del.recipientName || del.contactPerson}
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
                    Bahan mentah masuk gudang dapur, otomatis berkurang saat jadwal distribusi diproses.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-800 font-medium">
                  ✓ Menu Stok Bahan (Otomatis KELUAR)
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
                sejak selesai dimasak oleh juru masak di dapur. Makanan yang melebihi batas 4 jam wajib diuji ulang sebelum dibagikan.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
                <ThermometerSun className="w-4 h-4" />
                <span>2. Suhu Kontrol Penyimpanan & Transport</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Makanan panas (nasi, lauk berkuah/tumis) wajib disimpan di wadah insulated thermal box agar suhu terjaga di atas <strong>60°C</strong>. Buah segar dan susu disimpan di chiller box terpisah (&lt; 10°C).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>3. Food Sample Archiving (Sampel Uji)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dapur SPPG wajib menyisihkan 1 porsi sampel dari setiap menu harian ke dalam wadah steril dan disimpan di lemari pendingin selama 2 x 24 jam untuk keperluan uji laboratorium bila sewaktu-waktu terjadi audit kesehatan.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
                <FileCheck2 className="w-4 h-4" />
                <span>4. Penanganan Porsi Berlebih (Surplus Handling)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bila ada siswa yang sakit/absen, sisa porsi yang masih higienis dan belum dibuka dapat dibagikan kepada tenaga pendidik atau siswa lain yang membutuhkan dengan persetujuan Kepala Sekolah dan dicatat di form BAST.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: TAMBAH SURAT JALAN BARU & AUTO-POTONG STOK */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
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
                    onChange={(e) => setNewForm({ ...newForm, targetPortions: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 font-bold"
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

              {/* Rincian Menu MBG */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-800 block text-xs">Komponen Menu MBG Yang Dimasak:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Nama Paket Menu:</span>
                    <input
                      type="text"
                      value={newForm.menuTitle}
                      onChange={(e) => setNewForm({ ...newForm, menuTitle: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block">Karbohidrat:</span>
                    <input
                      type="text"
                      value={newForm.carb}
                      onChange={(e) => setNewForm({ ...newForm, carb: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block">Lauk Protein:</span>
                    <input
                      type="text"
                      value={newForm.protein}
                      onChange={(e) => setNewForm({ ...newForm, protein: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sayur Segar:</span>
                    <input
                      type="text"
                      value={newForm.veggie}
                      onChange={(e) => setNewForm({ ...newForm, veggie: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block">Buah Segar:</span>
                    <input
                      type="text"
                      value={newForm.fruit}
                      onChange={(e) => setNewForm({ ...newForm, fruit: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block">Susu / Minuman:</span>
                    <input
                      type="text"
                      value={newForm.dairy}
                      onChange={(e) => setNewForm({ ...newForm, dairy: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* CARD PREVIEW ESTIMASI PEMOTONGAN STOK GUDANG DAPUR */}
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-indigo-700" />
                    <span className="font-bold text-indigo-950 text-xs">
                      Estimasi Pengurangan Stok Gudang Dapur ({newForm.targetPortions} Porsi)
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-indigo-900">
                    <input
                      type="checkbox"
                      checked={newForm.deductStockNow}
                      onChange={(e) => setNewForm({ ...newForm, deductStockNow: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Otomatis Potong Stok (KELUAR)</span>
                  </label>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-indigo-100/70 text-indigo-950 font-semibold border-b border-indigo-200">
                      <tr>
                        <th className="py-1.5 px-2">Kategori Bahan</th>
                        <th className="py-1.5 px-2">Bahan di Gudang</th>
                        <th className="py-1.5 px-2 text-right">Stok Gudang</th>
                        <th className="py-1.5 px-2 text-right">Jumlah Keluar</th>
                        <th className="py-1.5 px-2 text-right">Sisa Stok</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-100 bg-white/70">
                      {estimatedDeductions.map((item, idx) => (
                        <tr key={idx} className="hover:bg-indigo-50/50">
                          <td className="py-1.5 px-2 text-slate-500">{item.category}</td>
                          <td className="py-1.5 px-2 font-semibold text-slate-800">{item.name}</td>
                          <td className="py-1.5 px-2 text-right text-slate-600">
                            {item.currentStock} {item.unit}
                          </td>
                          <td className="py-1.5 px-2 text-right font-bold text-rose-600">
                            -{item.quantity} {item.unit}
                          </td>
                          <td className="py-1.5 px-2 text-right font-semibold text-emerald-700">
                            {item.remainingStock} {item.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[10px] text-indigo-800/80">
                  ⚡ Saat Anda menyimpan surat jalan ini, sistem akan otomatis mencatat riwayat mutasi stok keluar (type: KELUAR) di Menu 4 (Stok Bahan) dengan nomor referensi surat jalan.
                </p>
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
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs flex items-center gap-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Simpan & Terbitkan Surat Jalan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SAHKAN BAST KERTAS & CATAT OMPRENG BALIK (REALITAS LAPANGAN) */}
      {isSigningModalOpen && signingDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  {signingDelivery.bastNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Catat Realisasi Serah Terima & Ompreng Balik</h3>
                <p className="text-xs text-slate-500">Konfirmasi tanda tangan kertas BAST & sisa porsi di {signingDelivery.schoolName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSigningModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBAST} className="space-y-4 text-xs">
              {/* KALKULATOR OMPRENG BALIK OTOMATIS */}
              <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">1. Ompreng Dikirim</span>
                  <span className="text-base font-extrabold text-indigo-700">{signingDelivery.targetPortions}</span>
                  <span className="text-[10px] text-slate-500 block">Porsi</span>
                </div>

                <div className="bg-rose-50/70 p-2.5 rounded-lg border border-rose-200">
                  <label htmlFor="returnedPortionsInput" className="text-[10px] font-bold text-rose-700 block uppercase cursor-pointer">
                    2. Ompreng Balik
                  </label>
                  <input
                    id="returnedPortionsInput"
                    type="number"
                    min="0"
                    max={signingDelivery.targetPortions}
                    value={bastForm.returnedPortions}
                    onChange={(e) => setBastForm({ ...bastForm, returnedPortions: Number(e.target.value) || 0 })}
                    className="w-full text-center text-base font-black text-rose-700 bg-white border border-rose-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-rose-500 mt-0.5"
                  />
                  <span className="text-[10px] text-rose-600 block">Tidak Termakan</span>
                </div>

                <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 block uppercase">3. Dimakan Siswa</span>
                  <span className="text-base font-black text-emerald-700">
                    {Math.max(0, signingDelivery.targetPortions - bastForm.returnedPortions)}
                  </span>
                  <span className="text-[10px] text-emerald-600 block">Realisasi Bersih</span>
                </div>
              </div>

              {/* PILIHAN CEPAT ALASAN OMPRENG BALIK */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">Alasan Ompreng Balik / Kondisi di Lapangan:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '100% Habis (Tidak Ada Balik)',
                    'Siswa Sakit / Tidak Masuk',
                    'Siswa Kenyang / Tidak Mau Makan',
                    'Kelebihan Kirim dari Dapur',
                  ].map((reason) => {
                    const isSelected = bastForm.returnReason === reason;
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => {
                          setBastForm({
                            ...bastForm,
                            returnReason: reason,
                            returnedPortions: reason === '100% Habis (Tidak Ada Balik)' ? 0 : bastForm.returnedPortions || 5,
                          });
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {reason}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PENANGANAN OMPRENG BALIK (BILA ADA BALIK > 0) */}
              {bastForm.returnedPortions > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <span className="font-bold text-amber-950 block text-[11px]">
                    Penanganan {bastForm.returnedPortions} Ompreng Balik (Zero Waste):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Dibawa kembali ke dapur SPPG (Zero Waste)',
                      'Dialihkan ke Guru Piket / Warga Sekitar',
                      'Disalurkan ke Panti Asuhan / Yayasan',
                    ].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setBastForm({ ...bastForm, surplusHandling: opt })}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition ${
                          bastForm.surplusHandling === opt
                            ? 'bg-amber-700 text-white border-amber-700'
                            : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* DATA GURU PENERIMA YANG TTD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Guru / Kepala Sekolah (Penerima):</label>
                  <input
                    type="text"
                    required
                    value={bastForm.recipientName}
                    onChange={(e) => setBastForm({ ...bastForm, recipientName: e.target.value })}
                    placeholder="Contoh: Ibu Ratna, S.Pd"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP Guru (Opsional):</label>
                  <input
                    type="text"
                    value={bastForm.recipientNip}
                    onChange={(e) => setBastForm({ ...bastForm, recipientNip: e.target.value })}
                    placeholder="Contoh: 19820412 200801 2 009"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* TANDA TANGAN DIGITAL GURU LEWAT LAYAR HP DENGAN JARI */}
              <TouchSignaturePad
                value={bastForm.recipientSignature}
                onChange={(sig) => setBastForm({ ...bastForm, recipientSignature: sig })}
                signerName={bastForm.recipientName || 'Bapak/Ibu Guru'}
              />

              {/* UPLOAD FOTO DOKUMENTASI FISIK (OPSIONAL TAMBAHAN) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-slate-700 text-[11px]">Foto Dokumentasi / Kertas BAST (Opsional Tambahan)</span>
                  </div>
                  {bastForm.deliveryPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setBastForm({ ...bastForm, deliveryPhotoUrl: '' })}
                      className="text-[10px] text-rose-600 font-bold hover:underline"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>

                {bastForm.deliveryPhotoUrl ? (
                  <div className="relative w-full h-28 rounded-lg overflow-hidden border border-slate-200">
                    <img
                      src={bastForm.deliveryPhotoUrl}
                      alt="Foto Lembar BAST"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <Camera className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 font-medium text-[11px]">Ambil Foto Penyerahan Makanan</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSigningModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center gap-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <CheckCircle2 className="w-4 h-4" />
                  Simpan Realisasi & Sahkan BAST
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DETAIL LENGKAP PENGIRIMAN */}
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
                    ? '✅ Selesai Diterima Lengkap (BAST Sah)'
                    : selectedDelivery.status === 'IN_TRANSIT'
                    ? '🚚 Sedang Diantar Driver (OTW)'
                    : selectedDelivery.status === 'ARRIVED'
                    ? '📍 Armada Telah Tiba di Sekolah'
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
                  <span className="font-medium text-slate-800">{selectedDelivery.recipientName || selectedDelivery.contactPerson}</span>
                </div>
              </div>
            </div>

            {/* Menu Rincian */}
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-2">
              <span className="text-[10px] font-bold text-indigo-900 uppercase">Rincian Menu Makan Siang:</span>
              <ul className="space-y-1 text-indigo-950 font-medium">
                <li>• Karbohidrat: {selectedDelivery.menuDetails?.carb || 'Nasi Putih'}</li>
                <li>• Lauk Protein: {selectedDelivery.menuDetails?.protein || 'Ayam Teriyaki'}</li>
                <li>• Sayur Segar: {selectedDelivery.menuDetails?.veggie || 'Tumis Brokoli Wortel'}</li>
                <li>• Buah Segar: {selectedDelivery.menuDetails?.fruit || 'Melon Potong'}</li>
                <li>• Minuman Sehat: {selectedDelivery.menuDetails?.dairy || 'Susu UHT'}</li>
              </ul>
            </div>

            {/* Catatan Penanganan Porsi Lebih */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <strong className="block text-amber-950">Catatan Zero Waste / Porsi Lebih:</strong>
              <p>{selectedDelivery.surplusHandling || 'Sesuai kesepakatan'}</p>
            </div>

            {/* Tanda Tangan Guru yang Tersimpan */}
            {selectedDelivery.recipientSignature && (
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                  Tanda Tangan Digital Pihak Sekolah (Layar HP):
                </span>
                <div className="flex items-center justify-between">
                  <div className="h-14 w-44 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center">
                    <img
                      src={selectedDelivery.recipientSignature}
                      alt="Tanda Tangan Guru"
                      className="max-h-12 max-w-full object-contain"
                    />
                  </div>
                  <div className="text-right text-[11px]">
                    <span className="font-bold text-slate-900 block">{selectedDelivery.recipientName}</span>
                    <span className="text-emerald-700 font-medium text-[10px]">✓ Terverifikasi via Layar HP Driver</span>
                  </div>
                </div>
              </div>
            )}

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
                    onClick={() => {
                      handleOpenSigningModal(selectedDelivery);
                      setSelectedDelivery(null);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Sahkan BAST
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

      {/* MODAL 4: LIHAT DETAIL BAHAN YANG TELAH DIPOTONG */}
      {viewStockItemsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  Rincian Bahan Gudang Yang Terpotong
                </h3>
                <p className="text-[11px] text-slate-500">Bahan yang telah dikeluarkan dari gudang dapur SPPG</p>
              </div>
              <button
                type="button"
                onClick={() => setViewStockItemsModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {viewStockItemsModal.length > 0 ? (
                viewStockItemsModal.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 block">{item.name}</span>
                      <span className="text-[10px] text-slate-400">Tercatat di Kartu Stok Gudang</span>
                    </div>
                    <span className="font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                      -{item.quantity} {item.unit}
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-slate-400 text-xs">Belum ada rincian bahan yang dipotong.</p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewStockItemsModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CETAK SURAT JALAN & BAST RESMI SIAP PRINT */}
      {isPrintModalOpen && printDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 my-8 print:m-0 print:p-0 print:shadow-none print:border-none print:max-w-none print:w-full">
            {/* Header Surat Jalan Resmi */}
            <div className="border-b-2 border-slate-900 pb-4 text-center">
              <h2 className="text-[11px] uppercase font-extrabold tracking-widest text-slate-600">
                BADAN GIZI NASIONAL (BGN) REPUBLIK INDONESIA
              </h2>
              <h3 className="text-xs uppercase font-bold text-slate-500">
                SATUAN PELAYANAN PEMENUHAN GIZI (SPPG) • KABUPATEN GRESIK
              </h3>
              <h1 className="text-base sm:text-lg font-black text-slate-950 mt-1">
                BERITA ACARA SERAH TERIMA (BAST) & SURAT JALAN DISTRIBUSI MBG
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                No. BAST: <strong>{printDelivery.bastNumber}</strong> | No. Surat Jalan: <strong>{printDelivery.dispatchNumber}</strong>
              </p>
            </div>

            {/* Detail Informasi Dua Pihak */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">PIHAK PERTAMA (PENGIRIM):</span>
                <p className="font-bold text-slate-900">{printDelivery.sppgUnitName}</p>
                <p className="text-slate-600">Pengemudi: {printDelivery.driverName}</p>
                <p className="text-slate-600">Armada / Nopol: {printDelivery.vehiclePlate}</p>
                <p className="text-slate-600">Waktu Berangkat: {printDelivery.departureTime}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold">PIHAK KEDUA (PENERIMA):</span>
                <p className="font-bold text-slate-900">{printDelivery.schoolName}</p>
                <p className="text-slate-600">Alamat: {printDelivery.schoolAddress}</p>
                <p className="text-slate-600">
                  Petugas Penerima: {printDelivery.recipientName || printDelivery.contactPerson} ({printDelivery.contactPhone})
                </p>
                {printDelivery.recipientNip && (
                  <p className="text-slate-600">NIP: {printDelivery.recipientNip}</p>
                )}
                <p className="text-slate-600">Waktu Tiba: {printDelivery.actualArrival || printDelivery.estimatedArrival}</p>
              </div>
            </div>

            {/* Tabel Porsi */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Menu Makanan</th>
                    <th className="p-2.5">Rincian Komponen 5 Pilar MBG</th>
                    <th className="p-2.5 text-center">Target Porsi</th>
                    <th className="p-2.5 text-center">Porsi Diterima</th>
                    <th className="p-2.5 text-right">QC Suhu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-bold text-slate-900 align-top">{printDelivery.menuTitle}</td>
                    <td className="p-2.5 text-slate-600 text-[11px] align-top">
                      • {printDelivery.menuDetails?.carb || 'Nasi Putih Pulen'}
                      <br />• {printDelivery.menuDetails?.protein || 'Ayam Fillet Teriyaki'}
                      <br />• {printDelivery.menuDetails?.veggie || 'Tumis Sayur Segar'}
                      <br />• {printDelivery.menuDetails?.fruit || 'Melon Potong'}
                      <br />• {printDelivery.menuDetails?.dairy || 'Susu UHT Segar'}
                    </td>
                    <td className="p-2.5 font-bold text-center align-top">{printDelivery.targetPortions}</td>
                    <td className="p-2.5 font-bold text-emerald-700 text-center align-top">
                      {printDelivery.deliveredPortions || printDelivery.targetPortions}
                    </td>
                    <td className="p-2.5 text-right align-top text-slate-800 font-semibold">
                      {printDelivery.foodTemperature || '64.5°C'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Formulir Catatan Fisik Lapangan & Retur Ompreng (Diisi Pena oleh Pihak Sekolah) */}
            <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/70 text-xs space-y-2">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide">
                CATATAN REALISASI LAPANGAN DI SEKOLAH (DIISI DENGAN PENA):
              </span>
              <div className="grid grid-cols-3 gap-2.5 text-slate-700">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">1. Ompreng Dikirim Dapur:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{printDelivery.targetPortions} Ompreng</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">2. Ompreng Balik / Retur:</span>
                  <span className="font-bold text-rose-700 text-sm">
                    {printDelivery.absentStudents ? `${printDelivery.absentStudents} Ompreng` : '........ Ompreng'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">3. Bersih Dimakan Siswa:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {printDelivery.deliveredPortions ? `${printDelivery.deliveredPortions} Ompreng` : '........ Ompreng'}
                  </span>
                </div>
              </div>
              <div className="pt-1 text-[11px] text-slate-600">
                <span className="font-medium">Alasan Ompreng Balik (bila ada):</span>
                <span className="ml-2 italic font-mono text-[10px]">
                  [ &nbsp; ] Siswa Sakit/Absen &nbsp;&nbsp;&nbsp; [ &nbsp; ] Siswa Kenyang/Tidak Mau &nbsp;&nbsp;&nbsp; [ &nbsp; ] Porsi Lebih Dapur
                </span>
              </div>
            </div>

            {/* Catatan Verifikasi */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Keterangan Khusus / Zero Waste & Keamanan Pangan:</span>
              <p className="text-slate-600 italic">
                {printDelivery.surplusHandling || 'Sesuai dengan SOP Zero Waste BGN dan disimpan di wadah steril.'}
              </p>
            </div>

            {/* Lembar Tanda Tangan Dua Pihak (Dilengkapi Gambar Tanda Tangan Digital Guru) */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center text-xs">
              <div className="space-y-2 flex flex-col justify-between">
                <span className="text-slate-500 font-medium">Yang Menyerahkan (Driver Logistik SPPG):</span>
                <div className="h-14 border-b border-slate-300 flex items-center justify-center font-serif italic text-indigo-700 text-sm">
                  ( {printDelivery.driverName} )
                </div>
                <p className="text-[11px] text-slate-400">Satuan Pelayanan Pemenuhan Gizi</p>
              </div>

              <div className="space-y-2 flex flex-col justify-between">
                <span className="text-slate-500 font-medium">Yang Menerima (Pihak Sekolah Sasaran):</span>
                <div className="h-14 border-b border-slate-300 flex items-center justify-center">
                  {printDelivery.recipientSignature ? (
                    <img
                      src={printDelivery.recipientSignature}
                      alt="Tanda Tangan Guru"
                      className="max-h-12 max-w-[180px] object-contain"
                    />
                  ) : (
                    <span className="font-serif italic text-emerald-700 text-sm">
                      ( {printDelivery.recipientName || printDelivery.contactPerson} )
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Kepala Sekolah / Guru Piket {printDelivery.recipientNip ? `(NIP: ${printDelivery.recipientNip})` : ''}
                </p>
              </div>
            </div>

            {/* Print Footer Controls */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between print:hidden">
              <span className="text-xs text-slate-400">Gunakan tombol cetak untuk print fisik A4 atau simpan PDF.</span>
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
                  Cetak Lembar BAST Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM IN-APP MODAL: KONFIRMASI HAPUS SURAT JALAN & RESTORE STOK */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Hapus Surat Jalan Pengiriman?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  No. Surat Jalan: <span className="font-mono font-bold text-slate-700">{deleteTarget.dispatchNumber}</span>
                </p>
                <p className="text-xs font-semibold text-indigo-900 mt-0.5">{deleteTarget.schoolName}</p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteTarget.isStockDeducted ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2 text-rose-950">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Stok Bahan Gudang Akan Dikembalikan (Restore)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-900/90">
                  Pengiriman ini sebelumnya telah memotong stok gudang sebesar <strong>{deleteTarget.targetPortions} porsi</strong>. Jika Anda menghapus data ini, sistem akan <strong>secara otomatis mengembalikan stok bahan mentah</strong> ke gudang dapur Anda:
                </p>
                {deleteTarget.deductedItems && deleteTarget.deductedItems.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {deleteTarget.deductedItems.map((item: any, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-white border border-rose-200 text-rose-800 font-bold px-2 py-0.5 rounded-md text-[10px]"
                      >
                        +{item.quantity} {item.unit} {item.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                Jadwal surat jalan ini akan dihapus dari sistem pengiriman.
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={confirmExecuteDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5 shadow-xs"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Ya, Hapus {deleteTarget.isStockDeducted ? '& Kembalikan Stok' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM IN-APP MODAL: KONFIRMASI SIMPAN KE DATABASE POSTGRESQL */}
      {seedConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Simpan ke Database PostgreSQL?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sinkronisasi 3 contoh data jadwal pengiriman ke database Neon
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSeedConfirmModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Sistem akan menyimpan data 3 rute pengiriman simulasi ini ke tabel database PostgreSQL Anda secara permanen.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setSeedConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={confirmExecuteSeed}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shadow-xs"
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Ya, Simpan ke Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM IN-APP MODAL: PREVIEW FOTO KERTAS BAST BERTANDA TANGAN */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-600" />
                Bukti Foto Lembar Kertas BAST Bertanda Tangan Basah
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-200 max-h-[70vh] flex items-center justify-center bg-black/5">
              <img src={previewPhotoUrl} alt="Foto Kertas BAST" className="max-h-[70vh] w-auto object-contain" />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP TOAST NOTIFICATION BANNER */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold bg-slate-900 text-white border-slate-800 animate-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
          <span className="leading-snug">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-white transition p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

