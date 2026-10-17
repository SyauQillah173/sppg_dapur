'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '@/lib/store';
import { formatRupiah } from '@/lib/utils';
import { exportRekap, exportRekapPDF, RekapMode, RekapJenis } from '@/lib/excel-export';
import { parseBudgetWorkbook, downloadBudgetTemplate } from '@/lib/excel-import';
import { compressImageHD } from '@/lib/image-compress';
import { BudgetAllocationItem } from '@/lib/types';
import {
  Wallet, Plus, Building2, TrendingUp, CreditCard, DollarSign,
  AlertCircle, AlertTriangle, AlertOctagon, Trash2, FileSpreadsheet, FileText, Calendar, Filter,
  Upload, Download, CheckCircle2, ArrowDownToLine, Eye, EyeOff,
  Image as ImageIcon, Sparkles, X, ExternalLink, ShieldCheck, UserCheck,
  Coins, Clock, Receipt, Check, ArrowRight,
} from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { AlertModal, AlertModalType } from '@/components/ui/AlertModal';

export function BudgetAllocationModule() {
  const {
    budgetAllocations,
    procurements,
    sppgUnits,
    selectedSppgUnit,
    currentUser,
    userRole,
    isReadOnly,
    addBudgetAllocation,
    addBudgetAllocationsBulk,
    updateBudgetAllocation,
    deleteBudgetAllocation,
  } = useStore();

  // ── local filters (independent of global header filter) ──────────────────
  const [localUnit, setLocalUnit] = useState<string>('ALL');
  const [periodeMode, setPeriodeMode] = useState<'tanggal' | 'bulan' | 'tahun'>('bulan');
  const [filterTanggal, setFilterTanggal] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const [rekapMode, setRekapMode] = useState<RekapMode>('bulanan');
  const [rekapJenis, setRekapJenis] = useState<RekapJenis>('semua');

  // ── modal Catat Dana Masuk state ──────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sppgUnitId, setSppgUnitId] = useState<string>(sppgUnits[0]?.id || 'ALL');
  const [periodeInputMode, setPeriodeInputMode] = useState<'tanggal' | 'bulan' | 'tahun'>('tanggal');
  const [inputTanggal, setInputTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [inputBulan, setInputBulan] = useState<string>(new Date().toISOString().slice(0, 7));
  const [inputTahun, setInputTahun] = useState<string>(String(new Date().getFullYear()));
  const [amountAllocated, setAmountAllocated] = useState('17000000');
  const [notes, setNotes] = useState('Pagu Kas Operasional Pemenuhan Gizi');

  // Transparansi metadata form
  const defaultPengaju = currentUser?.name || (userRole === 'SUPERADMIN' ? 'Abdullah Syauqillah, S.Kom' : 'Staf Pemohon');
  const [requestedBy, setRequestedBy] = useState(defaultPengaju);
  const [requesterFor, setRequesterFor] = useState('Kepala Dapur & Tim Gizi SPPG');
  const [cashHolder, setCashHolder] = useState('Bendahara Dapur / Ny. Siti');

  // Bukti TF upload state
  const [transferProofUrl, setTransferProofUrl] = useState<string>('');
  const [transferProofPreview, setTransferProofPreview] = useState<string>('');
  const [isUploadingProof, setIsUploadingProof] = useState<boolean>(false);
  const [proofCompressionInfo, setProofCompressionInfo] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ── modal Tarik Sisa Dana state ───────────────────────────────────────────
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawTargetBudget, setWithdrawTargetBudget] = useState<BudgetAllocationItem | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawBy, setWithdrawBy] = useState<string>('');
  const [withdrawRecipient, setWithdrawRecipient] = useState<string>('');
  const [withdrawSpender, setWithdrawSpender] = useState<string>('');
  const [withdrawProofUrl, setWithdrawProofUrl] = useState<string>('');
  const [withdrawProofPreview, setWithdrawProofPreview] = useState<string>('');
  const [isUploadingWithdrawProof, setIsUploadingWithdrawProof] = useState<boolean>(false);
  const [withdrawProofCompressionInfo, setWithdrawProofCompressionInfo] = useState<string | null>(null);
  const [withdrawDate, setWithdrawDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [withdrawNote, setWithdrawNote] = useState<string>('');
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [withdrawError, setWithdrawError] = useState<string>('');
  const [alertInfo, setAlertInfo] = useState<{
    isOpen: boolean;
    type?: AlertModalType;
    title: string;
    message: string;
    highlightNote?: string;
    actionText?: string;
    onAction?: () => void;
  } | null>(null);

  // ── Lightbox Bukti TF Modal ───────────────────────────────────────────────
  const [activeProofModal, setActiveProofModal] = useState<{
    url: string;
    title: string;
    meta?: string;
  } | null>(null);

  // ── Delete confirmation state ─────────────────────────────────────────────
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── import Excel ──────────────────────────────────────────────────────────
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; errors: string[] } | null>(null);

  // Periode dipilih → label fiskal + tanggal ISO
  const periodeInfo = useMemo(() => {
    if (periodeInputMode === 'tanggal' && inputTanggal) {
      const [y, m, d] = inputTanggal.split('-').map(Number);
      const dt = new Date(y, (m || 1) - 1, d || 1, 12);
      if (!isNaN(dt.getTime())) {
        return {
          allocatedDate: dt.toISOString(),
          label: dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
        };
      }
    }
    if (periodeInputMode === 'tahun' && inputTahun) {
      return { allocatedDate: new Date(Number(inputTahun), 0, 1, 12).toISOString(), label: `Tahun ${inputTahun}` };
    }
    if (inputBulan) {
      const [y, m] = inputBulan.split('-').map(Number);
      const dt = new Date(y, (m || 1) - 1, 1, 12);
      return {
        allocatedDate: dt.toISOString(),
        label: dt.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      };
    }
    return { allocatedDate: new Date().toISOString(), label: '-' };
  }, [periodeInputMode, inputTanggal, inputBulan, inputTahun]);

  // ── filter helpers ────────────────────────────────────────────────────────
  const matchesDateFilter = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (periodeMode === 'tanggal' && filterTanggal) {
      return dateStr.startsWith(filterTanggal);
    }
    if (periodeMode === 'bulan' && filterBulan) {
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return ym === filterBulan;
    }
    if (periodeMode === 'tahun' && filterTahun) {
      return String(d.getFullYear()) === filterTahun;
    }
    return true;
  };

  const hasDateFilter = (periodeMode === 'tanggal' && !!filterTanggal)
    || (periodeMode === 'bulan' && !!filterBulan)
    || (periodeMode === 'tahun' && !!filterTahun);

  // ── filtered data ─────────────────────────────────────────────────────────
  const filteredBudgets = useMemo(() => {
    return budgetAllocations.filter(b => {
      if (localUnit !== 'ALL' && b.sppgUnitId !== localUnit && b.sppgUnitId !== 'ALL') return false;
      if (hasDateFilter && !matchesDateFilter(b.allocatedDate)) return false;
      return true;
    });
  }, [budgetAllocations, localUnit, periodeMode, filterTanggal, filterBulan, filterTahun]);

  const filteredProcurements = useMemo(() => {
    return procurements.filter(p => {
      if (localUnit !== 'ALL' && p.sppgUnitId !== localUnit && p.sppgUnitId !== 'ALL') return false;
      if (hasDateFilter && !matchesDateFilter(p.date)) return false;
      return true;
    });
  }, [procurements, localUnit, periodeMode, filterTanggal, filterBulan, filterTahun]);

  // ── CARD 1: Perhitungan Pengajuan & Kas Hari Ini (Live Real-Time) ────────
  // Tanggal hari ini dalam format YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todayBudgets = useMemo(() => {
    return budgetAllocations.filter(b => {
      if (localUnit !== 'ALL' && b.sppgUnitId !== localUnit && b.sppgUnitId !== 'ALL') return false;
      return b.allocatedDate.startsWith(todayStr);
    });
  }, [budgetAllocations, localUnit, todayStr]);

  const todayProcurements = useMemo(() => {
    return procurements.filter(p => {
      if (localUnit !== 'ALL' && p.sppgUnitId !== localUnit && p.sppgUnitId !== 'ALL') return false;
      return p.date.startsWith(todayStr);
    });
  }, [procurements, localUnit, todayStr]);

  const todayDanaDiajukan = todayBudgets.reduce((s, b) => s + b.amountAllocated, 0);
  const todayBelanjaRealized = todayProcurements.reduce((s, p) => s + p.actualReceiptTotal, 0);
  const todayDanaDitarik = todayBudgets.reduce((s, b) => s + (b.withdrawnAmount || 0), 0);
  const todayNetBalance = todayDanaDiajukan - todayBelanjaRealized - todayDanaDitarik;
  const todaySisaKas = Math.max(0, todayNetBalance);

  // ── SINKRONISASI CERDAS: Riwayat Pemasukan Dana vs Realisasi Belanja Nyata ──
  // Setiap alokasi anggaran menghitung realisasi live dari procurements pada tanggal & unit yang sesuai
  const syncedBudgets = useMemo(() => {
    return filteredBudgets.map((b) => {
      const budgetDate = b.allocatedDate.slice(0, 10);
      const matchingProcurements = procurements.filter((p) => {
        const matchesUnit = b.sppgUnitId === 'ALL' || p.sppgUnitId === b.sppgUnitId || p.sppgUnitId === 'ALL';
        const matchesDate = p.date.slice(0, 10) === budgetDate;
        return matchesUnit && matchesDate;
      });

      const liveRealized = matchingProcurements.reduce((sum, p) => sum + p.actualReceiptTotal, 0);
      const withdrawn = b.withdrawnAmount || 0;
      const netRemaining = b.amountAllocated - liveRealized - withdrawn;

      return {
        ...b,
        amountRealized: liveRealized,
        remainingBudget: netRemaining,
        isDeficit: netRemaining < 0,
      };
    });
  }, [filteredBudgets, procurements]);

  // ── CARD 2: Akumulasi Keseluruhan (Master All-Time Overview) ──────────────
  const totalPemasukan = filteredBudgets.reduce((s, b) => s + b.amountAllocated, 0);
  const totalPengeluaran = filteredProcurements.reduce((s, p) => s + p.actualReceiptTotal, 0);
  const totalDitarikGlobal = filteredBudgets.reduce((s, b) => s + (b.withdrawnAmount || 0), 0);
  const saldo = totalPemasukan - totalPengeluaran - totalDitarikGlobal;
  const absorptionRate = totalPemasukan > 0 ? (totalPengeluaran / totalPemasukan) * 100 : 0;

  // ── unit name helper ──────────────────────────────────────────────────────
  const localUnitName = localUnit === 'ALL'
    ? 'Semua Unit SPPG'
    : sppgUnits.find(u => u.id === localUnit)?.name ?? localUnit;

  // ── export ────────────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    exportRekap(filteredBudgets, filteredProcurements, rekapMode, rekapJenis, localUnit, localUnitName);
  };

  const handleExportPDF = () => {
    exportRekapPDF(filteredBudgets, filteredProcurements, rekapMode, rekapJenis, localUnit, localUnitName);
  };

  // ── Bukti TF upload with HD WebP compression ──────────────────────────────
  const handleProofFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingProof(true);
    setProofCompressionInfo('Mengompres bukti TF ke HD WebP...');

    try {
      // 1. Kompresi gambar client-side HD WebP (menghemat 95%+ ruang database Postgres neon)
      const comp = await compressImageHD(file, 1280, 1280, 0.78);
      setTransferProofPreview(comp.dataUrl);
      setProofCompressionInfo(`HD WebP: ${comp.formattedCompressed} (Hemat ${comp.reductionPercentage}% dari ${comp.formattedOriginal})`);

      // 2. Upload file terkompresi ke Postgres table nota_photos
      const uploadData = new FormData();
      uploadData.append('file', comp.file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadData });
      const uploadJson = await uploadRes.json();
      if (uploadJson?.success && uploadJson.url) {
        setTransferProofUrl(uploadJson.url);
      }
    } catch (err: any) {
      console.error('Upload proof error:', err);
      setTransferProofPreview(URL.createObjectURL(file));
      setProofCompressionInfo(null);
    } finally {
      setIsUploadingProof(false);
    }
  };

  // ── submit Tambah Dana Masuk ──────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setErrorMsg('');
    setIsSubmitting(true);

    const amount = Number(String(amountAllocated).replace(/[^0-9]/g, ''));
    if (!amount || amount <= 0) {
      setErrorMsg('Nominal harus lebih dari 0');
      setIsSubmitting(false);
      return;
    }

    const isAllUnits = sppgUnitId === 'ALL';
    const targetUnit = isAllUnits ? undefined : sppgUnits.find(u => u.id === sppgUnitId);

    const result = await addBudgetAllocation({
      sppgUnitId,
      sppgUnitName: isAllUnits ? 'Semua SPPG (Gabungan 4 Unit)' : targetUnit?.name || sppgUnitId,
      fiscalPeriod: periodeInfo.label,
      allocatedDate: periodeInfo.allocatedDate,
      amountAllocated: amount,
      amountRealized: 0,
      remainingBudget: amount,
      notes,
      requestedBy: requestedBy.trim() || 'Superadmin Pengelola',
      requesterFor: requesterFor.trim() || 'Kepala Dapur & Tim Gizi',
      cashHolder: cashHolder.trim() || 'Bendahara Dapur',
      transferProofUrl: transferProofUrl || undefined,
    });

    setIsSubmitting(false);
    if (!result.ok) {
      setErrorMsg(result.error || 'Gagal menyimpan dana masuk.');
      return;
    }

    setIsModalOpen(false);
    setAmountAllocated('17000000');
    setNotes('Pagu Kas Operasional Pemenuhan Gizi');
    setTransferProofUrl('');
    setTransferProofPreview('');
    setProofCompressionInfo(null);
  };

  // ── Tarik Sisa Dana handlers ──────────────────────────────────────────────
  const selectWithdrawTarget = (target: BudgetAllocationItem) => {
    setWithdrawTargetBudget(target);
    setWithdrawAmount(String(target.remainingBudget || 0));
    setWithdrawBy(currentUser?.name || 'Abdullah Syauqillah, S.Kom (Superadmin)');
    setWithdrawRecipient(target.withdrawnRecipient || 'Drs. Supriyanto, Ak., CA (Auditor Eksekutif / Bendahara)');

    // Otomatis deteksi staf yang membelanjakan dari transaksi pengadaan belanja pada tanggal & unit alokasi
    const matchingProcurements = procurements.filter(p => {
      const matchDate = p.date.slice(0, 10) === target.allocatedDate.slice(0, 10);
      const matchUnit = target.sppgUnitId === 'ALL' || p.sppgUnitId === target.sppgUnitId;
      return matchDate && matchUnit;
    });
    const spenders = Array.from(new Set(matchingProcurements.map(p => p.requesterName).filter(Boolean)));
    const detectedSpender = spenders.length > 0 ? spenders.join(', ') : (target.withdrawnSpender || 'Siti Aminah / Tim Pengadaan Dapur SPPG');
    setWithdrawSpender(target.withdrawnSpender || detectedSpender);

    setWithdrawDate(new Date().toISOString().slice(0, 10));
    setWithdrawNote(
      target.withdrawnNote ||
      `Berita acara penarikan sisa kas tanggal ${new Date(target.allocatedDate).toLocaleDateString('id-ID')} disetor kembali ke kas utama / auditor.`
    );
    setWithdrawProofUrl(target.withdrawnProofUrl || '');
    setWithdrawProofPreview(target.withdrawnProofUrl || '');
    setWithdrawProofCompressionInfo(null);
    setWithdrawError('');
  };

  const handleOpenWithdrawModal = (budget?: BudgetAllocationItem) => {
    if (isReadOnly) return;
    const candidates = budgetAllocations.filter(b => b.remainingBudget > 0);
    const target =
      budget ||
      todayBudgets.find(b => b.remainingBudget > 0) ||
      candidates[0];

    if (!target) {
      if (budgetAllocations.length === 0) {
        setAlertInfo({
          isOpen: true,
          type: 'warning',
          title: 'Belum Ada Alokasi Kas Operasional',
          message: 'Saat ini belum terdapat catatan alokasi dana kas operasional di sistem. Silakan catat dana masuk operasional baru terlebih dahulu.',
          highlightNote: 'Setelah dana kas masuk dicatat dan dibelanjakan, sisa uang kas akan otomatis terhitung secara live dan dapat ditarik secara transparan.',
          actionText: 'Catat Kas Masuk Sekarang',
          onAction: () => {
            setRequestedBy(defaultPengaju);
            setIsModalOpen(true);
          },
        });
      } else {
        // Semua alokasi sudah terserap / ditarik hingga Rp 0
        setAlertInfo({
          isOpen: true,
          type: 'info',
          title: 'Semua Sisa Kas Sudah Bersih (Rp 0)',
          message: 'Seluruh alokasi kas operasional yang tercatat saat ini sudah bersisa Rp 0 (sudah habis dibelanjakan atau seluruh sisa dana telah ditarik/disetor kembali ke kas utama).',
          highlightNote: 'Anda dapat meninjau rincian pengembalian sebelumnya pada tabel "Riwayat Penarikan Sisa Kas & Berita Acara Pengembalian" di bawah.',
          actionText: 'Catat Kas Masuk Baru',
          onAction: () => {
            setRequestedBy(defaultPengaju);
            setIsModalOpen(true);
          },
        });
      }
      return;
    }
    selectWithdrawTarget(target);
    setIsWithdrawModalOpen(true);
  };

  const handleWithdrawProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingWithdrawProof(true);
    setWithdrawProofCompressionInfo('Mengompres bukti serah terima kas ke HD WebP...');

    try {
      const comp = await compressImageHD(file, 1280, 1280, 0.78);
      setWithdrawProofPreview(comp.dataUrl);
      setWithdrawProofCompressionInfo(`HD WebP: ${comp.formattedCompressed} (Hemat ${comp.reductionPercentage}% dari ${comp.formattedOriginal})`);

      const uploadData = new FormData();
      uploadData.append('file', comp.file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadData });
      const uploadJson = await uploadRes.json();
      if (uploadJson?.success && uploadJson.url) {
        setWithdrawProofUrl(uploadJson.url);
      }
    } catch (err: any) {
      console.error('Upload withdraw proof error:', err);
      setWithdrawProofPreview(URL.createObjectURL(file));
      setWithdrawProofCompressionInfo(null);
    } finally {
      setIsUploadingWithdrawProof(false);
    }
  };

  const handleConfirmWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawTargetBudget || isReadOnly) return;

    const amountNum = Number(String(withdrawAmount).replace(/[^0-9]/g, ''));
    if (!amountNum || amountNum <= 0) {
      setWithdrawError('Nominal penarikan harus lebih dari 0.');
      return;
    }
    if (amountNum > withdrawTargetBudget.remainingBudget) {
      setWithdrawError(`Nominal penarikan tidak boleh melebihi sisa dana (${formatRupiah(withdrawTargetBudget.remainingBudget)}).`);
      return;
    }

    setIsWithdrawing(true);
    setWithdrawError('');

    const newWithdrawnTotal = (withdrawTargetBudget.withdrawnAmount || 0) + amountNum;
    const result = await updateBudgetAllocation(withdrawTargetBudget.id, {
      withdrawnAmount: newWithdrawnTotal,
      withdrawnAt: new Date(withdrawDate).toISOString(),
      withdrawnBy: withdrawBy.trim() || 'Abdullah Syauqillah, S.Kom (Superadmin)',
      withdrawnRecipient: withdrawRecipient.trim() || 'Drs. Supriyanto, Ak., CA (Auditor Eksekutif)',
      withdrawnSpender: withdrawSpender.trim() || 'Tim Pengadaan Dapur',
      withdrawnProofUrl: withdrawProofUrl || undefined,
      withdrawnNote: withdrawNote.trim() || 'Sisa kas ditarik/disetor kembali ke kas utama.',
      remainingBudget: Math.max(0, withdrawTargetBudget.remainingBudget - amountNum),
    });

    setIsWithdrawing(false);
    if (!result.ok) {
      setWithdrawError(result.error || 'Gagal memproses penarikan sisa kas.');
      return;
    }

    setIsWithdrawModalOpen(false);
    setWithdrawTargetBudget(null);
    setWithdrawProofUrl('');
    setWithdrawProofPreview('');
    setWithdrawProofCompressionInfo(null);
  };

  // ── import Excel ──────────────────────────────────────────────────────────
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || isReadOnly) return;

    setIsImporting(true);
    setImportResult(null);
    try {
      const { rows, errors } = await parseBudgetWorkbook(file, sppgUnits);
      if (rows.length > 0) {
        const result = await addBudgetAllocationsBulk(
          rows.map(r => ({ ...r, amountRealized: 0, remainingBudget: r.amountAllocated }))
        );
        if (!result.ok) {
          setImportResult({ ok: 0, errors: [result.error || 'Gagal menyimpan hasil import.'] });
          return;
        }
      }
      setImportResult({ ok: rows.length, errors });
    } catch (err) {
      setImportResult({ ok: 0, errors: [err instanceof Error ? err.message : 'Gagal membaca file Excel.'] });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (isReadOnly) return;
    setDeleteTargetId(id);
  };

  const handleConfirmDeleteBudget = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    const result = await deleteBudgetAllocation(deleteTargetId);
    setIsDeleting(false);
    setDeleteTargetId(null);
    if (!result.ok) setErrorMsg(result.error || 'Gagal menghapus catatan dana masuk.');
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Catatan Pemasukan & Alokasi Anggaran</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dashboard anggaran harian live, monitoring pemotongan realisasi belanja, dan rekap akumulasi seluruh periode.
          </p>
        </div>
        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenWithdrawModal()}
              className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition shadow-xs"
              title="Tarik atau kelola sisa pengembalian kas operasional"
            >
              <ArrowDownToLine className="h-3.5 w-3.5 text-amber-700" />
              <span>Tarik Sisa Kas</span>
              {todaySisaKas > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-200 text-amber-900 font-bold">
                  {formatRupiah(todaySisaKas)}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setRequestedBy(defaultPengaju);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Catat Kas Masuk Baru
            </button>
          </div>
        )}
        {isReadOnly && (
          <div className="text-xs px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 font-medium">
            Mode Pemantau — hanya baca
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          CARD KHUSUS 1: PENGAJUAN & REALISASI HARI INI (LIVE REAL-TIME)
          Otomatis terpotong saat belanja diinput, sisa bisa ditarik ke Rp 0,
          dan reset otomatis saat berganti hari baru.
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  Pengajuan & Pemotongan Kas Hari Ini
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  <Clock className="h-3 w-3" />
                  Live Real-Time
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} &bull; Reset otomatis saat pergantian tanggal kalender
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => handleOpenWithdrawModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition shadow-xs"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                {todaySisaKas > 0
                  ? `Tarik Sisa Kas Hari Ini (${formatRupiah(todaySisaKas)})`
                  : 'Tarik / Kelola Sisa Kas'}
              </button>
            )}
            {todayDanaDitarik > 0 && todaySisaKas === 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Sisa Rp {formatRupiah(todayDanaDitarik)} telah disetor balik (Kas Bersih Rp 0)
              </span>
            )}
          </div>
        </div>

        {/* Grid 3 Kartu Harian */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. Diajukan Hari Ini */}
          <div className="rounded-lg border border-blue-200/80 bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-blue-900 font-semibold mb-1">
              <span>Dana Diajukan Hari Ini</span>
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xl font-extrabold text-blue-950 font-mono tabular-nums">
              {formatRupiah(todayDanaDiajukan)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {todayBudgets.length > 0
                ? `${todayBudgets.length} pencatatan dana masuk hari ini`
                : 'Belum ada dana masuk tanggal hari ini'}
            </p>
          </div>

          {/* 2. Pengeluaran Belanja Hari Ini */}
          <div className="rounded-lg border border-emerald-200/80 bg-white p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-emerald-900 font-semibold mb-1">
              <span>Pengeluaran Belanja Hari Ini</span>
              <CreditCard className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono tabular-nums">
              {formatRupiah(todayBelanjaRealized)}
            </div>
            <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
              <span>Otomatis memotong pagu hari ini ({todayProcurements.length} transaksi belanja)</span>
            </p>
          </div>

          {/* 3. Sisa / Pengembalian Hari Ini */}
          <div className={`rounded-lg border p-3.5 shadow-xs ${
            todayNetBalance < 0
              ? 'border-rose-300 bg-rose-50/60'
              : todayNetBalance > 0
              ? 'border-indigo-300 bg-white'
              : todayDanaDitarik > 0
              ? 'border-emerald-200 bg-emerald-50/50'
              : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className={todayNetBalance < 0 ? 'text-rose-800' : 'text-slate-700'}>
                {todayNetBalance < 0 ? 'Defisit / Kurang Kas Hari Ini' : 'Sisa / Pengembalian Hari Ini'}
              </span>
              {todayNetBalance < 0 ? (
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              ) : (
                <Coins className="h-4 w-4 text-indigo-600" />
              )}
            </div>
            <div className={`text-xl font-extrabold font-mono tabular-nums ${
              todayNetBalance < 0 ? 'text-rose-600' : todayNetBalance > 0 ? 'text-indigo-700' : 'text-slate-900'
            }`}>
              {todayNetBalance < 0
                ? `-${formatRupiah(Math.abs(todayNetBalance))}`
                : formatRupiah(todayNetBalance)}
            </div>
            <div className="text-[11px] mt-1">
              {todayNetBalance < 0 ? (
                <span className="text-rose-700 font-semibold flex items-center gap-1">
                  <span>🚨 Pengeluaran belanja melebihi dana diajukan hari ini</span>
                </span>
              ) : todayDanaDitarik > 0 ? (
                <span className="text-emerald-700 font-medium">
                  {formatRupiah(todayDanaDitarik)} disetor kembali ke kas utama
                </span>
              ) : todayNetBalance > 0 ? (
                <span className="text-indigo-700 font-medium">
                  Uang tunai/kembalian aktif di tangan pemegang dana
                </span>
              ) : (
                <span className="text-slate-500">Dana terserap pas / sesuai belanja</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-wrap gap-2.5 sm:gap-3 items-end">

          {/* Unit SPPG */}
          <div className="w-full sm:w-auto">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Unit SPPG</label>
            <select
              value={localUnit}
              onChange={e => setLocalUnit(e.target.value)}
              className="w-full sm:w-auto h-8 rounded-md border border-slate-300 px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            >
              <option value="ALL">Semua Unit (4 Dapur)</option>
              {sppgUnits.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          {/* Periode mode */}
          <div className="w-full sm:w-auto">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Filter Berdasarkan</label>
            <div className="flex rounded-md border border-slate-200 overflow-hidden bg-white">
              {(['tanggal', 'bulan', 'tahun'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPeriodeMode(m)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium transition ${periodeMode === m ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date input */}
          <div className="w-full sm:w-auto">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              {periodeMode === 'tanggal' ? 'Pilih Tanggal' : periodeMode === 'bulan' ? 'Pilih Bulan' : 'Pilih Tahun'}
            </label>
            {periodeMode === 'tanggal' && (
              <input type="date" value={filterTanggal} onChange={e => setFilterTanggal(e.target.value)}
                className="w-full sm:w-auto h-8 rounded-md border border-slate-300 px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white" />
            )}
            {periodeMode === 'bulan' && (
              <input type="month" value={filterBulan} onChange={e => setFilterBulan(e.target.value)}
                className="w-full sm:w-auto h-8 rounded-md border border-slate-300 px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white" />
            )}
            {periodeMode === 'tahun' && (
              <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)}
                className="w-full sm:w-auto h-8 rounded-md border border-slate-300 px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white">
                <option value="">Semua Tahun</option>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
          </div>

          {/* Rekap mode */}
          <div className="w-full sm:w-auto">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Rekapitulasi</label>
            <select value={rekapMode} onChange={e => setRekapMode(e.target.value as RekapMode)}
              className="w-full sm:w-auto h-8 rounded-md border border-slate-300 px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white">
              <option value="harian">Harian</option>
              <option value="mingguan">Mingguan</option>
              <option value="bulanan">Bulanan</option>
              <option value="tahunan">Tahunan</option>
            </select>
          </div>

          {/* Jenis */}
          <div className="w-full sm:w-auto">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Jenis Rekap</label>
            <select value={rekapJenis} onChange={e => setRekapJenis(e.target.value as RekapJenis)}
              className="w-full sm:w-auto h-8 rounded-md border border-slate-300 px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white">
              <option value="semua">Semua (Pemasukan & Pengeluaran)</option>
              <option value="pemasukan">Pemasukan Saja</option>
              <option value="pengeluaran">Pengeluaran Saja</option>
            </select>
          </div>

          {/* Export / Import buttons */}
          <div className="w-full sm:w-auto flex flex-wrap gap-2 sm:ml-auto items-center pt-1 sm:pt-0">
            {!isReadOnly && (
              <>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <button type="button" onClick={() => importInputRef.current?.click()} disabled={isImporting}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-blue-300 bg-blue-50 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition">
                  <Upload className="h-3.5 w-3.5" />
                  {isImporting ? 'Membaca...' : 'Import Excel'}
                </button>
                <button type="button" onClick={downloadBudgetTemplate}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                  <Download className="h-3.5 w-3.5" />
                  Template
                </button>
              </>
            )}
            <button type="button" onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-emerald-300 bg-emerald-50 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export Excel
            </button>
            <button type="button" onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-red-300 bg-red-50 text-xs font-medium text-red-700 hover:bg-red-100 transition">
              <FileText className="h-3.5 w-3.5" />
              Export PDF
            </button>
          </div>
        </div>

        {importResult && (
          <div className={`rounded-md border p-3 text-xs space-y-1 ${importResult.ok > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{importResult.ok} baris dana masuk berhasil diimpor{importResult.errors.length > 0 ? `, ${importResult.errors.length} baris dilewati` : ''}.</span>
              <button type="button" onClick={() => setImportResult(null)} className="ml-auto text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            {importResult.errors.length > 0 && (
              <ul className="list-disc pl-5 space-y-0.5">
                {importResult.errors.slice(0, 8).map((err, i) => <li key={i}>{err}</li>)}
                {importResult.errors.length > 8 && <li>…dan {importResult.errors.length - 8} baris lain.</li>}
              </ul>
            )}
          </div>
        )}

        {hasDateFilter && (
          <p className="text-[11px] text-slate-400">
            Menampilkan data berdasarkan filter aktif &bull; {filteredBudgets.length} pemasukan, {filteredProcurements.length} pengeluaran
          </p>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          CARD 2: AKUMULASI KESELURUHAN (MASTER TOTALS - TETAP & TERHITUNG RAPI)
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-700 shrink-0" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Akumulasi Keuangan Seluruh Periode (Tetap & Terhitung Rapi)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Total semua dana masuk & belanja tanpa hilang
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 min-w-0 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700 text-xs truncate">Total Pemasukan</span>
              <Wallet className="h-4 w-4 text-blue-500 shrink-0" />
            </div>
            <div className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 font-mono tabular-nums tracking-tight whitespace-nowrap overflow-hidden text-ellipsis" title={formatRupiah(totalPemasukan)}>
              {formatRupiah(totalPemasukan)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate">{filteredBudgets.length} alokasi kas tercatat</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 min-w-0 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700 text-xs truncate">Total Pengeluaran</span>
              <CreditCard className="h-4 w-4 text-emerald-500 shrink-0" />
            </div>
            <div className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 font-mono tabular-nums tracking-tight whitespace-nowrap overflow-hidden text-ellipsis" title={formatRupiah(totalPengeluaran)}>
              {formatRupiah(totalPengeluaran)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate">{filteredProcurements.length} transaksi belanja</p>
          </div>
          <div className={`rounded-lg border p-3 sm:p-4 min-w-0 shadow-2xs ${saldo < 0 ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className={`font-semibold text-xs truncate ${saldo < 0 ? 'text-rose-800' : 'text-slate-700'}`}>
                {saldo < 0 ? 'Defisit Saldo Kas' : 'Saldo Kas Bersih'}
              </span>
              {saldo < 0 ? (
                <AlertOctagon className="h-4 w-4 text-rose-600 shrink-0" />
              ) : (
                <DollarSign className="h-4 w-4 text-indigo-500 shrink-0" />
              )}
            </div>
            <div className={`text-sm sm:text-base lg:text-lg font-bold font-mono tabular-nums tracking-tight whitespace-nowrap overflow-hidden text-ellipsis ${saldo < 0 ? 'text-rose-600' : 'text-indigo-700'}`} title={formatRupiah(saldo)}>
              {saldo < 0 ? `-${formatRupiah(Math.abs(saldo))}` : formatRupiah(saldo)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate">
              {saldo < 0
                ? '⚠️ Defisit kas: belanja melebihi total seluruh dana masuk'
                : totalDitarikGlobal > 0
                ? `Telah ditarik/kembali: ${formatRupiah(totalDitarikGlobal)}`
                : 'Sisa kas aktif operasional'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 min-w-0 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700 text-xs truncate">Penyerapan Dana</span>
              <TrendingUp className={`h-4 w-4 shrink-0 ${absorptionRate > 100 ? 'text-rose-500' : 'text-amber-500'}`} />
            </div>
            <div className="flex items-center gap-2">
              <div className={`text-sm sm:text-base lg:text-lg font-bold font-mono tabular-nums tracking-tight ${absorptionRate > 100 ? 'text-rose-600' : 'text-slate-900'}`}>
                {absorptionRate.toFixed(1)}%
              </div>
              {absorptionRate > 100 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 shrink-0">
                  Over-Budget
                </span>
              )}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${absorptionRate > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, absorptionRate)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table: Riwayat Pemasukan Dana dengan Kolom Transparansi & Bukti TF */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Riwayat Pemasukan Dana & Bukti Transfer</h2>
            <p className="text-[11px] text-slate-500">Transparansi pihak pengaju, pemegang uang kas, dan bukti transaksi bank.</p>
          </div>
          <span className="text-xs text-slate-500 font-mono shrink-0">{filteredBudgets.length} Data &bull; {localUnitName}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 min-w-[100px]">Tanggal</th>
                <th className="py-3 px-4 min-w-[160px]">Unit SPPG</th>
                <th className="py-3 px-4 min-w-[210px]">Yang Mengajukan & PIC Kas</th>
                <th className="py-3 px-4 text-center min-w-[130px]">Bukti Transfer (TF)</th>
                <th className="py-3 px-4 text-right min-w-[120px]">Dana Masuk</th>
                <th className="py-3 px-4 text-right min-w-[110px]">Realisasi</th>
                <th className="py-3 px-4 text-right min-w-[130px]">Sisa Kas</th>
                <th className="py-3 px-4 min-w-[120px]">Penyerapan</th>
                <th className="py-3 px-4 min-w-[160px]">Keterangan</th>
                {!isReadOnly && <th className="py-3 px-4 text-center min-w-[110px]">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {syncedBudgets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400 text-xs">
                    Belum ada data pemasukan untuk filter ini.
                  </td>
                </tr>
              ) : (
                syncedBudgets.map(item => {
                  const usedPct = item.amountAllocated > 0 ? (item.amountRealized / item.amountAllocated) * 100 : 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap min-w-[100px]">
                        {new Date(item.allocatedDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 min-w-[160px]">{item.sppgUnitName}</td>
                      <td className="py-3 px-4 min-w-[210px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-nowrap">
                            <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200/60 font-semibold px-1.5 py-0.5 rounded shrink-0">Pengaju</span>
                            <span className="font-semibold text-slate-800 text-xs truncate max-w-[150px]" title={item.requestedBy || '-'}>{item.requestedBy || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-nowrap">
                            <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200/60 font-semibold px-1.5 py-0.5 rounded shrink-0">PIC Kas</span>
                            <span className="text-slate-600 text-xs truncate max-w-[150px]" title={item.cashHolder || '-'}>{item.cashHolder || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.transferProofUrl ? (
                          <button
                            type="button"
                            onClick={() => setActiveProofModal({
                              url: item.transferProofUrl!,
                              title: `Bukti Transfer Kas — ${item.sppgUnitName}`,
                              meta: `${new Date(item.allocatedDate).toLocaleDateString('id-ID')} · ${formatRupiah(item.amountAllocated)} · Pengaju: ${item.requestedBy || '-'} · PIC Kas: ${item.cashHolder || '-'}`,
                            })}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition whitespace-nowrap shadow-2xs"
                          >
                            <ImageIcon className="h-3 w-3 text-blue-600" />
                            <span>Lihat Bukti TF</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Tanpa Bukti TF</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">{formatRupiah(item.amountAllocated)}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700 tabular-nums">{formatRupiah(item.amountRealized)}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <div className={`font-bold ${item.remainingBudget < 0 ? 'text-rose-600' : 'text-indigo-700'}`}>
                          {item.remainingBudget < 0 ? `-${formatRupiah(Math.abs(item.remainingBudget))}` : formatRupiah(item.remainingBudget)}
                        </div>
                        {item.remainingBudget < 0 ? (
                          <div className="text-[10px] text-rose-600 font-sans font-semibold">
                            Defisit / Over Pagu
                          </div>
                        ) : (item.withdrawnAmount || 0) > 0 ? (
                          <div className="text-[10px] text-amber-700 font-sans">
                            Ditarik: {formatRupiah(item.withdrawnAmount || 0)}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-14 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${usedPct > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, usedPct)}%` }}
                            />
                          </div>
                          <span className={`font-mono text-[11px] ${usedPct > 100 ? 'font-bold text-rose-600' : 'text-slate-600'}`}>
                            {usedPct.toFixed(0)}%{usedPct > 100 ? ' (Over)' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-[160px] truncate">{item.notes || '-'}</td>
                      {!isReadOnly && (
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {item.remainingBudget > 0 && (
                              <button
                                type="button"
                                onClick={() => handleOpenWithdrawModal(item)}
                                title="Tarik / Setor Balik Sisa Kas"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                              >
                                <ArrowDownToLine className="h-3 w-3" />
                                <span>Tarik Sisa</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              title="Hapus Catatan Dana"
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          TABLE: RIWAYAT TRANSPARANSI PENARIKAN SISA KAS (BERITA ACARA PENGEMBALIAN)
          Transparansi penuh:
          - Yang Mengajukan Penarikan
          - Yang Membelanjakan Sampai Tersisa
          - Yang Menerima Penarikan Sisa Kas
          - Nominal Sisa Ditarik & Nihilisasi Kas
          - Bukti Serah Terima Kas (Lightbox preview HD)
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-amber-200 bg-white overflow-hidden shadow-xs">
        <div className="border-b border-amber-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-600 text-white shadow-2xs">
              <ArrowDownToLine className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Riwayat Penarikan Sisa Kas & Berita Acara Pengembalian
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Transparan & Terverifikasi
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Laporan pertanggungjawaban sisa dana: pihak pengaju penarikan, petugas yang membelanjakan sampai tersisa, dan pejabat penerima kas.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-slate-600 bg-white px-2.5 py-1 rounded border border-amber-200">
              Total Sisa Ditarik: <strong className="text-amber-800">{formatRupiah(totalDitarikGlobal)}</strong>
            </span>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => handleOpenWithdrawModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition shadow-2xs"
              >
                <Plus className="h-3 w-3" />
                Tarik Sisa Kas
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead className="bg-amber-50/60 border-b border-amber-200 text-slate-700 font-semibold text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4">Tgl Tarik / Alokasi</th>
                <th className="py-3 px-4">Unit SPPG</th>
                <th className="py-3 px-4">Yang Mengajukan Penarikan</th>
                <th className="py-3 px-4">Yang Membelanjakan (Tersisa)</th>
                <th className="py-3 px-4">Yang Menerima Sisa Kas</th>
                <th className="py-3 px-4 text-center">Bukti Serah Terima</th>
                <th className="py-3 px-4 text-right">Sisa Ditarik</th>
                <th className="py-3 px-4 text-right">Sisa Akhir Kas</th>
                <th className="py-3 px-4">Keterangan / Berita Acara</th>
                {!isReadOnly && <th className="py-3 px-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBudgets.filter(b => (b.withdrawnAmount || 0) > 0).length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                    <div className="max-w-md mx-auto space-y-1">
                      <p className="font-semibold text-slate-600">Belum ada sisa kas yang ditarik untuk filter ini.</p>
                      <p className="text-[11px] text-slate-400">
                        Sisa dana operasional belanja tetap tersimpan aman di kas aktif dapur (rollover) atau Anda dapat menariknya kapan saja menjadi Rp 0.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBudgets
                  .filter(b => (b.withdrawnAmount || 0) > 0)
                  .map(item => (
                    <tr key={`withdrawn-${item.id}`} className="hover:bg-amber-50/30 transition">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 font-mono">
                          {item.withdrawnAt ? new Date(item.withdrawnAt).toLocaleDateString('id-ID') : new Date(item.allocatedDate).toLocaleDateString('id-ID')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Pagu: {new Date(item.allocatedDate).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block rounded px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {item.sppgUnitName}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-blue-900 flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>{item.withdrawnBy || 'Abdullah Syauqillah, S.Kom (Superadmin)'}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">Pemohon Penarikan</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-amber-900 flex items-center gap-1">
                          <Receipt className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>{item.withdrawnSpender || 'Tim Pengadaan Dapur'}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">Membelanjakan Kas</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-emerald-900 flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{item.withdrawnRecipient || 'Drs. Supriyanto, Ak., CA (Auditor)'}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">Penerima Kas Sisa</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.withdrawnProofUrl ? (
                          <button
                            type="button"
                            onClick={() => setActiveProofModal({
                              url: item.withdrawnProofUrl!,
                              title: `Bukti Serah Terima Sisa Kas - ${item.sppgUnitName}`,
                              meta: `Pengaju: ${item.withdrawnBy || '-'} | Penerima: ${item.withdrawnRecipient || '-'} | Pembelanja: ${item.withdrawnSpender || '-'} | Nominal: ${formatRupiah(item.withdrawnAmount || 0)}`
                            })}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold hover:bg-emerald-100 transition shadow-2xs"
                          >
                            <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Lihat Bukti HD</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Tanpa Foto</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-800 tabular-nums">
                        {formatRupiah(item.withdrawnAmount || 0)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.remainingBudget === 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Nihil (Rp 0)
                          </span>
                        ) : (
                          <span className="font-mono font-semibold text-indigo-700">
                            {formatRupiah(item.remainingBudget)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                        {item.withdrawnNote || 'Sisa kas disetor kembali ke kas utama'}
                      </td>
                      {!isReadOnly && (
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {item.remainingBudget > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleOpenWithdrawModal(item)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900 hover:bg-amber-200 transition shadow-2xs"
                            >
                              <ArrowDownToLine className="h-3 w-3" />
                              <span>Tarik Lagi</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-medium">Selesai</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table: Riwayat Pengeluaran ringkas */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Riwayat Pengeluaran (Belanja)</h2>
            <p className="text-[11px] text-slate-500">Daftar nota belanja yang memotong anggaran operasional.</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">{filteredProcurements.length} Transaksi &bull; {localUnitName}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[760px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">No. Nota</th>
                <th className="py-3 px-4">Unit SPPG</th>
                <th className="py-3 px-4">Peminta</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Total Nota</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProcurements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">Belum ada pengeluaran untuk filter ini.</td>
                </tr>
              ) : (
                filteredProcurements.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(p.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">{p.receiptNumber}</td>
                    <td className="py-2.5 px-4 text-slate-700">{p.sppgUnitName}</td>
                    <td className="py-2.5 px-4 text-slate-700">{p.requesterName}</td>
                    <td className="py-2.5 px-4 text-slate-600">{p.supplierName}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">{formatRupiah(p.actualReceiptTotal)}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${
                        p.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                        p.status === 'FLAGGED_DISCREPANCY' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {p.status === 'VERIFIED' ? 'Terverifikasi' : p.status === 'FLAGGED_DISCREPANCY' ? 'Selisih' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredProcurements.length > 0 && (
              <tfoot>
                <tr className="bg-amber-50 border-t border-amber-200">
                  <td colSpan={5} className="py-2.5 px-4 text-xs font-bold text-slate-700">TOTAL PENGELUARAN</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {formatRupiah(totalPengeluaran)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL: TAMBAH KAS MASUK BARU DENGAN TRANSPARANSI & UPLOAD BUKTI TF
      ────────────────────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-auto animate-in fade-in duration-200">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Catat Dana Masuk / Pengajuan Anggaran</h3>
                  <p className="text-xs text-slate-500">Transparansi pencatatan kas lengkap dengan bukti transfer bank</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg p-1 rounded"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Unit SPPG Tujuan */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Unit SPPG Tujuan Pembelanjaan</label>
                <select
                  value={sppgUnitId}
                  onChange={e => setSppgUnitId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="ALL">Semua SPPG (Gabungan 4 Unit Dapur)</option>
                  {sppgUnits.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Bisa dipilih satu SPPG khusus atau semua SPPG gabungan.</p>
              </div>

              {/* Periode Dana Masuk */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Tanggal / Periode Pengajuan Dana</label>
                <div className="flex rounded-md border border-slate-200 overflow-hidden mb-2">
                  {(['tanggal', 'bulan', 'tahun'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPeriodeInputMode(m)}
                      className={`flex-1 px-3 py-1.5 text-xs font-medium transition ${periodeInputMode === m ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
                {periodeInputMode === 'tanggal' && (
                  <input
                    type="date"
                    required
                    value={inputTanggal}
                    onChange={e => setInputTanggal(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                )}
                {periodeInputMode === 'bulan' && (
                  <input
                    type="month"
                    required
                    value={inputBulan}
                    onChange={e => setInputBulan(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                )}
                {periodeInputMode === 'tahun' && (
                  <select
                    value={inputTahun}
                    onChange={e => setInputTahun(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Tersimpan sebagai label fiskal: <strong className="text-slate-700">{periodeInfo.label}</strong>
                </p>
              </div>

              {/* Nominal Dana Masuk */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Nominal Dana yang Diajukan (Rp)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-bold">Rp</span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={amountAllocated}
                    onChange={e => setAmountAllocated(e.target.value)}
                    placeholder="Contoh: 170000000"
                    className="w-full rounded-md border border-slate-300 pl-10 pr-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  = <strong className="text-emerald-700">{formatRupiah(Number(amountAllocated) || 0)}</strong>
                </p>
              </div>

              {/* ── Metadata Transparansi ── */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase tracking-wide">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>Informasi Akuntabilitas & Penanggung Jawab Kas</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Yang Mengajukan Anggaran:
                    </label>
                    <input
                      type="text"
                      required
                      value={requestedBy}
                      onChange={e => setRequestedBy(e.target.value)}
                      placeholder="Nama pihak pengaju..."
                      className="w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Dimintakan Atas Nama:
                    </label>
                    <input
                      type="text"
                      required
                      value={requesterFor}
                      onChange={e => setRequesterFor(e.target.value)}
                      placeholder="Misal: Kepala Dapur / Tim Gizi"
                      className="w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Yang Memegang Uang / PIC Kas:
                  </label>
                  <input
                    type="text"
                    required
                    value={cashHolder}
                    onChange={e => setCashHolder(e.target.value)}
                    placeholder="Misal: Bendahara Dapur / Ny. Siti (Pemegang uang tunai)"
                    className="w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Nama petugas yang memegang uang kas operasional belanja di lapangan.
                  </p>
                </div>
              </div>

              {/* ── Upload Bukti Transfer (TF) dengan Kompresi Otomatis HD WebP ── */}
              <div className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                    <span>Upload Bukti TF / Setoran Bank (Transparan)</span>
                  </label>
                  <span className="text-[10px] text-blue-700 font-semibold bg-blue-100/70 px-2 py-0.5 rounded">
                    Kompresi HD WebP Otomatis
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-blue-600 text-white font-semibold cursor-pointer hover:bg-blue-700 transition shadow-2xs">
                    {isUploadingProof ? (
                      <>
                        <Sparkles className="h-3.5 w-3.5 animate-spin" />
                        <span>Mengompres & Upload...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5" />
                        <span>Pilih Foto Bukti TF (Kamera/Galeri)</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofFileUpload}
                      disabled={isUploadingProof}
                      className="hidden"
                    />
                  </label>

                  {proofCompressionInfo && (
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-md">
                      {proofCompressionInfo}
                    </span>
                  )}
                </div>

                {transferProofPreview && (
                  <div className="flex items-center gap-3 pt-2 border-t border-blue-200/60">
                    <div className="relative w-16 h-16 rounded-lg border border-blue-300 overflow-hidden bg-white shadow-xs">
                      <img src={transferProofPreview} alt="Bukti TF" className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">Bukti Transfer Berhasil Dilampirkan</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveProofModal({
                            url: transferProofPreview,
                            title: 'Preview Bukti Transfer Baru',
                            meta: `Nominal: ${formatRupiah(Number(amountAllocated) || 0)} · Pengaju: ${requestedBy}`,
                          })}
                          className="text-[11px] text-blue-600 font-semibold hover:underline"
                        >
                          Lihat Ukuran HD Penuh
                        </button>
                        <span className="text-slate-300">&bull;</span>
                        <button
                          type="button"
                          onClick={() => {
                            setTransferProofPreview('');
                            setTransferProofUrl('');
                            setProofCompressionInfo(null);
                          }}
                          className="text-[11px] text-red-600 font-semibold hover:underline"
                        >
                          Hapus Foto
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Keterangan Sumber Dana</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Misal: Pagu Operasional APBN Tahap 2 / Kas Gizi Harian"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingProof}
                  className="rounded-md bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition shadow-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pengajuan Dana'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL: BERITA ACARA PENARIKAN SISA KAS (TRANSPARAN & CERDAS)
          - Nama yang Mengajukan Penarikan
          - Nama yang Membelanjakan Sampai Tersisa (auto-detect dari transaksi belanja)
          - Nama yang Menerima Penarikan Sisa Kas (Auditor / Bendahara)
          - Pilihan Opsional: Bebas ditarik seluruhnya (Rp 0), sebagian, atau disimpan
          - Bukti Serah Terima Kas (HD WebP)
      ────────────────────────────────────────────────────────────────────────── */}
      {isWithdrawModalOpen && withdrawTargetBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-amber-300 max-w-xl w-full overflow-hidden my-auto animate-in fade-in duration-200">
            <div className="border-b border-amber-200 px-6 py-4 flex items-center justify-between bg-gradient-to-r from-amber-50 via-white to-amber-50/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white shadow-xs">
                  <ArrowDownToLine className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Berita Acara Penarikan / Pengembalian Sisa Kas</h3>
                  <p className="text-[11px] text-slate-500">Transparansi penuh pihak pengaju, pembelanja, dan penerima sisa kas.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmWithdraw} className="p-6 space-y-4 text-xs">
              {withdrawError && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 p-2.5 text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {/* Info Banner Opsional Cerdas */}
              <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-[11px] text-blue-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  <span>Sistem Kas Cerdas & Transparan</span>
                </div>
                <p className="text-blue-800 leading-relaxed">
                  Sisa kas bersifat fleksibel: Anda bebas menarik seluruh sisa kas (nihil Rp 0), menarik sebagian, atau tidak ditarik (sisa tetap mengendap aman di dapur sebagai saldo kas berjalan).
                </p>
              </div>

              {/* Dropdown Pemilihan Alokasi Anggaran */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Pilih Alokasi Anggaran Kas
                </label>
                <select
                  value={withdrawTargetBudget.id}
                  onChange={e => {
                    const picked = budgetAllocations.find(b => b.id === e.target.value);
                    if (picked) selectWithdrawTarget(picked);
                  }}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {budgetAllocations.map(b => (
                    <option key={b.id} value={b.id}>
                      {new Date(b.allocatedDate).toLocaleDateString('id-ID')} &bull; {b.sppgUnitName} &bull; Pagu: {formatRupiah(b.amountAllocated)} &bull; Sisa: {formatRupiah(b.remainingBudget)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rincian Alokasi Target */}
              <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Unit SPPG:</span>
                  <span className="font-bold text-slate-900">{withdrawTargetBudget.sppgUnitName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Tanggal Alokasi:</span>
                  <span className="font-mono text-slate-800">{new Date(withdrawTargetBudget.allocatedDate).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Dana Pagu / Telah Dibelanjakan:</span>
                  <span className="font-mono text-slate-700">
                    {formatRupiah(withdrawTargetBudget.amountAllocated)} &bull; Belanja: {formatRupiah(withdrawTargetBudget.amountRealized)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-amber-200 pt-1.5 font-mono">
                  <span className="font-semibold text-slate-700">Sisa Kas Saat Ini:</span>
                  <span className="font-bold text-indigo-700 text-sm">{formatRupiah(withdrawTargetBudget.remainingBudget)}</span>
                </div>
              </div>

              {/* Tiga Pihak Penanggung Jawab Transparansi */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 space-y-3">
                <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-700" />
                  <span>3 Pihak Penanggung Jawab Sisa Kas</span>
                </div>

                {/* 1. Yang Mengajukan Penarikan */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                      1. Nama yang Mengajukan Penarikan
                    </span>
                    <span className="text-[10px] text-blue-600 font-normal">Pemohon Penarikan</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={withdrawBy}
                    onChange={e => setWithdrawBy(e.target.value)}
                    placeholder="Misal: Abdullah Syauqillah, S.Kom (Superadmin)"
                    className="w-full rounded-md border border-slate-300 p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Pihak pengelola yang meminta atau memproses sisa kas ditarik.</p>
                </div>

                {/* 2. Yang Membelanjakan Sampai Tersisa */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Receipt className="h-3.5 w-3.5 text-amber-600" />
                      2. Nama yang Membelanjakan Sampai Tersisa
                    </span>
                    <span className="text-[10px] text-amber-600 font-normal">Petugas Belanja</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={withdrawSpender}
                    onChange={e => setWithdrawSpender(e.target.value)}
                    placeholder="Misal: Siti Aminah / Tim Pengadaan Dapur"
                    className="w-full rounded-md border border-slate-300 p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Otomatis dideteksi dari staf peminta pada transaksi belanja tanggal ini.
                  </p>
                </div>

                {/* 3. Yang Menerima Penarikan Sisa Kas */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      3. Nama yang Menerima Penarikan Sisa Kas
                    </span>
                    <span className="text-[10px] text-emerald-600 font-normal">Penerima Kas</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={withdrawRecipient}
                    onChange={e => setWithdrawRecipient(e.target.value)}
                    placeholder="Misal: Drs. Supriyanto, Ak., CA (Auditor) / Bendahara Utama"
                    className="w-full rounded-md border border-slate-300 p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Pejabat atau auditor yang menerima uang tunai / transfer pengembalian sisa kas.</p>
                </div>
              </div>

              {/* Nominal Penarikan */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 uppercase">
                    Nominal Sisa yang Ditarik (Rp)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(String(withdrawTargetBudget.remainingBudget))}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
                    >
                      Tarik Semua (100%)
                    </button>
                    {withdrawTargetBudget.remainingBudget > 0 && (
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount(String(Math.round(withdrawTargetBudget.remainingBudget / 2)))}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      >
                        50%
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-bold">Rp</span>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    max={withdrawTargetBudget.remainingBudget}
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder="Contoh: 5000000"
                    className="w-full rounded-md border border-slate-300 pl-10 pr-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span className="font-mono">= {formatRupiah(Number(withdrawAmount) || 0)}</span>
                  <span>
                    Sisa kas setelah penarikan: <strong className="font-mono text-slate-800">{formatRupiah(Math.max(0, withdrawTargetBudget.remainingBudget - (Number(withdrawAmount) || 0)))}</strong>
                  </span>
                </div>
              </div>

              {/* Tanggal Penarikan */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Tanggal Penarikan</label>
                <input
                  type="date"
                  required
                  value={withdrawDate}
                  onChange={e => setWithdrawDate(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-2 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Bukti Serah Terima Sisa Kas (HD WebP) */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700 uppercase text-[11px]">
                    Foto Bukti Serah Terima Sisa Kas (Opsional)
                  </label>
                  <span className="text-[10px] text-slate-400">Kompresi HD WebP Otomatis</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-amber-300 bg-white text-xs font-semibold text-amber-800 hover:bg-amber-50 transition shadow-2xs">
                    <Upload className="h-3.5 w-3.5 text-amber-600" />
                    <span>{isUploadingWithdrawProof ? 'Mengompres & Mengunggah...' : 'Pilih Foto Bukti Serah Terima'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleWithdrawProofUpload}
                      disabled={isUploadingWithdrawProof}
                      className="hidden"
                    />
                  </label>

                  {withdrawProofCompressionInfo && (
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-1 rounded">
                      {withdrawProofCompressionInfo}
                    </span>
                  )}
                </div>

                {withdrawProofPreview && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                    <div className="relative w-14 h-14 rounded-lg border border-amber-300 overflow-hidden bg-white shadow-2xs">
                      <img src={withdrawProofPreview} alt="Bukti Penarikan" className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800">Bukti Serah Terima Terlampir</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveProofModal({
                            url: withdrawProofPreview,
                            title: 'Preview Bukti Serah Terima Sisa Kas',
                            meta: `Nominal: ${formatRupiah(Number(withdrawAmount) || 0)} · Pengaju: ${withdrawBy} · Penerima: ${withdrawRecipient}`,
                          })}
                          className="text-[11px] text-blue-600 font-semibold hover:underline"
                        >
                          Lihat Ukuran Penuh
                        </button>
                        <span className="text-slate-300">&bull;</span>
                        <button
                          type="button"
                          onClick={() => {
                            setWithdrawProofPreview('');
                            setWithdrawProofUrl('');
                            setWithdrawProofCompressionInfo(null);
                          }}
                          className="text-[11px] text-red-600 font-semibold hover:underline"
                        >
                          Hapus Foto
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Keterangan / Berita Acara */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Berita Acara / Keterangan Penarikan</label>
                <textarea
                  rows={2}
                  value={withdrawNote}
                  onChange={e => setWithdrawNote(e.target.value)}
                  placeholder="Keterangan penutupan / berita acara pengembalian sisa kas..."
                  className="w-full rounded-md border border-slate-300 p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isWithdrawing || isUploadingWithdrawProof}
                  className="rounded-md bg-amber-600 px-5 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition shadow-xs"
                >
                  {isWithdrawing ? 'Menyimpan...' : 'Proses Penarikan Sisa Kas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          MODAL: LIGHTBOX BUKTI TF / NOTA HD PREVIEW
      ────────────────────────────────────────────────────────────────────────── */}
      {activeProofModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setActiveProofModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-5 py-3.5 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-sm">{activeProofModal.title}</h3>
                {activeProofModal.meta && (
                  <p className="text-[11px] text-slate-300 mt-0.5">{activeProofModal.meta}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveProofModal(null)}
                className="text-slate-400 hover:text-white p-1 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-950/90 min-h-[300px]">
              <img
                src={activeProofModal.url}
                alt={activeProofModal.title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded shadow-lg border border-slate-800"
              />
            </div>

            <div className="border-t border-slate-200 px-5 py-3 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500">Format Gambar HD Terkompresi WebP &bull; Ringan & Jernih</span>
              <div className="flex items-center gap-2">
                <a
                  href={activeProofModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-100 transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Buka Tab Baru
                </a>
                <button
                  type="button"
                  onClick={() => setActiveProofModal(null)}
                  className="px-4 py-1.5 rounded bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTargetId}
        title="Hapus Catatan Anggaran"
        description="Apakah Anda yakin ingin menghapus data alokasi kas operasional ini?"
        warningNote="Data alokasi anggaran kas ini akan dihapus secara permanen dari database."
        confirmText="Ya, Hapus Anggaran"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDeleteBudget}
        onClose={() => setDeleteTargetId(null)}
      />

      {/* Modern Custom Guidance / Alert Modal */}
      {alertInfo && (
        <AlertModal
          isOpen={alertInfo.isOpen}
          type={alertInfo.type || 'info'}
          title={alertInfo.title}
          message={alertInfo.message}
          highlightNote={alertInfo.highlightNote}
          actionText={alertInfo.actionText}
          onAction={alertInfo.onAction}
          onClose={() => setAlertInfo(null)}
        />
      )}
    </div>
  );
}
