// archivedb.js — IndexedDB wrapper for SINKPESO month archives
//
// WHY: Archives grow unboundedly (full snapshots each month).
//      IndexedDB removes the localStorage 5-10MB ceiling.
//
// ARCHITECTURE:
//   - Async API (Promise-based) wrapping IndexedDB
//   - Single object store: "archives" keyed by entry id
//   - Migration helper to move existing localStorage data
//   - Falls back gracefully if IndexedDB unavailable
//
// DEPENDENCIES: none (pure browser APIs)
// LOAD ORDER: must come before index.html main script

(function () {
    "use strict";

    var DB_NAME = "sinkpeso_archives";
    var DB_VERSION = 1;
    var STORE_NAME = "archives";
    var LS_KEY = "sp_archives";

    var _db = null; // cached connection

    // ── OPEN DATABASE ──────────────────────────────────────────────────────
    function open() {
        if (_db) return Promise.resolve(_db);
        return new Promise(function (resolve, reject) {
            if (!window.indexedDB) {
                console.warn("[archivedb] IndexedDB not available");
                return reject(new Error("IndexedDB not supported"));
            }
            var req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = function (ev) {
                var db = ev.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: "id" });
                }
            };
            req.onsuccess = function (ev) {
                _db = ev.target.result;
                resolve(_db);
            };
            req.onerror = function (ev) {
                console.warn("[archivedb] open failed:", ev.target.error);
                reject(ev.target.error);
            };
        });
    }

    // ── GET ALL ARCHIVES ──────────────────────────────────────────────────
    function getAll() {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readonly");
                var store = tx.objectStore(STORE_NAME);
                var req = store.getAll();
                req.onsuccess = function () { resolve(req.result || []); };
                req.onerror = function () { reject(req.error); };
            });
        });
    }

    // ── SAVE ALL ARCHIVES (bulk upsert) ──────────────────────────────────
    function saveAll(entries) {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readwrite");
                var store = tx.objectStore(STORE_NAME);
                store.clear();
                (entries || []).forEach(function (entry) {
                    store.put(entry);
                });
                tx.oncomplete = function () { resolve(); };
                tx.onerror = function () { reject(tx.error); };
            });
        });
    }

    // ── SAVE SINGLE ARCHIVE ───────────────────────────────────────────────
    function save(entry) {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readwrite");
                tx.objectStore(STORE_NAME).put(entry);
                tx.oncomplete = function () { resolve(); };
                tx.onerror = function () { reject(tx.error); };
            });
        });
    }

    // ── DELETE SINGLE ARCHIVE ─────────────────────────────────────────────
    function remove(id) {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readwrite");
                tx.objectStore(STORE_NAME).delete(id);
                tx.oncomplete = function () { resolve(); };
                tx.onerror = function () { reject(tx.error); };
            });
        });
    }

    // ── CLEAR ALL ─────────────────────────────────────────────────────────
    function clear() {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readwrite");
                tx.objectStore(STORE_NAME).clear();
                tx.oncomplete = function () { resolve(); };
                tx.onerror = function () { reject(tx.error); };
            });
        });
    }

    // ── COUNT ─────────────────────────────────────────────────────────────
    function count() {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readonly");
                var req = tx.objectStore(STORE_NAME).count();
                req.onsuccess = function () { resolve(req.result); };
                req.onerror = function () { reject(req.error); };
            });
        });
    }

    // ── MIGRATE FROM LOCALSTORAGE ─────────────────────────────────────────
    // One-time migration: reads sp_archives from localStorage,
    // writes to IndexedDB, then removes the localStorage key.
    function migrateFromLS() {
        var raw;
        try { raw = localStorage.getItem(LS_KEY); } catch (e) { raw = null; }
        if (!raw) return Promise.resolve({ migrated: 0, alreadyEmpty: true });

        var entries;
        try { entries = JSON.parse(raw); } catch (e) { entries = null; }
        // Handle versioned envelope
        if (entries && typeof entries === "object" && "_v" in entries) {
            entries = entries.data;
        }
        if (!Array.isArray(entries) || entries.length === 0) {
            return Promise.resolve({ migrated: 0, alreadyEmpty: true });
        }

        return saveAll(entries).then(function () {
            try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
            console.log("[archivedb] Migrated " + entries.length + " archives from localStorage to IndexedDB");
            return { migrated: entries.length, alreadyEmpty: false };
        });
    }

    // ── COMPRESS ARCHIVE SNAPSHOT ─────────────────────────────────────────
    // Strips full snapshot arrays from old archives to save space.
    // Keeps only summary fields (month, totals, closedAt).
    // Returns compressed copy — does NOT mutate original.
    function compressSnapshot(archive) {
        if (!archive || !archive.snapshot) return archive;
        var compressed = Object.assign({}, archive);
        // Keep only counts instead of full arrays
        compressed.snapshotSummary = {
            incomeCount: (archive.snapshot.incomes || []).length,
            expenseCount: (archive.snapshot.dailyExpenses || []).length,
            billCount: (archive.snapshot.bills || []).length,
            fundCount: (archive.snapshot.funds || []).length,
            txnCount: (archive.snapshot.txns || []).length,
            walletCount: (archive.snapshot.wallets || []).length,
            photoCount: (archive.snapshot.photoDiary || []).length
        };
        delete compressed.snapshot;
        return compressed;
    }

    // ── EXPOSE ────────────────────────────────────────────────────────────
    window.archivedb = {
        open: open,
        getAll: getAll,
        saveAll: saveAll,
        save: save,
        remove: remove,
        clear: clear,
        count: count,
        migrateFromLS: migrateFromLS,
        compressSnapshot: compressSnapshot
    };

})();