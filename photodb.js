// photodb.js — IndexedDB storage layer for SINKPESO Photo Diary
//
// WHY INDEXEDDB:
//   localStorage has a 5-10MB hard limit. Base64-encoded photos hit this
//   at ~50-100 entries. IndexedDB has no practical limit (hundreds of MB)
//   and supports Blob storage (no 33% base64 overhead).
//
// ARCHITECTURE:
//   window.photodb = {
//     open()           — open/create the database (returns Promise)
//     getAll()         — get all photo entries (returns Promise<Array>)
//     get(id)          — get one entry by id (returns Promise<Object|null>)
//     save(entry)      — insert or update one entry (returns Promise)
//     remove(id)       — delete one entry by id (returns Promise)
//     clear()          — delete all entries (returns Promise)
//     count()          — count entries (returns Promise<number>)
//     getUsage()       — estimate storage usage (returns Promise<{used, quota, pct}>)
//     migrateFromLS()  — move localStorage photos to IndexedDB (returns Promise)
//   }
//
// SCHEMA:
//   Each photo entry: { id, expenseId, imageData, amountCents, name, category, date, note, walletId }
//   imageData is stored as a base64 data URL (same as current). Future: convert to Blob.
//
// DEPENDENCIES: none (uses native IndexedDB API)
// LOAD ORDER: must load before index.html's main <script> block

(function () {
    "use strict";

    var DB_NAME = "sinkpeso_photos";
    var DB_VERSION = 1;
    var STORE_NAME = "photos";
    var LS_KEY = "sp_photo_diary";

    var _db = null; // cached database reference

    // ── OPEN DATABASE ──────────────────────────────────────────────────────
    function open() {
        if (_db) return Promise.resolve(_db);

        return new Promise(function (resolve, reject) {
            var request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = function (event) {
                var db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    var store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
                    store.createIndex("expenseId", "expenseId", { unique: false });
                    store.createIndex("date", "date", { unique: false });
                }
            };

            request.onsuccess = function (event) {
                _db = event.target.result;
                resolve(_db);
            };

            request.onerror = function (event) {
                console.warn("[photodb] Failed to open IndexedDB:", event.target.error);
                reject(event.target.error);
            };
        });
    }

    // ── GET ALL PHOTO ENTRIES ──────────────────────────────────────────────
    function getAll() {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readonly");
                var store = tx.objectStore(STORE_NAME);
                var request = store.getAll();

                request.onsuccess = function () { resolve(request.result || []); };
                request.onerror = function () { reject(request.error); };
            });
        });
    }

    // ── GET ONE ENTRY ─────────────────────────────────────────────────────
    function get(id) {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readonly");
                var store = tx.objectStore(STORE_NAME);
                var request = store.get(id);

                request.onsuccess = function () { resolve(request.result || null); };
                request.onerror = function () { reject(request.error); };
            });
        });
    }

    // ── SAVE ONE ENTRY (upsert) ──────────────────────────────────────────
    function save(entry) {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readwrite");
                var store = tx.objectStore(STORE_NAME);
                var request = store.put(entry);

                request.onsuccess = function () { resolve(); };
                request.onerror = function () { reject(request.error); };
            });
        });
    }

    // ── SAVE MULTIPLE ENTRIES (batch upsert) ─────────────────────────────
    function saveAll(entries) {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readwrite");
                var store = tx.objectStore(STORE_NAME);
                entries.forEach(function (entry) { store.put(entry); });

                tx.oncomplete = function () { resolve(); };
                tx.onerror = function () { reject(tx.error); };
            });
        });
    }

    // ── DELETE ONE ENTRY ──────────────────────────────────────────────────
    function remove(id) {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readwrite");
                var store = tx.objectStore(STORE_NAME);
                var request = store.delete(id);

                request.onsuccess = function () { resolve(); };
                request.onerror = function () { reject(request.error); };
            });
        });
    }

    // ── DELETE MULTIPLE ENTRIES ───────────────────────────────────────────
    function removeAll(ids) {
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

    // ── CLEAR ALL ENTRIES ─────────────────────────────────────────────────
    function clear() {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readwrite");
                var store = tx.objectStore(STORE_NAME);
                var request = store.clear();

                request.onsuccess = function () { resolve(); };
                request.onerror = function () { reject(request.error); };
            });
        });
    }

    // ── COUNT ENTRIES ─────────────────────────────────────────────────────
    function count() {
        return open().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readonly");
                var store = tx.objectStore(STORE_NAME);
                var request = store.count();

                request.onsuccess = function () { resolve(request.result); };
                request.onerror = function () { reject(request.error); };
            });
        });
    }

    // ── STORAGE USAGE ESTIMATE ────────────────────────────────────────────
    // Uses the Storage Manager API where available.
    function getUsage() {
        if (navigator.storage && navigator.storage.estimate) {
            return navigator.storage.estimate().then(function (estimate) {
                var used = estimate.usage || 0;
                var quota = estimate.quota || 0;
                return {
                    used: used,
                    quota: quota,
                    pct: quota > 0 ? used / quota : 0,
                    usedMB: (used / (1024 * 1024)).toFixed(2),
                    quotaMB: (quota / (1024 * 1024)).toFixed(0)
                };
            });
        }
        return Promise.resolve({ used: 0, quota: 0, pct: 0, usedMB: "0", quotaMB: "unknown" });
    }

    // ── MIGRATE FROM LOCALSTORAGE ─────────────────────────────────────────
    // One-time migration: reads sp_photo_diary from localStorage,
    // writes all entries to IndexedDB, then removes the localStorage key.
    // Returns { migrated: number, alreadyEmpty: boolean }
    function migrateFromLS() {
        var raw;
        try {
            raw = localStorage.getItem(LS_KEY);
        } catch (e) {
            return Promise.resolve({ migrated: 0, alreadyEmpty: true, error: e.message });
        }

        if (!raw) return Promise.resolve({ migrated: 0, alreadyEmpty: true });

        var entries;
        try {
            entries = JSON.parse(raw);
        } catch (e) {
            return Promise.resolve({ migrated: 0, alreadyEmpty: true, error: "JSON parse failed" });
        }

        if (!Array.isArray(entries) || entries.length === 0) {
            return Promise.resolve({ migrated: 0, alreadyEmpty: true });
        }

        return saveAll(entries).then(function () {
            // Remove from localStorage after successful migration
            try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
            console.log("[photodb] Migrated " + entries.length + " photos from localStorage to IndexedDB");
            return { migrated: entries.length, alreadyEmpty: false };
        }).catch(function (err) {
            console.warn("[photodb] Migration failed:", err);
            return { migrated: 0, alreadyEmpty: false, error: err.message };
        });
    }

    // ── EXPOSE ────────────────────────────────────────────────────────────
    window.photodb = {
        open: open,
        getAll: getAll,
        get: get,
        save: save,
        saveAll: saveAll,
        remove: remove,
        removeAll: removeAll,
        clear: clear,
        count: count,
        getUsage: getUsage,
        migrateFromLS: migrateFromLS
    };

})();