// DailyExpensesView.js — Daily expense tracking for SINKPESO
//
// Dependencies: React (global), Icon (global), utils.js, actions.js, finance.js,
//   window.components.{Field, Inp, Sel, Btn, SLabel, PageTitle},
//   DotMenu, WalletPicker, InsufficientBalanceModal,
//   CASH_WALLET_ID, CATEGORIES, S (globals from index.html)

(function () {
    "use strict";
    const e = React.createElement;
    const { tc, uid, todayStr } = window.utils;
    const { Field, Inp, Sel, Btn, SLabel, PageTitle } = window.components;

    function InsufficientBalanceModal({ wallet, expenseAmount, fc, onCancel, onForce }) {
        return e('div', { className: "modal-overlay", onClick: onCancel, style: { zIndex: 1100 } },
            e('div', { className: "modal-container", style: { maxWidth: 360 }, onClick: ev => ev.stopPropagation() },
                e('div', { style: { ...S.modalHeader, marginBottom: 16 } },
                    e('div', { style: { fontSize: 17, fontWeight: 800, color: "#EF4444" } }, "Insufficient Balance"),
                    e('button', { onClick: onCancel, style: S.closeBtn }, e(Icon, { name: "x", size: 16 }))
                ),
                e('div', { style: { background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "16px", marginBottom: 20 } },
                    e('div', { style: { display: "flex", justifyContent: "space-between", marginBottom: 10 } },
                        e('span', { style: { fontSize: 13, color: "var(--text-muted)" } }, "Wallet"),
                        e('span', { style: { fontSize: 13, fontWeight: 700, color: "var(--text-main)" } }, wallet.name)
                    ),
                    e('div', { style: { display: "flex", justifyContent: "space-between", marginBottom: 10 } },
                        e('span', { style: { fontSize: 13, color: "var(--text-muted)" } }, "Available"),
                        e('span', { style: { fontSize: 13, fontWeight: 700, color: "#00E676" } }, fc(wallet.balanceCents || 0))
                    ),
                    e('div', { style: { display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid rgba(239,68,68,0.2)" } },
                        e('span', { style: { fontSize: 13, color: "var(--text-muted)" } }, "Expense"),
                        e('span', { style: { fontSize: 13, fontWeight: 700, color: "#EF4444" } }, fc(expenseAmount))
                    )
                ),
                e('div', { style: { fontSize: 12, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 } },
                    "Force Spend will allow this expense and push your wallet into deficit."
                ),
                e('div', { style: { display: "flex", gap: 10 } },
                    e(Btn, { v: "ghost", style: { flex: 1 }, onClick: onCancel }, "Cancel"),
                    e(Btn, { v: "danger", style: { flex: 1 }, onClick: onForce }, "Force Spend")
                )
            )
        );
    }

    function DailyExpensesView({ dailyExpenses, setDailyExpenses, photoDiary, setPhotoDiary, wallets, setWallets, fc, requestConfirm, showToast, templates }) {
        const [name, setName] = React.useState(""); const [amount, setAmount] = React.useState(""); const [category, setCategory] = React.useState("Food");
        const [recurring, setRecurring] = React.useState("none");
        const [walletId, setWalletId] = React.useState(wallets.length > 0 ? (wallets.find(w => w.id === CASH_WALLET_ID) ? CASH_WALLET_ID : wallets[0].id) : "");
        const [openMenu, setOpenMenu] = React.useState(null); const [editExp, setEditExp] = React.useState(null); const [editForm, setEditForm] = React.useState({ name: "", amount: "", category: "Food", walletId: "" });
        const [pendingExpense, setPendingExpense] = React.useState(null);
        const [pendingEditData, setPendingEditData] = React.useState(null);

        const selectedWallet = wallets.find(w => w.id === walletId);
        const isWalletEmpty = selectedWallet && (selectedWallet.balanceCents || 0) === 0;

        const commitAddExpense = (rec) => {
            window.actions.addExpense({ rec, wallets, setDailyExpenses, setWallets });
            setName(""); setAmount(""); setWalletId(""); setPendingExpense(null);
        };

        const openEditExp = (exp) => { setEditExp(exp); setEditForm({ name: exp.name, amount: String((exp.amountCents / 100).toFixed(2)), category: exp.category, walletId: exp.walletId || "" }); };
        const saveEditExp = (force = false) => {
            if (!editForm.name || !editForm.amount) return;
            const isForced = force === true;
            const old = dailyExpenses.find(ex => ex.id === editExp.id);
            const newAmt = tc(editForm.amount);
            const newWalletId = editForm.walletId || null;
            const targetWallet = wallets.find(w => w.id === newWalletId);
            const isSameWallet = old?.walletId === newWalletId;
            const restoredBalance = targetWallet ? (targetWallet.balanceCents || 0) + (isSameWallet ? (old?.amountCents || 0) : 0) : 0;

            if (!isForced && targetWallet && restoredBalance < newAmt) {
                setPendingEditData({ old, newAmt, newWalletId, editId: editExp.id });
                setPendingExpense({ selWallet: { ...targetWallet, balanceCents: restoredBalance }, amtCents: newAmt, type: "edit" });
                return;
            }
            window.finance.processFinancialTransaction({ type: "expense_edit", oldWalletId: old?.walletId, oldAmountCents: old?.amountCents, newWalletId, newAmountCents: newAmt, wallets, setWallets });
            const newWalletName = (wallets || []).find(w => w.id === newWalletId)?.name || null;
            setDailyExpenses(dailyExpenses.map(ex => ex.id === editExp.id
                ? { ...ex, name: editForm.name.trim(), amountCents: newAmt, category: editForm.category, walletId: newWalletId, walletNameSnapshot: newWalletName }
                : ex
            ));
            setEditExp(null); setPendingExpense(null); setPendingEditData(null);
            showToast(" Expense updated!");
        };
        const commitForceEdit = () => {
            const { old, newAmt, newWalletId, editId } = pendingEditData;
            window.actions.editExpense({ expId: editId, editForm: { ...editForm, amount: String(newAmt / 100), walletId: newWalletId }, oldRecord: old, wallets, dailyExpenses, setDailyExpenses, setWallets });
            setEditExp(null); setPendingExpense(null); setPendingEditData(null);
        };

        const deleteExp = (id) => {
            const exp = dailyExpenses.find(x => x.id === id);
            if (!exp) return;
            // Delete immediately — uses functional update to avoid stale closure
            window.actions.deleteExpense({ id, dailyExpenses, setDailyExpenses, wallets, setWallets });
            setPhotoDiary(prev => prev.filter(x => x.expenseId !== id));
            // FIX #5: undo uses functional updates + no-op processFinancialTransaction removed
            showToast("Expense deleted", () => {
                setDailyExpenses(prev => [exp, ...prev]);
            }, 5000);
        };

        const [templateBusy, setTemplateBusy] = React.useState(null);

        const handleTemplateTap = (tpl) => {
            if (templateBusy) return;
            const amtCents = tpl.amountCents;
            if (amtCents <= 0) return;
            const targetWalletId = walletId || (wallets.length > 0 ? wallets[0].id : null);
            const selW = wallets.find(w => w.id === targetWalletId);
            const rec = {
                id: uid(),
                name: tpl.label,
                amountCents: amtCents,
                category: (CATEGORIES || []).includes(tpl.category) ? tpl.category : "Personal",
                date: todayStr(),
                walletId: targetWalletId || null,
                walletNameSnapshot: selW ? selW.name : null,
                recurring: "none",
            };
            if (selW && (selW.balanceCents || 0) < amtCents) {
                setPendingExpense({ selWallet: selW, amtCents, type: "add", rec });
                return;
            }
            setTemplateBusy(tpl.id);
            commitAddExpense(rec);
            showToast(`${tpl.label} logged!`);
            setTimeout(() => setTemplateBusy(null), 300);
        };

        const handleLogItem = () => {
            if (!name || !amount) return;
            const amtCents = tc(amount);
            if (amtCents <= 0) { showToast("Amount must be greater than zero."); return; }
            const selW = wallets.find(w => w.id === walletId);
            const rec = { id: uid(), name: name.trim(), amountCents: amtCents, category, date: todayStr(), walletId: walletId || null, walletNameSnapshot: selW ? selW.name : null, recurring: recurring };
            if (selW && (selW.balanceCents || 0) < amtCents) {
                setPendingExpense({ selWallet: selW, amtCents, type: "add", rec });
                return;
            }
            commitAddExpense(rec);
            setName(""); setAmount(""); setRecurring("none");
            showToast(" Expense logged!");
        };

        // FIX #9: Extracted render function — used by both VirtualList and .map() branches
        const renderExpenseRow = (exp, key) => {
            const liveWallet = (wallets || []).find(w => w.id === exp.walletId);
            const expWallet = liveWallet ? liveWallet.name : (exp.walletNameSnapshot || null);
            return e('div', { key: key || exp.id, className: "stream-row" },
                e('div', null,
                    e('div', { style: { display: "flex", alignItems: "center", gap: 8 } },
                        e('span', { style: { fontWeight: 600, color: "var(--text-main)" } }, exp.name),
                        exp.recurring && exp.recurring !== "none" && e('span', { style: { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "rgba(99,102,241,0.15)", color: "#818CF8" } }, exp.recurring === "weekly" ? "Weekly" : "Monthly")
                    ),
                    e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 } }, `${exp.date} • ${exp.category}`),
                    // FIX #8: Always render wallet tag div for consistent row height
                    e('div', { style: { fontSize: 11, color: "var(--text-light)", marginTop: 3, display: "flex", alignItems: "center", gap: 4, minHeight: 16 } },
                        expWallet ? e('span', null, e('span', { style: { color: "var(--text-muted)", fontWeight: 500 } }, "Wallet: "), e('span', { style: { fontWeight: 700 } }, expWallet)) : null
                    )
                ),
                e('div', { style: S.row10 },
                    e('div', { style: { fontWeight: 700, color: "#EF4444" } }, `-${fc(exp.amountCents)}`),
                    e(DotMenu, { itemId: exp.id, openMenu, setOpenMenu, onEdit: () => openEditExp(exp), onDelete: () => deleteExp(exp.id) })
                )
            );
        };

        return e('div', null,
            e(PageTitle, null, 'Daily Outflow Tracking'),
            pendingExpense && e(InsufficientBalanceModal, {
                wallet: pendingExpense.selWallet, expenseAmount: pendingExpense.amtCents, fc,
                onCancel: () => { setPendingExpense(null); setPendingEditData(null); },
                onForce: () => pendingExpense.type === "edit" ? commitForceEdit() : commitAddExpense(pendingExpense.rec)
            }),
            templates && templates.length > 0 && e('div', { style: { marginBottom: 20 } },
                e(SLabel, { style: { marginBottom: 10 } }, "Quick Add"),
                e('div', {
                    style: {
                        display: "flex", gap: 8, overflowX: "auto",
                        paddingBottom: 4, WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "none", msOverflowStyle: "none",
                    }
                },
                    templates.map(tpl =>
                        e('button', {
                            key: tpl.id,
                            onClick: () => handleTemplateTap(tpl),
                            disabled: templateBusy === tpl.id,
                            style: {
                                display: "inline-flex", alignItems: "center", gap: 7,
                                padding: "8px 14px", borderRadius: 10,
                                background: templateBusy === tpl.id ? "rgba(0,230,118,0.15)" : "var(--hover-bg)",
                                border: "1px solid " + (templateBusy === tpl.id ? "rgba(0,230,118,0.3)" : "var(--border)"),
                                color: "var(--text-main)", fontSize: 13, fontWeight: 600,
                                cursor: templateBusy ? "wait" : "pointer",
                                whiteSpace: "nowrap", flexShrink: 0,
                                transition: "all 0.15s",
                                fontFamily: "inherit",
                            }
                        },
                            e(Icon, { name: tpl.icon || "wallet", size: 14, color: "var(--text-muted)" }),
                            e('span', null, tpl.label),
                            e('span', { style: { color: "#EF4444", fontSize: 12, fontWeight: 700 } }, "-" + fc(tpl.amountCents))
                        )
                    )
                )
            ),
            e('div', { className: "premium-panel", style: { marginBottom: 24 } },
                e(SLabel, { style: { marginBottom: 16 } }, "Log New Daily Spend Item"),
                e('div', { className: "tf" },
                    e('div', { style: { flex: 2 } }, e(Inp, { value: name, placeholder: "What did you pay for?", onChange: ev => setName(ev.target.value) })),
                    e('div', { style: { flex: 1 } }, e(Inp, { type: "number", value: amount, placeholder: "Amount", onChange: ev => setAmount(ev.target.value) })),
                    e('div', { style: { width: 130 } }, e(Sel, { value: category, onChange: ev => setCategory(ev.target.value) }, CATEGORIES.map(c => e('option', { key: c, value: c }, c)))),
                    e('div', { style: { width: 120 } }, e(Sel, { value: recurring, onChange: ev => {
                        if (ev.target.value !== "none" && !window.license.canUseFeature("recurring")) { showToast("Recurring expenses require Premium."); return; }
                        setRecurring(ev.target.value);
                    } }, e('option', { value: "none" }, "One-Time"), e('option', { value: "monthly" }, "Monthly"), e('option', { value: "weekly" }, "Weekly"))),
                    wallets && wallets.length > 0 && e('div', { style: { flex: "1.2 1 360px", minWidth: 280 } },
                        e(WalletPicker, { wallets, value: walletId, onChange: setWalletId }),
                        isWalletEmpty && e('div', { style: { fontSize: 11, color: "#F59E0B", marginTop: 6, display: "flex", alignItems: "center", gap: 4 } },
                            e(Icon, { name: "arrowupdown", size: 11, color: "#F59E0B" }), "Wallet is empty — add income or fund first."
                        )
                    ),
                    e(Btn, { v: "accent", onClick: handleLogItem }, "Log Item")
                )
            ),
            e('div', { className: "bento-txn-list" },
                e(SLabel, { style: { marginBottom: 12, padding: "16px 16px 0" } }, "Spending Log Timeline"),
                dailyExpenses.length === 0 ? e('div', { style: { color: "var(--text-muted)", fontSize: 13, padding: "14px 0" } }, e("div", { className: "empty-state" }, e("div", { className: "empty-state-icon" }, e(Icon, { name: "wallet", size: 28, color: "var(--text-muted)" })), e("div", { className: "empty-state-title" }, "No expenses yet"), e("div", { className: "empty-state-sub" }, "Tap + to log your first expense."))) :
                dailyExpenses.length > 100 && window.VirtualList
                    ? e('div', { className: "virt-list-container" },
                        e(SLabel, { style: { padding: "16px 16px 0", marginBottom: 8 } }, `Showing ${dailyExpenses.length} expenses`),
                        e(window.VirtualList, {
                            items: dailyExpenses,
                            itemHeight: 72,
                            overscan: 5,
                            renderItem: renderExpenseRow
                        })
                    )
                    : dailyExpenses.map(exp => renderExpenseRow(exp, exp.id))
            ),
            editExp && e('div', { className: "modal-overlay" }, e('div', { className: "modal-container" }, e('h3', { style: { marginBottom: 20 } }, "Edit Expense"), e(Field, { label: "Description" }, e(Inp, { value: editForm.name, onChange: ev => setEditForm({ ...editForm, name: ev.target.value }) })), e(Field, { label: "Amount" }, e(Inp, { type: "number", value: editForm.amount, onChange: ev => setEditForm({ ...editForm, amount: ev.target.value }) })), e(Field, { label: "Category" }, e(Sel, { value: editForm.category, onChange: ev => setEditForm({ ...editForm, category: ev.target.value }) }, CATEGORIES.map(c => e('option', { key: c, value: c }, c)))), wallets && wallets.length > 0 && e(Field, { label: "Wallet" }, e(WalletPicker, { wallets, value: editForm.walletId, onChange: v => setEditForm({ ...editForm, walletId: v }) })), e('div', { style: S.formFooter }, e(Btn, { v: "ghost", style: { flex: 1 }, onClick: () => setEditExp(null) }, "Cancel"), e(Btn, { v: "accent", style: { flex: 1 }, onClick: () => saveEditExp(false) }, "Save"))))
        );
    }

    window.DailyExpensesView = React.memo(DailyExpensesView);
    window.InsufficientBalanceModal = InsufficientBalanceModal;
})();