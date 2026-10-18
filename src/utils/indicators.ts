import { Candle, TechnicalBreakdown } from '../types/trading';

// Calculate Simple Moving Average
export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(data[i]);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

// Calculate Exponential Moving Average
export function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  if (data.length === 0) return [];
  ema.push(data[0]);

  for (let i = 1; i < data.length; i++) {
    const val = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
    ema.push(val);
  }
  return ema;
}

// Calculate Bollinger Bands
export interface BollingerBandsResult {
  middle: number[];
  upper: number[];
  lower: number[];
}

export function calculateBollingerBands(data: number[], period: number = 20, multiplier: number = 2): BollingerBandsResult {
  const middle = calculateSMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(data[i]);
      lower.push(data[i]);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = middle[i];
      const variance = slice.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      upper.push(mean + multiplier * stdDev);
      lower.push(mean - multiplier * stdDev);
    }
  }

  return { middle, upper, lower };
}

// Calculate RSI (Relative Strength Index)
export function calculateRSI(closes: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  if (closes.length <= period) {
    return closes.map(() => 50);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Initial RSI
  for (let i = 0; i < period; i++) {
    rsi.push(50);
  }

  const initialRS = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(100 - (100 / (1 + initialRS)));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }

  return rsi;
}

// Calculate Stochastic Oscillator (%K and %D)
export function calculateStochastic(candles: Candle[], period: number = 14, smoothK: number = 3): { k: number[]; d: number[] } {
  const kArr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      kArr.push(50);
    } else {
      const slice = candles.slice(i - period + 1, i + 1);
      const lowestLow = Math.min(...slice.map(c => c.low));
      const highestHigh = Math.max(...slice.map(c => c.high));
      const currentClose = candles[i].close;

      const range = highestHigh - lowestLow;
      const k = range === 0 ? 50 : ((currentClose - lowestLow) / range) * 100;
      kArr.push(Math.max(0, Math.min(100, k)));
    }
  }

  const dArr = calculateSMA(kArr, smoothK);
  return { k: kArr, d: dArr };
}

// Candlestick pattern detector
export function detectCandlePattern(candles: Candle[]): string | undefined {
  if (candles.length < 3) return undefined;
  const current = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  const bodyCurrent = Math.abs(current.close - current.open);
  const bodyPrev = Math.abs(prev.close - prev.open);
  const rangeCurrent = current.high - current.low;

  const isCurrentGreen = current.close > current.open;
  const isPrevRed = prev.close < prev.open;
  const isPrevGreen = prev.close > prev.open;

  // Bullish Engulfing
  if (isPrevRed && isCurrentGreen && current.open <= prev.close && current.close >= prev.open && bodyCurrent > bodyPrev * 1.2) {
    return 'Bullish Engulfing';
  }

  // Bearish Engulfing
  if (isPrevGreen && !isCurrentGreen && current.open >= prev.close && current.close <= prev.open && bodyCurrent > bodyPrev * 1.2) {
    return 'Bearish Engulfing';
  }

  // Hammer / Pin Bar (Long lower shadow >= 2x body)
  const lowerShadow = Math.min(current.open, current.close) - current.low;
  const upperShadow = current.high - Math.max(current.open, current.close);

  if (rangeCurrent > 0 && lowerShadow >= bodyCurrent * 2 && upperShadow < bodyCurrent * 0.8) {
    return 'Bullish Hammer / Pin Bar';
  }

  // Shooting Star (Long upper shadow >= 2x body)
  if (rangeCurrent > 0 && upperShadow >= bodyCurrent * 2 && lowerShadow < bodyCurrent * 0.8) {
    return 'Shooting Star';
  }

  // Doji
  if (bodyCurrent < rangeCurrent * 0.1 && rangeCurrent > 0) {
    return 'Indecision Doji';
  }

  return undefined;
}

// Comprehensive technical breakdown for the current candles
export function analyzeTechnicalState(candles: Candle[]): TechnicalBreakdown {
  if (candles.length < 25) {
    return {
      rsi: 50,
      rsiState: 'NEUTRAL',
      macdSignal: 'NEUTRAL',
      emaCross: 'NEUTRAL',
      stochasticK: 50,
      stochasticD: 50,
      bollingerState: 'INSIDE',
      trendScore: 50
    };
  }

  const closes = candles.map(c => c.close);
  const currentPrice = closes[closes.length - 1];

  // RSI
  const rsiValues = calculateRSI(closes, 14);
  const currentRSI = rsiValues[rsiValues.length - 1];
  const rsiState = currentRSI < 32 ? 'OVERSOLD' : currentRSI > 68 ? 'OVERBOUGHT' : 'NEUTRAL';

  // EMAs (9 and 21)
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const currEma9 = ema9[ema9.length - 1];
  const currEma21 = ema21[ema21.length - 1];
  const prevEma9 = ema9[ema9.length - 2];
  const prevEma21 = ema21[ema21.length - 2];

  let emaCross: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (currEma9 > currEma21 && prevEma9 <= prevEma21) {
    emaCross = 'BULLISH';
  } else if (currEma9 < currEma21 && prevEma9 >= prevEma21) {
    emaCross = 'BEARISH';
  } else if (currEma9 > currEma21) {
    emaCross = 'BULLISH';
  } else {
    emaCross = 'BEARISH';
  }

  // Bollinger Bands
  const bb = calculateBollingerBands(closes, 20, 2);
  const upperBB = bb.upper[bb.upper.length - 1];
  const lowerBB = bb.lower[bb.lower.length - 1];

  let bollingerState: 'UPPER_TOUCH' | 'LOWER_TOUCH' | 'INSIDE' | 'EXPANDING' = 'INSIDE';
  if (currentPrice >= upperBB * 0.9995) {
    bollingerState = 'UPPER_TOUCH';
  } else if (currentPrice <= lowerBB * 1.0005) {
    bollingerState = 'LOWER_TOUCH';
  }

  // Stochastic
  const stoch = calculateStochastic(candles, 14, 3);
  const currK = stoch.k[stoch.k.length - 1];
  const currD = stoch.d[stoch.d.length - 1];

  // MACD proxy (EMA 12 - EMA 26)
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdVal = ema12[ema12.length - 1] - ema26[ema26.length - 1];
  const macdSignal = macdVal > 0 ? 'BULLISH' : 'BEARISH';

  // Pattern
  const candlePattern = detectCandlePattern(candles);

  // Composite trend score (0 - 100, >50 bullish, <50 bearish)
  let score = 50;
  if (emaCross === 'BULLISH') score += 15;
  if (emaCross === 'BEARISH') score -= 15;
  if (macdSignal === 'BULLISH') score += 12;
  if (macdSignal === 'BEARISH') score -= 12;

  if (currentRSI > 50) score += (currentRSI - 50) * 0.4;
  else score -= (50 - currentRSI) * 0.4;

  if (currK > currD) score += 8;
  else score -= 8;

  score = Math.max(10, Math.min(95, Math.round(score)));

  return {
    rsi: Number(currentRSI.toFixed(1)),
    rsiState,
    macdSignal,
    emaCross,
    stochasticK: Number(currK.toFixed(1)),
    stochasticD: Number(currD.toFixed(1)),
    bollingerState,
    candlePattern,
    trendScore: score
  };
}
