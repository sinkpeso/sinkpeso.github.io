// DashboardOverview.js — Main dashboard panel for SINKPESO
//
// Renders (4 visual blocks):
//   1. Page heading + health status badge
//   2. LEFT column: Balance card (available this month, wallet total, income, spent, safe daily spend)
//                   Category spending grid (6 categories with progress bars)
//   3. RIGHT column: Donut chart (monthly budget used %)
//                    Upcoming unpaid bills list (up to 3)
//   4. Recent activity section (conditionally rendered when onNavigate is provided)
//
// This component is DISPLAY ONLY — no useState, no localStorage, no mutations.
// All data is passed in as props from App().
//
// Dependencies (must be loaded before this file):
//   - React             (via CDN <script>)
//   - components.js     → SLabel, PBar    (via window.components)
//   - utils.js          → safeDiv, getDaysRemaining  (via window.utils)
//   - Icon              (global function defined in index.html main <script>)
//   - CATEGORIES        (global constant defined in index.html main <script>)
//   - RecentActivitySection (global function defined in index.html main <script>)
//
// Props:
//   totals         — pre-computed object from App()'s useMemo
//   bills          — array of bill objects { id, name, amountCents, isPaid, dueDate }
//   dailyExpenses  — array of daily expense objects
//   budgets        — array of budget objects { id, category, limitCents }
//   wallets        — derived wallet array with balanceCents computed
//   fc             — currency formatter function, e.g. fc(1000) → "₱10.00"
//   incomes        — array of income records
//   txns           — array of transaction records
//   funds          — array of sinking fund objects
//   archives       — array of archived month snapshots
//   onNavigate     — callback to switch tabs, e.g. onNavigate("transactions")

