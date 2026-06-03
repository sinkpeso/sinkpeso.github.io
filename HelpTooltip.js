// HelpTooltip.js — Inline help tooltips for SINKPESO
//
// Small "?" icon that shows explanatory text on tap/click.
// Used next to feature labels to self-document the UI.
//
// Dependencies: React (global)

(function () {
    "use strict";
    const e = React.createElement;

    function HelpTooltip({ text, style: extraStyle }) {
        const [open, setOpen] = React.useState(false);
        const [pos, setPos] = React.useState(null);
        const btnRef = React.useRef(null);
        const wrapRef = React.useRef(null);

        React.useEffect(() => {
            if (!open) { setPos(null); return; }
            if (btnRef.current) {
                const rect = btnRef.current.getBoundingClientRect();
                setPos({
                    position: "fixed",
                    top: rect.top - 8,
                    left: rect.left + rect.width / 2,
                    transform: "translate(-50%, -100%)",
                    zIndex: 350
                });
            }
            const handler = (ev) => {
                if (wrapRef.current && !wrapRef.current.contains(ev.target)) setOpen(false);
            };
            document.addEventListener("click", handler);
            return () => document.removeEventListener("click", handler);
        }, [open]);

        return e('span', { ref: wrapRef, style: { position: "relative", display: "inline-flex", alignItems: "center", ...(extraStyle || {}) } },
            e('button', {
                ref: btnRef,
                onClick: (ev) => { ev.stopPropagation(); setOpen(!open); },
                "aria-label": "Help",
                style: {
                    background: "transparent", border: "1px solid var(--border-input)",
                    color: "var(--text-muted)", width: 20, height: 20, borderRadius: "50%",
                    fontSize: 11, fontWeight: 700, cursor: "pointer", display: "inline-flex",
                    alignItems: "center", justifyContent: "center", padding: 0, lineHeight: 1,
                    fontFamily: "inherit", flexShrink: 0
                }
            }, "?"),
            open && pos && e('div', {
                style: {
                    ...pos, background: "var(--bg-panel)",
                    border: "1px solid var(--border)", borderRadius: 12,
                    padding: "10px 14px", fontSize: 12, fontWeight: 500,
                    color: "var(--text-light)", lineHeight: 1.6,
                    whiteSpace: "normal", width: 220,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    pointerEvents: "auto"
                }
            },
                text,
                e('div', { style: {
                    position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%) rotate(45deg)",
                    width: 10, height: 10, background: "var(--bg-panel)",
                    borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)"
                } })
            )
        );
    }

    window.HelpTooltip = HelpTooltip;
})();