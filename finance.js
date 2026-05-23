// finance.js — Centralized financial transaction engine for SINKPESO
//
// ─────────────────────────────────────────────────────────────────────────────
// PURPOSE
//   Every place in the app that changes a wallet balance MUST go through this
//   file. No component should call applyWalletDelta() directly.
//
// WHY THIS EXISTS
//   Without a central gatekeeper, each screen (Bills, Expenses, Vaults, Quick
//   Add) invents its own balance logic. That leads to:
//     • duplicate code that drifts apart over time
//     • missing validation in some paths (e.g. no NaN guard)
//     • impossible to add a new rule (e.g. "never go negative") consistently
//   This file fixes that by owning 100% of wallet balance mutations.
//
// WHAT THIS DOES NOT DO
//   • Does NOT store any data itself — it calls the React setState functions
//     you pass in, just like before.
//   • Does NOT change the localStorage schema — data is identical.
//   • Does NOT change any UI or component props.
//   • Does NOT need React imported — it's plain JS.
//
// HOW TO USE
//   Load this file AFTER utils.js and BEFORE the main <script> in index.html:
//     <script src="finance.js"></script>
//
//   Then call window.finance.processFinancialTransaction({ ... }) wherever you
//   previously called applyWalletDelta() directly.
//
// ─────────────────────────────────────────────────────────────────────────────

