'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { playNotificationChime } from '@/lib/audio';
import { formatIDR } from '@/lib/utils';
import {
  Bell,
  CheckCheck,
  Wallet,
  Receipt,
  Boxes,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';

export interface SystemNotificationItem {
  id: string;
  type: string; // 'BUDGET_ADDED' | 'PROCUREMENT_ADDED' | 'STOCK_MUTATION'
  title: string;
  message: string;
  actorName: string;
  amount: number | null;
  unitName: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  onNavigateTab?: (tab: 'dashboard' | 'budget' | 'procurement' | 'inventory' | 'cms') => void;
}

export function NotificationCenter({ onNavigateTab }: NotificationCenterProps) {
  const { userRole, refreshFromDb } = useStore();
  const [notifications, setNotifications] = useState<SystemNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [toastQueue, setToastQueue] = useState<SystemNotificationItem[]>([]);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    mode: 'ALL' | 'READ' | 'SINGLE';
    targetItem?: SystemNotificationItem;
  }>({
    isOpen: false,
    mode: 'ALL',
  });
  const lastKnownIdRef = useRef<string | null>(null);
  const isFirstLoadRef = useRef(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(false);
  const [isTestingNotif, setIsTestingNotif] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasNotificationPermission(Notification.permission === 'granted');
    }
  }, []);

  // Universal Push Notification Helper that works on Android PWA, Chrome Mobile, and Desktop
  const triggerDeviceNotification = useCallback(async (title: string, message: string) => {
    if (typeof window === 'undefined') return;

    // 1. Physical vibration for mobile devices (haptic alert)
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch {}

    // 2. Check notification permissions
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const notificationOptions = {
      body: message,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200] as any,
      data: { url: '/' },
      tag: 'sppg-dapur-realtime',
    };

    // 3. Service Worker registration.showNotification (CRITICAL for Chrome Android & Installed PWA)
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && typeof reg.showNotification === 'function') {
          await reg.showNotification(title, notificationOptions);
          return;
        }
      } catch (swErr) {
        console.warn('Service worker showNotification fallback:', swErr);
      }
    }

    // 4. Desktop constructor fallback
    try {
      new Notification(title, notificationOptions);
    } catch (err) {
      console.warn('Native notification constructor failed:', err);
    }
  }, []);

  // Request browser desktop / mobile notification permission on user interaction
  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setHasNotificationPermission(true);
          playNotificationChime();
          await triggerDeviceNotification(
            '🔔 Notifikasi SPPG Dapur Aktif!',
            'Perangkat HP Anda berhasil terhubung dengan sistem. Update alokasi kas, belanja, dan sisa kas akan masuk realtime.'
          );
        }
      } catch (e) {
        console.warn('Permission request error:', e);
      }
    }
  };

  // Test Notification on mobile device
  const handleTestDeviceNotification = async () => {
    setIsTestingNotif(true);
    playNotificationChime();
    await triggerDeviceNotification(
      '🔊 Uji Notifikasi & Getar Berhasil!',
      'Sistem notifikasi realtime SPPG Dapur berfungsi sempurna di perangkat ini. Kepala SPPG & Auditor siap menerima pembaruan transaksi.'
    );
    setTimeout(() => setIsTestingNotif(false), 2000);
  };

  // Fetch notifications and trigger live sync
  const pollNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?limit=25&_t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) return;

      const items: SystemNotificationItem[] = json.data;
      setNotifications(items);
      setUnreadCount(json.unreadCount || 0);

      // Detect new incoming notifications after initial load
      if (!isFirstLoadRef.current && items.length > 0) {
        const topItem = items[0];
        if (lastKnownIdRef.current && topItem.id !== lastKnownIdRef.current) {
          // Find all newly arrived items
          const newItems: SystemNotificationItem[] = [];
          for (const item of items) {
            if (item.id === lastKnownIdRef.current) break;
            newItems.push(item);
          }

          if (newItems.length > 0) {
            // 1. Play audio chime
            playNotificationChime();

            // 2. Trigger Universal Android PWA / Mobile Push Notification & Vibration
            const latest = newItems[0];
            triggerDeviceNotification(latest.title, latest.message);

            // 3. Queue in-app floating toast
            setToastQueue((prev) => [...newItems.slice(0, 3), ...prev].slice(0, 5));

            // 4. CRITICAL: Automatically trigger live data refresh in the background!
            // When Superadmin adds budget or procurement, Pemantau's screen updates live!
            refreshFromDb();
          }
        }
      }

      if (items.length > 0) {
        lastKnownIdRef.current = items[0].id;
      }
      isFirstLoadRef.current = false;
    } catch {
      // offline fallback
    }
  }, [refreshFromDb]);

  // Heartbeat polling every 4.5 seconds
  useEffect(() => {
    pollNotifications();
    const interval = setInterval(pollNotifications, 4500);
    return () => clearInterval(interval);
  }, [pollNotifications]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_ALL_READ' }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  // Open modern modal for single notification delete
  const openSingleDeleteConfirm = (item: SystemNotificationItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteModalState({
      isOpen: true,
      mode: 'SINGLE',
      targetItem: item,
    });
  };

  // Open modern modal for clear all notifications (Anti window.confirm bawaan!)
  const openClearAllConfirm = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (notifications.length === 0) return;
    setDeleteModalState({
      isOpen: true,
      mode: 'ALL',
    });
  };

  // Open modern modal for clear read notifications
  const openClearReadConfirm = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteModalState({
      isOpen: true,
      mode: 'READ',
    });
  };

  // Execute deletion based on mode
  const handleExecuteDelete = async () => {
    if (deleteModalState.mode === 'ALL') {
      setNotifications([]);
      setUnreadCount(0);
      setToastQueue([]);
      setDeleteModalState({ isOpen: false, mode: 'ALL' });

      try {
        await fetch('/api/notifications?action=all', {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to clear notifications:', err);
      }
    } else if (deleteModalState.mode === 'READ') {
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      setDeleteModalState({ isOpen: false, mode: 'READ' });

      try {
        await fetch('/api/notifications?action=read', {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to clear read notifications:', err);
      }
    } else if (deleteModalState.mode === 'SINGLE' && deleteModalState.targetItem) {
      const targetId = deleteModalState.targetItem.id;
      const target = notifications.find((n) => n.id === targetId);
      setNotifications((prev) => prev.filter((n) => n.id !== targetId));
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      dismissToast(targetId);
      setDeleteModalState({ isOpen: false, mode: 'SINGLE' });

      try {
        await fetch(`/api/notifications?id=${targetId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to delete notification:', err);
      }
    }
  };

  // Remove toast
  const dismissToast = (id: string) => {
    setToastQueue((prev) => prev.filter((t) => t.id !== id));
  };

  // Navigate on notification click
  const handleItemClick = (item: SystemNotificationItem) => {
    setIsOpen(false);
    dismissToast(item.id);

    if (item.type === 'BUDGET_ADDED') {
      onNavigateTab?.('budget');
    } else if (item.type === 'PROCUREMENT_ADDED') {
      onNavigateTab?.('procurement');
    } else if (item.type === 'STOCK_MUTATION') {
      onNavigateTab?.('inventory');
    } else {
      onNavigateTab?.('dashboard');
    }
  };

  // Format relative time in Indonesian
  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000));
    if (diff < 15) return 'Baru saja';
    if (diff < 60) return `${diff} detik lalu`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    return `${Math.floor(hours / 24)} hari lalu`;
  };

  const getIcon = (type: string) => {
    if (type === 'BUDGET_ADDED') return <Wallet className="h-4 w-4 text-emerald-600" />;
    if (type === 'PROCUREMENT_ADDED') return <Receipt className="h-4 w-4 text-blue-600" />;
    return <Boxes className="h-4 w-4 text-purple-600" />;
  };

  return (
    <>
      {/* Notification Bell Button in Header */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            requestNotificationPermission();
          }}
          title="Notifikasi Aktivitas Realtime"
          className="relative h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold tracking-wide">Notifikasi Realtime</span>
                {unreadCount > 0 && (
                  <span className="rounded bg-rose-500/80 px-1.5 py-0.2 text-[10px] font-mono font-bold">
                    {unreadCount} Baru
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    title="Tandai semua sudah dibaca"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <CheckCheck className="h-3 w-3" />
                    <span className="hidden sm:inline">Tandai Dibaca</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={openClearAllConfirm}
                    title="Hapus semua riwayat notifikasi"
                    className="inline-flex items-center gap-1 text-[11px] text-rose-300 hover:text-rose-100 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus Semua</span>
                  </button>
                )}
              </div>
            </div>

            {/* Push Notification Device Status & Test Banner */}
            <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px]">
                {hasNotificationPermission ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Notifikasi HP Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Notifikasi HP Belum Diizinkan
                  </span>
                )}
              </div>

              {hasNotificationPermission ? (
                <button
                  type="button"
                  onClick={handleTestDeviceNotification}
                  disabled={isTestingNotif}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                >
                  {isTestingNotif ? 'Mengirim Tes...' : '🔊 Tes Notif HP'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shadow-2xs"
                >
                  Izinkan Notif
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                  Belum ada aktivitas transaksi baru.
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`group p-3.5 flex items-start gap-3 transition cursor-pointer hover:bg-slate-50 relative ${
                      !item.isRead ? 'bg-blue-50/40' : 'bg-white'
                    }`}
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
                      {getIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-900 truncate pr-2">
                          {item.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono text-slate-400">
                            {formatTimeAgo(item.createdAt)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => openSingleDeleteConfirm(item, e)}
                            title="Hapus notifikasi ini"
                            className="opacity-70 sm:opacity-0 group-hover:opacity-100 transition flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.message}
                      </p>
                      {item.amount !== null && item.amount > 0 && (
                        <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                          <span className="font-bold text-slate-900">{formatIDR(item.amount)}</span>
                          <span className="text-[10px] text-blue-600 font-sans font-medium flex items-center gap-0.5">
                            Lihat Detail &rarr;
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px]">
              <span className="text-[10px] text-slate-500 font-mono">
                {notifications.length} notifikasi tersimpan
              </span>
              {notifications.some((n) => n.isRead) && (
                <button
                  type="button"
                  onClick={openClearReadConfirm}
                  className="inline-flex items-center gap-1 text-[10px] text-slate-600 hover:text-rose-600 font-medium transition cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Bersihkan yang sudah dibaca</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Real-time Toast Notifications */}
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toastQueue.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl text-slate-900 animate-in slide-in-from-top-4 fade-in duration-200"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-200">
              {getIcon(toast.type)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-900">{toast.title}</span>
                <span className="text-[10px] font-mono text-slate-400">Baru</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">{toast.message}</p>
              {toast.amount !== null && toast.amount > 0 && (
                <div className="mt-1 font-mono text-xs font-bold text-slate-900">
                  {formatIDR(toast.amount)}
                </div>
              )}
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleItemClick(toast)}
                  className="px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 transition"
                >
                  Lihat Transaksi
                </button>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="px-2 py-1 rounded-md text-[11px] text-slate-500 hover:text-slate-700 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Modern Confirm Modal for Notification Deletion & Clearing (Anti window.confirm Bawaan Browser!) */}
      <ConfirmDeleteModal
        isOpen={deleteModalState.isOpen}
        title={
          deleteModalState.mode === 'ALL'
            ? 'Bersihkan Seluruh Riwayat Notifikasi?'
            : deleteModalState.mode === 'READ'
            ? 'Bersihkan Notifikasi yang Sudah Dibaca?'
            : 'Hapus Notifikasi Ini?'
        }
        description={
          deleteModalState.mode === 'ALL'
            ? `Apakah Anda yakin ingin menghapus semua ${notifications.length} riwayat aktivitas notifikasi dari sistem?`
            : deleteModalState.mode === 'READ'
            ? 'Notifikasi lama yang telah Anda lihat akan dibersihkan dari daftar.'
            : 'Apakah Anda yakin ingin menghapus pesan notifikasi terpilih ini?'
        }
        itemName={
          deleteModalState.mode === 'SINGLE' && deleteModalState.targetItem
            ? `[${deleteModalState.targetItem.title}] ${deleteModalState.targetItem.message}`
            : undefined
        }
        warningNote={
          deleteModalState.mode === 'ALL'
            ? 'Seluruh tumpukan riwayat notifikasi akan dihapus permanen dari database.'
            : deleteModalState.mode === 'READ'
            ? 'Notifikasi baru/penting yang belum dibaca akan tetap tersimpan aman.'
            : 'Notifikasi ini akan dihapus permanen dari riwayat sistem.'
        }
        confirmText={
          deleteModalState.mode === 'ALL'
            ? 'Ya, Bersihkan Semua'
            : deleteModalState.mode === 'READ'
            ? 'Ya, Bersihkan'
            : 'Ya, Hapus Notifikasi'
        }
        cancelText="Batal"
        onConfirm={handleExecuteDelete}
        onClose={() => setDeleteModalState({ isOpen: false, mode: 'ALL' })}
      />
    </>
  );
}
