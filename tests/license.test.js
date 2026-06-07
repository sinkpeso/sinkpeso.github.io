// Unit tests for license.js — HMAC-based key validation
// Run: node tests/license.test.js

const assert = require('assert');

// Mock localStorage
global.localStorage = {
    _store: {},
    getItem(k) { return this._store[k] || null; },
    setItem(k, v) { this._store[k] = String(v); },
    removeItem(k) { delete this._store[k]; },
    clear() { this._store = {}; }
};

// Mock window
global.window = {};

require('../license.js');

const lic = window.license;

// ── Pre-generated valid keys (generateKey no longer exported) ──
const key1 = "SINKPESO-VXWY-4Y35-46AV";
assert.ok(key1.startsWith("SINKPESO-"), 'key starts with SINKPESO-');
assert.ok(/^SINKPESO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key1), 'key matches format');
assert.strictEqual(lic.validateKey(key1), true, 'pre-generated key passes validation');

const key2 = "SINKPESO-VXWY-4X35-46AU";
assert.notStrictEqual(key1, key2, 'different keys are distinct');
assert.strictEqual(lic.validateKey(key2), true, 'second pre-generated key passes');

// ── validateKey rejects bad keys ──
assert.strictEqual(lic.validateKey(null), false, 'null rejected');
assert.strictEqual(lic.validateKey(""), false, 'empty rejected');
assert.strictEqual(lic.validateKey("garbage"), false, 'garbage rejected');
assert.strictEqual(lic.validateKey("SINKPESO-AAAA-BBBB-CCCC"), false, 'random AAAA key rejected');
assert.strictEqual(lic.validateKey("SINKPESO-1234-5678-9012"), false, 'sequential key rejected');

// ── activate / deactivate flow ──
localStorage.clear();
assert.strictEqual(lic.isPremium(), false, 'not premium initially');

const result = lic.activate(key1);
assert.strictEqual(result.ok, true, 'activate succeeds');
assert.strictEqual(lic.isPremium(), true, 'premium after activate');

lic.deactivate();
assert.strictEqual(lic.isPremium(), false, 'not premium after deactivate');

// ── feature gating ──
localStorage.clear();
const limits = lic.getLimits();
assert.strictEqual(limits.wallets, 3, 'free: 3 wallets');
assert.strictEqual(limits.vaults, 2, 'free: 2 vaults');
assert.strictEqual(limits.encryptedBackup, false, 'free: no encrypted backup');
assert.strictEqual(limits.recurring, false, 'free: no recurring');

assert.strictEqual(lic.canAddItem("wallets", 2), true, 'can add 3rd wallet');
assert.strictEqual(lic.canAddItem("wallets", 3), false, 'cannot add 4th wallet');
assert.strictEqual(lic.getRemaining("wallets", 1), 2, '2 wallets remaining');

// Premium limits
lic.activate(key1);
const pLimits = lic.getLimits();
assert.strictEqual(pLimits.wallets, Infinity, 'premium: unlimited wallets');
assert.strictEqual(pLimits.encryptedBackup, true, 'premium: encrypted backup');
assert.strictEqual(lic.canAddItem("wallets", 999), true, 'premium: unlimited add');

console.log('✓ license.js: all tests passed');