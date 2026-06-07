// WalletsView.js — Wallet management component for SINKPESO
//
// Dependencies: React (global), Icon (global from index.html),
//   window.components.{Field, Inp, Btn}, window.walleticons.WalletIcon,
//   window.license, window.finance, window.utils.{tc, uid}
//   EmptyState (global), DotMenu (global from index.html),
//   CASH_WALLET_ID, WALLET_COLORS, S (globals from index.html)

(function () {
    "use strict";
    const e = React.createElement;
    const { tc, uid, todayStr } = window.utils;
    const { Field, Inp, Btn } = window.components;

    function WalletsView({ wallets, rawWallets, setWallets, incomes, dailyExpenses, txns, setTxns, fc, requestConfirm, showToast }) {
        const CURRENCIES = window.CURRENCIES || { "PHP": {} };
        const CURRENCY_LABELS = window.CURRENCY_LABELS || { "PHP": "₱ PHP — Philippine Peso" };

        const [modal, setModal] = React.useState(false);
        const [form, setForm] = React.useState({ name: "", balanceCents: "", color: WALLET_COLORS[0], currency: "PHP" });
        const [editWallet, setEditWallet] = React.useState(null);
        const [editForm, setEditForm] = React.useState({ name: "", color: WALLET_COLORS[0], currency: "PHP" });
        const [openMenu, setOpenMenu] = React.useState(null);
        const [showUpgrade, setShowUpgrade] = React.useState(false);
        const [transferModal, setTransferModal] = React.useState(false);
        const [transferForm, setTransferForm] = React.useState({ fromWalletId: "", toWalletId: "", amount: "", fee: "", note: "" });

        const walletFlow = (wId) => {
            const inc  = (incomes || []).filter(i => i.walletId === wId).reduce((s, i) => s + i.amountCents, 0);
            const exp  = (dailyExpenses || []).filter(d => d.walletId === wId).reduce((s, d) => s + d.amountCents, 0);
            const bill = (txns || []).filter(t => t.walletId === wId && t.type === "bill_payment").reduce((s, t) => s + t.amountCents, 0);
            const transferIn  = (txns || []).filter(t => t.type === "wallet_transfer" && t.toWalletId === wId).reduce((s, t) => s + t.amountCents, 0);
            const transferOut = (txns || []).filter(t => t.type === "wallet_transfer" && t.fromWalletId === wId).reduce((s, t) => s + t.amountCents + (t.feeCents || 0), 0);
            return { inc: inc + transferIn, out: exp + bill + transferOut };
        };

        const handleCreate = () => {
            if (!form.name) return;
            const canAdd = window.license ? window.license.canAddItem("wallets", rawWallets.length) : (rawWallets.length < 3);
            if (!canAdd) {
                setModal(false);
                setShowUpgrade(true);
                return;
            }
            setWallets(prev => [...prev, { id: uid(), name: form.name.trim(), openingBalanceCents: tc(form.balanceCents || "0"), color: form.color, currency: form.currency || "PHP" }]);
            setForm({ name: "", balanceCents: "", color: WALLET_COLORS[0], currency: "PHP" });
            setModal(false);
        };

        const openEdit = (w) => { setEditWallet(w); setEditForm({ name: w.name, color: w.color || WALLET_COLORS[0], currency: w.currency || "PHP" }); };
        const saveEdit = () => {
            if (!editForm.name) return;
            setWallets(prev => prev.map(w => w.id === editWallet.id ? { ...w, name: editForm.name.trim(), color: editForm.color, currency: editForm.currency || "PHP" } : w));
            setEditWallet(null);
        };

        const deleteWallet = (id) => {
            const wallet = wallets.find(w => w.id === id);
            if (wallet && (wallet.balanceCents || 0) !== 0) {
                showToast("This wallet still has a balance. Move or spend it first.");
                return;
            }
            requestConfirm("Delete this wallet?", () => setWallets(prev => prev.filter(w => w.id !== id)));
        };

        const handleTransfer = () => {
            const fromId = transferForm.fromWalletId || (wallets[0] ? wallets[0].id : "");
            const toId = transferForm.toWalletId;
            const amtCents = tc(transferForm.amount);
            if (!fromId || !toId) { showToast("Please select both source and destination wallets."); return; }
            if (fromId === toId) { showToast("Source and destination must be different."); return; }
            if (amtCents <= 0) { showToast("Enter a valid amount."); return; }
            const fromW = wallets.find(w => w.id === fromId);
            const toW = wallets.find(w => w.id === toId);
            if (!fromW || !toW) { showToast("Wallet not found."); return; }
            const feeCents = tc(transferForm.fee || "0");
            if ((fromW.balanceCents || 0) < amtCents + feeCents) { showToast("Insufficient funds in source wallet (including fee)."); return; }
            const rec = {
                id: uid(),
                type: "wallet_transfer",
                fromWalletId: fromId,
                toWalletId: toId,
                amountCents: amtCents,
                feeCents: feeCents,
                date: todayStr(),
                note: transferForm.note ? transferForm.note.trim() : null,
                fromWalletNameSnapshot: fromW.name,
                toWalletNameSnapshot: toW.name,
            };
            const result = window.actions.transferBetweenWallets({ rec, wallets, setTxns });
            if (!result.ok) { showToast(result.error); return; }
            setTransferModal(false);
            setTransferForm({ fromWalletId: "", toWalletId: "", amount: "", fee: "", note: "" });
            showToast(`Transferred ${fc(amtCents)} from ${fromW.name} to ${toW.name}` + (feeCents > 0 ? ` (${fc(feeCents)} fee)` : ""));
        };

        const ColorPicker = ({ value, onChange }) => e('div', { style: { display:"flex", gap:8, flexWrap:"wrap", marginTop:4 } },
            WALLET_COLORS.map(c => e('button', { key:c, onClick: () => onChange(c), style: { width:28, height:28, borderRadius:"50%", background:c, border: value===c ? "3px solid var(--text-main)" : "2px solid transparent", cursor:"pointer", padding:0, flexShrink:0 } }))
        );

        return e('div', null,
            e('div', { style: S.pageHeader },
                e('div', null,
                    e('h2', { style: S.pageTitle }, 'Wallets'),
                    e('div', { style: { fontSize:13, color:"var(--text-muted)", marginTop:4 } }, 'Track where your money lives. '),
                    e('div', { style: { fontSize:11, color:"var(--text-light)", marginTop:3, fontStyle:"italic" } }, 'Wallet balances persist across months.')
                ),
                (() => {
                    const atLimit = window.license ? !window.license.canAddItem("wallets", rawWallets.length) : rawWallets.length >= 3;
                    const btns = [];
                    if (wallets.length >= 2) {
                        btns.push(e(Btn, { key:"transfer", v:"ghost", style:{ fontSize:12, padding:"8px 14px" }, onClick: () => {
                            setTransferForm({ fromWalletId: wallets[0].id, toWalletId: wallets[1] ? wallets[1].id : "", amount: "", fee: "", note: "" });
                            setTransferModal(true);
                        } }, "↔ Transfer"));
                    }
                    if (atLimit && !window.license?.isPremium()) {
                        btns.push(e('div', { key:"limit", style: { fontSize:11, fontWeight:700, color:"var(--text-muted)", padding:"8px 12px", background:"var(--hover-bg)", borderRadius:8, border:"1px solid var(--border)" } }, "3/3 wallets (Free limit)"));
                        btns.push(e(Btn, { key:"upgrade", v:"ghost", style:{ fontSize:12, padding:"8px 14px" }, onClick: () => setShowUpgrade(true) }, "Upgrade"));
                    } else {
                        btns.push(e(Btn, { key:"add", v:"accent", onClick: () => setModal(true) }, "+ Add Wallet"));
                    }
                    return e('div', { style: { display:"flex", alignItems:"center", gap:8 } }, ...btns);
                })()
            ),

            wallets.length === 0
                ? e('div', { className:"premium-panel" }, e(EmptyState, { icon:"creditcard", title:"No wallets yet", sub:"Add Cash, GCash, Maya or any bank account to track balances." }))
                : e('div', { className:"premium-panel" },
                    wallets.map(w => {
                        const flow = walletFlow(w.id);
                        return e('div', { key:w.id, className:"stream-row" },
                            // ── LEFT: icon + name/amounts ─────────────────────────────────
                            // FIX: flex:1 + minWidth:0 so this side actually shrinks when
                            //      the right side (balance + menu) needs space. Without it
                            //      the "this month" label overflows off-screen on mobile.
                            e('div', { style:{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:0 } },
                                e(window.walleticons.WalletIcon, { name: w.name, color: w.color||"#00E676", size: 32, radius: 9 }),
                                // FIX: minWidth:0 + flex:1 on the text block so it can
                                //      shrink and its children respect the container width.
                                e('div', { style:{ minWidth:0, flex:1 } },
                                    e('div', { style:{ fontWeight:600, color:"var(--text-main)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" } }, w.name),
                                    w.currency && w.currency !== 'PHP' && e('div', { style:{ fontSize:10, color:"var(--text-muted)", marginTop:1, fontWeight:600 } }, w.currency),
                                    // FIX: amounts row — whiteSpace:nowrap on each span so
                                    //      they never split mid-number; "this month" moved
                                    //      to its own line so it is always fully visible.
                                    e('div', { style:{ display:"flex", gap:8, marginTop:3, fontSize:11, fontWeight:600, alignItems:"center" } },
                                        e('span', { style:{ color:"#00E676", whiteSpace:"nowrap" } }, `+${fc(flow.inc)}`),
                                        e('span', { style:{ color:"#EF4444", whiteSpace:"nowrap" } }, `-${fc(flow.out)}`)
                                    ),
                                    e('div', { style:{ fontSize:10, color:"var(--text-muted)", marginTop:1 } }, "this month")
                                )
                            ),
                            // ── RIGHT: balance + action ───────────────────────────────────
                            e('div', { style:S.row10 },
                                e('div', { style:{ textAlign:"right" } },
                                    e('div', { style:{ fontWeight:700, fontVariantNumeric:"tabular-nums", color: (w.balanceCents||0) < 0 ? "#EF4444" : "var(--text-main)" } }, fc(w.balanceCents||0)),
                                    e('div', { style:{ fontSize:10, color:"var(--text-muted)", marginTop:1 } }, "current balance")
                                ),
                                w.id === CASH_WALLET_ID
                                    ? e('div', { style:{ fontSize:10, fontWeight:700, color:"var(--text-muted)", padding:"4px 8px", background:"var(--hover-bg)", borderRadius:6, border:"1px solid var(--border)", letterSpacing:"0.06em", whiteSpace:"nowrap", flexShrink:0 } }, "SYSTEM")
                                    : e(DotMenu, { itemId:w.id, openMenu, setOpenMenu, onEdit:() => openEdit(w), onDelete:() => deleteWallet(w.id) })
                            )
                        );
                    })
                ),

            transferModal && e('div', { className:"modal-overlay", onClick:() => setTransferModal(false) },
                e('div', { className:"modal-container", style:{maxWidth:400}, onClick:ev=>ev.stopPropagation() },
                    e('div', { style:S.modalHeader },
                        e('div', { style:S.modalTitle }, "Transfer Between Wallets"),
                        e('button', { onClick:()=>setTransferModal(false), style:S.closeBtn }, e(Icon, {name:"x",size:16}))
                    ),
                    e(Field, { label:"From Wallet" },
                        e(WalletPicker, {
                            wallets,
                            value: transferForm.fromWalletId || (wallets[0] ? wallets[0].id : ""),
                            onChange: v => setTransferForm({...transferForm, fromWalletId: v})
                        })
                    ),
                    e(Field, { label:"To Wallet" },
                        e('select', {
                            value: transferForm.toWalletId || "",
                            onChange: ev => setTransferForm({...transferForm, toWalletId: ev.target.value}),
                            style: { width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid var(--border)", background:"var(--bg-input)", color:"var(--text-main)", fontSize:14, fontWeight:600 }
                        },
                            e('option', { value:"" }, "Select destination…"),
                            wallets
                                .filter(w => w.id !== (transferForm.fromWalletId || (wallets[0] ? wallets[0].id : "")))
                                .map(w => e('option', { key:w.id, value:w.id }, w.name))
                        )
                    ),
                    e(Field, { label:"Amount" }, e(Inp, { type:"number", placeholder:"0.00", value:transferForm.amount, onChange:ev=>setTransferForm({...transferForm, amount:ev.target.value}) })),
                    e(Field, { label:"Fee (optional)" }, e(Inp, { type:"number", placeholder:"0.00", value:transferForm.fee, onChange:ev=>setTransferForm({...transferForm, fee:ev.target.value}) })),
                    e(Field, { label:"Note (optional)" }, e(Inp, { placeholder:"e.g. Cash out for GCash", value:transferForm.note, onChange:ev=>setTransferForm({...transferForm, note:ev.target.value}) })),
                    (() => {
                        const fromId = transferForm.fromWalletId || (wallets[0] ? wallets[0].id : "");
                        const fromW = wallets.find(w => w.id === fromId);
                        const toId = transferForm.toWalletId;
                        const toW = wallets.find(w => w.id === toId);
                        if (fromW && toW) {
                            return e('div', { style:{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, margin:"8px 0 4px", fontSize:13, color:"var(--text-muted)" } },
                                e('span', { style:{ fontWeight:600, color:"var(--text-main)" } }, fromW.name),
                                e(Icon, { name:"transfer", size:14, color:"var(--text-muted)" }),
                                e('span', { style:{ fontWeight:600, color:"var(--text-main)" } }, toW.name),
                                transferForm.amount ? e('span', { style:{ fontWeight:700, color:"#2563EB" } }, fc(tc(transferForm.amount))) : null
                            );
                        }
                        return null;
                    })(),
                    e('div', { style:{...S.modalFooter, marginTop:20} },
                        e(Btn, { v:"ghost", style:{flex:1}, onClick:()=>{
                            setTransferModal(false);
                            setTransferForm({ fromWalletId: "", toWalletId: "", amount: "", fee: "", note: "" });
                        }}, "Cancel"),
                        e(Btn, { v:"accent", style:{flex:1}, onClick:handleTransfer }, "Transfer")
                    )
                )
            ),

            modal && e('div', { className:"modal-overlay", onClick:() => setModal(false) },
                e('div', { className:"modal-container", style:{maxWidth:400}, onClick:ev=>ev.stopPropagation() },
                    e('div', { style:S.modalHeader },
                        e('div', { style:S.modalTitle }, "Add Wallet"),
                        e('button', { onClick:()=>setModal(false), style:S.closeBtn }, e(Icon, {name:"x",size:16}))
                    ),
                    e(Field, { label:"Wallet Name" }, e(Inp, { autoFocus:true, placeholder:"e.g. GCash, BPI, Cash", value:form.name, onChange:ev=>setForm({...form,name:ev.target.value}) })),
                    e(Field, { label:"Opening Balance" }, e(Inp, { type:"number", placeholder:"0.00", value:form.balanceCents, onChange:ev=>setForm({...form,balanceCents:ev.target.value}) })),
                    e(Field, { label:"Currency" },
                        e('select', {
                            value: form.currency || "PHP",
                            onChange: ev => setForm({...form, currency: ev.target.value}),
                            style: { width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid var(--border)", background:"var(--bg-input)", color:"var(--text-main)", fontSize:14, fontWeight:600 }
                        },
                            Object.keys(CURRENCIES).map(code =>
                                e('option', { key:code, value:code }, CURRENCY_LABELS[code] || code)
                            )
                        )
                    ),
                    e(Field, { label:"Color" }, e(ColorPicker, { value:form.color, onChange:c=>setForm({...form,color:c}) })),
                    e('div', { style:{...S.modalFooter, marginTop:20} },
                        e(Btn, { v:"ghost", style:{flex:1}, onClick:()=>setModal(false) }, "Cancel"),
                        e(Btn, { v:"accent", style:{flex:1}, onClick:handleCreate }, "Add Wallet")
                    )
                )
            ),

            editWallet && e('div', { className:"modal-overlay", onClick:()=>setEditWallet(null) },
                e('div', { className:"modal-container", style:{maxWidth:400}, onClick:ev=>ev.stopPropagation() },
                    e('div', { style:S.modalHeader },
                        e('div', { style:S.modalTitle }, "Edit Wallet"),
                        e('button', { onClick:()=>setEditWallet(null), style:S.closeBtn }, e(Icon, {name:"x",size:16}))
                    ),
                    e(Field, { label:"Wallet Name" }, e(Inp, { autoFocus:true, value:editForm.name, onChange:ev=>setEditForm({...editForm,name:ev.target.value}) })),
                    e(Field, { label:"Currency" },
                        e('select', {
                            value: editForm.currency || "PHP",
                            onChange: ev => setEditForm({...editForm, currency: ev.target.value}),
                            style: { width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid var(--border)", background:"var(--bg-input)", color:"var(--text-main)", fontSize:14, fontWeight:600 }
                        },
                            Object.keys(CURRENCIES).map(code =>
                                e('option', { key:code, value:code }, CURRENCY_LABELS[code] || code)
                            )
                        )
                    ),
                    e(Field, { label:"Color" }, e(ColorPicker, { value:editForm.color, onChange:c=>setEditForm({...editForm,color:c}) })),
                    e('div', { style:{...S.modalFooter, marginTop:20} },
                        e(Btn, { v:"ghost", style:{flex:1}, onClick:()=>setEditWallet(null) }, "Cancel"),
                        e(Btn, { v:"primary", style:{flex:1}, onClick:saveEdit }, "Save")
                    )
                )
            ),

            showUpgrade && window.UpgradePromptModal && e(window.UpgradePromptModal, {
                message: "You've reached the free limit of 3 wallets. Upgrade to Premium for unlimited wallets.",
                onClose: () => setShowUpgrade(false)
            })
        );
    }

    window.WalletsView = React.memo(WalletsView);
})();
