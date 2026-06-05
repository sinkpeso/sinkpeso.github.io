// HistoryView.js — Month history & trends for SINKPESO
//
// Dependencies: React (global), Icon (global), utils.js,
//   window.components.{SLabel, S}, selectors.js (globals from index.html)

(function () {
    "use strict";
    const e = React.createElement;
    const { SLabel } = window.components;

    function HistoryView({ archives, fc }) {
        const [selected, setSelected] = React.useState(null);
        const [detailTab, setDetailTab] = React.useState("income");
        const [showUpgrade, setShowUpgrade] = React.useState(false);
        const fmt = (iso) => new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
        const statBox = (label, value, color) => e('div', { style: S.statCard },
            e('div', { style: S.label }, label),
            e('div', { style: { fontSize: 20, fontWeight: 800, color, marginTop:6 } }, value));

        // Archive history limit (free: 2 months, premium: unlimited)
        const isPremium = window.license && window.license.canUseFeature('archiveHistory');
        const archiveLimit = isPremium ? archives.length : Math.min(archives.length, 2);
        const limitedArchives = archives.slice(0, archiveLimit);
        const hiddenCount = archives.length - archiveLimit;

        const chartData = React.useMemo(() => [...limitedArchives].reverse().slice(-6), [limitedArchives]);
        const maxVal = Math.max(1, ...chartData.flatMap(a => [a.totalIncome, a.totalSpent]));

        return e('div', null,
            e('div', { style: S.pageHeader }, e('div', null, e('h2', { style: { fontSize: 22, fontWeight: 800 } }, 'Month History'), e('div', { style: { fontSize: 14, color: "var(--text-muted)", marginTop: 4 } }, 'Archived snapshots and trend lines.')), e('div', { style: { fontSize: 13, color: "var(--text-muted)", fontWeight: 600 } }, `${archives.length} archives`)),

            archives.length > 0 && e('div', { className: "premium-panel" },
                e(SLabel, { style: { marginBottom: 12 } }, "Spending vs Income Trends (Last 6 Months)"),
                e('div', { className: "chart-container" },
                    chartData.map(a => e('div', { key: a.id, className: "chart-bar-group" },
                        e('div', { className: "bars-wrapper" },
                            e('div', { className: "chart-bar bar-income", style: { height: `${(a.totalIncome / maxVal) * 100}%` }, title: `Income: ${fc(a.totalIncome)}` }),
                            e('div', { className: "chart-bar bar-spent", style: { height: `${(a.totalSpent / maxVal) * 100}%` }, title: `Spent: ${fc(a.totalSpent)}` })
                        ),
                        e('span', { style: { fontSize: 10, color: "var(--text-muted)", fontWeight: 600 } }, a.month.split(' ')[0].substring(0,3))
                    ))
                ),
                e('div', { style: { display: "flex", gap: 16, justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--text-muted)" } },
                    e('span', { style: { display: "flex", alignItems: "center", gap: 4 } }, e('div', { style: { width: 10, height: 10, background: "#00E676", borderRadius: 2 } }), "Income"),
                    e('span', { style: { display: "flex", alignItems: "center", gap: 4 } }, e('div', { style: { width: 10, height: 10, background: "#EF4444", borderRadius: 2 } }), "Spent")
                )
            ),

            archives.length === 0 ? e('div', { className: "premium-panel", style: { textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" } },
                e('div', { style: { marginBottom: 14, opacity: 0.35, display: "flex", justifyContent: "center" } }, e(Icon, { name: "calendar", size: 44, color: "var(--text-muted)" })),
                e('div', { style: { fontWeight: 700, fontSize: 15, marginBottom: 8, color: "var(--text-light)" } }, "No archived months yet"),
                e('div', { style: { fontSize: 13, lineHeight: 1.6, maxWidth: 280, margin: "0 auto" } }, 'Use "Archive & Start New Month" at the end of each month to save a snapshot and start fresh.')
            ) :
            e('div', { className: "premium-panel" },
                e(SLabel, { style: { marginBottom: 12 } }, "Archive Ledges"),
                limitedArchives.map(arc => {
                    const isGreen = arc.remaining >= 0;
                    return e('div', { key: arc.id, className: "stream-row", style: { cursor: "pointer" }, onClick: () => { setSelected(arc); setDetailTab("income"); } },
                        e('div', { style: { display: "flex", flexDirection: "column", gap: 3 } },
                            e('div', { style: { fontWeight: 700, color: "var(--text-main)", fontSize: 15 } }, arc.month),
                            e('div', { style: { fontSize: 11, color: "var(--text-muted)" } }, `Closed ${fmt(arc.closedAt)}`)
                        ),
                        e('div', { style: { display: "flex", gap: 32, alignItems: "center" } },
                            e('div', { style: { textAlign: "right" } },
                                e('div', { style: { fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 2 } }, "Remaining"),
                                e('div', { style: { fontSize: 14, fontWeight: 800, color: isGreen ? "#00E676" : "#FF1744" } }, fc(arc.remaining))
                            ),
                            e('div', { style: { color: "var(--text-light)", fontSize: 18 } }, "›")
                        )
                    );
                }),
                // Upgrade prompt for hidden archives
                hiddenCount > 0 && !isPremium && e('div', { style: { textAlign: "center", padding: "16px", borderTop: "1px solid var(--border)", marginTop: 8 } },
                    showUpgrade && window.UpgradePromptModal
                        ? e(window.UpgradePromptModal, {
                            message: "Free users can view the last 2 months of archive history. Upgrade to Premium to unlock unlimited history.",
                            onClose: () => setShowUpgrade(false)
                        })
                        : e('div', null,
                            e('div', { style: { fontSize: 13, color: "var(--text-muted)", marginBottom: 10 } }, `${hiddenCount} older archive${hiddenCount > 1 ? 's' : ''} hidden — upgrade to view all`),
                            e('button', { onClick: () => setShowUpgrade(true), style: { background: "transparent", border: "1px solid rgba(0,230,118,0.3)", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#00E676", cursor: "pointer", fontFamily: "inherit" } }, "Unlock All History — ₱250")
                        )
                )
            ),

            selected && e('div', { className: "modal-overlay", onClick: () => setSelected(null) },
                e('div', { className: "modal-container", style: { maxWidth: 560, maxHeight: "85vh", overflowY: "auto" }, onClick: ev => ev.stopPropagation() },
                    e('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 } },
                        e('div', null,
                            e('h3', { style: { fontSize: 20, fontWeight: 800, color: "var(--text-main)" } }, selected.month),
                            e('div', { style: { fontSize: 12, color: "var(--text-muted)", marginTop: 4 } }, `Closed ${fmt(selected.closedAt)}`)
                        ),
                        e('button', { onClick: () => setSelected(null), style: S.closeBtn }, e(Icon, { name: "x", size: 16 }))
                    ),
                    e('div', { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 } },
                        statBox("Total Income", fc(selected.totalIncome), "var(--text-main)"),
                        statBox("Total Spent", fc(selected.totalSpent), "#EF4444"),
                        statBox("Bills Paid", fc(selected.totalBills), "#A855F7"),
                        statBox("In Savings", fc(selected.totalSavings), "#10B981")
                    ),
                    e('div', { style: { display: "flex", gap: 6, marginBottom: 18, background: "var(--hover-bg)", borderRadius: 12, padding: 4 } },
                        ["income", "bills", "expenses", "wallets"].map(t => e('button', { key: t, onClick: () => setDetailTab(t), style: { flex: 1, background: detailTab === t ? "var(--border)" : "transparent", border: "none", color: detailTab === t ? "var(--text-main)" : "var(--text-muted)", padding: "7px 0", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, textTransform: "capitalize", fontFamily: "inherit" } }, t))
                    ),
                    detailTab === "income" && e('div', null,
                        selected.snapshot.incomes.length === 0
                            ? e('div', { style: { padding: "16px 0", textAlign: "center", fontSize: 13, color: "var(--text-muted)" } }, "No income recorded this month.")
                            : selected.snapshot.incomes.map(i => e('div', { key: i.id, className: "stream-row" }, e('div', null, e('div', { style: { fontWeight: 600 } }, i.name)), e('div', { style: { color: "#00E676", fontWeight: 700 } }, `+${fc(i.amountCents)}`)))
                    ),
                    detailTab === "bills" && e('div', null,
                        selected.snapshot.bills.length === 0
                            ? e('div', { style: { padding: "16px 0", textAlign: "center", fontSize: 13, color: "var(--text-muted)" } }, "No bills recorded this month.")
                            : selected.snapshot.bills.map(b => e('div', { key: b.id, className: "stream-row" }, e('div', null, e('div', { style: { fontWeight: 600, textDecoration: b.isPaid ? "line-through" : "none", opacity: b.isPaid ? 0.5 : 1 } }, b.name), e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 } }, b.isPaid ? "Paid" : "Unpaid")), e('div', { style: { fontWeight: 700 } }, fc(b.amountCents))))
                    ),
                    detailTab === "expenses" && e('div', null,
                        selected.snapshot.dailyExpenses.length === 0
                            ? e('div', { style: { padding: "16px 0", textAlign: "center", fontSize: 13, color: "var(--text-muted)" } }, "No expenses recorded this month.")
                            : selected.snapshot.dailyExpenses.map(ex => e('div', { key: ex.id, className: "stream-row" }, e('div', null, e('div', { style: { fontWeight: 600 } }, ex.name), e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 } }, ex.category)), e('div', { style: { fontWeight: 700, color: "#EF4444" } }, `-${fc(ex.amountCents)}`)))
                    ),
                    detailTab === "wallets" && e('div', null,
                        !selected.snapshot.wallets || selected.snapshot.wallets.length === 0
                            ? e('div', { style: { padding: "16px 0", textAlign: "center", fontSize: 13, color: "var(--text-muted)" } }, "No wallet snapshot for this archive.")
                            : selected.snapshot.wallets.map(w => e('div', { key: w.id, className: "stream-row" },
                                e('div', { style: { display:"flex", alignItems:"center", gap:10 } },
                                    e('div', { style: { width:10, height:10, borderRadius:"50%", background: w.color || "#00E676", flexShrink:0 } }),
                                    e('div', { style: { fontWeight: 600 } }, w.name)
                                ),
                                e('div', { style: { fontWeight: 700, color: (w.balanceCents||0) < 0 ? "#EF4444" : "var(--text-main)" } }, fc(w.balanceCents || 0))
                            ))
                    )
                )
            )
        );
    }

    window.HistoryView = React.memo(HistoryView);
})();