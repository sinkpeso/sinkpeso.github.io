// tests/selectors.test.js — Unit tests for selectors.js
const assert = require('assert');

global.window = {};
require('../utils.js');
require('../selectors.js');
const sel = window.selectors;

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (e) {
        failed++;
        console.log(`  ✗ ${name}`);
        console.log(`    ${e.message}`);
    }
}

console.log('\n── selectors.js ──');

// ── computeTotals ──
test('computeTotals: empty state returns zeros', () => {
    const t = sel.computeTotals({ incomes: [], bills: [], funds: [], txns: [], dailyExpenses: [] });
    assert.strictEqual(t.totalIncome, 0);
    assert.strictEqual(t.paidBills, 0);
    assert.strictEqual(t.unpaidBills, 0);
    assert.strictEqual(t.totalDailySpent, 0);
    assert.strictEqual(t.totalInGoals, 0);
    assert.strictEqual(t.netAvailable, 0);
});

test('computeTotals: sums income correctly', () => {
    const t = sel.computeTotals({
        incomes: [{ amountCents: 10000 }, { amountCents: 5000 }],
        bills: [], funds: [], txns: [], dailyExpenses: []
    });
    assert.strictEqual(t.totalIncome, 15000);
    assert.strictEqual(t.netAvailable, 15000);
});

test('computeTotals: separates paid vs unpaid bills', () => {
    const t = sel.computeTotals({
        incomes: [],
        bills: [{ amountCents: 3000, isPaid: true }, { amountCents: 2000, isPaid: false }],
        funds: [], txns: [], dailyExpenses: []
    });
    assert.strictEqual(t.paidBills, 3000);
    assert.strictEqual(t.unpaidBills, 2000);
});

test('computeTotals: sums daily expenses', () => {
    const t = sel.computeTotals({
        incomes: [{ amountCents: 10000 }],
        bills: [],
        funds: [],
        txns: [],
        dailyExpenses: [{ amountCents: 1500 }, { amountCents: 2500 }]
    });
    assert.strictEqual(t.totalDailySpent, 4000);
    assert.strictEqual(t.netAvailable, 6000);
});

test('computeTotals: vault deposits reduce net available', () => {
    const t = sel.computeTotals({
        incomes: [{ amountCents: 10000 }],
        bills: [],
        funds: [{ id: 'f1', startCents: 0, goalCents: 5000 }],
        txns: [{ fundId: 'f1', type: 'deposit', amountCents: 2000 }],
        dailyExpenses: []
    });
    assert.strictEqual(t.totalInGoals, 2000);
    assert.strictEqual(t.netAvailable, 8000);
});

test('computeTotals: vault balance = start + deposits - withdrawals', () => {
    const t = sel.computeTotals({
        incomes: [],
        bills: [],
        funds: [{ id: 'f1', startCents: 1000, goalCents: 10000 }],
        txns: [
            { fundId: 'f1', type: 'deposit', amountCents: 3000 },
            { fundId: 'f1', type: 'withdrawal', amountCents: 500 }
        ],
        dailyExpenses: []
    });
    assert.strictEqual(t.totalInGoals, 3500);
    assert.strictEqual(t.enrichedFunds[0].bal, 3500);
});

test('computeTotals: category breakdown', () => {
    const t = sel.computeTotals({
        incomes: [],
        bills: [{ amountCents: 1000, isPaid: true, category: 'Bills' }],
        funds: [],
        txns: [],
        dailyExpenses: [
            { amountCents: 2000, category: 'Food' },
            { amountCents: 500, category: 'Gas' }
        ]
    });
    assert.strictEqual(t.catSum.Food, 2000);
    assert.strictEqual(t.catSum.Gas, 500);
    assert.strictEqual(t.catSum.Bills, 1000);
});

test('computeTotals: health status optimal when positive', () => {
    const t = sel.computeTotals({
        incomes: [{ amountCents: 100000 }],
        bills: [],
        funds: [],
        txns: [],
        dailyExpenses: []
    });
    assert.strictEqual(t.healthStatus.label, 'Optimal');
});

test('computeTotals: health status deficit when negative', () => {
    const t = sel.computeTotals({
        incomes: [{ amountCents: 1000 }],
        bills: [{ amountCents: 5000, isPaid: true }],
        funds: [],
        txns: [],
        dailyExpenses: []
    });
    assert.ok(t.netAvailable < 0);
    assert.strictEqual(t.healthStatus.label, '⚠️ Deficit');
});

// ── getWalletTotal ──
test('getWalletTotal: sums all wallet balances', () => {
    const wallets = [{ balanceCents: 1000 }, { balanceCents: 2000 }, { balanceCents: 500 }];
    assert.strictEqual(sel.getWalletTotal(wallets), 3500);
});

test('getWalletTotal: handles null', () => {
    assert.strictEqual(sel.getWalletTotal(null), 0);
});

test('getWalletTotal: handles empty array', () => {
    assert.strictEqual(sel.getWalletTotal([]), 0);
});

// ── getSpendPercentage ──
test('getSpendPercentage: returns 0 when no income', () => {
    assert.strictEqual(sel.getSpendPercentage({ totalIncome: 0, totalDailySpent: 100, paidBills: 50 }), 0);
});

