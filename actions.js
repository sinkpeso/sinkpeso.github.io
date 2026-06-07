// actions.js — Centralized state mutations for SINKPESO
//
// Rules:
//   - Each action is a single named function with a flat options object.
//   - All money is integer cents.
//   - Wallet balances are derived (see deriveWallets in finance.js), not mutated directly.
//   - processFinancialTransaction validates amounts/balances only; state setters handle persistence.
//   - No React imports; state setters are passed in as options.
//
// Depends on: utils.js, finance.js
//
// @module actions
//
// Usage:
//   window.actions.addExpense({ rec, wallets, setDailyExpenses, setWallets });
//   window.actions.deleteIncome({ id, incomes, setIncomes, wallets, setWallets });

(function () {
    const fin = () => window.finance;   // lazy ref — finance.js loads before this runs

    // ── EXPENSE ACTIONS ───────────────────────────────────────────────────────

    /**
     * Append a pre-built expense record and deduct from the source wallet.
     * Caller is responsible for any balance validation before calling.
     * @param {{ rec: Object, wallets: Array, setDailyExpenses: Function, setWallets: Function }} opts
     */
    function addExpense({ rec, wallets, setDailyExpenses, setWallets }) {
        setDailyExpenses(prev => [rec, ...prev]);
        fin().processFinancialTransaction({
            type: "expense",
            walletId: rec.walletId,
            amountCents: rec.amountCents,
            wallets,
            setWallets,
        });
    }

    /**
     * Reverse the old wallet deduction, apply the updated amount/wallet, patch record.
     * @param {{ expId: string, editForm: Object, oldRecord: Object, wallets: Array, dailyExpenses: Array, setDailyExpenses: Function, setWallets: Function }} opts
     */
    function editExpense({ expId, editForm, oldRecord, wallets, dailyExpenses, setDailyExpenses, setWallets }) {
        const newAmt      = window.utils.tc(editForm.amount);
        const newWalletId = editForm.walletId || null;
        fin().processFinancialTransaction({
            type: "expense_edit",
            oldWalletId:    oldRecord?.walletId,
            oldAmountCents: oldRecord?.amountCents,
            newWalletId,
            newAmountCents: newAmt,
            wallets,
            setWallets,
        });
        setDailyExpenses(dailyExpenses.map(ex =>
            ex.id === expId
                ? { ...ex, name: editForm.name.trim(), amountCents: newAmt, category: editForm.category, walletId: newWalletId }
                : ex
        ));
    }

    /**
     * Restore the wallet balance and remove the expense record.
     * @param {{ id: string, dailyExpenses: Array, setDailyExpenses: Function, wallets: Array, setWallets: Function }} opts
     */
    function deleteExpense({ id, dailyExpenses, setDailyExpenses, wallets, setWallets }) {
        const old = dailyExpenses.find(ex => ex.id === id);
        fin().processFinancialTransaction({
            type: "expense_delete",
            walletId: old?.walletId,
            amountCents: old?.amountCents,
            wallets,
            setWallets,
        });
        setDailyExpenses(prev => prev.filter(ex => ex.id !== id));
    }

    // ── INCOME ACTIONS ────────────────────────────────────────────────────────

    /**
     * Append an income record and credit the receiving wallet.
     * @param {{ rec: Object, wallets: Array, setIncomes: Function, setWallets: Function }} opts
     */
    function addIncome({ rec, wallets, setIncomes, setWallets }) {
        setIncomes(prev => [...prev, rec]);
        fin().processFinancialTransaction({
            type: "income",
            walletId: rec.walletId,
            amountCents: rec.amountCents,
            wallets,
            setWallets,
        });
    }

    /**
     * Reverse the old wallet credit, apply updated amount/wallet, patch record.
     * @param {{ incId: string, editForm: Object, oldRecord: Object, wallets: Array, incomes: Array, setIncomes: Function, setWallets: Function }} opts
     */
    function editIncome({ incId, editForm, oldRecord, wallets, incomes, setIncomes, setWallets }) {
        const newAmt = window.utils.tc(editForm.amount);
        fin().processFinancialTransaction({
            type: "income_edit",
            oldWalletId:    oldRecord?.walletId,
            oldAmountCents: oldRecord?.amountCents,
            newWalletId:    editForm.walletId,
            newAmountCents: newAmt,
            wallets,
            setWallets,
        });
        setIncomes(incomes.map(i =>
            i.id === incId
                ? { ...i, name: editForm.name.trim(), amountCents: newAmt, walletId: editForm.walletId || null }
                : i
        ));
    }

    /**
     * Reverse the wallet credit and remove the income record.
     * @param {{ id: string, incomes: Array, setIncomes: Function, wallets: Array, setWallets: Function }} opts
     */
    function deleteIncome({ id, incomes, setIncomes, wallets, setWallets }) {
        const old = incomes.find(i => i.id === id);
        fin().processFinancialTransaction({
            type: "income_delete",
            walletId: old?.walletId,
            amountCents: old?.amountCents,
            wallets,
            setWallets,
        });
        setIncomes(prev => prev.filter(i => i.id !== id));
    }

    // ── TRANSFER ACTIONS ───────────────────────────────────────────────────

    /**
     * Create a wallet-to-wallet transfer transaction.
     * Validates source wallet balance, then appends a wallet_transfer txn record.
     * @param {{ rec: Object, wallets: Array, setTxns: Function }} opts
     * @returns {{ ok: boolean, error?: string }} Validation result
     */
    function transferBetweenWallets({ rec, wallets, setTxns }) {
        const result = fin().processFinancialTransaction({
            type: "wallet_transfer",
            fromWalletId: rec.fromWalletId,
            toWalletId: rec.toWalletId,
            amountCents: rec.amountCents,
            feeCents: rec.feeCents || 0,
            wallets,
        });
        if (!result.ok) return result;

        setTxns(prev => [rec, ...prev]);
        return { ok: true };
    }

    // ── RECURRING ACTIONS ──────────────────────────────────────────────────

    /**
     * Add a new recurring item.
     * @param {{ rec: Object, recurringItems: Array, setRecurringItems: Function }} opts
     */
    function addRecurringItem({ rec, recurringItems, setRecurringItems }) {
        setRecurringItems(prev => [rec, ...prev]);
    }

    /**
     * Edit an existing recurring item.
     * @param {{ id: string, updates: Object, recurringItems: Array, setRecurringItems: Function }} opts
     */
    function editRecurringItem({ id, updates, recurringItems, setRecurringItems }) {
        setRecurringItems(recurringItems.map(item =>
            item.id === id ? { ...item, ...updates } : item
        ));
    }

    /**
     * Delete a recurring item.
     * @param {{ id: string, recurringItems: Array, setRecurringItems: Function }} opts
     */
    function deleteRecurringItem({ id, recurringItems, setRecurringItems }) {
        setRecurringItems(prev => prev.filter(item => item.id !== id));
    }

    /**
     * Toggle a recurring item active/inactive.
     * @param {{ id: string, recurringItems: Array, setRecurringItems: Function }} opts
     */
    function toggleRecurringItem({ id, recurringItems, setRecurringItems }) {
        setRecurringItems(recurringItems.map(item =>
            item.id === id ? { ...item, isActive: !item.isActive } : item
        ));
    }

    /**
     * Auto-process all due recurring items.
     * Creates expense/income records and advances next due dates.
     * @param {{ recurringItems: Array, setRecurringItems: Function, setDailyExpenses: Function, setIncomes: Function, wallets: Array, setWallets: Function, showToast: Function }} opts
     */
    function processDueRecurringItems({ recurringItems, setRecurringItems, setDailyExpenses, setIncomes, wallets, setWallets, showToast }) {
        var today = window.utils.todayStr();
        var dueItems = fin().getDueRecurringItems(recurringItems, today);
        if (dueItems.length === 0) return;

        var updatedItems = [];
        var newExpenses = [];
        var newIncomes = [];
        var count = 0;

        dueItems.forEach(function (item) {
            var result = fin().processRecurringItem(item, today);
            updatedItems.push(result.updatedItem);

            if (item.type === 'income') {
                newIncomes.push(result.record);
                fin().processFinancialTransaction({
                    type: "income",
                    walletId: item.walletId,
                    amountCents: item.amountCents,
                    wallets,
                    setWallets,
                });
            } else {
                newExpenses.push(result.record);
                fin().processFinancialTransaction({
                    type: "expense",
                    walletId: item.walletId,
                    amountCents: item.amountCents,
                    wallets,
                    setWallets,
                });
            }
            count++;
        });

        // Update recurring items with new next due dates
        setRecurringItems(function (prev) {
            return prev.map(function (item) {
                var updated = updatedItems.find(function (u) { return u.id === item.id; });
                return updated || item;
            });
        });

        // Append new records
        if (newExpenses.length > 0) {
            setDailyExpenses(prev => [...newExpenses, ...prev]);
        }
        if (newIncomes.length > 0) {
            setIncomes(prev => [...newIncomes, ...prev]);
        }

        if (showToast && count > 0) {
            showToast("Auto-logged " + count + " recurring transaction" + (count > 1 ? "s" : "") + "!");
        }
    }

    window.actions = {
        addExpense, editExpense, deleteExpense,
        addIncome, editIncome, deleteIncome,
        transferBetweenWallets,
        addRecurringItem, editRecurringItem, deleteRecurringItem,
        toggleRecurringItem, processDueRecurringItems
    };

})();
