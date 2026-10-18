export type AssetCategory = 'OTC' | 'CURRENCY' | 'CRYPTO' | 'COMMODITY';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  payout: number; // e.g. 91 for 91%
  currentPrice: number;
  change24h: number;
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  precision: number;
  isOTC: boolean;
  marketOpen: boolean;
}

export interface Candle {
  timestamp: number; // millisecond timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = '1M' | '2M' | '5M' | '15M';
export type Direction = 'CALL' | 'PUT';
export type SignalStatus = 'UPCOMING' | 'ACTIVE' | 'WON' | 'LOST';

export interface TechnicalBreakdown {
  rsi: number;
  rsiState: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL';
  macdSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  emaCross: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  stochasticK: number;
  stochasticD: number;
  bollingerState: 'UPPER_TOUCH' | 'LOWER_TOUCH' | 'INSIDE' | 'EXPANDING';
  candlePattern?: string;
  trendScore: number; // 0 - 100
}

export interface Signal {
  id: string;
  pair: string;
  assetId: string;
  isOTC: boolean;
  timeframe: Timeframe;
  direction: Direction;
  confidence: number; // e.g. 93.8
  entryTime: number; // timestamp when trade starts
  expiryTime: number; // timestamp when trade expires
  entryPrice: number;
  strategyName: string;
  martingaleStep: number; // 0 = main, 1 = MTG 1, 2 = MTG 2
  status: SignalStatus;
  indicators: TechnicalBreakdown;
  resultProfit?: number;
  closePrice?: number;
}

export interface ActiveTrade {
  id: string;
  signalId?: string;
  assetId: string;
  pair: string;
  direction: Direction;
  investment: number;
  entryPrice: number;
  currentPrice: number;
  entryTimestamp: number;
  expiryTimestamp: number;
  timeframe: Timeframe;
  payoutRate: number; // e.g. 90%
  payoutAmount: number;
  status: 'ACTIVE' | 'WON' | 'LOST';
  isAutoCopied?: boolean;
}

export interface AccountStats {
  balance: number;
  type: 'DEMO' | 'LIVE_TRACKER';
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfit: number;
  currentStreak: number;
  bestStreak: number;
}