test('getSpendPercentage: calculates correctly', () => {
    const totals = { totalIncome: 10000, totalDailySpent: 3000, paidBills: 2000 };
    assert.strictEqual(sel.getSpendPercentage(totals), 0.5);
});

test('getSpendPercentage: can exceed 1', () => {
    const totals = { totalIncome: 10000, totalDailySpent: 8000, paidBills: 5000 };
    assert.strictEqual(sel.getSpendPercentage(totals), 1.3);
});

// ── getDailySafeSpend ──
test('getDailySafeSpend: returns 0 for negative net', () => {
    const result = sel.getDailySafeSpend(-1000);
    assert.strictEqual(result.safeDailySpend, 0);
});

test('getDailySafeSpend: returns 0 for zero net', () => {
    const result = sel.getDailySafeSpend(0);
    assert.strictEqual(result.safeDailySpend, 0);
});

test('getDailySafeSpend: divides by days left', () => {
    const result = sel.getDailySafeSpend(10000);
    assert.ok(result.safeDailySpend > 0);
    assert.ok(result.daysLeft >= 1 && result.daysLeft <= 31);
});

// ── getUpcomingBills ──
test('getUpcomingBills: returns only unpaid bills', () => {
    const bills = [
        { id: 'b1', isPaid: true, dueDate: '2024-01-15' },
        { id: 'b2', isPaid: false, dueDate: '2024-01-20' },
        { id: 'b3', isPaid: false, dueDate: '2024-01-10' }
    ];
    const result = sel.getUpcomingBills(bills);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].id, 'b3'); // sorted ascending by date
    assert.strictEqual(result[1].id, 'b2');
});

test('getUpcomingBills: handles null', () => {
    assert.deepStrictEqual(sel.getUpcomingBills(null), []);
});

// ── getCategoryBudgetStatus ──
test('getCategoryBudgetStatus: returns status for each category', () => {
    const catSum = { Food: 3000, Gas: 500 };
    const budgets = [{ category: 'Food', limitCents: 5000 }];
    const categories = ['Food', 'Gas'];
    const result = sel.getCategoryBudgetStatus(catSum, budgets, categories);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].currentVal, 3000);
    assert.strictEqual(result[0].limit, 5000);
    assert.strictEqual(result[0].pct, 0.6);
    assert.strictEqual(result[1].limit, null);
});

// ── resolveWalletName ──
test('resolveWalletName: returns live wallet name', () => {
    const wallets = [{ id: 'w1', name: 'GCash' }];
    assert.strictEqual(sel.resolveWalletName('w1', 'old-snap', wallets), 'GCash');
});

test('resolveWalletName: falls back to snapshot when wallet missing', () => {
    assert.strictEqual(sel.resolveWalletName('missing', 'Old Name', []), 'Old Name');
});

test('resolveWalletName: returns null when no match', () => {
    assert.strictEqual(sel.resolveWalletName('missing', null, []), null);
});

// ── getRecentActivities ──
test('getRecentActivities: merges all sources', () => {
    const result = sel.getRecentActivities({
        dailyExpenses: [{ id: 'e1', name: 'Lunch', category: 'Food', amountCents: 500, date: '2024-06-01', walletId: null }],
        incomes: [{ id: 'i1', name: 'Salary', amountCents: 10000, date: '2024-06-01', walletId: null }],
        txns: [],
        bills: [],
        funds: [],
        wallets: [],
        archives: []
    });
    assert.strictEqual(result.length, 2);
});

test('getRecentActivities: respects limit', () => {
    const expenses = Array.from({ length: 20 }, (_, i) => ({
        id: `e${i}`, name: `Exp ${i}`, category: 'Food', amountCents: 100, date: '2024-06-01', walletId: null
    }));
    const result = sel.getRecentActivities({
        dailyExpenses: expenses, incomes: [], txns: [], bills: [], funds: [], wallets: [], archives: [], limit: 5
    });
    assert.strictEqual(result.length, 5);
});

// ── getAllTransactionItems ──
test('getAllTransactionItems: returns sorted by date desc', () => {
    const result = sel.getAllTransactionItems({
        dailyExpenses: [{ id: 'e1', name: 'Lunch', category: 'Food', amountCents: 500, date: '2024-06-01', walletId: null }],
        incomes: [{ id: 'i1', name: 'Salary', amountCents: 10000, date: '2024-06-05', walletId: null }],
        txns: [],
        bills: [],
        funds: [],
        wallets: []
    });
    assert.strictEqual(result[0].date, '2024-06-05');
    assert.strictEqual(result[1].date, '2024-06-01');
});

// ── getVaultTransactions ──
test('getVaultTransactions: filters to vault txns only', () => {
    const txns = [
        { id: 't1', fundId: 'f1', type: 'deposit' },
        { id: 't2', type: 'bill_payment' },
        { id: 't3', fundId: 'f2', type: 'withdrawal' }
    ];
    const result = sel.getVaultTransactions(txns);
    assert.strictEqual(result.length, 2);
});

// ── getArchiveChartData ──
test('getArchiveChartData: returns last N in chronological order', () => {
    const archives = [
        { id: 'a3', month: 'June 2024' },
        { id: 'a2', month: 'May 2024' },
        { id: 'a1', month: 'April 2024' }
    ];
    const result = sel.getArchiveChartData(archives, 2);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].month, 'May 2024');
    assert.strictEqual(result[1].month, 'June 2024');
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exitCode = 1;