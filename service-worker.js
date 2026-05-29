const CACHE_NAME = 'sinkpeso-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './utils.js',
  './components.js',
  './InsightStrip.js',
  './DashboardOverview.js',
  './EmptyState.js',
  './SettingGroup.js',
  './finance.js',
  './selectors.js',
  './actions.js',
  './walleticons.js',
  './persistence.js',
  './service-worker.js',
  './manifest.json',
  './logosinkpeso.png'
];

// Install: cache all app shell assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for HTML/CSS/JS, cache-first for static assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // CDN resources: network-first with cache fallback
  if (url.hostname === 'unpkg.com' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // App HTML/CSS/JS: network-first (always check for updates)
  const pathname = url.pathname;
  if (pathname.endsWith('.html') || pathname.endsWith('.css') || pathname.endsWith('.js') || pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets (images, fonts): cache-first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
