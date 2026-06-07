// CSVImporter.js — Import transaction data from CSV for SINKPESO
//
// Parses a CSV file (RFC 4180 compliant) and maps rows back to internal
// transaction records. Works fully offline — no server needed.
//
// Dependencies: utils.js (window.utils.uid, window.utils.todayStr)
//   constants.js (window.SINKPESO_CONSTANTS.CATEGORIES)

(function () {
    "use strict";

    /**
     * Parse a CSV string into headers and data rows (RFC 4180).
     * Handles quoted fields, commas inside quotes, and escaped quotes.
     * @param {string} text - Raw CSV text
     * @returns {{ headers: string[], rows: string[][] }}
     */
    function parseCSV(text) {
        if (!text || typeof text !== 'string') return { headers: [], rows: [] };

        // Strip BOM if present
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

        var lines = [];
        var current = '';
        var inQuotes = false;

        // Split into logical lines (handle quoted newlines)
        // NOTE: Do NOT handle "" escaping here — parseLine handles field-level escaping.
        // We only toggle inQuotes state for correct line splitting.
        for (var i = 0; i < text.length; i++) {
            var ch = text[i];
            if (ch === '"') {
                inQuotes = !inQuotes;
                current += ch;
            } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
                if (ch === '\r' && i + 1 < text.length && text[i + 1] === '\n') i++; // skip \r\n
                if (current.trim()) lines.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
        if (current.trim()) lines.push(current);

        if (lines.length === 0) return { headers: [], rows: [] };

        // Parse each line into fields
        function parseLine(line) {
            var fields = [];
            var field = '';
            var q = false;
            for (var j = 0; j < line.length; j++) {
                var c = line[j];
                if (c === '"') {
                    if (q && j + 1 < line.length && line[j + 1] === '"') {
                        field += '"';
                        j++;
                    } else {
                        q = !q;
                    }
                } else if (c === ',' && !q) {
                    fields.push(field.trim());
                    field = '';
                } else {
                    field += c;
                }
            }
            fields.push(field.trim());
            return fields;
        }

        var headers = parseLine(lines[0]).map(function (h) { return h.replace(/^"|"$/g, '').trim(); });
        var rows = [];
        for (var k = 1; k < lines.length; k++) {
            var row = parseLine(lines[k]);
            // Skip empty rows
            if (row.length === 1 && row[0] === '') continue;
            rows.push(row);
        }

        return { headers: headers, rows: rows };
    }

    /**
     * Find a header index by matching against multiple possible names.
     * @param {string[]} headers
     * @param {string[]} names - Possible header names (case-insensitive)
     * @returns {number} Index or -1
     */
    function findHeader(headers, names) {
        for (var i = 0; i < headers.length; i++) {
            var h = headers[i].toLowerCase().trim();
            for (var j = 0; j < names.length; j++) {
                if (h === names[j].toLowerCase()) return i;
            }
        }
        return -1;
    }

    /**
     * Parse an amount string to cents (integer).
     * Handles: "150.00", "-150.00", "+150", "₱1,250.50", "1,250"
     * @param {string} str
     * @returns {{ cents: number, isNegative: boolean }}
     */
    function parseAmount(str) {
        if (!str) return { cents: 0, isNegative: false };
        var s = str.replace(/[₱$,\s]/g, '').trim();
        var isNeg = false;
        if (s.charAt(0) === '-') { isNeg = true; s = s.slice(1); }
        else if (s.charAt(0) === '+') { s = s.slice(1); }
        var num = parseFloat(s);
        if (isNaN(num)) return { cents: 0, isNegative: false };
        return { cents: Math.round(num * 100), isNegative: isNeg };
    }

    /**
     * Map a CSV type label back to a source type.
     * @param {string} label
     * @returns {string} 'expense' | 'income' | 'bill' | 'vault' | 'transfer'
     */
    function mapType(label) {
        if (!label) return 'expense';
        var l = label.toLowerCase().trim();
        if (l === 'expense') return 'expense';
        if (l === 'income') return 'income';
        if (l === 'bill payment' || l === 'bill') return 'bill';
        if (l === 'vault transaction' || l === 'vault') return 'vault';
        if (l === 'transfer') return 'transfer';
        return 'expense';
    }

    /**
     * Import transactions from a CSV file.
     * Maps CSV rows back to internal record format.
     *
     * @param {Object} opts
     * @param {Array} opts.wallets - Current wallet list for name matching
     * @returns {function(File, function): void} Calls back with result
     */
    function importTransactionsCSV(opts) {
        var wallets = opts.wallets || [];

        /**
         * Process the imported CSV data.
         * @param {string} csvText - Raw CSV text content
         * @returns {{ records: Object, errors: string[], stats: Object }}
         */
        return function processCSV(csvText) {
            var parsed = parseCSV(csvText);
            var headers = parsed.headers;
            var rows = parsed.rows;
            var errors = [];
            var records = { expenses: [], incomes: [], transfers: [] };

            if (headers.length === 0) {
                return { records: records, errors: ['No headers found in CSV file.'], stats: { total: 0, imported: 0, skipped: 0 } };
            }

            // Map column indices
            var dateIdx = findHeader(headers, ['date', 'Date']);
            var typeIdx = findHeader(headers, ['type', 'Type']);
            var titleIdx = findHeader(headers, ['title', 'Title', 'name', 'Name', 'description', 'Description']);
            var catIdx = findHeader(headers, ['category', 'Category', 'cat']);
            var amountIdx = findHeader(headers, ['amount', 'Amount', 'value', 'Value']);
            var walletIdx = findHeader(headers, ['wallet', 'Wallet', 'source', 'Source']);
            var notesIdx = findHeader(headers, ['notes', 'Notes', 'note', 'Note', 'memo', 'Memo']);

            if (titleIdx === -1 && amountIdx === -1) {
                return { records: records, errors: ['CSV must have at least a Title/Name and Amount column.'], stats: { total: 0, imported: 0, skipped: 0 } };
            }

            var uid = window.utils.uid || function () { return Math.random().toString(36).slice(2, 10); };
            var skipped = 0;

            // Build wallet name → id lookup
            var walletLookup = {};
            wallets.forEach(function (w) {
                if (w.name) walletLookup[w.name.toLowerCase().trim()] = w.id;
            });

            rows.forEach(function (row, idx) {
                try {
                    var rowNum = idx + 2; // +2 because header is row 1, data starts at row 2
                    var dateVal = dateIdx >= 0 ? (row[dateIdx] || '').replace(/^"|"$/g, '').trim() : '';
                    var typeVal = typeIdx >= 0 ? (row[typeIdx] || '').replace(/^"|"$/g, '').trim() : 'Expense';
                    var titleVal = titleIdx >= 0 ? (row[titleIdx] || '').replace(/^"|"$/g, '').trim() : '';
                    var catVal = catIdx >= 0 ? (row[catIdx] || '').replace(/^"|"$/g, '').trim() : 'Other';
                    var amountVal = amountIdx >= 0 ? (row[amountIdx] || '').replace(/^"|"$/g, '').trim() : '0';
                    var walletVal = walletIdx >= 0 ? (row[walletIdx] || '').replace(/^"|"$/g, '').trim() : '';
                    var notesVal = notesIdx >= 0 ? (row[notesIdx] || '').replace(/^"|"$/g, '').trim() : '';

                    // Skip rows with no title and no amount
                    if (!titleVal && amountVal === '0') {
                        skipped++;
                        return;
                    }

                    // Parse amount
                    var parsed = parseAmount(amountVal);
                    if (parsed.cents === 0) {
                        errors.push('Row ' + rowNum + ': Invalid amount "' + amountVal + '", skipping.');
                        skipped++;
                        return;
                    }

                    // Resolve date (default to today)
                    var date = dateVal;
                    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                        // Try to parse common date formats
                        var d = new Date(dateVal);
                        if (!isNaN(d.getTime())) {
                            date = d.toISOString().slice(0, 10);
                        } else {
                            date = window.utils.todayStr ? window.utils.todayStr() : new Date().toISOString().slice(0, 10);
                        }
                    }

                    // Resolve wallet
                    var walletId = null;
                    if (walletVal) {
                        walletId = walletLookup[walletVal.toLowerCase().trim()] || null;
                    }

                    var source = mapType(typeVal);

                    if (source === 'expense' || source === 'bill') {
                        records.expenses.push({
                            id: uid(),
                            name: titleVal || 'Imported Expense',
                            amountCents: parsed.cents,
                            category: catVal || 'Other',
                            date: date,
                            walletId: walletId,
                            source: source
                        });
                    } else if (source === 'income') {
                        records.incomes.push({
                            id: uid(),
                            name: titleVal || 'Imported Income',
                            amountCents: parsed.cents,
                            date: date,
                            walletId: walletId
                        });
                    } else if (source === 'transfer') {
                        // Parse transfer notes for fee
                        var feeCents = 0;
                        if (notesVal && notesVal.toLowerCase().indexOf('fee:') >= 0) {
                            var feeMatch = notesVal.match(/fee:\s*([\d.]+)/i);
                            if (feeMatch) feeCents = Math.round(parseFloat(feeMatch[1]) * 100);
                        }
                        records.transfers.push({
                            id: uid(),
                            type: 'wallet_transfer',
                            amountCents: parsed.cents,
                            feeCents: feeCents,
                            date: date,
                            note: notesVal || titleVal || 'Imported Transfer'
                        });
                    } else {
                        // Vault transactions — treat as expenses for now
                        records.expenses.push({
                            id: uid(),
                            name: titleVal || 'Imported Vault Transaction',
                            amountCents: parsed.cents,
                            category: 'Savings',
                            date: date,
                            walletId: walletId,
                            source: 'vault'
                        });
                    }
                } catch (e) {
                    errors.push('Row ' + (idx + 2) + ': ' + (e.message || 'Parse error'));
                    skipped++;
                }
            });

            var total = records.expenses.length + records.incomes.length + records.transfers.length;

            return {
                records: records,
                errors: errors,
                stats: {
                    total: rows.length,
                    imported: total,
                    skipped: skipped
                }
            };
        };
    }

    // ── Expose ─────────────────────────────────────────────────────────────
    window.parseCSV = parseCSV;
    window.importTransactionsCSV = importTransactionsCSV;
})();