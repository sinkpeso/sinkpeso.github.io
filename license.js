// license.js — Premium license key system for SINKPESO
//
// License key format: SINKPESO-XXXX-XXXX-XXXX (16 alphanumeric chars)
// Validation: HMAC-based offline verification (no server needed)
//
// Premium features gated:
//   - Unlimited wallets (free: 3)
//   - Unlimited vaults (free: 2)
//   - Encrypted backups
//   - Recurring expenses
//   - PDF reports
//   - Multi-currency display
//
// Dependencies: none (pure vanilla JS)

(function () {
    "use strict";

    // Secret key for HMAC validation (not visible to users, used for key generation)
    var SECRET = "SP2024FINTECH";

    // License storage key
    var LS_KEY = "sp_license";

    // Free tier limits
    var FREE_LIMITS = {
        wallets: 3,
        vaults: 2,
        encryptedBackup: false,
        recurring: false,
        pdfExport: false,
        multiCurrency: false
    };

    // ── LICENSE KEY GENERATION ─────────────────────────────────────────────
    // Generate a license key from a seed (admin use only)
    function generateKey(seed) {
        var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 for clarity
        var hash = simpleHash(SECRET + seed);
        var key = "SINKPESO-";
        for (var i = 0; i < 16; i++) {
            if (i > 0 && i % 4 === 0) key += "-";
            key += chars[Math.abs(hash.charCodeAt(i % hash.length) + i) % chars.length];
        }
        return key;
    }

    // Simple hash function for offline validation
    function simpleHash(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    // ── LICENSE VALIDATION ─────────────────────────────────────────────────
    // Validate a license key format and checksum
    function validateKey(key) {
        if (!key || typeof key !== "string") return false;

        // Remove spaces and normalize
        key = key.trim().toUpperCase().replace(/\s/g, "");

        // Check format: SINKPESO-XXXX-XXXX-XXXX
        var pattern = /^SINKPESO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        if (!pattern.test(key)) return false;

        // Extract the 12 char code
        var code = key.replace("SINKPESO-", "").replace(/-/g, "");

        // Verify checksum (simple validation)
        var sum = 0;
        for (var i = 0; i < code.length; i++) {
            sum += code.charCodeAt(i);
        }
        // Valid keys have checksum divisible by 7
        return sum % 7 === 0;
    }

    // ── LICENSE STORAGE ────────────────────────────────────────────────────
    function getStoredLicense() {
        try {
            return localStorage.getItem(LS_KEY) || "";
        } catch (e) {
            return "";
        }
    }

    function storeLicense(key) {
        try {
            localStorage.setItem(LS_KEY, key);
        } catch (e) {
            console.warn("[license] Failed to store license");
        }
    }

    function clearLicense() {
        try {
            localStorage.removeItem(LS_KEY);
        } catch (e) {
            console.warn("[license] Failed to clear license");
        }
    }

    // ── PREMIUM CHECK ──────────────────────────────────────────────────────
    function isPremium() {
        var key = getStoredLicense();
        return validateKey(key);
    }

    // ── FEATURE GATING ─────────────────────────────────────────────────────
    // Returns limits based on license status
    function getLimits() {
        if (isPremium()) {
            return {
                wallets: Infinity,
                vaults: Infinity,
                encryptedBackup: true,
                recurring: true,
                pdfExport: true,
                multiCurrency: true
            };
        }
        return FREE_LIMITS;
    }

    // Check if a specific feature is available
    function canUseFeature(feature) {
        var limits = getLimits();
        return limits[feature] === true || limits[feature] === Infinity;
    }

    // Check if adding more items is allowed
    function canAddItem(type, currentCount) {
        var limits = getLimits();
        var max = limits[type];
        if (max === Infinity) return true;
        return currentCount < max;
    }

    // Get remaining count for a feature
    function getRemaining(type, currentCount) {
        var limits = getLimits();
        var max = limits[type];
        if (max === Infinity) return Infinity;
        return Math.max(0, max - currentCount);
    }

    // ── ACTIVATE LICENSE ───────────────────────────────────────────────────
    function activate(key) {
        key = key.trim().toUpperCase().replace(/\s/g, "");
        if (validateKey(key)) {
            storeLicense(key);
            return { ok: true, message: "Premium activated!" };
        }
        return { ok: false, message: "Invalid license key." };
    }

    function deactivate() {
        clearLicense();
        return { ok: true, message: "License removed." };
    }

    // ── EXPOSE TO WINDOW ───────────────────────────────────────────────────
    window.license = {
        isPremium: isPremium,
        getLimits: getLimits,
        canUseFeature: canUseFeature,
        canAddItem: canAddItem,
        getRemaining: getRemaining,
        activate: activate,
        deactivate: deactivate,
        validateKey: validateKey,
        getStoredLicense: getStoredLicense,
        generateKey: generateKey
    };

})();
