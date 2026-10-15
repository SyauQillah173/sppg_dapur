'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User, Eye, EyeOff, CheckCircle2, ArrowRight, AlertCircle, Building2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const userToSubmit = customUser !== undefined ? customUser : username;
    const passToSubmit = customPass !== undefined ? customPass : password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userToSubmit,
          password: passToSubmit,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login gagal. Silakan periksa kembali data Anda.');
      }

      // Success: redirect to dashboard
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi gangguan koneksi ke server.');
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role: 'SUPERADMIN' | 'AUDITOR') => {
    if (role === 'SUPERADMIN') {
      setUsername('superadmin');
      setPassword('admin123');
      handleLogin(undefined, 'superadmin', 'admin123');
    } else {
      setUsername('auditor');
      setPassword('auditor123');
      handleLogin(undefined, 'auditor', 'auditor123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-800 antialiased font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo & Header */}
        <div className="flex justify-center mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md font-bold text-lg">
            GF
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          SPPG Private Portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Sistem Manajemen Operasional, Logistik & Keuangan Dapur
        </p>

        {/* Security Notice */}
        <div className="mt-3 mx-4 sm:mx-0 flex items-center justify-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-3 py-1.5 text-[11px] text-amber-800">
          <Lock className="h-3 w-3 shrink-0 text-amber-600" />
          <span>Sistem Tertutup Private Internal &bull; Akses Hanya untuk Petugas Resmi</span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:rounded-xl sm:px-10">
          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={(e) => handleLogin(e)}>
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Username Akun
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda..."
                  className="block w-full rounded-md border border-slate-300 pl-10 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda..."
                  className="block w-full rounded-md border border-slate-300 pl-10 pr-10 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                id="btn-login-submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 rounded-md bg-slate-900 py-2.5 px-4 text-sm font-semibold text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 transition"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi Akses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick 1-Click Access for Testing / Evaluation */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Pilihan Cepat Masuk (Akun Uji Bawaan)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                id="quick-login-superadmin"
                onClick={() => handleQuickLogin('SUPERADMIN')}
                disabled={isLoading}
                className="flex flex-col items-start p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-left transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>1. Superadmin</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">Penanggung Jawab Utama</span>
                <span className="text-[10px] font-mono text-slate-400 mt-1">superadmin / admin123</span>
              </button>

              <button
                type="button"
                id="quick-login-auditor"
                onClick={() => handleQuickLogin('AUDITOR')}
                disabled={isLoading}
                className="flex flex-col items-start p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-left transition"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>2. Admin 2 (Pemantau)</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">View & Audit Only</span>
                <span className="text-[10px] font-mono text-slate-400 mt-1">auditor / auditor123</span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-[11px] text-slate-400">
              Pendaftaran akun baru hanya dapat dilakukan oleh Superadmin di dalam sistem (Menu Kelola Admin).
            </p>
          </div>
        </div>

        {/* 4 Units Footer List */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <Building2 className="h-3 w-3" />
          <span>Melayani 4 Unit SPPG: Abar Abir 02 &bull; Banjarsari 02 &bull; Dahan Rejo 01 &bull; Semampir</span>
        </div>
      </div>
    </div>
  );
}
