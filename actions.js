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
// Usage:
//   window.actions.addExpense({ rec, wallets, setDailyExpenses, setWallets });
//   window.actions.deleteIncome({ id, incomes, setIncomes, wallets, setWallets });

(function () {
    const fin = () => window.finance;   // lazy ref — finance.js loads before this runs

    // ── EXPENSE ACTIONS ───────────────────────────────────────────────────────

    // Append a pre-built expense record and deduct from the source wallet.
    // Caller is responsible for any balance validation before calling.
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

    // Reverse the old wallet deduction, apply the updated amount/wallet, patch record.
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

    // Restore the wallet balance and remove the expense record.
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

    // Append an income record and credit the receiving wallet.
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

    // Reverse the old wallet credit, apply updated amount/wallet, patch record.
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

    // Reverse the wallet credit and remove the income record.
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

    window.actions = { addExpense, editExpense, deleteExpense, addIncome, editIncome, deleteIncome };

})();
