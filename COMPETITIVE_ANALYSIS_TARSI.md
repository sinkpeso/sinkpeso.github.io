# SinkPeso vs Tarsi — Competitive Analysis
> Generated: June 4, 2026

---

## 1. OVERVIEW

| Attribute | SinkPeso | Tarsi |
|---|---|---|
| **Platform** | PWA (Web App) | Android Native (Google Play) |
| **Price** | Free + Premium ₱199/mo or ₱999/yr | $3.49 one-time + IAP ($2.49-$19.99) |
| **Developer** | SinkPeso | Bryl Lim |
| **Target Market** | Philippines (Filipino-first) | Global (English-first) |
| **Tagline** | "Your money, clearly seen." | "Track expenses, budgets, goals, and debts — all in one simple app" |
| **Downloads** | N/A (PWA) | 1K+ on Google Play |
| **Offline Support** | Yes (Service Worker) | Yes (local device) |
| **Account Required** | Optional (Google sign-in for sync) | No account required |

---

## 2. FEATURE COMPARISON

### ✅ Features SinkPeso HAS that Tarsi does NOT (SinkPeso Advantages)

| Feature | Details |
|---|---|
| **Philippine-first design** | Peso sign (₱), jeepney/sari-sari store categories, Filipino-focused UX |
| **Photo Diary with geolocation** | Snap receipts & memories, attach to transactions with location data |
| **Undo with shake gesture** | Shake-to-undo deleted transactions — unique UX |
| **Budget templates (sari-sari store, etc.)** | Pre-built Filipino lifestyle budget templates |
| **PWA — no install needed** | Works on any device with a browser, no app store required |
| **Multi-device sync via Google** | Cloud sync across devices |
| **Sinking Funds view** | Dedicated sinking funds (envelope budgeting) tracking |
| **Wallets view with bank-style icons** | Visual wallet management with custom icons |
| **Admin dashboard** | Internal admin panel for monitoring |
| **Crash reporting** | Automated crash reports for stability |
| **Test suite** | Comprehensive automated testing (actions, finance, license, persistence, photo) |
| **Premium tier with trial** | 7-day free trial, conversion-optimized upgrade flow |

### ✅ Features Tarsi HAS that SinkPeso does NOT (Tarsi Advantages)

| Feature | Details |
|---|---|
| **Cashflow forecasting** | Predict future cash flow based on recurring income/expenses |
| **Investment tracking (US stocks + crypto)** | Real-time market data for investment accounts |
| **Net worth dashboard** | Single-screen view of total net worth |
| **AI-powered feedback on transactions** | Gives tips after each expense/income entry |
| **Debt tracking with "money owed"** | Track debts and money owed to you |
| **Daily financial summary** | Automated daily income/expense recap |
| **Bank account & expense templates** | Quick-entry templates for speed |
| **Installment tracking** | Track installment payments specifically |
| **CSV + JSON export** | More export format options |
| **No cloud dependency** | 100% local, no data sent anywhere |
| **Income & expense statements** | Generate statements for a selected period |
| **Android native app** | Better device integration (notifications, widgets potentially) |

### 🔄 Features Both Have

| Feature | SinkPeso | Tarsi |
|---|---|---|
| Expense tracking | ✅ | ✅ |
| Income tracking | ✅ | ✅ |
| Budget categories | ✅ | ✅ (with subcategories) |
| Savings goals | ✅ (Sinking Funds) | ✅ |
| Multiple accounts/wallets | ✅ | ✅ |
| Recurring bills | ✅ | ✅ |
| Subscriptions tracking | ✅ | ✅ |
| Light/Dark mode | ✅ | ✅ |
| Data backup | ✅ (Google sync) | ✅ (local auto-backup) |
| Receipt scanning | ✅ | ❌ |
| Offline-first | ✅ | ✅ |
| Privacy-focused | ✅ | ✅ |

---

## 3. STRENGTHS & WEAKNESSES ANALYSIS

### SinkPeso Strengths
1. **Philippine market dominance** — Culturally relevant categories, peso-first, Filipino UX
2. **PWA accessibility** — No app store barrier, instant access on any device
3. **Photo Diary** — Unique differentiator for visual expense tracking
4. **Cloud sync** — Multi-device access (Tarsi is device-local only)
5. **Modern tech stack** — PWA with service worker, IndexedDB, test suite
6. **Premium monetization** — Recurring revenue model vs one-time purchase

