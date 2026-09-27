import React, { useState } from 'react';
import { useRace } from '../../context/RaceContext';
import { Race, Car, Driver } from '../../types';
import { generateInitialSchedule } from '../../lib/strategyEngine';
import { 
  X, 
  Flag, 
  Car as CarIcon, 
  Users, 
  Fuel, 
  Calendar, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RaceSetupWizard: React.FC<WizardProps> = ({ isOpen, onClose }) => {
  const { createNewRace } = useRace();
  const [step, setStep] = useState<number>(1);

  // Form State
  const [raceName, setRaceName] = useState<string>('Daytona 24 Hours');
  const [trackName, setTrackName] = useState<string>('Daytona International Speedway - Road Course');
  const [durationHours, setDurationHours] = useState<number>(24);
  
  const [carNumber, setCarNumber] = useState<string>('144');
  const [carClass, setCarClass] = useState<string>('GTP');
  const [carModel, setCarModel] = useState<string>('Porsche 963 GTP');
  const [fuelCapacity, setFuelCapacity] = useState<number>(110);
  const [reserveFuel, setReserveFuel] = useState<number>(5.0);

  const [driverNames, setDriverNames] = useState<string[]>([
    'Matty G',
    'Alex Rivera',
    'Liam Davies',
    'Marcus Vance'
  ]);

  const [fuelBurnRate, setFuelBurnRate] = useState<number>(3.35);
  const [lapTimeSeconds, setLapTimeSeconds] = useState<number>(94.5);
  const [pitStopDelta, setPitStopDelta] = useState<number>(45);

  if (!isOpen) return null;

  const handleFinish = () => {
    const drivers: Driver[] = driverNames.filter(n => n.trim().length > 0).map((name, i) => ({
      id: `driver-${i + 1}`,
      name: name.trim(),
      shortName: name.slice(0, 3).toUpperCase(),
      isCaptain: i === 0,
      totalDriveTimeMinutes: 0
    }));

    const initialSchedule = generateInitialSchedule({
      raceDurationHours: durationHours,
      fuelTankCapacityLiters: fuelCapacity,
      reserveFuelLiters: reserveFuel,
      fuelBurnRateLitersPerLap: fuelBurnRate,
      targetLapTimeSeconds: lapTimeSeconds,
      pitStopDeltaSeconds: pitStopDelta,
      drivers
    });

    const carId = `car-${carNumber}`;
    const newCar: Car = {
      id: carId,
      carNumber,
      carName: `GRiD UP #${carNumber}`,
      carClass,
      carModel,
      fuelTankCapacityLiters: fuelCapacity,
      reserveFuelLiters: reserveFuel,
      defaultStintMinutes: 60,
      stintMinutes: 60,
      captain: drivers[0]?.name || 'Captain',
      drivers,
      stints: initialSchedule,
      telemetry: {
        lastUpdated: Date.now(),
        source: 'DEMO',
        isConnected: true,
        carStatus: 'ON_TRACK',
        currentDriverId: drivers[0]?.id || 'driver-1',
        currentDriverName: drivers[0]?.name || 'Driver 1',
        currentStintIndex: 0,
        lapNumber: 1,
        lapDistancePercentage: 0.1,
        lastLapTimeSeconds: lapTimeSeconds,
        bestLapTimeSeconds: lapTimeSeconds,
        stintAverageLapTimeSeconds: lapTimeSeconds,
        recentLapTimes: [lapTimeSeconds],
        fuelLevelLiters: fuelCapacity,
        fuelPct: 100,
        fuelBurnRateLitersPerLap: fuelBurnRate,
        stintFuelBurnRateLitersPerLap: fuelBurnRate,
        estimatedLapsRemainingOnFuel: Math.floor((fuelCapacity - reserveFuel) / fuelBurnRate),
        estimatedMinutesRemainingOnFuel: Number((((Math.floor((fuelCapacity - reserveFuel) / fuelBurnRate) * lapTimeSeconds) / 60)).toFixed(1)),
        stintElapsedTimeSeconds: 0,
        stintRemainingTimeSeconds: initialSchedule[0]?.plannedDurationMinutes ? initialSchedule[0].plannedDurationMinutes * 60 : 3600,
        inPitLane: false,
        pitStopCount: 0,
        predictedPitLap: Math.floor((fuelCapacity - reserveFuel) / fuelBurnRate),
        predictedPitTimeSeconds: 3600
      }
    };

    createNewRace({
      name: raceName,
      trackName,
      durationHours,
      cars: [newCar],
      activeCarId: carId,
      alerts: []
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0c101a] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-orbitron font-extrabold text-base text-white">
                Race Setup Wizard
              </h2>
              <p className="text-xs text-slate-400">Step {step} of 4: {
                step === 1 ? 'Race & Track Info' :
                step === 2 ? 'Car & Fuel Tank' :
                step === 3 ? 'Driver Lineup' : 'Pace & Strategy Targets'
              }</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-black/40 h-1">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase font-bold text-slate-300 block mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  value={raceName}
                  onChange={e => setRaceName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  placeholder="e.g. Sebring 12 Hour"
                />
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-slate-300 block mb-1">
                  Circuit / Track
                </label>
                <input
                  type="text"
                  value={trackName}
                  onChange={e => setTrackName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  placeholder="e.g. Sebring International Raceway"
                />
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-slate-300 block mb-1">
                  Race Duration (Hours)
                </label>
                <select
                  value={durationHours}
                  onChange={e => setDurationHours(parseInt(e.target.value))}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value={1}>1 Hour Sprint</option>
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours</option>
                  <option value={6}>6 Hours</option>
                  <option value={10}>10 Hours (Petit Le Mans)</option>
                  <option value={12}>12 Hours (Sebring/Bathurst)</option>
                  <option value={24}>24 Hours (Daytona/Spa/Nurburgring)</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-300 block mb-1">
                    Car Number
                  </label>
                  <input
                    type="text"
                    value={carNumber}
                    onChange={e => setCarNumber(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
                    placeholder="144"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-300 block mb-1">
                    Car Class
                  </label>
                  <select
                    value={carClass}
                    onChange={e => setCarClass(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="GT3">GT3</option>
                    <option value="GTP">GTP / Hypercar</option>
                    <option value="LMP2">LMP2</option>
                    <option value="GT4">GT4</option>
                    <option value="TCR">TCR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-slate-300 block mb-1">
                  Chassis / Model Name
                </label>
                <input
                  type="text"
                  value={carModel}
                  onChange={e => setCarModel(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  placeholder="e.g. Porsche 911 GT3.R (992)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-300 block mb-1">
                    Fuel Tank Capacity (L)
                  </label>
                  <input
                    type="number"
                    value={fuelCapacity}
                    onChange={e => setFuelCapacity(parseFloat(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-300 block mb-1">
                    Reserve Buffer (L)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={reserveFuel}
                    onChange={e => setReserveFuel(parseFloat(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-3">
              <label className="text-xs uppercase font-bold text-slate-300 block">
                Driver Lineup (Rotation Order)
              </label>
              {driverNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 font-mono font-bold flex items-center justify-center text-xs">
                    {i + 1}
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={e => {
                      const updated = [...driverNames];
                      updated[i] = e.target.value;
                      setDriverNames(updated);
                    }}
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                    placeholder={`Driver ${i + 1} Name`}
                  />
                  {driverNames.length > 2 && (
                    <button
                      onClick={() => setDriverNames(driverNames.filter((_, idx) => idx !== i))}
                      className="p-2 text-slate-400 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {driverNames.length < 6 && (
                <button
                  onClick={() => setDriverNames([...driverNames, `Driver ${driverNames.length + 1}`])}
                  className="text-xs text-purple-400 font-semibold hover:text-purple-300 flex items-center gap-1.5 mt-2"
                >
                  + Add Another Driver
                </button>
              )}
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase font-bold text-slate-300 block mb-1">
                  Estimated Average Lap Time (Seconds)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={lapTimeSeconds}
                  onChange={e => setLapTimeSeconds(parseFloat(e.target.value))}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  e.g. 101.4s = ~1:41.400
                </span>
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-slate-300 block mb-1">
                  Estimated Fuel Burn Rate (Liters / Lap)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={fuelBurnRate}
                  onChange={e => setFuelBurnRate(parseFloat(e.target.value))}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-slate-300 block mb-1">
                  Pit Stop Time Loss (Seconds)
                </label>
                <input
                  type="number"
                  value={pitStopDelta}
                  onChange={e => setPitStopDelta(parseInt(e.target.value))}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Includes pit lane transit delta + refueling + driver change (~40-50s)
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/30 font-orbitron"
            >
              <Check className="w-4 h-4" /> Generate Stint Strategy
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
