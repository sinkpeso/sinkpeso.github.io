// DebtView.js — Utang Tracker for SINKPESO
//
// Tracks debts: money you owe ("Utang Ko") and money owed to you ("Utang Sa Akin").
// Each debt has: personName, amountCents, type, status, notes, createdDate, dueDate, payments[]
//
// Dependencies: React (global), Icon (global), constants.js globals,
//   window.components.{Field, Inp, Sel, Btn, SLabel, PageTitle},
//   window.utils.{uid, todayStr}

(function () {
    "use strict";
    const e = React.createElement;
    const { uid, todayStr } = window.utils;
    const { Field, Inp, Sel, Btn, SLabel, PageTitle } = window.components;

    // ── ADD/EDIT DEBT MODAL ──────────────────────────────────────────────
    function DebtModal({ debt, onSave, onClose, fc }) {
        const isEdit = !!debt;
        const [personName, setPersonName] = React.useState(debt ? debt.personName : "");
        const [amount, setAmount] = React.useState(debt ? String(debt.amountCents / 100) : "");
        const [type, setType] = React.useState(debt ? debt.type : "i_owe");
        const [notes, setNotes] = React.useState(debt ? (debt.notes || "") : "");
        const [dueDate, setDueDate] = React.useState(debt ? (debt.dueDate || "") : "");

        const handleSave = () => {
            if (!personName.trim()) return;
            const amtCents = window.utils.tc(amount);
            if (amtCents <= 0) return;
            onSave({
                id: debt ? debt.id : uid(),
                personName: personName.trim(),
                amountCents: amtCents,
                type,
                status: debt ? debt.status : "pending",
                notes: notes.trim(),
                createdDate: debt ? debt.createdDate : todayStr(),
                dueDate: dueDate || null,
                payments: debt ? debt.payments : [],
            });
        };

        return e('div', { className: "modal-overlay", onClick: onClose },
            e('div', { className: "modal-container", style: { maxWidth: 420 }, onClick: ev => ev.stopPropagation() },
                e('div', { style: { ...S.modalHeader, marginBottom: 20 } },
                    e('div', { style: S.modalTitle }, isEdit ? "Edit Debt" : "Add New Debt"),
                    e('button', { onClick: onClose, style: S.closeBtn }, e(Icon, { name: "x", size: 16 }))
                ),
                e(Field, { label: "Person Name" },
                    e(Inp, { value: personName, placeholder: "Who?", onChange: ev => setPersonName(ev.target.value) })
                ),
                e(Field, { label: "Amount" },
                    e(Inp, { type: "number", value: amount, placeholder: "0.00", onChange: ev => setAmount(ev.target.value) })
                ),
                e(Field, { label: "Type" },
                    e('div', { style: { display: "flex", gap: 8 } },
                        ["i_owe", "owed_to_me"].map(t =>
                            e('button', {
                                key: t,
                                onClick: () => setType(t),
                                style: {
                                    flex: 1, padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                                    cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                                    background: type === t ? (t === "i_owe" ? "rgba(239,68,68,0.12)" : "rgba(0,230,118,0.12)") : "var(--hover-bg)",
                                    border: type === t ? ("1px solid " + (t === "i_owe" ? "rgba(239,68,68,0.3)" : "rgba(0,230,118,0.3)")) : "1px solid var(--border)",
                                    color: type === t ? (t === "i_owe" ? "#EF4444" : "#00E676") : "var(--text-muted)",
                                }
                            }, t === "i_owe" ? "Utang Ko" : "Utang Sa Akin")
                        )
                    )
                ),
                e(Field, { label: "Due Date (optional)" },
                    e(Inp, { type: "date", value: dueDate, onChange: ev => setDueDate(ev.target.value) })
                ),
                e(Field, { label: "Notes (optional)" },
                    e(Inp, { value: notes, placeholder: "Details...", onChange: ev => setNotes(ev.target.value) })
                ),
                e('div', { style: S.formFooter },
                    e(Btn, { v: "ghost", style: { flex: 1 }, onClick: onClose }, "Cancel"),
                    e(Btn, { v: "accent", style: { flex: 1 }, onClick: handleSave }, isEdit ? "Save" : "Add Debt")
                )
            )
        );
    }

    // ── PAYMENT MODAL ────────────────────────────────────────────────────
    function PaymentModal({ debt, onPay, onClose, fc }) {
        const [amount, setAmount] = React.useState("");
        const paidSoFar = (debt.payments || []).reduce((s, p) => s + p.amountCents, 0);
        const remaining = debt.amountCents - paidSoFar;

        const handlePay = () => {
            const amtCents = window.utils.tc(amount);
            if (amtCents <= 0) return;
            if (amtCents > remaining) return;
            onPay({
                date: todayStr(),
                amountCents: amtCents,
            });
        };

        return e('div', { className: "modal-overlay", onClick: onClose },
            e('div', { className: "modal-container", style: { maxWidth: 360 }, onClick: ev => ev.stopPropagation() },
                e('div', { style: { ...S.modalHeader, marginBottom: 20 } },
                    e('div', { style: S.modalTitle }, "Record Payment"),
                    e('button', { onClick: onClose, style: S.closeBtn }, e(Icon, { name: "x", size: 16 }))
                ),
                e('div', { style: { background: "var(--hover-bg)", borderRadius: 12, padding: "14px 16px", marginBottom: 20, border: "1px solid var(--border)" } },
                    e('div', { style: { display: "flex", justifyContent: "space-between", marginBottom: 8 } },
                        e('span', { style: { fontSize: 13, color: "var(--text-muted)" } }, "Total"),
                        e('span', { style: { fontSize: 13, fontWeight: 700 } }, fc(debt.amountCents))
                    ),
                    e('div', { style: { display: "flex", justifyContent: "space-between", marginBottom: 8 } },
                        e('span', { style: { fontSize: 13, color: "var(--text-muted)" } }, "Paid"),
                        e('span', { style: { fontSize: 13, fontWeight: 700, color: "#00E676" } }, fc(paidSoFar))
                    ),
                    e('div', { style: { display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 8 } },
                        e('span', { style: { fontSize: 13, color: "var(--text-muted)" } }, "Remaining"),
                        e('span', { style: { fontSize: 13, fontWeight: 700, color: "#EF4444" } }, fc(remaining))
                    )
                ),
                e(Field, { label: "Payment Amount" },
                    e(Inp, { type: "number", value: amount, placeholder: "0.00", onChange: ev => setAmount(ev.target.value) })
                ),
                e('div', { style: S.formFooter },
                    e(Btn, { v: "ghost", style: { flex: 1 }, onClick: onClose }, "Cancel"),
                    e(Btn, { v: "accent", style: { flex: 1 }, onClick: handlePay }, "Record Payment")
                )
            )
        );
    }

    // ── DEBT CARD ────────────────────────────────────────────────────────
    function DebtCard({ debt, onEdit, onDelete, onPay, onMarkPaid, fc }) {
        const paidSoFar = (debt.payments || []).reduce((s, p) => s + p.amountCents, 0);
        const remaining = debt.amountCents - paidSoFar;
        const pct = debt.amountCents > 0 ? paidSoFar / debt.amountCents : 0;
        const isPaid = debt.status === "paid" || remaining <= 0;
        const statusColor = isPaid ? "#00E676" : debt.status === "partial" ? "#F59E0B" : "#EF4444";
        const statusLabel = isPaid ? "Paid" : debt.status === "partial" ? "Partial" : "Pending";
        const isIOwe = debt.type === "i_owe";
        const typeColor = isIOwe ? "#EF4444" : "#00E676";
        const typeLabel = isIOwe ? "Utang Ko" : "Utang Sa Akin";

        return e('div', { style: {
            background: "var(--hover-bg)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "16px", marginBottom: 12,
        }},
            // Header row
            e('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 } },
                e('div', null,
                    e('div', { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 } },
                        e('span', { style: { fontSize: 15, fontWeight: 700, color: "var(--text-main)" } }, debt.personName),
                        e('span', { style: {
                            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
                            background: typeColor + "18", color: typeColor, border: "1px solid " + typeColor + "30",
                        } }, typeLabel)
                    ),
                    debt.notes && e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 } }, debt.notes)
                ),
                e('div', { style: { display: "flex", gap: 4 } },
                    !isPaid && e('button', { onClick: onPay, style: { ...S.iconBtn, width: 28, height: 28 }, title: "Record Payment" },
                        e(Icon, { name: "plus", size: 12 })
                    ),
                    e('button', { onClick: onEdit, style: { ...S.iconBtn, width: 28, height: 28 }, title: "Edit" },
                        e(Icon, { name: "edit", size: 12 })
                    ),
                    e('button', { onClick: onDelete, style: { ...S.iconBtn, width: 28, height: 28, color: "#EF4444" }, title: "Delete" },
                        e(Icon, { name: "trash", size: 12, color: "#EF4444" })
                    )
                )
            ),
            // Amount
            e('div', { style: { display: "flex", justifyContent: "space-between", marginBottom: 8 } },
                e('div', null,
                    e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 2 } }, "Total"),
                    e('div', { style: { fontSize: 18, fontWeight: 800, color: typeColor } }, fc(debt.amountCents))
                ),
                e('div', { style: { textAlign: "right" } },
                    e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 2 } }, "Remaining"),
                    e('div', { style: { fontSize: 18, fontWeight: 800, color: isPaid ? "#00E676" : "var(--text-main)" } }, fc(remaining))
                )
            ),
            // Progress bar
            e('div', { style: { height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 10 } },
                e('div', { style: {
                    height: "100%", borderRadius: 3,
                    width: Math.min(100, Math.round(pct * 100)) + "%",
                    background: isPaid ? "#00E676" : "#F59E0B",
                    transition: "width 0.3s ease",
                }})
            ),
            // Status + date row
            e('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                e('div', { style: { display: "flex", alignItems: "center", gap: 6 } },
                    e('span', { style: {
                        display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5,
                        background: statusColor + "18", color: statusColor,
                    } },
                        e('svg', { width: 10, height: 10, viewBox: "0 0 24 24", fill: "none", stroke: statusColor, strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" },
                            isPaid ? e('path', { d: "M20 6L9 17l-5-5" }) : e('circle', { cx: 12, cy: 12, r: 1 })
                        ),
                        statusLabel
                    ),
                    paidSoFar > 0 && e('span', { style: { fontSize: 11, color: "var(--text-muted)" } }, fc(paidSoFar) + " paid")
                ),
                debt.dueDate && e('span', { style: { fontSize: 11, color: "var(--text-muted)" } }, "Due: " + debt.dueDate)
            ),
            // Payment history
            debt.payments && debt.payments.length > 0 && e('div', { style: { marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" } },
                e('div', { style: { fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 } }, "Payments"),
                debt.payments.map((p, i) =>
                    e('div', { key: i, style: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-light)", marginBottom: 3 } },
                        e('span', null, p.date),
                        e('span', { style: { fontWeight: 600, color: "#00E676" } }, "+" + fc(p.amountCents))
                    )
                )
            )
        );
    }

    // ── MAIN VIEW ────────────────────────────────────────────────────────
    function DebtView({ debts, setDebts, fc, requestConfirm, showToast }) {
        const [showAddModal, setShowAddModal] = React.useState(false);
        const [editDebt, setEditDebt] = React.useState(null);
        const [payDebt, setPayDebt] = React.useState(null);
        const [filter, setFilter] = React.useState("all");

        const iOwe = (debts || []).filter(d => d.type === "i_owe");
        const owedToMe = (debts || []).filter(d => d.type === "owed_to_me");
        const totalIOwe = iOwe.reduce((s, d) => {
            const paid = (d.payments || []).reduce((ps, p) => ps + p.amountCents, 0);
            return s + Math.max(0, d.amountCents - paid);
        }, 0);
        const totalOwedToMe = owedToMe.reduce((s, d) => {
            const paid = (d.payments || []).reduce((ps, p) => ps + p.amountCents, 0);
            return s + Math.max(0, d.amountCents - paid);
        }, 0);

        const handleAdd = (debt) => {
            setDebts(prev => [debt, ...prev]);
            setShowAddModal(false);
            showToast("Debt added.");
        };
        const handleEdit = (debt) => {
            setDebts(prev => prev.map(d => d.id === debt.id ? debt : d));
            setEditDebt(null);
            showToast("Debt updated.");
        };
        const handleDelete = (id) => {
            requestConfirm("Delete this debt and all payment history?", () => {
                setDebts(prev => prev.filter(d => d.id !== id));
                showToast("Debt deleted.");
            });
        };
        const handlePay = (debtId, payment) => {
            setDebts(prev => prev.map(d => {
                if (d.id !== debtId) return d;
                const newPayments = [...(d.payments || []), payment];
                const paidTotal = newPayments.reduce((s, p) => s + p.amountCents, 0);
                const newStatus = paidTotal >= d.amountCents ? "paid" : "partial";
                return { ...d, payments: newPayments, status: newStatus };
            }));
            setPayDebt(null);
            showToast("Payment recorded.");
        };
        const handleMarkPaid = (id) => {
            setDebts(prev => prev.map(d => {
                if (d.id !== id) return d;
                const paidSoFar = (d.payments || []).reduce((s, p) => s + p.amountCents, 0);
                const remaining = d.amountCents - paidSoFar;
                const newPayments = remaining > 0 ? [...(d.payments || []), { date: todayStr(), amountCents: remaining }] : d.payments;
                return { ...d, payments: newPayments, status: "paid" };
            }));
            showToast("Marked as paid.");
        };

        const filteredDebts = (debts || []).filter(d => {
            if (filter === "i_owe") return d.type === "i_owe";
            if (filter === "owed_to_me") return d.type === "owed_to_me";
            if (filter === "pending") return d.status !== "paid";
            return true;
        }).sort((a, b) => {
            const order = { pending: 0, partial: 1, paid: 2 };
            return (order[a.status] || 0) - (order[b.status] || 0);
        });

        return e('div', null,
            e(PageTitle, { sub: "Track money you owe and money owed to you." }, "Utang Tracker"),

            // Summary cards
            e('div', { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 } },
                e('div', { style: { ...S.statCard, borderLeft: "3px solid #EF4444" } },
                    e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 } }, "Utang Ko"),
                    e('div', { style: { fontSize: 22, fontWeight: 800, color: "#EF4444" } }, fc(totalIOwe)),
                    e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 4 } }, iOwe.length + " debt" + (iOwe.length !== 1 ? "s" : ""))
                ),
                e('div', { style: { ...S.statCard, borderLeft: "3px solid #00E676" } },
                    e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 } }, "Utang Sa Akin"),
                    e('div', { style: { fontSize: 22, fontWeight: 800, color: "#00E676" } }, fc(totalOwedToMe)),
                    e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 4 } }, owedToMe.length + " debt" + (owedToMe.length !== 1 ? "s" : ""))
                )
            ),

            // Action bar
            e('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 } },
                e('div', { style: { display: "flex", gap: 6 } },
                    ["all", "i_owe", "owed_to_me", "pending"].map(f =>
                        e('button', {
                            key: f,
                            onClick: () => setFilter(f),
                            style: {
                                padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                                cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                                background: filter === f ? "var(--bg-panel)" : "transparent",
                                border: filter === f ? "1px solid var(--border)" : "1px solid transparent",
                                color: filter === f ? "var(--text-main)" : "var(--text-muted)",
                            }
                        }, f === "all" ? "All" : f === "i_owe" ? "Utang Ko" : f === "owed_to_me" ? "Sa Akin" : "Active")
                    )
                ),
                e(Btn, { v: "accent", onClick: () => setShowAddModal(true) }, "+ Add Debt")
            ),

            // Debt list
            filteredDebts.length === 0
                ? e(EmptyState, { icon: "creditcard", title: "No debts tracked", sub: "Tap + Add Debt to start tracking utang." })
                : filteredDebts.map(d =>
                    e(DebtCard, {
                        key: d.id, debt: d, fc,
                        onEdit: () => setEditDebt(d),
                        onDelete: () => handleDelete(d.id),
                        onPay: () => setPayDebt(d),
                        onMarkPaid: () => handleMarkPaid(d.id),
                    })
                ),

            // Modals
            showAddModal && e(DebtModal, { onSave: handleAdd, onClose: () => setShowAddModal(false), fc }),
            editDebt && e(DebtModal, { debt: editDebt, onSave: handleEdit, onClose: () => setEditDebt(null), fc }),
            payDebt && e(PaymentModal, { debt: payDebt, onPay: (p) => handlePay(payDebt.id, p), onClose: () => setPayDebt(null), fc })
        );
    }

    window.DebtView = React.memo(DebtView);
})();