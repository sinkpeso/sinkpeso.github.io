// SinkingFundsView.js — Savings vaults for SINKPESO
//
// Dependencies: React (global), Icon (global), utils.js, finance.js,
//   window.components.{Field, Inp, Sel, Btn, SLabel, PBar},
//   DotMenu, WalletPicker, EmptyState,
//   CASH_WALLET_ID, FUND_ICONS, resolveVaultIcon, S (globals from index.html)

(function () {
    "use strict";
    const e = React.createElement;
    const { tc, uid, todayStr } = window.utils;
    const { Field, Inp, Btn, SLabel, PBar } = window.components;

    function SinkingFundsView({ funds, setFunds, enrichedFunds, txns, setTxns, wallets, setWallets, fc, requestConfirm, showToast }) {
        const [modal, setModal] = React.useState(false);
        const [form, setForm] = React.useState({ iconId: "landmark", name: "", goal: "", start: "0" });
        const [actionModal, setActionModal] = React.useState(null);
        const [actionAmt, setActionAmt] = React.useState("");
        const [actionWalletId, setActionWalletId] = React.useState(CASH_WALLET_ID);
        const [openMenu, setOpenMenu] = React.useState(null);
        const [editVault, setEditVault] = React.useState(null);
        const [editVaultForm, setEditVaultForm] = React.useState({ iconId: "landmark", name: "", goal: "", start: "0" });
        const [showUpgrade, setShowUpgrade] = React.useState(false);

        const handleCreateVault = () => {
            if (!form.name || !form.goal) return;
            const vaultLimit = window.license ? window.license.canAddItem("vaults", funds.length) : (funds.length < 2);
            if (!vaultLimit) { setShowUpgrade(true); return; }
            setFunds(prev => [...prev, { id: uid(), iconId: form.iconId, name: form.name.trim(), goalCents: tc(form.goal), startCents: tc(form.start || "0") }]);
            setForm({ iconId: "landmark", name: "", goal: "", start: "0" }); setModal(false);
        };

        const handleLogVaultTxn = () => {
            if (!actionAmt || !actionModal) return;
            const amtCents = tc(actionAmt);
            if (amtCents <= 0) return;
            if (actionModal.type === "withdrawal" && amtCents > actionModal.fund.bal) {
                showToast(`Insufficient balance. Available: ${fc(actionModal.fund.bal)}`); return;
            }
            if (actionWalletId) {
                const txType = actionModal.type === "deposit" ? "vault_deposit" : "vault_withdrawal";
                const result = window.finance.processFinancialTransaction({ type: txType, walletId: actionWalletId, amountCents: amtCents, wallets, setWallets });
                if (!result.ok) { showToast(result.error); return; }
            }
            const vaultW = wallets.find(w => w.id === actionWalletId);
            setTxns(prev => [{ id: uid(), fundId: actionModal.fund.id, walletId: actionWalletId || null, walletNameSnapshot: vaultW ? vaultW.name : null, type: actionModal.type, amountCents: amtCents, date: todayStr() }, ...prev]);
            setActionAmt(""); setActionModal(null); setActionWalletId(CASH_WALLET_ID);
        };

        const openEditVault = (fund) => { setEditVault(fund); setEditVaultForm({ iconId: window.resolveVaultIcon(fund.iconId || fund.emoji), name: fund.name, goal: String((fund.goalCents / 100).toFixed(2)), start: String(((fund.startCents || 0) / 100).toFixed(2)) }); };
        const saveEditVault = () => { if (!editVaultForm.name || !editVaultForm.goal) return; setFunds(prev => prev.map(f => f.id === editVault.id ? { ...f, iconId: editVaultForm.iconId, name: editVaultForm.name.trim(), goalCents: tc(editVaultForm.goal), startCents: tc(editVaultForm.start || "0") } : f)); setEditVault(null); };
        const deleteVault = (id) => { requestConfirm("Delete this vault? All linked transactions will also be removed.", () => { setFunds(prev => prev.filter(f => f.id !== id)); setTxns(prev => prev.filter(t => t.fundId !== id)); }); };

        return e('div', null,
            e('div', { style: S.pageHeader },
                e('div', null,
                    e('h2', { style: { fontSize: 22, fontWeight: 800 } }, 'Savings Vaults'),
                    e('div', { style: { fontSize: 14, color: "var(--text-muted)", marginTop: 4 } }, 'Isolate cash balances cleanly.')
                ),
                (() => {
                    const atLimit = window.license ? !window.license.canAddItem("vaults", funds.length) : funds.length >= 2;
                    return atLimit && !window.license?.isPremium()
                        ? e('div', { style: { display:"flex", alignItems:"center", gap:8 } },
                            e('div', { style: { fontSize:11, fontWeight:700, color:"var(--text-muted)", padding:"8px 12px", background:"var(--hover-bg)", borderRadius:8, border:"1px solid var(--border)" } }, "2/2 vaults (Free limit)"),
                            e(Btn, { v:"ghost", style:{ fontSize:12, padding:"8px 14px" }, onClick: () => setShowUpgrade(true) }, "Upgrade")
                          )
                        : e(Btn, { v: "accent", onClick: () => setModal(true) }, "+ Create New Vault");
                })()
            ),
            enrichedFunds.length === 0 ? e('div', { className: "premium-panel", style: { textAlign: "center", padding: "40px 0", color: "var(--text-muted)" } }, e("div", { className: "empty-state" }, e("div", { className: "empty-state-icon" }, e(Icon, { name: "landmark", size: 32, color: "var(--text-muted)" })), e("div", { className: "empty-state-title" }, "No Savings Vaults yet"), e("div", { className: "empty-state-sub" }, "Create a vault to isolate money for a specific goal."))) :
            e('div', { className: "vaults-grid" }, enrichedFunds.map(f => e('div', { key: f.id, className: "premium-panel", style: { display: "flex", flexDirection: "column", justifyContent: "space-between" } },
                e('div', null,
                    e('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 } },
                        e('div', { style: { width: 40, height: 40, borderRadius: 12, background: "var(--hover-bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" } }, e(Icon, { name: window.resolveVaultIcon(f.iconId || f.emoji), size: 20, color: "#2563EB" })),
                        e('div', { style: S.row8 },
                            e('span', { style: { fontSize: 12, fontWeight: 700, color: f.pct >= 1 ? "#00E676" : "#2563EB", background: f.pct >= 1 ? "rgba(0,230,118,0.1)" : "rgba(37,99,235,0.1)", padding: "4px 10px", borderRadius: 8 } }, f.pct >= 1 ? "Fully Funded" : `${Math.round(f.pct * 100)}%`),
                            e(DotMenu, { itemId: f.id, openMenu, setOpenMenu, onEdit: () => openEditVault(f), onDelete: () => deleteVault(f.id) })
                        )
                    ),
                    e('h3', { style: { fontSize: 18, fontWeight: 700, color: "var(--text-main)" } }, f.name),
                    e('div', { style: { display: "flex", justifyContent: "space-between", margin: "14px 0 6px", fontSize: 14 } },
                        e('span', { style: { fontWeight: 700, color: "var(--text-main)" } }, fc(f.bal)),
                        e('span', { style: { color: "var(--text-muted)" } }, `Target: ${fc(f.goalCents)}`)
                    ),
                    e(PBar, { pct: f.pct, color: f.pct >= 1 ? "#00E676" : "#2563EB" })
                ),
                e('div', { style: { display: "flex", gap: 10, marginTop: 20 } },
                    e(Btn, { v: "ghost", style: { flex: 1, padding: "8px 12px", fontSize: 12 }, onClick: () => setActionModal({ type: 'withdrawal', fund: f }) }, "Withdraw"),
                    e(Btn, { v: "primary", style: { flex: 1, padding: "8px 12px", fontSize: 12 }, onClick: () => setActionModal({ type: 'deposit', fund: f }) }, "Deposit")
                )
            ))),

            modal && e('div', { className: "modal-overlay" }, e('div', { className: "modal-container" },
                e('h3', { style: { marginBottom: 20 } }, "Setup Target Vault"),
                e(Field, { label: "Vault Icon" }, e('div', { style: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 } }, FUND_ICONS.map(fi => e('button', { key: fi.id, title: fi.label, onClick: () => setForm({ ...form, iconId: fi.id }), style: { padding: "10px 0", border: `1px solid ${form.iconId === fi.id ? "#2563EB" : "var(--border)"}`, borderRadius: 10, background: form.iconId === fi.id ? "rgba(37,99,235,0.12)" : "var(--bg-input)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" } }, e(Icon, { name: fi.id, size: 16, color: form.iconId === fi.id ? "#2563EB" : "var(--text-muted)" }))))),
                e(Field, { label: "Vault Name" }, e(Inp, { value: form.name, onChange: ev => setForm({ ...form, name: ev.target.value }) })),
                e(Field, { label: "Goal Amount" }, e(Inp, { type: "number", value: form.goal, onChange: ev => setForm({ ...form, goal: ev.target.value }) })),
                e(Field, { label: "Starting Balance" }, e(Inp, { type: "number", value: form.start, onChange: ev => setForm({ ...form, start: ev.target.value }) })),
                e('div', { style: S.modalFooter }, e(Btn, { v: "ghost", style: { flex: 1 }, onClick: () => setModal(false) }, "Cancel"), e(Btn, { v: "accent", style: { flex: 1 }, onClick: handleCreateVault }, "Initialize Vault"))
            )),

            editVault && e('div', { className: "modal-overlay" }, e('div', { className: "modal-container" },
                e('h3', { style: { marginBottom: 20 } }, "Edit Vault"),
                e(Field, { label: "Vault Icon" }, e('div', { style: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 } }, FUND_ICONS.map(fi => e('button', { key: fi.id, title: fi.label, onClick: () => setEditVaultForm({ ...editVaultForm, iconId: fi.id }), style: { padding: "10px 0", border: `1px solid ${editVaultForm.iconId === fi.id ? "#2563EB" : "var(--border)"}`, borderRadius: 10, background: editVaultForm.iconId === fi.id ? "rgba(37,99,235,0.12)" : "var(--bg-input)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" } }, e(Icon, { name: fi.id, size: 16, color: editVaultForm.iconId === fi.id ? "#2563EB" : "var(--text-muted)" }))))),
                e(Field, { label: "Vault Name" }, e(Inp, { value: editVaultForm.name, onChange: ev => setEditVaultForm({ ...editVaultForm, name: ev.target.value }) })),
                e(Field, { label: "Goal Amount" }, e(Inp, { type: "number", value: editVaultForm.goal, onChange: ev => setEditVaultForm({ ...editVaultForm, goal: ev.target.value }) })),
                e(Field, { label: "Starting Balance" }, e(Inp, { type: "number", value: editVaultForm.start, onChange: ev => setEditVaultForm({ ...editVaultForm, start: ev.target.value }) })),
                e('div', { style: S.modalFooter }, e(Btn, { v: "ghost", style: { flex: 1 }, onClick: () => setEditVault(null) }, "Cancel"), e(Btn, { v: "accent", style: { flex: 1 }, onClick: saveEditVault }, "Save Changes"))
            )),

            actionModal && e('div', { className: "modal-overlay" }, e('div', { className: "modal-container" },
                e('h3', { style: { marginBottom: 8, textTransform: "capitalize" } }, `${actionModal.type} — ${actionModal.fund.name}`),
                e('p', { style: { fontSize: 13, color: "var(--text-muted)", marginBottom: 20 } }, `Current balance held: ${fc(actionModal.fund.bal)}`),
                e(Field, { label: `Amount to ${actionModal.type}` }, e(Inp, { type: "number", value: actionAmt, autoFocus: true, onChange: ev => setActionAmt(ev.target.value) })),
                wallets && wallets.length > 0 && e(Field, { label: actionModal.type === 'deposit' ? "Take money from" : "Send money to" }, e(WalletPicker, { wallets, value: actionWalletId, onChange: setActionWalletId })),
                e('div', { style: S.modalFooter },
                    e(Btn, { v: "ghost", style: { flex: 1 }, onClick: () => { setActionModal(null); setActionWalletId(CASH_WALLET_ID); } }, "Back"),
                    e(Btn, { v: actionModal.type === 'deposit' ? 'primary' : 'danger', style: { flex: 1 }, onClick: handleLogVaultTxn }, `Commit ${actionModal.type}`)
                )
            )),

            showUpgrade && window.UpgradePromptModal && e(window.UpgradePromptModal, {
                message: "You've reached the free limit of 2 vaults. Upgrade to Premium for unlimited vaults.",
                onClose: () => setShowUpgrade(false)
            })
        );
    }

    window.SinkingFundsView = React.memo(SinkingFundsView);
})();