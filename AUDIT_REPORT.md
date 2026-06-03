# PESOSINK Technical Audit Report
**Date:** 2026-06-03  
**Codebase:** sinkpeso.github.io  
**Commit:** 3968bc2  
**Total Files:** 16 (12 JS, 1 HTML, 1 CSS, 1 JSON, 1 PNG)

---

## 1. ARCHITECTURE

### 1.1 Component Organization — Grade: B+

**Strengths:**
- Clean separation into 12 focused JS modules: `utils.js`, `components.js`, `finance.js`, `selectors.js`, `actions.js`, `persistence.js`, `license.js`, `walleticons.js`, `DashboardOverview.js`, `InsightStrip.js`, `EmptyState.js`, `SettingGroup.js`
- Each module follows the IIFE pattern and exposes itself via `window.*`
- Pure functions separated from React components (`selectors.js`, `finance.js`, `utils.js`)
- Business logic decoupled from UI (`actions.js` handles state mutations, `selectors.js` handles derived state)

**Weaknesses:**
- `index.html` is **2,334 lines** — this is the single largest technical debt item. Contains:
  - ~800 lines of inline React components (WalletsView, QuickAddModal, PinScreen, PhotoDiaryView, SettingsView, BudgetLimitsView, BudgetBillsView, DailyExpensesView, SinkingFundsView, AllTransactionsView, HistoryView, RecentActivitySection)
  - Style token system (`const S = {...}`) — 78 lines of inline JS style objects
  - Z-index layer system (`const Z = {...}`)
  - All SVG icon paths (`const ICONS = {...}`) — 36 icons
  - Currency/exchange rate constants
  - Image compression utility
  - App shell with 9 tabs, bottom nav, modals, FAB, toast system
- `window.*` global namespace pollution — 10+ globals (`window.finance`, `window.persistence`, `window.actions`, `window.selectors`, `window.utils`, `window.components`, `window.walleticons`, `window.license`, `window.hashPin`, `window.InsightStrip`, `window.EmptyState`, `window.SettingGroup`, `window.DashboardOverview`)
- Script load order is **critical and fragile** — 12 `<script>` tags in `index.html` must be ordered correctly, with no bundler to enforce dependencies

### 1.2 Technical Debt — Grade: B

| Item | Severity | Effort |
|------|----------|--------|
| 2,334-line `index.html` monolith | High | High |
| No build system / bundler | Medium | Medium |
| `window.*` global namespace | Medium | Medium |
| Inline styles (JS objects) vs CSS modules | Low | High |
| No TypeScript / JSDoc types | Low | Medium |
| No test suite | High | Medium |
| `dangerouslySetInnerHTML` in walleticons.js | Low | N/A (sanitized) |

### 1.3 Separation of Concerns — Grade: B+

The codebase has a **surprisingly clean** layered architecture for a no-build vanilla React app:

```
┌─────────────────────────────────────────────┐
│  index.html (App shell + 11 view components)│  ← NEEDS EXTRACTION
├─────────────────────────────────────────────┤
│  DashboardOverview, InsightStrip,           │  ← Extracted components ✓
│  EmptyState, SettingGroup                   │
├─────────────────────────────────────────────┤
│  selectors.js (derived state)               │  ← Pure, memoizable ✓
│  actions.js (state mutations)               │  ← Centralized mutations ✓
│  finance.js (validation + wallet math)      │  ← Single source of truth ✓
├─────────────────────────────────────────────┤
│  persistence.js (localStorage layer)        │  ← Schema-versioned ✓
│  license.js (premium gating)                │  ← Offline HMAC ✓
│  utils.js (pure helpers)                    │  ← Zero dependencies ✓
└─────────────────────────────────────────────┘
```

**Concern:** `actions.js` calls `fin().processFinancialTransaction()` but that function only **validates** — it doesn't mutate state. The actual state mutation happens via the React `setWallets`/`setDailyExpenses` setters passed in as options. This is architecturally correct but unusual — it means `processFinancialTransaction` is a validator, not a processor.

### 1.4 Refactor Risk — Grade: B

**Low-risk refactors:**
- Extracting components from `index.html` into separate files (same IIFE pattern)
- Adding JSDoc types
- Adding unit tests for `selectors.js`, `finance.js`, `utils.js`

