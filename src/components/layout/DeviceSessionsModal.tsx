'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Laptop,
  Tablet,
  ShieldCheck,
  LogOut,
  Trash2,
  RefreshCw,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { UserSessionDto } from '@/lib/session-manager';

interface DeviceSessionsModalProps {
  onClose: () => void;
}

export function DeviceSessionsModal({ onClose }: DeviceSessionsModalProps) {
  const [sessions, setSessions] = useState<UserSessionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal konfirmasi khusus
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmVariant: 'danger' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Konfirmasi',
    confirmVariant: 'danger',
    onConfirm: () => {},
  });

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/auth/sessions?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.sessions)) {
          setSessions(json.sessions);
        }
      }
    } catch {
      // offline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Logout Perangkat Jarak Jauh (Kick Device)
  const handleRevokeSession = (sessionId: string, deviceName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Keluarkan Perangkat?',
      message: `Apakah Anda yakin ingin mengeluarkan perangkat "${deviceName}"? Perangkat tersebut akan otomatis ter-logout dan harus memasukkan kata sandi kembali untuk masuk.`,
      confirmText: 'Ya, Keluarkan Perangkat',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setActionLoadingId(sessionId);
        try {
          const res = await fetch('/api/auth/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'revoke', sessionId }),
          });
          const json = await res.json();
          if (res.ok && json.success) {
            showNotification('success', 'Perangkat berhasil dikeluarkan dari sistem.');
            await fetchSessions();
          } else {
            showNotification('error', json.error || 'Gagal mengeluarkan perangkat.');
          }
        } catch {
          showNotification('error', 'Terjadi gangguan jaringan.');
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  // Logout Semua Perangkat Lain
  const handleRevokeAllOthers = () => {
    const otherActiveCount = sessions.filter((s) => s.isActive && !s.isCurrent).length;
    if (otherActiveCount === 0) return;

    setConfirmModal({
      isOpen: true,
      title: 'Keluarkan Semua Perangkat Lain?',
      message: `Aksi ini akan mengeluarkan ${otherActiveCount} perangkat lain yang sedang login. Hanya perangkat ini yang akan tetap aktif.`,
      confirmText: 'Keluarkan Semua Perangkat Lain',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setIsRevokingAll(true);
        try {
          const res = await fetch('/api/auth/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'revoke-all-others' }),
          });
          const json = await res.json();
          if (res.ok && json.success) {
            showNotification('success', json.message || 'Semua perangkat lain telah dikeluarkan.');
            await fetchSessions();
          } else {
            showNotification('error', json.error || 'Gagal mengeluarkan perangkat.');
          }
        } catch {
          showNotification('error', 'Terjadi gangguan jaringan.');
        } finally {
          setIsRevokingAll(false);
        }
      },
    });
  };

  // Hapus Riwayat Sesi Tertentu
  const handleDeleteInactive = (sessionId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus dari Riwayat?',
      message: 'Riwayat sesi perangkat ini akan dihapus permanen dari daftar.',
      confirmText: 'Hapus Riwayat',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setActionLoadingId(sessionId);
        try {
          const res = await fetch(`/api/auth/sessions?id=${sessionId}`, {
            method: 'DELETE',
          });
          const json = await res.json();
          if (res.ok && json.success) {
            showNotification('success', 'Riwayat berhasil dihapus.');
            await fetchSessions();
          } else {
            showNotification('error', json.error || 'Gagal menghapus riwayat.');
          }
        } catch {
          showNotification('error', 'Terjadi gangguan jaringan.');
        } finally {
          setActionLoadingId(null);
        }
      },
    });
  };

  // Bersihkan Semua Riwayat Nonaktif
  const handleClearAllInactive = () => {
    const inactiveCount = sessions.filter((s) => !s.isActive).length;
    if (inactiveCount === 0) return;

    setConfirmModal({
      isOpen: true,
      title: 'Bersihkan Semua Riwayat?',
      message: `Apakah Anda ingin menghapus seluruh ${inactiveCount} riwayat perangkat yang sudah tidak aktif/logout? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Bersihkan Semua Riwayat',
      confirmVariant: 'warning',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setIsClearingAll(true);
        try {
          const res = await fetch('/api/auth/sessions?clearAll=true', {
            method: 'DELETE',
          });
          const json = await res.json();
          if (res.ok && json.success) {
            showNotification('success', json.message || 'Seluruh riwayat nonaktif berhasil dibersihkan.');
            await fetchSessions();
          } else {
            showNotification('error', json.error || 'Gagal membersihkan riwayat.');
          }
        } catch {
          showNotification('error', 'Terjadi gangguan jaringan.');
        } finally {
          setIsClearingAll(false);
        }
      },
    });
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d) + ' WIB';
    } catch {
      return dateStr;
    }
  };

  const formatRelativeTime = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      if (diffMins < 2) return 'Aktif saat ini';
      if (diffMins < 60) return `Aktif ${diffMins} menit lalu`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Aktif ${diffHours} jam lalu`;
      const diffDays = Math.floor(diffHours / 24);
      return `Aktif ${diffDays} hari lalu`;
    } catch {
      return 'Baru saja';
    }
  };

  const getDeviceIcon = (type: string) => {
    if (type === 'Mobile') return <Smartphone className="h-5 w-5 text-blue-600" />;
    if (type === 'Tablet') return <Tablet className="h-5 w-5 text-indigo-600" />;
    return <Laptop className="h-5 w-5 text-slate-700" />;
  };

  const activeSessions = sessions.filter((s) => s.isActive);
  const inactiveSessions = sessions.filter((s) => !s.isActive);
  const otherActiveSessionsCount = activeSessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto antialiased">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-white">Riwayat Login & Keamanan Perangkat</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Aman & Terverifikasi
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pantau perangkat yang masuk ke akun Anda, jam login, dan keluarkan sesi mencurigakan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Notifikasi Pop-up */}
        {notification && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center gap-2 border-b shrink-0 animate-in slide-in-from-top-2 duration-150 ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Konten Utama */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 divide-y divide-slate-100">
          {/* Card Ringkasan & Tindakan Cepat */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl p-4 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <span>Proteksi Multi-Device Aktif</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700">
                    {activeSessions.length} Perangkat Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Anti-spam login diaktifkan. Riwayat sesi disimpan rapi tanpa spam IP duplikat.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={fetchSessions}
                disabled={isLoading}
                title="Segarkan daftar perangkat"
                className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Segarkan</span>
              </button>

              {otherActiveSessionsCount > 0 && (
                <button
                  type="button"
                  onClick={handleRevokeAllOthers}
                  disabled={isRevokingAll}
                  className="h-8 px-3 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Keluarkan {otherActiveSessionsCount} Perangkat Lain</span>
                </button>
              )}
            </div>
          </div>

          {/* Bagian 1: Perangkat Sedang Aktif */}
          <div className="pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Perangkat Sedang Aktif ({activeSessions.length})
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Sesi rolling aktif 30 hari
              </span>
            </div>

            {isLoading && sessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                <span>Memuat riwayat perangkat...</span>
              </div>
            ) : activeSessions.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                Tidak ada perangkat aktif lain.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeSessions.map((s) => (
                  <div
                    key={s.id}
                    className={`p-4 rounded-xl border transition-all ${
                      s.isCurrent
                        ? 'bg-blue-50/50 border-blue-200 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200/80 shrink-0">
                          {getDeviceIcon(s.deviceType)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900">
                              {s.deviceName}
                            </span>
                            {s.isCurrent ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                                Perangkat Ini (Sedang Digunakan)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                                Sedang Aktif
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                            <span>{s.browserName}</span>
                            <span>•</span>
                            <span>{s.osName}</span>
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {s.ipAddress} ({s.location || 'Indonesia'})
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-slate-400" />
                              Masuk: {formatDateTime(s.createdAt)}
                            </span>
                            <span className="font-medium text-emerald-600">
                              {s.isCurrent ? 'Aktif saat ini' : formatRelativeTime(s.lastActiveAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Aksi */}
                      {!s.isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(s.id, s.deviceName)}
                          disabled={actionLoadingId === s.id}
                          className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold flex items-center gap-1 shrink-0 transition"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Keluarkan</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bagian 2: Riwayat Login yang Telah Logout / Sesi Berakhir */}
          <div className="pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Riwayat Login yang Telah Selesai ({inactiveSessions.length})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Perangkat yang sudah keluar dari sistem. Anda dapat menghapusnya sesuka hati.
                </p>
              </div>

              {inactiveSessions.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllInactive}
                  disabled={isClearingAll}
                  className="h-7 px-2.5 rounded-md border border-slate-200 text-[11px] text-slate-600 hover:text-red-600 hover:bg-red-50 flex items-center gap-1 transition"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Bersihkan Semua</span>
                </button>
              )}
            </div>

            {inactiveSessions.length === 0 ? (
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-center text-xs text-slate-400">
                Belum ada riwayat sesi yang keluar.
              </div>
            ) : (
              <div className="space-y-2">
                {inactiveSessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-200/70 text-slate-400 shrink-0">
                        {getDeviceIcon(s.deviceType)}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {s.deviceName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-medium">
                            {s.revokedBy === 'USER_SELF'
                              ? 'Logout Mandiri'
                              : s.revokedBy === 'REMOTE_LOGOUT'
                              ? 'Dikeluarkan Jarak Jauh'
                              : 'Sesi Selesai'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                          <span>{s.browserName} • {s.osName}</span>
                          <span>•</span>
                          <span>IP: {s.ipAddress}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Masuk: {formatDateTime(s.createdAt)} • Keluar: {formatDateTime(s.revokedAt || s.lastActiveAt)}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteInactive(s.id)}
                      disabled={actionLoadingId === s.id}
                      title="Hapus dari riwayat"
                      className="h-8 w-8 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center shrink-0 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Informasi Keamanan Tambahan */}
          <div className="pt-4">
            <div className="rounded-xl bg-blue-50/60 border border-blue-200/80 p-3.5 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-blue-900 leading-relaxed">
                <span className="font-bold">Tips Keamanan:</span> Jika Anda melihat perangkat atau lokasi yang tidak Anda kenali, segera klik tombol <span className="font-semibold text-red-600">"Keluarkan"</span> dan lakukan perubahan kata sandi di menu Akun demi mencegah akses tidak sah.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>SPPG Dapur Enterprise Security Shield</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Modal Dialog Konfirmasi Interaktif */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-full shrink-0 ${
                  confirmModal.confirmVariant === 'danger'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">{confirmModal.title}</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{confirmModal.message}</p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-100 font-medium transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold text-white shadow-sm transition ${
                  confirmModal.confirmVariant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
