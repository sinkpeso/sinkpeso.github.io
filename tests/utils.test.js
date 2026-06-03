// tests/utils.test.js — Unit tests for utils.js
const assert = require('assert');

// Simulate browser environment
global.window = {};
require('../utils.js');
const { tc, uid, todayStr, safeDiv, addMonths, getDaysRemaining } = window.utils;

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

console.log('\n── utils.js ──');

// tc (to cents)
test('tc converts 12.5 to 1250', () => assert.strictEqual(tc(12.5), 1250));
test('tc converts "12.5" string to 1250', () => assert.strictEqual(tc("12.5"), 1250));
test('tc converts 0 to 0', () => assert.strictEqual(tc(0), 0));
test('tc converts "" to 0', () => assert.strictEqual(tc(""), 0));
test('tc converts null to 0', () => assert.strictEqual(tc(null), 0));
test('tc converts undefined to 0', () => assert.strictEqual(tc(undefined), 0));
test('tc rounds 12.345 to 1235', () => assert.strictEqual(tc(12.345), 1235));
test('tc converts 0.01 to 1', () => assert.strictEqual(tc(0.01), 1));
test('tc converts 100 to 10000', () => assert.strictEqual(tc(100), 10000));

// uid
test('uid returns string', () => assert.strictEqual(typeof uid(), 'string'));
test('uid contains dash', () => assert.ok(uid().includes('-')));
test('uid produces unique values', () => assert.notStrictEqual(uid(), uid()));

// todayStr
test('todayStr returns YYYY-MM-DD format', () => assert.match(todayStr(), /^\d{4}-\d{2}-\d{2}$/));
test('todayStr returns today', () => {
    const expected = new Date().toISOString().slice(0, 10);
    assert.strictEqual(todayStr(), expected);
});

// safeDiv
test('safeDiv 10/2 = 5', () => assert.strictEqual(safeDiv(10, 2), 5));
test('safeDiv 0/2 = 0', () => assert.strictEqual(safeDiv(0, 2), 0));
test('safeDiv 10/0 = 0 (no Infinity)', () => assert.strictEqual(safeDiv(10, 0), 0));
test('safeDiv 0/0 = 0', () => assert.strictEqual(safeDiv(0, 0), 0));
test('safeDiv -10/2 = -5', () => assert.strictEqual(safeDiv(-10, 2), -5));

// addMonths
test('addMonths adds 1 month to 2024-01-15', () => assert.strictEqual(addMonths('2024-01-15', 1), '2024-02-15'));
test('addMonths adds 12 months', () => assert.strictEqual(addMonths('2024-01-15', 12), '2025-01-15'));
test('addMonths handles Dec→Jan rollover', () => assert.strictEqual(addMonths('2024-12-15', 1), '2025-01-15'));
test('addMonths with null returns today', () => assert.strictEqual(addMonths(null, 1), todayStr()));
test('addMonths with empty string returns today', () => assert.strictEqual(addMonths('', 1), todayStr()));

// getDaysRemaining
test('getDaysRemaining returns number', () => assert.strictEqual(typeof getDaysRemaining('2099-12-31'), 'number'));
test('getDaysRemaining with null returns null', () => assert.strictEqual(getDaysRemaining(null), null));
test('getDaysRemaining with undefined returns null', () => assert.strictEqual(getDaysRemaining(undefined), null));
test('getDaysRemaining for today returns 0', () => assert.strictEqual(getDaysRemaining(todayStr()), 0));
test('getDaysRemaining for tomorrow returns 1', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    assert.strictEqual(getDaysRemaining(tomorrow), 1);
});
test('getDaysRemaining for yesterday returns -1', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    assert.strictEqual(getDaysRemaining(yesterday), -1);
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exitCode = 1;