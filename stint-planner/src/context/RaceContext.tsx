import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Race, Car, Stint, TelemetrySample, RaceAlert, RaceStrategyConfig, Driver, CarTelemetry } from '../types';
import { generateInitialSchedule, recalculateDownstreamStrategy, advanceStintOnPitExit, formatSecondsToRaceClock } from '../lib/strategyEngine';
import { DemoSimulator } from '../lib/telemetry/DemoSimulator';
import { Garage61Provider } from '../lib/telemetry/Garage61Provider';
import { GridUpTelemetryProvider } from '../lib/telemetry/GridUpTelemetryProvider';
import { LocalTelemetryProvider } from '../lib/telemetry/LocalTelemetryProvider';
import { TelemetryProvider } from '../lib/telemetry/TelemetryProvider';

interface RaceContextType {
  race: Race;
  activeCar: Car;
  switchActiveCar: (carId: string) => void;
  updateStint: (carId: string, stintId: string, updates: Partial<Stint>) => void;
  toggleStintLock: (carId: string, stintId: string) => void;
  reorderStints: (carId: string, fromIndex: number, toIndex: number) => void;
  swapStintDriver: (carId: string, stintId: string, newDriverId: string) => void;
  triggerBoxThisLap: (carId: string) => void;
  triggerPitExitAndSwap: (carId: string, nextDriverId?: string) => void;
  manualFuelOverride: (carId: string, liters: number) => void;
  triggerSimulatedLap: () => void;
  setSimulationFast: (fast: boolean) => void;
  resetDemoRace: () => void;
  createNewRace: (raceData: Partial<Race>) => void;
  telemetrySource: string;
  setTelemetrySource: (source: 'GRIDUP_TOOL' | 'GARAGE61' | 'LOCAL' | 'DEMO') => void;
  garage61Token: string;
  setGarage61Token: (token: string) => void;
  isSimulatingFast: boolean;
  dismissAlert: (alertId: string) => void;
}

const DEFAULT_DRIVERS: Driver[] = [
  { id: 'd-1', name: 'Matty G', shortName: 'MAT', helmetColor: '#a855f7', isCaptain: true, maxContinuousMinutes: 120, totalDriveTimeMinutes: 0 },
  { id: 'd-2', name: 'Alex Rivera', shortName: 'RIV', helmetColor: '#00cfff', maxContinuousMinutes: 120, totalDriveTimeMinutes: 0 },
  { id: 'd-3', name: 'Liam Davies', shortName: 'DAV', helmetColor: '#00ff88', maxContinuousMinutes: 120, totalDriveTimeMinutes: 0 },
  { id: 'd-4', name: 'Marcus Vance', shortName: 'VAN', helmetColor: '#f59e0b', maxContinuousMinutes: 120, totalDriveTimeMinutes: 0 }
];

const DEFAULT_STRATEGY_CONFIG: RaceStrategyConfig = {
  fuelSafetyMarginLiters: 4.5,
  pitStopDeltaSeconds: 42,
  driverChangeTimeSeconds: 15,
  fuelFillRateLitersPerSec: 2.8,
  tireChangeTimeSeconds: 22,
  canFuelAndTireSimultaneously: false,
  yellowFlagSpeedDeltaPct: 35
};

