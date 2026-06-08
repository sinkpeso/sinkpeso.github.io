// BudgetActualView.js — Budget vs Actual spending analysis for SINKPESO
//
// Shows side-by-side comparison of budget limits vs actual spending per category.
// Uses getCategoryBudgetStatus from selectors.js for all budget math.
//
// RULES:
//   - Every prop validated with safe defaults at the top
//   - Always renders content — never a blank page
//   - All 6 categories always visible regardless of budget limits set
//
// Dependencies: React (global), Icon (global), constants.js globals,
//   window.components.{PageTitle},
//   window.selectors.getCategoryBudgetStatus

(function () {
    "use strict";
    const e = React.createElement;
    const { useMemo } = React;
    const { PageTitle } = window.components;
    const S = window.SINKPESO_S || {};
    const Icon = window.SINKPESO_Icon || function() { return null; };
    const CATEGORIES = ["Food","Gas","Bills","Business","Personal","Savings"];

    // Category → SVG icon name mapping (all valid icons from constants.js)
    var CATEGORY_ICONS = {
        Food: "utensils",
        Gas: "car",
        Bills: "receipt",
        Business: "briefcase",
        Personal: "shoppingbag",
        Savings: "landmark"
    };

    // Safe currency formatter fallback
    function safeFc(fc, cents) {
        try { return fc(cents); } catch(e) { return "\u20B1" + (cents / 100).toFixed(2); }
    }

    // ── CATEGORY CARD ────────────────────────────────────────────────────
    function CategoryCard(props) {
        var item = props.item || {};
        var fc = props.fc;
        var hasLimit = item.limit !== null && item.limit !== undefined && item.limit > 0;
        var pct = hasLimit ? Math.min(Math.round((item.pct || 0) * 100), 999) : 0;
        var isOver = hasLimit && (item.pct || 0) >= 1.0;
        var isWarning = hasLimit && (item.pct || 0) >= 0.8 && (item.pct || 0) < 1.0;
        var barColor = item.pColor || "var(--border)";
        var cKey = item.cKey || "Other";
        var currentVal = item.currentVal || 0;
        var iconName = CATEGORY_ICONS[cKey] || "target";

        return e('div', {
            style: {
                background: "var(--hover-bg)",
                border: "1px solid " + (isOver ? "rgba(255,23,68,0.3)" : "var(--border)"),
                borderRadius: 14,
                padding: "16px",
                marginBottom: 12,
            }
        },
            // Header row
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
                        e('div', { style: { fontSize: 15, fontWeight: 700, color: "var(--text-main)" } }, cKey),
                        e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 } },
                            hasLimit
                                ? safeFc(fc, currentVal) + " of " + safeFc(fc, item.limit)
                                : (currentVal > 0 ? safeFc(fc, currentVal) + " spent" : "No spending yet")
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

            // Progress bar (only when limit set)
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

            // Remaining amount (only when limit set)
            hasLimit && e('div', { style: { display: "flex", justifyContent: "space-between", marginTop: 8 } },
                e('span', { style: { fontSize: 11, color: "var(--text-muted)" } },
                    isOver
                        ? "Over by " + safeFc(fc, currentVal - item.limit)
                        : safeFc(fc, item.limit - currentVal) + " remaining"
                ),
                e('span', { style: { fontSize: 11, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" } },
                    safeFc(fc, currentVal) + " / " + safeFc(fc, item.limit)
                )
            )
        );
    }

    // ── MAIN VIEW ────────────────────────────────────────────────────────
    function BudgetActualView(props) {
        // Bulletproof prop extraction
        var budgets = (props && props.budgets) ? props.budgets : [];
        var fc = (props && props.fc) || function(v) { return "\u20B1" + ((v||0)/100).toFixed(2); };
        var totals = (props && props.totals) || {};
        var catSum = totals.catSum || {};

        // Compute budget status for ALL categories
        var budgetStatus = useMemo(function () {
            try {
                return window.selectors.getCategoryBudgetStatus(catSum, budgets, CATEGORIES);
            } catch(e) {
                // Fallback: build status manually
                return CATEGORIES.map(function (cKey) {
                    var currentVal = catSum[cKey] || 0;
                    var budgetObj = budgets.find(function(b) { return b.category === cKey; });
                    var limit = budgetObj ? budgetObj.limitCents : null;
                    var pct = limit ? (currentVal / limit) : 0;
                    var pColor = "var(--border)";
                    if (limit) {
                        if (pct >= 1.0) pColor = "#FF1744";
                        else if (pct >= 0.8) pColor = "#FFD600";
                        else pColor = "#00E676";
                    }
                    return { cKey: cKey, currentVal: currentVal, limit: limit, pct: pct, pColor: pColor };
                });
            }
        }, [catSum, budgets]);

        // Summary calculations
        var totalBudget = 0;
        var totalSpent = 0;
        var overBudgetCount = 0;
        var warningCount = 0;
        var budgetedCount = 0;

        budgetStatus.forEach(function (x) {
            if (x.limit !== null && x.limit !== undefined && x.limit > 0) {
                totalBudget += x.limit;
                totalSpent += x.currentVal;
                budgetedCount++;
                if (x.pct >= 1.0) overBudgetCount++;
                else if (x.pct >= 0.8) warningCount++;
            }
        });

        var totalRemaining = totalBudget - totalSpent;

        return e('div', null,
            e(PageTitle, { sub: "Track spending against your monthly limits." }, "Budget vs Actual"),

            // Summary cards (always show)
            e('div', { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 24 } },
                e('div', { style: { background: "var(--hover-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", borderLeft: "3px solid #00E676" } },
                    e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 } }, "Total Budget"),
                    e('div', { style: { fontSize: 22, fontWeight: 800, color: "#00E676", fontVariantNumeric: "tabular-nums" } }, safeFc(fc, totalBudget)),
                    e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 4 } }, budgetedCount + " of " + CATEGORIES.length + " categories set")
                ),
                e('div', { style: { background: "var(--hover-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", borderLeft: "3px solid " + (totalSpent > totalBudget && totalBudget > 0 ? "#EF4444" : "#F59E0B") } },
                    e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 } }, "Total Spent"),
                    e('div', { style: { fontSize: 22, fontWeight: 800, color: totalSpent > totalBudget && totalBudget > 0 ? "#EF4444" : "var(--text-main)", fontVariantNumeric: "tabular-nums" } }, safeFc(fc, totalSpent)),
                    e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 4 } },
                        totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) + "% of budget" : "Set limits to track"
                    )
                ),
                e('div', { style: { background: "var(--hover-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", borderLeft: "3px solid " + (totalRemaining >= 0 || totalBudget === 0 ? "#00E676" : "#EF4444") } },
                    e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 } },
                        totalRemaining >= 0 || totalBudget === 0 ? "Remaining" : "Over Budget"
                    ),
                    e('div', { style: { fontSize: 22, fontWeight: 800, color: totalRemaining >= 0 || totalBudget === 0 ? "#00E676" : "#EF4444", fontVariantNumeric: "tabular-nums" } },
                        safeFc(fc, Math.abs(totalRemaining))
                    ),
                    e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 4 } },
                        overBudgetCount > 0 ? overBudgetCount + " over budget" :
                        warningCount > 0 ? warningCount + " nearing limit" :
                        totalBudget > 0 ? "On track" : "Set limits to track"
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

            // ALL categories — always visible
            budgetStatus.map(function (item) {
                return e(CategoryCard, { key: item.cKey, item: item, fc: fc });
            }),

            // CTA if no budgets set
            budgetedCount === 0 && e('div', {
                style: {
                    marginTop: 16, padding: "16px",
                    background: "rgba(0,230,118,0.05)",
                    border: "1px solid rgba(0,230,118,0.15)",
                    borderRadius: 12, textAlign: "center"
                }
            },
                e('div', { style: { fontSize: 14, fontWeight: 700, color: "var(--text-main)", marginBottom: 4 } }, "Set budget limits to track progress"),
                e('div', { style: { fontSize: 13, color: "var(--text-muted)" } }, "Go to the Limits tab to set monthly spending caps per category.")
            )
        );
    }

    window.BudgetActualView = React.memo(BudgetActualView);
})();