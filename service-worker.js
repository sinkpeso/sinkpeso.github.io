const CACHE_NAME = 'sinkpeso-v10';
const ASSETS = [
  './index.html',
  './app.html',
  './offline.html',
  './styles.css',
  './landing.css',
  './app.js',
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
  './license.js',
  './photodb.js',
  './constants.js',
  './PhotoDiaryView.js',
  './SettingsView.js',
  './WalletsView.js',
  './BudgetBillsView.js',
  './DailyExpensesView.js',
  './SinkingFundsView.js',
  './AllTransactionsView.js',
  './HistoryView.js',
  './BudgetLimitsView.js',
  './RecentActivitySection.js',
  './archivedb.js',
  './OnboardingScreen.js',
  './UndoToast.js',
  './HelpTooltip.js',
  './crashreport.js',
  './DebtView.js',
  './CashflowView.js',
  './PeraReportView.js',
  './CoreComponents.js',
  './react.production.min.js',
  './react-dom.production.min.js',
  './fonts/fonts.css',
  './fonts/dm-sans-400.woff2',
  './fonts/dm-sans-500.woff2',
  './fonts/dm-sans-600.woff2',
  './fonts/dm-sans-700.woff2',
  './fonts/dm-sans-800.woff2',
  './fonts/dm-mono-400.woff2',
  './fonts/dm-mono-500.woff2',
  './service-worker.js',
  './manifest.json',
  './logosinkpeso.png',
  './privacy.html'
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

// Helper: determine if request is for a same-origin app shell asset
function isAppShellAsset(url) {
  if (url.origin !== self.location.origin) return false;
  const p = url.pathname;
  // Match known extensions or paths
  return (
    p.endsWith('.html') ||
    p.endsWith('.css') ||
    p.endsWith('.js') ||
    p.endsWith('.png') ||
    p.endsWith('.woff2') ||
    p.endsWith('.json') ||
    p.endsWith('.jpg') ||
    p === '/' ||
    p === ''
  );
}

// Fetch: cache-first for app shell, network-first for CDN
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // CDN resources (fonts.googleapis.com, unpkg.com, etc.): network-first with cache fallback
  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => null);
        // Return cached version immediately if available, otherwise wait for network
        return cached || fetchPromise || new Response('', { status: 503, statusText: 'Offline' });
      })
    );
    return;
  }

  // Same-origin: cache-first for all app shell assets (HTML, CSS, JS, fonts, images)
  if (isAppShellAsset(url)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) {
          // Return cached immediately, update cache in background
          fetch(event.request).then(response => {
            if (response && response.ok) {
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
            }
          }).catch(() => {});
          return cached;
        }
        // Not in cache, try network
        return fetch(event.request).then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          // If it's a navigation request, return offline fallback
          if (event.request.mode === 'navigate' ||
              (event.request.headers.get('accept') || '').includes('text/html')) {
            return caches.match('./offline.html');
          }
          return new Response('', { status: 503, statusText: 'Offline' });
        });
      })
    );
    return;
  }

  // Everything else: network-first with cache fallback
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request).then(cached => {
      return cached || new Response('', { status: 503, statusText: 'Offline' });
    }))
  );
});