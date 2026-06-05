// components.js — Reusable UI primitives for SINKPESO
// No app state. No business logic. Pure display only.
// Depends on: React (must load before this file), S style tokens (defined in index.html)

(function () {
    const e = React.createElement;

    // ── SECTION LABEL ─────────────────────────────────────────────────────────
    // Small all-caps muted label used above sections
    // Usage: e(SLabel, null, "Income Sources")
    // Usage: e(SLabel, { style: { marginBottom: 12 } }, "This Month")
    function SLabel({ children, style = {} }) {
        return e('div', {
            style: {
                fontSize: 11, fontWeight: 700, letterSpacing: "0.09em",
                textTransform: "uppercase", color: "var(--text-muted)",
                ...style
            }
        }, children);
    }

    // ── PAGE TITLE ────────────────────────────────────────────────────────────
    // Large page heading, with an optional muted subtitle below
    // Usage: e(PageTitle, { sub: "Track your money" }, "Dashboard")
    function PageTitle({ children, sub }) {
        return e('div', { style: { marginBottom: 24 } },
            e('h2', { style: { fontSize: 22, fontWeight: 800, color: "var(--text-main)", lineHeight: 1.15, letterSpacing: "-0.02em" } }, children),
            sub && e('div', { style: { fontSize: 16, color: "var(--text-muted)", marginTop: 4 } }, sub)
        );
    }

    // ── PROGRESS BAR ──────────────────────────────────────────────────────────
    // Horizontal bar filled 0–100% based on pct (0.0 to 1.0)
    // Usage: e(PBar, { pct: 0.65 })
    // Usage: e(PBar, { pct: 0.9, color: "#EF4444" })
    function PBar({ pct, color = "#00E676" }) {
        const v = Math.min(1, Math.max(0, pct));
        return e('div', {
            style: {
                height: 6, background: "var(--border-input)",
                borderRadius: 999, overflow: "hidden", marginTop: 8, marginBottom: 2
            }
        },
            e('div', { style: { height: "100%", background: color, width: `${v * 100}%`, transition: "width 0.4s" } })
        );
    }

    // ── FORM FIELD WRAPPER ────────────────────────────────────────────────────
    // Wraps any input with a small label above it
    // Usage: e(Field, { label: "Amount" }, e(Inp, { type: "number", ... }))
    function Field({ label, children }) {
        return e('div', { style: { marginBottom: 20 } },
            e('div', { style: { fontSize: 12, fontWeight: 600, color: "var(--text-light)", marginBottom: 8, letterSpacing: "0.03em" } }, label),
            children
        );
    }

    // ── STYLED INPUT ──────────────────────────────────────────────────────────
    // Drop-in replacement for <input>. Accepts all normal input props.
    // Usage: e(Inp, { type: "text", placeholder: "Name", value: x, onChange: fn })
    function Inp(p) {
        const num = p.type === "number" ? { inputMode: "decimal", pattern: "[0-9]*" } : {};
        return e('input', {
            ...num, ...p,
            style: {
                background: "var(--bg-input)", color: "var(--text-main)",
                border: "1px solid var(--border-input)", borderRadius: 10,
                padding: "13px 15px", fontSize: 16, width: "100%",
                boxSizing: "border-box", outline: "none",
                transition: "border-color 0.2s", minHeight: 46,
                fontFamily: "inherit",
                ...(p.style || {})
            }
        });
    }

    // ── STYLED SELECT ─────────────────────────────────────────────────────────
    // Drop-in replacement for <select>. Accepts all normal select props.
    // Usage: e(Sel, { value: x, onChange: fn }, e('option', { value: "a" }, "Option A"))
    function Sel({ children, ...p }) {
        return e('select', {
            ...p,
            style: {
                background: "var(--bg-input)", color: "var(--text-main)",
                border: "1px solid var(--border-input)", borderRadius: 10,
                padding: "13px 15px", fontSize: 16, width: "100%",
                boxSizing: "border-box", outline: "none", minHeight: 46,
                fontFamily: "inherit",
                ...(p.style || {})
            }
        }, children);
    }

    // ── BUTTON ────────────────────────────────────────────────────────────────
    // Styled button with 4 visual variants.
    // v="primary"  → blue  (default)
    // v="accent"   → green
    // v="ghost"    → outlined
    // v="danger"   → red tint
    // Usage: e(Btn, { v: "accent", onClick: fn }, "Save")
    // Usage: e(Btn, { v: "ghost", style: { flex: 1 }, onClick: fn }, "Cancel")
    function Btn({ children, v = "primary", style = {}, ...p }) {
        const vs = {
            primary: { background: "#1D4ED8", color: "#FFFFFF" },
            accent:  { background: "#00E676", color: "#020810" },
            ghost:   { background: "transparent", color: "var(--text-main)", border: "1px solid var(--border-input)" },
            danger:  { background: "rgba(239, 68, 68, 0.09)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.18)" }
        };
        return e('button', {
            ...p,
            style: {
                ...vs[v],
                borderRadius: 10, padding: "12px 20px", fontSize: 16,
                fontWeight: 600, cursor: "pointer",
                border: vs[v].border || "none",
                transition: "all 0.15s ease", minHeight: 44,
                lineHeight: 1.2, letterSpacing: "0.01em",
                ...style
            }
        }, children);
    }

    // ── EXPORT PDF BUTTON ─────────────────────────────────────────────────────
    // Premium-gated button that triggers browser print dialog.
    // Usage: e(ExportPDFBtn, { printClass: "print-pera-report" })
    function ExportPDFBtn({ printClass, style = {} }) {
        if (!window.license || !window.license.canUseFeature('pdfExport')) return null;
        return e('button', {
            onClick: function() {
                document.body.classList.add(printClass);
                window.print();
                setTimeout(function() { document.body.classList.remove(printClass); }, 500);
            },
            style: {
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "transparent", color: "var(--text-main)",
                border: "1px solid var(--border-input)",
                borderRadius: 10, padding: "8px 14px",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.15s",
                ...style
            }
        },
            e('svg', { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" },
                e('path', { d: "M6 9V2h12v7" }),
                e('path', { d: "M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" }),
                e('rect', { x: 6, y: 14, width: 12, height: 8 })
            ),
            "Export PDF"
        );
    }

    // ── EXPOSE TO window ──────────────────────────────────────────────────────
    window.components = { SLabel, PageTitle, PBar, Field, Inp, Sel, Btn, ExportPDFBtn };

})();