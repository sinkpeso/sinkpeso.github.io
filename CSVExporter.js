// CSVExporter.js — Export transaction data as CSV for SINKPESO
//
// Generates a CSV file from unified transaction items and triggers download.
// Works fully offline — no server needed.
//
// Dependencies: selectors.js (window.selectors.getAllTransactionItems)
//   utils.js (window.utils.todayStr)

(function () {
    "use strict";

    /**
     * Escape a CSV field value. Wraps in double quotes if it contains commas,
     * quotes, or newlines. Doubles any internal quotes per RFC 4180.
     * @param {string} val
     * @returns {string}
     */
    function escapeCSV(val) {
        if (val === null || val === undefined) return '';
        var str = String(val);
        if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1 || str.indexOf('\r') !== -1) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    /**
     * Export all transactions as a CSV file download.
     * @param {Object} opts
     * @param {Array} opts.dailyExpenses
     * @param {Array} opts.incomes
     * @param {Array} opts.txns
     * @param {Array} opts.bills
     * @param {Array} opts.funds
     * @param {Array} opts.wallets
     * @param {Function} opts.fc — currency formatter (optional, for display amounts)
     * @returns {boolean} true if export succeeded, false if no data
     */
    function exportTransactionsCSV(opts) {
        var dailyExpenses = opts.dailyExpenses || [];
        var incomes = opts.incomes || [];
        var txns = opts.txns || [];
        var bills = opts.bills || [];
        var funds = opts.funds || [];
        var wallets = opts.wallets || [];

        // Get unified transaction list
        var items = window.selectors.getAllTransactionItems({
            dailyExpenses: dailyExpenses,
            incomes: incomes,
            txns: txns,
            bills: bills,
            funds: funds,
            wallets: wallets
        });

        if (items.length === 0) return false;

        // Build CSV rows
        var rows = [];

        // Header row
        rows.push(['Date', 'Type', 'Title', 'Category', 'Amount', 'Currency', 'Wallet', 'Notes'].map(escapeCSV).join(','));

        // Data rows
        items.forEach(function (item) {
            var typeLabel = {
                expense: 'Expense',
                income: 'Income',
                bill: 'Bill Payment',
                vault: 'Vault Transaction',
                transfer: 'Transfer'
            }[item.source] || item.source;

            // Amount: convert cents to decimal with 2 places
            var amountDecimal = ((Number(item.amountCents) || 0) / 100).toFixed(2);
            // Prefix with sign for clarity
            var signedAmount = (item.amountPrefix === '+' ? '+' : item.amountPrefix === '−' || item.amountPrefix === '-' ? '-' : '') + amountDecimal;

            var notes = '';
            if (item.source === 'transfer' && item.feeCents) {
                notes = 'Fee: ' + (item.feeCents / 100).toFixed(2);
            }

            rows.push([
                escapeCSV(item.date),
                escapeCSV(typeLabel),
                escapeCSV(item.title),
                escapeCSV(item.subtitle),
                escapeCSV(signedAmount),
                escapeCSV('PHP'),
                escapeCSV(item.walletName || ''),
                escapeCSV(notes)
            ].join(','));
        });

        // Add UTF-8 BOM for Excel compatibility, then CSV content
        var BOM = '\uFEFF';
        var csvContent = BOM + rows.join('\r\n');

        // Create and trigger download
        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        var filename = 'SINKPESO_Transactions_' + (window.utils.todayStr ? window.utils.todayStr() : new Date().toISOString().slice(0, 10)) + '.csv';

        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(function () {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

        return true;
    }

    // ── Expose ─────────────────────────────────────────────────────────────
    window.exportTransactionsCSV = exportTransactionsCSV;
})();