/**
 * GRiD UP Sim Racing - Live Telemetry Stint Planner & Adaptive Race Tracker
 * Synchronizes planned stint schedules with real-time iRacing telemetry feeds.
 */

(function (window) {
    'use strict';

    const PRESET_STINT_MINUTES = {
        'restricted_fuel': 30,
        'prototype_lmp2': 45,
        'gt_standard': 60,
        'double_stint_90': 90,
        'double_stint_120': 120
    };

    /**
     * Format seconds to HH:MM:SS or MM:SS string
     */
    function formatRaceClock(totalSeconds) {
        if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = Math.floor(totalSeconds % 60);
        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function formatShortClock(totalMinutes) {
        const hrs = Math.floor(totalMinutes / 60);
        const mins = Math.floor(totalMinutes % 60);
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    /**
     * Generate an initial planned stint schedule for a car entry.
     */
    function generateStintSchedule(options) {
        const durationHours = parseFloat(options.durationHours) || 6;
        const stintMinutes = parseInt(options.stintMinutes) || 60;
        const drivers = Array.isArray(options.drivers) && options.drivers.length > 0 ? options.drivers : ['Driver 1'];
        const totalMinutes = durationHours * 60;
        const totalStints = Math.ceil(totalMinutes / stintMinutes);

        const stints = [];
        let currentElapsedMinutes = 0;

        for (let i = 0; i < totalStints; i++) {
            const driverIndex = i % drivers.length;
            const driver = drivers[driverIndex];
            const driverName = typeof driver === 'object' && driver !== null ? (driver.name || driver.driverName || 'Driver') : driver;
            const driverUid = typeof driver === 'object' && driver !== null ? (driver.uid || '') : '';

            const endMinutes = Math.min(currentElapsedMinutes + stintMinutes, totalMinutes);
            const plannedDurationMinutes = endMinutes - currentElapsedMinutes;

            stints.push({
                stintIndex: i + 1,
                driverName: driverName,
                driverUid: driverUid,
                plannedStartMinutes: currentElapsedMinutes,
                plannedEndMinutes: endMinutes,
                plannedDurationMinutes: plannedDurationMinutes,
                plannedStartTimeStr: formatShortClock(currentElapsedMinutes),
                plannedEndTimeStr: formatShortClock(endMinutes),
                status: 'scheduled', // 'scheduled' | 'on_deck' | 'active' | 'completed'
                actualStartSec: null,
                actualEndSec: null,
                actualLaps: 0,
                avgLapSec: 0,
                bestLapSec: 0,
                fuelConsumedLiters: 0,
                notes: ''
            });

            currentElapsedMinutes = endMinutes;
        }

        return {
            carNumber: options.carNumber || '144',
            carClass: options.carClass || 'GT3',
            stintMinutes: stintMinutes,
            totalStints: totalStints,
            totalDurationHours: durationHours,
            stints: stints
        };
    }

    /**
     * Recalculates remaining scheduled stints when an active or completed stint shifts (delta in minutes).
     */
    function cascadeScheduleDelta(stints, fromIndex, deltaMinutes) {
        if (!Array.isArray(stints) || deltaMinutes === 0) return stints;

        for (let i = 0; i < stints.length; i++) {
            const s = stints[i];
            if (s.stintIndex > fromIndex && s.status === 'scheduled') {
                s.plannedStartMinutes = Math.max(0, s.plannedStartMinutes + deltaMinutes);
                s.plannedEndMinutes = Math.max(s.plannedStartMinutes + 5, s.plannedEndMinutes + deltaMinutes);
                s.plannedStartTimeStr = formatShortClock(s.plannedStartMinutes);
                s.plannedEndTimeStr = formatShortClock(s.plannedEndMinutes);
            }
        }
        return stints;
    }

    /**
     * Live Stint Tracker instance that binds to Firebase RTDB telemetry
     */
    function createLiveTracker(config) {
        const teamId = config.teamId || 'gridUp_sim';
        const carNumber = config.carNumber || null;
        let schedule = config.initialSchedule || null;
        const onUpdate = config.onUpdate || function () {};
        const onAlert = config.onAlert || function () {};
        const onStintComplete = config.onStintComplete || function () {};

        let currentActiveStintIdx = 1;
        let lastKnownDriver = null;
        let lastKnownLap = 0;
        let stintStartLap = 0;
        let stintStartTime = null;
        let initialStintFuel = null;
        let fuelBurnHistory = [];
        let lastFuelVal = null;
        let rtdbRef = null;
        let isRunning = false;

        function getFirebaseDatabase() {
            if (window.cachedTelemetryDb) return window.cachedTelemetryDb;
            try {
                let telemetryApp = firebase.apps.find(app => app.name === "telemetry");
                if (!telemetryApp) {
                    telemetryApp = firebase.initializeApp({
                        databaseURL: "https://grid-up-racedash-default-rtdb.europe-west1.firebasedatabase.app"
                    }, "telemetry");
                }
                window.cachedTelemetryDb = telemetryApp.database();
                return window.cachedTelemetryDb;
            } catch (err) {
                console.warn("[StintPlanner] Fallback to default firebase database:", err);
                return firebase.database();
            }
        }

        function processTelemetryFrame(streamData, presenceData) {
            if (!streamData) return;
            const tel = streamData.telemetry || {};
            const session = streamData.session || {};

            const activeDriver = (presenceData && presenceData.name) ||
                (tel.drivers && tel.playerIdx !== undefined && tel.drivers[tel.playerIdx]?.name) ||
                lastKnownDriver || 'Unknown Driver';

            const activeCarNum = (presenceData && presenceData.carNum) || tel.carNum || '';
            const currentLap = tel.lap || 0;
            const currentFuel = tel.fuel || 0;
            const currentSpeed = tel.speed || 0;
            const inPitLane = tel.inPit === true || (currentSpeed < 4 && currentLap > 0);

            // Fuel Burn Tracker
            if (lastFuelVal !== null && currentLap > lastKnownLap && currentLap > 0) {
                const fuelBurnedThisLap = lastFuelVal - currentFuel;
                if (fuelBurnedThisLap > 0.5 && fuelBurnedThisLap < 15) {
                    fuelBurnHistory.push(fuelBurnedThisLap);
                    if (fuelBurnHistory.length > 5) fuelBurnHistory.shift();
                }
            }
            lastFuelVal = currentFuel;

            const avgFuelBurnPerLap = fuelBurnHistory.length > 0
                ? (fuelBurnHistory.reduce((a, b) => a + b, 0) / fuelBurnHistory.length)
                : 3.2;

            const lapsRemainingOnFuel = avgFuelBurnPerLap > 0 ? (currentFuel / avgFuelBurnPerLap) : 0;
            const lastLapTimeSec = tel.lastLap || 90;
            const estMinutesRemainingOnFuel = (lapsRemainingOnFuel * lastLapTimeSec) / 60;

            if (!schedule || !schedule.stints) return;

            const activeStint = schedule.stints.find(s => s.stintIndex === currentActiveStintIdx) || schedule.stints[0];
            const nextStint = schedule.stints.find(s => s.stintIndex === currentActiveStintIdx + 1);

            if (activeStint && activeStint.status === 'scheduled') {
                activeStint.status = 'active';
                activeStint.actualStartSec = Date.now();
                stintStartTime = Date.now();
                stintStartLap = currentLap;
                initialStintFuel = currentFuel;
            }

            // Driver Swap / Pit Stop Detection
            if (lastKnownDriver && activeDriver !== lastKnownDriver && inPitLane) {
                completeCurrentStint({
                    concludedDriver: lastKnownDriver,
                    lapsCompleted: Math.max(0, currentLap - stintStartLap),
                    fuelUsed: initialStintFuel ? Math.max(0, initialStintFuel - currentFuel) : 0
                });

                currentActiveStintIdx++;
                const newActive = schedule.stints.find(s => s.stintIndex === currentActiveStintIdx);
                if (newActive) {
                    newActive.status = 'active';
                    newActive.actualStartSec = Date.now();
                    stintStartTime = Date.now();
                    stintStartLap = currentLap;
                    initialStintFuel = currentFuel;
                }
            }

            // On-Deck Trigger
            if (nextStint && nextStint.status === 'scheduled') {
                if (estMinutesRemainingOnFuel <= 10 || lapsRemainingOnFuel <= 3) {
                    nextStint.status = 'on_deck';
                    onAlert({
                        type: 'ON_DECK',
                        driverName: nextStint.driverName,
                        stintIndex: nextStint.stintIndex,
                        minutesRemaining: Math.max(1, Math.round(estMinutesRemainingOnFuel)),
                        lapsRemaining: Math.max(1, Math.round(lapsRemainingOnFuel))
                    });
                }
            }

            // Update live metrics on current active stint
            if (activeStint && activeStint.status === 'active') {
                activeStint.actualLaps = Math.max(0, currentLap - stintStartLap);
                activeStint.currentFuelLiters = currentFuel;
                activeStint.avgBurnPerLap = avgFuelBurnPerLap.toFixed(2);
                activeStint.estLapsRemaining = Math.round(lapsRemainingOnFuel);
                activeStint.estMinutesRemaining = Math.max(0, Math.round(estMinutesRemainingOnFuel));
            }

            lastKnownDriver = activeDriver;
            lastKnownLap = currentLap;

            onUpdate({
                activeDriver: activeDriver,
                carNumber: activeCarNum,
                currentLap: currentLap,
                fuelLiters: currentFuel,
                fuelPct: tel.fuel_pct || 0,
                speed: currentSpeed,
                inPit: inPitLane,
                avgFuelBurnPerLap: avgFuelBurnPerLap,
                lapsRemainingOnFuel: lapsRemainingOnFuel,
                estMinutesRemainingOnFuel: estMinutesRemainingOnFuel,
                currentStint: activeStint,
                nextStint: nextStint,
                schedule: schedule
            });
        }

        function completeCurrentStint(metrics) {
            const stint = schedule.stints.find(s => s.stintIndex === currentActiveStintIdx);
            if (!stint) return;

            stint.status = 'completed';
            stint.actualEndSec = Date.now();
            stint.actualLaps = metrics.lapsCompleted || (lastKnownLap - stintStartLap);
            stint.fuelConsumedLiters = metrics.fuelUsed || 0;

            const actualDurationMinutes = stintStartTime ? ((Date.now() - stintStartTime) / 60000) : stint.plannedDurationMinutes;
            const delta = Math.round(actualDurationMinutes - stint.plannedDurationMinutes);

            if (delta !== 0) {
                cascadeScheduleDelta(schedule.stints, currentActiveStintIdx, delta);
            }

            onStintComplete({
                stint: stint,
                deltaMinutes: delta
            });
        }

        function startListening() {
            if (isRunning) return;
            isRunning = true;
            const db = getFirebaseDatabase();
            rtdbRef = db.ref(`teams/${teamId}`);

            rtdbRef.on('value', snapshot => {
                const val = snapshot.val();
                if (!val) return;
                const streams = val.streams || {};
                const drivers = val.drivers || {};

                let targetMid = Object.keys(streams)[0];
                if (carNumber) {
                    const match = Object.keys(streams).find(mid => {
                        const stream = streams[mid];
                        const presence = drivers[mid] || {};
                        return (presence.carNum === carNumber || stream.telemetry?.carNum === carNumber);
                    });
                    if (match) targetMid = match;
                }

                if (targetMid && streams[targetMid]) {
                    processTelemetryFrame(streams[targetMid], drivers[targetMid] || {});
                }
            });
        }

        function stopListening() {
            if (rtdbRef) {
                rtdbRef.off();
                rtdbRef = null;
            }
            isRunning = false;
        }

        function manualDriverSwap(newDriverName) {
            completeCurrentStint({
                concludedDriver: lastKnownDriver,
                lapsCompleted: lastKnownLap - stintStartLap
            });
            currentActiveStintIdx++;
            const next = schedule.stints.find(s => s.stintIndex === currentActiveStintIdx);
            if (next) {
                if (newDriverName) next.driverName = newDriverName;
                next.status = 'active';
                next.actualStartSec = Date.now();
                stintStartTime = Date.now();
                stintStartLap = lastKnownLap;
            }
            onUpdate({ schedule: schedule });
        }

        return {
            start: startListening,
            stop: stopListening,
            manualDriverSwap: manualDriverSwap,
            getSchedule: () => schedule,
            setSchedule: (newSched) => { schedule = newSched; }
        };
    }

    // Expose API on global scope
    window.GridUpStintPlanner = {
        PRESET_STINT_MINUTES: PRESET_STINT_MINUTES,
        generateStintSchedule: generateStintSchedule,
        cascadeScheduleDelta: cascadeScheduleDelta,
        createLiveTracker: createLiveTracker,
        formatRaceClock: formatRaceClock,
        formatShortClock: formatShortClock
    };

})(typeof window !== 'undefined' ? window : this);
