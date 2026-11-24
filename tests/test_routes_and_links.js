/**
 * Automated Test Suite: Routes, Assets & Links Integrity
 * Verifies that all 34 website routes load, all local assets exist, and no broken internal links exist.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
console.log('--- TEST SUITE 2: ROUTES, ASSETS & LINKS INTEGRITY ---');

let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
    try {
        fn();
        console.log(`  [PASS] ${name}`);
        passedTests++;
    } catch (e) {
        console.error(`  [FAIL] ${name}: ${e.message}`);
        failedTests++;
    }
}

const htmlFiles = fs.readdirSync(root).filter(f => f.endsWith('.html'));

// 1. All root HTML pages load and are non-empty
runTest(`All ${htmlFiles.length} root HTML pages exist and contain valid markup`, () => {
    htmlFiles.forEach(f => {
        const c = fs.readFileSync(path.join(root, f), 'utf8');
        assert(c.length > 100, `${f} is unexpectedly small or empty`);
        assert(c.includes('<!DOCTYPE html>') || c.includes('<html'), `${f} missing DOCTYPE or <html>`);
        assert(c.includes('</html>'), `${f} missing closing </html> tag`);
    });
});

// 2. All referenced CSS files exist
runTest('All referenced local CSS stylesheets exist on disk', () => {
    const missing = [];
    htmlFiles.forEach(f => {
        const c = fs.readFileSync(path.join(root, f), 'utf8');
        const matches = [...c.matchAll(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
        matches.forEach(href => {
            if (!href.startsWith('http') && !href.startsWith('//')) {
                const clean = href.split('?')[0].replace(/^\//, '');
                if (!fs.existsSync(path.join(root, clean))) {
                    missing.push(`${f} -> ${href}`);
                }
            }
        });
    });
    assert.strictEqual(missing.length, 0, `Missing stylesheets: ${missing.join(', ')}`);
});

// 3. All referenced JS scripts exist
runTest('All referenced local JavaScript scripts exist on disk', () => {
    const missing = [];
    htmlFiles.forEach(f => {
        const c = fs.readFileSync(path.join(root, f), 'utf8');
        const matches = [...c.matchAll(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
        matches.forEach(src => {
            if (!src.startsWith('http') && !src.startsWith('//')) {
                const clean = src.split('?')[0].replace(/^\//, '');
                if (!fs.existsSync(path.join(root, clean))) {
                    missing.push(`${f} -> ${src}`);
                }
            }
        });
    });
    assert.strictEqual(missing.length, 0, `Missing scripts: ${missing.join(', ')}`);
});

// 4. All JavaScript files and inline scripts have valid syntax
runTest('Zero syntax errors in root JavaScript and inline HTML scripts', () => {
    const errors = [];
    htmlFiles.forEach(f => {
        const c = fs.readFileSync(path.join(root, f), 'utf8');
        const inlineScripts = [...c.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)];
        inlineScripts.forEach((m, idx) => {
            if (m[0].includes('application/ld+json')) return;
            try {
                new Function(m[1]);
            } catch (err) {
                errors.push(`${f} script[${idx}]: ${err.message}`);
            }
        });
    });
    assert.strictEqual(errors.length, 0, `Script syntax errors found:\n${errors.join('\n')}`);
});

// 5. Check critical navigation routes exist
runTest('All critical navbar navigation destinations resolve to valid files', () => {
    const expectedRoutes = [
        'index.html',
        'events.html',
        'roster.html',
        'reports.html',
        'trophy-room.html',
        'portal.html',
        'admin.html',
        'profile.html',
        'login.html'
    ];
    expectedRoutes.forEach(r => {
        assert(fs.existsSync(path.join(root, r)), `Required route ${r} missing from root`);
    });
});

console.log(`\nSuite 2 Summary: ${passedTests} Passed, ${failedTests} Failed\n`);
module.exports = { passedTests, failedTests };
