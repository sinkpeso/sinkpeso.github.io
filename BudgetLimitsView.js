// BudgetLimitsView.js — Budget category limits for SINKPESO
//
// Dependencies: React (global), Icon (global), utils.js, selectors.js,
//   window.components.{Field, Inp, Sel, Btn, SLabel, PageTitle},
//   DotMenu, CATEGORIES, S (globals from index.html)

(function () {
    "use strict";
    const e = React.createElement;
    const { tc, uid } = window.utils;
    const { Field, Inp, Sel, Btn, SLabel, PageTitle } = window.components;

    function BudgetLimitsView({ budgets, setBudgets, fc, requestConfirm, showToast }) {
        const [category, setCategory] = React.useState("Food");
        const [limitAmt, setLimitAmt] = React.useState("");
        const [openMenu, setOpenMenu] = React.useState(null);
        const [editBudget, setEditBudget] = React.useState(null);
        const [editForm, setEditForm] = React.useState({ category: "Food", limit: "" });

        const openEditBudget = (b) => { setEditBudget(b); setEditForm({ category: b.category, limit: String((b.limitCents / 100).toFixed(2)) }); };
        const saveEditBudget = () => {
            if (!editForm.limit) return;
            setBudgets(budgets.map(b => b.id === editBudget.id ? { ...b, category: editForm.category, limitCents: tc(editForm.limit) } : b));
            setEditBudget(null);
        };
        const deleteBudget = (id) => { requestConfirm("Delete this budget limit?", () => setBudgets(budgets.filter(b => b.id !== id))); };

        return e('div', null,
            e(PageTitle, null, 'Budget Category Limits'),
            e('div', { className: "premium-panel", style: { marginBottom: 24 } },
                e(SLabel, { style: { marginBottom: 16 } }, "Set New Category Limit"),
                e('div', { className: "tf" },
                    e('div', { style: { width: 200 } }, e(Sel, { value: category, onChange: ev => setCategory(ev.target.value) }, CATEGORIES.map(c => e('option', { key: c, value: c }, c)))),
                    e('div', { style: { flex: 1 } }, e(Inp, { type: "number", value: limitAmt, placeholder: "Limit Amount", onChange: ev => setLimitAmt(ev.target.value) })),
                    e(Btn, { v: "accent", onClick: () => {
                        if (!limitAmt) return;
                        if (tc(limitAmt) <= 0) { showToast("Amount must be greater than zero."); return; }
                        const existing = budgets.find(b => b.category === category);
                        if (existing) setBudgets(budgets.map(b => b.id === existing.id ? { ...b, limitCents: tc(limitAmt) } : b));
                        else setBudgets([...budgets, { id: uid(), category, limitCents: tc(limitAmt) }]);
                        setLimitAmt("");
                        showToast(" Budget limit saved!");
                    } }, "Save Limit")
                )
            ),
            e('div', { className: "premium-panel" },
                budgets.length === 0 ? e('div', { style: { color: "var(--text-muted)", fontSize: 13, padding: "14px 0" } }, e("div", { className: "empty-state" }, e("div", { className: "empty-state-icon" }, e(Icon, { name: "target", size: 28, color: "var(--text-muted)" })), e("div", { className: "empty-state-title" }, "No limits set"), e("div", { className: "empty-state-sub" }, "Set monthly caps to keep spending in check."))) :
                budgets.map(b => e('div', { key: b.id, className: "stream-row" },
                    e('div', null, e('div', { style: { fontWeight: 600, color: "var(--text-main)" } }, b.category), e('div', { style: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 } }, "Monthly Limit")),
                    e('div', { style: S.row10 },
                        e('div', { style: { fontWeight: 700, color: "var(--text-main)" } }, fc(b.limitCents)),
                        e(DotMenu, { itemId: b.id, openMenu, setOpenMenu, onEdit: () => openEditBudget(b), onDelete: () => deleteBudget(b.id) })
                    )
                ))
            ),
            editBudget && e('div', { className: "modal-overlay" }, e('div', { className: "modal-container" },
                e('h3', { style: { fontSize: 18, fontWeight: 800, marginBottom: 20 } }, "Edit Limit"),
                e(Field, { label: "Category" }, e(Sel, { value: editForm.category, onChange: ev => setEditForm({ ...editForm, category: ev.target.value }) }, CATEGORIES.map(c => e('option', { key: c, value: c }, c)))),
                e(Field, { label: "Amount" }, e(Inp, { type: "number", value: editForm.limit, onChange: ev => setEditForm({ ...editForm, limit: ev.target.value }) })),
                e('div', { style: S.formFooter }, e(Btn, { v: "ghost", style: { flex: 1 }, onClick: () => setEditBudget(null) }, "Cancel"), e(Btn, { v: "accent", style: { flex: 1 }, onClick: saveEditBudget }, "Save"))
            ))
        );
    }

    window.BudgetLimitsView = React.memo(BudgetLimitsView);
})();