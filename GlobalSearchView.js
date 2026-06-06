// GlobalSearchView.js — Global search across all SINKPESO data
//
// Search overlay that filters across expenses, income, bills, transfers, and vaults.
// Client-side, works fully offline. Debounced input (300ms).
//
// Dependencies: React (global), Icon (global), selectors.js, utils.js

(function () {
    "use strict";
    const e = React.createElement;
    const { useState, useMemo, useEffect, useRef, useCallback } = React;

    // ── Search result item ─────────────────────────────────────────────────
    function SearchResultRow({ item, fc, onSelect }) {
        const Icon = window.Icon;
        return e('button', {
            className: 'gs-result',
            onClick: () => onSelect(item),
            style: {
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '12px 16px',
                background: 'transparent', border: 'none',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer', textAlign: 'left',
                fontFamily: 'inherit', transition: 'background 0.12s',
                minHeight: 56,
            }
        },
            e('div', {
                style: {
                    width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    background: item.amountColor + '15',
                    border: '1px solid ' + item.amountColor + '35',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }
            }, e(Icon, { name: item.icon, size: 16, color: item.amountColor })),
            e('div', { style: { flex: 1, minWidth: 0 } },
                e('div', {
                    style: {
                        fontSize: 13, fontWeight: 600, color: 'var(--text-main)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }
                }, item.title),
                e('div', {
                    style: {
                        fontSize: 11, color: 'var(--text-muted)', marginTop: 2,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }
                }, item.subtitle + (item.walletName ? ' · ' + item.walletName : '') + ' · ' + item.date)
            ),
            item.amountCents !== null && e('div', {
                style: {
                    fontSize: 13, fontWeight: 700, color: item.amountColor,
                    fontVariantNumeric: 'tabular-nums', flexShrink: 0,
                    whiteSpace: 'nowrap',
                }
            }, item.amountPrefix + fc(item.amountCents))
        );
    }

    // ── Main search component ──────────────────────────────────────────────
    function GlobalSearchView({ show, onClose, dailyExpenses, incomes, txns, bills, funds, wallets, fc, onNavigate }) {
        const [query, setQuery] = useState('');
        const [debouncedQuery, setDebouncedQuery] = useState('');
        const inputRef = useRef(null);
        const timerRef = useRef(null);
        const MAX_RESULTS = 50;

        // Focus input on mount
        useEffect(() => {
            if (show && inputRef.current) {
                setTimeout(() => inputRef.current && inputRef.current.focus(), 100);
            }
            return () => { if (timerRef.current) clearTimeout(timerRef.current); };
        }, [show]);

        // Reset on close
        useEffect(() => {
            if (!show) { setQuery(''); setDebouncedQuery(''); }
        }, [show]);

        // Debounce search input
        const handleInputChange = useCallback((val) => {
            setQuery(val);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setDebouncedQuery(val), 300);
        }, []);

        // Build unified items
        const allItems = useMemo(() => {
            if (!show) return [];
            return window.selectors.getAllTransactionItems({
                dailyExpenses, incomes, txns, bills, funds, wallets
            });
        }, [show, dailyExpenses, incomes, txns, bills, funds, wallets]);

        // Filter
        const results = useMemo(() => {
            const q = debouncedQuery.trim().toLowerCase();
            if (q.length < 2) return [];
            return allItems.filter(item =>
                item.title.toLowerCase().includes(q) ||
                item.subtitle.toLowerCase().includes(q) ||
                (item.walletName && item.walletName.toLowerCase().includes(q)) ||
                item.date.includes(q)
            ).slice(0, MAX_RESULTS);
        }, [allItems, debouncedQuery]);

        // Group by source for section headers
        const grouped = useMemo(() => {
            const groups = {};
            results.forEach(item => {
                const src = item.source || 'other';
                if (!groups[src]) groups[src] = [];
                groups[src].push(item);
            });
            return groups;
        }, [results]);

        const sourceLabels = {
            expense: 'Expenses',
            income: 'Income',
            bill: 'Bill Payments',
            vault: 'Vault Transactions',
            transfer: 'Transfers'
        };
        const sourceOrder = ['expense', 'income', 'bill', 'vault', 'transfer'];

        // Handle result click → navigate to relevant tab
        const handleSelect = useCallback((item) => {
            const navMap = {
                expense: 'daily',
                income: 'budget',
                bill: 'budget',
                vault: 'goals',
                transfer: 'wallets'
            };
            if (onNavigate && navMap[item.source]) {
                onNavigate(navMap[item.source]);
            }
            onClose();
        }, [onNavigate, onClose]);

        // Escape to close
        useEffect(() => {
            if (!show) return;
            const handler = (ev) => {
                if (ev.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handler);
            return () => window.removeEventListener('keydown', handler);
        }, [show, onClose]);

        if (!show) return null;

        const hasQuery = debouncedQuery.trim().length >= 2;
        const hasResults = results.length > 0;

        return e('div', {
            className: 'modal-overlay',
            onClick: onClose,
            style: { zIndex: 1200, alignItems: 'flex-start', paddingTop: '10vh' }
        },
            e('div', {
                onClick: ev => ev.stopPropagation(),
                style: {
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border)',
                    borderRadius: 18,
                    width: '100%',
                    maxWidth: 520,
                    maxHeight: '70vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                }
            },
                // Search input
                e('div', {
                    style: {
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '14px 16px',
                        borderBottom: '1px solid var(--border)',
                    }
                },
                    e(window.Icon, { name: 'zoomin', size: 18, color: 'var(--text-muted)' }),
                    e('input', {
                        ref: inputRef,
                        type: 'text',
                        placeholder: 'Search expenses, income, bills, transfers…',
                        value: query,
                        onChange: ev => handleInputChange(ev.target.value),
                        style: {
                            flex: 1, background: 'transparent', border: 'none',
                            color: 'var(--text-main)', fontSize: 15, fontWeight: 500,
                            outline: 'none', fontFamily: 'inherit',
                        }
                    }),
                    e('button', {
                        onClick: onClose,
                        style: {
                            background: 'var(--hover-bg)', border: 'none',
                            color: 'var(--text-muted)', fontSize: 12, fontWeight: 600,
                            padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                            fontFamily: 'inherit',
                        }
                    }, 'ESC')
                ),

                // Results
                e('div', {
                    style: {
                        flex: 1, overflowY: 'auto',
                        minHeight: 120, maxHeight: 'calc(70vh - 60px)',
                    }
                },
                    !hasQuery && e('div', {
                        style: {
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            padding: '32px 20px', textAlign: 'center',
                        }
                    },
                        e('div', { style: { fontSize: 32, marginBottom: 12, opacity: 0.3 } },
                            e(window.Icon, { name: 'zoomin', size: 32, color: 'var(--text-muted)' })),
                        e('div', { style: { fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' } },
                            'Type at least 2 characters to search'),
                        e('div', { style: { fontSize: 12, color: 'var(--text-muted)', marginTop: 6, opacity: 0.6 } },
                            'Search across expenses, income, bills, transfers, and vaults')
                    ),

                    hasQuery && !hasResults && e('div', {
                        style: {
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            padding: '32px 20px', textAlign: 'center',
                        }
                    },
                        e('div', { style: { fontSize: 32, marginBottom: 12, opacity: 0.3 } },
                            e(window.Icon, { name: 'search', size: 32, color: 'var(--text-muted)' })),
                        e('div', { style: { fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' } },
                            'No results for "' + debouncedQuery + '"'),
                        e('div', { style: { fontSize: 12, color: 'var(--text-muted)', marginTop: 6 } },
                            'Try a different search term')
                    ),

                    hasResults && sourceOrder.map(src => {
                        const items = grouped[src];
                        if (!items || items.length === 0) return null;
                        return e('div', { key: src },
                            e('div', {
                                style: {
                                    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                                    textTransform: 'uppercase', color: 'var(--text-muted)',
                                    padding: '10px 16px 6px',
                                    background: 'var(--hover-bg)',
                                }
                            }, (sourceLabels[src] || src) + ' (' + items.length + ')'),
                            items.map(item => e(SearchResultRow, {
                                key: item.id, item, fc, onSelect: handleSelect
                            }))
                        );
                    }),

                    hasResults && results.length >= MAX_RESULTS && e('div', {
                        style: {
                            fontSize: 11, color: 'var(--text-muted)',
                            textAlign: 'center', padding: '12px 16px',
                            fontWeight: 600,
                        }
                    }, 'Showing first ' + MAX_RESULTS + ' results. Refine your search for more.')
                )
            )
        );
    }

    // ── Expose ─────────────────────────────────────────────────────────────
    window.GlobalSearchView = GlobalSearchView;
})();