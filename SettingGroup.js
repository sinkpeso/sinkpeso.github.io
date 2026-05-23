// SettingGroup.js — Reusable settings panel wrapper for SINKPESO
//
// What this renders:
//   A premium-panel card with a small icon + uppercase title in a header row,
//   a divider line, and then whatever children you pass inside.
//
//   ┌─────────────────────────────┐
//   │ 🔒  SECURITY                │  ← icon + title header
//   │─────────────────────────────│  ← divider
//   │  (your content here)        │  ← children
//   └─────────────────────────────┘
//
// This component is DISPLAY ONLY — no useState, no localStorage, no mutations.
//
// Dependencies (must be loaded before this file):
//   - React   (via CDN <script>)
//   - Icon    (global function defined in index.html main <script>)
//
// Props:
//   title     (string)   — section heading, e.g. "Security"
//   icon      (string)   — icon name from the ICONS map, e.g. "lock", "grid"
//   children             — any React elements to render inside the panel
//
// Usage:
//   e(SettingGroup, { title: "Appearance", icon: "grid" },
//       e(Field, { label: "Theme" }, ...)
//   )

(function () {
    const e = React.createElement;

    function SettingGroup({ title, icon, children }) {
        return e('div', { className: "premium-panel", style: { marginBottom: 16 } },
            // Header row: icon + uppercase title + bottom border
            e('div', {
                style: {
                    display: "flex", alignItems: "center", gap: 8,
                    marginBottom: 16, paddingBottom: 12,
                    borderBottom: "1px solid var(--border)"
                }
            },
                e(Icon, { name: icon, size: 14, color: "var(--text-muted)" }),
                e('div', {
                    style: {
                        fontSize: 11, fontWeight: 700,
                        letterSpacing: "0.09em", textTransform: "uppercase",
                        color: "var(--text-muted)"
                    }
                }, title)
            ),
            // Slot for any content
            children
        );
    }

    // Expose globally
    window.SettingGroup = SettingGroup;

})();
