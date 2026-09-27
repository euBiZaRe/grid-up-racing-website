import React, { useState } from 'react';
import { useRace } from '../../context/RaceContext';
import { calculateFuelMetrics } from '../../lib/fuelCalculator';
import { 
  Fuel, 
  TrendingDown
} from 'lucide-react';

export const FuelCalculatorCard: React.FC = () => {
  const { activeCar, manualFuelOverride } = useRace();
  const telem = activeCar.telemetry;

  const [customBurnRate, setCustomBurnRate] = useState<number>(telem.fuelBurnRateLitersPerLap || 3.14);
  const [customLiters, setCustomLiters] = useState<number>(telem.fuelLevelLiters);

  const metrics = calculateFuelMetrics({
    fuelLevelLiters: telem.fuelLevelLiters,
    fuelTankCapacityLiters: activeCar.fuelTankCapacityLiters,
    burnRatePerLap: customBurnRate,
    lapTimeSeconds: telem.lastLapTimeSeconds || 101.4,
    reserveFuelLiters: activeCar.reserveFuelLiters
  }, telem.lapNumber);

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#111624] to-[#0a0d16] border border-white/10 p-5 lg:p-6 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-amber-400" />
            <h3 className="font-orbitron font-bold text-sm tracking-wide text-white uppercase">
              Live Fuel Calculator
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Tank Cap: {activeCar.fuelTankCapacityLiters}L
          </span>
        </div>

        <div className="mt-4 p-3.5 bg-black/40 rounded-xl border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Stint Target Burn:</span>
            <span className="font-mono font-bold text-white">3.14 L/lap</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Active Burn Rate:</span>
            <span className="font-mono font-bold text-amber-400">{telem.fuelBurnRateLitersPerLap.toFixed(2)} L/lap</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Reserve Buffer:</span>
            <span className="font-mono font-bold text-slate-300">{activeCar.reserveFuelLiters} L</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-3">
          <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Usable Fuel</div>
            <div className="text-base font-extrabold font-mono text-emerald-400 mt-0.5">
              {metrics.usableFuelLiters} L
            </div>
          </div>
          <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Laps to Empty</div>
            <div className="text-base font-extrabold font-mono text-cyan-400 mt-0.5">
              {metrics.lapsRemaining} laps
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>Manual Fuel Adjustment:</span>
            <span className="font-mono font-bold text-white">{customLiters.toFixed(1)} L</span>
          </div>
          <input
            type="range"
            min="1"
            max={activeCar.fuelTankCapacityLiters}
            step="0.5"
            value={customLiters}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setCustomLiters(val);
              manualFuelOverride(activeCar.id, val);
            }}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
          <span>Fuel Saving Delta:</span>
        </span>
        <span className="font-mono font-bold text-emerald-400">+1.2 Laps Buffer</span>
      </div>
    </div>
  );
};
