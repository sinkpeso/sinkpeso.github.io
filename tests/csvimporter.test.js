// Unit tests for CSVImporter.js
// Run: node tests/csvimporter.test.js

const assert = require('assert');

// Mock browser globals
global.window = { utils: { uid: () => 'test-uid-' + Math.random().toString(36).slice(2, 6), todayStr: () => '2026-06-08' } };

// Load the module
require('../CSVImporter.js');

const parseCSV = window.parseCSV;
const importTransactionsCSV = window.importTransactionsCSV;

// ── parseCSV ──

// Basic parsing
const r1 = parseCSV('Name,Amount,Date\nCoffee,180,2026-06-01\nLunch,250,2026-06-02');
assert.deepStrictEqual(r1.headers, ['Name', 'Amount', 'Date']);
assert.strictEqual(r1.rows.length, 2);
assert.deepStrictEqual(r1.rows[0], ['Coffee', '180', '2026-06-01']);

// Quoted fields with commas
const r2 = parseCSV('Name,Note\n"Coffee, with team",Meeting');
assert.strictEqual(r2.rows[0][0], 'Coffee, with team');
assert.strictEqual(r2.rows[0][1], 'Meeting');

// Escaped quotes
const r3 = parseCSV('Name\n"She said ""hello"""');
assert.strictEqual(r3.rows[0][0], 'She said "hello"');

// BOM handling
const r4 = parseCSV('\uFEFFName,Amount\nTest,100');
assert.deepStrictEqual(r4.headers, ['Name', 'Amount']);
assert.strictEqual(r4.rows.length, 1);

// Empty input
const r5 = parseCSV('');
assert.deepStrictEqual(r5.headers, []);
assert.deepStrictEqual(r5.rows, []);

const r6 = parseCSV(null);
assert.deepStrictEqual(r6.headers, []);

// Skip empty rows
const r7 = parseCSV('A,B\n1,2\n\n3,4');
assert.strictEqual(r7.rows.length, 2);

console.log('✓ parseCSV: all tests passed');

// ── importTransactionsCSV ──

const processor = importTransactionsCSV({ wallets: [{ id: 'w1', name: 'Cash' }] });

// Basic expense import
const csv1 = 'Date,Type,Title,Category,Amount,Currency,Wallet,Notes\n2026-06-01,Expense,Jollibee,Food,285.00,PHP,Cash,';
const res1 = processor(csv1);
assert.strictEqual(res1.stats.imported, 1);
assert.strictEqual(res1.records.expenses.length, 1);
assert.strictEqual(res1.records.expenses[0].name, 'Jollibee');
assert.strictEqual(res1.records.expenses[0].amountCents, 28500);
assert.strictEqual(res1.records.expenses[0].category, 'Food');
assert.strictEqual(res1.records.expenses[0].date, '2026-06-01');
assert.strictEqual(res1.records.expenses[0].walletId, 'w1');

console.log('✓ importTransactionsCSV: basic expense import');

// Income import
const csv2 = 'Date,Type,Title,Category,Amount,Currency,Wallet,Notes\n2026-06-01,Income,Salary,,32000.00,PHP,Cash,';
const res2 = processor(csv2);
assert.strictEqual(res2.records.incomes.length, 1);
assert.strictEqual(res2.records.incomes[0].name, 'Salary');
assert.strictEqual(res2.records.incomes[0].amountCents, 3200000);

console.log('✓ importTransactionsCSV: income import');

// Negative amount (expense)
const csv3 = 'Date,Type,Title,Category,Amount\n2026-06-01,Expense,Groceries,Food,-1250.00';
const res3 = processor(csv3);
assert.strictEqual(res3.records.expenses[0].amountCents, 125000);

console.log('✓ importTransactionsCSV: negative amount handling');

// Mixed types
const csv4 = [
    'Date,Type,Title,Category,Amount,Currency,Wallet,Notes',
    '2026-06-01,Expense,Coffee,Food,180.00,PHP,,',
    '2026-06-01,Income,Freelance,,5000.00,PHP,,',
    '2026-06-02,Bill Payment,Meralco,Bills,2500.00,PHP,,'
].join('\n');
const res4 = processor(csv4);
assert.strictEqual(res4.records.expenses.length, 2); // expense + bill
assert.strictEqual(res4.records.incomes.length, 1);
assert.strictEqual(res4.stats.imported, 3);

console.log('✓ importTransactionsCSV: mixed types');

// Empty/invalid handling
const csv5 = 'Date,Type,Title,Amount\n,,,\n2026-06-01,Expense,Test,0';
const res5 = processor(csv5);
assert.strictEqual(res5.stats.imported, 0);
assert.strictEqual(res5.stats.skipped, 2);

console.log('✓ importTransactionsCSV: empty/invalid rows skipped');

// Missing headers
const res6 = importTransactionsCSV({})(csv5);
// Should still work with basic mapping
assert.ok(res6.stats.total >= 0);

// No headers at all
const res7 = processor('');
assert.strictEqual(res7.stats.imported, 0);
assert.ok(res7.errors.length > 0);

console.log('✓ importTransactionsCSV: edge cases');

// Wallet name matching
const csv8 = 'Date,Type,Title,Category,Amount,Currency,Wallet,Notes\n2026-06-01,Expense,Test,Other,100.00,PHP,cash,';
const res8 = importTransactionsCSV({ wallets: [{ id: 'w-cash', name: 'Cash' }, { id: 'w-gcash', name: 'GCash' }] })(csv8);
assert.strictEqual(res8.records.expenses[0].walletId, 'w-cash');

console.log('✓ importTransactionsCSV: wallet name matching (case-insensitive)');

console.log('✓ CSVImporter.js: all tests passed');