import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Asset, Candle, Timeframe, ActiveTrade } from '../../types/trading';
import { calculateEMA, calculateBollingerBands } from '../../utils/indicators';
import { ChevronDown, Maximize2, Activity } from 'lucide-react';

interface QuotexChartProps {
  asset: Asset;
  assets: Asset[];
  onSelectAsset: (asset: Asset) => void;
  candles: Candle[];
  timeframe: Timeframe;
  onChangeTimeframe: (tf: Timeframe) => void;
  activeTrades: ActiveTrade[];
  candleSecondsRemaining: number;
}

export const QuotexChart: React.FC<QuotexChartProps> = ({
  asset,
  assets,
  onSelectAsset,
  candles,
  timeframe,
  onChangeTimeframe,
  activeTrades,
  candleSecondsRemaining,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [showIndicators, setShowIndicators] = useState({
    ema: true,
    bollinger: true,
  });
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; price: number; time: number } | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showAssetDropdown && !(e.target as HTMLElement).closest('#asset-selector-wrap')) {
        setShowAssetDropdown(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showAssetDropdown]);

  // Compute indicator values
  const closes = useMemo(() => candles.map(c => c.close), [candles]);
  const ema9 = useMemo(() => calculateEMA(closes, 9), [closes]);
  const ema21 = useMemo(() => calculateEMA(closes, 21), [closes]);
  const bb = useMemo(() => calculateBollingerBands(closes, 20, 2), [closes]);

  // Render chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;

    // Layout configuration
    const paddingRight = 75; // Space for price scale
    const paddingBottom = 26; // Space for time axis
    const chartWidth = width - paddingRight;
    const chartHeight = height - paddingBottom;

    // View slice: display the last 45-55 visible candles
    const visibleCount = Math.min(candles.length, Math.floor(chartWidth / 14));
    const startIndex = candles.length - visibleCount;
    const visibleCandles = candles.slice(startIndex);

    if (visibleCandles.length === 0) return;

    // Find min and max price
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    for (let i = startIndex; i < candles.length; i++) {
      const c = candles[i];
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;

      // Include BB in bounds if enabled
      if (showIndicators.bollinger) {
        if (bb.lower[i] && bb.lower[i] < minPrice) minPrice = bb.lower[i];
        if (bb.upper[i] && bb.upper[i] > maxPrice) maxPrice = bb.upper[i];
      }
    }

    // Add 10% breathing room to price scale
    const priceRange = maxPrice - minPrice || 0.001;
    minPrice -= priceRange * 0.08;
    maxPrice += priceRange * 0.08;
    const totalRange = maxPrice - minPrice;

    const getY = (val: number) => {
      return chartHeight - ((val - minPrice) / totalRange) * chartHeight;
    };

    const candleWidth = chartWidth / visibleCount;

    // Background
    ctx.fillStyle = '#0e131d';
    ctx.fillRect(0, 0, width, height);

    // Grid lines (horizontal price levels)
    ctx.strokeStyle = '#18202d';
    ctx.lineWidth = 1;

    const gridLines = 6;
    for (let i = 0; i <= gridLines; i++) {
      const y = (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Price label on right axis
      const priceAtY = maxPrice - (i / gridLines) * totalRange;
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(priceAtY.toFixed(asset.precision), chartWidth + 8, y + 3);
    }

    // Vertical time grid lines
    const timeStep = Math.max(1, Math.floor(visibleCount / 6));
    for (let i = 0; i < visibleCount; i += timeStep) {
      const x = i * candleWidth + candleWidth / 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, chartHeight);
      ctx.stroke();

      const c = visibleCandles[i];
      const timeStr = new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(timeStr, x, height - 8);
    }

    // Draw Bollinger Bands (Area + Lines)
    if (showIndicators.bollinger) {
      // Lower & Upper curve
      ctx.beginPath();
      for (let i = 0; i < visibleCount; i++) {
        const rawIdx = startIndex + i;
        const x = i * candleWidth + candleWidth / 2;
        const yUpper = getY(bb.upper[rawIdx]);
        if (i === 0) ctx.moveTo(x, yUpper);
        else ctx.lineTo(x, yUpper);
      }
      for (let i = visibleCount - 1; i >= 0; i--) {
        const rawIdx = startIndex + i;
        const x = i * candleWidth + candleWidth / 2;
        const yLower = getY(bb.lower[rawIdx]);
        ctx.lineTo(x, yLower);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.04)';
      ctx.fill();

      // Upper band line
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < visibleCount; i++) {
        const rawIdx = startIndex + i;
        const x = i * candleWidth + candleWidth / 2;
        const yUpper = getY(bb.upper[rawIdx]);
        if (i === 0) ctx.moveTo(x, yUpper);
        else ctx.lineTo(x, yUpper);
      }
      ctx.stroke();

      // Lower band line
      ctx.beginPath();
      for (let i = 0; i < visibleCount; i++) {
        const rawIdx = startIndex + i;
        const x = i * candleWidth + candleWidth / 2;
        const yLower = getY(bb.lower[rawIdx]);
        if (i === 0) ctx.moveTo(x, yLower);
        else ctx.lineTo(x, yLower);
      }
      ctx.stroke();
    }

    // Draw EMA 9 & EMA 21
    if (showIndicators.ema) {
      // EMA 9 (Cyan)
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < visibleCount; i++) {
        const rawIdx = startIndex + i;
        const x = i * candleWidth + candleWidth / 2;
        const y = getY(ema9[rawIdx]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // EMA 21 (Amber)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < visibleCount; i++) {
        const rawIdx = startIndex + i;
        const x = i * candleWidth + candleWidth / 2;
        const y = getY(ema21[rawIdx]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw Candlesticks
    for (let i = 0; i < visibleCount; i++) {
      const c = visibleCandles[i];
      const x = i * candleWidth;
      const centerX = x + candleWidth / 2;
      const isGreen = c.close >= c.open;
      const color = isGreen ? '#00e676' : '#ff3366';

      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const yHigh = getY(c.high);
      const yLow = getY(c.low);

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(centerX, yHigh);
      ctx.lineTo(centerX, yLow);
      ctx.stroke();

      // Candle body
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
      const bodyWidth = Math.max(3, candleWidth * 0.72);

      ctx.fillStyle = color;
      ctx.fillRect(centerX - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
    }

    // Current Price Line & Right Badge
    const latestCandle = visibleCandles[visibleCandles.length - 1];
    const currentPrice = latestCandle.close;
    const currentY = getY(currentPrice);
    const isLatestGreen = latestCandle.close >= latestCandle.open;
    const accentColor = isLatestGreen ? '#00e676' : '#ff3366';

    // Horizontal dashed price line
    ctx.save();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(0, currentY);
    ctx.lineTo(chartWidth, currentY);
    ctx.stroke();
    ctx.restore();

    // Pulse dot on current candle
    const lastX = (visibleCount - 1) * candleWidth + candleWidth / 2;
    ctx.beginPath();
    ctx.arc(lastX, currentY, 3, 0, Math.PI * 2);
    ctx.fillStyle = accentColor;
    ctx.fill();

    // Price badge on the right margin
    const badgeHeight = 18;
    const badgeWidth = paddingRight - 8;
    ctx.fillStyle = accentColor;
    ctx.fillRect(chartWidth + 4, currentY - badgeHeight / 2, badgeWidth, badgeHeight);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(currentPrice.toFixed(asset.precision), chartWidth + 4 + badgeWidth / 2, currentY + 3.5);

    // Active trade lines on chart
    activeTrades.forEach((trade) => {
      if (trade.assetId === asset.id) {
        const tradeY = getY(trade.entryPrice);
        const isTradeCall = trade.direction === 'CALL';
        const tradeColor = isTradeCall ? '#00e676' : '#ff3366';

        ctx.save();
        ctx.strokeStyle = tradeColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(0, tradeY);
        ctx.lineTo(chartWidth, tradeY);
        ctx.stroke();

        // Tag label
        ctx.fillStyle = tradeColor;
        ctx.fillRect(10, tradeY - 10, 80, 20);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${trade.direction} $${trade.investment}`, 50, tradeY + 3.5);
        ctx.restore();
      }
    });

    // Crosshair rendering
    if (crosshair) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical
      ctx.beginPath();
      ctx.moveTo(crosshair.x, 0);
      ctx.lineTo(crosshair.x, chartHeight);
      ctx.stroke();

      // Horizontal
      ctx.beginPath();
      ctx.moveTo(0, crosshair.y);
      ctx.lineTo(chartWidth, crosshair.y);
      ctx.stroke();

      // Price pill on right
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(chartWidth + 4, crosshair.y - 9, badgeWidth, 18);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(chartWidth + 4, crosshair.y - 9, badgeWidth, 18);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(crosshair.price.toFixed(asset.precision), chartWidth + 4 + badgeWidth / 2, crosshair.y + 3);

      ctx.restore();
    }
  }, [candles, asset, showIndicators, timeframe, activeTrades, crosshair, bb, ema9, ema21]);

  // Handle canvas mouse move for crosshair
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const chartWidth = rect.width - 75;
    const chartHeight = rect.height - 26;

    if (x < 0 || x > chartWidth || y < 0 || y > chartHeight) {
      setCrosshair(null);
      return;
    }

    // Calculate price at Y
    const visibleCount = Math.min(candles.length, Math.floor(chartWidth / 14));
    const startIndex = candles.length - visibleCount;

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (let i = startIndex; i < candles.length; i++) {
      if (candles[i].low < minPrice) minPrice = candles[i].low;
      if (candles[i].high > maxPrice) maxPrice = candles[i].high;
    }
    const priceRange = maxPrice - minPrice || 0.001;
    minPrice -= priceRange * 0.08;
    maxPrice += priceRange * 0.08;

    const price = maxPrice - (y / chartHeight) * (maxPrice - minPrice);
    setCrosshair({ x, y, price, time: Date.now() });
  };

  const handleMouseLeave = () => {
    setCrosshair(null);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-[#0e131d] border border-[#1f2737] rounded-lg overflow-hidden relative">
      {/* Chart Top Control Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#121824] border-b border-[#1f2737] z-10">
        <div className="flex items-center gap-3">
          {/* Asset Selector */}
          <div className="relative" id="asset-selector-wrap">
            <button
              onClick={() => setShowAssetDropdown(!showAssetDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#171f2e] hover:bg-[#1f2a3e] border border-[#263246] rounded-md text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <span>{asset.name}</span>
              <span className="font-mono-numbers text-[11px] text-[#00e676] font-bold">+{asset.payout}%</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Asset Dropdown List */}
            {showAssetDropdown && (
              <div className="absolute top-full left-0 mt-1.5 w-60 bg-[#151b26] border border-[#28354c] rounded-md shadow-2xl py-1.5 z-50 max-h-72 overflow-y-auto">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quotex Active Assets
                </div>
                {assets.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectAsset(item);
                      setShowAssetDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#1e2738] transition-colors cursor-pointer ${
                      item.id === asset.id ? 'bg-[#1b2333] text-[#00e676]' : 'text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono-numbers font-bold text-[#00e676]">+{item.payout}%</div>
                      <div className="font-mono-numbers text-[10px] text-slate-400">{item.currentPrice.toFixed(item.precision)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center bg-[#171f2e] border border-[#263246] rounded-md p-0.5 text-xs">
            {(['1M', '2M', '5M', '15M'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => onChangeTimeframe(tf)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono-numbers font-medium transition-colors cursor-pointer ${
                  timeframe === tf ? 'bg-[#00e676] text-black font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Indicator toggles */}
          <div className="hidden lg:flex items-center gap-1.5 ml-2 text-xs">
            <button
              onClick={() => setShowIndicators(p => ({ ...p, ema: !p.ema }))}
              className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer transition-colors ${
                showIndicators.ema
                  ? 'bg-[#1c2936] text-cyan-300 border-cyan-800'
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              EMA 9/21
            </button>
            <button
              onClick={() => setShowIndicators(p => ({ ...p, bollinger: !p.bollinger }))}
              className={`px-2 py-1 rounded text-[11px] font-medium border cursor-pointer transition-colors ${
                showIndicators.bollinger
                  ? 'bg-[#1b2339] text-blue-300 border-blue-800'
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              Bollinger Bands
            </button>
          </div>
        </div>

        {/* Right side: Countdown to Next Candle & Fullscreen */}
        <div className="flex items-center gap-3">
          {/* Candle countdown timer */}
          <div className="flex items-center gap-1.5 bg-[#171f2e] border border-[#263246] rounded px-2.5 py-1 text-xs">
            <Activity className="w-3.5 h-3.5 text-[#00e676]" />
            <span className="text-slate-400 text-[11px]">Next Candle:</span>
            <span className="font-mono-numbers font-bold text-white tracking-wider">
              00:{candleSecondsRemaining < 10 ? `0${candleSecondsRemaining}` : candleSecondsRemaining}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            aria-label="Toggle Fullscreen"
            className="p-1.5 text-slate-400 hover:text-white bg-[#171f2e] border border-[#263246] rounded hover:bg-[#202b3d] transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Chart Canvas */}
      <div className="flex-1 w-full h-full relative cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
};
