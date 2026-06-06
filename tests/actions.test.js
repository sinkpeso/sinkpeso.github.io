// Unit tests for actions.js
// Run: node tests/actions.test.js
//
// Tests the 6 state mutation functions: addExpense, editExpense,
// deleteExpense, addIncome, editIncome, deleteIncome.

const assert = require('assert');

// Mock localStorage
global.localStorage = {
    _store: {},
    getItem(k) { return this._store[k] || null; },
    setItem(k, v) { this._store[k] = String(v); },
    removeItem(k) { delete this._store[k]; },
    clear() { this._store = {}; }
};

// Mock crypto.subtle for hashPin
global.crypto = {
    subtle: { digest: () => Promise.resolve(new ArrayBuffer(32)) }
};
global.TextEncoder = TextEncoder;

// Mock window
global.window = {};

// Load dependencies in order
require('../utils.js');
require('../persistence.js');
require('../finance.js');
require('../actions.js');

const actions = window.actions;

// ── Test helpers ────────────────────────────────────────────────────────
// Simulate React setState: captures the value passed to the setter
function createSetter(initial) {
    let value = initial;
    const setter = (update) => {
        if (typeof update === 'function') {
            value = update(value);
        } else {
            value = update;
        }
    };
    setter.get = () => value;
    return setter;
}

const { tc, uid, todayStr } = window.utils;

// ── addExpense ──────────────────────────────────────────────────────────
const exp1 = { id: 'exp-1', name: 'Lunch', amountCents: 500, category: 'Food', date: '2024-01-15', walletId: 'w1', recurring: 'none' };
const wallets1 = [{ id: 'w1', name: 'Cash', openingBalanceCents: 1000 }];
const setDExp1 = createSetter([]);
const setW1 = createSetter(wallets1);

actions.addExpense({ rec: exp1, wallets: wallets1, setDailyExpenses: setDExp1, setWallets: setW1 });

assert.strictEqual(setDExp1.get().length, 1, 'addExpense appends to dailyExpenses');
assert.strictEqual(setDExp1.get()[0].id, 'exp-1', 'addExpense preserves expense id');

// ── deleteExpense ───────────────────────────────────────────────────────
const exp2 = { id: 'exp-2', name: 'Dinner', amountCents: 800, category: 'Food', date: '2024-01-16', walletId: 'w2' };
const setDExp2 = createSetter([exp2]);
const setW2 = createSetter([{ id: 'w2', name: 'GCash', openingBalanceCents: 2000 }]);

actions.deleteExpense({ id: 'exp-2', dailyExpenses: setDExp2.get(), setDailyExpenses: setDExp2, wallets: setW2.get(), setWallets: setW2 });

assert.strictEqual(setDExp2.get().length, 0, 'deleteExpense removes from array');

// ── addIncome ───────────────────────────────────────────────────────────
const inc1 = { id: 'inc-1', name: 'Salary', amountCents: 50000, date: '2024-01-01', walletId: 'w3' };
const setInc1 = createSetter([]);
const setW3 = createSetter([{ id: 'w3', name: 'Cash', openingBalanceCents: 0 }]);

actions.addIncome({ rec: inc1, wallets: setW3.get(), setIncomes: setInc1, setWallets: setW3 });

assert.strictEqual(setInc1.get().length, 1, 'addIncome appends to incomes');
assert.strictEqual(setInc1.get()[0].name, 'Salary', 'addIncome preserves name');

// ── deleteIncome ────────────────────────────────────────────────────────
const inc2 = { id: 'inc-2', name: 'Freelance', amountCents: 10000, walletId: 'w4' };
const setInc2 = createSetter([inc2]);
const setW4 = createSetter([{ id: 'w4', name: 'Maya', openingBalanceCents: 5000 }]);

actions.deleteIncome({ id: 'inc-2', incomes: setInc2.get(), setIncomes: setInc2, wallets: setW4.get(), setWallets: setW4 });

assert.strictEqual(setInc2.get().length, 0, 'deleteIncome removes from array');

// ── editExpense ─────────────────────────────────────────────────────────
const oldExp = { id: 'exp-3', name: 'Old', amountCents: 300, category: 'Food', date: '2024-01-20', walletId: 'w5' };
const setDExp3 = createSetter([oldExp]);
const setW5 = createSetter([{ id: 'w5', name: 'Cash', openingBalanceCents: 5000 }]);

actions.editExpense({
    expId: 'exp-3',
    editForm: { name: 'New', amount: '5.00', category: 'Gas', walletId: 'w5' },
    oldRecord: oldExp,
    wallets: setW5.get(),
    dailyExpenses: setDExp3.get(),
    setDailyExpenses: setDExp3,
    setWallets: setW5
});

