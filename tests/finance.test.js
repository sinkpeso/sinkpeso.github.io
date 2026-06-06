// Unit tests for finance.js
// Run: node tests/finance.test.js

const assert = require('assert');

// Mock browser globals
global.window = { utils: null };

// Load dependencies
require('../utils.js');
require('../finance.js');

const fin = window.finance;

// ── ensureIntCents ──
// (exposed indirectly via deriveWalletBalance etc.)

// ── getWalletDelta ──
assert.strictEqual(fin.getWalletDelta(null, {}), 0, 'getWalletDelta(null) = 0');
assert.strictEqual(fin.getWalletDelta('w1', {}), 0, 'getWalletDelta empty sources = 0');

const sources1 = {
    incomes: [{ walletId: 'w1', amountCents: 10000 }],
    dailyExpenses: [{ walletId: 'w1', amountCents: 3000 }],
    txns: []
};
assert.strictEqual(fin.getWalletDelta('w1', sources1), 7000, 'getWalletDelta income-expense');

const sources2 = {
    incomes: [],
    dailyExpenses: [],
    txns: [
        { walletId: 'w1', type: 'bill_payment', amountCents: 2000 },
        { walletId: 'w1', type: 'deposit', amountCents: 1000 },
        { walletId: 'w1', type: 'withdrawal', amountCents: 500 }
    ]
};
assert.strictEqual(fin.getWalletDelta('w1', sources2), -2500, 'getWalletDelta txns: -2000-1000+500');

// ── deriveWalletBalance ──
const wallet = { id: 'w1', openingBalanceCents: 5000 };
assert.strictEqual(fin.deriveWalletBalance(wallet, {}), 5000, 'deriveWalletBalance: opening only');
assert.strictEqual(fin.deriveWalletBalance(wallet, sources1), 12000, 'deriveWalletBalance: 5000+10000-3000');
assert.strictEqual(fin.deriveWalletBalance(null, {}), 0, 'deriveWalletBalance(null) = 0');
assert.strictEqual(fin.deriveWalletBalance({}, {}), 0, 'deriveWalletBalance no opening = 0');

// ── deriveWallets ──
const wallets = [
    { id: 'w1', openingBalanceCents: 5000 },
    { id: 'w2', openingBalanceCents: 3000 }
];
const derived = fin.deriveWallets(wallets, sources1);
assert.strictEqual(derived.length, 2, 'deriveWallets returns same count');
assert.strictEqual(derived[0].balanceCents, 12000, 'w1 balance');
assert.strictEqual(derived[1].balanceCents, 3000, 'w2 balance (no activity)');
assert.deepStrictEqual(fin.deriveWallets(null, {}), [], 'deriveWallets(null) = []');

// ── validateExpenseWalletBalance ──
const dw = [
    { id: 'w1', balanceCents: 5000 },
    { id: 'w2', balanceCents: 0 }
];
assert.deepStrictEqual(fin.validateExpenseWalletBalance(dw, null, 1000), { ok: true }, 'no wallet = ok');
assert.deepStrictEqual(fin.validateExpenseWalletBalance(dw, 'w1', 3000), { ok: true }, 'sufficient balance');
assert.strictEqual(fin.validateExpenseWalletBalance(dw, 'w1', 6000).ok, false, 'insufficient balance');
assert.strictEqual(fin.validateExpenseWalletBalance(dw, 'w2', 100).ok, false, 'empty wallet');
assert.strictEqual(fin.validateExpenseWalletBalance(dw, 'missing', 100).ok, false, 'wallet not found');

// ── migrateWallets ──
const legacy = [{ id: 'w1', balanceCents: 8000 }];
const migrated = fin.migrateWallets(legacy, {});
assert.strictEqual(migrated[0].openingBalanceCents, 8000, 'migrate adds openingBalanceCents');

const modern = [{ id: 'w1', openingBalanceCents: 5000, balanceCents: 10000 }];
const notMigrated = fin.migrateWallets(modern, {});
assert.strictEqual(notMigrated[0].openingBalanceCents, 5000, 'skip if already has openingBalanceCents');

// ── processFinancialTransaction ──
assert.strictEqual(fin.processFinancialTransaction({ type: 'expense', amountCents: 1000 }).ok, true, 'valid expense');
assert.strictEqual(fin.processFinancialTransaction({ type: 'expense', amountCents: 0 }).ok, false, 'zero expense');
assert.strictEqual(fin.processFinancialTransaction({ type: 'income', amountCents: 500 }).ok, true, 'valid income');
assert.strictEqual(fin.processFinancialTransaction({ type: 'bill_payment', amountCents: 500 }).ok, false, 'bill needs wallet');
assert.strictEqual(fin.processFinancialTransaction({ type: 'bill_payment', amountCents: 500, walletId: 'w1', wallets: [{ id: 'w1', balanceCents: 300 }] }).ok, false, 'bill insufficient');
assert.strictEqual(fin.processFinancialTransaction({ type: 'bill_payment', amountCents: 500, walletId: 'w1', wallets: [{ id: 'w1', balanceCents: 1000 }] }).ok, true, 'bill sufficient');
assert.strictEqual(fin.processFinancialTransaction({ type: 'vault_deposit', amountCents: 500, walletId: 'w1', wallets: [{ id: 'w1', balanceCents: 300 }] }).ok, false, 'vault_deposit insufficient');
assert.strictEqual(fin.processFinancialTransaction({ type: 'unknown_type' }).ok, false, 'unknown type');

