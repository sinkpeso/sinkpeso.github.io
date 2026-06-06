# Changelog

All notable changes to SINKPESO are documented here.

## [2.4.0] — 2026-06-06

### Added
- **Real App Screenshots** — 8 Puppeteer-generated screenshots (Dashboard, Expenses, Bills, Savings, Photo Diary) in both desktop (1280×720) and mobile (390×844) viewports
- **Screenshot Showcase Carousel** — Landing page App Preview section now shows real screenshots in CSS browser/phone frames instead of hand-coded HTML mockups
- **Animated Hero Orbs** — Three blurred gradient orbs (green, blue, purple) float behind the hero section with staggered fade-in
- **Scroll Progress Bar** — Green-to-blue gradient bar fixed below the nav tracks scroll position across the entire landing page
- **Back-to-Top Button** — Floating arrow button appears after scrolling 500px with accent glow on hover
- **Enhanced Empty States** — Icon now sits inside a circular accent-tinted background with border; fade-in animation on mount; `illustration` prop for custom SVGs
- **Shadow Design System** — Four new CSS variables (`--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-accent`) for consistent depth across all components

### Changed
- **Glassmorphism Mockup** — Hero browser mockup now has green glow shadow and inset highlight for premium depth
- **Showcase Tab Crossfade** — Panel switching now crossfades with 0.35s cubic-bezier animation instead of instant swap
- **Enhanced Reveal Animations** — Elements fade in from 28px (up from 24px) with slightly longer stagger delays
- **Glass Modals** — Modal overlay uses `blur(16px) saturate(1.2)` for richer glass effect; modal container uses `--shadow-lg` with highlight ring
- **Panel Shadows** — `.premium-panel`, `.bn-cell`, `.balance-gradient-card` all use the new shadow system for consistent elevation
- **Star Glow** — Testimonial stars now have subtle amber text-shadow
- **Screenshot Generation Script** — Expanded from 2 to 8 screenshots with sample data injection via localStorage

## [2.3.0] — 2026-06-06

### Added
- **Wallet-to-Wallet Transfer** — Transfer money between any two wallets with dedicated modal (From/To pickers, amount, optional fee, note)
- **Transfer Fees** — Optional fee field for transfers (e.g., GCash cash-out fee); source wallet debits amount + fee, destination receives amount only
- **Edit Transfers** — Edit amount, fee, date, and note of existing transfers via DotMenu in Transaction Log
- **Source Filter Pills** — Filter Transaction Log by type: All, Expenses, Income, Bills, Vaults, Transfers
- **Transfer SVG Icon** — Proper left-right arrow icon for transfers (replaces fallback target icon)
- **Transfer in Activity Feeds** — Transfers appear in Dashboard activity feed and Transaction Log with blue transfer icon
- **Transfer E2E Tests** — 4 new Playwright tests: end-to-end transfer, Transaction Log display, single-wallet guard, balance verification

### Fixed
- Transfer icon now uses a proper `transfer` SVG path instead of falling back to `target` bullseye
- Wallet flow indicators (+/-) now correctly include transfer in/out amounts including fees

### Changed
- `getWalletDelta()` now handles `feeCents` on wallet transfers (source debits amount + fee)
- `processFinancialTransaction()` validates `amountCents + feeCents` against source wallet balance
- `transferBetweenWallets()` action passes `feeCents` to validation
- `seedTestData` E2E helper now supports `txns`, `funds`, and `budgets` keys

## [2.2.0] — 2026-06-05

### Added
- **Pera Report** — Monthly financial breakdown with income, expenses, and savings rate
- **Cashflow Forecast** — 30-day cashflow projection chart based on recurring bills and income
- **Utang Tracker** — Debt management with "money I owe" vs "money owed to me" tracking
- **Smart Insight Chips** — Context-aware financial tips (overdue bills, overspending alerts, savings progress)
- **PDF/HTML Report Export** — Downloadable branded reports from any report view (premium)
- **Quick-Entry Templates** — One-tap expense logging with customizable templates in Settings
- **Premium Feature Gating** — 7-day free trial with feature-locked premium tier
- **AllTransactionsView** — Unified transaction history across all sources
- **ExportPDFBtn** — Printer icon in header action bar for all report views

### Fixed
- Bundle Google Fonts locally for iOS offline PWA support
- Bundle React/ReactDOM locally — app now works fully offline
- Add Cashflow and Pera Report tabs to desktop navigation
- Print mode CSS overrides for dark theme bento backgrounds
- CSS custom property resolution in HTML report export via getComputedStyle
- Force light theme in ExportPDFBtn for mobile print compatibility

### Changed
- HTML report export replaces window.print() for mobile PWA compatibility
- Premium features list in Settings and CoreComponents updated to match license tiers
- Admin authentication strengthened
- Manifest updated with correct categories and shortcuts

## [2.1.0] — 2026-05-28

### Added
- Photo Diary with geolocation
- Wallet management with bank-style icons
- Sinking Funds (envelope budgeting) view
- Budget limits and category tracking
- Recurring bill tracking
- PIN-based security screen
- Multi-device sync via Google sign-in
- Dark/Light theme toggle
- Crash reporting system
- Comprehensive test suite (unit + E2E)
- Landing page with feature showcase
- Admin dashboard
- Service Worker for offline PWA support

---

*For the full commit history, see [GitHub](https://github.com/sinkpeso/sinkpeso.github.io/commits/main).*