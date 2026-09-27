export interface FuelCalcParams {
  fuelLevelLiters: number;
  fuelTankCapacityLiters: number;
  burnRatePerLap: number;
  lapTimeSeconds: number;
  reserveFuelLiters: number;
}

export interface FuelCalculationResult {
  lapsRemaining: number;
  minutesRemaining: number;
  usableFuelLiters: number;
  isFuelCritical: boolean;
  pitWindowLaps: {
    minimumPitLap: number;
    recommendedPitLap: number;
    absoluteMaxLap: number;
  };
  fuelNeededToFinishLiters: (lapsToFinish: number) => number;
}

export function calculateFuelMetrics(params: FuelCalcParams, currentLap: number): FuelCalculationResult {
  const { fuelLevelLiters, burnRatePerLap, lapTimeSeconds, reserveFuelLiters } = params;

  const effectiveBurnRate = Math.max(burnRatePerLap, 0.5); // Fallback to avoid div by zero
  const usableFuel = Math.max(0, fuelLevelLiters - reserveFuelLiters);
  
  const rawLaps = usableFuel / effectiveBurnRate;
  const lapsRemaining = Math.max(0, Math.floor(rawLaps));
  const absoluteMaxLaps = Math.max(0, Math.floor(fuelLevelLiters / effectiveBurnRate));
  
  const minutesRemaining = (lapsRemaining * lapTimeSeconds) / 60;
  const isFuelCritical = lapsRemaining <= 2;

  const recommendedPitLap = currentLap + lapsRemaining;
  const minimumPitLap = Math.max(currentLap + 1, recommendedPitLap - 3);
  const absoluteMaxLap = currentLap + absoluteMaxLaps;

  return {
    lapsRemaining,
    minutesRemaining,
    usableFuelLiters: Number(usableFuel.toFixed(2)),
    isFuelCritical,
    pitWindowLaps: {
      minimumPitLap,
      recommendedPitLap,
      absoluteMaxLap
    },
    fuelNeededToFinishLiters: (lapsToFinish: number) => {
      const required = (lapsToFinish * effectiveBurnRate) + reserveFuelLiters;
      return Number(required.toFixed(1));
    }
  };
}

export function calculateFuelPerLap(lapHistory: { lapTime: number; fuelUsed: number }[]): {
  stintAverage: number;
  recentAverage: number;
} {
  if (!lapHistory || lapHistory.length === 0) {
    return { stintAverage: 3.2, recentAverage: 3.2 };
  }

  const validLaps = lapHistory.filter(l => l.fuelUsed > 0 && l.fuelUsed < 15);
  if (validLaps.length === 0) return { stintAverage: 3.2, recentAverage: 3.2 };

  const totalFuel = validLaps.reduce((acc, l) => acc + l.fuelUsed, 0);
  const stintAverage = totalFuel / validLaps.length;

  const recent = validLaps.slice(-3);
  const recentFuel = recent.reduce((acc, l) => acc + l.fuelUsed, 0);
  const recentAverage = recentFuel / recent.length;

  return {
    stintAverage: Number(stintAverage.toFixed(2)),
    recentAverage: Number(recentAverage.toFixed(2))
  };
}
