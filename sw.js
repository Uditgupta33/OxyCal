/* ================================================================
   SERVICE WORKER — Oxygen Hours Calculator PWA
   Caches all assets for full offline use
================================================================ */

const CACHE_NAME = 'o2-hours-v1.0.0';

// All external resources we want cached
const EXTERNAL_URLS = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://unpkg.com/nepali-date-picker@2.0.1/dist/nepaliDatePicker.min.css',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap',
  'https://code.jquery.com/jquery-3.7.1.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
  'https://unpkg.com/nepali-date-picker@2.0.1/dist/jquery.nepaliDatePicker.min.js'
];

const LOCAL_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install — cache everything
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // Cache local files
      await cache.addAll(LOCAL_URLS).catch(() => {});
      // Cache external resources individually (don't fail if one is missing)
      for (const url of EXTERNAL_URLS) {
        try {
          const response = await fetch(url, { mode: 'cors' });
          if (response.ok) await cache.put(url, response);
        } catch (e) {
          console.warn('SW: Could not cache', url);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache-first, then network fallback
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Return a minimal offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
