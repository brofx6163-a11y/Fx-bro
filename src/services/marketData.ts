import { Asset, Candle, Timeframe } from '../types/trading';

export const INITIAL_ASSETS: Asset[] = [
  {
    id: 'EUR_USD_OTC',
    name: 'EUR/USD (OTC)',
    category: 'OTC',
    payout: 93,
    currentPrice: 1.08642,
    change24h: 0.42,
    volatility: 'HIGH',
    precision: 5,
    isOTC: true,
    marketOpen: true
  },
  {
    id: 'GBP_USD_OTC',
    name: 'GBP/USD (OTC)',
    category: 'OTC',
    payout: 91,
    currentPrice: 1.29415,
    change24h: -0.28,
    volatility: 'HIGH',
    precision: 5,
    isOTC: true,
    marketOpen: true
  },
  {
    id: 'USD_JPY_OTC',
    name: 'USD/JPY (OTC)',
    category: 'OTC',
    payout: 90,
    currentPrice: 154.320,
    change24h: 0.65,
    volatility: 'MEDIUM',
    precision: 3,
    isOTC: true,
    marketOpen: true
  },
  {
    id: 'USD_BRL_OTC',
    name: 'USD/BRL (OTC)',
    category: 'OTC',
    payout: 92,
    currentPrice: 5.6840,
    change24h: 0.18,
    volatility: 'HIGH',
    precision: 4,
    isOTC: true,
    marketOpen: true
  },
  {
    id: 'USD_INR_OTC',
    name: 'USD/INR (OTC)',
    category: 'OTC',
    payout: 89,
    currentPrice: 87.240,
    change24h: 0.05,
    volatility: 'LOW',
    precision: 3,
    isOTC: true,
    marketOpen: true
  },
  {
    id: 'AUD_CAD_OTC',
    name: 'AUD/CAD (OTC)',
    category: 'OTC',
    payout: 88,
    currentPrice: 0.89735,
    change24h: -0.34,
    volatility: 'MEDIUM',
    precision: 5,
    isOTC: true,
    marketOpen: true
  },
  {
    id: 'BTC_USDT',
    name: 'BTC/USDT',
    category: 'CRYPTO',
    payout: 86,
    currentPrice: 88450.00,
    change24h: 2.14,
    volatility: 'HIGH',
    precision: 2,
    isOTC: false,
    marketOpen: true
  },
  {
    id: 'ETH_USDT',
    name: 'ETH/USDT',
    category: 'CRYPTO',
    payout: 85,
    currentPrice: 3240.50,
    change24h: 1.82,
    volatility: 'HIGH',
    precision: 2,
    isOTC: false,
    marketOpen: true
  },
  {
    id: 'XAU_USD_OTC',
    name: 'Gold (OTC)',
    category: 'COMMODITY',
    payout: 90,
    currentPrice: 2685.40,
    change24h: 0.54,
    volatility: 'MEDIUM',
    precision: 2,
    isOTC: true,
    marketOpen: true
  }
];

// Helper to generate realistic historical candles
export function generateInitialCandles(asset: Asset, count: number = 70, timeframeMinutes: number = 1): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const periodMs = timeframeMinutes * 60 * 1000;

  // Start back in time aligned to timeframe
  let currentTimestamp = Math.floor(now / periodMs) * periodMs - count * periodMs;
  let price = asset.currentPrice;

  // Base volatility step
  const step = price * (asset.volatility === 'HIGH' ? 0.0006 : asset.volatility === 'MEDIUM' ? 0.0003 : 0.00015);

  let trend = (Math.random() - 0.48) * step * 0.4; // slight macro trend

  for (let i = 0; i < count; i++) {
    // Reverse or shift trend periodically
    if (i % 12 === 0) {
      trend = (Math.random() - 0.5) * step * 0.6;
    }

    const open = price;
    const delta = (Math.random() - 0.49) * step * 2 + trend;
    const close = Number((open + delta).toFixed(asset.precision));

    const wickUp = Math.random() * step * 1.5;
    const wickDown = Math.random() * step * 1.5;

    const high = Number((Math.max(open, close) + wickUp).toFixed(asset.precision));
    const low = Number((Math.min(open, close) - wickDown).toFixed(asset.precision));
    const volume = Math.floor(100 + Math.random() * 800);

    candles.push({
      timestamp: currentTimestamp,
      open,
      high,
      low,
      close,
      volume
    });

    price = close;
    currentTimestamp += periodMs;
  }

  return candles;
}

// Convert timeframe string to milliseconds
export function getTimeframeMs(tf: Timeframe): number {
  switch (tf) {
    case '1M': return 60 * 1000;
    case '2M': return 2 * 60 * 1000;
    case '5M': return 5 * 60 * 1000;
    case '15M': return 15 * 60 * 1000;
    default: return 60 * 1000;
  }
}
