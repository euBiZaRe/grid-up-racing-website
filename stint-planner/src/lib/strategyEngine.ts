import { Stint, Driver, Car, RaceStrategyConfig } from '../types';

export interface StrategyPlanRequest {
  raceDurationHours: number;
  fuelTankCapacityLiters: number;
  reserveFuelLiters: number;
  fuelBurnRateLitersPerLap: number;
  targetLapTimeSeconds: number;
  pitStopDeltaSeconds: number;
  drivers: Driver[];
}

export function formatSecondsToRaceClock(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatSecondsToHHMM(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function generateInitialSchedule(params: StrategyPlanRequest): Stint[] {
  const {
    raceDurationHours,
    fuelTankCapacityLiters,
    reserveFuelLiters,
    fuelBurnRateLitersPerLap,
    targetLapTimeSeconds,
    pitStopDeltaSeconds,
    drivers
  } = params;

  if (!drivers || drivers.length === 0) return [];

  const totalRaceSeconds = raceDurationHours * 3600;
  const usableFuel = Math.max(10, fuelTankCapacityLiters - reserveFuelLiters);
  const lapsPerStint = Math.floor(usableFuel / Math.max(0.5, fuelBurnRateLitersPerLap));
  const stintTrackSeconds = lapsPerStint * targetLapTimeSeconds;
  const stintTotalSeconds = stintTrackSeconds + pitStopDeltaSeconds;
  const stintMinutes = Math.round(stintTotalSeconds / 60);

  const stints: Stint[] = [];
  let currentElapsedSeconds = 0;
  let stintIndex = 1;
  let driverIdx = 0;

  while (currentElapsedSeconds < totalRaceSeconds) {
    const remainingRaceSeconds = totalRaceSeconds - currentElapsedSeconds;
    const thisStintDurationSeconds = Math.min(stintTotalSeconds, remainingRaceSeconds);
    const thisStintMinutes = Math.max(1, Math.round(thisStintDurationSeconds / 60));
    const thisStintLaps = Math.max(1, Math.round(thisStintDurationSeconds / targetLapTimeSeconds));
    const assignedDriver = drivers[driverIdx % drivers.length];

    const startTimeSec = currentElapsedSeconds;
    const endTimeSec = currentElapsedSeconds + thisStintDurationSeconds;

    stints.push({
      id: `stint-${stintIndex}-${Date.now().toString(36)}`,
      stintNumber: stintIndex,
      driverId: assignedDriver.id,
      driverName: assignedDriver.name,
      status: stintIndex === 1 ? 'LIVE' : 'PLANNED',
      isLocked: false,
      plannedStartTime: formatSecondsToHHMM(startTimeSec),
      plannedEndTime: formatSecondsToHHMM(endTimeSec),
      plannedDurationMinutes: thisStintMinutes,
      plannedLaps: thisStintLaps,
      plannedFuelLiters: fuelTankCapacityLiters,
      targetLapTimeSeconds,
      pitWindowOpenLap: Math.max(1, thisStintLaps - 3),
      pitWindowCloseLap: thisStintLaps,
      pitWindowOpenTime: formatSecondsToHHMM(startTimeSec + ((thisStintLaps - 3) * targetLapTimeSeconds)),
      pitWindowCloseTime: formatSecondsToHHMM(endTimeSec)
    });

    currentElapsedSeconds += thisStintDurationSeconds;
    stintIndex++;
    driverIdx++;
  }

  return stints;
}

export function recalculateDownstreamStrategy(
  currentCar: Car,
  currentRaceElapsedSeconds: number,
  totalRaceSeconds: number,
  strategyConfig: RaceStrategyConfig
): Stint[] {
  const stints = [...currentCar.stints];
  if (stints.length === 0) return stints;

  const currentStintIdx = stints.findIndex(s => s.status === 'LIVE');
  if (currentStintIdx === -1) return stints;

  const currentStint = stints[currentStintIdx];
  const telemetry = currentCar.telemetry;

  const usableFuel = Math.max(0, telemetry.fuelLevelLiters - currentCar.reserveFuelLiters);
  const burnRate = Math.max(0.5, telemetry.stintFuelBurnRateLitersPerLap || telemetry.fuelBurnRateLitersPerLap || 3.2);
  const lapTime = telemetry.lastLapTimeSeconds > 30 ? telemetry.lastLapTimeSeconds : 100;
  
  const lapsLeftOnFuel = Math.floor(usableFuel / burnRate);
  const secondsLeftInCurrentStint = lapsLeftOnFuel * lapTime;

  const currentStintActualPitSeconds = currentRaceElapsedSeconds + secondsLeftInCurrentStint;
  currentStint.plannedEndTime = formatSecondsToHHMM(currentStintActualPitSeconds);
  currentStint.pitWindowCloseTime = formatSecondsToHHMM(currentStintActualPitSeconds);
  currentStint.pitWindowOpenTime = formatSecondsToHHMM(Math.max(currentRaceElapsedSeconds, currentStintActualPitSeconds - (3 * lapTime)));
  currentStint.pitWindowCloseLap = telemetry.lapNumber + lapsLeftOnFuel;
  currentStint.pitWindowOpenLap = Math.max(telemetry.lapNumber + 1, currentStint.pitWindowCloseLap - 3);

  let rollingStartSeconds = currentStintActualPitSeconds + strategyConfig.pitStopDeltaSeconds;
  
  const standardUsableFuel = currentCar.fuelTankCapacityLiters - currentCar.reserveFuelLiters;
  const standardLapsPerFullStint = Math.floor(standardUsableFuel / burnRate);
  const standardStintSeconds = (standardLapsPerFullStint * lapTime) + strategyConfig.pitStopDeltaSeconds;

  for (let i = currentStintIdx + 1; i < stints.length; i++) {
    const s = stints[i];

    if (s.status === 'COMPLETED' || s.status === 'CANCELLED') continue;

    if (s.isLocked) {
      const lockedDurationSeconds = s.plannedDurationMinutes * 60;
      s.plannedStartTime = formatSecondsToHHMM(rollingStartSeconds);
      s.plannedEndTime = formatSecondsToHHMM(rollingStartSeconds + lockedDurationSeconds);
      rollingStartSeconds += lockedDurationSeconds + strategyConfig.pitStopDeltaSeconds;
      continue;
    }

    const remainingSeconds = Math.max(0, totalRaceSeconds - rollingStartSeconds);
    if (remainingSeconds <= 0) {
      s.status = 'CANCELLED';
      continue;
    }

    const durationSeconds = Math.min(standardStintSeconds, remainingSeconds);
    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
    const laps = Math.max(1, Math.round(durationSeconds / lapTime));

    s.plannedStartTime = formatSecondsToHHMM(rollingStartSeconds);
    s.plannedEndTime = formatSecondsToHHMM(rollingStartSeconds + durationSeconds);
    s.plannedDurationMinutes = durationMinutes;
    s.plannedLaps = laps;
    s.pitWindowCloseLap = (stints[i - 1].pitWindowCloseLap || 0) + laps;
    s.pitWindowOpenLap = Math.max(1, s.pitWindowCloseLap - 3);
    s.pitWindowOpenTime = formatSecondsToHHMM(rollingStartSeconds + ((laps - 3) * lapTime));
    s.pitWindowCloseTime = formatSecondsToHHMM(rollingStartSeconds + durationSeconds);

    rollingStartSeconds += durationSeconds + strategyConfig.pitStopDeltaSeconds;
  }

  return stints;
}

export function advanceStintOnPitExit(
  currentCar: Car,
  nextDriverOverrideId?: string
): { updatedCar: Car; completedStint: Stint; newLiveStint: Stint } {
  const stints = [...currentCar.stints];
  const liveIdx = stints.findIndex(s => s.status === 'LIVE');
  
  if (liveIdx === -1) {
    throw new Error('No live stint found to complete');
  }

  const completedStint = {
    ...stints[liveIdx],
    status: 'COMPLETED' as const,
    actualEndTime: formatSecondsToHHMM(currentCar.telemetry.lastUpdated / 1000)
  };
  stints[liveIdx] = completedStint;

  const nextIdx = liveIdx + 1;
  let newLiveStint: Stint;

  if (nextIdx < stints.length) {
    const nextStint = { ...stints[nextIdx] };
    if (nextDriverOverrideId) {
      const driver = currentCar.drivers.find(d => d.id === nextDriverOverrideId);
      if (driver) {
        nextStint.driverId = driver.id;
        nextStint.driverName = driver.name;
      }
    }
    nextStint.status = 'LIVE';
    nextStint.actualStartTime = formatSecondsToHHMM(currentCar.telemetry.lastUpdated / 1000);
    stints[nextIdx] = nextStint;
    newLiveStint = nextStint;
  } else {
    newLiveStint = {
      id: `stint-extra-${Date.now()}`,
      stintNumber: stints.length + 1,
      driverId: currentCar.drivers[0]?.id || 'driver-1',
      driverName: currentCar.drivers[0]?.name || 'Driver 1',
      status: 'LIVE',
      isLocked: false,
      plannedStartTime: formatSecondsToHHMM(currentCar.telemetry.lastUpdated / 1000),
      plannedEndTime: formatSecondsToHHMM((currentCar.telemetry.lastUpdated / 1000) + 3600),
      plannedDurationMinutes: 60,
      plannedLaps: 35,
      plannedFuelLiters: currentCar.fuelTankCapacityLiters,
      targetLapTimeSeconds: 100
    };
    stints.push(newLiveStint);
  }

  const updatedCar: Car = {
    ...currentCar,
    stints,
    telemetry: {
      ...currentCar.telemetry,
      currentDriverId: newLiveStint.driverId,
      currentDriverName: newLiveStint.driverName,
      currentStintIndex: nextIdx < stints.length ? nextIdx : stints.length - 1,
      stintElapsedTimeSeconds: 0,
      pitStopCount: currentCar.telemetry.pitStopCount + 1,
      fuelLevelLiters: currentCar.fuelTankCapacityLiters,
      fuelPct: 100
    }
  };

  return { updatedCar, completedStint, newLiveStint };
}
