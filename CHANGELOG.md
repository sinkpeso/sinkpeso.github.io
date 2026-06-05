# Changelog

All notable changes to SINKPESO are documented here.

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