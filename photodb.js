// photodb.js — IndexedDB wrapper for SINKPESO photo diary storage
//
// WHY: localStorage has a ~5-10MB limit. Base64-encoded photos hit this fast.
//      IndexedDB offers hundreds of MB with no per-key size limit.
//
// ARCHITECTURE:
//   - Async API (Promise-based) wrapping IndexedDB
//   - Single object store: "photos" keyed by entry id
//   - Migration helper to move existing localStorage data
//   - Falls back gracefully if IndexedDB unavailable
//
// DEPENDENCIES: none (pure browser APIs)
// LOAD ORDER: must come before index.html main script

(function () {
    "use strict";

    var DB_NAME = "sinkpeso_photos";
    var DB_VERSION = 1;
    var STORE_NAME = "photos";
    var LS_KEY = "sp_photo_diary";

    var _db = null; // cached connection

    // ── OPEN DATABASE ──────────────────────────────────────────────────────
    function open() {
        if (_db) return Promise.resolve(_db);
        return new Promise(function (resolve, reject) {
            if (!window.indexedDB) {
                console.warn("[photodb] IndexedDB not available");
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
                console.warn("[photodb] open failed:", ev.target.error);
                reject(ev.target.error);
            };
        });
    }

    // ── GET ALL PHOTOS ─────────────────────────────────────────────────────
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

    // ── SAVE ALL PHOTOS (bulk upsert) ─────────────────────────────────────
    // Replaces entire collection — used for full sync from React state
    function saveAll(entries) {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readwrite");
                var store = tx.objectStore(STORE_NAME);
                // Clear existing, then put all new entries
                store.clear();
                (entries || []).forEach(function (entry) {
                    store.put(entry);
                });
                tx.oncomplete = function () { resolve(); };
                tx.onerror = function () { reject(tx.error); };
            });
        });
    }

    // ── SAVE SINGLE PHOTO ──────────────────────────────────────────────────
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

    // ── DELETE SINGLE PHOTO ────────────────────────────────────────────────
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

    // ── DELETE MULTIPLE PHOTOS ─────────────────────────────────────────────
    function removeByIds(ids) {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readwrite");
                var store = tx.objectStore(STORE_NAME);
                ids.forEach(function (id) { store.delete(id); });
                tx.oncomplete = function () { resolve(); };
                tx.onerror = function () { reject(tx.error); };
            });
        });
    }

    // ── CLEAR ALL PHOTOS ───────────────────────────────────────────────────
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

    // ── COUNT ──────────────────────────────────────────────────────────────
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

    // ── MIGRATE FROM LOCALSTORAGE ──────────────────────────────────────────
    // One-time migration: reads sp_photo_diary from localStorage,
    // writes to IndexedDB, then removes the localStorage key.
    // Returns { migrated: number, alreadyEmpty: boolean }
    function migrateFromLS() {
        var raw;
        try { raw = localStorage.getItem(LS_KEY); } catch (e) { raw = null; }
        if (!raw) return Promise.resolve({ migrated: 0, alreadyEmpty: true });

        var entries;
        try { entries = JSON.parse(raw); } catch (e) { entries = null; }
        if (!Array.isArray(entries) || entries.length === 0) {
            return Promise.resolve({ migrated: 0, alreadyEmpty: true });
        }

        return saveAll(entries).then(function () {
            try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
            console.log("[photodb] Migrated " + entries.length + " photos from localStorage to IndexedDB");
            return { migrated: entries.length, alreadyEmpty: false };
        });
    }

    // ── STORAGE USAGE ESTIMATE ─────────────────────────────────────────────
    // Uses the Storage Manager API where available
    function getUsage() {
        if (navigator.storage && navigator.storage.estimate) {
            return navigator.storage.estimate().then(function (est) {
                return {
                    used: est.usage || 0,
                    quota: est.quota || 0,
                    pct: est.quota ? (est.usage / est.quota) : 0,
                    usedMB: ((est.usage || 0) / (1024 * 1024)).toFixed(2),
                    quotaMB: ((est.quota || 0) / (1024 * 1024)).toFixed(0)
                };
            });
        }
        return Promise.resolve({ used: 0, quota: 0, pct: 0, usedMB: "0", quotaMB: "unknown" });
    }

    // ── EXPORT ─────────────────────────────────────────────────────────────
    window.photodb = {
        open: open,
        getAll: getAll,
        saveAll: saveAll,
        save: save,
        remove: remove,
        removeByIds: removeByIds,
        clear: clear,
        count: count,
        migrateFromLS: migrateFromLS,
        getUsage: getUsage
    };

})();