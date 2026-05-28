// persistence.js — Centralized localStorage persistence layer for SINKPESO
//
// WHY THIS EXISTS:
//   Previously, localStorage read/write logic was scattered across App():
//     - a `safeGet` helper inline in the main script block
//     - 9 separate useState initializers each calling safeGet directly
//     - 9 separate useEffect hooks each calling localStorage.setItem directly
//
//   This module centralizes all of that into one place so that:
//     - JSON parse errors are caught in a single guarded location
//     - Schema versioning can evolve without touching App()
//     - Future keys are added in one config object, not three scattered spots
//     - Corruption recovery logic lives in one auditable function
//
// ARCHITECTURE:
//   window.persistence = {
//     KEYS          — canonical key names (single source of truth)
//     loadState     — reads + validates all keys; returns a safe state object
//     saveKey       — writes one key safely (used by useEffect hooks)
//     clearState    — wipes all SINKPESO keys (used by reset/import flows)
//     getRawKey     — returns the localStorage string for a logical name
//     getAllRawKeys  — returns { logicalName: "sp_key" } map (for export)
//   }
//
// SCHEMA VERSIONING:
//   Each stored value is wrapped as { _v: 1, data: <payload> }.
//   On read, if the wrapper is absent (legacy raw array/object) the raw
//   value is used as-is so existing user data is never broken.
//   Future migrations can inspect _v and transform data before returning.
//
// DEPENDENCIES: none (pure vanilla JS, no React, no other SINKPESO modules)
// LOAD ORDER:   must come before index.html's main <script> block
//
// Usage in App():
//   const saved = window.persistence.loadState();
//   const [funds, setFunds] = useState(saved.funds);
//   useEffect(() => window.persistence.saveKey("funds", funds), [funds]);

