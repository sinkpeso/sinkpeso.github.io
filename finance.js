// finance.js - Financial calculation helpers for SINKPESO.
//
// Important rule:
// Wallet balances are derived from records. They are not manually pushed up and
// down as separate saved values. This keeps balances, edits, and deletes aligned.
//
// @module finance

(function () {
    /**
     * Safely convert a value to integer cents. Returns 0 for NaN/Infinity/null/undefined.
     * @param {number|string|null|undefined} value - Raw monetary value
     * @returns {number} Integer cents (e.g., 1250 for $12.50)
     */
    function ensureIntCents(value) {
        const n = Math.round(Number(value) || 0);
        return Number.isFinite(n) ? n : 0;
    }

    /**
     * Validate that amountCents is a positive integer. Throws on failure.
     * @param {number} amountCents - Amount in cents
     * @param {string} [label="amount"] - Label for error message
     * @returns {number} Validated integer cents
     * @throws {Error} If amount is not positive
     */
    function validatePositiveCents(amountCents, label = "amount") {
        const n = ensureIntCents(amountCents);
        if (n <= 0) {
            throw new Error(`Invalid ${label}.`);
        }
        return n;
    }

    /**
     * Calculate net financial delta for a single wallet from all record sources.
     * Sums: incomes (+), expenses (-), bill payments (-), vault deposits (-), vault withdrawals (+).
     * @param {string} walletId - Target wallet ID
     * @param {{ incomes?: Object[], dailyExpenses?: Object[], txns?: Object[] }} sources
     * @returns {number} Net delta in cents
     */
    function getWalletDelta(walletId, sources = {}) {
        if (!walletId) return 0;

        const incomes = Array.isArray(sources.incomes) ? sources.incomes : [];
        const dailyExpenses = Array.isArray(sources.dailyExpenses) ? sources.dailyExpenses : [];
        const txns = Array.isArray(sources.txns) ? sources.txns : [];

        let total = 0;

        incomes.forEach(item => {
            if (item.walletId === walletId) total += ensureIntCents(item.amountCents);
        });

        dailyExpenses.forEach(item => {
            if (item.walletId === walletId) total -= ensureIntCents(item.amountCents);
        });

        txns.forEach(item => {
            // wallet_transfer uses fromWalletId/toWalletId instead of walletId
            if (item.type === "wallet_transfer") {
                if (item.fromWalletId === walletId) total -= (ensureIntCents(item.amountCents) + ensureIntCents(item.feeCents));
                if (item.toWalletId === walletId) total += ensureIntCents(item.amountCents);
                return;
            }

            if (item.walletId !== walletId) return;

            if (item.type === "bill_payment") total -= ensureIntCents(item.amountCents);
            if (item.type === "deposit") total -= ensureIntCents(item.amountCents);
            if (item.type === "withdrawal") total += ensureIntCents(item.amountCents);
        });

        return total;
    }

    /**
     * Derive current balance for a wallet: openingBalanceCents + getWalletDelta.
     * @param {{ id: string, openingBalanceCents: number }} wallet
     * @param {{ incomes?: Object[], dailyExpenses?: Object[], txns?: Object[] }} sources
     * @returns {number} Current balance in cents
     */
    function deriveWalletBalance(wallet, sources = {}) {
        if (!wallet) return 0;
        return ensureIntCents(wallet.openingBalanceCents) + getWalletDelta(wallet.id, sources);
    }

    /**
     * Derive balances for all wallets. Each wallet gets a computed `balanceCents` field.
     * @param {Array<{ id: string, openingBalanceCents: number }>} wallets
     * @param {{ incomes?: Object[], dailyExpenses?: Object[], txns?: Object[], bills?: Object[] }} sources
     * @returns {Array<Object>} Wallets with added `balanceCents` field
     */
    function deriveWallets(wallets, sources = {}) {
        return (Array.isArray(wallets) ? wallets : []).map(wallet => ({
            ...wallet,
            balanceCents: deriveWalletBalance(wallet, sources)
        }));
    }

    /**
     * Check if a wallet has sufficient balance for an expense.
     * @param {Array<{ id: string, balanceCents: number }>} wallets
     * @param {string} walletId
     * @param {number} amountCents
     * @returns {{ ok: boolean, error?: string }}
     */
    function validateExpenseWalletBalance(wallets, walletId, amountCents) {
        const amt = validatePositiveCents(amountCents, "expense amount");
        if (!walletId) return { ok: true };

        const wallet = (wallets || []).find(w => w.id === walletId);
        if (!wallet) return { ok: false, error: "Wallet not found." };
        if (ensureIntCents(wallet.balanceCents) < amt) {
            return { ok: false, error: "Wallet is empty — add income or fund first" };
        }

        return { ok: true };
    }

    /**
     * Migrate legacy wallets (without openingBalanceCents) by computing it from saved balance minus record delta.
     * @param {Array<Object>} wallets
     * @param {{ incomes?: Object[], dailyExpenses?: Object[], txns?: Object[], bills?: Object[] }} sources
     * @returns {Array<Object>} Wallets with `openingBalanceCents` field added
     */
    function migrateWallets(wallets, sources = {}) {
        return (Array.isArray(wallets) ? wallets : []).map(wallet => {
            if (wallet.openingBalanceCents !== undefined) return wallet;

            const savedBalance = ensureIntCents(wallet.balanceCents);
            const existingRecordDelta = getWalletDelta(wallet.id, sources);

            return {
                ...wallet,
                openingBalanceCents: savedBalance - existingRecordDelta
            };
        });
    }

    /**
     * Validate a financial transaction. Does NOT mutate state.
     * @param {{ type: string, amountCents?: number, newAmountCents?: number, oldAmountCents?: number, walletId?: string, wallets?: Array }} opts
     * @returns {{ ok: boolean, error?: string }}
     */
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
                if (ensureIntCents(wallet.balanceCents) < amt) {
                    return { ok: false, error: "Insufficient funds for this vault deposit." };
                }

                return { ok: true };
            }

            if (type === "bill_payment") {
                const amt = validatePositiveCents(opts.amountCents, "bill amount");
                if (!opts.walletId) return { ok: false, error: "No wallet selected for bill payment." };

                const wallet = (opts.wallets || []).find(w => w.id === opts.walletId);
                if (!wallet) return { ok: false, error: "Wallet not found." };
                if (ensureIntCents(wallet.balanceCents) < amt) {
                    return { ok: false, error: "Insufficient funds for this bill payment." };
                }

                return { ok: true };
            }

            if (type === "wallet_transfer") {
                const amt = validatePositiveCents(opts.amountCents, "transfer amount");
                const fee = ensureIntCents(opts.feeCents);

                if (!opts.fromWalletId || !opts.toWalletId) {
                    return { ok: false, error: "Both source and destination wallets are required." };
                }
                if (opts.fromWalletId === opts.toWalletId) {
                    return { ok: false, error: "Source and destination wallets must be different." };
                }

                const fromWallet = (opts.wallets || []).find(w => w.id === opts.fromWalletId);
                if (!fromWallet) return { ok: false, error: "Source wallet not found." };

                const toWallet = (opts.wallets || []).find(w => w.id === opts.toWalletId);
                if (!toWallet) return { ok: false, error: "Destination wallet not found." };

                if (ensureIntCents(fromWallet.balanceCents) < amt + fee) {
                    return { ok: false, error: "Insufficient funds in source wallet for this transfer." };
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
    /**
     * Check if deleting an income entry would cause any wallet balance to go negative.
     * @param {string} walletId
     * @param {number} amountCents
     * @param {Array<{ id: string, name: string, balanceCents: number }>} derivedWallets
     * @returns {{ safe: boolean, walletName: string|null, projectedBalance: number }}
     */
    function checkIncomeDeleteSafe(walletId, amountCents, derivedWallets) {
        if (!walletId) return { safe: true, walletName: null, projectedBalance: 0 };
        const wallet = (derivedWallets || []).find(w => w.id === walletId);
        if (!wallet) return { safe: true, walletName: null, projectedBalance: 0 };
        const projected = ensureIntCents(wallet.balanceCents) - ensureIntCents(amountCents);
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
        validateExpenseWalletBalance,
        processFinancialTransaction,
        checkIncomeDeleteSafe
    };
})();