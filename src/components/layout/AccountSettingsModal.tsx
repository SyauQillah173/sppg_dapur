'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { KeyRound, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AccountSettingsModalProps {
  onClose: () => void;
}

/**
 * Ubah username / password akun yang sedang login.
 * Setelah berhasil, sesi ditutup otomatis supaya user login ulang dengan data baru.
 */
export function AccountSettingsModal({ onClose }: AccountSettingsModalProps) {
  const { currentUser, logout } = useStore();

  const [username, setUsername] = useState(currentUser?.username || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [doneMsg, setDoneMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentUser?.id) {
      setErrorMsg('Sesi tidak dikenal. Silakan login ulang.');
      return;
    }
    if (username.trim().length < 3) {
      setErrorMsg('Username minimal 3 karakter.');
      return;
    }
    if (password && password.length < 8) {
      setErrorMsg('Password minimal 8 karakter.');
      return;
    }
    if (password && password !== confirm) {
      setErrorMsg('Konfirmasi password tidak sama.');
      return;
    }
    if (username.trim().toLowerCase() === currentUser.username && !password) {
      setErrorMsg('Tidak ada perubahan: username sama dan password kosong.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin-users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), ...(password ? { password } : {}) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal menyimpan perubahan.');

      const newUsername = data.data?.username || username.trim();
      setDoneMsg(`Akun diperbarui. Login ulang dengan username "${newUsername}"${password ? ' dan password baru' : ''}...`);
      // Beri jeda sebentar supaya pesan terbaca, lalu sesi ditutup.
      setTimeout(() => {
        logout();
      }, 1600);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-slate-700" />
            <h3 className="font-semibold text-slate-900 text-sm">Ubah Username & Password</h3>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-900">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Kamu bisa mengganti username dan password akun ini sendiri. Setelah disimpan, kamu
            otomatis keluar dan harus login ulang memakai username & password yang baru.
          </p>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {doneMsg && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{doneMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSaving || !!doneMsg}
              autoComplete="username"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <p className="text-[11px] text-slate-400 mt-1">3-64 karakter, huruf kecil, tanpa spasi.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Password Baru <span className="text-slate-400 font-normal">(kosongkan kalau tidak diganti)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSaving || !!doneMsg}
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Ulangi Password Baru</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={isSaving || !password || !!doneMsg}
              autoComplete="new-password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={isSaving}
              className="rounded-md border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
              Batal
            </button>
            <button type="submit" disabled={isSaving || !!doneMsg}
              className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition">
              {isSaving ? 'Menyimpan...' : 'Simpan & Keluar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
