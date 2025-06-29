export interface CurrentPrice {
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  avg_volume: number;
}

export interface TechnicalIndicators {
  EMA_10: number;
  EMA_20: number;
  SMA_50: number;
  RSI: number;
  MACD: number;
  MACD_Signal: number;
  MACD_Histogram: number;
  BB_Upper: number;
  BB_Middle: number;
  BB_Lower: number;
  Stoch_K: number;
  Stoch_D: number;
  Williams_R: number;
  CCI: number;
}

export interface Indicators {
  symbol: string;
  timestamp: string;
  current_price: CurrentPrice;
  indicators: TechnicalIndicators;
}

export interface SpreadOption {
  type: string;
  short_strike: number;
  long_strike: number;
  width: number;
  max_profit: string;
  max_loss: string;
  breakeven: string;
}

export interface SpreadSuggestion {
  timeframe: string;
  expiration_date: string;
  expected_move: number;
  call_spread: SpreadOption;
  put_spread: SpreadOption;
  technical_justification: string[];
}

export interface Spreads {
  market_bias: string;
  bias_strength: number;
  support_levels: number[];
  resistance_levels: number[];
  spread_suggestions: SpreadSuggestion[];
  overall_recommendation: string;
  expected_moves: number;
}

export interface StockData {
  symbol: string;
  indicators: Indicators;
  spreads: Spreads;
  last_updated: string;
  is_updating: boolean;
}

export interface ApiResponse {
  success: boolean;
  data: StockData;
  message: string | null;
  timestamp: string;
}