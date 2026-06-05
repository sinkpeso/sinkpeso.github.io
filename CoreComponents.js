// CoreComponents.js — Extracted inline components from index.html
// VirtualList, DotMenu, WalletPicker, IncomeSourcePicker,
// LicenseInput, QuickAddModal, PinScreen, ErrorBoundary
//
// Depends on: React (global), window.S, window.Z, window.Icon,
//   window.CASH_WALLET_ID, window.WALLET_COLORS, window.CATEGORIES,
//   window.components.{Inp, Sel, Btn, Field}, window.utils.{tc, uid, todayStr},
//   window.finance, window.license, window.walleticons

(function () {
    "use strict";
    const e = React.createElement;
    const { useState, useMemo, useEffect, useRef, useCallback } = React;
    const { tc, uid, todayStr } = window.utils;
    const { Inp, Btn } = window.components;

    // ── VIRTUAL LIST — renders only visible items for performance ────────
    function VirtualList({ items, itemHeight = 60, overscan = 5, renderItem, emptyContent }) {
        const containerRef = useRef(null);
        const [scrollTop, setScrollTop] = useState(0);
        const [containerHeight, setContainerHeight] = useState(600);

        useEffect(() => {
            const el = containerRef.current;
            if (!el) return;
            const observer = new ResizeObserver(entries => {
                setContainerHeight(entries[0].contentRect.height);
            });
            observer.observe(el);
            return () => observer.disconnect();
        }, []);

        const totalHeight = items.length * itemHeight;
        const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        const endIndex = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);
        const visibleItems = items.slice(startIndex, endIndex);

        if (items.length === 0 && emptyContent) return emptyContent;

        return e('div', {
            ref: containerRef,
            onScroll: ev => setScrollTop(ev.target.scrollTop),
            style: { overflow: "auto", position: "relative" }
        },
            e('div', { style: { height: totalHeight, position: "relative" } },
                visibleItems.map((item, i) =>
                    e('div', {
                        key: item.id || startIndex + i,
                        style: { position: "absolute", top: (startIndex + i) * itemHeight, left: 0, right: 0 }
                    }, renderItem(item, startIndex + i))
                )
            )
        );
    }

    // ── DOT MENU ──────────────────────────────────────────────────────────
    function DotMenu({ itemId, openMenu, setOpenMenu, onEdit, onDelete }) {
        const Icon = window.Icon;
        const Z = window.Z || { MENU_BACKDROP: 299, MENU_DROPDOWN: 300 };
        const isOpen = openMenu === itemId;
        const btnRef = useRef(null);
        const [dropdownPos, setDropdownPos] = useState(null);

        useEffect(() => {
            if (isOpen && btnRef.current) {
                const rect = btnRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const dropdownHeight = 100;
                const top = spaceBelow < dropdownHeight + 16
                    ? rect.top - dropdownHeight - 4
                    : rect.bottom + 4;
                setDropdownPos({
                    position: "fixed",
                    top: top,
                    right: window.innerWidth - rect.right,
                    zIndex: Z.MENU_DROPDOWN,
                });
            } else {
                setDropdownPos(null);
            }
        }, [isOpen]);

        return e('div', { style: { position: "relative", flexShrink: 0 } },
            isOpen && e('div', { style: { position: "fixed", inset: 0, zIndex: Z.MENU_BACKDROP }, onClick: (ev) => { ev.stopPropagation(); setOpenMenu(null); } }),
            e('button', { ref: btnRef, className: "dot-menu-btn", onClick: (ev) => { ev.stopPropagation(); setOpenMenu(isOpen ? null : itemId); } }, '⋮'),
            isOpen && dropdownPos && e('div', { className: "dot-menu-dropdown", style: dropdownPos },
                e('button', { className: "dot-menu-item", onClick: (ev) => { ev.stopPropagation(); setOpenMenu(null); onEdit(); } },
                    e('span', { style: { display:"flex", alignItems:"center", gap:8 } }, e(Icon, { name:"edit", size:14 }), "Edit")),
                e('button', { className: "dot-menu-item", style: { color: "#EF4444" }, onClick: (ev) => { ev.stopPropagation(); setOpenMenu(null); onDelete(); } },
                    e('span', { style: { display:"flex", alignItems:"center", gap:8 } }, e(Icon, { name:"trash", size:14, color:"#EF4444" }), "Delete"))
            )
        );
    }

    // ── WALLET PICKER ─────────────────────────────────────────────────────
    function WalletPicker({ wallets, value, onChange }) {
        if (!wallets || wallets.length === 0) return null;
        const { WalletIcon } = window.walleticons;
        return e('div', { style: { display: "flex", flexWrap: "wrap", gap: 8 } },
            wallets.map(w => {
                const selected = value === w.id;
                return e('button', { key: w.id, onClick: () => onChange(w.id), style: {
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px 8px 8px", borderRadius: 10,
                    background: selected ? "rgba(0,230,118,0.10)" : "var(--bg-input)",
                    border: `1px solid ${selected ? "#00E676" : "var(--border-input)"}`,
                    cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
                } },
                    e(WalletIcon, { name: w.name, color: w.color || "#00E676", size: 26, radius: 7 }),
                    e('div', { style: { textAlign: "left" } },
                        e('div', { style: { fontSize: 13, fontWeight: 700, color: selected ? "#00E676" : "var(--text-main)", lineHeight: 1.2 } }, w.name)
                    )
                );
            })
        );
    }

    // ── INCOME SOURCE PICKER ───────────────────────────────────────────────
    function IncomeSourcePicker({ wallets, setWallets, value, onChange, showToast }) {
        const [showCreate, setShowCreate] = useState(false);
        const [newName, setNewName]       = useState("");
        const [newColor, setNewColor]     = useState(window.WALLET_COLORS[1]);

        const handleCreate = () => {
            if (!newName.trim()) return;
            const canAdd = window.license ? window.license.canAddItem("wallets", wallets.length) : (wallets.length < 3);
            if (!canAdd) {
                setShowCreate(false);
                setNewName("");
                if (showToast) showToast("Free limit reached (3 wallets). Upgrade to Premium for unlimited.");
                return;
            }
            const w = { id: uid(), name: newName.trim(), openingBalanceCents: 0, color: newColor };
            setWallets(prev => [...prev, w]);
            onChange(w.id);
            setNewName(""); setShowCreate(false);
        };

        const safeWallets = (wallets || []);
        const { WalletIcon } = window.walleticons;

        return e('div', { style: { marginBottom: 8 } },
            e('div', { style: { fontSize: 12, fontWeight: 600, color: "var(--text-light)", marginBottom: 8, letterSpacing: "0.03em" } }, "Receiving Source"),
            e('div', { style: { display: "flex", flexWrap: "wrap", gap: 8 } },
                safeWallets.map(w => e('button', { key: w.id, onClick: () => onChange(w.id), style: {
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px 8px 8px", borderRadius: 10,
                    background: value === w.id ? "rgba(0,230,118,0.12)" : "var(--bg-input)",
                    border: `1px solid ${value === w.id ? "#00E676" : "var(--border-input)"}`,
                    color: value === w.id ? "#00E676" : "var(--text-main)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s"
                } },
                    e(WalletIcon, { name: w.name, color: w.color || "#00E676", size: 24, radius: 7 }),
                    w.name
                )),
                (window.license ? window.license.canAddItem("wallets", safeWallets.length) : safeWallets.length < 3) &&
                e('button', { onClick: () => setShowCreate(!showCreate), style: {
                    padding: "8px 14px", borderRadius: 10,
                    background: "transparent",
                    border: "1px dashed var(--border-input)",
                    color: showCreate ? "var(--text-muted)" : "var(--text-light)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer"
                } }, showCreate ? "✕ Cancel" : "+ New Source")
            ),
            showCreate && e('div', { style: {
                marginTop: 10, padding: "12px 14px", borderRadius: 10,
                background: "var(--bg-input)", border: "1px solid var(--border-input)",
                display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap"
            } },
                e(Inp, { autoFocus: true, placeholder: "e.g. GCash, BPI, Maya", value: newName,
                    onChange: ev => setNewName(ev.target.value),
                    onKeyDown: ev => ev.key === "Enter" && handleCreate(),
                    style: { flex: 1, minWidth: 140, marginBottom: 0 }
                }),
                e('div', { style: { display: "flex", gap: 4, flexShrink: 0 } },
                    window.WALLET_COLORS.slice(0, 6).map(c => e('button', { key: c, onClick: () => setNewColor(c), style: {
                        width: 20, height: 20, borderRadius: "50%", background: c, padding: 0, cursor: "pointer",
                        border: newColor === c ? "2px solid var(--text-main)" : "2px solid transparent"
                    } }))
                ),
                e(Btn, { v: "accent", style: { padding: "10px 16px", fontSize: 12, flexShrink: 0 }, onClick: handleCreate }, "Add")
            )
        );
    }

    // ── LICENSE INPUT ──────────────────────────────────────────────────────
    function LicenseInput({ showToast }) {
        const Icon = window.Icon;
        const [key, setKey] = useState("");
        const [error, setError] = useState("");

        const handleActivate = () => {
            setError("");
            if (!key.trim()) { setError("Please enter a license key."); return; }
            var result = window.license.activate(key);
            if (result.ok) {
                showToast(" Premium activated!");
                setTimeout(() => window.location.reload(), 1000);
            } else {
                setError(result.message);
            }
        };

        return e('div', null,
            e('div', { style: { marginBottom: 12 } },
                e(Inp, {
                    placeholder: "SINKPESO-XXXX-XXXX-XXXX",
                    value: key,
                    onChange: ev => { setKey(ev.target.value); setError(""); },
                    onKeyDown: ev => ev.key === "Enter" && handleActivate(),
                    style: { marginBottom: 0, fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }
                })
            ),
            error && e('div', { style: { color: "#EF4444", fontSize: 12, marginBottom: 12, fontWeight: 600 } }, error),
            e(Btn, { v: "accent", style: { width: "100%" }, onClick: handleActivate }, "Activate Premium"),
            e('div', { style: { marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" } },
                e('div', { style: { fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.05em" } }, "PREMIUM INCLUDES"),
                ["Unlimited wallets & vaults", "Encrypted backups", "Recurring expenses", "PDF reports", "Multi-currency display"].map(f =>
                    e('div', { key: f, style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)", marginBottom: 6 } },
                        e(Icon, { name: "shield", size: 12, color: "var(--text-muted)" }),
                        f
                    )
                )
            )
        );
    }

    // ── UPGRADE PROMPT MODAL ─────────────────────────────────────────────
    function UpgradePromptModal({ message, onClose }) {
        const Icon = window.Icon;
        React.useEffect(() => {
            var handler = function(ev) { if (ev.key === "Escape") onClose(); };
            window.addEventListener("keydown", handler);
            return function() { window.removeEventListener("keydown", handler); };
        }, [onClose]);

        return e('div', {
            className: "modal-overlay",
            onClick: onClose,
            style: { zIndex: 9999 }
        },
            e('div', {
                onClick: function(ev) { ev.stopPropagation(); },
                style: {
                    background: "var(--bg-panel)", borderRadius: 18,
                    padding: "28px 24px", maxWidth: 360, width: "100%",
                    border: "1px solid var(--border)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                    textAlign: "center"
                }
            },
                // Feature badge
                e('div', { style: {
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.25)",
                    borderRadius: 8, padding: "6px 14px", marginBottom: 16
                } },
                    e(Icon, { name: "shield", size: 14, color: "#00E676" }),
                    e('span', { style: { fontSize: 12, fontWeight: 700, color: "#00E676", textTransform: "uppercase", letterSpacing: "0.06em" } }, "Premium Feature")
                ),
                // Message
                e('div', { style: {
                    fontSize: 15, fontWeight: 600, color: "var(--text-main)",
                    lineHeight: 1.5, marginBottom: 24
                } }, message),
                // Buttons
                e('div', { style: { display: "flex", flexDirection: "column", gap: 8 } },
                    e('a', {
                        href: "premium.html",
                        style: {
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            padding: "12px 20px",
                            background: "#00E676", color: "#020810",
                            borderRadius: 10, fontSize: 14, fontWeight: 700,
                            textDecoration: "none", textAlign: "center",
                            transition: "all 0.15s"
                        }
                    }, "Upgrade — ₱250"),
                    e('button', {
                        onClick: onClose,
                        style: {
                            padding: "10px 20px",
                            background: "transparent", border: "1px solid var(--border)",
                            borderRadius: 10, fontSize: 13, fontWeight: 600,
                            color: "var(--text-muted)", cursor: "pointer",
                            fontFamily: "inherit", transition: "all 0.15s"
                        }
                    }, "Not now")
                )
            )
        );
    }

    // ── QUICK ADD MODAL ────────────────────────────────────────────────────
    function QuickAddModal({ onSave, onClose, wallets, setWallets, fc }) {
        const Icon = window.Icon;
        const S = window.S || {};
        const CASH_WALLET_ID = window.CASH_WALLET_ID || "sp-cash";
        const CATEGORIES = window.CATEGORIES || ["Food","Gas","Bills","Business","Personal","Savings"];
        const [amount, setAmount] = useState("");
        const [category, setCategory] = useState("Food");
        const [note, setNote] = useState("");
        const [walletId, setWalletId] = useState(wallets.length > 0 ? (wallets.find(w => w.id === CASH_WALLET_ID) ? CASH_WALLET_ID : wallets[0].id) : "");
        const [pendingExpense, setPendingExpense] = useState(null);
        const catIcons = { Food: "utensils", Gas: "car", Bills: "receipt", Business: "briefcase", Personal: "shoppingbag", Savings: "landmark" };

        const selectedWallet = wallets.find(w => w.id === walletId);
        const isWalletEmpty = selectedWallet && (selectedWallet.balanceCents || 0) === 0;

        const commitSave = (amtCents, override) => {
            const selWallet = wallets.find(w => w.id === walletId);
            onSave({ id: uid(), name: note.trim() || category, amountCents: amtCents, category, date: todayStr(), walletId: walletId || null, walletNameSnapshot: selWallet ? selWallet.name : null });
            window.finance.processFinancialTransaction({ type: "expense", walletId, amountCents: amtCents, wallets, setWallets });
        };
        const handle = () => {
            if (!amount || Number(amount) <= 0) return;
            const amtCents = tc(amount);
            const selWallet = wallets.find(w => w.id === walletId);
            if (selWallet && (selWallet.balanceCents || 0) < amtCents) {
                setPendingExpense({ amtCents, selWallet });
                return;
            }
            commitSave(amtCents, false);
        };

        const InsufficientBalanceModal = window.InsufficientBalanceModal || function() { return null; };

        return e('div', { className: "modal-overlay", onClick: onClose },
            e('div', { className: "modal-container", style: { maxWidth: 400 }, onClick: ev => ev.stopPropagation() },
                e('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 } },
                    e('div', { style: { fontSize: 16, fontWeight: 800, color: "var(--text-main)" } }, "Quick Add Expense"),
                    e('button', { onClick: onClose, style: S.closeBtn || {} }, e(Icon, { name: "x", size: 16 }))
                ),
                e('input', { className: "quick-add-amount", type: "number", inputMode: "decimal", pattern: "[0-9]*", placeholder: "0.00", autoFocus: true, value: amount, onChange: ev => setAmount(ev.target.value), onKeyDown: ev => ev.key === 'Enter' && handle() }),
                e('div', { className: "cat-grid" },
                    CATEGORIES.map(c => e('button', { key: c, className: "cat-btn" + (category === c ? " selected" : ""), onClick: () => setCategory(c) },
                        e('div', { style: { marginBottom: 3, opacity: 0.8 } }, e(Icon, { name: catIcons[c] || "target", size: 18 })),
                        c
                    ))
                ),
                e(Inp, { placeholder: "Note (optional)", value: note, onChange: ev => setNote(ev.target.value), style: { marginBottom: 12 } }),
                e(WalletPicker, { wallets, value: walletId, onChange: setWalletId }),
                isWalletEmpty && e('div', { style: { fontSize: 12, color: "#F59E0B", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "8px 12px", marginTop: 10, display: "flex", alignItems: "center", gap: 6 } },
                    e(Icon, { name: "arrowupdown", size: 12, color: "#F59E0B" }),
                    "Wallet is empty — add income or fund this wallet first."
                ),
                e(Btn, { v: "accent", style: { width: "100%", fontSize: 15, marginTop: 16 }, onClick: handle, disabled: wallets.length === 0 }, wallets.length === 0 ? "Add a Wallet First" : "Save Expense"),
                pendingExpense && e(InsufficientBalanceModal, { wallet: pendingExpense.selWallet, expenseAmount: pendingExpense.amtCents, fc, onCancel: () => setPendingExpense(null), onForce: () => { setPendingExpense(null); commitSave(pendingExpense.amtCents, true); } })
            )
        );
    }

    // ── PIN SCREEN ──────────────────────────────────────────────────────────
    function PinScreen({ targetPin, onUnlock }) {
        const [input, setInput] = useState("");
        const [error, setError] = useState(false);
        const [attempts, setAttempts] = useState(0);
        const [lockedUntil, setLockedUntil] = useState(0);
        const [lockMsg, setLockMsg] = useState("");

        const isLocked = Date.now() < lockedUntil;

        const handleAttempt = () => {
            if (isLocked) return;
            if (input.length < 4) { setError(true); setTimeout(() => setError(false), 1000); return; }

            const onSuccess = () => onUnlock();
            const onFail = () => {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                setError(true); setInput("");
                setTimeout(() => setError(false), 1000);
                if (newAttempts >= 5) {
                    const delay = Math.min(30000, 1000 * Math.pow(2, newAttempts - 5));
                    setLockedUntil(Date.now() + delay);
                    setLockMsg(`Too many attempts. Wait ${Math.ceil(delay / 1000)}s.`);
                    setTimeout(() => { setLockMsg(""); }, delay);
                }
            };

            var isHashed = /^[0-9a-f]{64}$/.test(targetPin);
            if (isHashed) {
                window.hashPin(input).then(function (hashed) {
                    if (hashed === targetPin) onSuccess();
                    else onFail();
                });
            } else {
                if (input === targetPin) onSuccess();
                else onFail();
            }
        };

        return e('div', { className: "pin-screen" },
            e('img', {
                src: "logosinkpeso.png",
                alt: "SINKPESO Logo",
                style: { width: 96, height: 96, objectFit: "contain", marginBottom: 20, borderRadius: 22, boxShadow: "0 8px 32px rgba(0,230,118,0.18)" }
            }),
            e('h1', { style: { marginBottom: 6, color: "#00E676", fontSize: 28, fontWeight: 900, letterSpacing: "0.06em" } }, "SINKPESO"),
            e('p', { style: { color: "var(--text-muted)", marginBottom: 32, fontSize: 13, letterSpacing: "0.01em" } }, "Private. Offline. Yours."),
            e('input', { 
                type: "password", inputMode: "numeric", pattern: "[0-9]*", className: "pin-input", value: input, autoFocus: true,
                onChange: ev => setInput(ev.target.value.replace(/[^0-9]/g, '')),
                onKeyDown: ev => ev.key === 'Enter' && handleAttempt(),
                style: { borderColor: error ? "#EF4444" : "var(--border-input)", animation: error ? "shake 0.4s" : "none" }
            }),
            lockMsg && e('div', { style: { color: "#EF4444", fontSize: 12, marginBottom: 8, fontWeight: 600 } }, lockMsg),
            e('button', {
                onClick: handleAttempt,
                disabled: isLocked,
                style: {
                    marginTop: 16, width: 240, minHeight: 44,
                    background: "transparent",
                    border: `1px solid ${isLocked ? "rgba(255,255,255,0.1)" : "rgba(0,230,118,0.4)"}`,
                    color: isLocked ? "var(--text-muted)" : "#00E676",
                    borderRadius: 10, fontSize: 13, fontWeight: 700,
                    cursor: isLocked ? "not-allowed" : "pointer", letterSpacing: "0.04em",
                    transition: "background 0.18s, border-color 0.18s",
                    fontFamily: "inherit", display: "inline-flex",
                    alignItems: "center", justifyContent: "center",
                },
                className: "pin-unlock-btn",
            }, isLocked ? "Locked" : "Unlock App"),
            e('div', { style: { position: "absolute", bottom: 32, left: 0, right: 0, textAlign: "center" } },
                e('div', { style: { fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", color: "var(--text-muted)", textTransform: "uppercase", opacity: 0.5 } }, "LODOY GOES RANDOM")
            )
        );
    }

    // ── ERROR BOUNDARY ────────────────────────────────────────────────────
    class ErrorBoundary extends React.Component {
        constructor(props) { super(props); this.state = { hasError: false, error: null }; }
        static getDerivedStateFromError(error) { return { hasError: true, error }; }
        componentDidCatch(error, info) { console.error("SINKPESO crash:", error, info); }
        render() {
            if (this.state.hasError) {
                return e('div', { style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24, fontFamily: "Inter, sans-serif" } },
                    e('div', { style: { fontSize: 32, marginBottom: 16, opacity: 0.5 } }, e(window.Icon || function() { return null; }, { name: "target", size: 48, color: "#EF4444" })),
                    e('h2', { style: { color: "#EF4444", marginBottom: 8, fontWeight: 800 } }, "Something went wrong"),
                    e('p', { style: { color: "#64748B", marginBottom: 24, textAlign: "center", maxWidth: 360 } }, "Your data is safe in localStorage. Try reloading the page."),
                    e('button', { onClick: () => window.location.reload(), style: { background: "#2563EB", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" } }, "Reload App")
                );
            }
            return this.props.children;
        }
    }

    // ── EXPOSE ─────────────────────────────────────────────────────────────
    window.VirtualList = VirtualList;
    window.DotMenu = DotMenu;
    window.WalletPicker = WalletPicker;
    window.IncomeSourcePicker = IncomeSourcePicker;
    window.LicenseInput = LicenseInput;
    window.UpgradePromptModal = UpgradePromptModal;
    window.QuickAddModal = QuickAddModal;
    window.PinScreen = PinScreen;
    window.ErrorBoundary = ErrorBoundary;

})();