**Medium-risk refactors:**
- Introducing a bundler (would change the entire load strategy)
- Migrating from `window.*` to ES modules (breaking change across all files)
- Splitting `index.html` inline styles to CSS modules

**High-risk refactors:**
- Changing wallet balance derivation model (touches `finance.js`, `actions.js`, `selectors.js`, all views)
- Changing persistence layer (touches `persistence.js`, all `useEffect` hooks, export/import, backup/restore)

---

## 2. FINANCE ENGINE

### 2.1 Wallet Integrity — Grade: A-

**Architecture (Excellent):**
- Wallet balances are **derived**, not stored. `deriveWallets()` computes `balanceCents = openingBalanceCents + Σ(income) - Σ(expenses) - Σ(bill_payments) - Σ(vault_deposits) + Σ(vault_withdrawals)`
- `openingBalanceCents` is the only persisted value; everything else is recomputed from records
- This eliminates an entire class of bugs where balance gets out of sync with records

**Concerns:**
- `getWalletDelta()` in `finance.js` (line 21-47) iterates ALL records every time — O(n) per wallet per render. With 1,000+ transactions, this becomes noticeable.
- `migrateWallets()` (line 74-86) handles legacy data where `openingBalanceCents` didn't exist — good forward compat
- `processFinancialTransaction()` validates amounts but **doesn't actually mutate anything** — the name is misleading. It's really `validateTransaction()`.

**Critical Finding:**
The `deleteWallet()` function in `WalletsView` (index.html line 370-377) checks `wallet.balanceCents !== 0` before deleting, but this uses the **derived** balance from `displayWallets`. If there are orphaned transactions referencing a deleted wallet's ID, the balance could be non-zero even after the wallet is removed from the `wallets` array. However, since the wallet is filtered out, those orphaned transactions would have their walletId point to nothing — the balance just becomes inaccessible.

### 2.2 Transaction Consistency — Grade: B+

**Positive:**
- Income creates a record AND credits a wallet (via `actions.addIncome`)
- Expense creates a record AND debits a wallet (via `actions.addExpense`)
- Bill payment creates a txn record, marks bill as paid, and debits wallet (all in one handler)
- Vault deposit/withdrawal creates a txn record AND adjusts wallet balance
- Edit operations reverse old effect and apply new effect
- Delete operations reverse the financial effect

**Concerns:**
- `actions.js` line 25-31: `addExpense` calls `processFinancialTransaction` (which only validates) but the actual wallet mutation happens via `setWallets` which is NOT called inside `addExpense`. Looking more carefully — `processFinancialTransaction` doesn't call `setWallets` either. The wallet balance update relies on `deriveWallets` being recomputed on next render because `setDailyExpenses` triggers a re-render. **This is correct** — the derived architecture means the wallet balance auto-updates when the expense array changes.

- `BudgetBillsView` (index.html line 1690): When editing a bill amount, it also patches the related transaction: `setTxns(txns.map(t => t.type === "bill_payment" && t.billId === editBill.id ? { ...t, amountCents: newAmt } : t))`. This is correct but **doesn't adjust the wallet balance** — since balances are derived, this is fine.

- **Risk:** The bill payment flow (index.html line 1796-1804) creates a txn, marks the bill as paid, and stores `paidTxnId` and `paidWalletId` on the bill. If the user marks a bill as unpaid (line 1694-1698), it removes the txn and resets the bill fields. This is correctly implemented.

### 2.3 Deletion Behavior — Grade: B+

**Income deletion** (`actions.deleteIncome`): Reverses wallet credit, removes record ✓  
**Expense deletion** (`actions.deleteExpense`): Reverses wallet debit, removes record ✓  
**Bill deletion** (index.html line 1700-1704): Removes bill AND all related bill_payment txns ✓  
**Vault deletion** (index.html line 1988): Removes vault AND all related vault txns ✓  
**Photo diary deletion** (index.html line 776-782): Removes diary entry AND linked expense, reverses wallet debit ✓  

**Concern:** When deleting an expense from `DailyExpensesView` (line 1870-1875), it also removes the linked photo diary entry: `setPhotoDiary(prev => prev.filter(e => e.expenseId !== id))`. This is correct orphan prevention.

