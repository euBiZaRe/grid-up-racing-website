import React from 'react';
import { useRace } from '../../context/RaceContext';
import { 
  Gauge, 
  Fuel, 
  Timer, 
  Flag
} from 'lucide-react';

export const CurrentStintCard: React.FC = () => {
  const { activeCar } = useRace();
  const telem = activeCar.telemetry;
  const currentStint = activeCar.stints.find(s => s.status === 'LIVE') || activeCar.stints[0];

  const stintElapsedMins = Math.floor(telem.stintElapsedTimeSeconds / 60);
  const targetDurationMins = currentStint?.plannedDurationMinutes || 60;
  const progressPct = Math.min(100, Math.round((stintElapsedMins / targetDurationMins) * 100));

  const formatLapTime = (sec: number) => {
    if (!sec || sec <= 0) return '--:--.---';
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(3).padStart(6, '0');
    return `${m}:${s}`;
  };

  const getStatusBadge = () => {
    switch (telem.carStatus) {
      case 'ON_TRACK':
        return <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-orbitron font-bold text-xs flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>ON TRACK</span>;
      case 'PIT_LANE':
        return <span className="px-2.5 py-1 rounded-md bg-red-500/20 border border-red-500/40 text-red-400 font-orbitron font-bold text-xs flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>PIT LANE</span>;
      case 'OUT_LAP':
        return <span className="px-2.5 py-1 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-400 font-orbitron font-bold text-xs">OUT LAP</span>;
      case 'IN_LAP':
        return <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 font-orbitron font-bold text-xs">IN LAP</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md bg-slate-500/20 border border-slate-500/40 text-slate-400 font-orbitron font-bold text-xs">{telem.carStatus}</span>;
    }
  };

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-[#111624] to-[#0a0d16] border border-white/10 p-5 lg:p-6 shadow-xl overflow-hidden">
      <div className="absolute top-0 right-0 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex flex-col items-center justify-center font-orbitron">
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">STINT</span>
            <span className="text-xl font-black text-white">#{currentStint?.stintNumber || 1}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white tracking-wide">
                {telem.currentDriverName || 'Active Driver'}
              </h2>
              {getStatusBadge()}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Car #{activeCar.carNumber}</span>
              <span>&bull;</span>
              <span>{activeCar.carModel}</span>
              <span>&bull;</span>
              <span className="text-purple-300 font-medium">Stint Lap {telem.lapNumber}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-black/40 px-3.5 py-2 rounded-xl border border-white/5">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Target Duration</div>
            <div className="text-sm font-bold text-white font-mono">{stintElapsedMins}m / {targetDurationMins}m</div>
          </div>
          <div className="font-orbitron font-extrabold text-xl text-purple-400">
            {progressPct}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 mb-6">
        <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1 font-mono">
          <span>Stint Started: {currentStint?.plannedStartTime || '00:00'}</span>
          <span className="text-purple-400 font-bold">Pit Window: Lap {currentStint?.pitWindowOpenLap || 28} - {currentStint?.pitWindowCloseLap || 32}</span>
          <span>Target End: {currentStint?.plannedEndTime || '01:00'}</span>
        </div>
      </div>

      {/* Grid of Key Telemetry Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-black/30 rounded-xl p-3.5 border border-white/5 hover:border-white/15 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Last Lap</span>
            <Timer className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {formatLapTime(telem.lastLapTimeSeconds)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
            <span>Best:</span>
            <span className="text-emerald-400 font-mono font-medium">{formatLapTime(telem.bestLapTimeSeconds)}</span>
          </div>
        </div>

        <div className="bg-black/30 rounded-xl p-3.5 border border-white/5 hover:border-white/15 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Average Lap</span>
            <Gauge className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold font-mono text-purple-200">
            {formatLapTime(telem.stintAverageLapTimeSeconds)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
            <span>Pace Delta:</span>
            <span className="text-cyan-400 font-mono">+0.38s</span>
          </div>
        </div>

        <div className="bg-black/30 rounded-xl p-3.5 border border-white/5 hover:border-white/15 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Fuel Level</span>
            <Fuel className={`w-4 h-4 ${telem.fuelLevelLiters < 15 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
          </div>
          <div className="text-lg font-bold font-mono text-white flex items-baseline gap-1">
            <span>{telem.fuelLevelLiters.toFixed(1)}</span>
            <span className="text-xs text-slate-400 font-sans">L ({telem.fuelPct}%)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
            <span>Burn/Lap:</span>
            <span className="text-amber-300 font-mono">{telem.fuelBurnRateLitersPerLap.toFixed(2)}L</span>
          </div>
        </div>

        <div className="bg-black/30 rounded-xl p-3.5 border border-white/5 hover:border-white/15 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Fuel Pit Window</span>
            <Flag className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-300">
            Lap {telem.predictedPitLap}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
            <span>Fuel Laps:</span>
            <span className="text-white font-mono font-semibold">{telem.estimatedLapsRemainingOnFuel} laps ({telem.estimatedMinutesRemainingOnFuel}m)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
