import React, { useState } from 'react';
import { useRace } from '../../context/RaceContext';
import { 
  UserCheck, 
  ArrowRightLeft, 
  Check, 
  AlertTriangle
} from 'lucide-react';

export const NextDriverCard: React.FC = () => {
  const { activeCar, swapStintDriver, triggerPitExitAndSwap, triggerBoxThisLap } = useRace();
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const liveStintIdx = activeCar.stints.findIndex(s => s.status === 'LIVE');
  const nextStint = liveStintIdx !== -1 && liveStintIdx + 1 < activeCar.stints.length 
    ? activeCar.stints[liveStintIdx + 1] 
    : null;

  const currentNextDriver = nextStint ? activeCar.drivers.find(d => d.id === nextStint.driverId) : null;

  const handleQuickSwap = (newId: string) => {
    if (!nextStint) return;
    swapStintDriver(activeCar.id, nextStint.id, newId);
    setSelectedDriverId(newId);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#111624] to-[#0a0d16] border border-white/10 p-5 lg:p-6 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-400" />
            <h3 className="font-orbitron font-bold text-sm tracking-wide text-white uppercase">
              On Deck &bull; Next Stint
            </h3>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
            Stint #{nextStint ? nextStint.stintNumber : '--'}
          </span>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-orbitron font-black text-white text-lg shadow-md shadow-purple-600/30">
              {currentNextDriver ? (currentNextDriver.shortName || currentNextDriver.name.slice(0, 3).toUpperCase()) : 'TBD'}
            </div>
            <div>
              <div className="text-base font-extrabold text-white">
                {currentNextDriver ? currentNextDriver.name : 'Unassigned Driver'}
              </div>
              <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Belted & Rig Ready</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Scheduled Duration</div>
            <div className="text-sm font-bold font-mono text-purple-300">
              {nextStint ? `${nextStint.plannedDurationMinutes} mins` : '--'}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Change Next Driver:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {activeCar.drivers.map(driver => {
              const isSelected = nextStint?.driverId === driver.id;
              return (
                <button
                  key={driver.id}
                  onClick={() => handleQuickSwap(driver.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold text-left flex items-center justify-between border transition-all ${
                    isSelected
                      ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm shadow-purple-500/20'
                      : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300'
                  }`}
                >
                  <span className="truncate">{driver.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-purple-300 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-2">
        <button
          onClick={() => triggerBoxThisLap(activeCar.id)}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs font-orbitron transition-all"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>BOX THIS LAP</span>
        </button>

        <button
          onClick={() => triggerPitExitAndSwap(activeCar.id)}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs font-orbitron shadow-md shadow-purple-600/30 transition-all"
        >
          <ArrowRightLeft className="w-4 h-4 text-purple-200" />
          <span>SWAP DRIVER NOW</span>
        </button>
      </div>
    </div>
  );
};