**Missing:** When deleting a wallet, the associated transactions (expenses, incomes, bills paid from that wallet) are **NOT** cleaned up. Their `walletId` will point to a non-existent wallet. The `resolveWalletName` selector gracefully falls back to `walletNameSnapshot`, so the UI won't break, but the financial record becomes semantically orphaned.

### 2.4 Data Corruption Risks — Grade: B+

**Mitigated risks:**
- `persistence.js` uses a versioned envelope `{ _v: N, data: payload }` with backwards compat for legacy raw values
- `loadState()` validates types and resets to defaults on corruption
- `ensureIntCents()` guards against NaN/Infinity in all money calculations
- `ErrorBoundary` catches React render crashes
- PIN is SHA-256 hashed before storage

**Remaining risks:**
1. **Race condition in state updates:** Multiple `useEffect` hooks write to localStorage independently. If the browser tab is closed mid-update, some keys could be written and others not. Example: `setDailyExpenses` and `setWallets` trigger separate `useEffect` → `saveKey` calls. If the tab crashes between them, the data could be inconsistent on next load.

2. **No atomic writes:** `persistence.js` writes each key independently. There's no transaction log or checksum to detect partial writes.

3. **Photo diary stored separately:** `sp_photo_diary` is NOT managed by `persistence.js` — it has its own `localStorage.setItem` call (index.html line 962). This breaks the centralized persistence pattern.

---

## 3. PHOTO DIARY

### 3.1 Link Integrity — Grade: B+

**Architecture:**
- Each photo diary entry has: `{ id, expenseId, imageData, amountCents, name, category, date, note, walletId }`
- The `expenseId` links to a daily expense record
- When a photo diary entry is deleted, the linked expense is also deleted (line 777-778)
- When an expense is deleted from DailyExpensesView, the linked photo entry is also deleted (line 1873)

**Concern:** There is **no reverse validation** — if `setPhotoDiary` or `setDailyExpenses` is called independently (e.g., during a data import or month archive), the link between `expenseId` and the actual expense record could break silently. There's no foreign key constraint or integrity check.

### 3.2 Orphan Prevention — Grade: B+

**Implemented:**
- Deleting a photo diary entry → deletes the linked expense + reverses wallet debit ✓
- Deleting an expense → deletes the linked photo diary entry ✓
- Photo diary entries include `walletId` for financial consistency ✓

**Missing:**
- **Month archive:** `handleCloseMonth` (line 1007-1058) archives `dailyExpenses` but does NOT archive `photoDiary`. After archiving:
  - Recurring expenses get new IDs → photo diary `expenseId` references become stale
  - The `photoDiary` array keeps entries whose `expenseId` no longer exists in `dailyExpenses`
  - This means photo diary entries survive archiving but lose their financial link

- **Data import:** `handleImport` (line 1358-1390) clears all state and reloads from backup. If the backup doesn't include `sp_photo_diary`, all photo entries are lost. The import handler iterates `validKeys` from `persistence.getAllRawKeys()` — but `sp_photo_diary` is NOT in that key map. **Photo diary data is not backed up or restored by the JSON export/import system.**

### 3.3 Storage Strategy — Grade: C+ ⚠️

**This is the most critical finding in the audit.**

Photo diary entries store `imageData` as base64-encoded JPEG data URLs directly in `localStorage`.

**Problems:**
1. **localStorage limit:** Most browsers cap localStorage at **5-10 MB per origin**. A single compressed photo (~30-80KB as base64) takes ~40-107KB in storage. With 50-100 photos, you're looking at **2-10 MB** — potentially hitting the quota.
2. **No quota monitoring:** There's no check before writing. If localStorage is full, `setItem` silently fails (the `_write` function catches the error but only logs a warning).
3. **Photo diary is NOT in the persistence layer:** It uses a raw `localStorage.setItem("sp_photo_diary", ...)` call, bypassing the versioned envelope, schema migration, and centralized key management.
4. **Not included in backup/export:** The JSON export iterates `persistence.getAllRawKeys()` which doesn't include `sp_photo_diary`. Users who back up their data will **lose all photos** on restore.
5. **Base64 overhead:** Base64 encoding adds ~33% overhead over raw binary. An 80KB JPEG becomes ~107KB as base64.

**Impact:** A user with ~75 photos could hit the localStorage limit, causing **silent data loss** for ALL app data (since other keys also use localStorage).