function createInitialCar(id: string, carNumber: string, carName: string, carClass: string, carModel: string): Car {
  const initialTelemetry: CarTelemetry = {
    lastUpdated: Date.now(),
    source: 'DEMO',
    isConnected: true,
    carStatus: 'ON_TRACK',
    currentDriverId: 'd-1',
    currentDriverName: 'Matty G',
    currentStintIndex: 0,
    lapNumber: 14,
    lapDistancePercentage: 0.42,
    lastLapTimeSeconds: 101.4,
    bestLapTimeSeconds: 100.82,
    stintAverageLapTimeSeconds: 101.8,
    recentLapTimes: [102.1, 101.9, 101.4, 101.6, 101.4],
    fuelLevelLiters: 58.2,
    fuelPct: 55.4,
    fuelBurnRateLitersPerLap: 3.12,
    stintFuelBurnRateLitersPerLap: 3.14,
    estimatedLapsRemainingOnFuel: 17,
    estimatedMinutesRemainingOnFuel: 28.7,
    stintElapsedTimeSeconds: 1980,
    stintRemainingTimeSeconds: 1620,
    inPitLane: false,
    pitStopCount: 0,
    predictedPitLap: 31,
    predictedPitTimeSeconds: 3600
  };

  const stints = generateInitialSchedule({
    raceDurationHours: 6,
    fuelTankCapacityLiters: 105,
    reserveFuelLiters: 4.5,
    fuelBurnRateLitersPerLap: 3.14,
    targetLapTimeSeconds: 101.4,
    pitStopDeltaSeconds: 42,
    drivers: DEFAULT_DRIVERS
  });

  return {
    id,
    carNumber,
    carName,
    carClass,
    carModel,
    fuelTankCapacityLiters: 105,
    reserveFuelLiters: 4.5,
    defaultStintMinutes: 60,
    stintMinutes: 60,
    captain: 'Matty G',
    drivers: DEFAULT_DRIVERS,
    stints,
    telemetry: initialTelemetry
  };
}

function createDefaultRace(): Race {
  const car7 = createInitialCar('car-144', '144', 'GRiD UP #144 Esports', 'GT3', 'Porsche 911 GT3.R');
  const car22 = createInitialCar('car-22', '22', 'GRiD UP #22 Academy', 'GT3', 'BMW M4 GT3');
  car22.telemetry.currentDriverName = 'Liam Davies';
  car22.telemetry.currentDriverId = 'd-3';
  car22.telemetry.lapNumber = 13;
  car22.telemetry.fuelLevelLiters = 62.0;

  return {
    id: 'race-bathurst-12h',
    name: 'Mount Panorama 12 Hour Endurance',
    trackName: 'Mount Panorama Circuit (Bathurst)',
    trackLengthMeters: 6213,
    durationHours: 6,
    totalPlannedLaps: 210,
    startTime: new Date().toISOString(),
    simulatedTimeSeconds: 2160,
    isLive: true,
    isPaused: false,
    isCompleted: false,
    cars: [car7, car22],
    activeCarId: 'car-144',
    strategyConfig: DEFAULT_STRATEGY_CONFIG,
    alerts: [
      {
        id: 'alert-1',
        carId: 'car-144',
        severity: 'INFO',
        type: 'PIT_WINDOW_OPEN',
        title: 'Strategy On Schedule',
        message: 'Fuel burn rate 3.14L/lap matches target. Pit window opens at Lap 28.',
        timestamp: Date.now() - 60000
      }
    ]
  };
}

const RaceContext = createContext<RaceContextType | undefined>(undefined);

