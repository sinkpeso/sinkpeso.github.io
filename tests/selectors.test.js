// Unit tests for selectors.js
// Run: node tests/selectors.test.js

const assert = require('assert');

// Mock browser globals
global.window = { utils: null };

// Load dependencies
require('../utils.js');
require('../selectors.js');

const sel = window.selectors;

// ── computeTotals ──
const emptyTotals = sel.computeTotals({
    incomes: [], bills: [], funds: [], txns: [], dailyExpenses: []
});
assert.strictEqual(emptyTotals.totalIncome, 0, 'empty: totalIncome=0');
assert.strictEqual(emptyTotals.paidBills, 0, 'empty: paidBills=0');
assert.strictEqual(emptyTotals.unpaidBills, 0, 'empty: unpaidBills=0');
assert.strictEqual(emptyTotals.totalDailySpent, 0, 'empty: totalDailySpent=0');
assert.strictEqual(emptyTotals.totalInGoals, 0, 'empty: totalInGoals=0');
assert.strictEqual(emptyTotals.netAvailable, 0, 'empty: netAvailable=0');

const t1 = sel.computeTotals({
    incomes: [{ amountCents: 50000 }],
    bills: [{ amountCents: 5000, isPaid: true }, { amountCents: 3000, isPaid: false }],
    funds: [],
    txns: [],
    dailyExpenses: [{ amountCents: 10000, category: 'Food' }, { amountCents: 5000, category: 'Gas' }]
});
assert.strictEqual(t1.totalIncome, 50000, 'income=50000');
assert.strictEqual(t1.paidBills, 5000, 'paidBills=5000');
assert.strictEqual(t1.unpaidBills, 3000, 'unpaidBills=3000');
assert.strictEqual(t1.totalDailySpent, 15000, 'totalDailySpent=15000');
assert.strictEqual(t1.netAvailable, 30000, 'netAvailable=50000-5000-15000-0');
assert.strictEqual(t1.catSum.Food, 10000, 'catSum.Food=10000');
assert.strictEqual(t1.catSum.Gas, 5000, 'catSum.Gas=5000');

// Funds/vaults
const t2 = sel.computeTotals({
    incomes: [{ amountCents: 100000 }],
    bills: [],
    funds: [{ id: 'f1', goalCents: 50000, startCents: 0 }],
    txns: [{ fundId: 'f1', type: 'deposit', amountCents: 20000 }],
    dailyExpenses: []
});
assert.strictEqual(t2.totalInGoals, 20000, 'totalInGoals=20000');
assert.strictEqual(t2.netAvailable, 80000, 'netAvailable=100000-20000');
assert.strictEqual(t2.enrichedFunds[0].bal, 20000, 'fund balance');
assert.ok(Math.abs(t2.enrichedFunds[0].pct - 0.4) < 0.001, 'fund pct=40%');

// Health status
const optimal = sel.computeTotals({ incomes: [{ amountCents: 100000 }], bills: [], funds: [], txns: [], dailyExpenses: [] });
assert.strictEqual(optimal.healthStatus.label, 'Optimal', 'health=Optimal');

const deficit = sel.computeTotals({ incomes: [{ amountCents: 1000 }], bills: [{ amountCents: 5000, isPaid: true }], funds: [], txns: [], dailyExpenses: [] });
assert.strictEqual(deficit.healthStatus.label, ' Deficit', 'health=Deficit');

// ── getWalletTotal ──
assert.strictEqual(sel.getWalletTotal([{ balanceCents: 1000 }, { balanceCents: 2000 }]), 3000, 'wallet total');
assert.strictEqual(sel.getWalletTotal([]), 0, 'empty wallets');
assert.strictEqual(sel.getWalletTotal(null), 0, 'null wallets');

// ── getSpendPercentage ──
assert.strictEqual(sel.getSpendPercentage({ totalIncome: 0, totalDailySpent: 100, paidBills: 50 }), 0, 'no income=0');
assert.strictEqual(sel.getSpendPercentage({ totalIncome: 10000, totalDailySpent: 3000, paidBills: 2000 }), 0.5, '50%');
assert.strictEqual(sel.getSpendPercentage({ totalIncome: 10000, totalDailySpent: 8000, paidBills: 4000 }), 1.2, '120% overspend');