### 3.4 Future Gallery Design — Grade: B-

**Current:** Simple 2-column CSS grid (`pd-grid`), each card shows image + overlay with amount/category/date.

**Recommendations:**
- Migrate to IndexedDB for photo storage (see Section 4.2)
- Add lazy loading / virtual scrolling for large galleries
- Add date-based grouping (by week/month)
- Add filtering by category
- Add full-screen swipe navigation between photos (currently only lightbox for single entry)

---

## 4. OFFLINE-FIRST READINESS

### 4.1 localStorage Limits — Grade: C+ ⚠️

**Current state:**
- 9 keys managed by `persistence.js`: `sp_settings`, `sp_funds`, `sp_txns`, `sp_incomes`, `sp_bills`, `sp_daily`, `sp_archives`, `sp_budgets`, `sp_wallets`
- 1 key outside persistence: `sp_photo_diary` (raw)
- 1 key outside persistence: `sp_license` (managed by `license.js`)
- Total: 11 localStorage keys

**Estimated storage impact by data type:**
| Data Type | Per Record | 100 Records | 1,000 Records |
|-----------|-----------|-------------|---------------|
| Daily Expenses | ~200B | 20KB | 200KB |
| Incomes | ~150B | 15KB | 150KB |
| Transactions | ~250B | 25KB | 250KB |
| Bills | ~200B | 20KB | 200KB |
| Archives (with snapshots) | ~5-50KB | 50KB-500KB | N/A (monthly) |
| **Photo Diary** | **40-107KB** | **4-10MB** | **IMPOSSIBLE** |

**Risk assessment:**
- Non-photo data: Safe up to ~50,000 records (well within 5MB)
- Photo diary: **Dangerous at 50+ photos, critical at 100+**
- Archives with full snapshots: Each archive includes copies of all income/bill/expense/fund/txn arrays. After 12 months, this alone could be 500KB-2MB.

**No quota monitoring exists.** The app will silently fail to save data when the limit is reached.

### 4.2 IndexedDB Migration Path — Grade: D (Not Started)

**Current:** Zero IndexedDB usage. Everything is localStorage.

**Migration priority:**
1. **Immediate:** Move `sp_photo_diary` to IndexedDB (Blob storage for images)
2. **Soon:** Move `sp_archives` to IndexedDB (grows unboundedly)
3. **Later:** Move all data to IndexedDB for unified storage

**Recommended architecture:**
```javascript
// IndexedDB schema
const DB = {
  name: "sinkpeso",
  version: 1,
  stores: {
    settings:    { keyPath: "id" },      // single record
    wallets:     { keyPath: "id" },
    incomes:     { keyPath: "id", indexes: ["date", "walletId"] },
    expenses:    { keyPath: "id", indexes: ["date", "category", "walletId"] },
    bills:       { keyPath: "id", indexes: ["dueDate", "isPaid"] },
    transactions:{ keyPath: "id", indexes: ["date", "fundId", "walletId"] },
    funds:       { keyPath: "id" },
    budgets:     { keyPath: "id", indexes: ["category"] },
    archives:    { keyPath: "id", indexes: ["month"] },
    photos:      { keyPath: "id", indexes: ["expenseId", "date"] },
    // photos store would use Blob for imageData, not base64
  }
};
```

**Migration strategy:**
- Phase 1: Add IndexedDB for photos only (biggest bang for buck)
- Phase 2: Add IndexedDB for archives
- Phase 3: Migrate remaining keys
- Phase 4: Add migration code to move existing localStorage data to IndexedDB
- Keep localStorage as fallback during transition

### 4.3 Backup/Restore Architecture — Grade: B-

**Export:**
- JSON export: Iterates `persistence.getAllRawKeys()`, writes all values as JSON
- CSV export: Builds CSV from raw state (incomes, expenses, bills, vault txns)
- Encrypted export: AES-256-GCM with PBKDF2 key derivation (Premium only) — solid implementation

**Critical gap:** `sp_photo_diary` is NOT included in the export. Users backing up their data will lose all photos.

**Import:**
- Clears all state, writes backup data, reloads page
- Validates keys against `persistence.getAllRawKeys()` — but this excludes `sp_photo_diary`
- No version migration on import (if backup is from older schema, no upgrade path)

