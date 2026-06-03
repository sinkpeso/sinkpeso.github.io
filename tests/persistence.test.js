// Unit tests for persistence.js
// Run: node tests/persistence.test.js

const assert = require('assert');

// Mock localStorage
const store = {};
global.localStorage = {
    getItem(key) { return store[key] !== undefined ? store[key] : null; },
    setItem(key, val) { store[key] = String(val); },
    removeItem(key) { delete store[key]; },
    clear() { Object.keys(store).forEach(k => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key(i) { return Object.keys(store)[i] || null; }
};

// Mock crypto.subtle for hashPin
global.crypto = {
    subtle: {
        digest(algo, data) {
            // Simple mock: return a fixed hash
            const hex = "a".repeat(64);
            return Promise.resolve(new Uint8Array(Buffer.from(hex, 'hex')).buffer);
        }
    }
};
global.TextEncoder = TextEncoder;

// Mock window
global.window = {};

// Load the module
require('../persistence.js');

const persistence = window.persistence;

// ── KEYS MAP ──────────────────────────────────────────────────────────────
assert.ok(persistence.KEYS, 'KEYS should exist');
assert.strictEqual(persistence.KEYS.settings, 'sp_settings', 'KEYS.settings');
assert.strictEqual(persistence.KEYS.funds, 'sp_funds', 'KEYS.funds');
assert.strictEqual(persistence.KEYS.txns, 'sp_txns', 'KEYS.txns');
assert.strictEqual(persistence.KEYS.incomes, 'sp_incomes', 'KEYS.incomes');
assert.strictEqual(persistence.KEYS.bills, 'sp_bills', 'KEYS.bills');
assert.strictEqual(persistence.KEYS.daily, 'sp_daily', 'KEYS.daily');
assert.strictEqual(persistence.KEYS.archives, 'sp_archives', 'KEYS.archives');
assert.strictEqual(persistence.KEYS.budgets, 'sp_budgets', 'KEYS.budgets');
assert.strictEqual(persistence.KEYS.wallets, 'sp_wallets', 'KEYS.wallets');
assert.strictEqual(persistence.KEYS.photoDiary, 'sp_photo_diary', 'KEYS.photoDiary');

// ── loadState defaults ────────────────────────────────────────────────────
localStorage.clear();
const state = persistence.loadState();
assert.deepStrictEqual(state.settings, { currency: "PHP", theme: "dark", pin: "" }, 'default settings');
assert.deepStrictEqual(state.funds, [], 'default funds is []');
assert.deepStrictEqual(state.txns, [], 'default txns is []');
assert.deepStrictEqual(state.incomes, [], 'default incomes is []');
assert.deepStrictEqual(state.bills, [], 'default bills is []');
assert.deepStrictEqual(state.daily, [], 'default daily is []');
assert.deepStrictEqual(state.archives, [], 'default archives is []');
assert.deepStrictEqual(state.budgets, [], 'default budgets is []');
assert.deepStrictEqual(state.wallets, [], 'default wallets is []');
assert.deepStrictEqual(state.photoDiary, [], 'default photoDiary is []');

// ── saveKey + loadState round-trip ────────────────────────────────────────
localStorage.clear();
persistence.saveKey("settings", { currency: "USD", theme: "light", pin: "" });
const s2 = persistence.loadState();
assert.strictEqual(s2.settings.currency, 'USD', 'saved currency round-trips');
assert.strictEqual(s2.settings.theme, 'light', 'saved theme round-trips');

// ── saveKey with versioned envelope ───────────────────────────────────────
persistence.saveKey("funds", [{ id: "f1", name: "Emergency", iconId: "shield" }]);
const raw = localStorage.getItem("sp_funds");
const parsed = JSON.parse(raw);
assert.strictEqual(parsed._v, 2, 'envelope has schema version');
assert.ok(Array.isArray(parsed.data), 'envelope data is array');
assert.strictEqual(parsed.data[0].id, 'f1', 'envelope data preserves content');

// ── loadState reads versioned envelope ────────────────────────────────────
const s3 = persistence.loadState();
assert.strictEqual(s3.funds.length, 1, 'funds loaded from envelope');
assert.strictEqual(s3.funds[0].name, 'Emergency', 'fund name preserved');

// ── loadState handles legacy raw values (no _v) ──────────────────────────
localStorage.setItem("sp_bills", JSON.stringify([{ id: "b1", name: "Internet" }]));
const s4 = persistence.loadState();
assert.strictEqual(s4.bills.length, 1, 'legacy bills loaded');
assert.strictEqual(s4.bills[0].name, 'Internet', 'legacy bill name preserved');

// ── loadState handles corrupt JSON ────────────────────────────────────────
localStorage.setItem("sp_txns", "NOT JSON {{{");
const s5 = persistence.loadState();
assert.deepStrictEqual(s5.txns, [], 'corrupt txns falls back to []');

// ── loadState handles non-array where array expected ──────────────────────
localStorage.setItem("sp_funds", JSON.stringify({ _v: 2, data: "not an array" }));
const s6 = persistence.loadState();
assert.deepStrictEqual(s6.funds, [], 'non-array funds resets to []');

// ── clearState removes all keys ───────────────────────────────────────────
localStorage.clear();
persistence.saveKey("settings", { currency: "PHP", theme: "dark", pin: "" });
persistence.saveKey("funds", [{ id: "f1" }]);
persistence.saveKey("daily", [{ id: "d1" }]);
assert.ok(localStorage.getItem("sp_settings"), 'settings exists before clear');
assert.ok(localStorage.getItem("sp_funds"), 'funds exists before clear');
persistence.clearState();
assert.strictEqual(localStorage.getItem("sp_settings"), null, 'settings cleared');
assert.strictEqual(localStorage.getItem("sp_funds"), null, 'funds cleared');
assert.strictEqual(localStorage.getItem("sp_daily"), null, 'daily cleared');

// ── getRawKey ─────────────────────────────────────────────────────────────
assert.strictEqual(persistence.getRawKey("funds"), "sp_funds", 'getRawKey funds');
assert.strictEqual(persistence.getRawKey("unknown"), null, 'getRawKey unknown returns null');

// ── getAllRawKeys ─────────────────────────────────────────────────────────
const allKeys = persistence.getAllRawKeys();
assert.strictEqual(typeof allKeys, 'object', 'getAllRawKeys returns object');
assert.strictEqual(allKeys.funds, 'sp_funds', 'getAllRawKeys includes funds');
assert.strictEqual(allKeys.photoDiary, 'sp_photo_diary', 'getAllRawKeys includes photoDiary');

// ── getStorageUsage ───────────────────────────────────────────────────────
localStorage.clear();
persistence.saveKey("settings", { currency: "PHP", theme: "dark", pin: "" });
const usage = persistence.getStorageUsage();
assert.ok(usage.used > 0, 'storage used > 0');
assert.strictEqual(usage.quota, 5 * 1024 * 1024, 'quota is 5MB');
assert.ok(usage.pct >= 0 && usage.pct <= 1, 'pct between 0 and 1');
assert.strictEqual(typeof usage.usedMB, 'string', 'usedMB is string');
assert.strictEqual(typeof usage.quotaMB, 'string', 'quotaMB is string');

// ── SCHEMA_VERSION ────────────────────────────────────────────────────────
assert.strictEqual(persistence.SCHEMA_VERSION, 2, 'schema version is 2');

// ── hashPin ───────────────────────────────────────────────────────────────
assert.ok(typeof window.hashPin === 'function', 'hashPin is exported');

console.log('✓ persistence.js: all tests passed');