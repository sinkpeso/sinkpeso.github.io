// tests/finance.test.js — Unit tests for finance.js
const assert = require('assert');

global.window = {};
require('../finance.js');
const fin = window.finance;

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

console.log('\n── finance.js ──');

// ── deriveWalletBalance ──
test('deriveWalletBalance: opening + income - expense', () => {
    const wallet = { id: 'w1', openingBalanceCents: 10000 };
    const sources = {
        incomes: [{ walletId: 'w1', amountCents: 5000 }],
        dailyExpenses: [{ walletId: 'w1', amountCents: 2000 }],
        txns: []
    };
    assert.strictEqual(fin.deriveWalletBalance(wallet, sources), 13000);
});

test('deriveWalletBalance: no sources = opening balance', () => {
    const wallet = { id: 'w1', openingBalanceCents: 5000 };
    assert.strictEqual(fin.deriveWalletBalance(wallet, {}), 5000);
});

test('deriveWalletBalance: empty wallet + no sources = 0', () => {
    const wallet = { id: 'w1' };
    assert.strictEqual(fin.deriveWalletBalance(wallet, {}), 0);
});

test('deriveWalletBalance: vault deposit deducts from wallet', () => {
    const wallet = { id: 'w1', openingBalanceCents: 10000 };
    const sources = { txns: [{ walletId: 'w1', type: 'deposit', amountCents: 3000 }] };
    assert.strictEqual(fin.deriveWalletBalance(wallet, sources), 7000);
});

test('deriveWalletBalance: vault withdrawal adds to wallet', () => {
    const wallet = { id: 'w1', openingBalanceCents: 10000 };
    const sources = { txns: [{ walletId: 'w1', type: 'withdrawal', amountCents: 2000 }] };
    assert.strictEqual(fin.deriveWalletBalance(wallet, sources), 12000);
});

test('deriveWalletBalance: bill payment deducts from wallet', () => {
    const wallet = { id: 'w1', openingBalanceCents: 10000 };
    const sources = { txns: [{ walletId: 'w1', type: 'bill_payment', amountCents: 1500 }] };
    assert.strictEqual(fin.deriveWalletBalance(wallet, sources), 8500);
});

test('deriveWalletBalance: ignores other wallet txns', () => {
    const wallet = { id: 'w1', openingBalanceCents: 10000 };
    const sources = {
        incomes: [{ walletId: 'w2', amountCents: 99999 }],
        dailyExpenses: [{ walletId: 'w2', amountCents: 99999 }],
        txns: [{ walletId: 'w2', type: 'deposit', amountCents: 99999 }]
    };
    assert.strictEqual(fin.deriveWalletBalance(wallet, sources), 10000);
});

// ── getWalletDelta ──
test('getWalletDelta: returns 0 for unknown wallet', () => {
    assert.strictEqual(fin.getWalletDelta('unknown', {}), 0);
});

test('getWalletDelta: returns 0 for null walletId', () => {
    assert.strictEqual(fin.getWalletDelta(null, { incomes: [{ amountCents: 100 }] }), 0);
});

test('getWalletDelta: sums income, expenses, and txns', () => {
    const sources = {
        incomes: [{ walletId: 'w1', amountCents: 10000 }],
        dailyExpenses: [{ walletId: 'w1', amountCents: 3000 }],
        txns: [{ walletId: 'w1', type: 'bill_payment', amountCents: 2000 }]
    };
    assert.strictEqual(fin.getWalletDelta('w1', sources), 5000);
});

// ── deriveWallets ──
test('deriveWallets: returns array with computed balances', () => {
    const wallets = [
        { id: 'w1', openingBalanceCents: 10000 },
        { id: 'w2', openingBalanceCents: 5000 }
    ];
    const sources = { incomes: [{ walletId: 'w1', amountCents: 2000 }], dailyExpenses: [], txns: [] };
    const result = fin.deriveWallets(wallets, sources);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].balanceCents, 12000);
    assert.strictEqual(result[1].balanceCents, 5000);
});

test('deriveWallets: handles null input', () => {
    const result = fin.deriveWallets(null, {});
    assert.deepStrictEqual(result, []);
});

// ── validateExpenseWalletBalance ──
test('validateExpense: ok when no walletId', () => {
    const result = fin.validateExpenseWalletBalance([], null, 1000);
    assert.strictEqual(result.ok, true);
});

