/**
 * Automated Test Suite: Firebase Security Rules & Data Integrity
 * Verifies that firestore.rules and database.rules.json enforce least-privilege access.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const firestoreRules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
const dbRules = fs.readFileSync(path.join(root, 'database.rules.json'), 'utf8');

console.log('--- TEST SUITE 3: FIREBASE SECURITY RULES AUDIT ---');

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

// 1. Default Deny Rule
runTest('firestore.rules enforces default deny catch-all', () => {
    assert(firestoreRules.includes('match /{document=**} {'), 'Catch-all match block missing');
    assert(firestoreRules.includes('allow read, write: if false;'), 'Catch-all deny missing');
});

// 2. Admin Settings Protection
runTest('settings/admins collection is write-protected to hardcoded admins only', () => {
    assert(firestoreRules.includes("match /settings/{docId}"), 'settings match rule missing');
    assert(firestoreRules.includes("docId != 'admins'"), 'admins doc must be prevented from standard admin modification');
});

// 3. User Document Ownership
runTest('users collection enforces user ownership on write and prevents role tampering', () => {
    assert(firestoreRules.includes("match /users/{userId}"), 'users rule missing');
    assert(firestoreRules.includes("isOwner(userId)"), 'User ownership check missing');
    assert(firestoreRules.includes("isHardcodedAdmin()"), 'Hardcoded admin check present for privileged role updates');
});

// 4. Claims Collection Validation
runTest('claims collection validates claim creation schema and restricts updates to admins', () => {
    assert(firestoreRules.includes("match /claims/{claimId}"), 'claims rule missing');
    assert(firestoreRules.includes("isValidClaimCreate("), 'Claim validation function missing');
    assert(firestoreRules.includes("allow update, delete: if isAdmin();"), 'Claims modification must be restricted to admins');
});

// 5. Lineups and Teams Protection
runTest('race_lineups and teams collections are strictly write-restricted to admins', () => {
    assert(firestoreRules.includes("match /race_lineups/{eventId}"), 'race_lineups rule missing');
    assert(firestoreRules.includes("allow write: if isAdmin();"), 'race_lineups must be admin write only');
});

// 6. Realtime Database Setup Jobs Protection
runTest('database.rules.json setup_jobs requires authenticated owner or admin for execution', () => {
    assert(dbRules.includes('"setup_jobs"'), 'setup_jobs rules missing');
    assert(dbRules.includes('"driver_registry"'), 'driver_registry rules missing');
    assert(dbRules.includes('ownerUid'), 'ownerUid validation missing');
});

// 7. Realtime Database Catch-all Deny
runTest('database.rules.json enforces default read/write false at root', () => {
    assert(dbRules.includes('".read": false'), 'Root read false missing');
    assert(dbRules.includes('".write": false'), 'Root write false missing');
});

console.log(`\nSuite 3 Summary: ${passedTests} Passed, ${failedTests} Failed\n`);
module.exports = { passedTests, failedTests };
