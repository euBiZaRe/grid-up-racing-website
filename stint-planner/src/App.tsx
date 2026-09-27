import React, { useState } from 'react';
import { RaceProvider } from './context/RaceContext';
import { Header } from './components/common/Header';
import { AlertBanner } from './components/common/AlertBanner';
import { CurrentStintCard } from './components/dashboard/CurrentStintCard';
import { NextDriverCard } from './components/dashboard/NextDriverCard';
import { FuelCalculatorCard } from './components/dashboard/FuelCalculatorCard';
import { StintTimeline } from './components/dashboard/StintTimeline';
import { ManualOverridePanel } from './components/dashboard/ManualOverridePanel';
import { RaceSetupWizard } from './components/wizard/RaceSetupWizard';
import { RaceControlLive } from './components/live/RaceControlLive';
import { DemoControlPanel } from './components/demo/DemoControlPanel';
import { SettingsModal } from './components/settings/SettingsModal';

export const AppContent: React.FC = () => {
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLiveFullscreen, setIsLiveFullscreen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans pb-24">
      {/* Top Header */}
      <Header
        onOpenWizard={() => setIsWizardOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleFullscreen={() => setIsLiveFullscreen(!isLiveFullscreen)}
        isFullscreen={isLiveFullscreen}
      />

      {/* Main Container */}
      <main className="max-w-[1800px] w-full mx-auto px-4 py-6 sm:px-6 flex-1 space-y-6">
        
        {/* Dynamic Alert Banner */}
        <AlertBanner />

        {/* Top Split: Current Stint (Hero) & Next Driver / Fuel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 xl:col-span-8">
            <CurrentStintCard />
          </div>
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
            <NextDriverCard />
            <FuelCalculatorCard />
          </div>
        </div>

        {/* Tactical Overrides Panel */}
        <ManualOverridePanel />

        {/* Horizontal Stint Strategy Timeline */}
        <StintTimeline />

      </main>

      {/* Modals & Fullscreen Overlays */}
      <RaceSetupWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <RaceControlLive
        isOpen={isLiveFullscreen}
        onClose={() => setIsLiveFullscreen(false)}
      />

      {/* Floating Demo Control Bar */}
      <DemoControlPanel />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <RaceProvider>
      <AppContent />
    </RaceProvider>
  );
};

export default App;
