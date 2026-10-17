'use client';

import React, { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // ── Otomatis deteksi & pulihkan sesi saat PWA / browser dibuka kembali ─────
  useEffect(() => {
    let cancelled = false;

    const verifyExistingSession = async () => {
      try {
        // 1. Cek langsung via cookie HTTP-only yang masih berlaku
        const meRes = await fetch('/api/auth/me', { cache: 'no-store' });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData?.success && meData?.user) {
            try {
              if (meData.token) localStorage.setItem('giziflow_session_token', meData.token);
              localStorage.setItem('giziflow_session_user', JSON.stringify(meData.user));
            } catch {}
            window.location.replace('/');
            return;
          }
        }

        // 2. Jika cookie belum terbaca oleh browser/PWA launcher, pulihkan via backup token di localStorage
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('giziflow_session_token') : null;
        if (storedToken) {
          const restoreRes = await fetch('/api/auth/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: storedToken }),
          });
          if (restoreRes.ok) {
            const restoreData = await restoreRes.json();
            if (restoreData?.success && restoreData?.user) {
              try {
                if (restoreData.token) localStorage.setItem('giziflow_session_token', restoreData.token);
                localStorage.setItem('giziflow_session_user', JSON.stringify(restoreData.user));
              } catch {}
              window.location.replace('/');
              return;
            }
          }
        }
      } catch {
        // Offline atau gangguan koneksi
      }

      if (!cancelled) {
        setIsCheckingSession(false);
      }
    };

    verifyExistingSession();

    return () => {
      cancelled = true;
    };
  }, []);

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

      // Simpan backup token di localStorage untuk PWA offline-safe / app-swipe survival
      if (data.token) {
        try {
          localStorage.setItem('giziflow_session_token', data.token);
          if (data.user) {
            localStorage.setItem('giziflow_session_user', JSON.stringify(data.user));
          }
        } catch {
          // ignore localStorage quota
        }
      }

      window.location.replace('/');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gangguan koneksi ke server.');
      setIsLoading(false);
    }
  };

  // Splash loader saat memeriksa sesi aktif
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 antialiased text-white">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-blue-500/30 blur-md animate-pulse" />
            <img
              src="/badan-gizi.png"
              alt="Badan Gizi SPPG Logo"
              className="relative h-16 w-16 rounded-full object-contain p-1 bg-white shadow-xl border border-slate-700"
            />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-white tracking-wide">SPPG Dapur Enterprise</h2>
            <p className="text-xs text-slate-400 font-mono">Memeriksa status sesi login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12 antialiased">
      <div className="w-full max-w-[380px]">
        {/* Brand */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-8">
            <img
              src="/badan-gizi.png"
              alt="Badan Gizi SPPG Logo"
              className="h-11 w-11 rounded-full object-contain shadow-xs border border-slate-200/80 shrink-0 bg-white"
            />
            <span className="text-sm font-semibold text-slate-900">SPPG Dapur</span>
          </div>
          <h1 className="text-[22px] font-semibold text-slate-900 leading-tight">
            Masuk ke sistem
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Gunakan akun yang terdaftar untuk mengakses portal.
          </p>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mb-5 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-[13px] text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label htmlFor="username" className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="w-full h-10 rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 rounded-md border border-slate-300 bg-white pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 rounded-md bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 transition"
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-8 text-center text-[12px] text-slate-400">
          Sistem internal SPPG Dapur — 4 Unit Sentra Pemenuhan Gizi
        </p>
      </div>
    </div>
  );
}
