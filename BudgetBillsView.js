// BudgetBillsView.js — Bills & Income management for SINKPESO
//
// Dependencies: React (global), Icon (global), utils.js, actions.js, finance.js,
//   window.components.{Field, Inp, Sel, Btn, SLabel, PageTitle},
//   DotMenu, WalletPicker, IncomeSourcePicker, PayBillModal,
//   CASH_WALLET_ID, CATEGORIES, S, Z (globals from index.html)

(function () {
    "use strict";
    const e = React.createElement;
    const { tc, uid, todayStr, getDaysRemaining } = window.utils;
    const { Field, Inp, Sel, Btn, SLabel, PageTitle } = window.components;

    function PayBillModal({ bill, wallets, onConfirm, onCancel, fc }) {
        const [selectedWalletId, setSelectedWalletId] = React.useState(wallets.length > 0 ? wallets[0].id : "");
        const selectedWallet = wallets.find(w => w.id === selectedWalletId);
        const hasInsufficientBalance = selectedWallet && (selectedWallet.balanceCents || 0) < bill.amountCents;

        return e('div', { className: "modal-overlay", onClick: onCancel },
            e('div', { className: "modal-container", style: { maxWidth: 400 }, onClick: ev => ev.stopPropagation() },
                e('div', { style: S.modalHeader },
                    e('div', { style: S.modalTitle }, `Pay ${bill.name}`),
                    e('button', { onClick: onCancel, style: S.closeBtn }, e(Icon, { name: "x", size: 16 }))
                ),
                e('div', { style: { marginBottom: 20 } },
                    e('div', { style: { fontSize: 14, fontWeight: 600, color: "var(--text-light)", marginBottom: 8 } }, "Amount Due"),
                    e('div', { style: { fontSize: 28, fontWeight: 800, color: "#00E676", letterSpacing: "-0.02em" } }, fc(bill.amountCents))
                ),
                e(Field, { label: "Pay From" },
                    wallets.length === 0
                        ? e('div', { style: { color: "#EF4444", fontSize: 13, padding: "12px", background: "rgba(239,68,68,0.09)", borderRadius: 8 } }, "No wallets available. Create a wallet first.")
                        : e('div', { style: { display: "flex", flexDirection: "column", gap: 8 } },
                            wallets.map(w => e('button', {
                                key: w.id, onClick: () => setSelectedWalletId(w.id),
                                style: {
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "10px 14px", borderRadius: 10,
                                    background: selectedWalletId === w.id ? "rgba(0,230,118,0.12)" : "var(--bg-input)",
                                    border: `1px solid ${selectedWalletId === w.id ? "#00E676" : "var(--border-input)"}`,
                                    color: "var(--text-main)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s"
                                }
                            },
                                e('div', { style: { display: "flex", alignItems: "center", gap: 10 } },
                                    e(window.walleticons.WalletIcon, { name: w.name, color: w.color || "#00E676", size: 28, radius: 8 }),
                                    e('div', null, w.name)
                                ),
                                e('div', { style: { fontWeight: 700, color: (w.balanceCents || 0) < 0 ? "#EF4444" : "#00E676" } }, fc(w.balanceCents || 0))
                            ))
                        )
                ),
                selectedWallet && hasInsufficientBalance && e('div', { style: { background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", padding: "12px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 16 } },
                    `Insufficient balance. Available: ${fc(selectedWallet.balanceCents || 0)}`
                ),
                e('div', { style: S.modalFooter },
                    e(Btn, { v: "ghost", style: { flex: 1 }, onClick: onCancel }, "Cancel"),
                    e(Btn, { v: "accent", style: { flex: 1 }, onClick: () => onConfirm(selectedWalletId), disabled: !selectedWallet || hasInsufficientBalance }, "Confirm Payment")
                )
            )
        );
    }

    function BudgetBillsView({ incomes, setIncomes, bills, setBills, wallets, setWallets, txns, setTxns, fc, requestConfirm, showToast, recurring, setRecurring }) {
        const [incName, setIncName] = React.useState(""); const [incAmt, setIncAmt] = React.useState(""); const [incWalletId, setIncWalletId] = React.useState(CASH_WALLET_ID);
        const [billName, setBillName] = React.useState(""); const [billAmt, setBillAmt] = React.useState(""); const [billDate, setBillDate] = React.useState(""); const [billRecurring, setBillRecurring] = React.useState("none"); const [billCat, setBillCat] = React.useState("Bills");
        const [openMenuInc, setOpenMenuInc] = React.useState(null); const [editIncome, setEditIncome] = React.useState(null); const [editIncForm, setEditIncForm] = React.useState({ name: "", amount: "", walletId: CASH_WALLET_ID });
        const [openMenuBill, setOpenMenuBill] = React.useState(null); const [editBill, setEditBill] = React.useState(null); const [editBillForm, setEditBillForm] = React.useState({ name: "", amount: "", dueDate: "", recurring: "none", category: "Bills" });
        const [payBillModal, setPayBillModal] = React.useState(null);

        // ── RECURRING TRANSACTIONS STATE ──
        const [showAddRecurring, setShowAddRecurring] = React.useState(false);
        const [recName, setRecName] = React.useState("");
        const [recAmt, setRecAmt] = React.useState("");
        const [recCat, setRecCat] = React.useState("Other");
        const [recType, setRecType] = React.useState("expense");
        const [recFreq, setRecFreq] = React.useState("monthly");
        const [recDom, setRecDom] = React.useState(new Date().getDate());
        const [recWalletId, setRecWalletId] = React.useState(null);
        const [editRecurring, setEditRecurring] = React.useState(null);
        const [editRecForm, setEditRecForm] = React.useState({ name: "", amount: "", category: "Other", frequency: "monthly", dayOfMonth: 1 });

        const openEditIncome = (item) => { setEditIncome(item); setEditIncForm({ name: item.name, amount: String((item.amountCents / 100).toFixed(2)), walletId: item.walletId || CASH_WALLET_ID }); };
        const saveEditIncome = () => {
            if (!editIncForm.name || !editIncForm.amount) return;
            const oldRecord = incomes.find(i => i.id === editIncome.id);
            window.actions.editIncome({ incId: editIncome.id, editForm: editIncForm, oldRecord, wallets, incomes, setIncomes, setWallets });
            setEditIncome(null); showToast("Income updated!");
        };
        const deleteIncome = (id) => {
            const inc = incomes.find(i => i.id === id);
            if (!inc) return;
            window.actions.deleteIncome({ id, incomes, setIncomes, wallets, setWallets });
            // FIX #5: undo uses functional updates; no-op processFinancialTransaction removed
            showToast("Income deleted", () => {
                setIncomes(prev => [...prev, inc]);
            }, 5000);
        };

        const openEditBill = (item) => { setEditBill(item); setEditBillForm({ name: item.name, amount: String((item.amountCents / 100).toFixed(2)), dueDate: item.dueDate, recurring: item.recurring || "none", category: item.category || "Bills" }); };
        const saveEditBill = () => {
            if (!editBillForm.name || !editBillForm.amount || !editBillForm.dueDate) return;
            const newAmt = tc(editBillForm.amount);
            if (newAmt <= 0) { showToast("Amount must be greater than zero."); return; }
            // FIX #2+#4: Use functional updates for robustness. Wallet balance auto-adjusts via derived model.
            setBills(prev => prev.map(b => b.id === editBill.id ? { ...b, name: editBillForm.name.trim(), amountCents: newAmt, dueDate: editBillForm.dueDate, recurring: editBillForm.recurring, category: editBillForm.category } : b));
            setTxns(prev => prev.map(t => t.type === "bill_payment" && t.billId === editBill.id ? { ...t, amountCents: newAmt } : t));
            setEditBill(null); showToast("Bill updated!");
        };
        const markBillUnpaid = (bill) => {
            requestConfirm("Mark this bill as unpaid?", () => {
                // FIX #2+#5: Functional updates — wallet balance auto-derives from record changes
                setBills(prev => prev.map(x => x.id === bill.id ? { ...x, isPaid: false, paidTxnId: null, paidWalletId: null } : x));
                setTxns(prev => prev.filter(t => !(t.type === "bill_payment" && t.billId === bill.id)));
            });
        };
        const deleteBill = (id) => {
            requestConfirm("Delete this bill? Related payment records will also be removed.", () => {
                // FIX #5: Functional updates for robustness
                setBills(prev => prev.filter(b => b.id !== id));
                setTxns(prev => prev.filter(t => !(t.type === "bill_payment" && t.billId === id)));
            });
        };

        // FIX #9: Extracted income row render function
        const renderIncomeRow = (i, key) => {
            const srcWallet = (wallets||[]).find(w => w.id === i.walletId);
            return e('div', { key: key || i.id, className: "stream-row" },
                e('div', null,
                    e('div', { style: { fontWeight: 600 } }, i.name),
                    e('div', { style: { display:"flex", alignItems:"center", gap:6, marginTop:2 } },
                        e('div', { style: { fontSize: 11, color: "var(--text-muted)" } }, i.date),
                        srcWallet && e('div', { style: { display:"flex", alignItems:"center", gap:4, fontSize:10, fontWeight:700, color: srcWallet.color||"#00E676", background:"rgba(0,0,0,0.15)", padding:"2px 7px", borderRadius:6 } },
                            e('div', { style:{ width:6, height:6, borderRadius:"50%", background: srcWallet.color||"#00E676" } }), srcWallet.name)
                    )
                ),
                e('div', { style: S.row10 }, e('div', { style: { color: "#00E676", fontWeight: 700 } }, `+${fc(i.amountCents)}`), e(DotMenu, { itemId: i.id, openMenu: openMenuInc, setOpenMenu: setOpenMenuInc, onEdit: () => openEditIncome(i), onDelete: () => deleteIncome(i.id) }))
            );
        };

        return e('div', null,
            e(PageTitle, null, 'Bills & Income Tracks'),
            e('div', { className: "dashboard-grid" },
                e('div', { className: "premium-panel" },
                    e(SLabel, { style: { marginBottom: 16 } }, "Add Money In (Income)"),
                    e('div', { style: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 } },
                        e('div', { style: { display: "flex", gap: 8 } },
                            e('div', { style: { flex: 3 } }, e(Inp, { value: incName, placeholder: "Source name", onChange: ev => setIncName(ev.target.value) })),
                            e('div', { style: { flex: 2 } }, e(Inp, { type: "number", value: incAmt, placeholder: "₱ Amount", onChange: ev => setIncAmt(ev.target.value) }))
                        ),
                        e(IncomeSourcePicker, { wallets, setWallets, value: incWalletId, onChange: setIncWalletId, showToast }),
                        e(Btn, { v: "accent", style: { width: "100%" }, onClick: () => {
                            if(!incName || !incAmt) return;
                            if(tc(incAmt) <= 0) { showToast("Amount must be greater than zero."); return; }
                            const incW = wallets.find(w => w.id === incWalletId);
                            const rec = { id: uid(), name: incName.trim(), amountCents: tc(incAmt), date: todayStr(), walletId: incWalletId || null, walletNameSnapshot: incW ? incW.name : null };
                            window.actions.addIncome({ rec, wallets, setIncomes, setWallets });
                            setIncName(""); setIncAmt(""); setIncWalletId(CASH_WALLET_ID);
                            showToast("Income added!");
                        } }, "Add Income")
                    ),
                    e(SLabel, { style: { marginBottom: 12 } }, "Income History List"),
                    incomes.length === 0 ? e('div', { style: { color: "var(--text-muted)", fontSize: 13, padding: "10px 0" } }, e("div", { className: "empty-state" }, e("div", { className: "empty-state-icon" }, e(Icon, { name: "inbox", size: 28, color: "var(--text-muted)" })), e("div", { className: "empty-state-title" }, "No income added"), e("div", { className: "empty-state-sub" }, "Add a salary, freelance, or any cash in."))) :
                    incomes.length > 100 && window.VirtualList
                        ? e(window.VirtualList, {
                            items: incomes,
                            itemHeight: 56,
                            overscan: 5,
                            renderItem: renderIncomeRow
                        })
                        : incomes.map(i => renderIncomeRow(i, i.id))
                ),
                e('div', { className: "premium-panel" },
                    e(SLabel, { style: { marginBottom: 16 } }, "Add Due Bill"),
                    e('div', { style: { display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 } },
                        e(Inp, { value: billName, placeholder: "Bill Label (e.g. Electric, Rent)", onChange: ev => setBillName(ev.target.value) }),
                        e('div', { style: { display: "flex", gap: 12 } },
                            e(Inp, { type: "number", value: billAmt, placeholder: "Amount", onChange: ev => setBillAmt(ev.target.value) }),
                            e(Inp, { type: "date", value: billDate, onChange: ev => setBillDate(ev.target.value) })
                        ),
                        e('div', { style: { display: "flex", gap: 12 } },
                            e(Sel, { value: billRecurring, style: {flex: 1}, onChange: ev => setBillRecurring(ev.target.value) }, e('option', { value: "none" }, "One-Time"), e('option', { value: "monthly" }, "Monthly"), e('option', { value: "weekly" }, "Weekly")),
                            e(Sel, { value: billCat, style: {flex: 1}, onChange: ev => setBillCat(ev.target.value) }, CATEGORIES.map(c => e('option', {key: c, value: c}, c)))
                        ),
                        e(Btn, { v: "accent", onClick: () => { if(!billName || !billAmt || !billDate) return; if(tc(billAmt) <= 0) { showToast("Amount must be greater than zero."); return; } setBills([...bills, { id: uid(), name: billName, amountCents: tc(billAmt), dueDate: billDate, isPaid: false, recurring: billRecurring, category: billCat }]); setBillName(""); setBillAmt(""); setBillDate(""); setBillRecurring("none"); showToast(" Bill saved!"); } }, "Save Bill Item")
                    ),
                    e(SLabel, { style: { marginBottom: 12 } }, "Bill List Check"),
                    bills.length === 0 ? e('div', { style: { color: "var(--text-muted)", fontSize: 13, padding: "10px 0" } }, e("div", { className: "empty-state" }, e("div", { className: "empty-state-icon" }, e(Icon, { name: "receipt", size: 28, color: "var(--text-muted)" })), e("div", { className: "empty-state-title" }, "No bills yet"), e("div", { className: "empty-state-sub" }, "Track rent, utilities, subscriptions."))) :
                    bills.map(b => {
                        const isRecurring = b.recurring && b.recurring !== "none";
                        const days = getDaysRemaining(b.dueDate);
                        let uColor = "var(--text-muted)";
                        if (!b.isPaid) { if (days < 0) uColor = "#EF4444"; else if (days <= 1) uColor = "#EF4444"; else if (days <= 3) uColor = "#F59E0B"; }
                        return e('div', { key: b.id, className: "stream-row" },
                            e('div', null,
                                e('div', { style: S.row8 },
                                    e('div', { style: { fontWeight: 600, textDecoration: b.isPaid ? "line-through" : "none", color: b.isPaid ? "var(--text-muted)" : "var(--text-main)" } }, b.name),
                                    isRecurring && e('span', { style: { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "rgba(99,102,241,0.15)", color: "#818CF8" } }, b.recurring === "weekly" ? "Weekly" : "Monthly")
                                ),
                                e('div', { style: { fontSize: 11, color: uColor, fontWeight: days <= 3 && !b.isPaid ? 700 : 500 } }, `Due: ${b.dueDate} • ${b.category || "Bills"}`)
                            ),
                            e('div', { style: S.row10 },
                                e('span', { style: { fontWeight: 700, color: b.isPaid ? "var(--text-muted)" : "var(--text-main)" } }, fc(b.amountCents)),
                                e('button', { onClick: () => b.isPaid ? markBillUnpaid(b) : setPayBillModal(b), style: { background: b.isPaid ? "rgba(0, 230, 118, 0.15)" : "var(--hover-bg)", color: b.isPaid ? "#00E676" : "var(--text-main)", border: "none", padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" } }, b.isPaid ? "Paid" : "Pay"),
                                e(DotMenu, { itemId: b.id, openMenu: openMenuBill, setOpenMenu: setOpenMenuBill, onEdit: () => openEditBill(b), onDelete: () => deleteBill(b.id) })
                            )
                        );
                    })
                )
            ),
            payBillModal && e(PayBillModal, { bill: payBillModal, wallets, fc,
                onCancel: () => setPayBillModal(null),
                onConfirm: (walletId) => {
                    const billResult = window.finance.processFinancialTransaction({ type: "bill_payment", walletId, amountCents: payBillModal.amountCents, wallets, setWallets });
                    if (!billResult.ok) { showToast(billResult.error); return; }
                    const billW = wallets.find(w => w.id === walletId);
                    const txn = { id: uid(), type: "bill_payment", billId: payBillModal.id, walletId, amountCents: payBillModal.amountCents, date: todayStr(), walletNameSnapshot: billW ? billW.name : null };
                    setBills(bills.map(b => b.id === payBillModal.id ? { ...b, isPaid: true, paidTxnId: txn.id, paidWalletId: walletId } : b));
                    setTxns([...txns.filter(t => !(t.type === "bill_payment" && t.billId === payBillModal.id)), txn]);
                    setPayBillModal(null);
                }
            }),
            editIncome && e('div', { className: "modal-overlay" }, e('div', { className: "modal-container" }, e('h3', { style: { marginBottom: 20 } }, "Edit Income"), e(Field, { label: "Source" }, e(Inp, { value: editIncForm.name, onChange: ev => setEditIncForm({ ...editIncForm, name: ev.target.value }) })), e(Field, { label: "Amount" }, e(Inp, { type: "number", value: editIncForm.amount, onChange: ev => setEditIncForm({ ...editIncForm, amount: ev.target.value }) })), e(Field, { label: "Receiving Source" }, e(IncomeSourcePicker, { wallets, setWallets, value: editIncForm.walletId, onChange: v => setEditIncForm({ ...editIncForm, walletId: v }), showToast })), e('div', { style: { display: "flex", gap: 12, marginTop: 8 } }, e(Btn, { v: "ghost", style: { flex: 1 }, onClick: () => setEditIncome(null) }, "Cancel"), e(Btn, { v: "primary", style: { flex: 1 }, onClick: saveEditIncome }, "Save")))),
            editBill && e('div', { className: "modal-overlay" }, e('div', { className: "modal-container" }, e('h3', { style: { marginBottom: 20 } }, "Edit Bill"), e(Field, { label: "Bill Label" }, e(Inp, { value: editBillForm.name, onChange: ev => setEditBillForm({ ...editBillForm, name: ev.target.value }) })), e(Field, { label: "Amount" }, e(Inp, { type: "number", value: editBillForm.amount, onChange: ev => setEditBillForm({ ...editBillForm, amount: ev.target.value }) })), e(Field, { label: "Due Date" }, e(Inp, { type: "date", value: editBillForm.dueDate, onChange: ev => setEditBillForm({ ...editBillForm, dueDate: ev.target.value }) })), e(Field, { label: "Category" }, e(Sel, { value: editBillForm.category, onChange: ev => setEditBillForm({ ...editBillForm, category: ev.target.value }) }, CATEGORIES.map(c => e('option', {key: c, value: c}, c)))), e(Field, { label: "Recurring" }, e(Sel, { value: editBillForm.recurring, onChange: ev => setEditBillForm({ ...editBillForm, recurring: ev.target.value }) }, e('option', { value: "none" }, "One-Time"), e('option', { value: "monthly" }, "Monthly"), e('option', { value: "weekly" }, "Weekly"))), e('div', { style: { display: "flex", gap: 12 } }, e(Btn, { v: "ghost", style: { flex: 1 }, onClick: () => setEditBill(null) }, "Cancel"), e(Btn, { v: "accent", style: { flex: 1 }, onClick: saveEditBill }, "Save")))),

            // ── RECURRING TRANSACTIONS SECTION ──
            e('div', { className: "premium-panel", style: { marginTop: 20 } },
                e('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } },
                    e(SLabel, { style: { marginBottom: 0 } }, "Recurring Transactions"),
                    e(Btn, { v: "ghost", style: { fontSize: 12, padding: "6px 12px" }, onClick: () => setShowAddRecurring(!showAddRecurring) }, showAddRecurring ? "Cancel" : "+ Add")
                ),
                e('p', { style: { fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.5 } }, "Auto-logged expenses or income on schedule. Processed on each app open."),
                // Add form
                showAddRecurring && e('div', { style: { padding: "14px", background: "var(--hover-bg)", borderRadius: 10, border: "1px solid var(--border)", marginBottom: 16 } },
                    e('div', { style: { display: "flex", gap: 8, marginBottom: 10 } },
                        e('div', { style: { flex: 2 } }, e(Inp, { value: recName, placeholder: "Name (e.g. Netflix)", onChange: ev => setRecName(ev.target.value) })),
                        e('div', { style: { flex: 1 } }, e(Inp, { type: "number", value: recAmt, placeholder: "₱ Amount", onChange: ev => setRecAmt(ev.target.value) }))
                    ),
                    e('div', { style: { display: "flex", gap: 8, marginBottom: 10 } },
                        e(Sel, { value: recType, style: { flex: 1 }, onChange: ev => setRecType(ev.target.value) }, e('option', { value: "expense" }, "Expense"), e('option', { value: "income" }, "Income")),
                        e(Sel, { value: recFreq, style: { flex: 1 }, onChange: ev => setRecFreq(ev.target.value) }, e('option', { value: "daily" }, "Daily"), e('option', { value: "weekly" }, "Weekly"), e('option', { value: "biweekly" }, "Biweekly"), e('option', { value: "monthly" }, "Monthly")),
                        e(Sel, { value: recCat, style: { flex: 1 }, onChange: ev => setRecCat(ev.target.value) }, CATEGORIES.map(c => e('option', { key: c, value: c }, c)))
                    ),
                    recFreq === 'monthly' && e('div', { style: { marginBottom: 10 } },
                        e(Field, { label: "Day of Month" }, e(Inp, { type: "number", value: recDom, min: 1, max: 31, onChange: ev => setRecDom(parseInt(ev.target.value) || 1) }))
                    ),
                    e(Btn, { v: "accent", style: { width: "100%" }, onClick: () => {
                        if (!recName.trim() || !recAmt) { showToast("Enter name and amount."); return; }
                        if (tc(recAmt) <= 0) { showToast("Amount must be positive."); return; }
                        var now = new Date();
                        var nextDate = new Date(now.getFullYear(), now.getMonth(), recFreq === 'monthly' ? Math.min(recDom, 28) : now.getDate());
                        if (nextDate <= now) {
                            if (recFreq === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
                            else if (recFreq === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
                            else if (recFreq === 'biweekly') nextDate.setDate(nextDate.getDate() + 14);
                            else nextDate.setDate(nextDate.getDate() + 1);
                        }
                        var rec = { id: uid(), type: recType, name: recName.trim(), amountCents: tc(recAmt), category: recCat, walletId: recWalletId, frequency: recFreq, dayOfMonth: recDom, nextDueDate: nextDate.toISOString().slice(0, 10), isActive: true, createdAt: todayStr() };
                        window.actions.addRecurringItem({ rec, recurringItems: recurring || [], setRecurringItems: setRecurring });
                        setRecName(""); setRecAmt(""); setRecCat("Other"); setRecType("expense"); setRecFreq("monthly"); setRecDom(new Date().getDate()); setShowAddRecurring(false);
                        showToast("Recurring item added!");
                    } }, "Add Recurring Item")
                ),
                // List
                (!recurring || recurring.length === 0) && !showAddRecurring
                    ? e('div', { style: { color: "var(--text-muted)", fontSize: 13, padding: "10px 0" } }, e("div", { className: "empty-state" }, e("div", { className: "empty-state-icon" }, e(Icon, { name: "calendar", size: 28, color: "var(--text-muted)" })), e("div", { className: "empty-state-title" }, "No recurring items"), e("div", { className: "empty-state-sub" }, "Auto-log Netflix, Spotify, rent, salary, etc.")))
                    : (recurring || []).map(r => {
                        var freqLabel = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Biweekly', monthly: 'Monthly' }[r.frequency] || r.frequency;
                        return e('div', { key: r.id, className: "stream-row", style: { opacity: r.isActive ? 1 : 0.5 } },
                            e('div', null,
                                e('div', { style: { display: "flex", alignItems: "center", gap: 8 } },
                                    e('div', { style: { fontWeight: 600 } }, r.name),
                                    e('span', { style: { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: r.type === 'income' ? "rgba(0,230,118,0.15)" : "rgba(99,102,241,0.15)", color: r.type === 'income' ? "#00E676" : "#818CF8" } }, freqLabel),
                                    !r.isActive && e('span', { style: { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "rgba(239,68,68,0.15)", color: "#EF4444" } }, "Paused")
                                ),
                                e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 } }, `Next: ${r.nextDueDate} • ${r.category || 'Other'}`)
                            ),
                            e('div', { style: S.row10 },
                                e('span', { style: { fontWeight: 700, color: r.type === 'income' ? "#00E676" : "var(--text-main)" } }, (r.type === 'income' ? '+' : '') + fc(r.amountCents)),
                                e('button', {
                                    onClick: () => window.actions.toggleRecurringItem({ id: r.id, recurringItems: recurring, setRecurringItems: setRecurring }),
                                    style: { background: r.isActive ? "rgba(0,230,118,0.15)" : "var(--hover-bg)", color: r.isActive ? "#00E676" : "var(--text-muted)", border: "none", padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }
                                }, r.isActive ? "ON" : "OFF"),
                                e('button', {
                                    onClick: () => requestConfirm("Delete recurring item \"" + r.name + "\"?", () => { window.actions.deleteRecurringItem({ id: r.id, recurringItems: recurring, setRecurringItems: setRecurring }); showToast("Deleted."); }),
                                    style: { background: "transparent", color: "#EF4444", border: "none", padding: "6px 8px", cursor: "pointer", fontSize: 11 }
                                }, e(Icon, { name: "trash", size: 14, color: "#EF4444" }))
                            )
                        );
                    })
            )
        );
    }

    window.BudgetBillsView = React.memo(BudgetBillsView);
    window.PayBillModal = PayBillModal;
})();