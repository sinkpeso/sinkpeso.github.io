// tests/run-all.js — Run all SINKPESO unit tests
const { execSync } = require('child_process');
const path = require('path');

const testFiles = [
    'tests/utils.test.js',
    'tests/finance.test.js',
    'tests/selectors.test.js',
];

let totalPassed = 0;
let totalFailed = 0;

console.log('═══════════════════════════════════════');
console.log('  SINKPESO Unit Test Suite');
console.log('═══════════════════════════════════════');

for (const file of testFiles) {
    try {
        const output = execSync(`node ${file}`, {
            cwd: path.join(__dirname, '..'),
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log(output);
        // Count passed/failed from output
        const passMatch = output.match(/(\d+) passed/);
        const failMatch = output.match(/(\d+) failed/);
        if (passMatch) totalPassed += parseInt(passMatch[1]);
        if (failMatch) totalFailed += parseInt(failMatch[1]);
    } catch (e) {
        console.log(e.stdout || '');
        console.log(e.stderr || '');
        const passMatch = (e.stdout || '').match(/(\d+) passed/);
        const failMatch = (e.stdout || '').match(/(\d+) failed/);
        if (passMatch) totalPassed += parseInt(passMatch[1]);
        if (failMatch) totalFailed += parseInt(failMatch[1]);
    }
}

console.log('═══════════════════════════════════════');
console.log(`  TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
console.log('═══════════════════════════════════════');

if (totalFailed > 0) process.exit(1);