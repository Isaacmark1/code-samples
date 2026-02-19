/**
 * Technical Indicators Calculation Utilities
 * Functions to calculate Moving Averages, RSI, MACD, Bollinger Bands, etc.
 */

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA for first value
  let sum = 0;
  for (let i = 0; i < period && i < data.length; i++) {
    sum += data[i];
    ema.push(NaN);
  }
  
  if (data.length >= period) {
    const firstSMA = sum / period;
    ema[period - 1] = firstSMA;
    
    for (let i = period; i < data.length; i++) {
      ema.push((data[i] - ema[i - 1]) * multiplier + ema[i - 1]);
    }
  }
  
  return ema;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(data: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  let gains = 0;
  let losses = 0;
  
  // Calculate initial average gains and losses
  for (let i = 1; i <= period && i < data.length; i++) {
    const change = data[i] - data[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  rsi.push(NaN); // First value is undefined
  
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    
    if (change > 0) {
      gains = change;
      losses = 0;
    } else {
      gains = 0;
      losses = -change;
    }
    
    // Use smoothed moving average
    avgGain = (avgGain * (period - 1) + gains) / period;
    avgLoss = (avgLoss * (period - 1) + losses) / period;
    
    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  
  return rsi;
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(data: number[], period: number = 20, stdDev: number = 2): {
  upper: number[];
  middle: number[];
  lower: number[];
} {
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];
  
  const sma = calculateSMA(data, period);
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      middle.push(NaN);
      lower.push(NaN);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i];
      
      // Calculate standard deviation
      const squaredDiffs = slice.map(value => Math.pow(value - mean, 2));
      const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / period;
      const standardDeviation = Math.sqrt(avgSquaredDiff);
      
      upper.push(mean + (standardDeviation * stdDev));
      middle.push(mean);
      lower.push(mean - (standardDeviation * stdDev));
    }
  }
  
  return { upper, middle, lower };
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
  macd: number[];
  signal: number[];
  histogram: number[];
} {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  // MACD line = Fast EMA - Slow EMA
  const macd: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macd.push(NaN);
    } else {
      macd.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  // Signal line = EMA of MACD line
  const signal = calculateEMA(macd.filter(val => !isNaN(val)), signalPeriod);
  
  // Histogram = MACD - Signal
  const histogram: number[] = [];
  let signalIndex = 0;
  for (let i = 0; i < macd.length; i++) {
    if (isNaN(macd[i])) {
      histogram.push(NaN);
    } else {
      if (signalIndex < signal.length) {
        histogram.push(macd[i] - signal[signalIndex]);
        signalIndex++;
      } else {
        histogram.push(NaN);
      }
    }
  }
  
  return { macd, signal, histogram };
}

/**
 * Calculate Average True Range (ATR)
 */
export function calculateATR(data: CandleData[], period: number = 14): number[] {
  const atr: number[] = [];
  const tr: number[] = [];
  
  // Calculate True Range for each candle
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      tr.push(data[i].high - data[i].low);
    } else {
      const highLow = data[i].high - data[i].low;
      const highClose = Math.abs(data[i].high - data[i - 1].close);
      const lowClose = Math.abs(data[i].low - data[i - 1].close);
      tr.push(Math.max(highLow, highClose, lowClose));
    }
  }
  
  // Calculate ATR using exponential moving average of True Range
  return calculateEMA(tr, period);
}
