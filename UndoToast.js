// UndoToast.js — Toast notification with undo action for SINKPESO
//
// Replaces the simple string toast with a component that supports
// an "Undo" button within a time window (default 5 seconds).
//
// Usage in App:
//   const [toastState, setToastState] = useState(null);
//   const showToast = (msg, undoFn, duration) => setToastState({ msg, undoFn, duration });
//   // render: toastState && e(UndoToast, { ...toastState, onDismiss: () => setToastState(null) })

(function () {
    "use strict";
    const e = React.createElement;

    function UndoToast({ msg, undoFn, duration = 5000, onDismiss }) {
        const [timeLeft, setTimeLeft] = React.useState(duration);
        const dismissed = React.useRef(false);

        React.useEffect(() => {
            const start = Date.now();
            const interval = setInterval(() => {
                const elapsed = Date.now() - start;
                const remaining = duration - elapsed;
                if (remaining <= 0) {
                    clearInterval(interval);
                    if (!dismissed.current) onDismiss();
                } else {
                    setTimeLeft(remaining);
                }
            }, 100);
            return () => clearInterval(interval);
        }, [duration, onDismiss]);

        const handleUndo = () => {
            dismissed.current = true;
            if (undoFn) undoFn();
            onDismiss();
        };

        const pct = Math.round((timeLeft / duration) * 100);

        return e('div', {
            className: "toast",
            style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" },
            role: "alert",
            "aria-live": "polite"
        },
            e('span', { style: { flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text-main)" } }, msg),
            undoFn && e('button', {
                onClick: handleUndo,
                "aria-label": "Undo action",
                style: {
                    background: "rgba(0,230,118,0.15)",
                    border: "1px solid rgba(0,230,118,0.3)",
                    color: "#00E676",
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap",
                    flexShrink: 0
                }
            }, "Undo"),
            // Timer bar
            e('div', {
                style: {
                    position: "absolute",
                    bottom: 0, left: 0,
                    height: 2,
                    width: pct + "%",
                    background: "#00E676",
                    transition: "width 0.1s linear",
                    borderRadius: "0 0 8px 8px"
                }
            })
        );
    }

    window.UndoToast = UndoToast;
})();