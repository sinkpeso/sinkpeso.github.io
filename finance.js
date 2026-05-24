// finance.js - Financial calculation helpers for SINKPESO.
//
// Important rule:
// Wallet balances are derived from records. They are not manually pushed up and
// down as separate saved values. This keeps balances, edits, and deletes aligned.

(function () {
    function cents(value) {
        const n = Math.round(Number(value) || 0);
        return Number.isFinite(n) ? n : 0;
    }

    function validatePositiveCents(amountCents, label = "amount") {
        const n = cents(amountCents);
        if (n <= 0) {
            throw new Error(`Invalid ${label}.`);
        }
        return n;
    }

    function getWalletDelta(walletId, sources = {}) {
        if (!walletId) return 0;

        const incomes = Array.isArray(sources.incomes) ? sources.incomes : [];
        const dailyExpenses = Array.isArray(sources.dailyExpenses) ? sources.dailyExpenses : [];
        const txns = Array.isArray(sources.txns) ? sources.txns : [];

        let total = 0;

        incomes.forEach(item => {
            if (item.walletId === walletId) total += cents(item.amountCents);
        });

        dailyExpenses.forEach(item => {
            if (item.walletId === walletId) total -= cents(item.amountCents);
        });

        txns.forEach(item => {
            if (item.walletId !== walletId) return;

            if (item.type === "bill_payment") total -= cents(item.amountCents);
            if (item.type === "deposit") total -= cents(item.amountCents);
            if (item.type === "withdrawal") total += cents(item.amountCents);
        });

        return total;
    }

    function deriveWalletBalance(wallet, sources = {}) {
        if (!wallet) return 0;
        return cents(wallet.openingBalanceCents) + getWalletDelta(wallet.id, sources);
    }

    function deriveWallets(wallets, sources = {}) {
        return (Array.isArray(wallets) ? wallets : []).map(wallet => ({
            ...wallet,
            balanceCents: deriveWalletBalance(wallet, sources)
        }));
    }

    function migrateWallets(wallets, sources = {}) {
        return (Array.isArray(wallets) ? wallets : []).map(wallet => {
            if (wallet.openingBalanceCents !== undefined) return wallet;

            const savedBalance = cents(wallet.balanceCents);
            const existingRecordDelta = getWalletDelta(wallet.id, sources);

            return {
                ...wallet,
                openingBalanceCents: savedBalance - existingRecordDelta
            };
        });
    }

    function processFinancialTransaction(opts = {}) {
        try {
            const type = opts.type;

            if ([
                "income",
                "income_edit",
                "income_delete",
                "expense",
                "expense_edit",
                "expense_delete",
                "vault_withdrawal"
            ].includes(type)) {
                validatePositiveCents(
                    opts.amountCents || opts.newAmountCents || opts.oldAmountCents,
                    "transaction amount"
                );
                return { ok: true };
            }

            if (type === "vault_deposit") {
                const amt = validatePositiveCents(opts.amountCents, "vault deposit amount");
                if (!opts.walletId) return { ok: true };

                const wallet = (opts.wallets || []).find(w => w.id === opts.walletId);
                if (!wallet) return { ok: false, error: "Wallet not found." };
                if (cents(wallet.balanceCents) < amt) {
                    return { ok: false, error: "Insufficient funds for this vault deposit." };
                }

                return { ok: true };
            }

            if (type === "bill_payment") {
                const amt = validatePositiveCents(opts.amountCents, "bill amount");
                if (!opts.walletId) return { ok: false, error: "No wallet selected for bill payment." };

                const wallet = (opts.wallets || []).find(w => w.id === opts.walletId);
                if (!wallet) return { ok: false, error: "Wallet not found." };
                if (cents(wallet.balanceCents) < amt) {
                    return { ok: false, error: "Insufficient funds for this bill payment." };
                }

                return { ok: true };
            }

            return { ok: false, error: `Unknown transaction type: ${type}` };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    }

    // ── INCOME DELETE SAFETY CHECK ────────────────────────────────────────────
    // Simulates removing an income entry and reports whether any wallet
    // would go negative.
    //
    // derivedWallets: array already populated with current .balanceCents
    //                 (e.g. the displayWallets from App's useMemo)
    //
    // Returns: { safe: bool, walletName: string|null, projectedBalance: number }
    function checkIncomeDeleteSafe(walletId, amountCents, derivedWallets) {
        if (!walletId) return { safe: true, walletName: null, projectedBalance: 0 };
        const wallet = (derivedWallets || []).find(w => w.id === walletId);
        if (!wallet) return { safe: true, walletName: null, projectedBalance: 0 };
        const projected = cents(wallet.balanceCents) - cents(amountCents);
        return {
            safe: projected >= 0,
            walletName: wallet.name,
            projectedBalance: projected
        };
    }

    window.finance = {
        deriveWallets,
        deriveWalletBalance,
        getWalletDelta,
        migrateWallets,
        processFinancialTransaction,
        checkIncomeDeleteSafe
    };
})();
