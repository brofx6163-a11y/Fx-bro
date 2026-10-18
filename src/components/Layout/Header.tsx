import React from 'react';
import { Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface HeaderProps {
  activeTab: 'signals' | 'scanner' | 'risk';
  setActiveTab: (tab: 'signals' | 'scanner' | 'risk') => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  openRiskModal: () => void;
  demoBalance: number;
  autoTradeEnabled: boolean;
  setAutoTradeEnabled: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isMuted,
  setIsMuted,
  openRiskModal,
  demoBalance,
  autoTradeEnabled,
  setAutoTradeEnabled,
}) => {
  const handleToggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundManager.playCountdownTick();
    }
  };

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0e121b] border-b border-[#1f2737] select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00c853] to-[#00e676] flex items-center justify-center font-extrabold text-black text-sm tracking-wider shadow-sm shadow-[#00e676]/20">
          IDA
        </div>
        <div className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="text-base font-bold tracking-tight text-white">Quotex IDA</span>
          <span className="text-xs font-semibold text-[#00e676] font-mono-numbers">v4.2</span>
        </div>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-xs font-medium tracking-wide">
        <button
          onClick={() => setActiveTab('signals')}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer border-b-2 ${
            activeTab === 'signals'
              ? 'text-white border-[#00e676] font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Live Signals & Radar
        </button>

        <button
          onClick={() => setActiveTab('scanner')}
          className={`transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer border-b-2 ${
            activeTab === 'scanner'
              ? 'text-white border-[#00e676] font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Multi-Pair Scanner
        </button>

        <button
          onClick={openRiskModal}
          className="text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 cursor-pointer border-b-2 border-transparent"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Martingale & Risk</span>
        </button>
      </nav>

      {/* Zone 3: Primary action + quick controls */}
      <div className="flex items-center gap-3.5 shrink-0">
        {/* Sound toggle button */}
        <button
          onClick={handleToggleSound}
          aria-label={isMuted ? 'Unmute alerts' : 'Mute alerts'}
          className="p-1.5 rounded-md text-slate-400 hover:text-white bg-[#151b26] hover:bg-[#1c2433] border border-[#263246] transition-colors cursor-pointer"
          title={isMuted ? 'Enable Sound Chimes' : 'Mute Sounds'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-[#00e676]" />}
        </button>

        {/* Balance Display */}
        <div className="flex items-center bg-[#151b26] border border-[#263246] rounded-md px-2.5 py-1 text-xs">
          <span className="text-slate-400 text-[11px] mr-1.5">DEMO:</span>
          <span className="font-mono-numbers font-bold text-white tracking-tight">
            ${demoBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Primary CTA: Auto-Trade Toggle */}
        <button
          onClick={() => setAutoTradeEnabled(!autoTradeEnabled)}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            autoTradeEnabled
              ? 'bg-[#00e676] text-black shadow-md shadow-[#00e676]/20 hover:bg-[#00c853]'
              : 'bg-[#1e2738] text-slate-300 hover:bg-[#28354c] hover:text-white border border-[#2d3950]'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${autoTradeEnabled ? 'bg-black animate-pulse' : 'bg-slate-500'}`} />
          <span>{autoTradeEnabled ? 'Auto-Bot: Active' : 'Auto-Bot: Standby'}</span>
        </button>
      </div>
    </header>
  );
};
