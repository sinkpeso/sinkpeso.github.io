// BudgetActualView.js — Budget vs Actual spending analysis for SINKPESO
//
// Shows side-by-side comparison of budget limits vs actual spending per category.
// Uses getCategoryBudgetStatus from selectors.js for all budget math.
//
// Dependencies: React (global), Icon (global), constants.js globals,
//   window.components.{PageTitle, SLabel, Btn},
//   window.selectors.getCategoryBudgetStatus

(function () {
    "use strict";
    const e = React.createElement;
    const { useMemo } = React;
    const { PageTitle } = window.components;
    const S = window.SINKPESO_S;
    const Icon = window.SINKPESO_Icon;
    const CATEGORIES = window.SINKPESO_CONSTANTS ? window.SINKPESO_CONSTANTS.CATEGORIES : ["Food","Gas","Bills","Business","Personal","Savings"];

    // Category → SVG icon name mapping
    var CATEGORY_ICONS = {
        Food: "utensils",
        Gas: "car",
        Bills: "receipt",
        Business: "briefcase",
        Personal: "shoppingbag",
        Savings: "landmark"
    };

    // ── CATEGORY CARD ────────────────────────────────────────────────────
    function CategoryCard({ item, fc }) {
        var hasLimit = item.limit !== null && item.limit > 0;
        var pct = hasLimit ? Math.min(Math.round(item.pct * 100), 999) : 0;
        var isOver = hasLimit && item.pct >= 1.0;
        var isWarning = hasLimit && item.pct >= 0.8 && item.pct < 1.0;
        var barColor = item.pColor;
        var iconName = CATEGORY_ICONS[item.cKey] || "target";

        return e('div', {
            style: {
                background: "var(--hover-bg)",
                border: "1px solid " + (isOver ? "rgba(255,23,68,0.3)" : "var(--border)"),
                borderRadius: 14,
                padding: "16px",
                marginBottom: 12,
            }
        },
            // Header row: icon + category name + badges
            e('div', { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 } },
                e('div', { style: { display: "flex", alignItems: "center", gap: 10 } },
                    e('div', {
                        style: {
                            width: 36, height: 36, borderRadius: 10,
                            background: isOver ? "rgba(255,23,68,0.1)" : hasLimit ? "rgba(0,230,118,0.08)" : "var(--hover-bg)",
                            border: "1px solid " + (isOver ? "rgba(255,23,68,0.2)" : "var(--border)"),
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                        }
                    },
                        e(Icon, { name: iconName, size: 18, color: isOver ? "#EF4444" : hasLimit ? "#00E676" : "var(--text-muted)" })
                    ),
                    e('div', null,
                        e('div', { style: { fontSize: 15, fontWeight: 700, color: "var(--text-main)" } }, item.cKey),
                        e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 } },
                            hasLimit
                                ? fc(item.currentVal) + " of " + fc(item.limit)
                                : fc(item.currentVal) + " spent"
                        )
                    )
                ),
                // Right side: percentage + badge
                e('div', { style: { textAlign: "right", flexShrink: 0 } },
                    hasLimit
                        ? e('div', { style: { fontSize: 18, fontWeight: 800, color: isOver ? "#EF4444" : isWarning ? "#F59E0B" : "#00E676", fontVariantNumeric: "tabular-nums" } }, pct + "%")
                        : e('div', { style: { fontSize: 13, fontWeight: 600, color: "var(--text-muted)" } }, "No limit"),
                    isOver && e('span', {
                        style: {
                            fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                            background: "rgba(255,23,68,0.12)", color: "#EF4444",
                            border: "1px solid rgba(255,23,68,0.25)",
                        }
                    }, "Over budget"),
                    isWarning && e('span', {
                        style: {
                            fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                            background: "rgba(245,158,11,0.12)", color: "#F59E0B",
                            border: "1px solid rgba(245,158,11,0.25)",
                        }
                    }, "Warning")
                )
            ),

            // Progress bar
            hasLimit && e('div', { style: { height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" } },
                e('div', {
                    style: {
                        height: "100%", borderRadius: 4,
                        width: Math.min(pct, 100) + "%",
                        background: barColor,
                        transition: "width 0.4s ease, background 0.3s ease",
                    }
                })
            ),

            // Remaining amount
            hasLimit && e('div', { style: { display: "flex", justifyContent: "space-between", marginTop: 8 } },
                e('span', { style: { fontSize: 11, color: "var(--text-muted)" } },
                    isOver
                        ? "Over by " + fc(item.currentVal - item.limit)
                        : fc(item.limit - item.currentVal) + " remaining"
                ),
                e('span', { style: { fontSize: 11, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" } },
                    fc(item.currentVal) + " / " + fc(item.limit)
                )
            )
        );
    }

    // ── MAIN VIEW ────────────────────────────────────────────────────────
    function BudgetActualView({ budgets, fc, totals }) {
        var budgetStatus = useMemo(function () {
            return window.selectors.getCategoryBudgetStatus(totals.catSum, budgets, CATEGORIES);
        }, [totals.catSum, budgets]);

        // Summary calculations
        var totalBudget = budgets.reduce(function (s, b) { return s + b.limitCents; }, 0);
        var budgetedCategories = budgetStatus.filter(function (x) { return x.limit !== null && x.limit > 0; });
        var totalSpent = budgetedCategories.reduce(function (s, x) { return s + x.currentVal; }, 0);
        var totalRemaining = totalBudget - totalSpent;
        var overBudgetCount = budgetedCategories.filter(function (x) { return x.pct >= 1.0; }).length;
        var warningCount = budgetedCategories.filter(function (x) { return x.pct >= 0.8 && x.pct < 1.0; }).length;

        var hasAnyBudgets = budgets.length > 0;

        return e('div', null,
            e(PageTitle, { sub: "Track spending against your monthly limits." }, "Budget vs Actual"),

            // Summary cards
            hasAnyBudgets && e('div', { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 24 } },
                e('div', { style: { ...S.statCard, borderLeft: "3px solid #00E676" } },
                    e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 } },
                        e(Icon, { name: "target", size: 12, color: "#00E676" }),
                        "Total Budget"
                    ),
                    e('div', { style: { fontSize: 22, fontWeight: 800, color: "#00E676", fontVariantNumeric: "tabular-nums" } }, fc(totalBudget)),
                    e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 4 } }, budgetedCategories.length + " categories set")
                ),
                e('div', { style: { ...S.statCard, borderLeft: "3px solid " + (totalSpent > totalBudget ? "#EF4444" : "#F59E0B") } },
                    e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 } },
                        e(Icon, { name: "wallet", size: 12, color: "#F59E0B" }),
                        "Total Spent"
                    ),
                    e('div', { style: { fontSize: 22, fontWeight: 800, color: totalSpent > totalBudget ? "#EF4444" : "var(--text-main)", fontVariantNumeric: "tabular-nums" } }, fc(totalSpent)),
                    e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 4 } },
                        totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) + "% of budget" : ""
                    )
                ),
                e('div', { style: { ...S.statCard, borderLeft: "3px solid " + (totalRemaining >= 0 ? "#00E676" : "#EF4444") } },
                    e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 } },
                        e(Icon, { name: totalRemaining >= 0 ? "shield" : "target", size: 12, color: totalRemaining >= 0 ? "#00E676" : "#EF4444" }),
                        totalRemaining >= 0 ? "Remaining" : "Over Budget"
                    ),
                    e('div', { style: { fontSize: 22, fontWeight: 800, color: totalRemaining >= 0 ? "#00E676" : "#EF4444", fontVariantNumeric: "tabular-nums" } },
                        fc(Math.abs(totalRemaining))
                    ),
                    e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 4 } },
                        overBudgetCount > 0 ? overBudgetCount + " over budget" :
                        warningCount > 0 ? warningCount + " nearing limit" :
                        "On track"
                    )
                )
            ),

            // Alert banner if over budget
            overBudgetCount > 0 && e('div', {
                style: {
                    background: "rgba(255,23,68,0.08)",
                    border: "1px solid rgba(255,23,68,0.2)",
                    borderRadius: 12, padding: "12px 16px", marginBottom: 20,
                    display: "flex", alignItems: "center", gap: 10,
                }
            },
                e(Icon, { name: "target", size: 16, color: "#EF4444" }),
                e('span', { style: { fontSize: 13, fontWeight: 600, color: "#EF4444" } },
                    overBudgetCount + " categor" + (overBudgetCount > 1 ? "ies have" : "y has") + " exceeded the budget limit."
                )
            ),

            // Category cards
            hasAnyBudgets
                ? budgetStatus
                    .filter(function (x) { return x.limit !== null && x.limit > 0; })
                    .sort(function (a, b) { return b.pct - a.pct; })
                    .map(function (item) {
                        return e(CategoryCard, { key: item.cKey, item: item, fc: fc });
                    })
                : e(window.EmptyState, {
                    icon: "target",
                    title: "No budget limits set",
                    sub: "Go to Limits tab to set monthly spending caps per category."
                }),

            // Unbudgeted categories section
            hasAnyBudgets && budgetStatus.some(function (x) { return x.limit === null; }) && e('div', { style: { marginTop: 24 } },
                e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 } }, "Unbudgeted Categories"),
                budgetStatus
                    .filter(function (x) { return x.limit === null; })
                    .map(function (item) {
                        var iconName = CATEGORY_ICONS[item.cKey] || "target";
                        return e('div', {
                            key: item.cKey,
                            style: {
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "10px 14px", borderRadius: 10,
                                background: "var(--hover-bg)", border: "1px solid var(--border)",
                                marginBottom: 8,
                            }
                        },
                            e('div', { style: { display: "flex", alignItems: "center", gap: 10 } },
                                e(Icon, { name: iconName, size: 16, color: "var(--text-muted)" }),
                                e('span', { style: { fontSize: 13, fontWeight: 600, color: "var(--text-light)" } }, item.cKey)
                            ),
                            e('span', { style: { fontSize: 13, fontWeight: 700, color: item.currentVal > 0 ? "var(--text-main)" : "var(--text-muted)", fontVariantNumeric: "tabular-nums" } },
                                item.currentVal > 0 ? fc(item.currentVal) : "No spending"
                            )
                        );
                    })
            )
        );
    }

    window.BudgetActualView = React.memo(BudgetActualView);
})();