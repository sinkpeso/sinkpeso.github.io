const CACHE_NAME = 'sinkpeso-v19';
const ASSETS = [
  './app.html',
  './offline.html',
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
  './DailyReminder.js',
  './CoreComponents.js',
  './jspdf.umd.min.js',
  './jspdf.plugin.autotable.min.js',
  './ReportGenerator.js',
  './CSVExporter.js',
  './CSVImporter.js',
  './GlobalSearchView.js',
  './RecurringView.js',
  './BudgetActualView.js',
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
  './icon-192.png',
  './privacy.html',
  './premium.html',
  './terms.html'
];

// Install: cache app shell assets (fault-tolerant — SW installs even if some assets fail)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(ASSETS.map(url => cache.add(url)))
    )
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

// Fetch: cache-first with network update for app shell, network-first for CDN
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // CDN resources: network-first with cache fallback
  if (url.hostname === 'unpkg.com' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Same-origin navigation requests (HTML pages): cache-first, update in background
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request)
          .then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached || caches.match('./offline.html'));
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Same-origin app shell (CSS, JS): cache-first, update in background (stale-while-revalidate)
  const pathname = url.pathname;
  if (pathname.endsWith('.css') || pathname.endsWith('.js') || pathname.endsWith('.png') || pathname.endsWith('.json')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request)
          .then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Everything else: network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});