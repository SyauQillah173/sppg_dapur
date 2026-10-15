'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Building2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login gagal. Periksa kembali data Anda.');
      }

      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi gangguan koneksi ke server.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-stone-100 flex flex-col items-center justify-center px-4 py-10 sm:py-16 antialiased font-sans">
      <div className="w-full max-w-sm sm:max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-900 text-white shadow-lg mb-4 select-none">
            <span className="font-black text-xl tracking-tight">GF</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            SPPG Private Portal
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed px-2">
            Sistem Manajemen Operasional, Logistik &amp; Keuangan Dapur
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-8 sm:px-10">

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-6">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="text-[11px] font-medium text-slate-600 text-center">
              Sistem Tertutup &middot; Akses Hanya untuk Petugas Resmi
            </span>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-600 uppercase tracking-widest mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username..."
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  className="block w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-11 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-800/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-slate-900 py-3 px-4 text-sm font-bold text-white shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 transition-all"
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

          {/* Info */}
          <p className="mt-6 text-center text-[11px] text-slate-400 leading-relaxed">
            Pendaftaran akun baru hanya dapat dilakukan oleh Superadmin
            melalui Menu Kelola Admin di dalam sistem.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center px-4">
          <Building2 className="h-3 w-3 shrink-0" />
          <span>Melayani 4 Unit SPPG: Abar Abir 02 &middot; Banjarsari 02 &middot; Dahan Rejo 01 &middot; Semampir</span>
        </div>

      </div>
    </div>
  );
}
