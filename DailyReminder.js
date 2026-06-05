// DailyReminder.js — Daily spending summary notification for SINKPESO
//
// Sends a local notification with the day's spending summary.
// Uses the Notification API (no push server needed).
//
// Approach:
//   1. On app open, check if notifications are enabled + today's summary hasn't been sent
//   2. If conditions met, fire a notification with spending data
//   3. Also set a timer to fire at the preferred time if the app stays open
//
// Dependencies: window.utils.todayStr, window.persistence

(function () {
    "use strict";

    var STORAGE_KEY = "sp_notifications";
    var DEFAULT_HOUR = 20; // 8 PM
    var DEFAULT_MINUTE = 0;

    // ── Load/Save notification preferences ─────────────────────────────
    function loadPrefs() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) { /* ignore */ }
        return { enabled: false, hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE, lastSentDate: null };
    }

    function savePrefs(prefs) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ }
    }

    // ── Check browser support ──────────────────────────────────────────
    function isSupported() {
        return 'Notification' in window && 'serviceWorker' in navigator;
    }

    // ── Request permission ─────────────────────────────────────────────
    function requestPermission() {
        if (!isSupported()) return Promise.resolve('denied');
        if (Notification.permission === 'granted') return Promise.resolve('granted');
        if (Notification.permission === 'denied') return Promise.resolve('denied');
        return Notification.requestPermission();
    }

    // ── Build notification body from spending data ─────────────────────
    function buildSummary(dailyExpenses, budgets) {
        var today = window.utils.todayStr();
        var todayExpenses = (dailyExpenses || []).filter(function (ex) { return ex.date === today; });
        var totalCents = todayExpenses.reduce(function (s, ex) { return s + (ex.amountCents || 0); }, 0);

        // Top category
        var catTotals = {};
        todayExpenses.forEach(function (ex) {
            var cat = ex.category || 'Other';
            catTotals[cat] = (catTotals[cat] || 0) + (ex.amountCents || 0);
        });
        var topCat = '';
        var topCatCents = 0;
        Object.keys(catTotals).forEach(function (cat) {
            if (catTotals[cat] > topCatCents) {
                topCatCents = catTotals[cat];
                topCat = cat;
            }
        });

        // Format amounts
        var totalStr = '₱' + (totalCents / 100).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

        if (totalCents === 0) {
            return {
                title: 'SINKPESO — Daily Summary',
                body: "No expenses today. Great job saving! 💰",
                data: { date: today, totalCents: 0 }
            };
        }

        var topStr = topCat ? ' Top: ' + topCat + ' (₱' + (topCatCents / 100).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ').' : '';

        return {
            title: 'SINKPESO — Daily Summary',
            body: 'You spent ' + totalStr + ' today.' + topStr + ' Tap to see details.',
            data: { date: today, totalCents: totalCents }
        };
    }

    // ── Send notification ──────────────────────────────────────────────
    function sendNotification(dailyExpenses, budgets) {
        if (!isSupported()) return;
        if (Notification.permission !== 'granted') return;

        var prefs = loadPrefs();
        if (!prefs.enabled) return;

        var today = window.utils.todayStr();
        if (prefs.lastSentDate === today) return; // already sent today

        var summary = buildSummary(dailyExpenses, budgets);

        try {
            var notif = new Notification(summary.title, {
                body: summary.body,
                icon: 'logosinkpeso.png',
                badge: 'logosinkpeso.png',
                tag: 'sinkpeso-daily-summary',
                renotify: true,
                silent: false,
                data: summary.data
            });

            notif.onclick = function () {
                window.focus();
                notif.close();
            };

            // Mark as sent
            prefs.lastSentDate = today;
            savePrefs(prefs);
        } catch (e) {
            console.warn('[DailyReminder] Notification failed:', e);
        }
    }

    // ── Schedule next notification ─────────────────────────────────────
    var _timer = null;

    function scheduleNext(dailyExpenses, budgets) {
        if (_timer) clearTimeout(_timer);

        var prefs = loadPrefs();
        if (!prefs.enabled) return;
        if (!isSupported()) return;
        if (Notification.permission !== 'granted') return;

        var now = new Date();
        var target = new Date();
        target.setHours(prefs.hour, prefs.minute, 0, 0);

        // If target time has passed today, don't schedule (will fire on next app open)
        if (target <= now) return;

        var ms = target.getTime() - now.getTime();
        _timer = setTimeout(function () {
            sendNotification(dailyExpenses, budgets);
        }, ms);
    }

    // ── Enable/Disable ─────────────────────────────────────────────────
    function enable(dailyExpenses, budgets) {
        return requestPermission().then(function (result) {
            if (result === 'granted') {
                var prefs = loadPrefs();
                prefs.enabled = true;
                savePrefs(prefs);
                scheduleNext(dailyExpenses, budgets);
                return true;
            }
            return false;
        });
    }

    function disable() {
        if (_timer) clearTimeout(_timer);
        _timer = null;
        var prefs = loadPrefs();
        prefs.enabled = false;
        savePrefs(prefs);
    }

    function isEnabled() {
        var prefs = loadPrefs();
        return prefs.enabled && isSupported() && Notification.permission === 'granted';
    }

    function getPermissionState() {
        if (!isSupported()) return 'unsupported';
        return Notification.permission;
    }

    // ── Expose ─────────────────────────────────────────────────────────
    window.DailyReminder = {
        isSupported: isSupported,
        requestPermission: requestPermission,
        sendNotification: sendNotification,
        scheduleNext: scheduleNext,
        enable: enable,
        disable: disable,
        isEnabled: isEnabled,
        getPermissionState: getPermissionState,
        loadPrefs: loadPrefs,
        savePrefs: savePrefs
    };
})();