**Missing:**
- No incremental/differential backup
- No auto-backup prompt
- No backup size indicator
- No conflict resolution (import overwrites everything)

### 4.4 PWA Readiness — Grade: B

**Implemented:**
- `manifest.json` with name, icons, theme color, standalone display ✓
- Service worker with cache-first for static assets, network-first for app shell ✓
- CDN resources (React, fonts) cached with fallback ✓
- Apple mobile web app meta tags ✓
- `skipWaiting()` + `clients.claim()` for immediate activation ✓
- Cache versioning (`sinkpeso-v4`) with old cache cleanup ✓

**Missing:**
- No `install` prompt handling (no "Add to Home Screen" UX)
- No offline indicator / banner
- No background sync for future cloud features
- No push notification infrastructure
- Icon only provides 192x192 and 512x512 (missing smaller sizes for performance)
- No `scope` or `start_url` parameters in manifest
- Service worker doesn't cache the photo diary images (they're in localStorage, not network requests)

---

## 5. PERFORMANCE

### 5.1 Large Transaction Datasets — Grade: B+

**Implemented:**
- `VirtualList` component (index.html line 185-221) renders only visible items using `ResizeObserver` + scroll position tracking
- Used in `AllTransactionsView` with 76px item height and 5-item overscan
- `useMemo` on `getAllTransactionItems` and `filtered` prevents unnecessary recomputation

**Concerns:**
- `getWalletDelta()` is O(n) per wallet — called inside `deriveWallets()` which runs on every render that changes incomes/expenses/txns/bills. With 3 wallets and 1,000 transactions, that's 3,000 iterations per render.
- `computeTotals()` iterates all records multiple times (income, bills, expenses, vault txns). With 1,000 records across all types, this is ~4,000 iterations per render.
- `getAllTransactionItems()` creates new objects for every record on every recomputation. With 1,000 records, this creates ~1,000 objects.

**No pagination on non-virtualized lists:** Daily expenses list, income list, bill list, vault list are all rendered without virtualization or pagination. With 500+ items, these will cause noticeable jank.

### 5.2 Photo Storage Impact — Grade: C ⚠️

- Base64 image data is stored inline in React state (`photoDiary` array)
- Every `setPhotoDiary` call serializes the ENTIRE array to localStorage (line 962)
- With 50 photos at 50KB each base64, this is **2.5MB serialized on every photo diary change**
- `JSON.stringify` + `localStorage.setItem` on a 2.5MB string is a **blocking main-thread operation** (~50-200ms)
- The photo grid renders all images simultaneously (no lazy loading)
- `DashboardOverview` renders up to 6 recent photos in a horizontal strip — these are base64 data URLs, not optimized network images

### 5.3 Render Bottlenecks — Grade: B

**React.memo usage:** Most view components are wrapped with `React.memo` — `WalletsView`, `PhotoDiaryView`, `SettingsView`, `BudgetLimitsView`, `BudgetBillsView`, `DailyExpensesView`, `SinkingFundsView`, `AllTransactionsView`, `HistoryView`. This is good.

**Concerns:**
- The `App` component (line 924-1322) is ~400 lines and manages ALL state. Every state change triggers a full App re-render. While child components are memoized, the App itself recomputes all `useMemo` hooks on every render cycle.
- `displayWallets` useMemo depends on `[wallets, incomes, bills, dailyExpenses, txns]` — any change to any of these recalculates all wallet balances.
- `totals` useMemo depends on `[incomes, bills, funds, txns, dailyExpenses]` — similar broad dependency.
- Modals are rendered inline (not portaled) — they re-render with the parent.

### 5.4 Mobile Performance — Grade: B

**Positive:**
- Bottom navigation with touch-friendly 44px minimum tap targets
- Responsive layout with `clamp()` for padding
- `user-scalable=yes` in viewport meta (accessibility friendly)
- Standalone PWA mode removes browser chrome
- Dark theme reduces OLED power consumption

**Concerns:**
- No `will-change` or `transform: translateZ(0)` hints for animated elements
- Modal animations use CSS transitions but no GPU-accelerated properties
- Photo compression happens on the main thread (canvas operations) — could block UI on slow devices
- Large base64 strings in DOM (img src) consume significant memory on mobile
- `service-worker.js` caches React from CDN but the app still makes network requests for fonts on cold start

