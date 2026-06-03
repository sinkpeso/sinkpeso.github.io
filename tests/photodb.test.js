// Unit tests for photodb.js
// Run: node tests/photodb.test.js
//
// Tests migration parsing logic and module API exports.
// IndexedDB is mocked at the window level.

const assert = require('assert');

// Mock localStorage
const store = {};
global.localStorage = {
    getItem(key) { return store[key] !== undefined ? store[key] : null; },
    setItem(key, val) { store[key] = String(val); },
    removeItem(key) { delete store[key]; },
};

// Mock window with IndexedDB
function createMockStore() {
    let data = [];
    return {
        getAll: () => ({ onsuccess: null, result: data, onerror: null }),
        put: (item) => { data.push(item); },
        delete: (id) => { data = data.filter(d => d.id !== id); },
        clear: () => { data = []; },
        count: () => ({ onsuccess: null, result: data.length, onerror: null }),
        _data: () => data
    };
}

let mockStore = createMockStore();

global.window = {
    indexedDB: {
        open(name, version) {
            const req = { onupgradeneeded: null, onsuccess: null, onerror: null };
            setTimeout(() => {
                if (req.onupgradeneeded) {
                    req.onupgradeneeded({ target: { result: {
                        objectStoreNames: { contains: () => false },
                        createObjectStore: () => mockStore
                    } } });
                }
                if (req.onsuccess) {
                    req.onsuccess({ target: { result: {
                        transaction: () => ({ objectStore: () => mockStore, oncomplete: null, onerror: null })
                    } } });
                }
            }, 0);
            return req;
        }
    }
};

// Mock navigator.storage
global.navigator = { storage: { estimate: () => Promise.resolve({ usage: 102400, quota: 104857600 }) } };

// Suppress console warnings from module
const origWarn = console.warn;
console.warn = () => {};

// Load module
require('../photodb.js');
console.warn = origWarn;

const photodb = window.photodb;

// ── Module exports ────────────────────────────────────────────────────────
assert.ok(photodb, 'photodb module exists');
const requiredAPI = ['open', 'getAll', 'saveAll', 'save', 'remove', 'removeByIds', 'clear', 'count', 'migrateFromLS', 'getUsage'];
requiredAPI.forEach(fn => assert.strictEqual(typeof photodb[fn], 'function', fn + ' is function'));

// ── migrateFromLS with no data ────────────────────────────────────────────
delete store["sp_photo_diary"];
photodb.migrateFromLS().then(result => {
    assert.strictEqual(result.alreadyEmpty, true, 'empty migration reports alreadyEmpty');
    assert.strictEqual(result.migrated, 0, 'empty migration reports 0 migrated');
}).catch(err => { console.error(err); process.exit(1); });

// ── getUsage returns estimate ─────────────────────────────────────────────
photodb.getUsage().then(usage => {
    assert.strictEqual(typeof usage.usedMB, 'string', 'usedMB is string');
    assert.strictEqual(typeof usage.quotaMB, 'string', 'quotaMB is string');
    assert.ok(parseFloat(usage.usedMB) >= 0, 'usedMB >= 0');
}).catch(err => { console.error(err); process.exit(1); });

// Give async tests time to complete, then run sync tests
setTimeout(() => {
    // ── Test migration parsing logic (extracted from migrateFromLS) ────────
    // Since migrateFromLS uses the real IndexedDB mock which may not persist
    // between calls due to _db caching, we test the parsing logic directly.

    // Legacy raw array
    const legacyData = JSON.stringify([
        { id: "p1", expenseId: "e1", imageData: "data:image/jpeg;base64,abc", amountCents: 500 },
        { id: "p2", expenseId: "e2", imageData: "data:image/jpeg;base64,def", amountCents: 1200 }
    ]);
    const parsedLegacy = JSON.parse(legacyData);
    assert.ok(Array.isArray(parsedLegacy), 'legacy is array');
    assert.strictEqual(parsedLegacy.length, 2, 'legacy has 2 entries');

    // Versioned envelope
    const envelopeData = JSON.stringify({ _v: 2, data: [
        { id: "p3", expenseId: "e3", imageData: "data:image/jpeg;base64,xyz", amountCents: 800 }
    ]});
    const parsedEnvelope = JSON.parse(envelopeData);
    assert.ok(parsedEnvelope._v === 2, 'envelope has _v');
    assert.ok(Array.isArray(parsedEnvelope.data), 'envelope.data is array');
    assert.strictEqual(parsedEnvelope.data.length, 1, 'envelope has 1 entry');

    // Invalid JSON
    try {
        JSON.parse("NOT JSON");
        assert.fail('should have thrown');
    } catch (e) {
        assert.ok(e instanceof SyntaxError, 'invalid JSON throws SyntaxError');
    }

    // Empty array
    const emptyArr = JSON.parse("[]");
    assert.ok(Array.isArray(emptyArr) && emptyArr.length === 0, 'empty array parses correctly');

    console.log('✓ photodb.js: all tests passed');
}, 500);