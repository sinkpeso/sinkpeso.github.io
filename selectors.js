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

    // ── getWalletTotal ────────────────────────────────────────────────────────
    // Sums balanceCents across all wallets.
    // Wallet balances persist across month resets — this is intentionally
    // separate from the monthly budget totals in computeTotals.
    //
    // @param  {Array}  wallets   Array of wallet records { balanceCents }
    // @returns {number}          Total balance in integer cents
    //
    function getWalletTotal(wallets) {
        return (wallets || []).reduce((s, w) => s + (w.balanceCents || 0), 0);
    }

    // ── getSpendPercentage ────────────────────────────────────────────────────
    // Computes the fraction of income consumed by daily expenses + paid bills.
    // Used to drive the radial budget gauge on the dashboard.
    //
    // @param  {object} totals   Output of computeTotals
    // @returns {number}         0–1+ ratio (may exceed 1.0 in deficit)
    //
    function getSpendPercentage(totals) {
        if (!totals.totalIncome) return 0;
        return (totals.totalDailySpent + totals.paidBills) / totals.totalIncome;
    }

    // ── getDailySafeSpend ─────────────────────────────────────────────────────
    // Divides net available cash by days remaining in the current calendar month.
    // Returns 0 if netAvailable is zero or negative (deficit guard).
    //
    // @param  {number} netAvailable   Integer cents; from computeTotals
    // @returns {{ daysLeft: number, safeDailySpend: number }}
    //
    function getDailySafeSpend(netAvailable) {
        const now         = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dayOfMonth  = now.getDate();
        const daysLeft    = Math.max(1, daysInMonth - dayOfMonth);
        const safeDailySpend = netAvailable > 0 ? Math.floor(netAvailable / daysLeft) : 0;
        return { daysLeft, safeDailySpend };
    }

    // ── getUpcomingBills ──────────────────────────────────────────────────────
    // Returns only unpaid bills, sorted ascending by due date (soonest first).
    // Used by the dashboard upcoming-bills panel.
    //
    // @param  {Array}  bills   Raw bills state array
    // @returns {Array}         Filtered + sorted bill records
    //
    function getUpcomingBills(bills) {
        return (bills || [])
            .filter(b => !b.isPaid)
            .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
    }

    // ── getCategoryBudgetStatus ───────────────────────────────────────────────
    // Enriches each spending category with its current spend, budget limit,
    // fill percentage, and threshold colour. Centralises the budget-vs-actual
    // colour logic that previously lived inline inside DashboardOverview.
    //
    // @param  {object} catSum      { Food, Gas, Bills, … } — from computeTotals
    // @param  {Array}  budgets     Budget limit records { category, limitCents }
    // @param  {Array}  categories  Ordered category key list (e.g. CATEGORIES)
    // @returns {Array}             [{ cKey, currentVal, limit, pct, pColor }, …]
    //
    function getCategoryBudgetStatus(catSum, budgets, categories) {
        return (categories || []).map(cKey => {
            const currentVal = (catSum || {})[cKey] || 0;
            const budgetObj  = (budgets || []).find(b => b.category === cKey);
            const limit      = budgetObj ? budgetObj.limitCents : null;
            const pct        = limit ? safeDiv(currentVal, limit) : 0;
            let pColor = "#00E676";
            if (limit) {
                if      (pct >= 1.0) pColor = "#FF1744";
                else if (pct >= 0.8) pColor = "#FFD600";
            } else {
                pColor = "var(--border)";
            }
            return { cKey, currentVal, limit, pct, pColor };
        });
    }

    // ── resolveWalletName ─────────────────────────────────────────────────────
    // Derives the display name for a wallet reference.
    // walletId is the source of truth; walletNameSnapshot is the deleted-wallet
    // fallback written at transaction time.
    //
    // @param  {string|null} walletId   Wallet id stored on the record
    // @param  {string|null} snapshot   walletNameSnapshot stored on the record
    // @param  {Array}       wallets    Live wallet array
    // @returns {string|null}
    //
    function resolveWalletName(walletId, snapshot, wallets) {
        const w = (wallets || []).find(x => x.id === walletId);
        return w ? w.name : (snapshot || null);
    }

    // ── getRecentActivities ───────────────────────────────────────────────────
    // Builds the unified, time-sorted activity feed shown on the dashboard.
    // Merges expenses, income, bill payments, vault transactions, and archive
    // events into a single normalised item shape, then slices to `limit`.
    //
    // @param {object} opts
    //   dailyExpenses, incomes, txns, bills, funds, wallets, archives
    //   limit  {number}  max items to return (default 10)
    // @returns {Array}   Normalised activity items sorted newest-first
    //
    function getRecentActivities({ dailyExpenses, incomes, txns, bills, funds, wallets, archives, limit = 10 }) {
        const resolve = (walletId, snapshot) => resolveWalletName(walletId, snapshot, wallets);
        const items = [];

        (dailyExpenses || []).forEach(ex => {
            items.push({
                id: `exp-${ex.id}`, icon: "wallet", iconColor: "#EF4444",
                title: ex.name, subtitle: ex.category,
                amountCents: ex.amountCents, amountColor: "#EF4444", amountPrefix: "−",
                date: ex.date,
                walletName: resolve(ex.walletId, ex.walletNameSnapshot),
                navTarget: "daily",
            });
        });

        (incomes || []).forEach(inc => {
            items.push({
                id: `inc-${inc.id}`, icon: "trendingup", iconColor: "#00E676",
                title: inc.name, subtitle: "Income",
                amountCents: inc.amountCents, amountColor: "#00E676", amountPrefix: "+",
                date: inc.date,
                walletName: resolve(inc.walletId, inc.walletNameSnapshot),
                navTarget: "budget",
            });
        });

        (txns || []).filter(t => t.type === "bill_payment").forEach(t => {
            const bill = (bills || []).find(b => b.id === t.billId);
            items.push({
                id: `bill-${t.id}`, icon: "receipt", iconColor: "#A855F7",
                title: bill ? bill.name + " Paid" : "Bill Paid", subtitle: "Bill",
                amountCents: t.amountCents, amountColor: "#A855F7", amountPrefix: "✓",
                date: t.date,
                walletName: resolve(t.walletId, t.walletNameSnapshot),
                navTarget: "budget",
            });
        });

        (txns || []).filter(t => t.fundId).forEach(t => {
            const fund      = (funds || []).find(f => f.id === t.fundId);
            const isDeposit = t.type === "deposit";
            items.push({
                id: `vault-${t.id}`, icon: "landmark",
                iconColor:    isDeposit ? "#2563EB" : "#F59E0B",
                title:        (isDeposit ? "Deposit → " : "Withdraw ← ") + (fund ? fund.name : "Vault"),
                subtitle:     isDeposit ? "Vault Deposit" : "Vault Withdrawal",
                amountCents:  t.amountCents,
                amountColor:  isDeposit ? "#2563EB" : "#F59E0B",
                amountPrefix: isDeposit ? "+" : "−",
                date: t.date,
                walletName: resolve(t.walletId, t.walletNameSnapshot),
                navTarget: "goals",
            });
        });

        (archives || []).slice(0, 3).forEach(arc => {
            items.push({
                id: `arc-${arc.id}`, icon: "archive", iconColor: "#A855F7",
                title: arc.month + " Archived", subtitle: "Monthly Snapshot",
                amountCents: null, amountColor: null, amountPrefix: null,
                date: arc.closedAt ? arc.closedAt.slice(0, 10) : "",
                walletName: null, navTarget: "history",
            });
        });

        return items
            .filter(i => i.date)
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, limit);
    }

    // ── getAllTransactionItems ─────────────────────────────────────────────────
    // Builds the unified, date-sorted transaction list for AllTransactionsView.
    // Produces a normalised shape across expenses, income, bill payments, and
    // vault transactions so the view only needs to render — no branching logic.
    //
    // @param {object} opts
    //   dailyExpenses, incomes, txns, bills, funds, wallets
    // @returns {Array}   All items sorted newest-first (date desc, id desc tie)
    //
    function getAllTransactionItems({ dailyExpenses, incomes, txns, bills, funds, wallets }) {
        const resolve = (walletId, snapshot) => resolveWalletName(walletId, snapshot, wallets);
        const items = [];

        (dailyExpenses || []).forEach(ex => {
            items.push({
                id: `exp-${ex.id}`, rawId: ex.id, source: "expense", icon: "wallet",
                title: ex.name, subtitle: ex.category,
                amountCents: ex.amountCents, date: ex.date, walletId: ex.walletId,
                walletName: resolve(ex.walletId, ex.walletNameSnapshot),
                amountColor: "#EF4444", amountPrefix: "−",
            });
        });

        (incomes || []).forEach(inc => {
            items.push({
                id: `inc-${inc.id}`, rawId: inc.id, source: "income", icon: "trendingup",
                title: inc.name, subtitle: "Income",
                amountCents: inc.amountCents, date: inc.date, walletId: inc.walletId,
                walletName: resolve(inc.walletId, inc.walletNameSnapshot),
                amountColor: "#00E676", amountPrefix: "+",
            });
        });

        (txns || []).filter(t => t.type === "bill_payment").forEach(t => {
            const bill = (bills || []).find(b => b.id === t.billId);
            items.push({
                id: `bill-${t.id}`, rawId: t.id, source: "bill", icon: "receipt",
                title: bill ? bill.name : "Bill Payment", subtitle: "Bill",
                amountCents: t.amountCents, date: t.date, walletId: t.walletId,
                walletName: resolve(t.walletId, t.walletNameSnapshot),
                amountColor: "#A855F7", amountPrefix: "−",
            });
        });

        (txns || []).filter(t => t.fundId).forEach(t => {
            const fund      = (funds || []).find(f => f.id === t.fundId);
            const isDeposit = t.type === "deposit";
            items.push({
                id: `vault-${t.id}`, rawId: t.id, source: "vault", icon: "landmark",
                title:        fund ? fund.name : "Vault",
                subtitle:     isDeposit ? "Vault Deposit" : "Vault Withdrawal",
                amountCents:  t.amountCents, date: t.date, walletId: t.walletId,
                walletName:   resolve(t.walletId, t.walletNameSnapshot),
                amountColor:  isDeposit ? "#2563EB" : "#F59E0B",
                amountPrefix: isDeposit ? "→" : "←",
            });
        });

        return items.sort((a, b) =>
            b.date !== a.date ? b.date.localeCompare(a.date) : b.id.localeCompare(a.id)
        );
    }

    // ── getVaultTransactions ──────────────────────────────────────────────────
    // Filters the txns array to only vault-linked entries (those with a fundId).
    // Used by TransactionsView / vault log panel.
    //
    // @param  {Array}  txns   Raw transaction records
    // @returns {Array}        Only records with a non-null fundId
    //
    function getVaultTransactions(txns) {
        return (txns || []).filter(t => t.fundId);
    }

    // ── getArchiveChartData ───────────────────────────────────────────────────
    // Returns the last `limit` archived months in chronological order
    // (oldest → newest), ready for rendering a bar chart in HistoryView.
    //
    // @param  {Array}  archives   Raw archive records (newest-first from state)
    // @param  {number} limit      How many months to include (default 6)
    // @returns {Array}            Chronologically ordered slice
    //
    function getArchiveChartData(archives, limit = 6) {
        return [...(archives || [])].reverse().slice(-limit);
    }

    window.selectors = {
        computeTotals,
        getWalletTotal,
        getSpendPercentage,
        getDailySafeSpend,
        getUpcomingBills,
        getCategoryBudgetStatus,
        resolveWalletName,
        getRecentActivities,
        getAllTransactionItems,
        getVaultTransactions,
        getArchiveChartData,
    };

})();