assert.strictEqual(setDExp3.get().length, 1, 'editExpense keeps array same length');
assert.strictEqual(setDExp3.get()[0].name, 'New', 'editExpense updates name');
assert.strictEqual(setDExp3.get()[0].amountCents, 500, 'editExpense updates amount');

// ── editIncome ──────────────────────────────────────────────────────────
const oldInc = { id: 'inc-3', name: 'Old Salary', amountCents: 30000, walletId: 'w6' };
const setInc3 = createSetter([oldInc]);
const setW6 = createSetter([{ id: 'w6', name: 'Cash', openingBalanceCents: 10000 }]);

actions.editIncome({
    incId: 'inc-3',
    editForm: { name: 'New Salary', amount: '400.00', walletId: 'w6' },
    oldRecord: oldInc,
    wallets: setW6.get(),
    incomes: setInc3.get(),
    setIncomes: setInc3,
    setWallets: setW6
});

assert.strictEqual(setInc3.get().length, 1, 'editIncome keeps array same length');
assert.strictEqual(setInc3.get()[0].name, 'New Salary', 'editIncome updates name');
assert.strictEqual(setInc3.get()[0].amountCents, 40000, 'editIncome updates amount');

// ── transferBetweenWallets ──────────────────────────────────────────────
const fromWallet = { id: 'wf1', name: 'Cash', openingBalanceCents: 10000, balanceCents: 10000 };
const toWallet = { id: 'wf2', name: 'GCash', openingBalanceCents: 0, balanceCents: 0 };
const transferWallets = [fromWallet, toWallet];
const setTxns1 = createSetter([]);

const transferRec = {
    id: 'xfer-1',
    type: 'wallet_transfer',
    fromWalletId: 'wf1',
    toWalletId: 'wf2',
    amountCents: 3000,
    date: '2024-02-01',
    note: 'Cash to GCash',
    fromWalletNameSnapshot: 'Cash',
    toWalletNameSnapshot: 'GCash'
};

const transferResult = actions.transferBetweenWallets({
    rec: transferRec,
    wallets: transferWallets,
    setTxns: setTxns1
});

assert.strictEqual(transferResult.ok, true, 'transferBetweenWallets succeeds');
assert.strictEqual(setTxns1.get().length, 1, 'transferBetweenWallets appends txn');
assert.strictEqual(setTxns1.get()[0].type, 'wallet_transfer', 'transfer txn has correct type');
assert.strictEqual(setTxns1.get()[0].fromWalletId, 'wf1', 'transfer txn has fromWalletId');
assert.strictEqual(setTxns1.get()[0].toWalletId, 'wf2', 'transfer txn has toWalletId');

// Transfer with insufficient funds should fail
const poorWallets = [
    { id: 'wf3', name: 'Wallet A', openingBalanceCents: 500, balanceCents: 500 },
    { id: 'wf4', name: 'Wallet B', openingBalanceCents: 0, balanceCents: 0 }
];
const setTxns2 = createSetter([]);

const failedTransfer = actions.transferBetweenWallets({
    rec: {
        id: 'xfer-2',
        type: 'wallet_transfer',
        fromWalletId: 'wf3',
        toWalletId: 'wf4',
        amountCents: 1000,
        date: '2024-02-01',
        fromWalletNameSnapshot: 'Wallet A',
        toWalletNameSnapshot: 'Wallet B'
    },
    wallets: poorWallets,
    setTxns: setTxns2
});

assert.strictEqual(failedTransfer.ok, false, 'transferBetweenWallets fails with insufficient funds');
assert.strictEqual(setTxns2.get().length, 0, 'failed transfer does not add txn');
assert.ok(failedTransfer.error.includes('Insufficient'), 'error message mentions insufficient');

// Same wallet transfer should fail
const setTxns3 = createSetter([]);
const sameWalletTransfer = actions.transferBetweenWallets({
    rec: {
        id: 'xfer-3',
        type: 'wallet_transfer',
        fromWalletId: 'wf1',
        toWalletId: 'wf1',
        amountCents: 1000,
        date: '2024-02-01',
        fromWalletNameSnapshot: 'Cash',
        toWalletNameSnapshot: 'Cash'
    },
    wallets: transferWallets,
    setTxns: setTxns3
});

assert.strictEqual(sameWalletTransfer.ok, false, 'same wallet transfer fails');
assert.strictEqual(setTxns3.get().length, 0, 'same wallet transfer does not add txn');

console.log('✓ actions.js: all tests passed');
