import React, { useState } from 'react';
import { Signal } from '../../types/trading';
import { ArrowUpRight, ArrowDownRight, Share2, Check, Clock, ChevronDown, ChevronUp, Zap, Sparkles } from 'lucide-react';
import { formatTelegramSignal } from '../../services/signalEngine';

interface SignalCardProps {
  signal: Signal;
  onExecuteTrade?: (signal: Signal) => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal, onExecuteTrade }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isCall = signal.direction === 'CALL';
  const isWon = signal.status === 'WON';
  const isLost = signal.status === 'LOST';
  const isActive = signal.status === 'ACTIVE';

  const handleCopyTelegram = () => {
    const text = formatTelegramSignal(signal);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const entryTimeStr = new Date(signal.entryTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return (
    <div
      className={`rounded-lg border p-3.5 transition-all ${
        isActive
          ? isCall
            ? 'bg-[#0f1d18]/70 border-[#00e676]/40 shadow-sm shadow-[#00e676]/10'
            : 'bg-[#201319]/70 border-[#ff3366]/40 shadow-sm shadow-[#ff3366]/10'
          : isWon
          ? 'bg-[#0e161c] border-[#00e676]/30'
          : isLost
          ? 'bg-[#181216] border-[#ff3366]/30'
          : 'bg-[#121824] border-[#1f2737]'
      }`}
    >
      {/* Top row: Asset name, OTC tag, and confidence */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm tracking-tight">{signal.pair}</span>
          <span className="text-[11px] font-mono-numbers px-1.5 py-0.5 rounded bg-[#1c2433] text-slate-300 border border-[#2b374d]">
            {signal.timeframe}
          </span>
        </div>

        {/* Win/Loss Status or Confidence */}
        <div className="flex items-center gap-1.5">
          {isWon && (
            <span className="text-xs font-mono-numbers font-bold text-[#00e676] bg-[#00e676]/10 px-2 py-0.5 rounded border border-[#00e676]/30">
              WIN ✓
            </span>
          )}
          {isLost && (
            <span className="text-xs font-mono-numbers font-bold text-[#ff3366] bg-[#ff3366]/10 px-2 py-0.5 rounded border border-[#ff3366]/30">
              LOSS ✕
            </span>
          )}
          {isActive && (
            <div className="flex items-center gap-1 text-xs font-mono-numbers text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              <Clock className="w-3 h-3 animate-spin" />
              <span>LIVE</span>
            </div>
          )}

          <div className="font-mono-numbers text-xs font-bold text-white bg-[#1e2738] px-2 py-0.5 rounded border border-[#2e3b52]">
            {signal.confidence}% ACC
          </div>
        </div>
      </div>

      {/* Main direction & Strategy row */}
      <div className="flex items-center justify-between my-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-extrabold text-xs tracking-wider shadow-sm ${
              isCall
                ? 'bg-[#00e676] text-black shadow-[#00e676]/20'
                : 'bg-[#ff3366] text-white shadow-[#ff3366]/20'
            }`}
          >
            {isCall ? (
              <>
                <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                <span>CALL / UP</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="w-4 h-4 stroke-[3]" />
                <span>PUT / DOWN</span>
              </>
            )}
          </div>

          <div className="text-xs text-slate-400">
            <span className="text-slate-500">Entry: </span>
            <span className="font-mono-numbers text-slate-200 font-semibold">{entryTimeStr}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {/* One click execute */}
          {onExecuteTrade && isActive && (
            <button
              onClick={() => onExecuteTrade(signal)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#00e676]/20 hover:bg-[#00e676] text-[#00e676] hover:text-black border border-[#00e676]/40 rounded text-xs font-bold transition-all cursor-pointer"
              title="Execute in Quotex Demo Simulator"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Auto-Execute</span>
            </button>
          )}

          {/* Telegram VIP copy */}
          <button
            onClick={handleCopyTelegram}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#171f2e] hover:bg-[#202b3e] text-slate-300 hover:text-white border border-[#263246] rounded text-xs transition-colors cursor-pointer"
            title="Copy formatted signal for Telegram VIP channel"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#00e676]" />
                <span className="text-[#00e676] font-medium">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metadata strip (Zero-pill text format with dots) */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-[#1a2230]">
        <span>{signal.strategyName}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>Entry ${signal.entryPrice}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>MTG: Max 1 Step</span>
        <div className="ml-auto">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-0.5 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <span>{expanded ? 'Less' : 'Analysis'}</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Technical Breakdown */}
      {expanded && (
        <div className="mt-3 pt-2.5 border-t border-[#1e2738] bg-[#0c1017] p-2.5 rounded text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1 text-[11px]">
            <Sparkles className="w-3 h-3 text-[#00e676]" />
            <span>IDA Algorithmic Confluence Factors:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>RSI (14):</span>
              <span className="font-mono-numbers text-slate-200 font-semibold">
                {signal.indicators.rsi} ({signal.indicators.rsiState})
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>EMA 9/21:</span>
              <span className={`font-mono-numbers font-semibold ${signal.indicators.emaCross === 'BULLISH' ? 'text-[#00e676]' : 'text-[#ff3366]'}`}>
                {signal.indicators.emaCross}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Bollinger:</span>
              <span className="font-mono-numbers text-slate-200 font-semibold">
                {signal.indicators.bollingerState}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Trend Score:</span>
              <span className="font-mono-numbers text-slate-200 font-semibold">
                {signal.indicators.trendScore} / 100
              </span>
            </div>
          </div>
          {signal.indicators.candlePattern && (
            <div className="text-[11px] text-[#00e676] pt-1 border-t border-[#1a2230]">
              Pattern Detected: <span className="font-semibold">{signal.indicators.candlePattern}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