// ── getDailySafeSpend ──
const dss1 = sel.getDailySafeSpend(30000);
assert.ok(dss1.safeDailySpend > 0, 'positive safe spend');
assert.ok(dss1.daysLeft >= 1 && dss1.daysLeft <= 31, 'valid daysLeft');

const dss2 = sel.getDailySafeSpend(-1000);
assert.strictEqual(dss2.safeDailySpend, 0, 'deficit=0 safe spend');

const dss3 = sel.getDailySafeSpend(0);
assert.strictEqual(dss3.safeDailySpend, 0, 'zero=0 safe spend');

// ── getUpcomingBills ──
const bills = [
    { id: 'b1', isPaid: true, dueDate: '2024-01-15' },
    { id: 'b2', isPaid: false, dueDate: '2024-01-20' },
    { id: 'b3', isPaid: false, dueDate: '2024-01-10' }
];
const upcoming = sel.getUpcomingBills(bills);
assert.strictEqual(upcoming.length, 2, '2 unpaid bills');
assert.strictEqual(upcoming[0].id, 'b3', 'sorted by date asc');
assert.deepStrictEqual(sel.getUpcomingBills([]), [], 'empty');
assert.deepStrictEqual(sel.getUpcomingBills(null), [], 'null');

// ── getCategoryBudgetStatus ──
const catSum = { Food: 8000, Gas: 2000 };
const budgets = [{ category: 'Food', limitCents: 10000 }];
const cbs = sel.getCategoryBudgetStatus(catSum, budgets, ['Food', 'Gas']);
assert.strictEqual(cbs[0].pct, 0.8, 'Food at 80%');
assert.strictEqual(cbs[1].limit, null, 'Gas has no budget');

// ── resolveWalletName ──
const wallets = [{ id: 'w1', name: 'GCash' }];
assert.strictEqual(sel.resolveWalletName('w1', 'old', wallets), 'GCash', 'live wallet');
assert.strictEqual(sel.resolveWalletName(null, 'old', wallets), 'old', 'null id → snapshot');
assert.strictEqual(sel.resolveWalletName('missing', null, wallets), null, 'missing → null');
assert.strictEqual(sel.resolveWalletName('missing', null, null), null, 'null wallets');

// ── getRecentActivities ──
const activities = sel.getRecentActivities({
    dailyExpenses: [{ id: 'e1', name: 'Lunch', category: 'Food', amountCents: 500, date: '2024-06-01', walletId: null }],
    incomes: [{ id: 'i1', name: 'Salary', amountCents: 10000, date: '2024-06-01', walletId: null }],
    txns: [],
    bills: [],
    funds: [],
    wallets: [],
    archives: []
});
assert.strictEqual(activities.length, 2, '2 activities');
assert.ok(activities[0].date >= activities[1].date, 'sorted desc');

// ── getAllTransactionItems ──
const allItems = sel.getAllTransactionItems({
    dailyExpenses: [{ id: 'e1', name: 'Coffee', category: 'Food', amountCents: 200, date: '2024-06-01', walletId: null }],
    incomes: [{ id: 'i1', name: 'Salary', amountCents: 50000, date: '2024-06-01', walletId: null }],
    txns: [{ id: 't1', type: 'bill_payment', billId: 'b1', amountCents: 3000, date: '2024-06-01', walletId: null }],
    bills: [{ id: 'b1', name: 'Electric' }],
    funds: [],
    wallets: []
});
assert.strictEqual(allItems.length, 3, '3 transaction items');

// ── getVaultTransactions ──
const vtxn = sel.getVaultTransactions([
    { id: 't1', fundId: 'f1', type: 'deposit' },
    { id: 't2', type: 'bill_payment' },
    { id: 't3', fundId: 'f2', type: 'withdrawal' }
]);
assert.strictEqual(vtxn.length, 2, '2 vault txns');

// ── getArchiveChartData ──
const archives = [
    { id: 'a3', month: 'June 2024' },
    { id: 'a2', month: 'May 2024' },
    { id: 'a1', month: 'April 2024' }
];
const chart = sel.getArchiveChartData(archives, 2);
assert.strictEqual(chart.length, 2, '2 archives');
assert.strictEqual(chart[0].month, 'May 2024', 'oldest first');
assert.strictEqual(chart[1].month, 'June 2024', 'newest last');

console.log('✓ selectors.js: all tests passed');