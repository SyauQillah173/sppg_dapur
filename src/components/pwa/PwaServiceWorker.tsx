'use client';

import { useEffect } from 'react';

export function PwaServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Segera periksa pembaruan Service Worker saat aplikasi dibuka
          try {
            reg.update();
          } catch {}

          // Check for sw update
          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (installing) {
              installing.onstatechange = () => {
                if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update available
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('SW registration skipped:', err);
        });
    }
  }, []);

  return null;
}
