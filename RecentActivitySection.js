// RecentActivitySection.js — Dashboard recent activity feed for SINKPESO
//
// Dependencies: React (global), Icon (global), utils.js, selectors.js,
//   window.components.{Btn, SLabel}

(function () {
    "use strict";
    const e = React.createElement;
    const { Btn, SLabel } = window.components;

    function RecentActivitySection({ incomes, dailyExpenses, bills, txns, funds, wallets, archives, fc, onNavigate }) {
        const relTime = (dateStr) => {
            if (!dateStr) return "";
            const today = new Date().toISOString().slice(0, 10);
            if (dateStr === today) return "Today";
            const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
            if (dateStr === yesterday) return "Yesterday";
            const diffDays = Math.floor((new Date(today) - new Date(dateStr)) / 86400000);
            if (diffDays < 7) return `${diffDays}d ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
            return `${Math.floor(diffDays / 30)}mo ago`;
        };

        const activities = React.useMemo(() =>
            window.selectors.getRecentActivities({ dailyExpenses, incomes, txns, bills, funds, wallets, archives }),
        [incomes, dailyExpenses, bills, txns, funds, wallets, archives]);

        return e('div', { className: "premium-panel", style: { marginTop: 20 } },
            e('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 } },
                e(SLabel, null, "Recent Activity"),
                activities.length > 0 && e('button', {
                    onClick: () => onNavigate("transactions"),
                    style: { background: "transparent", border: "none", color: "var(--text-muted)", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", padding: 0 }
                }, "View All →")
            ),

            activities.length === 0
                ? e('div', { style: { padding: "28px 0", textAlign: "center" } },
                    e('div', { style: { marginBottom: 12, opacity: 0.35, display: "flex", justifyContent: "center" } },
                        e(Icon, { name: "trendingup", size: 36, color: "var(--text-muted)" })
                    ),
                    e('div', { style: { fontWeight: 700, fontSize: 14, color: "var(--text-light)", marginBottom: 6 } }, "No recent activity yet"),
                    e('div', { style: { fontSize: 12, color: "var(--text-muted)", marginBottom: 14 } }, "Your transactions will appear here"),
                    e(Btn, { v: "accent", style: { fontSize: 12, padding: "9px 20px" }, onClick: () => onNavigate("daily") }, "Log First Expense")
                )
                : activities.map(item => e('div', {
                    key: item.id,
                    className: "stream-row",
                    style: { cursor: "pointer" },
                    onClick: () => onNavigate(item.navTarget)
                },
                    e('div', { style: { display: "flex", alignItems: "center", gap: 11 } },
                        e('div', { style: {
                            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                            background: item.iconColor + "18",
                            border: "1px solid " + item.iconColor + "35",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        } }, e(Icon, { name: item.icon, size: 15, color: item.iconColor })),
                        e('div', null,
                            e('div', { style: { fontWeight: 600, color: "var(--text-main)", fontSize: 13 } }, item.title),
                            e('div', { style: { display: "flex", gap: 7, alignItems: "center", marginTop: 2, flexWrap: "wrap" } },
                                e('span', { style: { fontSize: 11, color: "var(--text-muted)" } }, item.subtitle),
                                item.walletName && e('span', { style: {
                                    fontSize: 10, fontWeight: 700, color: "var(--text-light)",
                                    background: "var(--hover-bg)", padding: "1px 6px", borderRadius: 4
                                } }, item.walletName)
                            )
                        )
                    ),
                    e('div', { style: { textAlign: "right", flexShrink: 0 } },
                        item.amountCents != null && e('div', { style: { fontWeight: 700, color: item.amountColor, fontSize: 13, fontVariantNumeric: "tabular-nums" } },
                            `${item.amountPrefix}${fc(item.amountCents)}`),
                        e('div', { style: { fontSize: 10, color: "var(--text-muted)", marginTop: 2 } }, relTime(item.date))
                    )
                ))
        );
    }

    window.RecentActivitySection = RecentActivitySection;
})();