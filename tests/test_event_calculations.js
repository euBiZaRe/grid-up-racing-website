/**
 * Automated Test Suite: Event, Stint & Championship Calculations
 * Verifies calculation accuracy for lap times, points, event scheduling, and stint planning.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- TEST SUITE 4: EVENT, STINT & CHAMPIONSHIP CALCULATIONS ---');

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

// 1. Lap Time Formatter
function formatLapTime(seconds) {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '--:--.---';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    const secStr = secs < 10 ? '0' + secs : secs;
    return `${mins}:${secStr}`;
}

runTest('formatLapTime accurately formats raw seconds into MM:SS.mmm format', () => {
    assert.strictEqual(formatLapTime(83.456), '1:23.456');
    assert.strictEqual(formatLapTime(59.999), '0:59.999');
    assert.strictEqual(formatLapTime(125.002), '2:05.002');
    assert.strictEqual(formatLapTime(0), '--:--.---');
    assert.strictEqual(formatLapTime(null), '--:--.---');
});

// 2. Event Upcoming Logic
function isEventUpcoming(startDateStr, endDateStr, now = new Date()) {
    if (!startDateStr) return false;
    const sDate = new Date(startDateStr);
    const eDate = endDateStr ? new Date(endDateStr) : new Date(sDate.getTime() + 24 * 3600 * 1000);
    return eDate.getTime() >= now.getTime();
}

runTest('isEventUpcoming accurately classifies active and future races vs past events', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const pastDate = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    assert.strictEqual(isEventUpcoming(futureDate, null), true, 'Future date should be upcoming');
    assert.strictEqual(isEventUpcoming(pastDate, pastDate), false, 'Past date should not be upcoming');
});

// 3. iRating Elo / SOF Projection Formula
function calculateProjectedIRatingChange(driverIR, fieldIRatings, finishingPos) {
    if (!driverIR || !fieldIRatings || fieldIRatings.length <= 1) return 0;
    const n = fieldIRatings.length;
    // Expected score based on Bradley-Terry / Elo logistic model against the field
    let expectedWins = 0;
    fieldIRatings.forEach(oppIR => {
        if (oppIR !== driverIR) {
            expectedWins += 1 / (1 + Math.pow(10, (oppIR - driverIR) / 1600));
        }
    });
    // Actual wins = drivers finished behind
    const actualWins = n - finishingPos;
    // Standard iRacing scaling factor approx ~400 / n
    const kFactor = 400 / (n - 1);
    const change = Math.round(kFactor * (actualWins - expectedWins));
    return change;
}

runTest('calculateProjectedIRatingChange computes realistic gain/loss based on SOF and position', () => {
    const field = [3500, 3000, 2800, 2500, 2200, 1900];
    const winnerChange = calculateProjectedIRatingChange(2500, field, 1);
    const lastChange = calculateProjectedIRatingChange(2500, field, 6);
    assert(winnerChange > 0, `Winner projected gain should be positive (got ${winnerChange})`);
    assert(lastChange < 0, `Last place projected loss should be negative (got ${lastChange})`);
});

// 4. Stint Fuel Consumption Calculator
function calculateStintLaps(tankCapacityLiters, fuelPerLapLiters, formationLapLiters = 2.5) {
    if (!tankCapacityLiters || !fuelPerLapLiters || fuelPerLapLiters <= 0) return 0;
    const usableFuel = Math.max(0, tankCapacityLiters - formationLapLiters);
    return Math.floor(usableFuel / fuelPerLapLiters);
}

runTest('calculateStintLaps correctly calculates max laps based on tank capacity and consumption', () => {
    const lapsGT3 = calculateStintLaps(120, 3.42, 2.5); // 117.5 / 3.42 = 34.35 -> 34 laps
    assert.strictEqual(lapsGT3, 34);
});

// 5. M2RC Championship Points System
function getM2rcPoints(pos, isFastestLap = false) {
    const pointScale = { 1: 25, 2: 20, 3: 16, 4: 13, 5: 11, 6: 10, 7: 9, 8: 8, 9: 7, 10: 6, 11: 5, 12: 4, 13: 3, 14: 2, 15: 1 };
    const base = pointScale[pos] || 0;
    return base + (isFastestLap && base > 0 ? 1 : 0);
}

runTest('getM2rcPoints correctly assigns championship points and fastest lap bonuses', () => {
    assert.strictEqual(getM2rcPoints(1, false), 25);
    assert.strictEqual(getM2rcPoints(1, true), 26);
    assert.strictEqual(getM2rcPoints(3, false), 16);
    assert.strictEqual(getM2rcPoints(15, false), 1);
    assert.strictEqual(getM2rcPoints(16, false), 0);
});

console.log(`\nSuite 4 Summary: ${passedTests} Passed, ${failedTests} Failed\n`);
module.exports = { passedTests, failedTests };
