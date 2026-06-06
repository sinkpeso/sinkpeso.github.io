// PhotoDiaryView.js — Photo Diary module for SINKPESO
//
// Self-contained component with its own image compression utility.
// Dependencies: React (global), Icon (global from index.html),
//   window.finance, window.utils.{tc, uid, todayStr},
//   window.components.{Field, Inp, Btn}, CATEGORIES, CASH_WALLET_ID (global from constants.js)

(function () {
    "use strict";
    const e = React.createElement;
    const { tc, uid, todayStr } = window.utils;
    const { Field, Inp, Btn } = window.components;

    // ── IMAGE COMPRESSION ────────────────────────────────────────────────
    // Resizes to max 900px and converts to JPEG @72% quality (~30-80KB output)
    function compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = (ev) => {
                const img = new Image();
                img.onerror = reject;
                img.onload = () => {
                    const MAX = 900;
                    const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
                    const w = Math.round(img.width * ratio);
                    const h = Math.round(img.height * ratio);
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.72));
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // ── WALLET PICKER (inline, lightweight) ──────────────────────────────
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

    // ── PHOTO DIARY VIEW ─────────────────────────────────────────────────
    const S = window.SINKPESO_S;

    function PhotoDiaryView({
        photoDiary, setPhotoDiary, dailyExpenses, setDailyExpenses,
        wallets, setWallets, fc, showToast, requestConfirm
    }) {
        const [showAdd,      setShowAdd]      = React.useState(false);
        const [preview,      setPreview]      = React.useState(null);
        const [compressing,  setCompressing]  = React.useState(false);
        const [viewEntry,    setViewEntry]     = React.useState(null);
        const [form, setForm] = React.useState({
            amountRaw: "", name: "", note: "",
            category: "Food", walletId: wallets.find(w => w.id === window.SINKPESO_CONSTANTS.CASH_WALLET_ID)?.id || (wallets[0]?.id || "")
        });

        const catIcons = { Food:"utensils", Gas:"car", Bills:"receipt", Business:"briefcase", Personal:"shoppingbag", Savings:"landmark" };

        const resetForm = () => {
            setForm({ amountRaw: "", name: "", note: "", category: "Food", walletId: wallets.find(w => w.id === window.SINKPESO_CONSTANTS.CASH_WALLET_ID)?.id || (wallets[0]?.id || "") });
            setPreview(null); setShowAdd(false);
        };

        const handlePickImage = async (ev) => {
            const file = ev.target.files[0];
            if (!file) return;
            setCompressing(true);
            try {
                const compressed = await compressImage(file);
                setPreview(compressed);
            } catch { showToast("Could not load image. Try another."); }
            finally { setCompressing(false); }
        };

        const [showUpgrade, setShowUpgrade] = React.useState(false);

        // Count this month's photo diary entries for free tier limit
        const thisMonth = todayStr().slice(0, 7); // "YYYY-MM"
        const monthlyPhotoCount = (photoDiary || []).filter(p => p.date && p.date.startsWith(thisMonth)).length;
        const canAddPhoto = !window.license || window.license.canAddItem('photoDiary', monthlyPhotoCount);

        const handleSave = () => {
            if (!canAddPhoto) {
                setShowUpgrade(true);
                return;
            }
            if (!preview) { showToast("Take a photo or picture first"); return; }

            const amtCents = tc(form.amountRaw || "0");
            if (amtCents <= 0) { showToast("Enter an amount first."); return; }

            const walletCheck = window.finance.validateExpenseWalletBalance(wallets, form.walletId, amtCents);
            if (!walletCheck.ok) { showToast(walletCheck.error || "Wallet is empty — add income or fund first"); return; }

            const id = uid();
            const expId = uid();
            const today = todayStr();
            const expense = { id: expId, name: form.name.trim() || form.category, amountCents: amtCents, category: form.category, date: today, walletId: form.walletId || null, fromDiary: true };
            const entry  = { id, expenseId: expId, imageData: preview, amountCents: amtCents, name: expense.name, category: form.category, date: today, note: form.note.trim(), walletId: form.walletId || null };
            setDailyExpenses(prev => [expense, ...prev]);
            setPhotoDiary(prev => [entry, ...prev]);
            window.finance.processFinancialTransaction({ type: "expense", walletId: form.walletId, amountCents: amtCents, wallets, setWallets });
            resetForm();
            showToast(" Photo expense saved!");
        };

        const handleDelete = (entry) => {
            setPhotoDiary(prev => prev.filter(x => x.id !== entry.id));
            setDailyExpenses(prev => prev.filter(x => x.id !== entry.expenseId));
            window.finance.processFinancialTransaction({ type: "expense_delete", walletId: entry.walletId, amountCents: entry.amountCents, wallets, setWallets });
            setViewEntry(null);
            showToast("Deleted.");
        };

        const fmtDate = (d) => {
            if (!d) return "";
            const dt = new Date(d + "T00:00:00");
            const diff = Math.round((new Date(todayStr()) - dt) / 86400000);
            if (diff === 0) return "Today";
            if (diff === 1) return "Yesterday";
            if (diff < 7)  return `${diff}d ago`;
            return dt.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
        };

        // ── LIGHTBOX ─────────────────────────────────────────────────────
        if (viewEntry) return e('div', { className: "pd-lightbox" },
            viewEntry.imageData
                ? e('img', { src: viewEntry.imageData, className: "pd-lightbox-img", alt: viewEntry.name })
                : e('div', { className: "pd-lightbox-img", style: { background: "var(--bg-input)", display:"flex", alignItems:"center", justifyContent:"center" } },
                    e(Icon, { name: "image", size: 60, color: "var(--text-muted)" })
                  ),
            e('div', { className: "pd-lightbox-footer" },
                e('div', { style: { display:"flex", justifyContent:"space-between", alignItems:"flex-end" } },
                    e('div', null,
                        e('div', { style: { fontSize: 28, fontWeight: 800, color: "#00FF87", textShadow: "0 0 20px rgba(0,255,135,0.45)", lineHeight: 1.1, fontVariantNumeric:"tabular-nums" } }, fc(viewEntry.amountCents)),
                        e('div', { style: { fontSize: 15, fontWeight: 600, color: "#fff", marginTop: 4 } }, viewEntry.name),
                        viewEntry.note && e('div', { style: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 3 } }, viewEntry.note),
                        e('div', { style: { display:"flex", gap:8, marginTop:8, alignItems:"center" } },
                            e('span', { style: { fontSize: 11, fontWeight: 700, background:"rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.9)", padding:"3px 10px", borderRadius:20 } }, viewEntry.category),
                            e('span', { style: { fontSize: 11, color:"rgba(255,255,255,0.5)" } }, fmtDate(viewEntry.date))
                        )
                    ),
                    e('div', { style: { display:"flex", gap:10 } },
                        e('button', { onClick: () => handleDelete(viewEntry), style: { background:"rgba(239,68,68,0.18)", border:"1px solid rgba(239,68,68,0.35)", color:"#EF4444", padding:"10px 14px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700 } }, "Delete"),
                        e('button', { onClick: () => setViewEntry(null),       style: { background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", color:"#fff",      padding:"10px 14px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700 } }, "Close")
                    )
                )
            )
        );

        return e('div', null,
            // PAGE HEADER
            e('div', { style: { ...S.pageHeader, marginBottom: 16 } },
                e('div', null,
                    e('h2', { style: S.pageTitle }, "Photo Diary"),
                    e('div', { style: { fontSize: 13, color: "var(--text-muted)", marginTop: 4 } },
                        photoDiary.length === 0 ? "Snap a photo, log what you spent." : `${photoDiary.length} entr${photoDiary.length === 1 ? "y" : "ies"} — your spending in pictures.`
                    )
                ),
                e(Btn, { v:"accent", onClick: () => setShowAdd(true) },
                    e(Icon, { name:"camera", size:14, color:"#030712", style:{ marginRight:6 } }),
                    "Add Photo"
                )
            ),

            // EMPTY STATE
            photoDiary.length === 0 && e('div', { className:"premium-panel", style:{ textAlign:"center", padding:"60px 24px" } },
                e('div', { style: { opacity:0.25, marginBottom:16, display:"flex", justifyContent:"center" } },
                    e(Icon, { name:"camera", size:56, color:"var(--text-muted)" })
                ),
                e('div', { style: { fontSize:17, fontWeight:700, color:"var(--text-light)", marginBottom:8 } }, "Your spending, in photos"),
                e('div', { style: { fontSize:13, color:"var(--text-muted)", maxWidth:260, margin:"0 auto", lineHeight:1.65 } },
                    "Snap a quick photo of what you bought. Your diary will look like a scroll of real life — not a tax report."
                ),
                e(Btn, { v:"accent", style:{ marginTop:24 }, onClick:() => setShowAdd(true) }, "+ Add First Photo")
            ),

            // PHOTO GRID
            photoDiary.length > 0 && e('div', { className: "pd-grid" },
                photoDiary.map(entry =>
                    e('div', { key: entry.id, className: "pd-card", onClick: () => setViewEntry(entry) },
                        entry.imageData
                            ? e('img', { src: entry.imageData, className: "pd-img", alt: entry.name })
                            : e('div', { className: "pd-img pd-no-img" },
                                e(Icon, { name:"image", size:28, color:"var(--text-muted)" })
                              ),
                        e('div', { className: "pd-overlay" },
                            e('div', { className: "pd-amount" }, fc(entry.amountCents)),
                            e('div', { style:{ display:"flex", alignItems:"center", gap:6, marginTop:3 } },
                                e('span', { className: "pd-cat-badge" }, entry.category),
                                e('span', { className: "pd-date" }, fmtDate(entry.date))
                            ),
                            entry.name && e('div', { style:{ fontSize:11, color:"rgba(255,255,255,0.7)", marginTop:3, fontWeight:500 } }, entry.name)
                        )
                    )
                )
            ),

            // UPGRADE PROMPT
            showUpgrade && window.UpgradePromptModal && e(window.UpgradePromptModal, {
                message: "Free users can add up to 10 photo diary entries per month. You've reached your limit. Upgrade to Premium for unlimited photos.",
                onClose: () => setShowUpgrade(false)
            }),

            // REMAINING COUNT
            !canAddPhoto && !showAdd && e('div', { style: { textAlign: "center", padding: "12px 16px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, marginBottom: 16, fontSize: 12, color: "#F59E0B", fontWeight: 600 } },
                "Monthly photo limit reached (10/10). ",
                e('button', { onClick: () => setShowUpgrade(true), style: { background: "none", border: "none", color: "#00E676", cursor: "pointer", textDecoration: "underline", fontSize: 12, fontWeight: 700, fontFamily: "inherit" } }, "Upgrade to Premium")
            ),

            // ADD MODAL
            showAdd && e('div', { className:"modal-overlay", onClick: resetForm },
                e('div', { className:"modal-container", style:{ maxWidth:420 }, onClick: ev => ev.stopPropagation() },
                    e('div', { style: S.modalHeader },
                        e('div', null,
                            e('div', { style: S.modalTitle }, "New Photo Expense"),
                            e('div', { style:{ fontSize:12, color:"var(--text-muted)", marginTop:3 } }, "Snap or pick a photo, then log the amount.")
                        ),
                        e('button', { onClick: resetForm, style: S.closeBtn }, e(Icon, { name:"x", size:16 }))
                    ),

                    e('label', { className: "pd-picker", htmlFor: "pd-file-input", style: compressing ? { opacity:0.6 } : undefined },
                        preview
                            ? e('img', { src: preview, className: "pd-preview", alt:"preview" })
                            : e('div', { style:{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, color:"var(--text-muted)" } },
                                e(Icon, { name: compressing ? "target" : "camera", size:32 }),
                                e('div', { style:{ fontSize:13, fontWeight:600, color:"var(--text-light)" } }, compressing ? "Compressing…" : "Tap to add photo"),
                                e('div', { style:{ fontSize:11, color:"var(--text-muted)" } }, "Camera or gallery — auto compressed")
                              ),
                        preview && e('div', { className: "pd-picker-change" }, "Tap to change"),
e('input', { id:"pd-file-input", type:"file", accept:"image/*", style:{ display:"none" }, onChange: handlePickImage })
                    ),

                    e('input', { className:"quick-add-amount", type:"number", inputMode:"decimal", placeholder:"0.00", value: form.amountRaw, autoFocus:true, onChange: ev => setForm(f => ({...f, amountRaw: ev.target.value})) }),

                    e('div', { className:"cat-grid" },
                        window.SINKPESO_CONSTANTS.CATEGORIES.map(c => e('button', { key:c, className:"cat-btn" + (form.category === c ? " selected" : ""), onClick:() => setForm(f => ({...f, category:c})) },
                            e('div', { style:{ marginBottom:3, opacity:0.8 } }, e(Icon, { name: catIcons[c]||"target", size:17 })),
                            c
                        ))
                    ),

                    e(Inp, { placeholder:"What did you get? (optional)", value: form.name, onChange: ev => setForm(f => ({...f, name: ev.target.value})), style:{ marginBottom:10 } }),
                    e(Inp, { placeholder:"Caption / note (optional)",    value: form.note, onChange: ev => setForm(f => ({...f, note: ev.target.value})), style:{ marginBottom:14 } }),

                    wallets.length > 0 && e(Field, { label:"Pay from" },
                        e(WalletPicker, { wallets, value: form.walletId, onChange: v => setForm(f => ({...f, walletId: v})) })
                    ),

                    e('div', { style: S.modalFooter },
                        e(Btn, { v:"ghost",  style:{ flex:1 }, onClick: resetForm }, "Cancel"),
                        e(Btn, { v:"accent", style:{ flex:1 }, onClick: handleSave }, "Save")
                    )
                )
            )
        );
    }

    window.PhotoDiaryView = React.memo(PhotoDiaryView);
})();