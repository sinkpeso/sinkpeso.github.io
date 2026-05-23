// utils.js — Pure helper functions for SINKPESO
// No React, no app state, no side effects.

window.utils = {

    // Convert a value to integer cents  (e.g. 12.5 → 1250)
    tc: (v) => Math.round((Number(v) || 0) * 100),

    // Generate a unique ID string  (e.g. "1718123456789-abc12")
    uid: () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,

    // Return today's date as "YYYY-MM-DD"
    todayStr: () => new Date().toISOString().slice(0, 10),

    // Divide a by b safely — returns 0 instead of Infinity or NaN
    safeDiv: (a, b) => (b > 0 ? a / b : 0),

    // Add n months to a "YYYY-MM-DD" string, returns a new "YYYY-MM-DD" string
    addMonths: (dateStr, n) => {
        if (!dateStr) return window.utils.todayStr();
        const d = new Date(dateStr + "T00:00:00");
        d.setMonth(d.getMonth() + n);
        return d.toISOString().slice(0, 10);
    },

    // Return how many days remain until dueDateStr ("YYYY-MM-DD")
    // Returns null if no date given; negative means overdue
    getDaysRemaining: (dueDateStr) => {
        if (!dueDateStr) return null;
        const today = new Date(window.utils.todayStr());
        const due = new Date(dueDateStr);
        return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    },

};
