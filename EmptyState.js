// EmptyState.js — Reusable empty-state display for SINKPESO
//
// What this renders:
//   A centred column with a faded icon, a bold title, and a short subtitle.
//   Used whenever a list has no items yet.
//
// This component is DISPLAY ONLY — no useState, no localStorage, no mutations.
//
// Dependencies (must be loaded before this file):
//   - React          (via CDN <script>)
//   - Icon           (global function defined in index.html main <script>)
//
// Props:
//   icon   (string)  — icon name from the ICONS map, e.g. "wallet", "receipt"
//   title  (string)  — bold heading, e.g. "No wallets yet"
//   sub    (string)  — muted subtitle, e.g. "Add Cash, GCash, Maya…"
//
// Basic usage:
//   e(EmptyState, { icon: "wallet", title: "No wallets yet", sub: "Add one to get started." })
//
// Usage already wrapped in a panel (most common):
//   e('div', { className: "premium-panel" },
//       e(EmptyState, { icon: "receipt", title: "No bills yet", sub: "Track rent, utilities…" })
//   )

(function () {
    const e = React.createElement;

    function EmptyState({ icon, title, sub }) {
        return e('div', { className: "empty-state" },
            e('div', { className: "empty-state-icon" },
                e(Icon, { name: icon, size: 30, color: "var(--text-muted)" })
            ),
            e('div', { className: "empty-state-title" }, title),
            e('div', { className: "empty-state-sub" },  sub)
        );
    }

    // Expose globally
    window.EmptyState = EmptyState;

    if (window.PropTypes) {
        EmptyState.propTypes = {
            icon: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
            sub: PropTypes.string,
        };
    }

})();