(function () {
    "use strict";

    // ── SCHEMA VERSION ────────────────────────────────────────────────────────
    // Bump this when the shape of stored data changes and migration is needed.
    var SCHEMA_VERSION = 1;

    // ── STORAGE KEY MAP ───────────────────────────────────────────────────────
    // Single source of truth for every localStorage key used by SINKPESO.
    // Always access keys through this object — never hardcode "sp_*" strings
    // anywhere outside this file.
    var KEYS = {
        settings : "sp_settings",
        funds    : "sp_funds",
        txns     : "sp_txns",
        incomes  : "sp_incomes",
        bills    : "sp_bills",
        daily    : "sp_daily",
        archives : "sp_archives",
        budgets  : "sp_budgets",
        wallets  : "sp_wallets",
    };

    // ── DEFAULT VALUES ────────────────────────────────────────────────────────
    // What each key returns when it is missing or corrupt.
    var DEFAULTS = {
        settings : { currency: "PHP", theme: "dark", pin: "" },
        funds    : [],
        txns     : [],
        incomes  : [],
        bills    : [],
        daily    : [],
        archives : [],
        budgets  : [],
        wallets  : [],
    };

    // ── INTERNAL: safe JSON read ──────────────────────────────────────────────
    // Reads one localStorage key and returns its parsed value.
    // Handles three cases without throwing:
    //   1. Key absent                → return fallback
    //   2. Raw legacy value (no _v)  → return parsed value directly (backwards compat)
    //   3. Versioned envelope        → return envelope.data
    // Any JSON.parse failure         → return fallback, log a warning
    function _read(lsKey, fallback) {
        var raw;
        try {
            raw = localStorage.getItem(lsKey);
        } catch (e) {
            // localStorage itself is unavailable (private browsing + quota, etc.)
            console.warn("[persistence] localStorage.getItem failed for", lsKey, e);
            return fallback;
        }

        if (raw === null || raw === undefined || raw === "") {
            return fallback;
        }

        var parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            console.warn("[persistence] JSON.parse failed for", lsKey, "— using fallback.", e);
            return fallback;
        }

        // Versioned envelope: { _v: N, data: <payload> }
        if (parsed !== null && typeof parsed === "object" && "_v" in parsed) {
            // Future: run migrations based on parsed._v vs SCHEMA_VERSION
            return (parsed.data !== undefined ? parsed.data : fallback);
        }

        // Legacy raw value — return as-is (backwards compat with all existing
        // user data written before persistence.js existed)
        return (parsed !== null && parsed !== undefined ? parsed : fallback);
    }

    // ── INTERNAL: safe JSON write ─────────────────────────────────────────────
    // Wraps the value in a versioned envelope and writes to localStorage.
    // Fails silently with a console warning on quota errors.
    function _write(lsKey, value) {
        var envelope = { _v: SCHEMA_VERSION, data: value };
        try {
            localStorage.setItem(lsKey, JSON.stringify(envelope));
        } catch (e) {
            console.warn("[persistence] localStorage.setItem failed for", lsKey, e);
        }
    }

    // ── PUBLIC: loadState ─────────────────────────────────────────────────────
    // Reads every SINKPESO key and returns a plain object whose shape matches
    // the useState initializers in App().  Returns safe fallback values for any
    // missing or corrupt key — the app will never crash due to bad storage.
    //
    // Return shape:
    //   { settings, funds, txns, incomes, bills, daily, archives, budgets, wallets }
    function loadState() {
        var state = {};
        Object.keys(KEYS).forEach(function (name) {
            state[name] = _read(KEYS[name], DEFAULTS[name]);

            // Guarantee array fields are always arrays
            if (Array.isArray(DEFAULTS[name]) && !Array.isArray(state[name])) {
                console.warn("[persistence] Expected array for", name, "— resetting to []");
                state[name] = [];
            }
            // Guarantee object fields are always plain objects
            if (!Array.isArray(DEFAULTS[name]) && (state[name] === null || typeof state[name] !== "object")) {
                console.warn("[persistence] Expected object for", name, "— resetting to default");
                state[name] = Object.assign({}, DEFAULTS[name]);
            }
        });
        return state;
    }

    // ── PUBLIC: saveKey ───────────────────────────────────────────────────────
    // Persists a single named key.  Called from each useEffect in App().
    //
    // Usage:
    //   useEffect(() => { window.persistence.saveKey("funds", funds); }, [funds]);
    //
    // The `name` param is the logical name from KEYS (e.g. "funds"),
    // NOT the raw localStorage key string (e.g. "sp_funds").
    function saveKey(name, value) {
        var lsKey = KEYS[name];
        if (!lsKey) {
            console.warn("[persistence] saveKey: unknown key name:", name);
            return;
        }
        _write(lsKey, value);
    }

    // ── PUBLIC: clearState ────────────────────────────────────────────────────
    // Removes ALL SINKPESO keys from localStorage.
    // Used by Settings → factory reset and by import (which reloads after).
    // Does NOT touch keys belonging to other apps sharing the same origin.
    function clearState() {
        Object.values(KEYS).forEach(function (lsKey) {
            try {
                localStorage.removeItem(lsKey);
            } catch (e) {
                console.warn("[persistence] removeItem failed for", lsKey, e);
            }
        });
    }

    // ── PUBLIC: getRawKey ─────────────────────────────────────────────────────
    // Returns the raw localStorage key string for a logical name.
    // Useful when external code needs the "sp_*" string directly.
    function getRawKey(name) {
        return KEYS[name] || null;
    }

    // ── PUBLIC: getAllRawKeys ─────────────────────────────────────────────────
    // Returns a copy of the KEYS map: { logicalName: "sp_key" }.
    // Used by the Settings export handler to enumerate every key to back up.
    function getAllRawKeys() {
        return Object.assign({}, KEYS);
    }

    // ── EXPOSE ────────────────────────────────────────────────────────────────
    window.persistence = {
        KEYS          : KEYS,
        SCHEMA_VERSION: SCHEMA_VERSION,
        loadState     : loadState,
        saveKey       : saveKey,
        clearState    : clearState,
        getRawKey     : getRawKey,
        getAllRawKeys  : getAllRawKeys,
    };

})();