export const RaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [race, setRace] = useState<Race>(() => {
    const saved = localStorage.getItem('gridup_stint_race');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return createDefaultRace();
  });

  const [activeCarId, setActiveCarId] = useState<string>(race.activeCarId || race.cars[0]?.id || 'car-144');
  const [telemetrySource, setTelemetrySource] = useState<'GRIDUP_TOOL' | 'GARAGE61' | 'LOCAL' | 'DEMO'>('GRIDUP_TOOL');
  const [garage61Token, setGarage61Token] = useState<string>(() => localStorage.getItem('gridup_g61_token') || '');
  const [isSimulatingFast, setIsSimulatingFast] = useState<boolean>(false);
  const [demoSim] = useState(() => new DemoSimulator());

  useEffect(() => {
    localStorage.setItem('gridup_stint_race', JSON.stringify(race));
  }, [race]);

  const activeCar = useMemo(() => {
    return race.cars.find(c => c.id === activeCarId) || race.cars[0];
  }, [race.cars, activeCarId]);

  const switchActiveCar = useCallback((carId: string) => {
    setActiveCarId(carId);
    setRace(prev => ({ ...prev, activeCarId: carId }));
  }, []);

  const handleTelemetrySample = useCallback((sample: TelemetrySample) => {
    setRace(prevRace => {
      const carIndex = prevRace.cars.findIndex(c => c.carNumber === sample.carNumber) !== -1
        ? prevRace.cars.findIndex(c => c.carNumber === sample.carNumber)
        : prevRace.cars.findIndex(c => c.id === prevRace.activeCarId);

      if (carIndex === -1) return prevRace;

      const currentCar = prevRace.cars[carIndex];
      const prevTelem = currentCar.telemetry;

      const fuelDiff = prevTelem.fuelLevelLiters - sample.fuelLevelLiters;
      const recentBurn = (fuelDiff > 0 && fuelDiff < 10) ? fuelDiff : prevTelem.fuelBurnRateLitersPerLap;
      const effectiveBurn = Number(((prevTelem.fuelBurnRateLitersPerLap * 0.7) + (recentBurn * 0.3)).toFixed(2));

      const usableFuel = Math.max(0, sample.fuelLevelLiters - currentCar.reserveFuelLiters);
      const estLaps = Math.floor(usableFuel / Math.max(0.5, effectiveBurn));
      const estMins = Number(((estLaps * (sample.lapTimeSeconds || prevTelem.lastLapTimeSeconds)) / 60).toFixed(1));

      const updatedTelemetry: CarTelemetry = {
        ...prevTelem,
        lastUpdated: sample.timestamp,
        carStatus: sample.inPit ? 'PIT_LANE' : (sample.trackPosPct && sample.trackPosPct < 0.1 ? 'OUT_LAP' : 'ON_TRACK'),
        lapNumber: sample.lapNumber,
        lapDistancePercentage: sample.trackPosPct !== undefined ? sample.trackPosPct : prevTelem.lapDistancePercentage,
        lastLapTimeSeconds: sample.lapTimeSeconds || prevTelem.lastLapTimeSeconds,
        fuelLevelLiters: sample.fuelLevelLiters,
        fuelPct: Number(((sample.fuelLevelLiters / currentCar.fuelTankCapacityLiters) * 100).toFixed(1)),
        fuelBurnRateLitersPerLap: effectiveBurn,
        estimatedLapsRemainingOnFuel: estLaps,
        estimatedMinutesRemainingOnFuel: estMins,
        stintElapsedTimeSeconds: prevTelem.stintElapsedTimeSeconds + (prevRace.isPaused ? 0 : 2),
        inPitLane: sample.inPit,
        predictedPitLap: sample.lapNumber + estLaps
      };

      const alerts = [...prevRace.alerts];
      if (estLaps <= 2 && !alerts.some(a => a.type === 'FUEL_CRITICAL' && a.carId === currentCar.id && !a.dismissed)) {
        alerts.unshift({
          id: `fuel-${Date.now()}`,
          carId: currentCar.id,
          severity: 'CRITICAL',
          type: 'FUEL_CRITICAL',
          title: 'BOX THIS LAP - FUEL CRITICAL',
          message: `Car #${currentCar.carNumber} has only ${estLaps} laps (${sample.fuelLevelLiters}L) of fuel remaining!`,
          timestamp: Date.now()
        });
      }

      const updatedCars = [...prevRace.cars];
      updatedCars[carIndex] = {
        ...currentCar,
        telemetry: updatedTelemetry
      };

      return {
        ...prevRace,
        simulatedTimeSeconds: prevRace.simulatedTimeSeconds + 2,
        cars: updatedCars,
        alerts
      };
    });
  }, []);

  useEffect(() => {
    let provider: TelemetryProvider;

        if (telemetrySource === 'GRIDUP_TOOL') {
      provider = new GridUpTelemetryProvider();
      provider.connect({ teamKey: 'gridUp_sim', carNumber: activeCar.carNumber });
      provider.onSample(handleTelemetrySample);
    } else if (telemetrySource === 'DEMO') {
      provider = demoSim;
      provider.connect();
      provider.onSample(handleTelemetrySample);
    } else if (telemetrySource === 'GARAGE61') {
      provider = new Garage61Provider();
      provider.connect({ token: garage61Token, carNumber: activeCar.carNumber });
      provider.onSample(handleTelemetrySample);
    } else {
      provider = new LocalTelemetryProvider();
      provider.connect();
      provider.onSample(handleTelemetrySample);
    }

    return () => {
      provider.disconnect();
    };
  }, [telemetrySource, garage61Token, handleTelemetrySample, activeCar.carNumber, demoSim]);

  const updateStint = useCallback((carId: string, stintId: string, updates: Partial<Stint>) => {
    setRace(prev => {
      const carIndex = prev.cars.findIndex(c => c.id === carId);
      if (carIndex === -1) return prev;
      const car = prev.cars[carIndex];
      const stints = car.stints.map(s => s.id === stintId ? { ...s, ...updates } : s);
      const updatedCar = { ...car, stints };
      const updatedCars = [...prev.cars];
      updatedCars[carIndex] = updatedCar;
      return { ...prev, cars: updatedCars };
    });
  }, []);

  const toggleStintLock = useCallback((carId: string, stintId: string) => {
    setRace(prev => {
      const carIndex = prev.cars.findIndex(c => c.id === carId);
      if (carIndex === -1) return prev;
      const car = prev.cars[carIndex];
      const stints = car.stints.map(s => s.id === stintId ? { ...s, isLocked: !s.isLocked } : s);
      const updatedCar = { ...car, stints };
      const updatedCars = [...prev.cars];
      updatedCars[carIndex] = updatedCar;
      return { ...prev, cars: updatedCars };
    });
  }, []);

  const reorderStints = useCallback((carId: string, fromIndex: number, toIndex: number) => {
    setRace(prev => {
      const carIndex = prev.cars.findIndex(c => c.id === carId);
      if (carIndex === -1) return prev;
      const car = prev.cars[carIndex];
      const newStints = [...car.stints];
      const [moved] = newStints.splice(fromIndex, 1);
      newStints.splice(toIndex, 0, moved);
      newStints.forEach((s, idx) => { s.stintNumber = idx + 1; });
      const updatedCars = [...prev.cars];
      updatedCars[carIndex] = { ...car, stints: newStints };
      return { ...prev, cars: updatedCars };
    });
  }, []);

  const swapStintDriver = useCallback((carId: string, stintId: string, newDriverId: string) => {
    setRace(prev => {
      const carIndex = prev.cars.findIndex(c => c.id === carId);
      if (carIndex === -1) return prev;
      const car = prev.cars[carIndex];
      const driver = car.drivers.find(d => d.id === newDriverId);
      if (!driver) return prev;

      const stints = car.stints.map(s => s.id === stintId ? { ...s, driverId: driver.id, driverName: driver.name } : s);
      const updatedCars = [...prev.cars];
      updatedCars[carIndex] = { ...car, stints };
      return { ...prev, cars: updatedCars };
    });
  }, []);

  const triggerBoxThisLap = useCallback((carId: string) => {
    demoSim.triggerBox();
    setRace(prev => {
      const carIndex = prev.cars.findIndex(c => c.id === carId);
      if (carIndex === -1) return prev;
      const car = prev.cars[carIndex];
      const updatedCar: Car = {
        ...car,
        telemetry: {
          ...car.telemetry,
          inPitLane: true,
          carStatus: 'PIT_LANE'
        }
      };
      const updatedCars = [...prev.cars];
      updatedCars[carIndex] = updatedCar;
      return {
        ...prev,
        cars: updatedCars,
        alerts: [
          {
            id: `box-${Date.now()}`,
            carId,
            severity: 'CRITICAL',
            type: 'PIT_WINDOW_OPEN',
            title: `CAR #${car.carNumber} BOXING THIS LAP`,
            message: 'Pit crew and incoming driver stand by!',
            timestamp: Date.now()
          },
          ...prev.alerts
        ]
      };
    });
  }, [demoSim]);

  const triggerPitExitAndSwap = useCallback((carId: string, nextDriverId?: string) => {
    setRace(prev => {
      const carIndex = prev.cars.findIndex(c => c.id === carId);
      if (carIndex === -1) return prev;
      const car = prev.cars[carIndex];

      const { updatedCar } = advanceStintOnPitExit(car, nextDriverId);
      demoSim.triggerPitExit(updatedCar.fuelTankCapacityLiters);

      const recalculatedStints = recalculateDownstreamStrategy(
        updatedCar,
        prev.simulatedTimeSeconds,
        prev.durationHours * 3600,
        prev.strategyConfig
      );
      updatedCar.stints = recalculatedStints;

      const updatedCars = [...prev.cars];
      updatedCars[carIndex] = updatedCar;

      return {
        ...prev,
        cars: updatedCars,
        alerts: [
          {
            id: `driver-swap-${Date.now()}`,
            carId,
            severity: 'INFO',
            type: 'STRATEGY_DEVIATION',
            title: 'Driver Change Completed',
            message: `${updatedCar.telemetry.currentDriverName} has taken the wheel for Stint #${updatedCar.telemetry.currentStintIndex + 1}.`,
            timestamp: Date.now()
          },
          ...prev.alerts
        ]
      };
    });
  }, [demoSim]);

  const manualFuelOverride = useCallback((carId: string, liters: number) => {
    setRace(prev => {
      const carIndex = prev.cars.findIndex(c => c.id === carId);
      if (carIndex === -1) return prev;
      const car = prev.cars[carIndex];
      const updatedCar: Car = {
        ...car,
        telemetry: {
          ...car.telemetry,
          fuelLevelLiters: liters,
          fuelPct: Number(((liters / car.fuelTankCapacityLiters) * 100).toFixed(1))
        }
      };
      const recalculated = recalculateDownstreamStrategy(
        updatedCar,
        prev.simulatedTimeSeconds,
        prev.durationHours * 3600,
        prev.strategyConfig
      );
      updatedCar.stints = recalculated;
      const updatedCars = [...prev.cars];
      updatedCars[carIndex] = updatedCar;
      return { ...prev, cars: updatedCars };
    });
  }, []);

  const triggerSimulatedLap = useCallback(() => {
    demoSim.triggerLap();
  }, [demoSim]);

  const setSimulationFast = useCallback((fast: boolean) => {
    setIsSimulatingFast(fast);
    demoSim.setFastMode(fast);
  }, [demoSim]);

  const resetDemoRace = useCallback(() => {
    const fresh = createDefaultRace();
    setRace(fresh);
    setActiveCarId(fresh.cars[0].id);
    localStorage.removeItem('gridup_stint_race');
  }, []);

  const createNewRace = useCallback((raceData: Partial<Race>) => {
    const base = createDefaultRace();
    const newRace: Race = {
      ...base,
      ...raceData,
      id: `race-${Date.now().toString(36)}`,
      simulatedTimeSeconds: 0,
      isLive: true
    };
    setRace(newRace);
    setActiveCarId(newRace.cars[0]?.id || 'car-144');
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setRace(prev => ({
      ...prev,
      alerts: prev.alerts.map(a => a.id === alertId ? { ...a, dismissed: true } : a)
    }));
  }, []);

  return (
    <RaceContext.Provider
      value={{
        race,
        activeCar,
        switchActiveCar,
        updateStint,
        toggleStintLock,
        reorderStints,
        swapStintDriver,
        triggerBoxThisLap,
        triggerPitExitAndSwap,
        manualFuelOverride,
        triggerSimulatedLap,
        setSimulationFast,
        resetDemoRace,
        createNewRace,
        telemetrySource,
        setTelemetrySource,
        garage61Token,
        setGarage61Token,
        isSimulatingFast,
        dismissAlert
      }}
    >
      {children}
    </RaceContext.Provider>
  );
};

export const useRace = (): RaceContextType => {
  const context = useContext(RaceContext);
  if (!context) {
    throw new Error('useRace must be used within a RaceProvider');
  }
  return context;
};
