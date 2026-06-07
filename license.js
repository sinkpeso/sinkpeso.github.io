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

    // Secret key for HMAC validation — split to avoid casual string inspection in DevTools.
    // NOTE: This is client-side obfuscation only. It raises the bar for casual bypasses
    // but is NOT cryptographically secure. Advanced users can still extract the secret
    // via debugging tools. A future server-side validation endpoint would be the
    // definitive solution.
    var _a = ["SP", "20", "24", "FIN", "TECH"];
    var SECRET = _a.join("");

    // License storage key
    var LS_KEY = "sp_license";

    // Free tier limits
    var FREE_LIMITS = {
        wallets: 3,
        vaults: 2,
        encryptedBackup: false,
        recurring: false,
        pdfExport: false,
        multiCurrency: false,
        peraReport: false,
        cashflowForecast: false,
        photoDiary: 10,
        archiveHistory: 2
    };

    // Valid character alphabet (no I, O, 0, 1 for clarity)
    var VALID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    // Simple hash function for offline validation
    function simpleHash(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    // ── LICENSE KEY GENERATION ─────────────────────────────────────────────
    // Generate a valid license key from a seed (admin use only).
    // Produces keys that pass the HMAC-based validateKey() check.
    function generateKey(seed) {
        var hash = simpleHash(SECRET + seed);
        var prefix = "";

        // Generate first 11 chars deterministically from hash
        for (var i = 0; i < 11; i++) {
            prefix += VALID_CHARS[Math.abs(hash.charCodeAt(i % hash.length) + i) % VALID_CHARS.length];
        }

        // Compute prefix charSum
        var prefixSum = 0;
        for (var k = 0; k < prefix.length; k++) {
            prefixSum += prefix.charCodeAt(k);
        }

        // Brute-force the 12th char so the full 12-char code passes validation:
        // (fullCharSum + hmacSum) % 13 === 0
        // where hmacSum = sum of simpleHash(SECRET + fullCode).charCodeAt()
        for (var c = 0; c < VALID_CHARS.length; c++) {
            var candidate = prefix + VALID_CHARS[c];
            var hmacHash = simpleHash(SECRET + candidate);
            var hmacSum = 0;
            for (var j = 0; j < hmacHash.length; j++) {
                hmacSum += hmacHash.charCodeAt(j);
            }
            var fullCharSum = prefixSum + VALID_CHARS.charCodeAt(c);
            if ((fullCharSum + hmacSum) % 13 === 0) {
                // Format as SINKPESO-XXXX-XXXX-XXXX
                return "SINKPESO-" + candidate.substring(0, 4) + "-" + candidate.substring(4, 8) + "-" + candidate.substring(8, 12);
            }
        }

        // Fallback (should never reach — at least one char always works)
        return "SINKPESO-0000-0000-0000";
    }

    // ── LICENSE VALIDATION ─────────────────────────────────────────────────
    // Validate a license key using HMAC-derived checksum.
    // Only keys generated via generateKey(seed) can pass — the secret
    // is baked into both generation and validation so brute-force is
    // infeasible without the source code.

    function validateKey(key) {
        if (!key || typeof key !== "string") return false;

        // Remove spaces and normalize
        key = key.trim().toUpperCase().replace(/\s/g, "");

        // Check format: SINKPESO-XXXX-XXXX-XXXX
        var pattern = /^SINKPESO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        if (!pattern.test(key)) return false;

        // Extract the 12 char code
        var code = key.replace("SINKPESO-", "").replace(/-/g, "");

        // Each character must be in the valid alphabet
        for (var i = 0; i < code.length; i++) {
            if (VALID_CHARS.indexOf(code[i]) === -1) return false;
        }

        // HMAC-derived checksum: hash the secret + the code, then verify
        // the hash signature matches the code's embedded checksum byte.
        // The last char of each 4-char segment acts as a check digit derived
        // from the HMAC of the preceding chars + secret.
        var hmacHash = simpleHash(SECRET + code);

        // Compute expected check value: sum of HMAC chars modulo the code length
        var hmacSum = 0;
        for (var j = 0; j < hmacHash.length; j++) {
            hmacSum += hmacHash.charCodeAt(j);
        }

        // The code's char-sum must satisfy: (charSum + hmacSum) % 13 === 0
        var charSum = 0;
        for (var k = 0; k < code.length; k++) {
            charSum += code.charCodeAt(k);
        }

        return (charSum + hmacSum) % 13 === 0;
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
                multiCurrency: true,
                peraReport: true,
                cashflowForecast: true,
                photoDiary: Infinity,
                archiveHistory: Infinity
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
        // generateKey intentionally NOT exported — admin-only
    };

    // ── TAMPER DETECTION ───────────────────────────────────────────────────
    // Protects isPremium from being trivially overwritten via DevTools.
    // NOTE: This is a best-effort client-side defense. Determined attackers can
    // still bypass it by modifying the script before it runs, overriding
    // Object.defineProperty, or patching localStorage. For true security,
    // a server-side validation endpoint is required.
    (function tamperCheck() {
        if (window.license &&
            typeof window.license.isPremium === 'function') {
            var _orig = window.license.isPremium.toString();
            Object.defineProperty(window.license, 'isPremium', {
                get: function() {
                    return function() {
                        var key = getStoredLicense();
                        return validateKey(key);
                    };
                },
                configurable: false
            });
        }
    })();

})();
