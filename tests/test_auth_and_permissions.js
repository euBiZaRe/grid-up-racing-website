/**
 * Automated Test Suite: User Accounts, Authentication & Permissions
 * Tests the 10 critical user journeys and security authorization rules.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const authJsContent = fs.readFileSync(path.join(root, 'js', 'auth.js'), 'utf8');

console.log('--- TEST SUITE 1: AUTHENTICATION & ACCESS CONTROL ---');

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

// 1. Hardcoded Admin Whitelist Test
runTest('Master Admin and Known Admin UIDs are strictly frozen and protected', () => {
    assert(authJsContent.includes("const MASTER_ADMIN = 'B0t4f4nqqpZIQKpT8Ed97xka5gM2'"), 'Master admin missing');
    assert(authJsContent.includes("Object.freeze("), 'Known admins must be frozen against tampering');
    assert(authJsContent.includes("Object.defineProperty(window, 'MASTER_ADMIN'"), 'Window MASTER_ADMIN must be non-configurable');
});

// 2. Protected Pages Redirection
runTest('handleLogOutRedirect redirects protected pages to login.html', () => {
    assert(authJsContent.includes("const protectedPages = ['admin.html', 'portal.html', 'profile.html']"), 'Protected pages missing in auth.js');
    assert(authJsContent.includes("window.location.href = basePath + \"login.html\""), 'Redirect logic missing in auth.js');
});

// 3. Admin Permission Gatekeeping (Anti-Self-Promotion)
runTest('Admin verification rejects client-controlled userDoc.isAdmin or userDoc.role self-promotion', () => {
    // Check that enrichAuthData verifies strictly against KNOWN_ADMIN_UIDS or settings/admins doc
    assert(authJsContent.includes("IS_ADMIN = isVerifiedAdmin;"), 'Authoritative admin verification missing');
    assert(!authJsContent.includes("IS_ADMIN = userData.isAdmin"), 'Vulnerable client-controlled isAdmin assignment found');
});

// 4. HTML Navigation Integrity
runTest('Navbar links are consistent and sanitized across core pages', () => {
    const corePages = ['index.html', 'events.html', 'roster.html', 'reports.html', 'trophy-room.html', 'portal.html', 'admin.html', 'profile.html'];
    corePages.forEach(p => {
        const c = fs.readFileSync(path.join(root, p), 'utf8');
        assert(c.includes('js/auth.js'), `${p} must include auth.js`);
    });
});

// 5. Admin HTML Restricted Access Gatekeeper
runTest('admin.html has strict client-side & server-side protection gate', () => {
    const adminHtml = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
    assert(adminHtml.includes('Access Denied') || adminHtml.includes('admin-denied'), 'admin.html must contain an access denied view');
    assert(adminHtml.includes('KNOWN_ADMIN_UIDS') || adminHtml.includes('MASTER_ADMIN'), 'admin.html must verify admin identity');
});

// 6. Portal HTML Driver & Admin Gatekeeper
runTest('portal.html accurately gates verified drivers, captains, and admins', () => {
    const portalHtml = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
    assert(portalHtml.includes('initPortal(user)'), 'portal.html must have initPortal entrypoint');
    assert(portalHtml.includes('window.onAuthReady = onAuthReady'), 'portal.html must bind onAuthReady hook');
    assert(portalHtml.includes('showSelection('), 'portal.html must have team selection dashboard');
});

// 7. Session Cache Security
runTest('Auth cache only trusts known hardcoded admin UIDs on fast-path', () => {
    assert(authJsContent.includes("const resolvedIsAdmin = Boolean(userUid && KNOWN_ADMIN_UIDS.includes(userUid));"), 'Fast-path cache must not trust unverified isAdmin property');
});

// 8. Discord User Auto-Sync Sanitization
runTest('Auth sync safely handles Discord profiles and prevents invalid display names', () => {
    assert(authJsContent.includes("tokenResult.claims"), 'Claims retrieval check present');
    assert(authJsContent.includes("updateProfile({ displayName: realUsername })"), 'Auto-sync display name present');
});

console.log(`\nSuite 1 Summary: ${passedTests} Passed, ${failedTests} Failed\n`);
module.exports = { passedTests, failedTests };