---

## 6. PRODUCT READINESS SCORE

### 6.1 MVP Readiness — Grade: B+ (75/100)

| Feature | Status | Notes |
|---------|--------|-------|
| Income tracking | ✅ Complete | Add/edit/delete with wallet integration |
| Expense tracking | ✅ Complete | Categories, wallets, recurring (Premium) |
| Bill management | ✅ Complete | Pay/unpay, recurring, due date tracking |
| Savings vaults | ✅ Complete | Deposit/withdraw with wallet integration |
| Wallet management | ✅ Complete | Multi-wallet with derived balances |
| Budget limits | ✅ Complete | Per-category with progress bars |
| Dashboard | ✅ Complete | Bento layout with burn ring, insights |
| Month archiving | ✅ Complete | Snapshot + reset cycle |
| PIN lock | ✅ Complete | SHA-256 hashed, brute-force protection |
| Photo diary | ⚠️ Functional but fragile | Storage strategy needs work |
| Backup/restore | ⚠️ Partial | Missing photo diary backup |
| Dark/light theme | ✅ Complete | |

### 6.2 Beta Readiness — Grade: C+ (55/100)

| Criterion | Status | Notes |
|-----------|--------|-------|
| Data integrity | ⚠️ Partial | Photo diary links can break on archive |
| Error handling | ✅ Good | ErrorBoundary, catch blocks, fallbacks |
| Edge cases | ⚠️ Partial | No handling for localStorage full |
| Performance (100+ records) | ✅ Good | VirtualList, useMemo |
| Performance (1000+ records) | ⚠️ Partial | Non-virtualized lists will lag |
| Photo storage scalability | ❌ Fails | localStorage limit at ~50-100 photos |
| Backup completeness | ❌ Fails | Photos not included in backup |
| Offline resilience | ✅ Good | Full offline PWA |
| Accessibility | ⚠️ Partial | Good tap targets, but no ARIA labels |
| Test coverage | ❌ None | Zero tests |

### 6.3 Public Launch Readiness — Grade: D+ (35/100)

| Criterion | Status | Notes |
|-----------|--------|-------|
| Error recovery | ⚠️ Partial | No undo, no soft delete |
| Data migration | ❌ None | No version upgrade path |
| Onboarding | ❌ None | No first-run tutorial |
| Help/support | ❌ None | No help text or documentation |
| Analytics | ❌ None | No usage tracking |
| Crash reporting | ❌ None | Console.error only |
| Photo storage | ❌ Critical | Will hit limits with active use |
| Multi-device sync | ❌ None | Single device only |
| Data portability | ⚠️ Partial | JSON/CSV export (missing photos) |
| Localization | ❌ None | English only, PHP-centric |

### 6.4 Play Store Readiness — Grade: D (25/100)

| Criterion | Status | Notes |
|-----------|--------|-------|
| PWA manifest | ✅ Complete | |
| Service worker | ✅ Complete | |
| TWA/Capacitor wrapper | ❌ None | No native wrapper exists |
| App signing | ❌ None | |
| Privacy policy | ❌ None | |
| Play Console listing | ❌ None | |
| Screenshots/assets | ❌ None | |
| Target SDK compliance | ❌ N/A | Not a native app |
| Play Store policies | ❌ N/A | Need to verify financial app policies |
| In-app purchase integration | ❌ None | License key system, no IAP |

---

## 7. TOP 3 CONCERNS — DETAILED ANALYSIS

### 7.1 Photo Diary Data Integrity — CRITICAL ⚠️

**Problems identified:**
1. Photo diary bypasses the centralized persistence layer (`persistence.js`)
2. Photo diary is NOT included in JSON backup/export
3. Month archiving breaks `expenseId` links (recurring expenses get new IDs)
4. No foreign key validation between photo entries and expenses
5. No integrity check on data import

**Recommended fixes (priority order):**
1. **Immediate:** Add `sp_photo_diary` to `persistence.js` KEYS map
2. **Immediate:** Include photo diary in JSON export/import
3. **Soon:** Add orphan detection on load (entries with stale `expenseId`)
4. **Soon:** Archive photo diary alongside expenses during month close
5. **Later:** Migrate photo storage to IndexedDB

### 7.2 Long-Term Storage Architecture — HIGH RISK ⚠️

