'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { SppgUnitId, SupplierDirectory, EmployeeDirectory } from '@/lib/types';
import { formatIDR, formatNumber } from '@/lib/utils';
import {
  Users2,
  Building,
  Plus,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
  Star,
  X,
  Search,
  Lock,
} from 'lucide-react';

export function SupplierEmployeeModule() {
  const {
    suppliers,
    employees,
    sppgUnits,
    selectedSppgUnit,
    setSelectedSppgUnit,
    addSupplier,
    addEmployee,
    userRole,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'suppliers' | 'employees'>('suppliers');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Supplier modal
  const [showAddSupplierModal, setShowAddSupplierModal] = useState<boolean>(false);
  const [supName, setSupName] = useState<string>('');
  const [supPic, setSupPic] = useState<string>('');
  const [supPhone, setSupPhone] = useState<string>('');
  const [supAddress, setSupAddress] = useState<string>('');
  const [supBank, setSupBank] = useState<string>('');
  const [supCat, setSupCat] = useState<string>('Sayuran, Buah-buahan');

  // Add Employee modal
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState<boolean>(false);
  const [empName, setEmpName] = useState<string>('');
  const [empRole, setEmpRole] = useState<string>('Koordinator Pengadaan');
  const [empUnit, setEmpUnit] = useState<SppgUnitId>('SPPG-AA02');
  const [empPhone, setEmpPhone] = useState<string>('');

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName) return;
    addSupplier({
      name: supName,
      picName: supPic,
      phone: supPhone,
      address: supAddress,
      bankAccount: supBank,
      suppliedCategory: supCat,
      activeStatus: true,
      rating: 5.0,
    });
    setSupName('');
    setSupPic('');
    setSupPhone('');
    setSupAddress('');
    setSupBank('');
    setShowAddSupplierModal(false);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName) return;
    const unitObj = sppgUnits.find((u) => u.id === empUnit);
    addEmployee({
      name: empName,
      roleTitle: empRole,
      sppgUnitId: empUnit,
      sppgUnitName: unitObj?.name || '',
      phone: empPhone,
      complianceScore: 100,
      status: 'ACTIVE',
    });
    setEmpName('');
    setEmpPhone('');
    setShowAddEmployeeModal(false);
  };

  // Filtered employees per selected SPPG unit
  const filteredEmployees = employees.filter((emp) => {
    if (selectedSppgUnit !== 'ALL' && emp.sppgUnitId !== selectedSppgUnit) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return emp.name.toLowerCase().includes(q) || emp.employeeNumber.toLowerCase().includes(q) || emp.roleTitle.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter((sup) => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return sup.name.toLowerCase().includes(q) || sup.code.toLowerCase().includes(q) || sup.picName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              Direktori Rekanan CV / Supplier & Kontrol Tim Dapur SPPG
            </h1>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
              {suppliers.length} CV & {employees.length} Karyawan
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Manajemen verifikasi kredibilitas vendor, riwayat pencairan dana, dan tracking kepatuhan SPJ tim belanja 4 unit
          </p>
        </div>

        {userRole === 'SUPERADMIN' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddSupplierModal(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <Plus className="h-3.5 w-3.5 text-blue-600" />
              <span>Tambah Rekanan CV</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddEmployeeModal(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Petugas Dapur</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
            <Lock className="h-3.5 w-3.5" />
            <span>Mode Auditor (Akses Tambah CV & Petugas Terkunci - Read Only)</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'suppliers'
                ? 'border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300'
            }`}
          >
            <Building className="h-3.5 w-3.5" />
            <span>Rekanan CV / Supplier ({suppliers.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-semibold border-b-2 transition ${
              activeTab === 'employees'
                ? 'border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-zinc-300'
            }`}
          >
            <Users2 className="h-3.5 w-3.5" />
            <span>Kontrol Peminta Belanja & Karyawan ({employees.length})</span>
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'suppliers' ? 'Cari nama CV / PIC...' : 'Cari nama / NIK karyawan...'}
            className="w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 py-1 text-xs text-slate-800 placeholder:text-slate-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          />
        </div>
      </div>

      {/* TAB 1: SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSuppliers.map((sup) => (
            <div
              key={sup.id}
              className="p-4 rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">{sup.code}</span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 dark:bg-amber-950 dark:border-amber-900">
                      <Star className="h-3 w-3 fill-amber-500" />
                      {Number(sup.rating).toFixed(1)}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100 mt-0.5">
                    {sup.name}
                  </h3>
                  <span className="inline-block mt-1 text-[11px] font-medium text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    Pasokan: {sup.suppliedCategory}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase">Total Realisasi Bayar</span>
                  <div className="font-mono font-bold text-sm text-slate-900 dark:text-zinc-100">
                    {formatIDR(sup.totalDisbursed)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{sup.totalTransactions} Transaksi SPJ</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800 pt-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{sup.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>PIC: <strong>{sup.picName}</strong> ({sup.phone})</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <CreditCard className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{sup.bankAccount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: EMPLOYEES & REQUESTER CONTROL */}
      {activeTab === 'employees' && (
        <div className="space-y-3">
          {/* Unit selector */}
          <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 dark:bg-zinc-900 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Unit SPPG:</span>
              <select
                value={selectedSppgUnit}
                onChange={(e) => setSelectedSppgUnit(e.target.value as any)}
                className="rounded border border-slate-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 font-medium"
              >
                <option value="ALL">Semua SPPG (4 Unit Dapur)</option>
                {sppgUnits.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <span className="text-slate-500 font-mono">
              Memantau Akuntabilitas Pengambilan Kasbon & Penyerahan Bukti Nota
            </span>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 dark:bg-zinc-800/60 dark:border-zinc-800 text-slate-500 font-semibold text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">No. Identitas (NIK)</th>
                    <th className="py-2.5 px-3">Nama Petugas Belanja</th>
                    <th className="py-2.5 px-3">Jabatan</th>
                    <th className="py-2.5 px-3">Unit SPPG Dapur</th>
                    <th className="py-2.5 px-3 text-right">Total Dana Diminta</th>
                    <th className="py-2.5 px-3 text-right">Realisasi Nota</th>
                    <th className="py-2.5 px-3 text-right">Saldo Kas Belum Setor</th>
                    <th className="py-2.5 px-3 text-center">Kepatuhan Nota SPJ</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40">
                      <td className="py-2.5 px-3 font-mono text-slate-500 font-medium">{emp.employeeNumber}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-zinc-100">{emp.name}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400">{emp.roleTitle}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-zinc-200">{emp.sppgUnitName}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-zinc-300">
                        {formatIDR(emp.totalRequested)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-zinc-100">
                        {formatIDR(emp.totalRealized)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                        {formatIDR(emp.pendingBalance)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1 font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900 text-[11px]">
                          <CheckCircle2 className="h-3 w-3" />
                          {emp.complianceScore}% Tertib
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          Aktif
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUPPLIER */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">Tambah Rekanan CV / Supplier</h3>
              <button onClick={() => setShowAddSupplierModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300">Nama Perusahaan / CV:</label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="Contoh: CV Berkah Pangan Mandiri"
                  className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">Nama PIC:</label>
                  <input
                    type="text"
                    required
                    value={supPic}
                    onChange={(e) => setSupPic(e.target.value)}
                    placeholder="Nama kontak"
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">No. Telepon / WA:</label>
                  <input
                    type="text"
                    required
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-mono dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300">Alamat Gudang / Kantor:</label>
                <input
                  type="text"
                  required
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  placeholder="Alamat lengkap di Gresik / Surabaya"
                  className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300">Kategori Bahan Pasokan:</label>
                <input
                  type="text"
                  required
                  value={supCat}
                  onChange={(e) => setSupCat(e.target.value)}
                  placeholder="e.g. Protein Hewani, Sayuran Segar"
                  className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300">Rekening Bank untuk Pembayaran SPJ:</label>
                <input
                  type="text"
                  required
                  value={supBank}
                  onChange={(e) => setSupBank(e.target.value)}
                  placeholder="Bank Mandiri 142-00-xxxx-1 an CV Pangan"
                  className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-mono dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddSupplierModal(false)} className="rounded px-3 py-1.5 border">Batal</button>
                <button type="submit" className="rounded bg-slate-900 text-white px-4 py-1.5 font-semibold dark:bg-slate-100 dark:text-slate-900">Simpan Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EMPLOYEE */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">Tambah Petugas Dapur SPPG</h3>
              <button onClick={() => setShowAddEmployeeModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSaveEmployee} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300">Nama Lengkap Petugas:</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="e.g. Ahmad Riyadi"
                  className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">Jabatan:</label>
                  <input
                    type="text"
                    required
                    value={empRole}
                    onChange={(e) => setEmpRole(e.target.value)}
                    placeholder="e.g. Asisten Juru Masak"
                    className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">Unit SPPG:</label>
                  <select
                    value={empUnit}
                    onChange={(e) => setEmpUnit(e.target.value as SppgUnitId)}
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {sppgUnits.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300">No. Kontak Handphone:</label>
                <input
                  type="text"
                  required
                  value={empPhone}
                  onChange={(e) => setEmpPhone(e.target.value)}
                  placeholder="0812-xxxx-xxxx"
                  className="mt-1 w-full rounded border border-slate-300 px-2.5 py-1.5 font-mono dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddEmployeeModal(false)} className="rounded px-3 py-1.5 border">Batal</button>
                <button type="submit" className="rounded bg-slate-900 text-white px-4 py-1.5 font-semibold dark:bg-slate-100 dark:text-slate-900">Simpan Staf</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
