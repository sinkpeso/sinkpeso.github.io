const fs = require('fs');

// Fix styles.css
let css = fs.readFileSync('styles.css', 'utf8');
if (!css.includes('UI AUDIT FIXES')) {
    css += '\n/* ── UI AUDIT FIXES ── */\n';
    css += '.nav-btn:active { background: var(--hover-bg) !important; }\n';
    css += '.chart-bar-group span { font-size: 11px; }\n';
    css += '.stream-row > div:first-child { min-width: 0; overflow: hidden; }\n';
    fs.writeFileSync('styles.css', css);
    console.log('CSS audit fixes appended');
} else {
    console.log('CSS fixes already present');
}

// Fix closeBtn in index.html
let html = fs.readFileSync('index.html', 'utf8');
if (html.includes('width:30, height:30')) {
    html = html.replace(/width:30, height:30/g, 'width:36, height:36');
    fs.writeFileSync('index.html', html);
    console.log('closeBtn size updated (30 -> 36)');
} else {
    console.log('closeBtn already 36 or not found');
}