import { test } from 'node:test';
import assert from 'node:assert/strict';

import { 
  generateInitialSchedule, 
  recalculateDownstreamStrategy, 
  advanceStintOnPitExit,
  formatSecondsToRaceClock,
  formatSecondsToHHMM
} from '../src/lib/strategyEngine.ts';

import { 
  calculateFuelMetrics, 
  calculateFuelPerLap 
} from '../src/lib/fuelCalculator.ts';

test('formatSecondsToRaceClock formats correctly', () => {
  assert.equal(formatSecondsToRaceClock(0), '00:00:00');
  assert.equal(formatSecondsToRaceClock(3665), '01:01:05');
  assert.equal(formatSecondsToRaceClock(86400), '24:00:00');
});

test('formatSecondsToHHMM formats correctly', () => {
  assert.equal(formatSecondsToHHMM(0), '00:00');
  assert.equal(formatSecondsToHHMM(3600), '01:00');
  assert.equal(formatSecondsToHHMM(7260), '02:01');
});

test('calculateFuelMetrics accurately computes laps and pit windows', () => {
  const result = calculateFuelMetrics({
    fuelLevelLiters: 60,
    fuelTankCapacityLiters: 105,
    burnRatePerLap: 3.0,
    lapTimeSeconds: 100,
    reserveFuelLiters: 4.5
  }, 10);

  // Usable fuel: 60 - 4.5 = 55.5L / 3.0 = 18.5 laps -> 18 laps
  assert.equal(result.usableFuelLiters, 55.5);
  assert.equal(result.lapsRemaining, 18);
  assert.equal(result.pitWindowLaps.recommendedPitLap, 28);
  assert.equal(result.isFuelCritical, false);
});

test('calculateFuelMetrics flags critical when <= 2 laps remaining', () => {
  const result = calculateFuelMetrics({
    fuelLevelLiters: 8.0,
    fuelTankCapacityLiters: 105,
    burnRatePerLap: 3.0,
    lapTimeSeconds: 100,
    reserveFuelLiters: 4.0
  }, 30);

  assert.equal(result.lapsRemaining, 1);
  assert.equal(result.isFuelCritical, true);
});

test('calculateFuelMetrics computes fuel needed to finish with buffer', () => {
  const result = calculateFuelMetrics({
    fuelLevelLiters: 50,
    fuelTankCapacityLiters: 100,
    burnRatePerLap: 3.2,
    lapTimeSeconds: 100,
    reserveFuelLiters: 4.0
  }, 10);

  // 20 laps to finish * 3.2 + 4.0 = 68.0L
  assert.equal(result.fuelNeededToFinishLiters(20), 68.0);
});

test('calculateFuelPerLap computes recent and stint averages', () => {
  const lapHistory = [
    { lapTime: 100, fuelUsed: 3.2 },
    { lapTime: 101, fuelUsed: 3.4 },
    { lapTime: 99, fuelUsed: 3.0 },
    { lapTime: 100, fuelUsed: 3.1 }
  ];

  const res = calculateFuelPerLap(lapHistory);
  assert.ok(res.stintAverage > 3.0 && res.stintAverage < 3.3);
  assert.ok(res.recentAverage > 3.0 && res.recentAverage < 3.3);
});

test('generateInitialSchedule generates balanced stints across duration', () => {
  const drivers = [
    { id: 'd1', name: 'Driver A' },
    { id: 'd2', name: 'Driver B' }
  ];

  const stints = generateInitialSchedule({
    raceDurationHours: 4,
    fuelTankCapacityLiters: 100,
    reserveFuelLiters: 5,
    fuelBurnRateLitersPerLap: 3.16, // ~30 laps per stint = 50 mins
    targetLapTimeSeconds: 100,
    pitStopDeltaSeconds: 45,
    drivers
  });

  assert.ok(stints.length >= 4);
  assert.equal(stints[0].status, 'LIVE');
  assert.equal(stints[1].status, 'PLANNED');
  assert.equal(stints[0].driverName, 'Driver A');
  assert.equal(stints[1].driverName, 'Driver B');
});

