const CACHE_NAME = 'kesari-boutique-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/logo.svg',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass cache for API calls to ensure real-time chat data
  // wrapping in respondWith with error handling to avoid unhandled rejections
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(err => {
        console.error('[SW] API Fetch failed:', err);
        return new Response(JSON.stringify({ error: 'Network error', details: err.message }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for everything else
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(err => {
          console.error('[SW] Fetch failed for asset:', request.url, err);
          return cachedResponse || Response.error();
        });

      return cachedResponse || fetchPromise;
    })
  );
});
