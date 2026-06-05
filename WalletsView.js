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
    const { tc, uid } = window.utils;
    const { Field, Inp, Btn } = window.components;

    function WalletsView({ wallets, rawWallets, setWallets, incomes, dailyExpenses, txns, fc, requestConfirm, showToast }) {
        const [modal, setModal] = React.useState(false);
        const [form, setForm] = React.useState({ name: "", balanceCents: "", color: WALLET_COLORS[0] });
        const [editWallet, setEditWallet] = React.useState(null);
        const [editForm, setEditForm] = React.useState({ name: "", color: WALLET_COLORS[0] });
        const [openMenu, setOpenMenu] = React.useState(null);
        const [showUpgrade, setShowUpgrade] = React.useState(false);

        const walletFlow = (wId) => {
            const inc  = (incomes || []).filter(i => i.walletId === wId).reduce((s, i) => s + i.amountCents, 0);
            const exp  = (dailyExpenses || []).filter(d => d.walletId === wId).reduce((s, d) => s + d.amountCents, 0);
            const bill = (txns || []).filter(t => t.walletId === wId && t.type === "bill_payment").reduce((s, t) => s + t.amountCents, 0);
            return { inc, out: exp + bill };
        };

        const handleCreate = () => {
            if (!form.name) return;
            const canAdd = window.license ? window.license.canAddItem("wallets", rawWallets.length) : (rawWallets.length < 3);
            if (!canAdd) {
                setModal(false);
                setShowUpgrade(true);
                return;
            }
            setWallets(prev => [...prev, { id: uid(), name: form.name.trim(), openingBalanceCents: tc(form.balanceCents || "0"), color: form.color }]);
            setForm({ name: "", balanceCents: "", color: WALLET_COLORS[0] });
            setModal(false);
        };

        const openEdit = (w) => { setEditWallet(w); setEditForm({ name: w.name, color: w.color || WALLET_COLORS[0] }); };
        const saveEdit = () => {
            if (!editForm.name) return;
            setWallets(prev => prev.map(w => w.id === editWallet.id ? { ...w, name: editForm.name.trim(), color: editForm.color } : w));
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
                    return atLimit && !window.license?.isPremium()
                        ? e('div', { style: { display:"flex", alignItems:"center", gap:8 } },
                            e('div', { style: { fontSize:11, fontWeight:700, color:"var(--text-muted)", padding:"8px 12px", background:"var(--hover-bg)", borderRadius:8, border:"1px solid var(--border)" } }, "3/3 wallets (Free limit)"),
                            e(Btn, { v:"ghost", style:{ fontSize:12, padding:"8px 14px" }, onClick: () => setShowUpgrade(true) }, "Upgrade")
                          )
                        : e(Btn, { v:"accent", onClick: () => setModal(true) }, "+ Add Wallet");
                })()
            ),

            wallets.length === 0
                ? e('div', { className:"premium-panel" }, e(EmptyState, { icon:"creditcard", title:"No wallets yet", sub:"Add Cash, GCash, Maya or any bank account to track balances." }))
                : e('div', { className:"premium-panel" },
                    wallets.map(w => {
                        const flow = walletFlow(w.id);
                        return e('div', { key:w.id, className:"stream-row" },
                            e('div', { style:{ display:"flex", alignItems:"center", gap:12 } },
                                e(window.walleticons.WalletIcon, { name: w.name, color: w.color||"#00E676", size: 32, radius: 9 }),
                                e('div', null,
                                    e('div', { style:{ fontWeight:600, color:"var(--text-main)" } }, w.name),
                                    e('div', { style:{ display:"flex", gap:10, marginTop:3, fontSize:11, fontWeight:600 } },
                                        e('span', { style:{ color:"#00E676" } }, `+${fc(flow.inc)}`),
                                        e('span', { style:{ color:"#EF4444" } }, `-${fc(flow.out)}`),
                                        e('span', { style:{ color:"var(--text-muted)" } }, "this month")
                                    )
                                )
                            ),
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

            modal && e('div', { className:"modal-overlay", onClick:() => setModal(false) },
                e('div', { className:"modal-container", style:{maxWidth:400}, onClick:ev=>ev.stopPropagation() },
                    e('div', { style:S.modalHeader },
                        e('div', { style:S.modalTitle }, "Add Wallet"),
                        e('button', { onClick:()=>setModal(false), style:S.closeBtn }, e(Icon, {name:"x",size:16}))
                    ),
                    e(Field, { label:"Wallet Name" }, e(Inp, { autoFocus:true, placeholder:"e.g. GCash, BPI, Cash", value:form.name, onChange:ev=>setForm({...form,name:ev.target.value}) })),
                    e(Field, { label:"Opening Balance" }, e(Inp, { type:"number", placeholder:"0.00", value:form.balanceCents, onChange:ev=>setForm({...form,balanceCents:ev.target.value}) })),
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