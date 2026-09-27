import React from 'react';
import { useRace } from '../../context/RaceContext';
import { formatSecondsToRaceClock } from '../../lib/strategyEngine';
import { Tv, X, AlertTriangle, Fuel, Timer, Flag, UserCheck } from 'lucide-react';

interface LiveProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RaceControlLive: React.FC<LiveProps> = ({ isOpen, onClose }) => {
  const { race, activeCar } = useRace();
  const telem = activeCar.telemetry;
  const currentStint = activeCar.stints.find(s => s.status === 'LIVE') || activeCar.stints[0];

  const liveStintIdx = activeCar.stints.findIndex(s => s.status === 'LIVE');
  const nextStint = liveStintIdx !== -1 && liveStintIdx + 1 < activeCar.stints.length 
    ? activeCar.stints[liveStintIdx + 1] 
    : null;

  if (!isOpen) return null;

  const elapsedClock = formatSecondsToRaceClock(race.simulatedTimeSeconds);
  const remainingSeconds = Math.max(0, (race.durationHours * 3600) - race.simulatedTimeSeconds);
  const remainingClock = formatSecondsToRaceClock(remainingSeconds);

  return (
    <div className="fixed inset-0 z-50 bg-[#04060a] text-white flex flex-col p-6 sm:p-10 select-none overflow-hidden font-sans">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-white/15 pb-6">
        <div className="flex items-center gap-4">
          <div className="font-orbitron font-black text-2xl text-purple-400 tracking-wider">
            GRiD UP PIT WALL
          </div>
          <span className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-orbitron font-bold text-sm tracking-widest animate-pulse border border-emerald-500/40">
            RACE CONTROL LIVE
          </span>
          <span className="text-xl text-slate-300 font-semibold hidden md:inline">
            &bull; {race.name}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs uppercase font-bold text-slate-400 tracking-widest">Time Remaining</div>
            <div className="font-mono text-3xl font-black text-purple-300">{remainingClock}</div>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Massive Dashboard */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
        
        {/* Left Column: Active Driver & Stint */}
        <div className="bg-[#0b0f19] border border-white/10 rounded-3xl p-8 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between text-slate-400 uppercase font-orbitron font-bold text-sm tracking-wider">
              <span>Car #{activeCar.carNumber} Driver</span>
              <span className="text-purple-400">Stint #{currentStint?.stintNumber || 1}</span>
            </div>
            <div className="mt-4 text-5xl font-black text-white tracking-wide">
              {telem.currentDriverName}
            </div>
            <div className="mt-2 text-xl text-slate-300 font-medium">
              {activeCar.carModel} &bull; {activeCar.carClass}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-base text-slate-400 font-bold uppercase">Stint Lap:</span>
              <span className="text-3xl font-mono font-black text-white">Lap {telem.lapNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-slate-400 font-bold uppercase">Last Lap:</span>
              <span className="text-3xl font-mono font-bold text-cyan-400">{telem.lastLapTimeSeconds.toFixed(3)}s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-slate-400 font-bold uppercase">Average:</span>
              <span className="text-3xl font-mono font-bold text-purple-300">{telem.stintAverageLapTimeSeconds.toFixed(3)}s</span>
            </div>
          </div>
        </div>

        {/* Center Column: Pit Window & Fuel Critical Warning */}
        <div className="bg-[#0b0f19] border border-white/10 rounded-3xl p-8 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="text-xs uppercase font-bold tracking-widest text-amber-400 font-orbitron">
              Target Pit Stop Window
            </div>
            <div className="mt-4 font-orbitron font-black text-6xl text-amber-400">
              LAP {telem.predictedPitLap}
            </div>
            <div className="text-base text-slate-300 mt-2 font-medium">
              Window Open: Lap {currentStint?.pitWindowOpenLap || telem.predictedPitLap - 3} - {telem.predictedPitLap}
            </div>
          </div>

          {/* Huge Fuel Gauge */}
          <div className="p-6 bg-black/50 rounded-2xl border border-white/10 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-base text-slate-400 font-bold uppercase">Fuel Level</span>
              <span className="text-3xl font-mono font-black text-white">{telem.fuelLevelLiters.toFixed(1)} L</span>
            </div>
            <div className="w-full h-4 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  telem.fuelLevelLiters < 15 ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                }`}
                style={{ width: `${telem.fuelPct}%` }}
              />
            </div>
            <div className="flex justify-between text-base text-slate-300 font-mono font-semibold">
              <span>{telem.estimatedLapsRemainingOnFuel} laps of fuel left</span>
              <span>~{telem.estimatedMinutesRemainingOnFuel} mins</span>
            </div>
          </div>
        </div>

        {/* Right Column: On Deck Driver & Countdown */}
        <div className="bg-[#0b0f19] border border-white/10 rounded-3xl p-8 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="text-xs uppercase font-bold tracking-widest text-purple-400 font-orbitron">
              Next Driver In (On Deck)
            </div>
            <div className="mt-4 text-4xl font-black text-white">
              {nextStint ? nextStint.driverName : 'Unassigned'}
            </div>
            <div className="mt-2 text-base text-emerald-400 font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Headset On & Rig Ready</span>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-base text-slate-400 font-bold uppercase">Scheduled Stint:</span>
              <span className="text-2xl font-mono font-bold text-white">
                {nextStint ? `${nextStint.plannedDurationMinutes} mins` : '--'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-slate-400 font-bold uppercase">Target In-Lap:</span>
              <span className="text-2xl font-mono font-bold text-amber-300">
                {currentStint?.pitWindowCloseTime || '01:00'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center text-xs text-purple-300 font-medium">
              Strategy dynamic recalculation active &bull; Locked stints respected
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
