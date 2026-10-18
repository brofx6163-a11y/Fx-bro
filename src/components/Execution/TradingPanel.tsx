import React, { useState } from 'react';
import { Asset, ActiveTrade, Direction, Timeframe } from '../../types/trading';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Clock, DollarSign, Sparkles } from 'lucide-react';
import { soundManager } from '../../utils/audio';

interface TradingPanelProps {
  asset: Asset;
  activeTrades: ActiveTrade[];
  tradeHistory: ActiveTrade[];
  onPlaceTrade: (direction: Direction, amount: number, timeframe: Timeframe) => void;
  demoBalance: number;
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  autoTradeEnabled: boolean;
  setAutoTradeEnabled: (enabled: boolean) => void;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({
  asset,
  activeTrades,
  tradeHistory,
  onPlaceTrade,
  demoBalance,
  timeframe,
  setTimeframe,
  autoTradeEnabled,
  setAutoTradeEnabled,
}) => {
  const [investment, setInvestment] = useState<number>(50);

  const profitAmount = (investment * asset.payout) / 100;
  const totalReturn = investment + profitAmount;

  const handleTrade = (dir: Direction) => {
    if (investment <= 0 || investment > demoBalance) return;
    soundManager.playTradeEntry();
    onPlaceTrade(dir, investment, timeframe);
  };

  const quickAmounts = [10, 25, 50, 100, 250];

  return (
    <div className="flex flex-col h-full bg-[#0e121b] border border-[#1f2737] rounded-lg p-4 select-none">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1f2737]">
        <div>
          <span className="text-xs font-semibold text-slate-400">Trading Console</span>
          <div className="text-sm font-bold text-white flex items-center gap-1.5">
            <span>{asset.name}</span>
            <span className="text-[11px] font-mono-numbers text-[#00e676] bg-[#00e676]/10 px-1.5 py-0.5 rounded border border-[#00e676]/20">
              +{asset.payout}% Payout
            </span>
          </div>
        </div>

        {/* Live / Demo Mode indicator */}
        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Demo Account</span>
          <div className="font-mono-numbers text-sm font-bold text-white">
            ${demoBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Trade Parameters Form */}
      <div className="space-y-4 my-4">
        {/* Expiration Timeframe */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Expiry Duration</span>
            </span>
            <span className="font-mono-numbers text-slate-200">{timeframe}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 bg-[#151b26] p-1 rounded-md border border-[#232c3d]">
            {(['1M', '2M', '5M', '15M'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`py-1 text-xs font-mono-numbers font-medium rounded transition-colors cursor-pointer ${
                  timeframe === tf
                    ? 'bg-[#00e676] text-black font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Investment Amount */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              <span>Investment Amount</span>
            </span>
            <span className="font-mono-numbers text-slate-200">${investment.toFixed(2)}</span>
          </div>

          <div className="relative mb-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono-numbers text-sm">$</span>
            <input
              type="number"
              min="1"
              max={demoBalance}
              step="5"
              value={investment}
              onChange={(e) => setInvestment(Math.max(1, Number(e.target.value) || 1))}
              className="w-full bg-[#151b26] border border-[#263246] focus:border-[#00e676] rounded-md py-2 pl-7 pr-3 text-sm font-mono-numbers font-semibold text-white outline-none transition-colors"
            />
          </div>

          {/* Quick preset chips */}
          <div className="grid grid-cols-5 gap-1">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setInvestment(amt)}
                className={`py-1 text-[11px] font-mono-numbers rounded border transition-colors cursor-pointer ${
                  investment === amt
                    ? 'bg-[#223046] text-[#00e676] border-[#00e676]/40 font-bold'
                    : 'bg-[#151b26] text-slate-400 border-[#232c3d] hover:text-slate-200 hover:bg-[#1b2333]'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>

        {/* Payout & Return Calculation Box */}
        <div className="bg-[#121824] border border-[#1f2737] rounded-md p-2.5 space-y-1 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Net Profit (+{asset.payout}%):</span>
            <span className="font-mono-numbers font-bold text-[#00e676]">
              +${profitAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-slate-300 font-medium">
            <span>Total Payout:</span>
            <span className="font-mono-numbers font-bold text-white">
              ${totalReturn.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Execution Buttons: CALL & PUT */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* CALL BUTTON (GREEN) */}
          <button
            onClick={() => handleTrade('CALL')}
            className="flex flex-col items-center justify-center py-3 px-2 bg-gradient-to-b from-[#00e676] to-[#00c853] hover:from-[#15f187] hover:to-[#00dc5c] text-black font-extrabold rounded-md shadow-lg shadow-[#00e676]/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-1 text-sm tracking-wide">
              <TrendingUp className="w-4 h-4 stroke-[3]" />
              <span>CALL</span>
            </div>
            <span className="text-[11px] font-mono-numbers font-bold opacity-90">HIGHER (↑)</span>
          </button>

          {/* PUT BUTTON (RED) */}
          <button
            onClick={() => handleTrade('PUT')}
            className="flex flex-col items-center justify-center py-3 px-2 bg-gradient-to-b from-[#ff3366] to-[#e61e53] hover:from-[#ff4777] hover:to-[#f52b5e] text-white font-extrabold rounded-md shadow-lg shadow-[#ff3366]/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-1 text-sm tracking-wide">
              <TrendingDown className="w-4 h-4 stroke-[3]" />
              <span>PUT</span>
            </div>
            <span className="text-[11px] font-mono-numbers font-bold opacity-90">LOWER (↓)</span>
          </button>
        </div>

        {/* Auto Bot Execution Toggle */}
        <div className="flex items-center justify-between p-2.5 bg-[#141a27] border border-[#232d3f] rounded-md">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00e676]" />
            <div>
              <div className="text-xs font-semibold text-slate-200">Auto-Copy Bot</div>
              <div className="text-[10px] text-slate-400">Executes IDA signals &gt; 90%</div>
            </div>
          </div>
          <button
            onClick={() => setAutoTradeEnabled(!autoTradeEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              autoTradeEnabled ? 'bg-[#00e676]' : 'bg-[#263143]'
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                autoTradeEnabled ? 'translate-x-5 bg-black' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Active Trades & Recent History Tabs */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-[#1f2737] pt-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span>Active Positions ({activeTrades.length})</span>
          <span className="text-[11px] text-slate-500 font-mono-numbers">
            {tradeHistory.length} Past Trades
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
          {activeTrades.length === 0 ? (
            <div className="h-28 flex flex-col items-center justify-center text-center p-3 text-slate-500 text-xs">
              <Clock className="w-6 h-6 mb-1 text-slate-600 stroke-[1.5]" />
              <span>No open positions</span>
              <span className="text-[11px] text-slate-600 mt-0.5">Click CALL or PUT to open a position</span>
            </div>
          ) : (
            activeTrades.map((t) => {
              const remainingSec = Math.max(0, Math.ceil((t.expiryTimestamp - Date.now()) / 1000));
              const isCall = t.direction === 'CALL';
              const isITM = isCall ? t.currentPrice > t.entryPrice : t.currentPrice < t.entryPrice;

              return (
                <div
                  key={t.id}
                  className={`p-2 rounded-md border text-xs ${
                    isITM
                      ? 'bg-[#0f1d18] border-[#00e676]/30'
                      : 'bg-[#201319] border-[#ff3366]/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold">
                      {isCall ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#00e676]" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-[#ff3366]" />
                      )}
                      <span className={isCall ? 'text-[#00e676]' : 'text-[#ff3366]'}>
                        {t.direction}
                      </span>
                      <span className="text-white">${t.investment}</span>
                    </div>

                    <div className="font-mono-numbers text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>00:{remainingSec < 10 ? `0${remainingSec}` : remainingSec}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono-numbers">
                    <div>Entry: {t.entryPrice.toFixed(asset.precision)}</div>
                    <div className={`font-bold ${isITM ? 'text-[#00e676]' : 'text-[#ff3366]'}`}>
                      {isITM ? `+${t.payoutAmount.toFixed(2)} (ITM)` : `-$${t.investment.toFixed(2)} (OTM)`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
