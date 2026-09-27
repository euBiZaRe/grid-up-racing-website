import React, { useState } from 'react';
import { useRace } from '../../context/RaceContext';
import { X, Key, Radio, Shield, Save, Check } from 'lucide-react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const { 
    telemetrySource, 
    setTelemetrySource, 
    garage61Token, 
    setGarage61Token 
  } = useRace();

  const [tokenInput, setTokenInput] = useState<string>(garage61Token);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setGarage61Token(tokenInput);
    localStorage.setItem('gridup_g61_token', tokenInput);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0c101a] border border-white/15 rounded-2xl shadow-2xl p-6">
        
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h2 className="font-orbitron font-extrabold text-base text-white">
            Telemetry & Planner Settings
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {/* Telemetry Source Selector */}
          <div>
            <label className="text-xs uppercase font-bold text-slate-300 block mb-2">
              Active Telemetry Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['DEMO', 'GARAGE61', 'LOCAL'] as const).map(source => (
                <button
                  key={source}
                  onClick={() => setTelemetrySource(source)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold font-orbitron transition-all ${
                    telemetrySource === source
                      ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm shadow-purple-600/30'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          {/* Garage 61 Token */}
          <div>
            <label className="text-xs uppercase font-bold text-slate-300 block mb-1">
              Garage 61 Personal Access Token (PAT)
            </label>
            <input
              type="password"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              placeholder="Paste your Garage 61 PAT token..."
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Your token is securely stored and proxied server-side to fetch team telemetry.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 font-orbitron"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'Saved!' : 'Save Settings'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
