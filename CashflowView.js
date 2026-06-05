// CashflowView.js — 30-Day Cashflow Forecast for SINKPESO
//
// Projects daily balance for the next 30 days based on:
//   - Current total wallet balance
//   - Recurring bills (weekly/monthly)
//   - Average daily expense (last 30 days)
//   - Recurring income
//
// Renders as an SVG line chart with no external dependencies.
//
// Dependencies: React (global), Icon (global), constants.js globals,
//   window.components.{PageTitle, Btn},
//   window.utils.{safeDiv, getDaysRemaining, addMonths}

(function () {
    "use strict";
    const e = React.createElement;
    const { safeDiv, getDaysRemaining } = window.utils;
    const { PageTitle, Btn } = window.components;

    // ── helpers ──────────────────────────────────────────────────────────
    function addDays(dateStr, n) {
        const d = new Date(dateStr + "T12:00:00");
        d.setDate(d.getDate() + n);
        return d.toISOString().slice(0, 10);
    }

    function fmtDate(dateStr) {
        const d = new Date(dateStr + "T12:00:00");
        return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
    }

    // ── MAIN COMPONENT ──────────────────────────────────────────────────
    function CashflowView({ totals, bills, incomes, dailyExpenses, wallets, fc }) {
        // Premium gate
        const [showUpgrade, setShowUpgrade] = React.useState(false);
        if (!window.license || !window.license.canUseFeature('cashflowForecast')) {
            const Icon = window.Icon;
            return e('div', null,
                e(PageTitle, { sub: "30-day balance projection." }, "Cashflow Forecast"),
                showUpgrade && window.UpgradePromptModal
                    ? e(window.UpgradePromptModal, {
                        message: "Cashflow Forecast projects your balance for the next 30 days based on spending patterns and upcoming bills. Upgrade to Premium to unlock.",
                        onClose: () => setShowUpgrade(false)
                    })
                    : e('div', { style: { textAlign: "center", padding: "60px 20px" } },
                        e('div', { style: { fontSize: 48, marginBottom: 16, opacity: 0.3 } }, e(Icon, { name: "trendingup", size: 48, color: "var(--text-muted)" })),
                        e('div', { style: { fontSize: 16, fontWeight: 700, color: "var(--text-main)", marginBottom: 8 } }, "Cashflow Forecast"),
                        e('div', { style: { fontSize: 13, color: "var(--text-muted)", marginBottom: 20, maxWidth: 320, margin: "0 auto 20px", lineHeight: 1.6 } }, "See your projected balance for the next 30 days based on your spending patterns and upcoming bills. A Premium feature."),
                        e(Btn, { v: "accent", onClick: () => setShowUpgrade(true) }, "Unlock Cashflow Forecast — ₱250")
                    )
            );
        }

        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);

        // Current total balance
        const currentBalance = (wallets || []).reduce((s, w) => s + (w.balanceCents || 0), 0);

        // Average daily expense (last 30 days)
        const last30 = (dailyExpenses || []).filter(d => {
            const diff = (today - new Date(d.date + "T12:00:00")) / 86400000;
            return diff >= 0 && diff <= 30;
        });
        const avgDailyExpense = last30.length > 0
            ? last30.reduce((s, d) => s + (d.amountCents || 0), 0) / 30
            : 0;

        // Recurring income per month (for projection)
        const recurringIncome = (incomes || []).reduce((s, i) => s + (i.amountCents || 0), 0);

        // Build 30-day projection
        const projection = [];
        let runningBalance = currentBalance;

        for (let i = 0; i < 30; i++) {
            const date = addDays(todayStr, i);
            const dateObj = new Date(date + "T12:00:00");

            // Subtract average daily expense
            runningBalance -= avgDailyExpense;

            // Check for bills due on this date
            (bills || []).forEach(b => {
                if (b.isPaid) return;
                if (!b.dueDate) return;
                // Check if this bill falls on the projection date
                let billDate = b.dueDate;
                if (billDate === date) {
                    runningBalance -= (b.amountCents || 0);
                }
                // Recurring monthly: check same day-of-month
                if (b.recurring === "monthly" && dateObj.getDate() === new Date(billDate + "T12:00:00").getDate() && date > billDate) {
                    runningBalance -= (b.amountCents || 0);
                }
                // Recurring weekly: every 7 days from dueDate
                if (b.recurring === "weekly" && billDate <= date) {
                    const diffDays = Math.round((dateObj - new Date(billDate + "T12:00:00")) / 86400000);
                    if (diffDays % 7 === 0) {
                        runningBalance -= (b.amountCents || 0);
                    }
                }
            });

            projection.push({ date, balance: Math.round(runningBalance) });
        }

        // Chart dimensions
        const W = 600, H = 220, PAD_L = 60, PAD_R = 20, PAD_T = 20, PAD_B = 40;
        const chartW = W - PAD_L - PAD_R;
        const chartH = H - PAD_T - PAD_B;

        // Y-axis range
        const balances = projection.map(p => p.balance);
        let yMin = Math.min(...balances, 0);
        let yMax = Math.max(...balances, currentBalance);
        const yRange = yMax - yMin || 1;
        yMin -= yRange * 0.1;
        yMax += yRange * 0.1;
        const ySpan = yMax - yMin || 1;

        // Scale functions
        const scaleX = (i) => PAD_L + (i / 29) * chartW;
        const scaleY = (v) => PAD_T + (1 - (v - yMin) / ySpan) * chartH;

        // Build polyline points
        const points = projection.map((p, i) => `${scaleX(i)},${scaleY(p.balance)}`).join(" ");

        // Zero line Y
        const zeroY = Math.max(PAD_T, Math.min(PAD_T + chartH, scaleY(0)));

        // Current balance line Y
        const currentY = scaleY(currentBalance);

        // Find first negative day
        const firstNeg = projection.findIndex(p => p.balance < 0);

        // Format Y-axis labels
        const fmtY = (v) => {
            const abs = Math.abs(v);
            if (abs >= 100000) return (v / 1000).toFixed(0) + "k";
            if (abs >= 10000) return (v / 1000).toFixed(1) + "k";
            return fc(v);
        };

        // Y-axis tick marks
        const yTicks = 4;
        const yStep = ySpan / yTicks;
        const yLabels = [];
        for (let i = 0; i <= yTicks; i++) {
            const val = yMin + i * yStep;
            yLabels.push({ val, y: scaleY(val) });
        }

        // X-axis labels (every 5th day)
        const xLabels = [];
        for (let i = 0; i < 30; i += 5) {
            xLabels.push({ label: fmtDate(projection[i].date), x: scaleX(i) });
        }
        xLabels.push({ label: fmtDate(projection[29].date), x: scaleX(29) });

        const lineColor = firstNeg >= 0 ? "#EF4444" : "#00E676";
        const gradientId = "cf-grad-" + Date.now();

        return e('div', null,
            e(PageTitle, { sub: "Projected balance for the next 30 days based on your spending patterns." }, "Cashflow Forecast"),

            // Summary cards
            e('div', { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 } },
                e('div', { style: { ...S.statCard } },
                    e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 } }, "Current Balance"),
                    e('div', { style: { fontSize: 22, fontWeight: 800, color: "#00E676" } }, fc(currentBalance))
                ),
                e('div', { style: { ...S.statCard } },
                    e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 } }, "Avg Daily Spend"),
                    e('div', { style: { fontSize: 22, fontWeight: 800, color: "#F59E0B" } }, fc(Math.round(avgDailyExpense)))
                ),
                e('div', { style: { ...S.statCard } },
                    e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 } }, "Projected (30d)"),
                    e('div', { style: { fontSize: 22, fontWeight: 800, color: projection[29].balance >= 0 ? "#00E676" : "#EF4444" } }, fc(projection[29].balance))
                ),
                e('div', { style: { ...S.statCard } },
                    e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 } }, "Warning"),
                    e('div', { style: { fontSize: 14, fontWeight: 700, color: firstNeg >= 0 ? "#EF4444" : "#00E676" } },
                        firstNeg >= 0 ? "Low balance in " + (firstNeg + 1) + " days" : "All clear for 30 days"
                    )
                )
            ),

            // Chart
            e('div', { style: { background: "var(--hover-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 16px", marginBottom: 24, overflow: "hidden" } },
                e('svg', {
                    viewBox: `0 0 ${W} ${H}`,
                    style: { width: "100%", height: "auto", display: "block" },
                    preserveAspectRatio: "xMidYMid meet"
                },
                    // Gradient fill
                    e('defs', null,
                        e('linearGradient', { id: gradientId, x1: "0", y1: "0", x2: "0", y2: "1" },
                            e('stop', { offset: "0%", stopColor: lineColor, stopOpacity: "0.3" }),
                            e('stop', { offset: "100%", stopColor: lineColor, stopOpacity: "0.02" })
                        )
                    ),

                    // Grid lines
                    yLabels.map((yt, i) =>
                        e('line', { key: "g" + i, x1: PAD_L, y1: yt.y, x2: W - PAD_R, y2: yt.y, stroke: "var(--border)", strokeWidth: 0.5, strokeDasharray: "4 4" })
                    ),

                    // Zero line
                    zeroY > PAD_T && zeroY < PAD_T + chartH &&
                        e('line', { x1: PAD_L, y1: zeroY, x2: W - PAD_R, y2: zeroY, stroke: "var(--text-muted)", strokeWidth: 1, strokeDasharray: "6 4", opacity: 0.5 }),

                    // Current balance line
                    e('line', { x1: PAD_L, y1: currentY, x2: W - PAD_R, y2: currentY, stroke: "#00E676", strokeWidth: 1, strokeDasharray: "4 4", opacity: 0.4 }),

                    // Area fill
                    e('polygon', {
                        points: `${scaleX(0)},${scaleY(projection[0].balance)} ${points} ${scaleX(29)},${PAD_T + chartH} ${scaleX(0)},${PAD_T + chartH}`,
                        fill: `url(#${gradientId})`
                    }),

                    // Main line
                    e('polyline', {
                        points,
                        fill: "none",
                        stroke: lineColor,
                        strokeWidth: 2.5,
                        strokeLinecap: "round",
                        strokeLinejoin: "round"
                    }),

                    // Dot at current balance
                    e('circle', { cx: scaleX(0), cy: scaleY(projection[0].balance), r: 4, fill: "#00E676", stroke: "var(--bg-panel)", strokeWidth: 2 }),

                    // Dot at endpoint
                    e('circle', { cx: scaleX(29), cy: scaleY(projection[29].balance), r: 4, fill: projection[29].balance >= 0 ? "#00E676" : "#EF4444", stroke: "var(--bg-panel)", strokeWidth: 2 }),

                    // Y-axis labels
                    yLabels.map((yt, i) =>
                        e('text', { key: "yl" + i, x: PAD_L - 8, y: yt.y + 4, textAnchor: "end", fontSize: 9, fill: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }, fmtY(yt.val))
                    ),

                    // X-axis labels
                    xLabels.map((xl, i) =>
                        e('text', { key: "xl" + i, x: xl.x, y: H - 8, textAnchor: "middle", fontSize: 9, fill: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }, xl.label)
                    ),

                    // Y=0 label
                    zeroY > PAD_T && zeroY < PAD_T + chartH &&
                        e('text', { x: PAD_L - 8, y: zeroY + 4, textAnchor: "end", fontSize: 9, fill: "var(--text-muted)", fontWeight: 700, fontFamily: "'DM Mono', monospace" }, "0")
                )
            ),

            // Legend
            e('div', { style: { display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "var(--text-muted)" } },
                e('div', { style: { display: "flex", alignItems: "center", gap: 6 } },
                    e('div', { style: { width: 12, height: 3, borderRadius: 2, background: "#00E676" } }),
                    "Current balance"
                ),
                e('div', { style: { display: "flex", alignItems: "center", gap: 6 } },
                    e('div', { style: { width: 12, height: 3, borderRadius: 2, background: lineColor } }),
                    "Projected balance"
                ),
                e('div', { style: { display: "flex", alignItems: "center", gap: 6 } },
                    e('div', { style: { width: 12, height: 1, borderTop: "1px dashed var(--text-muted)" } }),
                    "Zero line"
                )
            )
        );
    }

    window.CashflowView = React.memo(CashflowView);
})();