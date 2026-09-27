import React from 'react';
import { useRace } from '../../context/RaceContext';
import { formatSecondsToRaceClock } from '../../lib/strategyEngine';
import { 
  Radio, 
  Tv, 
  Settings, 
  PlusCircle
} from 'lucide-react';

interface HeaderProps {
  onOpenWizard: () => void;
  onOpenSettings: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenWizard,
  onOpenSettings,
  onToggleFullscreen,
  isFullscreen
}) => {
  const { race, activeCar, switchActiveCar, telemetrySource } = useRace();

  const elapsedClock = formatSecondsToRaceClock(race.simulatedTimeSeconds);
  const remainingSeconds = Math.max(0, (race.durationHours * 3600) - race.simulatedTimeSeconds);
  const remainingClock = formatSecondsToRaceClock(remainingSeconds);

  return (
    <header className="sticky top-0 z-40 bg-[#07090e]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 sm:px-6">
      <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & Race Info */}
        <div className="flex items-center gap-4">
          <a href="../index.html" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center p-0.5 shadow-lg shadow-purple-600/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#07090e] rounded-[10px] flex items-center justify-center font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 text-lg">
                G
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-orbitron font-extrabold tracking-wider text-white text-base">GRiD UP</span>
                <span className="text-[10px] font-orbitron font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-400">
                  LIVE STRATEGY
                </span>
              </div>
              <div className="text-xs text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">
                {race.name} &bull; <span className="text-slate-300">{race.trackName}</span>
              </div>
            </div>
          </a>

          {/* Car Selector Tabs */}
          <div className="hidden md:flex items-center gap-1.5 ml-4 p-1 bg-black/40 rounded-xl border border-white/10">
            {race.cars.map(c => {
              const isActive = c.id === activeCar.id;
              return (
                <button
                  key={c.id}
                  onClick={() => switchActiveCar(c.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="font-orbitron font-black text-amber-400">#{c.carNumber}</span>
                  <span className="hidden lg:inline">{c.carClass}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Central Master Race Clock */}
        <div className="flex items-center gap-4 sm:gap-6 bg-black/50 border border-white/10 px-4 py-1.5 rounded-xl">
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Race Elapsed</div>
            <div className="font-mono text-sm sm:text-base font-bold text-slate-100">{elapsedClock}</div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold tracking-widest text-purple-400">Remaining</div>
            <div className="font-mono text-sm sm:text-base font-extrabold text-purple-300">{remainingClock}</div>
          </div>
          <div className="hidden sm:block h-6 w-px bg-white/10" />
          <div className="hidden sm:flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-orbitron font-bold text-emerald-400">LIVE</span>
          </div>
        </div>

        {/* Controls & Badges */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs">
            <Radio className={`w-3.5 h-3.5 ${
              telemetrySource === 'GRIDUP_TOOL' ? 'text-emerald-400 animate-pulse' : telemetrySource === 'GARAGE61' ? 'text-cyan-400 animate-pulse' :
              telemetrySource === 'LOCAL' ? 'text-emerald-400' : 'text-purple-400'
            }`} />
            <span className="hidden sm:inline text-slate-300 font-medium">Source:</span>
            <span className="font-bold text-white font-orbitron text-[11px]">{telemetrySource === 'GRIDUP_TOOL' ? 'GRiD UP TOOL' : telemetrySource}</span>
          </div>

          <button
            onClick={onOpenWizard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors"
            title="Create or configure a new race"
          >
            <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">New Race</span>
          </button>

          <button
            onClick={onToggleFullscreen}
            className={`p-2 rounded-lg border transition-all ${
              isFullscreen 
                ? 'bg-purple-600 text-white border-purple-500' 
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
            }`}
            title="Toggle TV / Pit Wall Fullscreen Mode"
          >
            <Tv className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
            title="Settings & Telemetry config"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
