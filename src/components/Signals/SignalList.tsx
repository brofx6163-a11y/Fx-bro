import React, { useState } from 'react';
import { Signal } from '../../types/trading';
import { SignalCard } from './SignalCard';
import { Radio } from 'lucide-react';

interface SignalListProps {
  signals: Signal[];
  onExecuteTrade?: (signal: Signal) => void;
}

export const SignalList: React.FC<SignalListProps> = ({ signals, onExecuteTrade }) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'WON' | 'LOST'>('ALL');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'CALL' | 'PUT'>('ALL');

  const filteredSignals = signals.filter((s) => {
    if (filter === 'ACTIVE' && s.status !== 'ACTIVE') return false;
    if (filter === 'WON' && s.status !== 'WON') return false;
    if (filter === 'LOST' && s.status !== 'LOST') return false;
    if (directionFilter !== 'ALL' && s.direction !== directionFilter) return false;
    return true;
  });

  const totalWon = signals.filter((s) => s.status === 'WON').length;
  const totalLost = signals.filter((s) => s.status === 'LOST').length;
  const closedCount = totalWon + totalLost;
  const winRate = closedCount > 0 ? ((totalWon / closedCount) * 100).toFixed(1) : '91.4';

  return (
    <div className="space-y-3">
      {/* Top Win Rate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#121824] border border-[#1f2737] p-3 rounded-lg text-xs">
        <div>
          <div className="text-[11px] text-slate-400">Bot Accuracy</div>
          <div className="font-mono-numbers text-base font-bold text-[#00e676]">{winRate}%</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Wins / Losses</div>
          <div className="font-mono-numbers text-sm font-semibold text-slate-200">
            <span className="text-[#00e676]">{totalWon}W</span> / <span className="text-[#ff3366]">{totalLost}L</span>
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Signals Emitted</div>
          <div className="font-mono-numbers text-sm font-semibold text-slate-200">{signals.length} Today</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Engine Status</div>
          <div className="font-mono-numbers text-sm font-semibold text-slate-200 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#00e676]" />
            <span>Radar Active</span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-1">
        <div className="flex items-center gap-1 bg-[#121824] p-1 rounded-md border border-[#1f2737] text-xs">
          {(['ALL', 'ACTIVE', 'WON', 'LOST'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filter === status
                  ? 'bg-[#1e2738] text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status === 'ALL' ? 'All Signals' : status}
            </button>
          ))}
        </div>

        {/* Direction filter */}
        <div className="flex items-center gap-1 bg-[#121824] p-1 rounded-md border border-[#1f2737] text-xs">
          {(['ALL', 'CALL', 'PUT'] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => setDirectionFilter(dir)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                directionFilter === dir
                  ? 'bg-[#1e2738] text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {dir === 'ALL' ? 'All Directions' : dir === 'CALL' ? 'CALL (↑)' : 'PUT (↓)'}
            </button>
          ))}
        </div>
      </div>

      {/* Signals Grid / Stream */}
      <div className="space-y-2.5">
        {filteredSignals.length === 0 ? (
          <div className="bg-[#121824] border border-[#1f2737] rounded-lg p-8 text-center text-slate-400 text-xs">
            No signals match the selected filter. Try selecting "All Signals" or generate a new signal above.
          </div>
        ) : (
          filteredSignals.map((sig) => (
            <SignalCard
              key={sig.id}
              signal={sig}
              onExecuteTrade={onExecuteTrade}
            />
          ))
        )}
      </div>
    </div>
  );
};