(function () {
    const e = React.createElement;

    // Pull helpers from already-loaded files
    const { SLabel, PBar } = window.components;
    const { safeDiv, getDaysRemaining } = window.utils;

    function DashboardOverview({ totals, bills, dailyExpenses, budgets, wallets, fc, incomes, txns, funds, archives, onNavigate }) {
        const spendPercentage = totals.totalIncome > 0 ? (totals.totalDailySpent + totals.paidBills) / totals.totalIncome : 0;
        // Wallet total = sum of all real wallet balances (persists across months)
        const walletTotal = (wallets || []).reduce((s, w) => s + (w.balanceCents || 0), 0);

        return e('div', null,
            e('div', { style: { marginBottom: 20 } },
                e('div', { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 5 } },
                    e('h1', { style: { fontSize: "clamp(18px, 5vw, 24px)", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.1 } }, "Financial Position"),
                    e('div', { style: { background: totals.healthStatus.bg, color: totals.healthStatus.color, border: `1px solid ${totals.healthStatus.color}30`, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" } }, totals.healthStatus.label)
                ),
                e('div', { style: { fontSize: 13, color: "var(--text-muted)" } }, "Simple visual breakdown of your cash health")
            ),

            e('div', { className: "dashboard-grid" },
                e('div', { style: { display: "flex", flexDirection: "column", gap: 24 } },
                    e('div', { className: "balance-gradient-card" },
                        // ── Available This Month ───────────────────────────────────
                        e(SLabel, { style: { color: "var(--text-light)", marginBottom: 6 } }, "Available This Month"),
                        e('div', { style: { fontSize: 38, fontWeight: 800, color: "#00E676", letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums" } }, fc(totals.netAvailable)),
                        e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 2, marginBottom: 16 } }, "Income minus expenses, bills paid & savings this month"),

                        // ── Wallet Total (separate — persists across months) ────────
                        e('div', { style: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px" } },
                            e('div', null,
                                e(SLabel, { style: { marginBottom: 3 } }, "Wallet Total"),
                                e('div', { style: { fontSize: 11, color: "var(--text-muted)" } }, "Persists across months")
                            ),
                            e('div', { style: { fontSize: 18, fontWeight: 800, color: walletTotal < 0 ? "#EF4444" : "var(--text-main)", fontVariantNumeric: "tabular-nums" } }, fc(walletTotal))
                        ),

                        (() => {
                            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
                            const dayOfMonth  = new Date().getDate();
                            const daysLeft    = Math.max(1, daysInMonth - dayOfMonth);
                            const safeDailySpend = totals.netAvailable > 0 ? Math.floor(totals.netAvailable / daysLeft) : 0;
                            return e('div', null,
                                e('div', { style: { display: "flex", gap: 40, marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 20 } },
                                    e('div', null, e(SLabel, { style: { marginBottom: 4 } }, "Total Income"), e('div', { style: { fontSize: 16, fontWeight: 700, color: "var(--text-main)" } }, fc(totals.totalIncome))),
                                    e('div', null, e(SLabel, { style: { marginBottom: 4 } }, "Total Spent"), e('div', { style: { fontSize: 16, fontWeight: 700, color: "var(--text-muted)" } }, fc(totals.totalDailySpent + totals.paidBills)))
                                ),
                                safeDailySpend > 0 && e('div', { className: "safe-chip" },
                                    e(Icon, { name: "trendingup", size: 13, color: "#00E676" }),
                                    e('span', null, `Safe daily spend: ${fc(safeDailySpend)} / day (${daysLeft}d left)`)
                                )
                            );
                        })()
                    ),

                    e('div', { className: "premium-panel" },
                        e(SLabel, { style: { marginBottom: 16 } }, "Where Your Money Goes"),
                        e('div', { className: "category-box-grid" },
                            CATEGORIES.map(cKey => {
                                const currentVal = totals.catSum[cKey] || 0;
                                const budgetObj = budgets.find(b => b.category === cKey);
                                const limit = budgetObj ? budgetObj.limitCents : null;
                                const percent = limit ? safeDiv(currentVal, limit) : 0;

                                let pColor = "#00E676";
                                if (limit) {
                                    if (percent >= 1.0) pColor = "#FF1744"; else if (percent >= 0.8) pColor = "#FFD600";
                                } else { pColor = "var(--border)"; }

                                return e('div', { key: cKey, className: "category-mini-card" },
                                    e('div', { style: { display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "var(--text-light)", marginBottom: 4 } },
                                        e('span', null, cKey), e('span', { style: { color: "var(--text-main)" } }, limit ? `${Math.round(percent * 100)}%` : "-")
                                    ),
                                    e('div', { style: { fontSize: 16, fontWeight: 700, color: "var(--text-main)", marginTop: 2 } },
                                        limit ? `${fc(currentVal)} / ${fc(limit)}` : e('span', {style: {fontSize: 13, color: "var(--text-muted)", fontWeight: 600}}, "No limit set")
                                    ),
                                    e(PBar, { pct: limit ? percent : 0, color: pColor })
                                );
                            })
                        )
                    )
                ),

                e('div', { className: "premium-panel", style: { display: "flex", flexDirection: "column", gap: 24, justifyContent: "space-between" } },
                    e('div', null,
                        e(SLabel, { style: { marginBottom: 12, textAlign: "center" } }, "Monthly Budget Used"),
                        e('div', { style: { display: 'flex', justifyContent: 'center', position: 'relative' } },
                            e('svg', { height: 140, width: 140, style: { transform: 'rotate(-90deg)' } },
                                e('circle', { fill: 'none', stroke: 'var(--border-input)', strokeWidth: 14, r: 56, cx: 70, cy: 70 }),
                                e('circle', { fill: 'none', stroke: spendPercentage > 0.8 ? '#FF1744' : '#00E676', strokeWidth: 14, strokeLinecap: 'round', strokeDasharray: 56 * 2 * Math.PI, strokeDashoffset: (56 * 2 * Math.PI) * (1 - Math.min(spendPercentage, 1)), r: 56, cx: 70, cy: 70, style: { transition: 'stroke-dashoffset 0.5s ease' } })
                            ),
                            e('div', { style: { position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 140, height: 140 } },
                                e('span', { style: { fontSize: 20, fontWeight: 800, color: 'var(--text-main)' } }, `${Math.round(spendPercentage * 100)}%`),
                                e('span', { style: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 } }, "used")
                            )
                        )
                    ),

                    e('div', { style: { borderTop: "1px solid var(--border)", paddingTop: 20 } },
                        e(SLabel, { style: { marginBottom: 12 } }, "Upcoming Unpaid Bills"),
                        bills.filter(b => !b.isPaid).length === 0 ? e('div', { style: { color: "#00E676", fontSize: 13, fontWeight: 600, display:"flex", alignItems:"center", gap:6 } }, e(Icon, {name:"shield", size:14, color:"#00E676"}), "All bills paid") :
                        bills.filter(b => !b.isPaid).slice(0, 3).map(b => {
                            const days = getDaysRemaining(b.dueDate);
                            let urgencyColor = "var(--text-muted)"; let urgencyText = "";
                            if (days < 0) { urgencyColor = "#EF4444"; urgencyText = `Overdue (${Math.abs(days)}d)`; }
                            else if (days <= 1) { urgencyColor = "#EF4444"; urgencyText = "Due Tomorrow!"; }
                            else if (days <= 3) { urgencyColor = "#F59E0B"; urgencyText = `Due in ${days} days`; }
                            else { urgencyText = `Due in ${days} days`; }

                            return e('div', { key: b.id, style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--hover-bg)", padding: "12px 16px", borderRadius: 12, marginBottom: 8 } },
                                e('div', null,
                                    e('div', { style: { fontSize: 13, fontWeight: 600, color: 'var(--text-main)' } }, b.name),
                                    e('div', { style: { fontSize: 11, color: urgencyColor, marginTop: 2, fontWeight: days <= 3 ? 700 : 500 } }, urgencyText)
                                ),
                                e('div', { style: { fontSize: 13, fontWeight: 700, color: 'var(--text-main)' } }, fc(b.amountCents))
                            )
                        })
                    )
                )
            ),

            // ── Recent Activity ─────────────────────────────────────────────
            onNavigate && e(RecentActivitySection, { incomes, dailyExpenses, bills, txns, funds, wallets, archives, fc, onNavigate })
        );
    }

    // Expose globally so index.html can use it without any other changes
    window.DashboardOverview = DashboardOverview;

    if (window.PropTypes) {
        DashboardOverview.propTypes = {
            totals: PropTypes.object.isRequired,
            bills: PropTypes.array.isRequired,
            dailyExpenses: PropTypes.array.isRequired,
            budgets: PropTypes.array.isRequired,
            wallets: PropTypes.array.isRequired,
            fc: PropTypes.func.isRequired,
            incomes: PropTypes.array,
            txns: PropTypes.array,
            funds: PropTypes.array,
            archives: PropTypes.array,
            onNavigate: PropTypes.func,
        };
    }

})();
