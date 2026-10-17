'use client';

import React, { useState, useEffect } from 'react';
import { DownloadCloud, CheckCircle2, Smartphone, X } from 'lucide-react';
import { AlertModal } from '@/components/ui/AlertModal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaInstallButtonProps {
  className?: string;
  variant?: 'header' | 'mobile' | 'badge';
}

export function PwaInstallButton({ className = '', variant = 'header' }: PwaInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [showChromeModal, setShowChromeModal] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) return;

    if (isIos) {
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowChromeModal(true);
    }
  };

  if (isInstalled) {
    if (variant === 'badge') return null;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        title="Aplikasi SPPG Dapur telah terpasang di perangkat ini"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        <span className="hidden sm:inline">Aplikasi Terpasang</span>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Download / Install SPPG Dapur langsung ke perangkat Anda"
        className={`inline-flex items-center justify-center gap-1.5 font-medium transition cursor-pointer ${
          variant === 'header'
            ? 'h-8 px-2.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[12px] shadow-sm'
            : variant === 'mobile'
            ? 'w-full h-9 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-[12px] shadow'
            : 'h-8 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs shadow-sm'
        } ${className}`}
      >
        <DownloadCloud className="h-3.5 w-3.5" />
        <span>Install Aplikasi</span>
      </button>

      {/* iOS Modal Guide */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-sm">Pasang di iPhone / iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs text-slate-600">
              <p>Untuk memasang SPPG Dapur di layar utama perangkat Apple Anda:</p>
              <ol className="list-decimal list-inside space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <li>Buka di peramban <strong>Safari</strong>.</li>
                <li>Ketuk ikon <strong>Bagikan (Share)</strong> di bilah bawah peramban.</li>
                <li>Gulir dan pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</li>
              </ol>
            </div>
            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="w-full py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Modern Chrome Modal Guide */}
      <AlertModal
        isOpen={showChromeModal}
        type="info"
        title="Pasang Aplikasi di Google Chrome"
        message="Anda dapat mengunduh dan memasang SPPG Dapur langsung ke perangkat komputer/laptop tanpa perlu membuka tab browser lagi."
        highlightNote='Langkah Cepat: Klik ikon titik tiga (⋮) di pojok kanan atas browser Chrome Anda -> pilih menu "Simpan dan Bagikan" -> lalu klik "Install SPPG Dapur", atau klik ikon Komputer/Download di sebelah kanan bilah URL.'
        closeText="Saya Mengerti"
        onClose={() => setShowChromeModal(false)}
      />
    </>
  );
}
