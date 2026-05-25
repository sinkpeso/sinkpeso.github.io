// selectors.js — Pure derived state for SINKPESO
//
// Rules:
//   - No React. No side effects. No localStorage.
//   - All money values are integer cents throughout.
//   - Returns plain objects — safe to useMemo over.
//
// Depends on: utils.js  (window.utils must be loaded first)
//
// Usage:
//   const totals = useMemo(
//     () => window.selectors.computeTotals({ incomes, bills, funds, txns, dailyExpenses }),
//     [incomes, bills, funds, txns, dailyExpenses]
//   );

(function () {
    const { safeDiv, getDaysRemaining } = window.utils;

    // ── computeTotals ─────────────────────────────────────────────────────────
    // Derives the full financial summary from raw state arrays.
    //
    // @param {object} opts
    //   incomes       Array of income records      { amountCents }
    //   bills         Array of bill records         { amountCents, isPaid, dueDate }
    //   funds         Array of vault records        { id, startCents, goalCents }
    //   txns          Array of transaction records  { fundId, type, amountCents }
    //   dailyExpenses Array of expense records      { amountCents, category }
    //
    // @returns {object}  totals — see return statement for full shape
    //
    function computeTotals({ incomes, bills, funds, txns, dailyExpenses }) {
        // ── Core money flows ─────────────────────────────────────────────────
        const totalIncome     = incomes.reduce((s, i) => s + i.amountCents, 0);
        const paidBills       = bills.reduce((s, b) => s + (b.isPaid  ? b.amountCents : 0), 0);
        const unpaidBills     = bills.reduce((s, b) => s + (!b.isPaid ? b.amountCents : 0), 0);
        const totalDailySpent = dailyExpenses.reduce((s, ex) => s + ex.amountCents, 0);

        // ── Vault balances ───────────────────────────────────────────────────
        let totalInGoals = 0;
        const enrichedFunds = funds.map(f => {
            const recs = txns.filter(t => t.fundId === f.id);
            const dep  = recs.filter(t => t.type === "deposit").reduce((s, t) => s + t.amountCents, 0);
            const wit  = recs.filter(t => t.type === "withdrawal").reduce((s, t) => s + t.amountCents, 0);
            const bal  = (f.startCents || 0) + dep - wit;
            totalInGoals += bal;
            return { ...f, bal, pct: safeDiv(bal, f.goalCents) };
        });

        // ── Net spendable cash this month ─────────────────────────────────────
        const netAvailable = totalIncome - paidBills - totalDailySpent - totalInGoals;

        // ── Category spending breakdown ───────────────────────────────────────
        const catSum = { Food: 0, Gas: 0, Bills: 0, Business: 0, Personal: 0, Savings: totalInGoals };
        dailyExpenses.forEach(ex => { catSum[ex.category] = (catSum[ex.category] || 0) + ex.amountCents; });
        bills.filter(b => b.isPaid).forEach(b => { catSum.Bills = (catSum.Bills || 0) + b.amountCents; });

        // ── Health badge (highest-priority wins) ──────────────────────────────
        let healthStatus       = { label: "Optimal",          color: "#00E676", bg: "rgba(0,230,118,0.08)"  };
        const closeBillExists  = bills.some(b => !b.isPaid && getDaysRemaining(b.dueDate) <= 3);
        const spendRatio       = safeDiv(totalDailySpent, totalIncome);

        if      (netAvailable < 0)                   healthStatus = { label: "⚠️ Deficit",        color: "#FF1744", bg: "rgba(255,23,68,0.09)"  };
        else if (closeBillExists || unpaidBills > 0) healthStatus = { label: "Overhead Warning",  color: "#FF1744", bg: "rgba(255,23,68,0.09)"  };
        else if (spendRatio > 0.40)                  healthStatus = { label: "Caution",            color: "#FFD600", bg: "rgba(255,214,0,0.09)" };

        return {
            totalIncome,
            paidBills,
            unpaidBills,
            totalDailySpent,
            totalInGoals,
            netAvailable,
            enrichedFunds,
            catSum,
            healthStatus,
        };
    }

    window.selectors = { computeTotals };

})();
