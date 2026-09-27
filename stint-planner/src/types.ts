export type CarStatus = 'ON_TRACK' | 'PIT_LANE' | 'IN_STALL' | 'OUT_LAP' | 'IN_LAP' | 'GARAGE' | 'STOPPED';

export type StintStatus = 'PLANNED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | 'OVERRIDDEN';

export type TelemetrySource = 'GARAGE61' | 'LOCAL' | 'DEMO' | 'MANUAL';

export interface Driver {
  id: string;
  name: string;
  shortName?: string;
  iRacingCustId?: number;
  garage61Slug?: string;
  helmetColor?: string;
  isCaptain?: boolean;
  totalDriveTimeMinutes?: number;
  maxContinuousMinutes?: number;
  minRestMinutes?: number;
  avatarUrl?: string;
}

export interface Stint {
  id: string;
  stintNumber: number;
  driverId: string;
  driverName: string;
  status: StintStatus;
  isLocked: boolean; // 🔒 Locked stints won't be moved or changed during automatic recalculations
  
  // Planned times
  plannedStartTime: string; // ISO string or race elapsed time (HH:MM:SS)
  plannedEndTime: string;
  plannedDurationMinutes: number;
  plannedLaps: number;
  plannedFuelLiters: number;
  targetLapTimeSeconds: number;

  // Actual / Live execution
  actualStartTime?: string;
  actualEndTime?: string;
  actualDurationMinutes?: number;
  actualLapsCompleted?: number;
  fuelStartLiters?: number;
  fuelEndLiters?: number;
  averageLapTimeSeconds?: number;
  bestLapTimeSeconds?: number;
  notes?: string;

  // Pit window for this stint
  pitWindowOpenLap?: number;
  pitWindowCloseLap?: number;
  pitWindowOpenTime?: string;
  pitWindowCloseTime?: string;
}

export interface CarTelemetry {
  lastUpdated: number;
  source: TelemetrySource;
  isConnected: boolean;
  carStatus: CarStatus;
  currentDriverId: string;
  currentDriverName: string;
  currentStintIndex: number;
  
  // Laps & Progress
  lapNumber: number;
  lapDistancePercentage: number;
  lastLapTimeSeconds: number;
  bestLapTimeSeconds: number;
  stintAverageLapTimeSeconds: number;
  recentLapTimes: number[]; // Last 5 laps
  
  // Fuel
  fuelLevelLiters: number;
  fuelPct: number;
  fuelBurnRateLitersPerLap: number;
  stintFuelBurnRateLitersPerLap: number;
  estimatedLapsRemainingOnFuel: number;
  estimatedMinutesRemainingOnFuel: number;
  
  // Pit & Timing
  stintElapsedTimeSeconds: number;
  stintRemainingTimeSeconds: number;
  inPitLane: boolean;
  pitLaneTimeSeconds?: number;
  pitStopCount: number;
  predictedPitLap: number;
  predictedPitTimeSeconds: number; // race elapsed seconds
}

export interface Car {
  id: string;
  carNumber: string;
  carName: string;
  carClass: string;
  carModel: string;
  fuelTankCapacityLiters: number;
  reserveFuelLiters: number;
  defaultStintMinutes: number;
  stintMinutes: number;
  captain?: string;
  drivers: Driver[];
  stints: Stint[];
  
  // Real-time telemetry snapshot
  telemetry: CarTelemetry;
}

export interface RaceStrategyConfig {
  fuelSafetyMarginLiters: number;
  pitStopDeltaSeconds: number; // Time lost for standard pit stop + driver change
  driverChangeTimeSeconds: number;
  fuelFillRateLitersPerSec: number;
  tireChangeTimeSeconds: number;
  canFuelAndTireSimultaneously: boolean;
  yellowFlagSpeedDeltaPct: number;
}

export interface RaceAlert {
  id: string;
  carId: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  type: 'DRIVER_CHANGE_SOON' | 'FUEL_CRITICAL' | 'PIT_WINDOW_OPEN' | 'STRATEGY_DEVIATION' | 'DRIVER_MAX_TIME';
  title: string;
  message: string;
  timestamp: number;
  dismissed?: boolean;
}

export interface Race {
  id: string;
  name: string;
  trackName: string;
  trackLengthMeters?: number;
  durationHours: number;
  totalPlannedLaps?: number;
  startTime: string; // ISO date or simulated start
  simulatedTimeSeconds: number;
  isLive: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  cars: Car[];
  activeCarId: string;
  strategyConfig: RaceStrategyConfig;
  alerts: RaceAlert[];
}

export interface TelemetrySample {
  timestamp: number;
  carNumber: string;
  driverName: string;
  lapNumber: number;
  lapTimeSeconds?: number;
  fuelLevelLiters: number;
  inPit: boolean;
  speedKmh?: number;
  trackPosPct?: number;
}
