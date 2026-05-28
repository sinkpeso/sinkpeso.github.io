// InsightStrip.js — Smart financial insight chips for SINKPESO
//
// What this does:
//   Reads totals, bills, and budgets, then shows a scrollable row of
//   coloured chips — e.g. "Safe to spend ₱120/day", "2 bills overdue".
//   Returns nothing (null) if there are no insights to show.
//
// Dependencies (must be loaded before this file):
//   - React          (via <script> in index.html)
//   - Icon           (defined in index.html main script)
//   - getDaysRemaining, safeDiv  (from window.utils, loaded via utils.js)
//   - CATEGORIES     (constant defined in index.html main script)
//
// Usage (no change needed — identical to before):
//   e(InsightStrip, { totals, bills, budgets, fc })

(function () {
    const e = React.createElement;

    // Pull helpers from window.utils (extracted in a previous step)
    const getDaysRemaining = window.utils.getDaysRemaining;
    const safeDiv          = window.utils.safeDiv;
    // CATEGORIES is defined in index.html's main <script> — resolve at render time, not load time
    const getCats = () => window.CATEGORIES || [];

    function InsightStrip({ totals, bills, budgets, fc }) {
        // Safety guard — render nothing if any required prop is missing
        if (!totals || !bills || !budgets || !fc) return null;

        const chips = [];

        // How many days are left in the current month
        const today      = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const daysLeft    = Math.max(1, daysInMonth - today.getDate());

        // ── Chip 1: Safe daily spend ─────────────────────────────────────────
        const safe = (totals.netAvailable || 0) > 0
            ? Math.floor(totals.netAvailable / daysLeft)
            : 0;
        if (safe > 0)
            chips.push({
                icon: "trendingup",
                text: `Safe to spend ${fc(safe)}/day`,
                c: "#00E676", bg: "rgba(0,230,118,0.08)", border: "rgba(0,230,118,0.2)"
            });

        // ── Chip 2: Overdue bills ────────────────────────────────────────────
        const overdue = bills.filter(b => !b.isPaid && getDaysRemaining(b.dueDate) < 0).length;
        if (overdue > 0)
            chips.push({
                icon: "arrowupdown",
                text: `${overdue} bill${overdue > 1 ? "s" : ""} overdue`,
                c: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)"
            });

        // ── Chip 3: Bills due this week ──────────────────────────────────────
        const dueSoon = bills.filter(b => {
            const d = getDaysRemaining(b.dueDate);
            return !b.isPaid && d >= 0 && d <= 7;
        }).length;
        if (dueSoon > 0)
            chips.push({
                icon: "receipt",
                text: `${dueSoon} bill${dueSoon > 1 ? "s" : ""} due this week`,
                c: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)"
            });

        // ── Chip 4: Category budget almost full (80–99%) ─────────────────────
        const warnCat = getCats().find(k => {
            const b = budgets.find(x => x.category === k);
            const ratio = b ? safeDiv(totals.catSum[k] || 0, b.limitCents) : 0;
            return b && ratio >= 0.8 && ratio < 1;
        });
        if (warnCat)
            chips.push({
                icon: "target",
                text: `${warnCat} budget almost full`,
                c: "#FFD600", bg: "rgba(255,214,0,0.08)", border: "rgba(255,214,0,0.2)"
            });

        // ── Chip 5: Category budget exceeded (≥100%) ─────────────────────────
        const overCat = getCats().find(k => {
            const b = budgets.find(x => x.category === k);
            return b && safeDiv(totals.catSum[k] || 0, b.limitCents) >= 1;
        });
        if (overCat)
            chips.push({
                icon: "target",
                text: `${overCat} budget exceeded`,
                c: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)"
            });

        // ── Chip 6: All bills cleared ────────────────────────────────────────
        if (!overdue && !dueSoon && bills.filter(b => !b.isPaid).length === 0 && bills.length > 0)
            chips.push({
                icon: "shield",
                text: "All bills cleared",
                c: "#00E676", bg: "rgba(0,230,118,0.08)", border: "rgba(0,230,118,0.2)"
            });

        // Nothing to show
        if (!chips.length) return null;

        // Render a horizontally scrollable row of chips
        return e('div', {
            style: {
                display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4,
                marginBottom: 20, scrollbarWidth: "none",
                msOverflowStyle: "none", WebkitOverflowScrolling: "touch"
            }
        },
            chips.map((ch, i) =>
                e('div', {
                    key: i,
                    style: {
                        display: "flex", alignItems: "center", gap: 6,
                        background: ch.bg, border: `1px solid ${ch.border}`,
                        color: ch.c, padding: "7px 13px", borderRadius: 20,
                        fontSize: 12, fontWeight: 700,
                        whiteSpace: "nowrap", flexShrink: 0
                    }
                },
                    e(Icon, { name: ch.icon, size: 12, color: ch.c }),
                    e('span', null, ch.text)
                )
            )
        );
    }

    // Expose to window so index.html can use it as a global
    window.InsightStrip = InsightStrip;

    if (window.PropTypes) {
        InsightStrip.propTypes = {
            totals: PropTypes.object.isRequired,
            bills: PropTypes.array.isRequired,
            budgets: PropTypes.array.isRequired,
            fc: PropTypes.func.isRequired,
        };
    }

})();