(function () {

    // ── INTERNAL HELPERS ──────────────────────────────────────────────────────

    /**
     * The ONE function allowed to mutate wallet balances.
     * All public API functions in this file call this internally.
     *
     * @param {Array}    wallets     - current wallets array (from React state)
     * @param {Function} setWallets  - React setState setter for wallets
     * @param {string}   walletId    - ID of the wallet to update
     * @param {number}   deltaCents  - positive = add money, negative = remove money
     * @returns {boolean}            - true if applied, false if skipped (invalid input)
     */
    function _applyDelta(wallets, setWallets, walletId, deltaCents) {
        if (!walletId || !deltaCents || !Number.isFinite(deltaCents)) return false;
        if (!Array.isArray(wallets)) return false;

        const target = wallets.find(w => w.id === walletId);
        if (!target) {
            console.warn(`[SINKPESO finance] Wallet not found: ${walletId}`);
            return false;
        }

        setWallets(prev => prev.map(w =>
            w.id === walletId
                ? { ...w, balanceCents: Math.round((w.balanceCents || 0) + deltaCents) }
                : w
        ));
        return true;
    }

    /**
     * Validate that an amount in cents is a usable positive number.
     * Returns the rounded integer or throws a descriptive error.
     */
    function _validateCents(amountCents, label = "amount") {
        const n = Math.round(Number(amountCents));
        if (!Number.isFinite(n) || n <= 0) {
            throw new Error(`[SINKPESO finance] Invalid ${label}: ${amountCents}`);
        }
        return n;
    }

    // ── PUBLIC API ────────────────────────────────────────────────────────────

    /**
     * processFinancialTransaction({ type, ... })
     *
     * The single entry point for ALL money movements.
     * Returns { ok: true } on success, { ok: false, error: string } on failure.
     *
     * Supported transaction types and their required fields:
     *
     *   "income"
     *     Credit a wallet when income is recorded.
     *     Fields: walletId, amountCents, wallets, setWallets
     *
     *   "income_edit"
     *     Reverse the old income credit, apply the new one.
     *     Fields: oldWalletId, oldAmountCents, newWalletId, newAmountCents,
     *             wallets, setWallets
     *
     *   "income_delete"
     *     Reverse the credit when income is deleted.
     *     Fields: walletId, amountCents, wallets, setWallets
     *
     *   "expense"
     *     Deduct from a wallet when an expense is logged.
     *     Fields: walletId, amountCents, wallets, setWallets
     *
     *   "expense_edit"
     *     Reverse the old expense deduction, apply the new one.
     *     Fields: oldWalletId, oldAmountCents, newWalletId, newAmountCents,
     *             wallets, setWallets
     *
     *   "expense_delete"
     *     Restore the wallet when an expense is deleted.
     *     Fields: walletId, amountCents, wallets, setWallets
     *
     *   "bill_payment"
     *     Deduct from a wallet when a bill is paid.
     *     Blocks payment if the wallet has insufficient funds.
     *     Fields: walletId, amountCents, wallets, setWallets
     *
     *   "vault_deposit"
     *     Move money FROM a wallet INTO a savings vault (wallet decreases).
     *     Fields: walletId, amountCents, wallets, setWallets
     *
     *   "vault_withdrawal"
     *     Move money FROM a savings vault back TO a wallet (wallet increases).
     *     Fields: walletId, amountCents, wallets, setWallets
     */
    function processFinancialTransaction(opts) {
        const { type, wallets, setWallets } = opts;

        try {
            switch (type) {

                // ── INCOME ───────────────────────────────────────────────────
                case "income": {
                    const amt = _validateCents(opts.amountCents, "income amount");
                    if (!opts.walletId) return { ok: true }; // no wallet linked — still valid
                    _applyDelta(wallets, setWallets, opts.walletId, +amt);
                    return { ok: true };
                }

                case "income_edit": {
                    // Step 1: undo the old credit
                    if (opts.oldWalletId && opts.oldAmountCents) {
                        const oldAmt = _validateCents(opts.oldAmountCents, "old income amount");
                        _applyDelta(wallets, setWallets, opts.oldWalletId, -oldAmt);
                    }
                    // Step 2: apply the new credit
                    if (opts.newWalletId && opts.newAmountCents) {
                        const newAmt = _validateCents(opts.newAmountCents, "new income amount");
                        _applyDelta(wallets, setWallets, opts.newWalletId, +newAmt);
                    }
                    return { ok: true };
                }

                case "income_delete": {
                    if (!opts.walletId) return { ok: true };
                    const amt = _validateCents(opts.amountCents, "income amount");
                    _applyDelta(wallets, setWallets, opts.walletId, -amt);
                    return { ok: true };
                }

                // ── EXPENSES ─────────────────────────────────────────────────
                case "expense": {
                    const amt = _validateCents(opts.amountCents, "expense amount");
                    if (!opts.walletId) return { ok: true };
                    _applyDelta(wallets, setWallets, opts.walletId, -amt);
                    return { ok: true };
                }

                case "expense_edit": {
                    // Reverse old deduction
                    if (opts.oldWalletId && opts.oldAmountCents) {
                        const oldAmt = _validateCents(opts.oldAmountCents, "old expense amount");
                        _applyDelta(wallets, setWallets, opts.oldWalletId, +oldAmt);
                    }
                    // Apply new deduction
                    if (opts.newWalletId && opts.newAmountCents) {
                        const newAmt = _validateCents(opts.newAmountCents, "new expense amount");
                        _applyDelta(wallets, setWallets, opts.newWalletId, -newAmt);
                    }
                    return { ok: true };
                }

                case "expense_delete": {
                    if (!opts.walletId) return { ok: true };
                    const amt = _validateCents(opts.amountCents, "expense amount");
                    _applyDelta(wallets, setWallets, opts.walletId, +amt); // restore
                    return { ok: true };
                }

                // ── BILL PAYMENT ─────────────────────────────────────────────
                case "bill_payment": {
                    const amt = _validateCents(opts.amountCents, "bill amount");
                    if (!opts.walletId) return { ok: false, error: "No wallet selected for bill payment." };

                    // Insufficient funds check
                    const wallet = wallets.find(w => w.id === opts.walletId);
                    if (!wallet) return { ok: false, error: "Wallet not found." };
                    if ((wallet.balanceCents || 0) < amt) {
                        return {
                            ok: false,
                            error: `Insufficient funds. Available: ${wallet.balanceCents || 0} cents.`
                        };
                    }

                    _applyDelta(wallets, setWallets, opts.walletId, -amt);
                    return { ok: true };
                }

                // ── VAULT DEPOSIT (wallet → vault) ───────────────────────────
                case "vault_deposit": {
                    const amt = _validateCents(opts.amountCents, "vault deposit amount");
                    if (!opts.walletId) return { ok: true }; // no wallet linked
                    _applyDelta(wallets, setWallets, opts.walletId, -amt);
                    return { ok: true };
                }

                // ── VAULT WITHDRAWAL (vault → wallet) ────────────────────────
                case "vault_withdrawal": {
                    const amt = _validateCents(opts.amountCents, "vault withdrawal amount");
                    if (!opts.walletId) return { ok: true };
                    _applyDelta(wallets, setWallets, opts.walletId, +amt);
                    return { ok: true };
                }

                default:
                    console.warn(`[SINKPESO finance] Unknown transaction type: "${type}"`);
                    return { ok: false, error: `Unknown transaction type: ${type}` };
            }

        } catch (err) {
            console.error("[SINKPESO finance] Transaction error:", err.message);
            return { ok: false, error: err.message };
        }
    }

    // ── EXPOSE TO WINDOW ──────────────────────────────────────────────────────
    window.finance = {
        processFinancialTransaction,
    };

})();
