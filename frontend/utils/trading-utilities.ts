/**
 * Trading utility functions for asset type detection and calculations
 */

export type AssetType = 'forex' | 'crypto' | 'stock';

/**
 * Detects the asset type from a trading symbol
 * - Forex pairs: 6-letter currency pairs (e.g., EURUSD, USDJPY)
 * - Crypto pairs: contain hyphen (e.g., BTC-USD, ETH-USD)
 * - Everything else: stocks/ETFs/commodities
 */
export function getAssetType(symbol: string): AssetType {
  const normalized = symbol.trim().toUpperCase();
  
  // Common currency codes for forex detection
  const currencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'NZD',
    'SEK', 'NOK', 'DKK', 'PLN', 'HUF', 'CZK', 'RUB', 'TRY', 'ZAR',
    'SGD', 'HKD', 'KRW', 'INR', 'MXN', 'BRL', 'ARS', 'CLP'
  ];
  
  // Precious metals symbols (treated as forex)
  const metals = ['XAU', 'XAG', 'XPT', 'XPD']; // Gold, Silver, Platinum, Palladium
  
  // Check for forex pairs (6-letter currency pairs)
  if (normalized.length === 6 && /^[A-Z]{6}$/.test(normalized)) {
    const base = normalized.substring(0, 3);
    const quote = normalized.substring(3, 6);
    
    // Validate both are valid currencies or precious metals
    if ((currencies.includes(base) && currencies.includes(quote)) ||
        (metals.includes(base) && currencies.includes(quote)) ||
        (currencies.includes(base) && metals.includes(quote))) {
      return 'forex';
    }
  }
  
  // Check for crypto pairs (contain hyphen)
  if (normalized.includes('-')) {
    return 'crypto';
  }
  
  // Default to stock for everything else
  return 'stock';
}

/**
 * Calculate position size based on risk percentage
 */
export function calculatePositionSize(
  accountBalance: number,
  riskPercentage: number,
  entryPrice: number,
  stopLoss: number
): number {
  if (entryPrice <= 0 || stopLoss <= 0) {
    throw new Error('Entry price and stop loss must be positive');
  }
  
  if (riskPercentage <= 0 || riskPercentage > 100) {
    throw new Error('Risk percentage must be between 0 and 100');
  }
  
  const riskAmount = accountBalance * (riskPercentage / 100);
  const riskPerShare = Math.abs(entryPrice - stopLoss);
  
  return Math.floor(riskAmount / riskPerShare);
}

/**
 * Calculate profit/loss percentage
 */
export function calculateProfitLossPercentage(
  entryPrice: number,
  exitPrice: number,
  tradeType: 'LONG' | 'SHORT'
): number {
  if (entryPrice <= 0 || exitPrice <= 0) {
    throw new Error('Prices must be positive');
  }
  
  const profitLoss = exitPrice - entryPrice;
  const profitLossPercentage = (profitLoss / entryPrice) * 100;
  
  // For short positions, the calculation is inverted
  if (tradeType === 'SHORT') {
    return -profitLossPercentage;
  }
  
  return profitLossPercentage;
}

/**
 * Calculate risk/reward ratio
 */
export function calculateRiskRewardRatio(
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): number {
  if (entryPrice <= 0 || stopLoss <= 0 || takeProfit <= 0) {
    throw new Error('All prices must be positive');
  }
  
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);
  
  if (risk === 0) {
    throw new Error('Risk cannot be zero');
  }
  
  return reward / risk;
}

/**
 * Format currency display
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  decimals: number = 2
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Calculate compound annual growth rate
 */
export function calculateCompoundGrowthRate(
  initialValue: number,
  finalValue: number,
  years: number
): number {
  if (initialValue <= 0 || finalValue <= 0 || years <= 0) {
    throw new Error('All values must be positive');
  }
  
  return Math.pow(finalValue / initialValue, 1 / years) - 1;
}

/**
 * Validate trading symbol format
 */
export function validateSymbol(symbol: string): boolean {
  const normalized = symbol.trim().toUpperCase();
  
  // Check for empty string
  if (normalized.length === 0) {
    return false;
  }
  
  // Allow letters, numbers, hyphens, and underscores
  const validPattern = /^[A-Z0-9_\-]+$/;
  
  return validPattern.test(normalized);
}

/**
 * Calculate moving average convergence/divergence signals
 */
export interface MACDSignal {
  type: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100
  description: string;
}

export function analyzeMACDSignal(
  macdLine: number[],
  signalLine: number[],
  histogram: number[]
): MACDSignal {
  if (macdLine.length < 3 || signalLine.length < 3) {
    return {
      type: 'neutral',
      strength: 0,
      description: 'Insufficient data'
    };
  }
  
  const currentMACD = macdLine[macdLine.length - 1];
  const currentSignal = signalLine[signalLine.length - 1];
  const currentHistogram = histogram[histogram.length - 1];
  
  const previousMACD = macdLine[macdLine.length - 2];
  const previousSignal = signalLine[signalLine.length - 2];
  
  // Bullish crossover: MACD crosses above signal line
  if (previousMACD <= previousSignal && currentMACD > currentSignal) {
    return {
      type: 'bullish',
      strength: Math.min(Math.abs(currentHistogram) * 10, 100),
      description: 'MACD bullish crossover'
    };
  }
  
  // Bearish crossover: MACD crosses below signal line
  if (previousMACD >= previousSignal && currentMACD < currentSignal) {
    return {
      type: 'bearish',
      strength: Math.min(Math.abs(currentHistogram) * 10, 100),
      description: 'MACD bearish crossover'
    };
  }
  
  // No clear signal
  return {
    type: 'neutral',
    strength: 0,
    description: 'No clear MACD signal'
  };
}
