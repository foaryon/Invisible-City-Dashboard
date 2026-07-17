/**
 * Service worker — makes The Invisible City installable (Android/desktop) and
 * lets the app shell load offline.
 *
 * Reality policy: it caches ONLY the static app shell (HTML/JS/CSS/icons).
 * It NEVER caches `/api/*` responses — live/source data always goes to the
 * network so the dashboard can never show stale or misleading values from a
 * cache. Offline, API calls simply fail into the app's honest "unavailable"
 * states, exactly as they do in the browser.
 */
const CACHE = 'invisible-city-shell-v1';
const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Never intercept live data — always hit the network for honest values.
  if (url.pathname.startsWith('/api/')) return;

  // HTML navigations: network-first, fall back to the cached shell when offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html').then((r) => r || caches.match('/')),
      ),
    );
    return;
  }

  // Hashed static assets: cache-first, then populate the cache.
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return res;
        }),
    ),
  );
});