test('recalculateDownstreamStrategy respects locked stints', () => {
  const drivers = [
    { id: 'd1', name: 'Driver A' },
    { id: 'd2', name: 'Driver B' },
    { id: 'd3', name: 'Driver C' }
  ];

  const stints = generateInitialSchedule({
    raceDurationHours: 6,
    fuelTankCapacityLiters: 100,
    reserveFuelLiters: 5,
    fuelBurnRateLitersPerLap: 3.0,
    targetLapTimeSeconds: 100,
    pitStopDeltaSeconds: 40,
    drivers
  });

  // Lock stint 2
  stints[1].isLocked = true;
  const lockedDriver = stints[1].driverName;

  const mockCar = {
    id: 'car-1',
    carNumber: '144',
    carName: 'GRiD UP',
    carClass: 'GT3',
    carModel: 'Porsche 911 GT3.R',
    fuelTankCapacityLiters: 100,
    reserveFuelLiters: 5,
    defaultStintMinutes: 60,
    stintMinutes: 60,
    drivers,
    stints,
    telemetry: {
      lastUpdated: Date.now(),
      source: 'DEMO',
      isConnected: true,
      carStatus: 'ON_TRACK',
      currentDriverId: 'd1',
      currentDriverName: 'Driver A',
      currentStintIndex: 0,
      lapNumber: 15,
      lapDistancePercentage: 0.5,
      lastLapTimeSeconds: 100,
      bestLapTimeSeconds: 99.5,
      stintAverageLapTimeSeconds: 100.2,
      recentLapTimes: [100],
      fuelLevelLiters: 45,
      fuelPct: 45,
      fuelBurnRateLitersPerLap: 3.0,
      stintFuelBurnRateLitersPerLap: 3.0,
      estimatedLapsRemainingOnFuel: 13,
      estimatedMinutesRemainingOnFuel: 21.6,
      stintElapsedTimeSeconds: 1500,
      stintRemainingTimeSeconds: 1300,
      inPitLane: false,
      pitStopCount: 0,
      predictedPitLap: 28,
      predictedPitTimeSeconds: 2800
    }
  };

  const recalculated = recalculateDownstreamStrategy(
    mockCar,
    1500,
    6 * 3600,
    {
      fuelSafetyMarginLiters: 5,
      pitStopDeltaSeconds: 40,
      driverChangeTimeSeconds: 15,
      fuelFillRateLitersPerSec: 2.8,
      tireChangeTimeSeconds: 22,
      canFuelAndTireSimultaneously: false,
      yellowFlagSpeedDeltaPct: 35
    }
  );

  assert.equal(recalculated[1].isLocked, true);
  assert.equal(recalculated[1].driverName, lockedDriver);
});

test('advanceStintOnPitExit transitions completed stint and sets new live driver', () => {
  const drivers = [
    { id: 'd1', name: 'Driver A' },
    { id: 'd2', name: 'Driver B' }
  ];

  const stints = generateInitialSchedule({
    raceDurationHours: 2,
    fuelTankCapacityLiters: 100,
    reserveFuelLiters: 5,
    fuelBurnRateLitersPerLap: 3.0,
    targetLapTimeSeconds: 100,
    pitStopDeltaSeconds: 40,
    drivers
  });

  const car = {
    id: 'car-1',
    carNumber: '144',
    carName: 'GRiD UP',
    carClass: 'GT3',
    carModel: 'Porsche 911 GT3.R',
    fuelTankCapacityLiters: 100,
    reserveFuelLiters: 5,
    defaultStintMinutes: 60,
    stintMinutes: 60,
    drivers,
    stints,
    telemetry: {
      lastUpdated: 3600000,
      source: 'DEMO',
      isConnected: true,
      carStatus: 'PIT_LANE',
      currentDriverId: 'd1',
      currentDriverName: 'Driver A',
      currentStintIndex: 0,
      lapNumber: 30,
      lapDistancePercentage: 0.9,
      lastLapTimeSeconds: 100,
      bestLapTimeSeconds: 100,
      stintAverageLapTimeSeconds: 100,
      recentLapTimes: [100],
      fuelLevelLiters: 5,
      fuelPct: 5,
      fuelBurnRateLitersPerLap: 3.0,
      stintFuelBurnRateLitersPerLap: 3.0,
      estimatedLapsRemainingOnFuel: 0,
      estimatedMinutesRemainingOnFuel: 0,
      stintElapsedTimeSeconds: 3600,
      stintRemainingTimeSeconds: 0,
      inPitLane: true,
      pitStopCount: 0,
      predictedPitLap: 30,
      predictedPitTimeSeconds: 3600
    }
  };

  const { updatedCar, completedStint, newLiveStint } = advanceStintOnPitExit(car, 'd2');
  
  assert.equal(completedStint.status, 'COMPLETED');
  assert.equal(newLiveStint.status, 'LIVE');
  assert.equal(newLiveStint.driverId, 'd2');
  assert.equal(newLiveStint.driverName, 'Driver B');
  assert.equal(updatedCar.telemetry.currentDriverName, 'Driver B');
  assert.equal(updatedCar.telemetry.fuelLevelLiters, 100);
  assert.equal(updatedCar.telemetry.pitStopCount, 1);
});
