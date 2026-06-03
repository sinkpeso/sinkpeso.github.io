// crashreport.js — Lightweight offline crash reporting for SINKPESO
//
// Captures uncaught errors and stores them in localStorage.
// Users can view and export crash logs from Settings.
// No data leaves the device — fully offline, fully private.
//
// Dependencies: none (pure browser APIs)

(function () {
    "use strict";

    var LS_KEY = "sp_crash_log";
    var MAX_REPORTS = 25;

    function getReports() {
        try {
            var raw = localStorage.getItem(LS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveReports(reports) {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(reports.slice(-MAX_REPORTS)));
        } catch (e) { /* quota exceeded — ignore */ }
    }

    function addReport(info) {
        var reports = getReports();
        reports.push({
            ts: new Date().toISOString(),
            msg: info.msg || "Unknown error",
            src: info.src || "",
            line: info.line || 0,
            col: info.col || 0,
            stack: info.stack || "",
            ua: navigator.userAgent
        });
        saveReports(reports);
    }

    // ── Capture uncaught errors ─────────────────────────────────────────
    window.addEventListener("error", function (ev) {
        addReport({
            msg: ev.message,
            src: ev.filename,
            line: ev.lineno,
            col: ev.colno,
            stack: ev.error ? ev.error.stack : ""
        });
    });

    // ── Capture unhandled promise rejections ────────────────────────────
    window.addEventListener("unhandledrejection", function (ev) {
        var reason = ev.reason || {};
        addReport({
            msg: "Unhandled Promise rejection: " + (reason.message || String(reason)),
            src: "",
            line: 0,
            col: 0,
            stack: reason.stack || ""
        });
    });

    // ── Public API ─────────────────────────────────────────────────────
    window.crashreport = {
        getReports: getReports,
        clearReports: function () { saveReports([]); },
        count: function () { return getReports().length; },
        exportText: function () {
            var reports = getReports();
            if (reports.length === 0) return "No crash reports.";
            return reports.map(function (r, i) {
                return "[" + (i + 1) + "] " + r.ts + "\n" +
                    "  Message: " + r.msg + "\n" +
                    "  Source: " + r.src + ":" + r.line + ":" + r.col + "\n" +
                    (r.stack ? "  Stack:\n" + r.stack.split("\n").map(function (l) { return "    " + l; }).join("\n") + "\n" : "");
            }).join("\n");
        },
        report: function (msg, err) {
            addReport({
                msg: msg,
                src: "",
                line: 0,
                col: 0,
                stack: err && err.stack ? err.stack : ""
            });
        }
    };
})();