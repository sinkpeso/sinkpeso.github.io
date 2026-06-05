// DashboardOverview.js — Bento Box dashboard for SINKPESO
//
// Layout (4 rows of bento cells):
//   Row 1 — BALANCE HERO (wide) + BURN RING (narrow)
//   Row 2 — WALLET CARDS (up to 3, equal) + UNPAID TOTAL
//   Row 3 — RECENT EXPENSES (wide) + UPCOMING BILLS (narrow)
//   Row 4 — CATEGORY SPENDING (full width, 3-col grid)
//
// Display only — no useState, no localStorage, no mutations.
//
// Dependencies: React, useMemo (global), Icon (global), CATEGORIES (global),
//   RecentActivitySection (global from index.html),
//   window.components.{SLabel,PBar}, window.utils.{safeDiv,getDaysRemaining},
//   window.walleticons.WalletIcon
//
// Props: totals, bills, dailyExpenses, budgets, wallets, fc, fc2,
//        incomes, txns, funds, archives, onNavigate

(function () {
    const e = React.createElement;
    const { safeDiv, getDaysRemaining } = window.utils;
    // NOTE: window.walleticons loads AFTER this file, so WalletIcon is
    // resolved lazily inside the function body — not here at IIFE time.

    // ── tiny helpers ───────────────────────────────────────────────────────
    const glow = (color, strength = 0.35) =>
        `0 0 24px ${color}${Math.round(strength * 255).toString(16).padStart(2,'0')}, 0 0 48px ${color}${Math.round(strength * 0.5 * 255).toString(16).padStart(2,'0')}`;

    const NeonNum = ({ value, color = 'var(--bn-green)', size = 42 }) =>
        e('div', {
            style: {
                fontSize: size, fontWeight: 800, lineHeight: 1,
                color, letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums',
                textShadow: glow(color === 'var(--bn-green)' ? '#00FF87' : color),
            }
        }, value);

    const BentoLabel = ({ children, style = {} }) =>
        e('div', {
            style: {
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                marginBottom: 10, ...style
            }
        }, children);

    const ThinBar = ({ pct, color }) =>
        e('div', { style: { height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginTop: 10 } },
            e('div', { style: {
                height: '100%',
                width: `${Math.min(100, Math.max(0, pct * 100))}%`,
                background: color,
                borderRadius: 2,
                boxShadow: `0 0 8px ${color}70`,
                transition: 'width 0.5s ease'
            }})
        );

    // ── main component ──────────────────────────────────────────────────────
    function DashboardOverview({ totals, bills, dailyExpenses, budgets,
                                  wallets, fc, fc2, incomes, txns,
                                  funds, archives, photoDiary, debts, onNavigate }) {

        // walleticons.js is guaranteed loaded by the time this function runs
        const { WalletIcon } = window.walleticons;
        // FIX #7: Wire RecentActivitySection — resolved lazily from window
        const RecentActivitySection = window.RecentActivitySection;

        // Recent photo diary entries (latest 6 for the strip)
        const recentPhotos = useMemo(() =>
            (photoDiary || []).filter(p => p.imageData).slice(0, 6),
        [photoDiary]);

        const spendPct   = totals.totalIncome > 0
            ? (totals.totalDailySpent + totals.paidBills) / totals.totalIncome : 0;
        const walletTotal = (wallets || []).reduce((s, w) => s + (w.balanceCents || 0), 0);

        // Net Worth: wallets + sinking funds - debts
        const fundsTotal = (funds || []).reduce((s, f) => s + (f.savedCents || f.targetCents || 0), 0);
        const debtTotal = (debts || []).reduce((s, d) => {
            if (d.status === "paid") return s;
            const paid = (d.payments || []).reduce((ps, p) => ps + p.amountCents, 0);
            const remaining = Math.max(0, d.amountCents - paid);
            return d.type === "i_owe" ? s + remaining : s - remaining;
        }, 0);
        const netWorth = walletTotal + fundsTotal - debtTotal;

        const today      = new Date();
        const daysInMo   = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const daysLeft   = Math.max(1, daysInMo - today.getDate());
        const safeDaily  = totals.netAvailable > 0 ? Math.floor(totals.netAvailable / daysLeft) : 0;

        // Spending trend: compare current spending to last month's archive
        const prevArchive = (archives || []).length > 0 ? archives[0] : null;
        const currentSpent = totals.totalDailySpent + totals.paidBills;
        const trendPct = prevArchive && prevArchive.totalSpent > 0
            ? Math.round(((currentSpent - prevArchive.totalSpent) / prevArchive.totalSpent) * 100)
            : null;

        const ringColor  = spendPct > 0.8 ? 'var(--bn-red)' : 'var(--bn-green)';
        const ringHex    = spendPct > 0.8 ? '#FF3D5A' : '#00FF87';
        const circumf    = 50 * 2 * Math.PI;
        const dashOff    = circumf * (1 - Math.min(spendPct, 1));

        const recentExp  = useMemo(() => (dailyExpenses || []).slice(0, 4), [dailyExpenses]);
        const upcoming   = useMemo(() =>
            (bills || []).filter(b => !b.isPaid)
                .sort((a, b) => (getDaysRemaining(a.dueDate) ?? 999) - (getDaysRemaining(b.dueDate) ?? 999))
                .slice(0, 4),
        [bills]);

        const catItems = CATEGORIES.map(k => {
            const val  = totals.catSum[k] || 0;
            const bObj = budgets.find(x => x.category === k);
            const lim  = bObj ? bObj.limitCents : null;
            const pct  = lim ? safeDiv(val, lim) : 0;
            const col  = !lim ? 'rgba(255,255,255,0.12)'
                       : pct >= 1   ? 'var(--bn-red)'
                       : pct >= 0.8 ? 'var(--bn-amber)'
                       : 'var(--bn-green)';
            return { k, val, lim, pct, col };
        });

        return e('div', { className: 'bn-wrap' },

            // ── PHOTO DIARY STRIP (when entries exist) ─────────────────────
            recentPhotos.length > 0 && e('div', { className: 'pd-strip-section' },
                e('div', { style: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 } },
                    e('div', { style:{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)' } }, ' Recent Moments'),
                    onNavigate && e('button', { onClick:() => onNavigate('photo-diary'), style:{ background:'transparent', border:'none', color:'var(--text-muted)', fontSize:11, fontWeight:600, cursor:'pointer', padding:0, letterSpacing:'0.02em' } }, 'View all →')
                ),
                e('div', { className: 'pd-strip' },
                    recentPhotos.map(p =>
                        e('div', { key: p.id, className: 'pd-strip-card', onClick: () => onNavigate && onNavigate('photo-diary') },
                            e('img', { src: p.imageData, className: 'pd-strip-img', alt: p.name }),
                            e('div', { className: 'pd-strip-overlay' },
                                e('div', { className: 'pd-strip-amt' }, fc(p.amountCents))
                            )
                        )
                    )
                )
            ),

            // ── ROW 1: balance hero + burn ring ───────────────────────────
            e('div', { className: 'bn-row1' },

                // Balance hero
                e('div', { className: 'bn-cell bn-balance' },
                    // ambient glow orb
                    e('div', { className: 'bn-orb' }),

                    e(BentoLabel, null, 'Available This Month'),
                    e(NeonNum, { value: fc(totals.netAvailable), size: 'clamp(32px,5vw,50px)' }),
                    fc2 && totals.netAvailable !== 0 && e('div', {
                        style: { fontSize: 13, color: 'var(--text-muted)', marginTop: 6, letterSpacing: '0.01em' }
                    }, `≈ ${fc2(totals.netAvailable)}`),

                    // health pulse badge
                    e('div', { style: { display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14,
                        background: totals.healthStatus.bg,
                        border: `1px solid ${totals.healthStatus.color}40`,
                        padding: '5px 12px', borderRadius: 20 } },
                        e('div', { style: { width: 6, height: 6, borderRadius: '50%',
                            background: totals.healthStatus.color,
                            boxShadow: `0 0 8px ${totals.healthStatus.color}` } }),
                        e('span', { style: { fontSize: 11, fontWeight: 700, color: totals.healthStatus.color } },
                            totals.healthStatus.label)
                    ),

                    // stats strip
                    e('div', { className: 'bn-stats-strip' },
                        e('div', { className: 'bn-stat' },
                            e('div', { className: 'bn-stat-lbl' }, 'Income'),
                            e('div', { className: 'bn-stat-val' }, fc(totals.totalIncome))
                        ),
                        e('div', { className: 'bn-divider' }),
                        e('div', { className: 'bn-stat' },
                            e('div', { className: 'bn-stat-lbl' }, 'Spent'),
                            e('div', { className: 'bn-stat-val bn-muted-val' },
                                fc(totals.totalDailySpent + totals.paidBills))
                        ),
                        e('div', { className: 'bn-divider' }),
                        e('div', { className: 'bn-stat' },
                            e('div', { className: 'bn-stat-lbl' }, 'All Wallets'),
                            e('div', { className: 'bn-stat-val',
                                style: { color: walletTotal < 0 ? 'var(--bn-red)' : 'var(--text-main)' } },
                                fc(walletTotal))
                        )
                    )
                ),

                // Burn ring
                e('div', { className: 'bn-cell bn-ring' },
                    e(BentoLabel, { style: { textAlign: 'center', marginBottom: 16 } }, 'Budget Used'),

                    e('div', { style: { position: 'relative', display: 'flex', justifyContent: 'center' } },
                        e('svg', { width: 110, height: 110, style: { transform: 'rotate(-90deg)' } },
                            // track
                            e('circle', { fill: 'none', stroke: 'rgba(255,255,255,0.06)',
                                strokeWidth: 11, r: 50, cx: 55, cy: 55 }),
                            // fill
                            e('circle', { fill: 'none', stroke: ringHex,
                                strokeWidth: 11, strokeLinecap: 'round',
                                strokeDasharray: circumf, strokeDashoffset: dashOff,
                                r: 50, cx: 55, cy: 55,
                                style: { transition: 'stroke-dashoffset 0.7s ease',
                                         filter: `drop-shadow(0 0 7px ${ringHex}90)` } })
                        ),
                        e('div', { style: { position: 'absolute', inset: 0,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center' } },
                            e('span', { style: { fontSize: 22, fontWeight: 800,
                                color: ringHex, textShadow: glow(ringHex, 0.4) } },
                                `${Math.round(spendPct * 100)}%`),
                            e('span', { style: { fontSize: 10, color: 'var(--text-muted)',
                                fontWeight: 600, marginTop: 2 } }, 'of income'),
                            trendPct !== null && e('span', { style: {
                                fontSize: 10, fontWeight: 700, marginTop: 4,
                                color: trendPct > 0 ? 'var(--bn-red)' : trendPct < 0 ? 'var(--bn-green)' : 'var(--text-muted)',
                                display: 'flex', alignItems: 'center', gap: 3
                            } },
                                trendPct > 0 ? '↑' : trendPct < 0 ? '↓' : '→',
                                ` ${Math.abs(trendPct)}% vs last month`
                            )
                        )
                    ),

                    safeDaily > 0 && e('div', { style: { textAlign: 'center', marginTop: 16 } },
                        e('div', { style: { fontSize: 11, color: 'var(--text-muted)',
                            marginBottom: 3, letterSpacing: '0.05em' } }, 'safe daily spend'),
                        e('div', { style: { fontSize: 17, fontWeight: 800,
                            color: 'var(--bn-green)',
                            textShadow: glow('#00FF87', 0.3) } },
                            `${fc(safeDaily)}/day`),
                        e('div', { style: { fontSize: 10, color: 'var(--text-muted)', marginTop: 2 } },
                            `${daysLeft} days left`)
                    )
                )
            ),

            // ── ROW 2: wallet cards + unpaid pill ─────────────────────────
            e('div', { className: 'bn-row2' },
                ...(wallets || []).slice(0, 3).map(w =>
                    e('div', { key: w.id, className: 'bn-cell bn-wallet' },
                        e('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } },
                            e(WalletIcon, { name: w.name, color: w.color || '#00E676', size: 28, radius: 8 }),
                            e('div', { style: { fontSize: 12, fontWeight: 700,
                                color: 'var(--text-light)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
                                w.name)
                        ),
                        e('div', { style: { fontSize: 20, fontWeight: 800,
                            color: (w.balanceCents || 0) < 0 ? 'var(--bn-red)' : 'var(--text-main)',
                            fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' } },
                            fc(w.balanceCents || 0)),
                        walletTotal > 0 && e(ThinBar, {
                            pct: safeDiv(Math.max(0, w.balanceCents || 0), walletTotal),
                            color: w.color || '#00E676'
                        })
                    )
                ),

                // unpaid bills total
                e('div', { className: 'bn-cell bn-unpaid' },
                    e(BentoLabel, null, 'Unpaid Bills'),
                    e(NeonNum, {
                        value: fc(totals.unpaidBills),
                        color: totals.unpaidBills > 0 ? 'var(--bn-amber)' : 'var(--bn-green)',
                        size: 22
                    }),
                    e('div', { style: { fontSize: 11, color: 'var(--text-muted)', marginTop: 6 } },
                        (() => {
                            const n = (bills || []).filter(b => !b.isPaid).length;
                            return n === 0 ? '✓ all clear' : `${n} bill${n > 1 ? 's' : ''} pending`;
                        })()
                    )
                )
            ),

            // ── ROW 3: recent expenses + upcoming bills ────────────────────
            e('div', { className: 'bn-row3' },

                // Recent expenses
                e('div', { className: 'bn-cell bn-expenses' },
                    e('div', { className: 'bn-row-header' },
                        e(BentoLabel, { style: { marginBottom: 0 } }, 'Recent Expenses'),
                        onNavigate && e('button', { className: 'bn-view-all',
                            onClick: () => onNavigate('daily') }, 'View all →')
                    ),
                    recentExp.length === 0
                        ? e('div', { className: 'bn-empty' }, 'No expenses logged yet')
                        : e('div', { className: 'bn-list' },
                            recentExp.map((exp, i) =>
                                e('div', { key: exp.id, className: 'bn-list-row',
                                    style: { borderBottom: i < recentExp.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' } },
                                    e('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
                                        e('div', { className: 'bn-exp-icon' },
                                            e(Icon, { name: 'wallet', size: 13, color: 'var(--bn-red)' })
                                        ),
                                        e('div', null,
                                            e('div', { style: { fontSize: 13, fontWeight: 600,
                                                color: 'var(--text-main)' } }, exp.name),
                                            e('div', { style: { fontSize: 10, color: 'var(--text-muted)',
                                                marginTop: 1 } }, `${exp.date} · ${exp.category}`)
                                        )
                                    ),
                                    e('div', { style: { fontSize: 13, fontWeight: 700,
                                        color: 'var(--bn-red)', flexShrink: 0 } },
                                        `-${fc(exp.amountCents)}`)
                                )
                            )
                        )
                ),

                // Upcoming bills
                e('div', { className: 'bn-cell bn-bills' },
                    e('div', { className: 'bn-row-header' },
                        e(BentoLabel, { style: { marginBottom: 0 } }, 'Upcoming Bills'),
                        onNavigate && e('button', { className: 'bn-view-all',
                            onClick: () => onNavigate('budget') }, 'View all →')
                    ),
                    upcoming.length === 0
                        ? e('div', { style: { display: 'flex', alignItems: 'center', gap: 8,
                            color: 'var(--bn-green)', fontSize: 13, fontWeight: 600,
                            marginTop: 12 } },
                            e(Icon, { name: 'shield', size: 14, color: 'var(--bn-green)' }),
                            'All bills paid')
                        : e('div', { className: 'bn-list' },
                            upcoming.map((b, i) => {
                                const days = getDaysRemaining(b.dueDate);
                                const oc = days < 0 ? 'var(--bn-red)'
                                         : days <= 1 ? 'var(--bn-red)'
                                         : days <= 3 ? 'var(--bn-amber)'
                                         : 'var(--text-muted)';
                                const ot = days < 0  ? `${Math.abs(days)}d overdue`
                                         : days === 0 ? 'Due today'
                                         : days === 1 ? 'Due tomorrow'
                                         : `${days}d left`;
                                return e('div', { key: b.id, className: 'bn-list-row',
                                    style: { borderBottom: i < upcoming.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' } },
                                    e('div', null,
                                        e('div', { style: { fontSize: 13, fontWeight: 600,
                                            color: 'var(--text-main)' } }, b.name),
                                        e('div', { style: { fontSize: 10, color: oc,
                                            fontWeight: 700, marginTop: 1 } }, ot)
                                    ),
                                    e('div', { style: { fontSize: 13, fontWeight: 700,
                                        color: 'var(--text-main)', flexShrink: 0 } },
                                        fc(b.amountCents))
                                );
                            })
                        )
                )
            ),

            // ── ROW 4: category spending ───────────────────────────────────
            e('div', { className: 'bn-cell bn-categories' },
                e('div', { style: { display:'flex', alignItems:'center', gap:8 } },
                    e(BentoLabel, { style: { marginBottom:0 } }, 'Category Spending'),
                    window.HelpTooltip && e(window.HelpTooltip, { text: 'Your spending per category this month. Set budget limits in Limits tab to track against caps.' })
                ),
                e('div', { className: 'bn-cat-grid' },
                    catItems.map(({ k, val, lim, pct, col }) =>
                        e('div', { key: k, className: 'bn-cat-item' },
                            e('div', { style: { display: 'flex',
                                justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 } },
                                e('span', { style: { fontSize: 12, fontWeight: 600,
                                    color: 'var(--text-light)' } }, k),
                                lim && e('span', { style: { fontSize: 11, fontWeight: 700, color: col } },
                                    `${Math.round(pct * 100)}%`)
                            ),
                            e('div', { style: { fontSize: 14, fontWeight: 700,
                                color: 'var(--text-main)', marginBottom: 2 } },
                                lim ? fc(val)
                                    : e('span', { style: { fontSize: 12, color: 'var(--text-muted)',
                                        fontWeight: 500 } }, fc(val))
                            ),
                            lim && e('div', { style: { fontSize: 10, color: 'var(--text-muted)',
                                marginBottom: 4 } }, `of ${fc(lim)}`),
                    e(ThinBar, { pct: lim ? pct : 0, color: col })
                        )
                    )
                )
            ),

            // FIX #7: Recent Activity feed — shows latest transactions
            RecentActivitySection && e(RecentActivitySection, { incomes, dailyExpenses, bills, txns, funds, wallets, archives, fc, onNavigate })
        );
    }

    window.DashboardOverview = DashboardOverview;
})();