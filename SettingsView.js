// SettingsView.js — Settings module for SINKPESO
//
// Dependencies: React (global), Icon (global), constants.js globals,
//   window.persistence, window.license, window.hashPin,
//   window.components.{Field, Inp, Sel, Btn, SLabel, PageTitle},
//   window.SettingGroup, window.InsightStrip, window.utils.todayStr

(function () {
    "use strict";
    const e = React.createElement;
    const { todayStr } = window.utils;
    const { Field, Inp, Sel, Btn, SLabel, PageTitle } = window.components;

    // ── STORAGE USAGE PANEL ──────────────────────────────────────────────
    function StorageUsagePanel({ showToast }) {
        const [lsUsage, setLsUsage] = React.useState(null);
        const [idbUsage, setIdbUsage] = React.useState(null);
        const [photoCount, setPhotoCount] = React.useState(0);

        React.useEffect(() => {
            // localStorage usage
            const usage = window.persistence.getStorageUsage();
            setLsUsage(usage);
            // IndexedDB usage
            window.photodb.getUsage().then(setIdbUsage).catch(() => {});
            window.photodb.count().then(setPhotoCount).catch(() => {});
        }, []);

        if (!lsUsage) return e('p', { style: { fontSize: 13, color: "var(--text-muted)" } }, "Calculating...");

        const lsPct = Math.round(lsUsage.pct * 100);
        const barColor = lsPct >= 90 ? "#EF4444" : lsPct >= 70 ? "#F59E0B" : "#00E676";

        return e('div', null,
            e('div', { style: { fontSize: 13, color: "var(--text-muted)", marginBottom: 12 } },
                "Your data is stored locally in your browser."
            ),
            // localStorage bar
            e('div', { style: { marginBottom: 14 } },
                e('div', { style: { display: "flex", justifyContent: "space-between", marginBottom: 6 } },
                    e('span', { style: { fontSize: 12, fontWeight: 600, color: "var(--text-light)" } }, "localStorage"),
                    e('span', { style: { fontSize: 12, fontWeight: 600, color: "var(--text-muted)" } },
                        `${lsUsage.usedMB} / ${lsUsage.quotaMB} MB (${lsPct}%)`)
                ),
                e('div', { style: { height: 6, borderRadius: 3, background: "var(--hover-bg)", overflow: "hidden" } },
                    e('div', { style: { height: "100%", width: `${Math.min(lsPct, 100)}%`, borderRadius: 3, background: barColor, transition: "width 0.3s" } })
                )
            ),
            // IndexedDB info
            idbUsage && e('div', { style: { marginBottom: 14 } },
                e('div', { style: { display: "flex", justifyContent: "space-between", marginBottom: 6 } },
                    e('span', { style: { fontSize: 12, fontWeight: 600, color: "var(--text-light)" } }, "IndexedDB (photos)"),
                    e('span', { style: { fontSize: 12, fontWeight: 600, color: "var(--text-muted)" } },
                        `${idbUsage.usedMB} / ${idbUsage.quotaMB} MB`)
                ),
                e('div', { style: { fontSize: 12, color: "var(--text-muted)" } },
                    `${photoCount} photo${photoCount !== 1 ? "s" : ""} stored`
                )
            ),
            // Warning
            lsUsage.warning && e('div', { style: {
                fontSize: 12, fontWeight: 600, color: "#F59E0B",
                background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: 8, padding: "8px 12px", marginTop: 4
            } }, lsUsage.warning)
        );
    }

    // ── CRASH REPORT PANEL ───────────────────────────────────────────────
    function CrashReportPanel({ showToast }) {
        const [reports, setReports] = React.useState([]);

        React.useEffect(() => {
            if (window.crashreport) setReports(window.crashreport.getReports());
        }, []);

        if (!window.crashreport) return e('p', { style: { fontSize: 13, color: "var(--text-muted)" } }, "Crash reporting not loaded.");

        const count = reports.length;
        return e('div', null,
            e('div', { style: { fontSize: 13, color: "var(--text-muted)", marginBottom: 12 } },
                count === 0
                    ? "No crash reports. App is running smoothly."
                    : `${count} crash report${count !== 1 ? "s" : ""} recorded. All data stays on your device.`
            ),
            count > 0 && e('div', { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
                e(Btn, { v: "ghost", style: { fontSize: 12 }, onClick: () => {
                    const text = window.crashreport.exportText();
                    const blob = new Blob([text], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url; a.download = `sinkpeso_crash_log_${todayStr()}.txt`; a.click();
                    showToast("Crash log exported.");
                } }, "Export Log"),
                e(Btn, { v: "ghost", style: { fontSize: 12 }, onClick: () => {
                    window.crashreport.clearReports();
                    setReports([]);
                    showToast("Crash reports cleared.");
                } }, "Clear All")
            )
        );
    }

    function SettingsView({ settings, setSettings, setIncomes, setBills, setDailyExpenses, setFunds, setTxns, setArchives, setBudgets, showToast, totals, bills, budgets, fc }) {
        const safeSettings = settings || {};
        const [pinInput, setPinInput] = React.useState(safeSettings?.pin || '');
        const [upgradeMsg, setUpgradeMsg] = React.useState(null);

        const handleExport = async () => {
            const keys = window.persistence.getAllRawKeys();
            const data = {};
            Object.values(keys).forEach(lsKey => {
                data[lsKey] = localStorage.getItem(lsKey);
            });
            // Include photo diary from IndexedDB (not localStorage)
            try {
                const photos = await window.photodb.getAll();
                if (photos && photos.length > 0) {
                    data["sp_photo_diary"] = JSON.stringify({ _v: 2, data: photos });
                }
            } catch (err) {
                console.warn("[export] Could not fetch photos from IndexedDB:", err);
            }
            // Include archives from IndexedDB (not localStorage)
            try {
                const archives = await window.archivedb.getAll();
                if (archives && archives.length > 0) {
                    data["sp_archives"] = JSON.stringify({ _v: 2, data: archives });
                }
            } catch (err) {
                console.warn("[export] Could not fetch archives from IndexedDB:", err);
            }
            const password = prompt("Set a password to encrypt backup (leave blank for unencrypted):");
            let blob;
            if (password && !window.license.canUseFeature("encryptedBackup")) {
                setUpgradeMsg("This is a Premium feature. Unlock encrypted backups with a one-time payment of ₱299.");
                return;
            }
            if (password && window.license.canUseFeature("encryptedBackup")) {
                const enc = new TextEncoder();
                const salt = crypto.getRandomValues(new Uint8Array(16));
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
                const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
                const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(data)));
                const payload = { _encrypted: true, salt: Array.from(salt), iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) };
                blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
            } else {
                blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `sinkpeso_backup_${todayStr()}.json`; a.click();
        };

        const handleImport = (ev) => {
            const file = ev.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const raw = JSON.parse(e.target.result);
                    let data;
                    if (raw._encrypted) {
                        const password = prompt("Enter backup password:");
                        if (!password) { showToast("Password required for encrypted backup."); return; }
                        const enc = new TextEncoder();
                        const salt = new Uint8Array(raw.salt);
                        const iv = new Uint8Array(raw.iv);
                        const encrypted = new Uint8Array(raw.data);
                        const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
                        const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
                        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
                        data = JSON.parse(new TextDecoder().decode(decrypted));
                    } else {
                        data = raw;
                    }
                    const validKeys = Object.values(window.persistence.getAllRawKeys());
                    window.persistence.clearState();
                    Object.keys(data).forEach(k => {
                        // Skip photo diary and archives — they go to IndexedDB, not localStorage
                        if (k === "sp_photo_diary" || k === "sp_archives") return;
                        if (validKeys.includes(k) && data[k]) localStorage.setItem(k, data[k]);
                    });
                    // Restore photo diary to IndexedDB
                    if (data["sp_photo_diary"]) {
                        try {
                            let photos;
                            const parsed = JSON.parse(data["sp_photo_diary"]);
                            if (parsed && typeof parsed === "object" && "_v" in parsed && Array.isArray(parsed.data)) {
                                photos = parsed.data;
                            } else if (Array.isArray(parsed)) {
                                photos = parsed;
                            }
                            if (photos && photos.length > 0) {
                                await window.photodb.saveAll(photos);
                            }
                        } catch (err) {
                            console.warn("[import] Could not restore photos to IndexedDB:", err);
                        }
                    }
                    // Restore archives to IndexedDB
                    if (data["sp_archives"]) {
                        try {
                            let arch;
                            const parsed = JSON.parse(data["sp_archives"]);
                            if (parsed && typeof parsed === "object" && "_v" in parsed && Array.isArray(parsed.data)) {
                                arch = parsed.data;
                            } else if (Array.isArray(parsed)) {
                                arch = parsed;
                            }
                            if (arch && arch.length > 0) {
                                await window.archivedb.saveAll(arch);
                            }
                        } catch (err) {
                            console.warn("[import] Could not restore archives to IndexedDB:", err);
                        }
                    }
                    showToast("Backup restored! Reloading...");
                    setTimeout(() => window.location.reload(), 800);
                } catch (err) { showToast("Invalid backup file or wrong password."); }
            };
            reader.readAsText(file);
        };

        const handleExportCSV = () => {
            const saved = window.persistence.loadState();
            const rows = [["Type", "Name", "Amount", "Category", "Date", "Wallet"]];
            (saved.incomes || []).forEach(i => rows.push(["Income", i.name, (i.amountCents/100).toFixed(2), "", i.date, i.walletNameSnapshot || ""]));
            (saved.daily || []).forEach(d => rows.push(["Expense", d.name, (d.amountCents/100).toFixed(2), d.category, d.date, d.walletNameSnapshot || ""]));
            (saved.bills || []).forEach(b => rows.push(["Bill", b.name, (b.amountCents/100).toFixed(2), b.category || "Bills", b.dueDate, b.isPaid ? "Paid" : "Unpaid"]));
            (saved.txns || []).filter(t => t.fundId).forEach(t => rows.push(["Vault " + t.type, "", (t.amountCents/100).toFixed(2), "", t.date, t.walletNameSnapshot || ""]));
            const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(",")).join("\n");
            const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `sinkpeso_export_${todayStr()}.csv`; a.click();
            showToast(" CSV exported!");
        };

        const SettingGroup = window.SettingGroup;
        const CURRENCIES = window.SINKPESO_CONSTANTS.CURRENCIES;

        return e('div', null,
            e(PageTitle, { sub: "Preferences, security, and data management." }, 'Settings'),
            e(InsightStrip, { totals, bills, budgets, fc }),

            e('div', { className: "dashboard-grid" },
                // LEFT COLUMN
                e('div', null,
                    e(SettingGroup, { title: "Appearance", icon: "grid" },
                        e(Field, { label: "Theme" },
                            e('div', { style: { display: "inline-flex", background: "var(--bg-input)", border: "1px solid var(--border-input)", borderRadius: 10, padding: 3, gap: 2 } },
                                [
                                    { val: 'dark', icon: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z", label: "Dark" },
                                    { val: 'light', icon: null, label: "Light" }
                                ].map(opt => {
                                    const active = (settings?.theme || 'dark') === opt.val;
                                    return e('button', {
                                        key: opt.val,
                                        onClick: () => setSettings({...settings, theme: opt.val}),
                                        style: {
                                            display: "flex", alignItems: "center", gap: 6,
                                            padding: "6px 12px", borderRadius: 7,
                                            background: active ? "var(--bg-panel)" : "transparent",
                                            border: active ? "1px solid var(--border)" : "1px solid transparent",
                                            boxShadow: active ? "0 1px 4px rgba(0,0,0,0.18)" : "none",
                                            cursor: "pointer", transition: "all 0.18s",
                                            color: active ? "var(--text-main)" : "var(--text-muted)",
                                            fontSize: 12, fontWeight: active ? 600 : 400,
                                            fontFamily: "inherit",
                                        }
                                    },
                                        opt.val === 'dark'
                                            ? e('svg', { width: 13, height: 13, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" }, e('path', { d: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" }))
                                            : e('svg', { width: 13, height: 13, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" },
                                                e('circle', { cx: 12, cy: 12, r: 5 }),
                                                e('line', { x1: 12, y1: 1, x2: 12, y2: 3 }),
                                                e('line', { x1: 12, y1: 21, x2: 12, y2: 23 }),
                                                e('line', { x1: 4.22, y1: 4.22, x2: 5.64, y2: 5.64 }),
                                                e('line', { x1: 18.36, y1: 18.36, x2: 19.78, y2: 19.78 }),
                                                e('line', { x1: 1, y1: 12, x2: 3, y2: 12 }),
                                                e('line', { x1: 21, y1: 12, x2: 23, y2: 12 }),
                                                e('line', { x1: 4.22, y1: 19.78, x2: 5.64, y2: 18.36 }),
                                                e('line', { x1: 18.36, y1: 5.64, x2: 19.78, y2: 4.22 })
                                            ),
                                        opt.label
                                    );
                                })
                            )
                        ),
                        e(Field, { label: "Currency" }, e(Sel, { value: settings?.currency || 'PHP', onChange: ev => setSettings({...settings, currency: ev.target.value}) },
                            Object.keys(CURRENCIES).map(c => e('option', { key: c, value: c }, c))
                        )),
                        e(Field, { label: "Secondary Currency (optional)" }, e(Sel, { value: settings?.secondaryCurrency || '', onChange: ev => {
                            if (ev.target.value && !window.license.canUseFeature("multiCurrency")) {
                                showToast("Multi-currency requires Premium.");
                                return;
                            }
                            setSettings({...settings, secondaryCurrency: ev.target.value});
                        } },
                            e('option', { value: "" }, "None"),
                            Object.keys(CURRENCIES).filter(c => c !== settings?.currency).map(c => e('option', { key: c, value: c }, c))
                        ))
                    ),

                    e(SettingGroup, { title: "Security", icon: "lock" },
                        e('p', { style: { fontSize:13, color:"var(--text-muted)", marginBottom:16, lineHeight:1.5 } },
                            settings?.pin ? "PIN is active. Clear the field and save to disable." : "Add a numeric PIN to lock the app on open."
                        ),
                        e(Field, { label: "PIN (leave blank to disable)" },
                            e(Inp, { type: "password", inputMode: "numeric", pattern: "[0-9]*", placeholder: "e.g. 1234", value: pinInput, onChange: ev => setPinInput(ev.target.value.replace(/[^0-9]/g, '')) })
                        ),
                        e(Btn, { v: "accent", onClick: () => {
                            if (pinInput && pinInput.length < 4) { showToast("PIN must be at least 4 digits."); return; }
                            if (pinInput) {
                                window.hashPin(pinInput).then(function (hashed) {
                                    setSettings({...settings, pin: hashed});
                                    showToast(" PIN saved.");
                                });
                            } else {
                                setSettings({...settings, pin: ""});
                                showToast(" PIN removed.");
                            }
                        } }, pinInput ? "Save PIN" : "Remove PIN")
                    )
                ),

                // RIGHT COLUMN
                e('div', null,
                    e(SettingGroup, { title: "Data Backup", icon: "archive" },
                        e('p', { style: { fontSize:13, color:"var(--text-muted)", marginBottom:16, lineHeight:1.5 } },
                            "All data lives in your browser. Export regularly — clearing browser storage will erase everything."
                        ),
                        e(Btn, { v: "ghost", style: { width:"100%", marginBottom:10 }, onClick: handleExport },
                            "⬇ Export Backup (.json)"
                        ),
                        e(Btn, { v: "ghost", style: { width:"100%", marginBottom:10 }, onClick: handleExportCSV },
                            "⬇ Export Transactions (.csv)"
                        ),
                        e('div', { style: { borderTop:"1px solid var(--border)", paddingTop:16, marginTop:6 } },
                            e(SLabel, { style: { marginBottom:10 } }, "Restore from backup"),
                            e('input', { type:"file", accept:".json", onChange: handleImport,
                                style: { background:"var(--bg-input)", color:"var(--text-main)", padding:"10px 12px", borderRadius:10, width:"100%", border:"1px solid var(--border-input)", fontSize:13 }
                            })
                        )
                    ),

                    e(SettingGroup, { title: "Premium License", icon: "shield" },
                        // ── PREMIUM ACTIVE STATE ──
                        window.license.isPremium() && e('div', null,
                            // Green badge
                            e('div', { style: {
                                display: "inline-flex", alignItems: "center", gap: 8,
                                background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.25)",
                                borderRadius: 8, padding: "8px 14px", marginBottom: 16
                            } },
                                e(Icon, { name: "shield", size: 14, color: "#00E676" }),
                                e('span', { style: { fontSize: 13, fontWeight: 700, color: "#00E676" } }, "Premium Active")
                            ),
                            // Masked license key
                            (() => {
                                var stored = window.license.getStoredLicense() || "";
                                var masked = stored;
                                if (stored.length >= 14) {
                                    // SINKPESO-ABCD-XXXX-XXXX → SINKPESO-ABCD-••••-••••
                                    masked = stored.slice(0, 14) + "••••-" + stored.slice(19).replace(/[A-Z0-9]/g, "•");
                                }
                                return e('div', { style: { fontSize: 13, color: "var(--text-muted)", marginBottom: 16, fontFamily: "'DM Mono', monospace", letterSpacing: "0.03em" } },
                                    masked
                                );
                            })(),
                            // Unlocked features
                            e('div', { style: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 } },
                                ["Unlimited wallets & vaults", "Encrypted backups", "Recurring expenses", "PDF reports", "Multi-currency display"].map(function(f) {
                                    return e('div', { key: f, style: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 } },
                                        e(Icon, { name: "shield", size: 14, color: "#00E676" }),
                                        e('span', { style: { color: "var(--text-main)" } }, f)
                                    );
                                })
                            ),
                            // Remove License link
                            e('button', {
                                onClick: function() {
                                    if (confirm("Remove your license? Premium features will be locked.")) {
                                        window.license.deactivate();
                                        showToast("License removed. Reloading...");
                                        setTimeout(function() { window.location.reload(); }, 800);
                                    }
                                },
                                style: {
                                    background: "none", border: "none", color: "var(--text-muted)",
                                    fontSize: 12, cursor: "pointer", textDecoration: "underline",
                                    padding: 0, fontFamily: "inherit"
                                }
                            }, "Remove License")
                        ),

                        // ── FREE PLAN STATE ──
                        !window.license.isPremium() && e('div', null,
                            // Free plan banner
                            e('div', { style: {
                                display: "flex", alignItems: "center", gap: 10,
                                background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
                                borderRadius: 10, padding: "12px 14px", marginBottom: 16
                            } },
                                e(Icon, { name: "lock", size: 14, color: "#F59E0B" }),
                                e('span', { style: { fontSize: 13, fontWeight: 700, color: "#F59E0B" } }, "You're on the Free Plan")
                            ),
                            // Locked features list
                            e('div', { style: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 } },
                                (() => {
                                    var saved = window.persistence.loadState();
                                    var walletCount = (saved.wallets || []).length;
                                    var vaultCount = (saved.funds || []).length;
                                    var limits = window.license.getLimits();
                                    return [
                                        { name: "Unlimited Wallets", locked: limits.wallets !== Infinity, detail: "you have " + walletCount + "/" + limits.wallets },
                                        { name: "Unlimited Vaults", locked: limits.vaults !== Infinity, detail: "you have " + vaultCount + "/" + limits.vaults },
                                        { name: "Encrypted Backups", locked: !limits.encryptedBackup, detail: null },
                                        { name: "Recurring Expenses", locked: !limits.recurring, detail: null },
                                        { name: "PDF Reports", locked: !limits.pdfExport, detail: null },
                                    ].map(function(f) {
                                        return e('div', { key: f.name, style: { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-muted)" } },
                                            e(Icon, { name: "lock", size: 13, color: f.locked ? "var(--text-muted)" : "#00E676" }),
                                            e('span', null,
                                                f.name,
                                                f.detail && f.locked ? e('span', { style: { opacity: 0.6 } }, " (" + f.detail + ")") : null
                                            )
                                        );
                                    });
                                })()
                            ),
                            // Upgrade CTA
                            e('a', {
                                href: "premium.html",
                                style: {
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    width: "100%", padding: "12px 16px", marginBottom: 16,
                                    background: "#00E676", color: "#020810",
                                    borderRadius: 10, fontSize: 14, fontWeight: 700,
                                    textDecoration: "none", textAlign: "center",
                                    transition: "all 0.15s"
                                }
                            },
                                "Upgrade to Premium →"
                            ),
                            // Divider
                            e('div', { style: { borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 2 } },
                                e(SLabel, { style: { marginBottom: 10 } }, "Already have a key?"),
                                e(LicenseInput, { showToast })
                            )
                        )
                    ),

                    e(SettingGroup, { title: "Storage Usage", icon: "inbox" },
                        e(StorageUsagePanel, { showToast })
                    ),

                    e(SettingGroup, { title: "Crash Reports", icon: "target" },
                        e(CrashReportPanel, { showToast })
                    ),

                    e(SettingGroup, { title: "About", icon: "shield" },
                        e('div', { style: { display:"flex", flexDirection:"column", gap:8 } },
                            e('div', { style: { display:"flex", justifyContent:"space-between", fontSize:13 } },
                                e('span', { style: { color:"var(--text-muted)" } }, "App"), e('span', { style: { fontWeight:600 } }, "SINKPESO")
                            ),
                            e('div', { style: { display:"flex", justifyContent:"space-between", fontSize:13 } },
                                e('span', { style: { color:"var(--text-muted)" } }, "Storage"), e('span', { style: { fontWeight:600 } }, "IndexedDB + localStorage")
                            ),
                            e('div', { style: { display:"flex", justifyContent:"space-between", fontSize:13 } },
                                e('span', { style: { color:"var(--text-muted)" } }, "Sync"), e('span', { style: { fontWeight:600, color:"#00E676" } }, "Offline Only")
                            ),
                            e('div', { style: { display:"flex", justifyContent:"space-between", fontSize:13 } },
                                e('span', { style: { color:"var(--text-muted)" } }, "Account"), e('span', { style: { fontWeight:600, color:"#00E676" } }, "None required")
                            ),
                            e('a', { href: "privacy.html", target: "_blank", rel: "noopener", style: { fontSize:13, color:"var(--accent)", textDecoration:"none", fontWeight:600, marginTop:4 } }, "Privacy Policy →")
                        )
                    )
                )
            ),
            upgradeMsg && window.UpgradePromptModal && e(window.UpgradePromptModal, {
                message: upgradeMsg,
                onClose: function() { setUpgradeMsg(null); }
            })
        );
    }

    window.SettingsView = React.memo(SettingsView);
})();