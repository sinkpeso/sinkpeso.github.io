// RecurringView.js — Recurring Transactions Manager for SINKPESO
//
// View, add, edit, delete, and toggle recurring expenses & income.
// Uses the backend engine from finance.js and CRUD from actions.js.
//
// Dependencies: React (global), Icon (global), constants.js globals,
//   window.components.{Field, Inp, Sel, Btn, SLabel, PageTitle},
//   window.utils.{uid, todayStr, tc},
//   window.actions.{addRecurringItem, editRecurringItem, deleteRecurringItem, toggleRecurringItem},
//   window.finance.{calculateNextDueDate}

(function () {
    "use strict";
    const e = React.createElement;
    const { useState, useMemo } = React;
    const { uid, todayStr, tc } = window.utils;
    const { Field, Inp, Sel, Btn, PageTitle } = window.components;
    const S = window.SINKPESO_S;
    const Icon = window.SINKPESO_Icon;
    const CATEGORIES = window.SINKPESO_CONSTANTS ? window.SINKPESO_CONSTANTS.CATEGORIES : ["Food","Gas","Bills","Business","Personal","Savings"];

    // ── CONSTANTS ────────────────────────────────────────────────────────
    var FREQUENCIES = [
        { value: "daily",     label: "Daily" },
        { value: "weekly",    label: "Weekly" },
        { value: "biweekly",  label: "Every 2 Weeks" },
        { value: "monthly",   label: "Monthly" },
    ];

    // ── ADD / EDIT MODAL ─────────────────────────────────────────────────
    function RecurringModal({ item, wallets, onSave, onClose }) {
        var isEdit = !!item;
        var _s = useState(item ? item.name : "");                     var name       = _s[0]; var setName       = _s[1];
        _s = useState(item ? String(item.amountCents / 100) : "");    var amount     = _s[0]; var setAmount     = _s[1];
        _s = useState(item ? item.type : "expense");                  var type       = _s[0]; var setType       = _s[1];
        _s = useState(item ? (item.category || CATEGORIES[0]) : CATEGORIES[0]); var category = _s[0]; var setCategory = _s[1];
        _s = useState(item ? item.frequency : "monthly");             var frequency  = _s[0]; var setFrequency  = _s[1];
        _s = useState(item ? (item.walletId || "") : "");             var walletId   = _s[0]; var setWalletId   = _s[1];
        _s = useState(item ? item.nextDueDate : todayStr());          var nextDue    = _s[0]; var setNextDue    = _s[1];

        var handleSave = function () {
            if (!name.trim()) return;
            var amtCents = tc(amount);
            if (amtCents <= 0) return;

            var dayOfMonth = null;
            var dayOfWeek = null;
            if (frequency === "monthly") {
                var d = new Date(nextDue + "T12:00:00");
                dayOfMonth = d.getDate();
            }
            if (frequency === "weekly" || frequency === "biweekly") {
                var d2 = new Date(nextDue + "T12:00:00");
                dayOfWeek = d2.getDay();
            }

            onSave({
                id: item ? item.id : uid(),
                type: type,
                name: name.trim(),
                amountCents: amtCents,
                category: category,
                walletId: walletId || null,
                frequency: frequency,
                dayOfMonth: dayOfMonth,
                dayOfWeek: dayOfWeek,
                nextDueDate: nextDue,
                isActive: item ? item.isActive : true,
                createdAt: item ? item.createdAt : todayStr(),
            });
        };

        return e('div', { className: "modal-overlay", onClick: onClose },
            e('div', { role: "dialog", "aria-modal": "true", "aria-label": isEdit ? "Edit Recurring" : "Add Recurring", className: "modal-container", style: { maxWidth: 420 }, onClick: function (ev) { ev.stopPropagation(); } },

                // Header
                e('div', { style: { ...S.modalHeader, marginBottom: 20 } },
                    e('div', { style: S.modalTitle }, isEdit ? "Edit Recurring" : "Add Recurring"),
                    e('button', { onClick: onClose, style: S.closeBtn }, e(Icon, { name: "x", size: 16 }))
                ),

                // Type toggle
                e(Field, { label: "Type" },
                    e('div', { style: { display: "flex", gap: 8 } },
                        ["expense", "income"].map(function (t) {
                            return e('button', {
                                key: t,
                                onClick: function () { setType(t); },
                                style: {
                                    flex: 1, padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                                    cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                                    background: type === t ? (t === "expense" ? "rgba(239,68,68,0.12)" : "rgba(0,230,118,0.12)") : "var(--hover-bg)",
                                    border: type === t ? ("1px solid " + (t === "expense" ? "rgba(239,68,68,0.3)" : "rgba(0,230,118,0.3)")) : "1px solid var(--border)",
                                    color: type === t ? (t === "expense" ? "#EF4444" : "#00E676") : "var(--text-muted)",
                                }
                            }, t === "expense" ? "Expense" : "Income");
                        })
                    )
                ),

                // Name
                e(Field, { label: "Name" },
                    e(Inp, { value: name, placeholder: "e.g. Netflix, Salary, Rent", onChange: function (ev) { setName(ev.target.value); } })
                ),

                // Amount
                e(Field, { label: "Amount" },
                    e(Inp, { type: "number", value: amount, placeholder: "0.00", onChange: function (ev) { setAmount(ev.target.value); } })
                ),

                // Category
                e(Field, { label: "Category" },
                    e(Sel, { value: category, onChange: function (ev) { setCategory(ev.target.value); } },
                        CATEGORIES.map(function (c) { return e('option', { key: c, value: c }, c); })
                    )
                ),

                // Frequency
                e(Field, { label: "Frequency" },
                    e('div', { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 } },
                        FREQUENCIES.map(function (f) {
                            return e('button', {
                                key: f.value,
                                onClick: function () { setFrequency(f.value); },
                                style: {
                                    padding: "8px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                                    cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                                    background: frequency === f.value ? "rgba(0,230,118,0.12)" : "var(--hover-bg)",
                                    border: frequency === f.value ? "1px solid rgba(0,230,118,0.3)" : "1px solid var(--border)",
                                    color: frequency === f.value ? "#00E676" : "var(--text-muted)",
                                }
                            }, f.label);
                        })
                    )
                ),

                // Wallet
                e(Field, { label: "Wallet" },
                    e(Sel, { value: walletId, onChange: function (ev) { setWalletId(ev.target.value); } },
                        e('option', { value: "" }, "No wallet (unlinked)"),
                        (wallets || []).map(function (w) { return e('option', { key: w.id, value: w.id }, w.name); })
                    )
                ),

                // Next due date
                e(Field, { label: "Next Due Date" },
                    e(Inp, { type: "date", value: nextDue, onChange: function (ev) { setNextDue(ev.target.value); } })
                ),

                // Actions
                e('div', { style: S.formFooter },
                    e(Btn, { v: "ghost", style: { flex: 1 }, onClick: onClose }, "Cancel"),
                    e(Btn, { v: "accent", style: { flex: 1 }, onClick: handleSave }, isEdit ? "Save" : "Add")
                )
            )
        );
    }

    // ── RECURRING ITEM CARD ──────────────────────────────────────────────
    function RecurringCard({ item, fc, walletName, onEdit, onDelete, onToggle }) {
        var isExpense = item.type === "expense";
        var typeColor = isExpense ? "#EF4444" : "#00E676";
        var freqLabel = FREQUENCIES.find(function (f) { return f.value === item.frequency; });
        var overdue = item.isActive && item.nextDueDate <= todayStr();

        return e('div', {
            style: {
                background: "var(--hover-bg)",
                border: "1px solid " + (item.isActive ? "var(--border)" : "rgba(255,255,255,0.04)"),
                borderRadius: 14, padding: "16px", marginBottom: 12,
                opacity: item.isActive ? 1 : 0.55,
                transition: "opacity 0.2s",
            }
        },
            // Top row: toggle + info + actions
            e('div', { style: { display: "flex", alignItems: "center", gap: 12 } },

                // Toggle switch
                e('button', {
                    onClick: onToggle,
                    title: item.isActive ? "Pause recurring" : "Resume recurring",
                    "aria-label": item.isActive ? "Pause recurring" : "Resume recurring",
                    style: {
                        width: 40, height: 22, borderRadius: 11, border: "none",
                        background: item.isActive ? "#00E676" : "rgba(255,255,255,0.1)",
                        cursor: "pointer", position: "relative", flexShrink: 0,
                        transition: "background 0.2s",
                    }
                },
                    e('div', { style: {
                        width: 16, height: 16, borderRadius: 8,
                        background: "#fff",
                        position: "absolute", top: 3,
                        left: item.isActive ? 21 : 3,
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    } })
                ),

                // Info
                e('div', { style: { flex: 1, minWidth: 0 } },
                    e('div', { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 2 } },
                        e('span', {
                            style: {
                                fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                                background: typeColor + "18", color: typeColor, border: "1px solid " + typeColor + "30",
                                textTransform: "uppercase", letterSpacing: "0.05em",
                            }
                        }, item.type),
                        e('span', {
                            style: {
                                fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 5,
                                background: "rgba(59,130,246,0.1)", color: "#3B82F6",
                            }
                        }, freqLabel ? freqLabel.label : item.frequency)
                    ),
                    e('div', { style: { fontSize: 15, fontWeight: 700, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, item.name),
                    e('div', { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 11, color: "var(--text-muted)" } },
                        e('span', null, item.category),
                        walletName && e('span', null, " · " + walletName)
                    )
                ),

                // Amount
                e('div', { style: { textAlign: "right", flexShrink: 0 } },
                    e('div', { style: { fontSize: 16, fontWeight: 800, color: typeColor } }, (isExpense ? "-" : "+") + fc(item.amountCents)),
                    e('div', { style: { fontSize: 10, color: overdue ? "#F59E0B" : "var(--text-muted)", marginTop: 2, fontWeight: overdue ? 600 : 400 } },
                        overdue ? "Due now" : "Next: " + item.nextDueDate
                    )
                )
            ),

            // Action buttons
            e('div', { style: { display: "flex", justifyContent: "flex-end", gap: 4, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" } },
                e('button', { onClick: onEdit, style: { ...S.iconBtn, width: 28, height: 28 }, title: "Edit" },
                    e(Icon, { name: "edit", size: 12 })
                ),
                e('button', { onClick: onDelete, style: { ...S.iconBtn, width: 28, height: 28, color: "#EF4444" }, title: "Delete" },
                    e(Icon, { name: "trash", size: 12, color: "#EF4444" })
                )
            )
        );
    }

    // ── MAIN VIEW ────────────────────────────────────────────────────────
    function RecurringView({ recurring, setRecurring, wallets, fc, requestConfirm, showToast }) {
        var _s = useState(false);          var showAddModal = _s[0]; var setShowAddModal = _s[1];
        _s = useState(null);               var editItem     = _s[0]; var setEditItem     = _s[1];
        _s = useState("all");              var filter       = _s[0]; var setFilter       = _s[1];

        var items = recurring || [];

        // Stats
        var activeItems = items.filter(function (i) { return i.isActive; });
        var totalExpenses = activeItems.filter(function (i) { return i.type === "expense"; }).reduce(function (s, i) { return s + i.amountCents; }, 0);
        var totalIncome   = activeItems.filter(function (i) { return i.type === "income"; }).reduce(function (s, i) { return s + i.amountCents; }, 0);
        var overdueCount  = activeItems.filter(function (i) { return i.nextDueDate <= todayStr(); }).length;

        // Filtered list
        var filtered = items.filter(function (i) {
            if (filter === "expense") return i.type === "expense";
            if (filter === "income") return i.type === "income";
            if (filter === "active") return i.isActive;
            if (filter === "paused") return !i.isActive;
            return true;
        }).sort(function (a, b) {
            // Active first, then overdue first, then by next due date
            if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
            if (a.nextDueDate !== b.nextDueDate) return a.nextDueDate < b.nextDueDate ? -1 : 1;
            return 0;
        });

        // Wallet name lookup
        var walletMap = useMemo(function () {
            var map = {};
            (wallets || []).forEach(function (w) { map[w.id] = w.name; });
            return map;
        }, [wallets]);

        var handleAdd = function (rec) {
            window.actions.addRecurringItem({ rec: rec, recurringItems: items, setRecurringItems: setRecurring });
            setShowAddModal(false);
            showToast("Recurring item added!");
        };

        var handleEdit = function (rec) {
            window.actions.editRecurringItem({ id: rec.id, updates: rec, recurringItems: items, setRecurringItems: setRecurring });
            setEditItem(null);
            showToast("Recurring item updated.");
        };

        var handleDelete = function (id) {
            requestConfirm("Delete this recurring item? It won't affect past transactions.", function () {
                window.actions.deleteRecurringItem({ id: id, recurringItems: items, setRecurringItems: setRecurring });
                showToast("Recurring item deleted.");
            });
        };

        var handleToggle = function (id) {
            window.actions.toggleRecurringItem({ id: id, recurringItems: items, setRecurringItems: setRecurring });
        };

        return e('div', null,
            e(PageTitle, { sub: "Auto-log repeating expenses and income." }, "Recurring Transactions"),

            // Summary cards
            e('div', { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 24 } },
                e('div', { style: { ...S.statCard, borderLeft: "3px solid #00E676" } },
                    e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 } }, "Active Items"),
                    e('div', { style: { fontSize: 22, fontWeight: 800, color: "#00E676" } }, activeItems.length),
                    e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 4 } }, items.length + " total")
                ),
                e('div', { style: { ...S.statCard, borderLeft: "3px solid #EF4444" } },
                    e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 } }, "Auto-Expenses / mo"),
                    e('div', { style: { fontSize: 22, fontWeight: 800, color: "#EF4444" } }, fc(totalExpenses)),
                    e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 4 } }, activeItems.filter(function (i) { return i.type === "expense"; }).length + " items")
                ),
                e('div', { style: { ...S.statCard, borderLeft: "3px solid #3B82F6" } },
                    e('div', { style: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 } }, "Auto-Income / mo"),
                    e('div', { style: { fontSize: 22, fontWeight: 800, color: "#3B82F6" } }, fc(totalIncome)),
                    overdueCount > 0 && e('div', { style: { fontSize: 11, color: "#F59E0B", marginTop: 4, fontWeight: 600 } }, overdueCount + " due now")
                )
            ),

            // Action bar
            e('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 } },
                e('div', { style: { display: "flex", gap: 6 } },
                    ["all", "expense", "income", "active", "paused"].map(function (f) {
                        return e('button', {
                            key: f,
                            onClick: function () { setFilter(f); },
                            style: {
                                padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                                cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                                background: filter === f ? "var(--bg-panel)" : "transparent",
                                border: filter === f ? "1px solid var(--border)" : "1px solid transparent",
                                color: filter === f ? "var(--text-main)" : "var(--text-muted)",
                            }
                        }, f === "all" ? "All" : f === "expense" ? "Expenses" : f === "income" ? "Income" : f === "active" ? "Active" : "Paused");
                    })
                ),
                e(Btn, { v: "accent", onClick: function () { setShowAddModal(true); } }, "+ Add Recurring")
            ),

            // Item list
            filtered.length === 0
                ? e(window.EmptyState, { icon: "calendar", title: "No recurring items", sub: "Tap + Add Recurring to auto-track repeating transactions." })
                : filtered.map(function (item) {
                    return e(RecurringCard, {
                        key: item.id,
                        item: item,
                        fc: fc,
                        walletName: walletMap[item.walletId] || null,
                        onEdit: function () { setEditItem(item); },
                        onDelete: function () { handleDelete(item.id); },
                        onToggle: function () { handleToggle(item.id); },
                    });
                }),

            // Modals
            showAddModal && e(RecurringModal, {
                wallets: wallets,
                onSave: handleAdd,
                onClose: function () { setShowAddModal(false); },
            }),
            editItem && e(RecurringModal, {
                item: editItem,
                wallets: wallets,
                onSave: handleEdit,
                onClose: function () { setEditItem(null); },
            })
        );
    }

    window.RecurringView = React.memo(RecurringView);
})();