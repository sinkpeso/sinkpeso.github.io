// DashboardOverview.js — Main dashboard panel for SINKPESO
//
// What this renders (3 visual blocks):
//   1. Page heading + health status badge
//   2. LEFT column: Balance card (net available, income, spent, safe daily spend)
//                   Category spending grid (6 categories with progress bars)
//   3. RIGHT column: Donut chart (monthly budget used %)
//                    Upcoming unpaid bills list (up to 3)
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
//
// Props:
//   totals         — pre-computed object from App()'s useMemo (totalIncome,
//                    totalDailySpent, paidBills, netAvailable, catSum,
//                    healthStatus, …)
//   bills          — array of bill objects { id, name, amountCents, isPaid, dueDate }
//   budgets        — array of budget objects { id, category, limitCents }
//   fc             — currency formatter function, e.g. fc(1000) → "₱10.00"
//   dailyExpenses  — passed through from App but not used here (kept for
//                    API compatibility — do not remove from the call site)

(function () {
    const e = React.createElement;

    // Pull helpers from already-loaded files
    const { SLabel, PBar } = window.components;
    const { safeDiv, getDaysRemaining } = window.utils;

    function DashboardOverview({ totals, bills, dailyExpenses, budgets, fc }) {

        // Fraction of income already spent (daily expenses + paid bills)
        const spendPercentage = totals.totalIncome > 0
            ? (totals.totalDailySpent + totals.paidBills) / totals.totalIncome
            : 0;

        return e('div', null,

            // ── PAGE HEADING ───────────────────────────────────────────────────
            e('div', { style: { marginBottom: 20 } },
                e('div', { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 5 } },
                    e('h1', { style: { fontSize: "clamp(18px, 5vw, 24px)", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.1 } },
                        "Financial Position"
                    ),
                    // Health badge — colour driven by totals.healthStatus
                    e('div', {
                        style: {
                            background: totals.healthStatus.bg,
                            color: totals.healthStatus.color,
                            border: `1px solid ${totals.healthStatus.color}30`,
                            padding: "4px 12px", borderRadius: 20,
                            fontSize: 11, fontWeight: 700, whiteSpace: "nowrap"
                        }
                    }, totals.healthStatus.label)
                ),
                e('div', { style: { fontSize: 13, color: "var(--text-muted)" } },
                    "Simple visual breakdown of your cash health"
                )
            ),

            // ── TWO-COLUMN GRID ────────────────────────────────────────────────
            e('div', { className: "dashboard-grid" },

                // ── LEFT COLUMN ──────────────────────────────────────────────
                e('div', { style: { display: "flex", flexDirection: "column", gap: 24 } },

                    // Balance card
                    e('div', { className: "balance-gradient-card" },
                        e(SLabel, { style: { color: "var(--text-light)", marginBottom: 6 } },
                            "Money left to spend"
                        ),
                        e('div', {
                            style: {
                                fontSize: 38, fontWeight: 800, color: "#00E676",
                                letterSpacing: "-0.025em", fontVariantNumeric: "tabular-nums"
                            }
                        }, fc(totals.netAvailable)),

                        // Safe daily spend sub-section (calculated inline)
                        (() => {
                            const today       = new Date();
                            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                            const daysLeft    = Math.max(1, daysInMonth - today.getDate());
                            const safeDailySpend = totals.netAvailable > 0
                                ? Math.floor(totals.netAvailable / daysLeft)
                                : 0;

                            return e('div', null,
                                // Income / Spent row
                                e('div', { style: { display: "flex", gap: 40, marginTop: 28, borderTop: "1px solid var(--border)", paddingTop: 20 } },
                                    e('div', null,
                                        e(SLabel, { style: { marginBottom: 4 } }, "Total Income"),
                                        e('div', { style: { fontSize: 16, fontWeight: 700, color: "var(--text-main)" } },
                                            fc(totals.totalIncome)
                                        )
                                    ),
                                    e('div', null,
                                        e(SLabel, { style: { marginBottom: 4 } }, "Total Spent"),
                                        e('div', { style: { fontSize: 16, fontWeight: 700, color: "var(--text-muted)" } },
                                            fc(totals.totalDailySpent + totals.paidBills)
                                        )
                                    )
                                ),
                                // Safe-spend chip
                                safeDailySpend > 0 && e('div', { className: "safe-chip" },
                                    e(Icon, { name: "trendingup", size: 13, color: "#00E676" }),
                                    e('span', null,
                                        `Safe daily spend: ${fc(safeDailySpend)} / day (${daysLeft}d left)`
                                    )
                                )
                            );
                        })()
                    ),

                    // Category spending grid
                    e('div', { className: "premium-panel" },
                        e(SLabel, { style: { marginBottom: 16 } }, "Where Your Money Goes"),
                        e('div', { className: "category-box-grid" },
                            CATEGORIES.map(cKey => {
                                const currentVal = totals.catSum[cKey] || 0;
                                const budgetObj  = budgets.find(b => b.category === cKey);
                                const limit      = budgetObj ? budgetObj.limitCents : null;
                                const percent    = limit ? safeDiv(currentVal, limit) : 0;

                                // Bar colour: red if over, yellow if close, green otherwise
                                let pColor = "#00E676";
                                if (limit) {
                                    if (percent >= 1.0)  pColor = "#FF1744";
                                    else if (percent >= 0.8) pColor = "#FFD600";
                                } else {
                                    pColor = "var(--border)";
                                }

                                return e('div', { key: cKey, className: "category-mini-card" },
                                    e('div', { style: { display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "var(--text-light)", marginBottom: 4 } },
                                        e('span', null, cKey),
                                        e('span', { style: { color: "var(--text-main)" } },
                                            limit ? `${Math.round(percent * 100)}%` : "-"
                                        )
                                    ),
                                    e('div', { style: { fontSize: 16, fontWeight: 700, color: "var(--text-main)", marginTop: 2 } },
                                        limit
                                            ? `${fc(currentVal)} / ${fc(limit)}`
                                            : e('span', { style: { fontSize: 13, color: "var(--text-muted)", fontWeight: 600 } }, "No limit set")
                                    ),
                                    e(PBar, { pct: limit ? percent : 0, color: pColor })
                                );
                            })
                        )
                    )
                ),

                // ── RIGHT COLUMN ─────────────────────────────────────────────
                e('div', { className: "premium-panel", style: { display: "flex", flexDirection: "column", gap: 24, justifyContent: "space-between" } },

                    // Donut chart
                    e('div', null,
                        e(SLabel, { style: { marginBottom: 12, textAlign: "center" } }, "Monthly Budget Used"),
                        e('div', { style: { display: 'flex', justifyContent: 'center', position: 'relative' } },
                            e('svg', { height: 140, width: 140, style: { transform: 'rotate(-90deg)' } },
                                // Background ring
                                e('circle', { fill: 'none', stroke: 'var(--border-input)', strokeWidth: 14, r: 56, cx: 70, cy: 70 }),
                                // Filled arc — turns red above 80%
                                e('circle', {
                                    fill: 'none',
                                    stroke: spendPercentage > 0.8 ? '#FF1744' : '#00E676',
                                    strokeWidth: 14, strokeLinecap: 'round',
                                    strokeDasharray: 56 * 2 * Math.PI,
                                    strokeDashoffset: (56 * 2 * Math.PI) * (1 - Math.min(spendPercentage, 1)),
                                    r: 56, cx: 70, cy: 70,
                                    style: { transition: 'stroke-dashoffset 0.5s ease' }
                                })
                            ),
                            // Centre label
                            e('div', { style: { position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 140, height: 140 } },
                                e('span', { style: { fontSize: 20, fontWeight: 800, color: 'var(--text-main)' } },
                                    `${Math.round(spendPercentage * 100)}%`
                                ),
                                e('span', { style: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 } }, "used")
                            )
                        )
                    ),

                    // Upcoming unpaid bills (max 3 shown)
                    e('div', { style: { borderTop: "1px solid var(--border)", paddingTop: 20 } },
                        e(SLabel, { style: { marginBottom: 12 } }, "Upcoming Unpaid Bills"),
                        bills.filter(b => !b.isPaid).length === 0
                            // All clear
                            ? e('div', { style: { color: "#00E676", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 } },
                                e(Icon, { name: "shield", size: 14, color: "#00E676" }),
                                "All bills paid"
                              )
                            // Bill rows
                            : bills.filter(b => !b.isPaid).slice(0, 3).map(b => {
                                const days = getDaysRemaining(b.dueDate);
                                let urgencyColor = "var(--text-muted)";
                                let urgencyText  = "";
                                if (days < 0)       { urgencyColor = "#EF4444"; urgencyText = `Overdue (${Math.abs(days)}d)`; }
                                else if (days <= 1) { urgencyColor = "#EF4444"; urgencyText = "Due Tomorrow!"; }
                                else if (days <= 3) { urgencyColor = "#F59E0B"; urgencyText = `Due in ${days} days`; }
                                else                {                           urgencyText = `Due in ${days} days`; }

                                return e('div', {
                                    key: b.id,
                                    style: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--hover-bg)", padding: "12px 16px", borderRadius: 12, marginBottom: 8 }
                                },
                                    e('div', null,
                                        e('div', { style: { fontSize: 13, fontWeight: 600, color: 'var(--text-main)' } }, b.name),
                                        e('div', { style: { fontSize: 11, color: urgencyColor, marginTop: 2, fontWeight: days <= 3 ? 700 : 500 } }, urgencyText)
                                    ),
                                    e('div', { style: { fontSize: 13, fontWeight: 700, color: 'var(--text-main)' } },
                                        fc(b.amountCents)
                                    )
                                );
                            })
                    )
                )
            )
        );
    }

    // Expose globally so index.html can use it without any other changes
    window.DashboardOverview = DashboardOverview;

})();
