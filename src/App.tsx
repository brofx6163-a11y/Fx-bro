import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Asset, Candle, Direction, Signal, Timeframe, ActiveTrade } from './types/trading';
import { INITIAL_ASSETS, generateInitialCandles, getTimeframeMs } from './services/marketData';
import { generateSignalForAsset, StrategyId } from './services/signalEngine';
import { Header } from './components/Layout/Header';
import { QuotexChart } from './components/Chart/QuotexChart';
import { TradingPanel } from './components/Execution/TradingPanel';
import { SignalList } from './components/Signals/SignalList';
import { InstantSignalGenerator } from './components/Signals/InstantSignalGenerator';
import { MarketScanner } from './components/Scanner/MarketScanner';
import { RiskManagementModal } from './components/Tools/RiskManagementModal';
import { MarketSessions } from './components/Tools/MarketSessions';
import { soundManager } from './utils/audio';

export default function App() {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<Asset>(INITIAL_ASSETS[0]);
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');

  // Chart candles
  const [candles, setCandles] = useState<Candle[]>(() =>
    generateInitialCandles(INITIAL_ASSETS[0], 65, 1)
  );

  // Audio and navigation
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.getMuted());
  const [activeTab, setActiveTab] = useState<'signals' | 'scanner' | 'risk'>('signals');
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);

  // Trading Account & Simulator
  const [demoBalance, setDemoBalance] = useState<number>(() => {
    const saved = localStorage.getItem('quotex_ida_balance');
    return saved ? Number(saved) : 10000;
  });
  const [autoTradeEnabled, setAutoTradeEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('quotex_ida_autotrade');
    return saved === 'true';
  });

  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<ActiveTrade[]>([]);

  // Candle timer
  const [candleSecondsRemaining, setCandleSecondsRemaining] = useState<number>(60);

  // Signals Feed
  const [signals, setSignals] = useState<Signal[]>(() => {
    // Generate 3 realistic initial past/active signals
    const init1 = generateSignalForAsset(INITIAL_ASSETS[0], candles, '1M', 'IDA_SNIPER', 'CALL');
    init1.status = 'ACTIVE';
    init1.confidence = 94.6;

    const init2 = generateSignalForAsset(INITIAL_ASSETS[1], candles, '1M', 'IDA_REVERSAL', 'PUT');
    init2.status = 'WON';
    init2.confidence = 92.4;

    const init3 = generateSignalForAsset(INITIAL_ASSETS[3], candles, '2M', 'IDA_BREAKOUT', 'CALL');
    init3.status = 'WON';
    init3.confidence = 95.1;

    return [init1, init2, init3];
  });

  // Reference for current prices in interval
  const selectedAssetRef = useRef(selectedAsset);
  selectedAssetRef.current = selectedAsset;

  const assetsRef = useRef(assets);
  assetsRef.current = assets;

  const candlesRef = useRef(candles);
  candlesRef.current = candles;

  const activeTradesRef = useRef(activeTrades);
  activeTradesRef.current = activeTrades;

  const signalsRef = useRef(signals);
  signalsRef.current = signals;

  const autoTradeRef = useRef(autoTradeEnabled);
  autoTradeRef.current = autoTradeEnabled;

  // Persist demo balance
  useEffect(() => {
    localStorage.setItem('quotex_ida_balance', String(demoBalance));
  }, [demoBalance]);

  // Persist auto trade
  useEffect(() => {
    localStorage.setItem('quotex_ida_autotrade', String(autoTradeEnabled));
  }, [autoTradeEnabled]);

  // When selected asset changes, generate historical candles for it
  useEffect(() => {
    const tfMinutes = timeframe === '1M' ? 1 : timeframe === '2M' ? 2 : timeframe === '5M' ? 5 : 15;
    const newCandles = generateInitialCandles(selectedAsset, 65, tfMinutes);
    setCandles(newCandles);
  }, [selectedAsset.id, timeframe]);

  // Function to place a trade
  const handlePlaceTrade = useCallback(
    (direction: Direction, investment: number, tradeTf: Timeframe, signalId?: string) => {
      const currentAsset = selectedAssetRef.current;
      const currentPrice = currentAsset.currentPrice;
      const tfMs = getTimeframeMs(tradeTf);
      const entryTime = Date.now();
      const expiryTime = entryTime + tfMs;
      const payoutAmount = (investment * currentAsset.payout) / 100;

      // Deduct balance
      setDemoBalance((prev) => Math.max(0, prev - investment));

      const newTrade: ActiveTrade = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        signalId,
        assetId: currentAsset.id,
        pair: currentAsset.name,
        direction,
        investment,
        entryPrice: currentPrice,
        currentPrice,
        entryTimestamp: entryTime,
        expiryTimestamp: expiryTime,
        timeframe: tradeTf,
        payoutRate: currentAsset.payout,
        payoutAmount,
        status: 'ACTIVE',
        isAutoCopied: !!signalId,
      };

      setActiveTrades((prev) => [newTrade, ...prev]);
    },
    []
  );

  // Manual generation via Instant Generator
  const handleGenerateInstantSignal = (
    asset: Asset,
    tradeTf: Timeframe,
    strategy: StrategyId
  ): Signal => {
    const newSignal = generateSignalForAsset(asset, candlesRef.current, tradeTf, strategy);
    setSignals((prev) => [newSignal, ...prev]);

    // If auto trade bot is active, execute automatically
    if (autoTradeRef.current && newSignal.confidence >= 90) {
      handlePlaceTrade(newSignal.direction, 50, tradeTf, newSignal.id);
    }

    return newSignal;
  };

  // Live market tick & trade resolution loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const tfMs = getTimeframeMs(timeframe);

      // 1. Calculate seconds remaining in current candle
      const secInCurrentCandle = Math.floor((now % tfMs) / 1000);
      const totalSecInPeriod = tfMs / 1000;
      const remainingSec = Math.max(0, totalSecInPeriod - secInCurrentCandle);
      setCandleSecondsRemaining(remainingSec);

      // 2. Micro price oscillation for current asset
      const curAsset = selectedAssetRef.current;
      const volFactor =
        curAsset.volatility === 'HIGH' ? 0.0003 : curAsset.volatility === 'MEDIUM' ? 0.00015 : 0.00008;
      const tickDelta = (Math.random() - 0.495) * curAsset.currentPrice * volFactor;
      const newPrice = Number((curAsset.currentPrice + tickDelta).toFixed(curAsset.precision));

      // Update assets list with subtle ticks
      setAssets((prevAssets) =>
        prevAssets.map((a) => {
          if (a.id === curAsset.id) {
            return { ...a, currentPrice: newPrice };
          }
          const smallTick = (Math.random() - 0.5) * a.currentPrice * 0.0001;
          return {
            ...a,
            currentPrice: Number((a.currentPrice + smallTick).toFixed(a.precision)),
          };
        })
      );
      setSelectedAsset((prev) => ({ ...prev, currentPrice: newPrice }));

      // 3. Update active candles
      setCandles((prevCandles) => {
        if (prevCandles.length === 0) return prevCandles;
        const lastCandle = prevCandles[prevCandles.length - 1];
        const isPeriodEnded = now - lastCandle.timestamp >= tfMs;

        if (isPeriodEnded) {
          // Finalize candle and spawn new one
          const newCandle: Candle = {
            timestamp: Math.floor(now / tfMs) * tfMs,
            open: newPrice,
            high: newPrice,
            low: newPrice,
            close: newPrice,
            volume: Math.floor(100 + Math.random() * 200),
          };
          return [...prevCandles.slice(1), newCandle];
        } else {
          // Update forming candle
          const updated: Candle = {
            ...lastCandle,
            high: Math.max(lastCandle.high, newPrice),
            low: Math.min(lastCandle.low, newPrice),
            close: newPrice,
            volume: lastCandle.volume + Math.floor(Math.random() * 8),
          };
          return [...prevCandles.slice(0, prevCandles.length - 1), updated];
        }
      });

      // 4. Update and resolve active trades
      const currentActive = activeTradesRef.current;
      if (currentActive.length > 0) {
        const stillActive: ActiveTrade[] = [];
        const finished: ActiveTrade[] = [];

        currentActive.forEach((trade) => {
          const updatedTrade = { ...trade, currentPrice: newPrice };

          if (now >= trade.expiryTimestamp) {
            // Trade expired - determine win or loss
            const isCall = trade.direction === 'CALL';
            const isWin = isCall
              ? newPrice > trade.entryPrice
              : newPrice < trade.entryPrice;

            if (isWin) {
              const returnedAmount = trade.investment + trade.payoutAmount;
              setDemoBalance((bal) => bal + returnedAmount);
              updatedTrade.status = 'WON';
              soundManager.playWin();

              // Trigger victory confetti!
              try {
                confetti({
                  particleCount: 50,
                  spread: 60,
                  origin: { y: 0.65 },
                  colors: ['#00e676', '#10b981', '#34d399', '#ffffff'],
                });
              } catch {
                // ignore
              }
            } else {
              updatedTrade.status = 'LOST';
              soundManager.playLoss();
            }

            finished.push(updatedTrade);
          } else {
            stillActive.push(updatedTrade);
          }
        });

        if (finished.length > 0) {
          setActiveTrades(stillActive);
          setTradeHistory((prev) => [...finished, ...prev]);
        } else {
          setActiveTrades(stillActive);
        }
      }

      // 5. Resolve active signals
      setSignals((prevSignals) =>
        prevSignals.map((sig) => {
          if (sig.status === 'ACTIVE' && now >= sig.expiryTime) {
            const isCall = sig.direction === 'CALL';
            const isWin = isCall
              ? newPrice > sig.entryPrice
              : newPrice < sig.entryPrice;
            return {
              ...sig,
              status: isWin ? 'WON' : 'LOST',
              closePrice: newPrice,
            };
          }
          return sig;
        })
      );
    }, 750);

    return () => clearInterval(interval);
  }, [timeframe]);

  // Periodic Automated Signal Radar: dispatches a new high probability setup every 50-70 seconds
  useEffect(() => {
    const radarInterval = setInterval(() => {
      // Pick an asset from top list
      const randomAsset = assetsRef.current[Math.floor(Math.random() * Math.min(4, assetsRef.current.length))];
      const newSignal = generateSignalForAsset(randomAsset, candlesRef.current, '1M', 'IDA_SNIPER');

      setSignals((prev) => [newSignal, ...prev.slice(0, 24)]);
      soundManager.playSignalAlert();

      // If Auto Bot enabled, place trade
      if (autoTradeRef.current && newSignal.confidence >= 90) {
        handlePlaceTrade(newSignal.direction, 50, '1M', newSignal.id);
      }
    }, 55000);

    return () => clearInterval(radarInterval);
  }, [handlePlaceTrade]);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col justify-between selection:bg-[#00e676]/30">
      {/* 3-Zone Top Navigation Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        openRiskModal={() => setIsRiskModalOpen(true)}
        demoBalance={demoBalance}
        autoTradeEnabled={autoTradeEnabled}
        setAutoTradeEnabled={setAutoTradeEnabled}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 py-4 space-y-4">
        {/* Tab 1: Live Signals & Chart Terminal */}
        {activeTab === 'signals' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
            {/* Left 8 Columns: Live Chart & Instant Generator */}
            <div className="xl:col-span-8 flex flex-col space-y-4">
              {/* Candlestick Interactive Chart */}
              <div className="h-[460px] md:h-[520px] w-full">
                <QuotexChart
                  asset={selectedAsset}
                  assets={assets}
                  onSelectAsset={setSelectedAsset}
                  candles={candles}
                  timeframe={timeframe}
                  onChangeTimeframe={setTimeframe}
                  activeTrades={activeTrades}
                  candleSecondsRemaining={candleSecondsRemaining}
                />
              </div>

              {/* Instant Signal Generator Tool */}
              <InstantSignalGenerator
                assets={assets}
                selectedAsset={selectedAsset}
                onSelectAsset={setSelectedAsset}
                onGenerateSignal={handleGenerateInstantSignal}
              />

              {/* Live Signal Stream & Historical Feed */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    IDA Algorithmic Signals Feed
                  </h2>
                  <span className="text-xs text-slate-400 font-mono-numbers">
                    Auto-Refreshed Real-Time
                  </span>
                </div>
                <SignalList
                  signals={signals}
                  onExecuteTrade={(sig) => handlePlaceTrade(sig.direction, 50, sig.timeframe, sig.id)}
                />
              </div>
            </div>

            {/* Right 4 Columns: Quotex Trading & Execution Simulator */}
            <div className="xl:col-span-4 flex flex-col h-full min-h-[500px]">
              <TradingPanel
                asset={selectedAsset}
                activeTrades={activeTrades}
                tradeHistory={tradeHistory}
                onPlaceTrade={(dir, amt, tf) => handlePlaceTrade(dir, amt, tf)}
                demoBalance={demoBalance}
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                autoTradeEnabled={autoTradeEnabled}
                setAutoTradeEnabled={setAutoTradeEnabled}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Multi-Pair Radar Scanner */}
        {activeTab === 'scanner' && (
          <div className="space-y-4">
            <MarketScanner
              assets={assets}
              selectedAsset={selectedAsset}
              onSelectAsset={setSelectedAsset}
              onQuickGenerate={(asset) => handleGenerateInstantSignal(asset, '1M', 'IDA_SNIPER')}
              onNavigateToChart={() => setActiveTab('signals')}
            />
          </div>
        )}
      </main>

      {/* Global Market Trading Sessions & Server Status */}
      <MarketSessions />

      {/* Martingale & Compounding Risk Modal */}
      <RiskManagementModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        defaultPayout={selectedAsset.payout}
      />
    </div>
  );
}
