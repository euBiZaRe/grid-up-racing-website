import React, { useState } from 'react';
import { useRace } from '../../context/RaceContext';
import { Stint, StintStatus } from '../../types';
import { 
  Lock, 
  Unlock, 
  ArrowUp, 
  ArrowDown, 
  User, 
  Clock, 
  Edit3, 
  Check, 
  X
} from 'lucide-react';

export const StintTimeline: React.FC = () => {
  const { activeCar, toggleStintLock, reorderStints, updateStint } = useRace();
  const [editingStintId, setEditingStintId] = useState<string | null>(null);
  const [editDuration, setEditDuration] = useState<number>(60);
  const [editDriverId, setEditDriverId] = useState<string>('');

  const handleStartEdit = (stint: Stint) => {
    setEditingStintId(stint.id);
    setEditDuration(stint.plannedDurationMinutes);
    setEditDriverId(stint.driverId);
  };

  const handleSaveEdit = (stintId: string) => {
    const driver = activeCar.drivers.find(d => d.id === editDriverId);
    updateStint(activeCar.id, stintId, {
      plannedDurationMinutes: editDuration,
      driverId: editDriverId,
      driverName: driver ? driver.name : 'Unassigned'
    });
    setEditingStintId(null);
  };

  const getStatusStyle = (status: StintStatus) => {
    switch (status) {
      case 'LIVE':
        return 'bg-emerald-500/10 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/30';
      case 'COMPLETED':
        return 'bg-white/[0.03] border-white/10 text-slate-400 opacity-60';
      case 'PLANNED':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:border-purple-500/60';
      case 'OVERRIDDEN':
        return 'bg-amber-500/10 border-amber-500/40 text-amber-300';
      case 'CANCELLED':
        return 'bg-red-500/10 border-red-500/30 text-red-400 line-through opacity-50';
      default:
        return 'bg-white/5 border-white/10 text-slate-300';
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#111624] to-[#0a0d16] border border-white/10 p-5 lg:p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h3 className="font-orbitron font-extrabold text-base tracking-wider text-white uppercase flex items-center gap-2.5">
            <span>Stint Strategy Timeline</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold font-sans">
              {activeCar.stints.length} Stints Planned
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Reorder future stints with arrows, lock drivers with 🔒, or click edit to customize stint windows.
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Live</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Planned</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Completed</span>
          <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-amber-400" /> Locked</span>
        </div>
      </div>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-4 pt-1 snap-x">
        {activeCar.stints.map((stint, index) => {
          const isLive = stint.status === 'LIVE';
          const isCompleted = stint.status === 'COMPLETED';
          const isEditing = editingStintId === stint.id;

          return (
            <div
              key={stint.id}
              className={`shrink-0 w-64 rounded-xl border p-4 transition-all relative snap-start ${getStatusStyle(stint.status)}`}
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="font-orbitron font-black text-sm">#{stint.stintNumber}</span>
                  {isLive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-bold uppercase tracking-wider animate-pulse">
                      ON TRACK
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400 font-bold uppercase">
                      DONE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {!isCompleted && !isLive && (
                    <button
                      onClick={() => toggleStintLock(activeCar.id, stint.id)}
                      className={`p-1 rounded-md transition-colors ${
                        stint.isLocked ? 'text-amber-400 hover:text-amber-300 bg-amber-400/10' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={stint.isLocked ? 'Locked' : 'Unlocked'}
                    >
                      {stint.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {!isCompleted && !isLive && (
                    <button
                      onClick={() => handleStartEdit(stint)}
                      className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
                      title="Edit stint settings"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Driver:</label>
                    <select
                      value={editDriverId}
                      onChange={(e) => setEditDriverId(e.target.value)}
                      className="w-full bg-black/60 border border-purple-500/50 rounded-lg p-1.5 text-xs text-white outline-none"
                    >
                      {activeCar.drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Duration (mins):</label>
                    <input
                      type="number"
                      value={editDuration}
                      onChange={(e) => setEditDuration(parseInt(e.target.value) || 30)}
                      className="w-full bg-black/60 border border-purple-500/50 rounded-lg p-1.5 text-xs text-white font-mono outline-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleSaveEdit(stint.id)}
                      className="flex-1 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Save
                    </button>
                    <button
                      onClick={() => setEditingStintId(null)}
                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="font-extrabold text-sm text-white truncate">
                      {stint.driverName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {stint.plannedStartTime} &rarr; {stint.plannedEndTime}
                    </span>
                    <span className="font-bold text-purple-300">
                      {stint.plannedDurationMinutes}m
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-white/5 font-mono">
                    <span>Est. Laps: ~{stint.plannedLaps}</span>
                    <span className="text-amber-400">Pit: L{stint.pitWindowCloseLap || '--'}</span>
                  </div>
                </div>
              )}

              {!isCompleted && !isLive && (
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10 text-xs">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Shift:</span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={index <= 1}
                      onClick={() => reorderStints(activeCar.id, index, index - 1)}
                      className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-slate-300"
                      title="Move earlier"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      disabled={index >= activeCar.stints.length - 1}
                      onClick={() => reorderStints(activeCar.id, index, index + 1)}
                      className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-slate-300"
                      title="Move later"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
