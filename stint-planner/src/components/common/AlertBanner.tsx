import React from 'react';
import { useRace } from '../../context/RaceContext';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const AlertBanner: React.FC = () => {
  const { race, activeCar, dismissAlert } = useRace();

  const activeAlerts = race.alerts.filter(a => a.carId === activeCar.id && !a.dismissed).slice(0, 2);
  if (activeAlerts.length === 0) return null;

  return (
    <div className="w-full space-y-2 mb-4">
      {activeAlerts.map(alert => {
        const isCritical = alert.severity === 'CRITICAL';
        const isWarning = alert.severity === 'WARNING';

        return (
          <div
            key={alert.id}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border backdrop-blur-md transition-all ${
              isCritical
                ? 'bg-red-500/15 border-red-500/40 text-red-200 animate-pulse shadow-lg shadow-red-500/20'
                : isWarning
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-md shadow-amber-500/10'
                : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {isCritical ? (
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              ) : isWarning ? (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-cyan-400 shrink-0" />
              )}
              <div>
                <span className="font-orbitron font-bold text-xs uppercase tracking-wider mr-2">
                  {alert.title}
                </span>
                <span className="text-xs opacity-90">{alert.message}</span>
              </div>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