**Problems identified:**
1. localStorage 5-10MB hard limit with no monitoring
2. Photos stored as base64 (~33% overhead over binary)
3. Archives grow unboundedly (full snapshots of all data each month)
4. No data lifecycle management (no auto-cleanup, no compression)
5. No IndexedDB migration path exists

**Recommended architecture:**
```
Phase 1 (1-2 weeks):
  - Move sp_photo_diary to IndexedDB (store as Blob, not base64)
  - Add quota monitoring with user warning at 80% capacity
  - Add sp_photo_diary to backup/export

Phase 2 (2-4 weeks):
  - Move sp_archives to IndexedDB
  - Add data size indicator in Settings
  - Implement archive compression (only store diffs or summaries)

Phase 3 (1-2 months):
  - Full IndexedDB migration for all data
  - Add migration code for localStorage → IndexedDB
  - Keep localStorage as read-only fallback
```

### 7.3 Preventing Regressions as Codebase Grows — HIGH RISK ⚠️

**Problems identified:**
1. **Zero test coverage** — no unit tests, integration tests, or E2E tests
2. **2,334-line monolith** — adding features to `index.html` increases regression risk
3. **Fragile script load order** — 12 scripts must load in exact order
4. **Global namespace pollution** — any script can overwrite `window.*` globals
5. **No type safety** — all money values passed as numbers with no runtime validation at boundaries
6. **No CI/CD** — no automated checks before deployment

**Recommended mitigations:**
1. **Immediate:** Add unit tests for `finance.js`, `selectors.js`, `utils.js` (pure functions, easy to test)
2. **Soon:** Extract remaining components from `index.html` into separate files
3. **Soon:** Add a simple bundler (esbuild or Vite) to enforce module boundaries
4. **Later:** Add TypeScript or JSDoc type annotations
5. **Later:** Add Playwright E2E tests for critical flows (add expense, pay bill, archive month)

---

## 8. ADDITIONAL FINDINGS

### 8.1 Security

| Finding | Severity | Notes |
|---------|----------|-------|
| License secret hardcoded in JS | Medium | `SECRET = "SP2024FINTECH"` visible in source |
| PIN stored as SHA-256 hash | Low | No salt per-user, but acceptable for local-only app |
| No CSP headers | Low | GitHub Pages limitation |
| `prompt()` for backup password | Low | Browser-native prompt, no custom UI |
| License validation is checksum-based | Medium | `sum % 7 === 0` — trivially brute-forceable |

### 8.2 License System

The license system (`license.js`) uses a simple checksum validation (`sum % 7 === 0`). Any 12-character alphanumeric string where the character code sum is divisible by 7 will pass. This is **trivially bypassable** by generating random keys. The HMAC-based key generation (`generateKey`) exists but isn't used for validation — only the checksum is checked.

### 8.3 Missing `sp_photo_diary` in Persistence

This is worth calling out again because it's a cross-cutting concern:
- `persistence.js` defines 9 keys in its KEYS map
- `sp_photo_diary` is written directly via `localStorage.setItem` (index.html line 962)
- `sp_license` is managed by `license.js` independently
- This means `clearState()` doesn't clear photo diary or license data
- Export doesn't include photo diary
- Import doesn't restore photo diary
- Schema versioning doesn't apply to photo diary

---

## 9. EXECUTIVE SUMMARY

**PESOSINK is a well-architected personal finance app with a solid derived-balance model and clean separation of business logic from UI.** The codebase shows thoughtful engineering decisions — particularly the `deriveWallets()` pattern that eliminates balance drift, the centralized persistence layer with schema versioning, and the pure-function selectors.

**The three critical risks are:**

1. **Photo diary storage in localStorage** — will hit limits with active use, causing potential data loss for ALL app data
2. **Photo diary not in the persistence/backup system** — users will lose photos on backup/restore
3. **Zero test coverage on a growing codebase** — the 2,334-line monolith with no tests is a regression time bomb

**Recommended sprint priorities:**
- Sprint 1: Fix photo diary persistence (add to KEYS, add to backup, fix archive links)
- Sprint 2: Migrate photo storage to IndexedDB, add quota monitoring
- Sprint 3: Extract components from index.html, add unit tests for core modules
- Sprint 4: Add IndexedDB for archives, add onboarding flow