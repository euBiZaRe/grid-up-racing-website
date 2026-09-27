import React, { useState } from 'react';
import { useRace } from '../../context/RaceContext';
import { 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

export const ManualOverridePanel: React.FC = () => {
  const { activeCar, triggerBoxThisLap, triggerPitExitAndSwap, manualFuelOverride } = useRace();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#111624] to-[#0a0d16] border border-white/10 p-5 lg:p-6 shadow-xl">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="w-5 h-5 text-purple-400" />
          <h3 className="font-orbitron font-extrabold text-sm tracking-wide text-white uppercase">
            Race Engineer Tactical Overrides
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Tactical Stint Controls</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase font-orbitron mb-1">
                Emergency Pit Call
              </div>
              <div className="text-[11px] text-slate-400">
                Immediately trigger in-lap telemetry state and notify driver to box.
              </div>
            </div>
            <button
              onClick={() => triggerBoxThisLap(activeCar.id)}
              className="mt-3 w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs font-orbitron transition-all"
            >
              Call Car In (Box)
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-purple-400 uppercase font-orbitron mb-1">
                Pit Exit & Driver Swap
              </div>
              <div className="text-[11px] text-slate-400">
                Mark active stint completed, seat next driver, refill tank to 100%.
              </div>
            </div>
            <button
              onClick={() => triggerPitExitAndSwap(activeCar.id)}
              className="mt-3 w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-orbitron transition-all shadow-md shadow-purple-600/30"
            >
              Complete Pit Stop
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-cyan-400 uppercase font-orbitron mb-1">
                Instant Fuel Top-Up
              </div>
              <div className="text-[11px] text-slate-400">
                Set active car fuel level to full tank ({activeCar.fuelTankCapacityLiters}L).
              </div>
            </div>
            <button
              onClick={() => manualFuelOverride(activeCar.id, activeCar.fuelTankCapacityLiters)}
              className="mt-3 w-full py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs font-orbitron transition-all"
            >
              Refuel Full Tank
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase font-orbitron mb-1">
                Splash & Dash (+25L)
              </div>
              <div className="text-[11px] text-slate-400">
                Quick 10-second splash fuel without tire change for the final dash.
              </div>
            </div>
            <button
              onClick={() => manualFuelOverride(activeCar.id, Math.min(activeCar.fuelTankCapacityLiters, activeCar.telemetry.fuelLevelLiters + 25))}
              className="mt-3 w-full py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs font-orbitron transition-all"
            >
              Add +25 Liters
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
