// components.js — Reusable UI primitives for SINKPESO
// No app state. No business logic. Pure display only.
// Depends on: React (must load before this file), S style tokens (defined in index.html)

(function () {
    const e = React.createElement;

    // ── SECTION LABEL ─────────────────────────────────────────────────────────
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
    function PageTitle({ children, sub }) {
        return e('div', { style: { marginBottom: 24 } },
            e('h2', { style: { fontSize: 22, fontWeight: 800, color: "var(--text-main)", lineHeight: 1.15, letterSpacing: "-0.02em" } }, children),
            sub && e('div', { style: { fontSize: 16, color: "var(--text-muted)", marginTop: 4 } }, sub)
        );
    }

    // ── PROGRESS BAR ──────────────────────────────────────────────────────────
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
    function Field({ label, children }) {
        return e('div', { style: { marginBottom: 20 } },
            e('div', { style: { fontSize: 12, fontWeight: 600, color: "var(--text-light)", marginBottom: 8, letterSpacing: "0.03em" } }, label),
            children
        );
    }

    // ── STYLED INPUT ──────────────────────────────────────────────────────────
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

    // ── GENERATE PRINTABLE REPORT ─────────────────────────────────────────────
    // Builds a standalone HTML report from the active tab panel and downloads it.
    // Works on desktop, mobile browser, and PWA — no window.print() dependency.
    function generatePrintableReport() {
        var panel = document.querySelector('[role="tabpanel"]');
        if (!panel) return;

        var now = new Date();
        var dateStr = now.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
        var timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
        var filename = 'SINKPESO_Report_' + now.toISOString().slice(0, 10) + '.html';

        // Clone the panel content
        var clone = panel.cloneNode(true);

        // Strip non-content elements from clone (buttons, navs, filters)
        clone.querySelectorAll('button, nav, [role="navigation"], .bento-filter, .bento-filter-row, .filter-row').forEach(function(el) {
            el.remove();
        });

        // Force inline light-theme styles on all elements in the clone
        var darkBgColors = ['#0b0b14', '#0f0f1c', '#020810', '#0a0e1a', '#0d0d1a', '#080810'];
        var lightTextColors = ['#f1f5f9', '#ffffff', '#94a3b8', '#94a3B8'];
        function fixNode(el) {
            if (el.nodeType !== 1) return;
            var s = el.style;
            // Fix backgrounds
            var bg = (s.backgroundColor || '').toLowerCase();
            for (var i = 0; i < darkBgColors.length; i++) {
                if (bg.indexOf(darkBgColors[i]) >= 0) { s.backgroundColor = '#ffffff'; break; }
            }
            // Remove text shadow
            s.textShadow = 'none';
            // Fix text colors
            var c = (s.color || '').toLowerCase();
            for (var j = 0; j < lightTextColors.length; j++) {
                if (c.indexOf(lightTextColors[j]) >= 0) { s.color = '#1a1a1a'; break; }
            }
            // Recurse
            for (var k = 0; k < el.children.length; k++) fixNode(el.children[k]);
        }
        fixNode(clone);

        // Build standalone HTML document
        var html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
            '<meta charset="UTF-8">\n' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
            '<title>SINKPESO Report — ' + dateStr + '</title>\n' +
            '<style>\n' +
            '  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; color: #1a1a1a; margin: 0; padding: 24px; max-width: 800px; margin-left: auto; margin-right: auto; }\n' +
            '  * { text-shadow: none !important; box-shadow: none !important; }\n' +
            '  .bn-cell, .premium-panel, .bento-txn-list { background: #fff !important; border: 1px solid #e0e0e0 !important; }\n' +
            '  .bn-balance, .bn-ring, .bn-wallet, .bn-expenses, .bn-bills, .bn-categories, .bn-unpaid { background: #fff !important; }\n' +
            '  .bn-orb { display: none !important; }\n' +
            '  @media print { body { padding: 0; } @page { margin: 1.5cm; size: A4 portrait; } }\n' +
            '</style>\n</head>\n<body>\n' +
            '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;padding-bottom:10px;border-bottom:2px solid #00E676">' +
            '<span style="font-size:22px;font-weight:900;color:#00E676;letter-spacing:0.04em">SINKPESO</span>' +
            '<span style="font-size:12px;color:#888;font-weight:600">by Lodoy Goes Random</span></div>\n' +
            '<div style="font-size:11px;color:#999;margin-bottom:20px">Generated on ' + dateStr + ' at ' + timeStr + ' · Private · Offline · Yours</div>\n' +
            clone.innerHTML + '\n</body>\n</html>';

        // Download as file
        var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
    }

    // Expose for use in app.html header button
    window.generatePrintableReport = generatePrintableReport;

    // ── EXPORT PDF BUTTON ─────────────────────────────────────────────────────
    // Premium-gated button that downloads a printable HTML report.
    // Usage: e(ExportPDFBtn, { style: {...} })
    function ExportPDFBtn({ style = {} }) {
        if (!window.license || !window.license.canUseFeature('pdfExport')) return null;
        return e('button', {
            onClick: generatePrintableReport,
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