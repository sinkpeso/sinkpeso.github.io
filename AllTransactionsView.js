// AllTransactionsView.js — Transaction log for SINKPESO
//
// Dependencies: React (global), Icon (global), utils.js, selectors.js,
//   window.components.{Field, Inp, Sel, Btn, SLabel},
//   DotMenu, VirtualList, S (globals from index.html)

(function () {
    "use strict";
    const e = React.createElement;
    const { tc } = window.utils;
    const { Field, Inp, Sel, Btn, SLabel } = window.components;

    function AllTransactionsView({ txns, setTxns, funds, incomes, dailyExpenses, bills, wallets, fc, requestConfirm }) {
        const [search, setSearch] = React.useState("");
        const [walletFilter, setWalletFilter] = React.useState("all");
        const [dateFrom, setDateFrom] = React.useState("");
        const [dateTo, setDateTo] = React.useState("");
        const [openMenu, setOpenMenu] = React.useState(null);
        const [editTxn, setEditTxn] = React.useState(null);
        const [editTxnForm, setEditTxnForm] = React.useState({ type: "deposit", amount: "", date: "" });

        const allItems = React.useMemo(() =>
            window.selectors.getAllTransactionItems({ dailyExpenses, incomes, txns, bills, funds, wallets }),
        [dailyExpenses, incomes, txns, bills, funds, wallets]);

        const filtered = React.useMemo(() => {
            let list = allItems;
            if (walletFilter !== "all") list = list.filter(item => item.walletId === walletFilter);
            if (dateFrom) list = list.filter(item => item.date >= dateFrom);
            if (dateTo) list = list.filter(item => item.date <= dateTo);
            if (search.trim()) {
                const q = search.toLowerCase();
                list = list.filter(item =>
                    item.title.toLowerCase().includes(q) ||
                    item.subtitle.toLowerCase().includes(q) ||
                    (item.walletName && item.walletName.toLowerCase().includes(q))
                );
            }
            return list;
        }, [allItems, walletFilter, search, dateFrom, dateTo]);

        const getVaultName = (fundId) => { const f = (funds||[]).find(x => x.id === fundId); return f ? f.name : "Unknown Vault"; };
        const openEditTxn = (t) => { setEditTxn(t); setEditTxnForm({ type: t.type, amount: String((t.amountCents / 100).toFixed(2)), date: t.date }); };
        const saveEditTxn = () => { if (!editTxnForm.amount || !editTxnForm.date) return; setTxns(prev => prev.map(t => t.id === editTxn.id ? { ...t, type: editTxnForm.type, amountCents: tc(editTxnForm.amount), date: editTxnForm.date } : t)); setEditTxn(null); };
        const deleteTxn = (id) => { requestConfirm("Delete this transaction?", () => setTxns(prev => prev.filter(t => t.id !== id))); };

        return e('div', null,
            e('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 } },
                e('div', null,
                    e('h2', { style: { fontSize: 22, fontWeight: 800, marginBottom: 4 } }, 'Transaction Log'),
                    e('div', { style: { fontSize: 14, color: "var(--text-muted)", marginBottom: 20 } }, 'Full history — expenses, income, bills, and vault actions.')
                ),
            ),

            e('div', { className: "bento-filter", style: { marginBottom: 14 } },
                e('div', { className: "bento-filter-search" },
                    e(Inp, { placeholder: "Search title, category, wallet…", value: search, onChange: ev => setSearch(ev.target.value), style: { marginBottom: 0 } })
                ),
                e('div', { className: "bento-filter-controls bento-filter-controls--trio" },
                    e(Sel, { value: walletFilter, onChange: ev => setWalletFilter(ev.target.value), style: { marginBottom: 0 } },
                        e('option', { value: "all" }, "All Wallets"),
                        (wallets || []).map(w => e('option', { key: w.id, value: w.id }, w.name))
                    ),
                    (dateFrom || dateTo)
                        ? e('button', { onClick: () => { setDateFrom(""); setDateTo(""); }, style: { background: "var(--hover-bg)", border: "1px solid var(--border)", color: "var(--text-main)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "10px 12px", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, whiteSpace: "nowrap" } }, e(Icon, { name: "x", size: 12 }), "Clear")
                        : e('div')
                )
            ),
            e('div', { className: "bento-filter-row" },
                e('div', { className: "txn-date-row" },
                    e('div', { className: "txn-date-field" },
                        e('div', { className: "txn-date-label" }, "From Date"),
                        e(Inp, { type: "date", value: dateFrom, onChange: ev => setDateFrom(ev.target.value), style: { marginBottom: 0 } })
                    ),
                    e('div', { className: "txn-date-field" },
                        e('div', { className: "txn-date-label" }, "To Date"),
                        e(Inp, { type: "date", value: dateTo, onChange: ev => setDateTo(ev.target.value), style: { marginBottom: 0 } })
                    )
                )
            ),

            e('div', { className: "bento-txn-list", style: { maxHeight: 520, overflow: "auto" } },
                e(VirtualList, {
                    items: filtered, itemHeight: 64, overscan: 5,
                    emptyContent: e('div', { style: { padding: "36px 24px", textAlign: "center" } },
                        e('div', { style: { marginBottom: 14, opacity: 0.35, display: "flex", justifyContent: "center" } }, e(Icon, { name: "clipboardlist", size: 38, color: "var(--text-muted)" })),
                        e('div', { style: { fontWeight: 700, fontSize: 15, color: "var(--text-light)", marginBottom: 6 } }, allItems.length === 0 ? "No transactions yet" : "No matching transactions"),
                        e('div', { style: { fontSize: 13, color: "var(--text-muted)" } }, allItems.length === 0 ? "Add an expense, income, or pay a bill to start tracking." : "Try a different search or wallet filter.")
                    ),
                    renderItem: (item) => {
                        const canEdit = item.source === "vault";
                        const canDeleteTransfer = item.source === "transfer";
                        return e('div', { className: "txn-row" },
                            e('div', { className: "txn-left" },
                                e('div', { className: "txn-icon", style: { background: item.amountColor + "15", border: "1px solid " + item.amountColor + "35" } }, e(Icon, { name: item.icon, size: 15, color: item.amountColor })),
                                e('div', { className: "txn-text" },
                                    e('div', { className: "txn-title" }, item.title),
                                    e('div', { className: "txn-sub" }, item.subtitle),
                                    e('div', { className: "txn-wallet-tag" }, item.walletName ? e('span', null, e('span', { style: { color: "var(--text-muted)" } }, "Wallet: "), e('span', { style: { fontWeight: 700, color: "var(--text-light)" } }, item.walletName)) : null)
                                )
                            ),
                            e('div', { className: "txn-right" },
                                e('div', { className: "txn-amount-col" },
                                    e('div', { className: "txn-amount", style: { color: item.amountColor } }, `${item.amountPrefix}${fc(item.amountCents)}`),
                                    e('div', { className: "txn-date" }, item.date)
                                ),
                                canEdit
                                    ? e(DotMenu, { itemId: item.rawId, openMenu, setOpenMenu, onEdit: () => { const t = (txns||[]).find(x => x.id === item.rawId); if (t) openEditTxn(t); }, onDelete: () => deleteTxn(item.rawId) })
                                    : canDeleteTransfer
                                        ? e('button', { onClick: () => deleteTxn(item.rawId), style: { background:"transparent", border:"none", cursor:"pointer", padding:6, color:"var(--text-muted)", borderRadius:6 }, title:"Delete transfer" }, e(Icon, { name:"trash", size:14 }))
                                        : e('div', { style: { width: 34 } })
                            )
                        );
                    }
                })
            ),

            editTxn && e('div', { className: "modal-overlay" }, e('div', { className: "modal-container" },
                e('h3', { style: { marginBottom: 8 } }, "Edit Vault Transaction"),
                e('p', { style: { fontSize: 13, color: "var(--text-muted)", marginBottom: 20 } }, `Vault: ${getVaultName(editTxn.fundId)}`),
                e(Field, { label: "Transaction Type" }, e(Sel, { value: editTxnForm.type, onChange: ev => setEditTxnForm({ ...editTxnForm, type: ev.target.value }) }, e('option', { value: "deposit" }, "Deposit"), e('option', { value: "withdrawal" }, "Withdrawal"))),
                e(Field, { label: "Amount" }, e(Inp, { type: "number", value: editTxnForm.amount, onChange: ev => setEditTxnForm({ ...editTxnForm, amount: ev.target.value }) })),
                e(Field, { label: "Date" }, e(Inp, { type: "date", value: editTxnForm.date, onChange: ev => setEditTxnForm({ ...editTxnForm, date: ev.target.value }) })),
                e('div', { style: S.formFooter }, e(Btn, { v: "ghost", style: { flex: 1 }, onClick: () => setEditTxn(null) }, "Cancel"), e(Btn, { v: "primary", style: { flex: 1 }, onClick: saveEditTxn }, "Save Changes"))
            ))
        );
    }

    window.AllTransactionsView = React.memo(AllTransactionsView);
})();