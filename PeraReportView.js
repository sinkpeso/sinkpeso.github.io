// PeraReportView.js — Monthly Money Story for SINKPESO
//
// Auto-generates a visual monthly financial summary:
//   - Top spending categories
//   - Biggest single expense
//   - Savings rate
//   - Day with highest spending
//   - Spending personality label
//
// Dependencies: React (global), Icon (global), constants.js globals,
//   window.components.{PageTitle, Btn}

(function () {
    "use strict";
    const e = React.createElement;
    const { PageTitle, Btn, ExportPDFBtn } = window.components;
    const CATEGORIES = window.SINKPESO_CONSTANTS.CATEGORIES;

    // ── helpers ──────────────────────────────────────────────────────────
    function getPersonality(savingsRate) {
        if (savingsRate >= 30) return { label: "The Saver", color: "#00E676", sub: "You keep more than you spend. Solid discipline." };
        if (savingsRate >= 15) return { label: "The Balancer", color: "#3B82F6", sub: "You manage spending and saving in healthy balance." };
        if (savingsRate >= 0) return { label: "The Spender", color: "#F59E0B", sub: "Most of your income goes to expenses. Consider tightening up." };
        return { label: "The Overdraft", color: "#EF4444", sub: "You spent more than you earned. Time to review." };
    }

    function getDayName(dayIndex) {
        return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex] || "";
    }

    // ── MAIN COMPONENT ──────────────────────────────────────────────────
    function PeraReportView({ totals, dailyExpenses, incomes, bills, funds, wallets, fc }) {
        // Premium gate
        const [showUpgrade, setShowUpgrade] = React.useState(false);
        if (!window.license || !window.license.canUseFeature('peraReport')) {
            const Icon = window.Icon;
            const Btn = window.components.Btn;
            return React.createElement('div', null,
                e(PageTitle, { sub: "Your monthly money story." }, "Pera Report"),
                showUpgrade && window.UpgradePromptModal
                    ? e(window.UpgradePromptModal, {
                        message: "Pera Report gives you a visual monthly financial summary with spending personality, top categories, and savings insights. Upgrade to Premium to unlock.",
                        onClose: () => setShowUpgrade(false)
                    })
                    : e('div', { style: { textAlign: "center", padding: "60px 20px" } },
                        e('div', { style: { fontSize: 48, marginBottom: 16, opacity: 0.3 } }, e(Icon, { name: "chart", size: 48, color: "var(--text-muted)" })),
                        e('div', { style: { fontSize: 16, fontWeight: 700, color: "var(--text-main)", marginBottom: 8 } }, "Pera Report"),
                        e('div', { style: { fontSize: 13, color: "var(--text-muted)", marginBottom: 20, maxWidth: 320, margin: "0 auto 20px", lineHeight: 1.6 } }, "Your monthly money story — spending personality, top categories, biggest expense, and savings rate. A Premium feature."),
                        e(Btn, { v: "accent", onClick: () => setShowUpgrade(true) }, "Unlock Pera Report — ₱250")
                    )
            );
        }

        const today = new Date();
        const monthName = today.toLocaleDateString("en-PH", { month: "long", year: "numeric" });

        // Spending by category
        const catSpend = {};
        (dailyExpenses || []).forEach(d => {
            catSpend[d.category] = (catSpend[d.category] || 0) + (d.amountCents || 0);
        });
        const sortedCats = Object.entries(catSpend)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        const maxCatVal = sortedCats.length > 0 ? sortedCats[0][1] : 1;

        // Biggest single expense
        const biggest = (dailyExpenses || []).reduce((max, d) =>
            (d.amountCents || 0) > (max.amountCents || 0) ? d : max, { amountCents: 0, name: "None", category: "", date: "" });

        // Savings rate
        const savingsRate = totals.totalIncome > 0
            ? Math.round(((totals.totalIncome - (totals.totalDailySpent + totals.paidBills)) / totals.totalIncome) * 100)
            : 0;
        const personality = getPersonality(savingsRate);

        // Day of week with highest spending
        const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
        (dailyExpenses || []).forEach(d => {
            const dow = new Date(d.date + "T12:00:00").getDay();
            dayTotals[dow] += (d.amountCents || 0);
        });
        const peakDayIdx = dayTotals.indexOf(Math.max(...dayTotals));
        const peakDayTotal = dayTotals[peakDayIdx];

        // Transaction count
        const txnCount = (dailyExpenses || []).length;

        // Total savings in vaults
        const totalInVaults = (funds || []).reduce((s, f) => s + (f.savedCents || 0), 0);

        // Stat cards
        const stats = [
            { label: "Total Income", value: fc(totals.totalIncome), color: "#00E676" },
            { label: "Total Spent", value: fc(totals.totalDailySpent + totals.paidBills), color: "#EF4444" },
            { label: "Savings Rate", value: savingsRate + "%", color: savingsRate >= 15 ? "#00E676" : "#F59E0B" },
            { label: "Transactions", value: String(txnCount), color: "#3B82F6" },
            { label: "In Vaults", value: fc(totalInVaults), color: "#A855F7" },
            { label: "Peak Day", value: getDayName(peakDayIdx), color: "#F59E0B" },
        ];

        // Category bar colors
        const catColors = ["#00E676", "#3B82F6", "#A855F7", "#F59E0B", "#EF4444"];

        if (txnCount === 0) {
            return e('div', null,
                e(PageTitle, { sub: "Your monthly money story." }, "Pera Report"),
                e('div', { style: { textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" } },
                    e('div', { style: { fontSize: 48, marginBottom: 16, opacity: 0.3 } }, e(Icon, { name: "chart", size: 48, color: "var(--text-muted)" })),
                    e('div', { style: { fontSize: 15, fontWeight: 600, marginBottom: 8 } }, "Not enough data"),
                    e('div', { style: { fontSize: 13 } }, "Log some expenses this month to see your Pera Report.")
                )
            );
        }

        return e('div', null,
            e(PageTitle, { sub: monthName + " - Your monthly money story." }, "Pera Report"),

            // Personality card
            e('div', { style: {
                background: personality.color + "0D", border: "1px solid " + personality.color + "30",
                borderRadius: 16, padding: "24px", marginBottom: 24, textAlign: "center"
            } },
                e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 } }, "Your Spending Personality"),
                e('div', { style: { fontSize: 28, fontWeight: 800, color: personality.color, marginBottom: 8 } }, personality.label),
                e('div', { style: { fontSize: 13, color: "var(--text-muted)", maxWidth: 320, margin: "0 auto", lineHeight: 1.5 } }, personality.sub)
            ),

        // Export PDF button (premium)
        e('div', { style: { marginBottom: 20, display: "flex", justifyContent: "flex-end" } },
            e(ExportPDFBtn)
        ),

        // Stat grid
        e('div', { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 } },
                stats.map((s, i) =>
                    e('div', { key: i, style: { ...S.statCard, borderTop: "3px solid " + s.color } },
                        e('div', { style: { fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 } }, s.label),
                        e('div', { style: { fontSize: 18, fontWeight: 800, color: s.color } }, s.value)
                    )
                )
            ),

            // Top categories
            sortedCats.length > 0 && e('div', { style: { ...S.statCard, marginBottom: 24, padding: "20px" } },
                e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16 } }, "Top Spending Categories"),
                sortedCats.map(([cat, val], i) =>
                    e('div', { key: cat, style: { marginBottom: 12 } },
                        e('div', { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 } },
                            e('span', { style: { fontSize: 13, fontWeight: 600, color: "var(--text-main)" } }, cat),
                            e('span', { style: { fontSize: 13, fontWeight: 700, color: catColors[i % catColors.length] } }, fc(val))
                        ),
                        e('div', { style: { height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" } },
                            e('div', { style: {
                                height: "100%", borderRadius: 4,
                                width: Math.round((val / maxCatVal) * 100) + "%",
                                background: catColors[i % catColors.length],
                                transition: "width 0.5s ease"
                            }})
                        )
                    )
                )
            ),

            // Biggest expense
            biggest.amountCents > 0 && e('div', { style: { ...S.statCard, marginBottom: 24, padding: "20px" } },
                e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 } }, "Biggest Single Expense"),
                e('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                    e('div', null,
                        e('div', { style: { fontSize: 15, fontWeight: 700, color: "var(--text-main)" } }, biggest.name),
                        e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 } }, biggest.category + " - " + biggest.date)
                    ),
                    e('div', { style: { fontSize: 20, fontWeight: 800, color: "#EF4444" } }, fc(biggest.amountCents))
                )
            ),

            // Peak spending day
            peakDayTotal > 0 && e('div', { style: { ...S.statCard, padding: "20px" } },
                e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 } }, "Peak Spending Day"),
                e('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                    e('div', null,
                        e('div', { style: { fontSize: 15, fontWeight: 700, color: "var(--text-main)" } }, getDayName(peakDayIdx) + "s"),
                        e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 } }, "Your highest spending day of the week")
                    ),
                    e('div', { style: { fontSize: 20, fontWeight: 800, color: "#F59E0B" } }, fc(peakDayTotal))
                )
            )
        );
    }

    window.PeraReportView = React.memo(PeraReportView);
})();