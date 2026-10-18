import React from 'react';
import { Asset, Signal } from '../../types/trading';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Eye, Zap } from 'lucide-react';

interface MarketScannerProps {
  assets: Asset[];
  selectedAsset: Asset;
  onSelectAsset: (asset: Asset) => void;
  onQuickGenerate: (asset: Asset) => Signal;
  onNavigateToChart: () => void;
}

export const MarketScanner: React.FC<MarketScannerProps> = ({
  assets,
  selectedAsset,
  onSelectAsset,
  onQuickGenerate,
  onNavigateToChart,
}) => {
  return (
    <div className="bg-[#121824] border border-[#1f2737] rounded-lg p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1f2737]">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>Quotex Multi-Pair Radar & Scanner</span>
            <span className="text-[11px] font-mono-numbers px-2 py-0.5 rounded bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/30">
              Live Feed
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time scanner analyzing trend velocity, OTC volatility, and payout yields across all Quotex pairs.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-numbers text-slate-400">
          <span>Active Pairs: <strong className="text-white">{assets.length}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Max Payout: <strong className="text-[#00e676]">93%</strong></span>
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1f2737] text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3">Asset / Pair</th>
              <th className="py-2.5 px-3 text-right">Payout</th>
              <th className="py-2.5 px-3 text-right">Current Price</th>
              <th className="py-2.5 px-3 text-right">24h Change</th>
              <th className="py-2.5 px-3 text-center">Market Sentiment</th>
              <th className="py-2.5 px-3 text-center">IDA Algorithmic Bias</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#18202d]">
            {assets.map((asset) => {
              const isSelected = asset.id === selectedAsset.id;
              // Synthetic market sentiment calculation based on 24h change & volatility
              const sentimentCall = Math.min(85, Math.max(25, Math.round(52 + asset.change24h * 8)));
              const sentimentPut = 100 - sentimentCall;
              const isBullish = sentimentCall >= 50;

              return (
                <tr
                  key={asset.id}
                  className={`transition-colors hover:bg-[#161f2d] ${
                    isSelected ? 'bg-[#182232]' : ''
                  }`}
                >
                  {/* Asset name */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-white text-xs">{asset.name}</div>
                      {asset.isOTC && (
                        <span className="text-[10px] font-mono-numbers px-1 py-0.2 bg-[#1f2838] text-slate-300 rounded border border-[#2c384d]">
                          OTC 24/7
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{asset.category}</div>
                  </td>

                  {/* Payout */}
                  <td className="py-3 px-3 text-right font-mono-numbers">
                    <span className="font-bold text-sm text-[#00e676]">+{asset.payout}%</span>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-3 text-right font-mono-numbers text-slate-200 font-semibold">
                    {asset.currentPrice.toFixed(asset.precision)}
                  </td>

                  {/* 24h Change */}
                  <td className="py-3 px-3 text-right font-mono-numbers">
                    <span
                      className={`inline-flex items-center gap-0.5 font-semibold ${
                        asset.change24h >= 0 ? 'text-[#00e676]' : 'text-[#ff3366]'
                      }`}
                    >
                      {asset.change24h >= 0 ? '+' : ''}
                      {asset.change24h.toFixed(2)}%
                    </span>
                  </td>

                  {/* Market Sentiment Gauge */}
                  <td className="py-3 px-3">
                    <div className="w-36 mx-auto">
                      <div className="flex justify-between text-[10px] font-mono-numbers text-slate-400 mb-1">
                        <span className="text-[#00e676]">{sentimentCall}% CALL</span>
                        <span className="text-[#ff3366]">{sentimentPut}% PUT</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#ff3366] rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${sentimentCall}%` }}
                          className="h-full bg-[#00e676]"
                        />
                      </div>
                    </div>
                  </td>

                  {/* Algorithmic Bias */}
                  <td className="py-3 px-3 text-center">
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold ${
                        isBullish
                          ? 'bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/30'
                          : 'bg-[#ff3366]/10 text-[#ff3366] border border-[#ff3366]/30'
                      }`}
                    >
                      {isBullish ? (
                        <>
                          <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>STRONG CALL</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>STRONG PUT</span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          onSelectAsset(asset);
                          onNavigateToChart();
                        }}
                        className="p-1.5 rounded bg-[#171f2e] hover:bg-[#222e43] text-slate-300 hover:text-white border border-[#27354b] transition-colors cursor-pointer"
                        title="View Live Chart"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          onSelectAsset(asset);
                          onQuickGenerate(asset);
                          onNavigateToChart();
                        }}
                        className="flex items-center gap-1 px-2 py-1.5 rounded bg-[#00e676]/20 hover:bg-[#00e676] text-[#00e676] hover:text-black border border-[#00e676]/40 text-[11px] font-bold transition-all cursor-pointer"
                        title="Generate Signal for this asset"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Signal</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