### SinkPeso Weaknesses
1. **No investment tracking** — Missing a growing feature category
2. **No cashflow forecasting** — Users can't predict future finances
3. **No net worth view** — Missing holistic financial health picture
4. **No AI/insights** — No automated financial tips or feedback
5. **No debt tracking** — No dedicated debt management feature
6. **No export to CSV/JSON** — Limited export options compared to Tarsi
7. **No daily summary** — No automated daily financial recap

### Tarsi Strengths
1. **Comprehensive financial picture** — Net worth, investments, debts all in one
2. **AI-powered insights** — Automated financial feedback
3. **Privacy-first** — 100% local, no cloud dependency
4. **One-time purchase model** — Attractive pricing for budget-conscious users
5. **Cashflow forecasting** — Planning capability

### Tarsi Weaknesses
1. **No cloud sync** — Data trapped on one device
2. **No receipt scanning** — Manual entry only
3. **English-only** — No Filipino localization
4. **Android-only** — No iOS or web access
5. **Small user base** — Only 1K+ downloads
6. **No photo diary** — No visual transaction tracking

---

## 4. STRATEGIC RECOMMENDATIONS

### HIGH PRIORITY (Close the gap)

1. **Add Cashflow Forecasting** — Show predicted balance based on recurring bills/income
   - Tarsi's killer feature for financial planning
   - Relatively straightforward to implement with existing bill data

2. **Add Net Worth Dashboard** — Single screen showing total assets minus debts
   - Combine all wallet balances, sinking funds, and debt tracking
   - Visual trend chart over time

3. **Add Debt Tracking** — Dedicated section for debts and money owed
   - "Money I owe" vs "Money owed to me"
   - Progress tracking for debt repayment

4. **Add Transaction Insights/Feedback** — Simple AI-lite tips
   - "You spent 30% more on food this week"
   - "You're on track to save ₱X this month"
   - Can be rule-based initially, no need for ML

### MEDIUM PRIORITY (Differentiate)

5. **Add Daily Summary Notifications** — Push notification with daily income/expense recap
   - Builds habit and engagement
   - Leverages PWA push notification capability

6. **Add CSV/JSON Export** — Expand data export options
   - Currently may have limited export; add CSV for spreadsheet users

7. **Add Investment Tracking** — At least basic portfolio tracking
   - GCash, Maya, and crypto wallet balances
   - Can start simple: manual entry with balance tracking

8. **Add Quick-Entry Templates** — Speed up common transactions
   - "Jeepney fare ₱13", "Sari-sari store ₱50"
   - Reduces friction for daily logging

### LOW PRIORITY (Long-term)

9. **iOS App / App Store presence** — Expand platform reach
   - PWA works but native apps build more trust

10. **Multi-currency support** — For OFW users sending money home

---

## 5. COMPETITIVE POSITIONING

### SinkPeso's Unique Value Proposition
> "The only finance app built specifically for Filipinos, with culturally relevant categories, photo receipts, and multi-device sync — all free to start."

### How to Position Against Tarsi
- **Tarsi says**: "All in one simple app, private by default"
- **SinkPeso says**: "Built for Filipinos, by Filipinos. Track your money the way you actually spend it — from jeepney rides to sari-sari runs."

### Key Messaging Differences
| Tarsi Messaging | SinkPeso Counter |
|---|---|
| "Private by default" | "Your data syncs securely across all your devices" |
| "No account required" | "Sign in once, access everywhere" |
| "AI feedback" | "Photo receipts + visual diary — see your spending, not just count it" |
| "Investment tracking" | "Coming soon: GCash, Maya & crypto tracking" |
| "Cashflow forecasting" | "Coming soon: Smart budget predictions" |

---

## 6. APP STORE OPTIMIZATION (ASO) NOTES

Since Tarsi is on Google Play and SinkPeso is a PWA, consider:
- **Keywords to target**: "expense tracker Philippines", "budget app Filipino", "sinking funds tracker", "Pinoy finance app"
- **Tarsi's Play Store listing**: Well-written, comprehensive description with feature highlights
- **Recommendation**: Create a Google Play listing for SinkPeso as a TWA (Trusted Web Activity) to compete directly in search results

---

*This analysis is based on Tarsi's Google Play listing (com.tarsi.app) and SinkPeso's codebase as of June 2026.*