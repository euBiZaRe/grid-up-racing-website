import React from 'react';
import { useRace } from '../../context/RaceContext';
import { 
  Play, 
  FastForward, 
  RotateCcw, 
  Flag, 
  Fuel, 
  ArrowRightLeft,
  Flame
} from 'lucide-react';

export const DemoControlPanel: React.FC = () => {
  const { 
    activeCar, 
    triggerSimulatedLap, 
    triggerBoxThisLap, 
    triggerPitExitAndSwap, 
    setSimulationFast, 
    isSimulatingFast,
    resetDemoRace 
  } = useRace();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#0c101a]/95 backdrop-blur-md border border-purple-500/40 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 sm:gap-4 flex-wrap max-w-[95vw] justify-center">
      
      <div className="flex items-center gap-2 pr-3 border-r border-white/10">
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
        <span className="font-orbitron font-extrabold text-[11px] text-purple-300 uppercase tracking-wider">
          Demo Simulator
        </span>
      </div>

      {/* Button 1: Next Lap */}
      <button
        onClick={triggerSimulatedLap}
        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors font-orbitron"
        title="Simulate completing one full lap"
      >
        <Play className="w-3.5 h-3.5 text-cyan-400" />
        <span>+1 Lap</span>
      </button>

      {/* Button 2: Box */}
      <button
        onClick={() => triggerBoxThisLap(activeCar.id)}
        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors font-orbitron"
        title="Call car into pit lane"
      >
        <Flag className="w-3.5 h-3.5 text-amber-400" />
        <span>Box</span>
      </button>

      {/* Button 3: Pit Exit & Swap */}
      <button
        onClick={() => triggerPitExitAndSwap(activeCar.id)}
        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors font-orbitron shadow-md shadow-purple-600/30"
        title="Complete pit stop, refill fuel and swap driver"
      >
        <ArrowRightLeft className="w-3.5 h-3.5" />
        <span>Swap</span>
      </button>

      {/* Button 4: 10x Fast Speed Toggle */}
      <button
        onClick={() => setSimulationFast(!isSimulatingFast)}
        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all font-orbitron ${
          isSimulatingFast
            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 animate-pulse'
            : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
        }`}
        title="Fast forward simulation speed"
      >
        <FastForward className="w-3.5 h-3.5" />
        <span>{isSimulatingFast ? '10x Speed' : '1x Speed'}</span>
      </button>

      {/* Button 5: Reset Demo */}
      <button
        onClick={resetDemoRace}
        className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        title="Reset demo race to initial state"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

    </div>
  );
};
