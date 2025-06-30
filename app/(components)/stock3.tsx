'use client';

import { useState, useEffect } from 'react';

interface SpreadSuggestion {
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
  technical_justification: string[];
}

interface StockData {
  symbol: string;
  indicators_symbol: string;
  indicators_timestamp: string;
  price: number;
  change: number;
  change_percent: number;
  volume: string;
  avg_volume: string;
  ema_10: number;
  ema_20: number;
  sma_50: number;
  rsi: number;
  macd: number;
  macd_signal: number;
  macd_histogram: number;
  bb_upper: number;
  bb_middle: number;
  bb_lower: number;
  stoch_k: number;
  stoch_d: number;
  williams_r: number;
  cci: number;
  market_bias: string;
  bias_strength: number;
  support_levels: number[];
  resistance_levels: number[];
  overall_recommendation: string;
  expected_moves: number;
  last_updated: string;
  is_updating: boolean;
  spread_suggestions?: SpreadSuggestion[];
}

export default function StockDisplay() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [spreads, setSpreads] = useState<SpreadSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (): Promise<void> => {
    try {
      // Fetch both stocks and spread suggestions
      const [stocksResponse, spreadsResponse] = await Promise.all([
        fetch('/api/stocks'),
        fetch('/api/spread-suggestions')
      ]);

      if (!stocksResponse.ok) throw new Error('Failed to fetch stocks');
      if (!spreadsResponse.ok) throw new Error('Failed to fetch spread suggestions');

      const stocksData: StockData[] = await stocksResponse.json();
      const spreadsData: SpreadSuggestion[] = await spreadsResponse.json();

      // Merge spread suggestions with stock data
      const stocksWithSpreads = stocksData.map(stock => ({
        ...stock,
        spread_suggestions: spreadsData.filter(spread => spread.stock_symbol === stock.symbol)
      }));

      setStocks(stocksWithSpreads);
      setSpreads(spreadsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: string): string => {
    return new Intl.NumberFormat('en-US').format(Number(value));
  };

  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '10px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#0000EE', fontSize: '24px', marginBottom: '5px' }}>Stock Market Data</h1>
      <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>Real-time stock information and trading suggestions</p>
      
      {stocks.map((stock) => (
        <div key={stock.symbol} style={{ borderBottom: '1px solid #ccc', paddingBottom: '15px', marginBottom: '15px' }}>
          
          {/* Main Stock Info */}
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#0000EE', fontSize: '18px', fontWeight: 'bold', marginRight: '10px' }}>
              {stock.symbol}
            </span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', marginRight: '10px' }}>
              {formatCurrency(stock.price)}
            </span>
            <span style={{ color: stock.change >= 0 ? 'green' : 'red', fontSize: '14px' }}>
              ({formatPercent(stock.change_percent)})
            </span>
            <span style={{ float: 'right', fontSize: '11px', color: '#666' }}>
              {new Date(stock.last_updated).toLocaleDateString()} {new Date(stock.last_updated).toLocaleTimeString()}
            </span>
          </div>

          {/* Technical Details */}
          <div style={{ fontSize: '13px', color: '#333', marginBottom: '5px' }}>
            Volume: {formatNumber(stock.volume)} | 
            Avg Volume: {formatNumber(stock.avg_volume)} | 
            RSI: {stock.rsi?.toFixed(1) || 'N/A'} | 
            Market Bias: <span style={{ color: stock.market_bias?.toLowerCase() === 'bullish' ? 'green' : stock.market_bias?.toLowerCase() === 'bearish' ? 'red' : '#666' }}>
              {stock.market_bias || 'N/A'}
            </span> ({stock.bias_strength?.toFixed(1) || 'N/A'}) | 
            Recommendation: <span style={{ fontWeight: 'bold' }}>{stock.overall_recommendation || 'N/A'}</span>
          </div>

          {/* Support/Resistance */}
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            Support Levels: {stock.support_levels?.length > 0 ? stock.support_levels.map(level => formatCurrency(level)).join(', ') : 'N/A'} | 
            Resistance Levels: {stock.resistance_levels?.length > 0 ? stock.resistance_levels.map(level => formatCurrency(level)).join(', ') : 'N/A'}
            {stock.expected_moves && (
              <span> | Expected Move: ±{formatCurrency(stock.expected_moves)}</span>
            )}
          </div>

          {/* Moving Averages */}
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            EMA 10: {formatCurrency(stock.ema_10 || 0)} | 
            EMA 20: {formatCurrency(stock.ema_20 || 0)} | 
            SMA 50: {formatCurrency(stock.sma_50 || 0)} | 
            MACD: {stock.macd?.toFixed(3) || 'N/A'} | 
            Stoch K: {stock.stoch_k?.toFixed(1) || 'N/A'} | 
            Williams %R: {stock.williams_r?.toFixed(1) || 'N/A'}
          </div>

          {/* Spread Suggestions */}
          {stock.spread_suggestions && stock.spread_suggestions.length > 0 && (
            <div style={{ backgroundColor: '#ffffcc', border: '1px solid #ccc', padding: '8px', marginTop: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>
                Options Spread Suggestions ({stock.spread_suggestions.length}):
              </div>
              {stock.spread_suggestions.map((spread) => (
                <div key={spread.id} style={{ fontSize: '12px', marginBottom: '3px' }}>
                  <strong>{spread.timeframe}</strong> - Exp: {new Date(spread.expiration_date).toLocaleDateString()} | 
                  Call {spread.call_type}: {spread.call_short_strike}/{spread.call_long_strike} | 
                  Put {spread.put_type}: {spread.put_short_strike}/{spread.put_long_strike} | 
                  Max Profit: <span style={{ color: 'green' }}>{spread.call_max_profit}</span> | 
                  Max Loss: <span style={{ color: 'red' }}>{spread.call_max_loss}</span>
                  {spread.technical_justification && spread.technical_justification.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                      Justification: {spread.technical_justification.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      ))}
      
      <div style={{ fontSize: '11px', color: '#666', borderTop: '1px solid #ccc', paddingTop: '5px' }}>
        Total listings: {stocks.length} | Page refreshed: {new Date().toLocaleString()}
      </div>
    </div>
  );
}