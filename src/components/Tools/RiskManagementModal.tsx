import React, { useState } from 'react';
import { X, ShieldCheck, Calculator, TrendingUp, AlertTriangle } from 'lucide-react';

interface RiskManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPayout?: number;
}

export const RiskManagementModal: React.FC<RiskManagementModalProps> = ({
  isOpen,
  onClose,
  defaultPayout = 90,
}) => {
  const [baseTrade, setBaseTrade] = useState<number>(10);
  const [payoutRate, setPayoutRate] = useState<number>(defaultPayout);
  const [compoundingStart, setCompoundingStart] = useState<number>(100);
  const [dailyTargetPercent, setDailyTargetPercent] = useState<number>(5);

  if (!isOpen) return null;

  // Calculate Martingale steps to ensure net profit on win at any step
  const calculateMartingaleTable = () => {
    const steps = [];
    let cumulativeLoss = 0;
    const decimalPayout = payoutRate / 100;

    for (let step = 0; step <= 3; step++) {
      let requiredBet = 0;
      if (step === 0) {
        requiredBet = baseTrade;
      } else {
        // formula: requiredBet * decimalPayout - cumulativeLoss >= baseTrade * decimalPayout
        // requiredBet * decimalPayout = baseTrade * decimalPayout + cumulativeLoss
        requiredBet = Math.ceil((baseTrade * decimalPayout + cumulativeLoss) / decimalPayout);
      }

      cumulativeLoss += requiredBet;
      const profitIfWin = requiredBet * decimalPayout;
      const netProfitIfWin = profitIfWin - (cumulativeLoss - requiredBet);

      steps.push({
        step: step === 0 ? 'Base Entry' : `Step ${step} (MTG ${step})`,
        bet: requiredBet,
        totalRisked: cumulativeLoss,
        payoutAmount: requiredBet + profitIfWin,
        netProfit: netProfitIfWin,
      });
    }

    return steps;
  };

  // Compounding schedule
  const calculateCompoundingTable = () => {
    const rows = [];
    let current = compoundingStart;
    for (let day = 1; day <= 7; day++) {
      const profit = (current * dailyTargetPercent) / 100;
      const endBalance = current + profit;
      rows.push({
        day,
        start: current,
        dailyProfit: profit,
        end: endBalance,
      });
      current = endBalance;
    }
    return rows;
  };

  const mtgSteps = calculateMartingaleTable();
  const compoundDays = calculateCompoundingTable();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#101520] border border-[#222e43] rounded-xl max-w-2xl w-full p-5 max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1f283a]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#00e676]/10 text-[#00e676] border border-[#00e676]/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Quotex Risk Management & Calculators</h3>
              <p className="text-xs text-slate-400">Essential money management strategies for binary options</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Modal"
            className="p-1 rounded-md text-slate-400 hover:text-white bg-[#171f2e] border border-[#263246] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Martingale Recovery Calculator */}
        <div className="bg-[#141b27] border border-[#202a3d] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Calculator className="w-4 h-4 text-[#00e676]" />
              <span>Martingale Step Recovery Calculator</span>
            </div>
            <span className="text-[11px] font-mono-numbers text-slate-400">Formula-exact recovery</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Base Trade Amount ($)</label>
              <input
                type="number"
                min="1"
                value={baseTrade}
                onChange={(e) => setBaseTrade(Math.max(1, Number(e.target.value) || 1))}
                className="w-full bg-[#182130] border border-[#28364e] focus:border-[#00e676] rounded px-3 py-1.5 font-mono-numbers text-white font-semibold outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Quotex Asset Payout (%)</label>
              <input
                type="number"
                min="50"
                max="98"
                value={payoutRate}
                onChange={(e) => setPayoutRate(Math.max(50, Math.min(98, Number(e.target.value) || 90)))}
                className="w-full bg-[#182130] border border-[#28364e] focus:border-[#00e676] rounded px-3 py-1.5 font-mono-numbers text-white font-semibold outline-none"
              />
            </div>
          </div>

          {/* MTG Table */}
          <div className="overflow-x-auto pt-1">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#232e44] text-slate-400 text-[10px] uppercase">
                  <th className="py-1.5 px-2">Stage</th>
                  <th className="py-1.5 px-2 text-right">Trade Size</th>
                  <th className="py-1.5 px-2 text-right">Cumulative Risk</th>
                  <th className="py-1.5 px-2 text-right">Win Return</th>
                  <th className="py-1.5 px-2 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e273a] font-mono-numbers">
                {mtgSteps.map((row, idx) => (
                  <tr key={idx} className={idx === 0 ? 'bg-[#182232]' : ''}>
                    <td className="py-2 px-2 font-medium text-slate-200">{row.step}</td>
                    <td className="py-2 px-2 text-right font-bold text-white">${row.bet.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-slate-400">${row.totalRisked.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-slate-300">${row.payoutAmount.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right font-bold text-[#00e676]">
                      +${row.netProfit.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-start gap-2 p-2 bg-[#211812] border border-amber-600/30 rounded text-[11px] text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              <strong>Rule of Thumb:</strong> Limit Martingale to maximum 1 or 2 steps (MTG 1 or MTG 2). Never pursue deep compounding losses beyond Step 2.
            </span>
          </div>
        </div>

        {/* Section 2: Compounding Plan */}
        <div className="bg-[#141b27] border border-[#202a3d] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <TrendingUp className="w-4 h-4 text-[#00e676]" />
              <span>7-Day Compounding Roadmap</span>
            </div>
            <span className="text-[11px] font-mono-numbers text-slate-400">Discipline tracker</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Starting Capital ($)</label>
              <input
                type="number"
                min="10"
                value={compoundingStart}
                onChange={(e) => setCompoundingStart(Math.max(10, Number(e.target.value) || 10))}
                className="w-full bg-[#182130] border border-[#28364e] focus:border-[#00e676] rounded px-3 py-1.5 font-mono-numbers text-white font-semibold outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Daily Target (%)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={dailyTargetPercent}
                onChange={(e) => setDailyTargetPercent(Math.max(1, Math.min(30, Number(e.target.value) || 5)))}
                className="w-full bg-[#182130] border border-[#28364e] focus:border-[#00e676] rounded px-3 py-1.5 font-mono-numbers text-white font-semibold outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto pt-1">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#232e44] text-slate-400 text-[10px] uppercase">
                  <th className="py-1.5 px-2">Day</th>
                  <th className="py-1.5 px-2 text-right">Start Balance</th>
                  <th className="py-1.5 px-2 text-right">Target Daily P&L</th>
                  <th className="py-1.5 px-2 text-right">End Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e273a] font-mono-numbers">
                {compoundDays.map((d) => (
                  <tr key={d.day}>
                    <td className="py-1.5 px-2 text-slate-300 font-medium">Day {d.day}</td>
                    <td className="py-1.5 px-2 text-right text-slate-400">${d.start.toFixed(2)}</td>
                    <td className="py-1.5 px-2 text-right text-[#00e676] font-semibold">+${d.dailyProfit.toFixed(2)}</td>
                    <td className="py-1.5 px-2 text-right text-white font-bold">${d.end.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1e2738] hover:bg-[#28354c] text-white rounded-md text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