test('validateExpense: ok when balance sufficient', () => {
    const wallets = [{ id: 'w1', balanceCents: 5000 }];
    const result = fin.validateExpenseWalletBalance(wallets, 'w1', 3000);
    assert.strictEqual(result.ok, true);
});

test('validateExpense: fails when balance insufficient', () => {
    const wallets = [{ id: 'w1', balanceCents: 1000 }];
    const result = fin.validateExpenseWalletBalance(wallets, 'w1', 3000);
    assert.strictEqual(result.ok, false);
    assert.ok(result.error);
});

test('validateExpense: fails when wallet not found', () => {
    const result = fin.validateExpenseWalletBalance([], 'missing', 1000);
    assert.strictEqual(result.ok, false);
});

test('validateExpense: fails on zero amount', () => {
    const wallets = [{ id: 'w1', balanceCents: 5000 }];
    assert.throws(() => fin.validateExpenseWalletBalance(wallets, 'w1', 0));
});

// ── processFinancialTransaction ──
test('processFinancialTransaction: validates expense amount', () => {
    const result = fin.processFinancialTransaction({ type: 'expense', amountCents: 1000 });
    assert.strictEqual(result.ok, true);
});

test('processFinancialTransaction: rejects zero expense', () => {
    const result = fin.processFinancialTransaction({ type: 'expense', amountCents: 0 });
    assert.strictEqual(result.ok, false);
});

test('processFinancialTransaction: bill_payment requires wallet', () => {
    const result = fin.processFinancialTransaction({ type: 'bill_payment', amountCents: 1000, walletId: null });
    assert.strictEqual(result.ok, false);
});

test('processFinancialTransaction: bill_payment checks balance', () => {
    const wallets = [{ id: 'w1', balanceCents: 500 }];
    const result = fin.processFinancialTransaction({ type: 'bill_payment', amountCents: 1000, walletId: 'w1', wallets });
    assert.strictEqual(result.ok, false);
});

test('processFinancialTransaction: bill_payment ok with sufficient funds', () => {
    const wallets = [{ id: 'w1', balanceCents: 5000 }];
    const result = fin.processFinancialTransaction({ type: 'bill_payment', amountCents: 1000, walletId: 'w1', wallets });
    assert.strictEqual(result.ok, true);
});

test('processFinancialTransaction: vault_deposit checks balance', () => {
    const wallets = [{ id: 'w1', balanceCents: 500 }];
    const result = fin.processFinancialTransaction({ type: 'vault_deposit', amountCents: 1000, walletId: 'w1', wallets });
    assert.strictEqual(result.ok, false);
});

test('processFinancialTransaction: unknown type returns error', () => {
    const result = fin.processFinancialTransaction({ type: 'bogus' });
    assert.strictEqual(result.ok, false);
});

// ── migrateWallets ──
test('migrateWallets: adds openingBalanceCents to legacy wallets', () => {
    const wallets = [{ id: 'w1', balanceCents: 5000 }];
    const sources = { incomes: [], dailyExpenses: [], txns: [] };
    const result = fin.migrateWallets(wallets, sources);
    assert.strictEqual(result[0].openingBalanceCents, 5000);
});

test('migrateWallets: skips wallets that already have openingBalanceCents', () => {
    const wallets = [{ id: 'w1', openingBalanceCents: 10000, balanceCents: 5000 }];
    const result = fin.migrateWallets(wallets, {});
    assert.strictEqual(result[0].openingBalanceCents, 10000);
});

// ── checkIncomeDeleteSafe ──
test('checkIncomeDeleteSafe: safe when no walletId', () => {
    const result = fin.checkIncomeDeleteSafe(null, 1000, []);
    assert.strictEqual(result.safe, true);
});

test('checkIncomeDeleteSafe: safe when wallet has enough balance', () => {
    const wallets = [{ id: 'w1', balanceCents: 5000 }];
    const result = fin.checkIncomeDeleteSafe('w1', 3000, wallets);
    assert.strictEqual(result.safe, true);
    assert.strictEqual(result.projectedBalance, 2000);
});

test('checkIncomeDeleteSafe: unsafe when wallet goes negative', () => {
    const wallets = [{ id: 'w1', balanceCents: 1000 }];
    const result = fin.checkIncomeDeleteSafe('w1', 3000, wallets);
    assert.strictEqual(result.safe, false);
    assert.strictEqual(result.projectedBalance, -2000);
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exitCode = 1;