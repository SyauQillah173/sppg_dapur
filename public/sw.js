// Service Worker for SPPG Dapur PWA
const CACHE_NAME = 'sppg-dapur-v3';
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/badan-gizi.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable.png',
  '/apple-touch-icon.png',
];

// Install: precache static shell assets only (never precache dynamic / root)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: clean up outdated caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first strategy, bypass cache for all navigation and API requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip API calls from cache — all API requests must always be live
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return;
  }

  // Navigation requests (HTML pages) must always fetch live network to respect auth cookies
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Push notification listener
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.title || 'SPPG Dapur - Notifikasi';
    const options = {
      body: data.message || 'Ada transaksi baru di sistem SPPG Dapur',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data,
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    // fallback
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
