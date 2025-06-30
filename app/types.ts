export interface TechnicalJustification {
  [key: string]: string;
}

export interface SpreadSuggestion {
  id: number;
  stock_symbol: string;
  timeframe: string;
  expiration_date: string;
  expected_move: number;
  call_type: string;
  call_short_strike: number;
  call_long_strike: number;
  call_width: number;
  call_max_profit: string;
  call_max_loss: string;
  call_breakeven: string;
  put_type: string;
  put_short_strike: number;
  put_long_strike: number;
  put_width: number;
  put_max_profit: string;
  put_max_loss: string;
  put_breakeven: string;
  technical_justification: TechnicalJustification;
}