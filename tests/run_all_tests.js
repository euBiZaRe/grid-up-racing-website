/**
 * Master Test Runner for GRiD UP Web Platform
 * Executes all automated test suites and outputs overall results.
 */
console.log('========================================================');
console.log('  GRiD UP AUTOMATED TESTING SUITE - MASTER EXECUTION    ');
console.log('========================================================\n');

const suite1 = require('./test_auth_and_permissions');
const suite2 = require('./test_routes_and_links');
const suite3 = require('./test_security_rules');
const suite4 = require('./test_event_calculations');

const totalPassed = suite1.passedTests + suite2.passedTests + suite3.passedTests + suite4.passedTests;
const totalFailed = suite1.failedTests + suite2.failedTests + suite3.failedTests + suite4.failedTests;
const totalTests = totalPassed + totalFailed;

console.log('========================================================');
console.log('                 FINAL TEST RESULTS                     ');
console.log('========================================================');
console.log(`  Total Test Suites  : 4`);
console.log(`  Total Tests Run    : ${totalTests}`);
console.log(`  Passed             : ${totalPassed}`);
console.log(`  Failed             : ${totalFailed}`);
console.log(`  Success Rate       : ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
console.log('========================================================\n');

if (totalFailed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
