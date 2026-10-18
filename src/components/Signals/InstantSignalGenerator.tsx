import React, { useState } from 'react';
import { Asset, Timeframe, Signal } from '../../types/trading';
import { STRATEGIES, StrategyId } from '../../services/signalEngine';
import { Cpu, Sparkles, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface InstantSignalGeneratorProps {
  assets: Asset[];
  selectedAsset: Asset;
  onSelectAsset: (asset: Asset) => void;
  onGenerateSignal: (asset: Asset, timeframe: Timeframe, strategy: StrategyId) => Signal;
}

export const InstantSignalGenerator: React.FC<InstantSignalGeneratorProps> = ({
  assets,
  selectedAsset,
  onSelectAsset,
  onGenerateSignal,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [strategy, setStrategy] = useState<StrategyId>('IDA_SNIPER');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [lastGenerated, setLastGenerated] = useState<Signal | null>(null);

  const handleScan = () => {
    setIsScanning(true);
    setScanStep('Analyzing price action & volatility...');
    soundManager.playCountdownTick();

    setTimeout(() => {
      setScanStep('Evaluating EMA 9/21 cross & RSI levels...');
    }, 450);

    setTimeout(() => {
      setScanStep('Checking Bollinger Bands & Candle patterns...');
    }, 850);

    setTimeout(() => {
      const signal = onGenerateSignal(selectedAsset, timeframe, strategy);
      setLastGenerated(signal);
      setIsScanning(false);
      setScanStep('');
      soundManager.playSignalAlert();
    }, 1300);
  };

  return (
    <div className="bg-[#121824] border border-[#1f2737] rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#1f2737]">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#00e676]" />
          <h2 className="text-sm font-bold text-white tracking-tight">IDA Instant Signal Scanner</h2>
        </div>
        <span className="text-[11px] font-mono-numbers text-slate-400">Quotex Turbo Algo</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Asset selection */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Target Asset</label>
          <select
            value={selectedAsset.id}
            onChange={(e) => {
              const found = assets.find((a) => a.id === e.target.value);
              if (found) onSelectAsset(found);
            }}
            className="w-full bg-[#171f2e] border border-[#28354d] rounded-md px-3 py-2 text-xs text-white font-medium focus:border-[#00e676] outline-none cursor-pointer"
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (+{a.payout}%)
              </option>
            ))}
          </select>
        </div>

        {/* Timeframe selection */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Expiration Timeframe</label>
          <div className="grid grid-cols-4 gap-1 bg-[#171f2e] p-1 rounded-md border border-[#28354d]">
            {(['1M', '2M', '5M', '15M'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`py-1 text-xs font-mono-numbers font-medium rounded transition-colors cursor-pointer ${
                  timeframe === tf
                    ? 'bg-[#00e676] text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy selection */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Strategy Algorithm</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as StrategyId)}
            className="w-full bg-[#171f2e] border border-[#28354d] rounded-md px-3 py-2 text-xs text-white font-medium focus:border-[#00e676] outline-none cursor-pointer"
          >
            {STRATEGIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate Button & Progress */}
      <div className="pt-1">
        <button
          onClick={handleScan}
          disabled={isScanning}
          className={`w-full py-2.5 px-4 rounded-md font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            isScanning
              ? 'bg-[#1e2738] text-slate-400 border border-[#2d3a50]'
              : 'bg-gradient-to-r from-[#00c853] to-[#00e676] hover:from-[#00e676] hover:to-[#15f187] text-black shadow-lg shadow-[#00e676]/20'
          }`}
        >
          {isScanning ? (
            <>
              <Sparkles className="w-4 h-4 text-[#00e676] animate-spin" />
              <span>{scanStep}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>GENERATE HIGH CONFIDENCE SIGNAL NOW</span>
            </>
          )}
        </button>
      </div>

      {/* Quick feedback after generation */}
      {lastGenerated && !isScanning && (
        <div className="flex items-center justify-between p-2.5 bg-[#0e161c] border border-[#00e676]/30 rounded-md text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-[#00e676]" />
            <span>
              Generated <strong className="text-white">{lastGenerated.direction}</strong> for{' '}
              <strong>{lastGenerated.pair}</strong> with{' '}
              <strong className="text-[#00e676] font-mono-numbers">{lastGenerated.confidence}%</strong> accuracy!
            </span>
          </div>
          <span className="text-[11px] font-mono-numbers text-slate-400">Added to feed</span>
        </div>
      )}
    </div>
  );
};