// ── checkIncomeDeleteSafe ──
assert.deepStrictEqual(fin.checkIncomeDeleteSafe(null, 1000, []), { safe: true, walletName: null, projectedBalance: 0 }, 'no wallet = safe');
assert.deepStrictEqual(fin.checkIncomeDeleteSafe('w1', 3000, [{ id: 'w1', balanceCents: 5000 }]), { safe: true, walletName: undefined, projectedBalance: 2000 }, 'safe delete');
assert.deepStrictEqual(fin.checkIncomeDeleteSafe('w1', 6000, [{ id: 'w1', balanceCents: 5000 }]), { safe: false, walletName: undefined, projectedBalance: -1000 }, 'unsafe delete');

// ── wallet_transfer: getWalletDelta ──
const transferSources = {
    incomes: [],
    dailyExpenses: [],
    txns: [
        { type: 'wallet_transfer', fromWalletId: 'w1', toWalletId: 'w2', amountCents: 5000 }
    ]
};
assert.strictEqual(fin.getWalletDelta('w1', transferSources), -5000, 'transfer: source wallet debited');
assert.strictEqual(fin.getWalletDelta('w2', transferSources), 5000, 'transfer: destination wallet credited');
assert.strictEqual(fin.getWalletDelta('w3', transferSources), 0, 'transfer: unrelated wallet unaffected');

// Transfer + other txns combined
const combinedSources = {
    incomes: [{ walletId: 'w1', amountCents: 10000 }],
    dailyExpenses: [{ walletId: 'w1', amountCents: 2000 }],
    txns: [
        { type: 'bill_payment', walletId: 'w1', amountCents: 1000 },
        { type: 'wallet_transfer', fromWalletId: 'w1', toWalletId: 'w2', amountCents: 3000 }
    ]
};
assert.strictEqual(fin.getWalletDelta('w1', combinedSources), 4000, 'combined: 10000-2000-1000-3000=4000');
assert.strictEqual(fin.getWalletDelta('w2', combinedSources), 3000, 'combined: w2 receives 3000 transfer');

// Derive balance with transfers
const wTransfer = { id: 'w1', openingBalanceCents: 5000 };
assert.strictEqual(fin.deriveWalletBalance(wTransfer, transferSources), 0, 'derive with transfer: 5000-5000=0');

// ── wallet_transfer: processFinancialTransaction ──
assert.strictEqual(
    fin.processFinancialTransaction({ type: 'wallet_transfer', fromWalletId: 'w1', toWalletId: 'w2', amountCents: 1000, wallets: [{ id: 'w1', balanceCents: 5000 }, { id: 'w2', balanceCents: 0 }] }).ok,
    true, 'valid transfer'
);
assert.strictEqual(
    fin.processFinancialTransaction({ type: 'wallet_transfer', fromWalletId: 'w1', toWalletId: 'w2', amountCents: 0, wallets: [{ id: 'w1', balanceCents: 5000 }] }).ok,
    false, 'zero amount transfer fails'
);
assert.strictEqual(
    fin.processFinancialTransaction({ type: 'wallet_transfer', fromWalletId: 'w1', toWalletId: 'w1', amountCents: 1000, wallets: [{ id: 'w1', balanceCents: 5000 }] }).ok,
    false, 'same source and dest fails'
);
assert.strictEqual(
    fin.processFinancialTransaction({ type: 'wallet_transfer', fromWalletId: 'w1', toWalletId: null, amountCents: 1000, wallets: [{ id: 'w1', balanceCents: 5000 }] }).ok,
    false, 'missing destination fails'
);
assert.strictEqual(
    fin.processFinancialTransaction({ type: 'wallet_transfer', fromWalletId: null, toWalletId: 'w2', amountCents: 1000, wallets: [{ id: 'w1', balanceCents: 5000 }] }).ok,
    false, 'missing source fails'
);
assert.strictEqual(
    fin.processFinancialTransaction({ type: 'wallet_transfer', fromWalletId: 'w1', toWalletId: 'w2', amountCents: 6000, wallets: [{ id: 'w1', balanceCents: 5000 }, { id: 'w2', balanceCents: 0 }] }).ok,
    false, 'insufficient funds fails'
);
assert.strictEqual(
    fin.processFinancialTransaction({ type: 'wallet_transfer', fromWalletId: 'missing', toWalletId: 'w2', amountCents: 1000, wallets: [{ id: 'w2', balanceCents: 0 }] }).ok,
    false, 'source wallet not found fails'
);
assert.strictEqual(
    fin.processFinancialTransaction({ type: 'wallet_transfer', fromWalletId: 'w1', toWalletId: 'missing', amountCents: 1000, wallets: [{ id: 'w1', balanceCents: 5000 }] }).ok,
    false, 'dest wallet not found fails'
);

console.log('✓ finance.js: all tests passed');
