'use client';

import { useEffect, useState } from 'react';

interface SpreadSuggestion {
  id: number;
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
  price: number;
  rsi: number;
  market_bias: string;
  bias_strength: number;
  overall_recommendation: string;
  spread_suggestions: SpreadSuggestion[];
  last_updated: string;
}

interface QubtComponentProps {
  symbol?: string;
  apiEndpoint?: string;
}

export default function QubtComponent({ 
  symbol = 'QUBT', 
  apiEndpoint = '/api/stocks/qubt' 
}: QubtComponentProps) {
  const [stock, setStock] = useState<StockData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(apiEndpoint)
      .then((res) => res.json())
      .then((data) => setStock(data))
      .catch(() => setError(`Failed to fetch ${symbol} data.`));
  }, [apiEndpoint, symbol]);

  if (error) return <p>{error}</p>;
  if (!stock) return <p>Loading {symbol}...</p>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', fontFamily: 'Arial' }}>
      <h2>{stock.symbol}</h2>
      <p>Price: ${stock.price.toFixed(2)}</p>
      <p>RSI: {stock.rsi.toFixed(1)}</p>
      <p>
        Market Bias: <strong>{stock.market_bias}</strong> ({stock.bias_strength.toFixed(1)})
      </p>
      <p>Recommendation: {stock.overall_recommendation}</p>
      <p>Last Updated: {new Date(stock.last_updated).toLocaleString()}</p>

      {stock.spread_suggestions.length > 0 && (
        <div style={{ backgroundColor: '#f0f0f0', padding: 10, marginTop: 20 }}>
          <h4>Spread Suggestions</h4>
          {stock.spread_suggestions.map((spread) => (
            <div key={spread.id} style={{ marginBottom: 10 }}>
              <p>
                {spread.timeframe} Exp: {new Date(spread.expiration_date).toLocaleDateString()} –{' '}
                <strong>Call</strong> {spread.call_type}: {spread.call_short_strike} / {spread.call_long_strike}, <strong>Put</strong> {spread.put_type}:{' '}
                {spread.put_short_strike} / {spread.put_long_strike}
              </p>
              <p>
                Max Profit: <span style={{ color: 'green' }}>{spread.call_max_profit}</span>, Max Loss:{' '}
                <span style={{ color: 'red' }}>{spread.call_max_loss}</span>
              </p>
              {spread.technical_justification.length > 0 && (
                <small>Justification: {spread.technical_justification.join(', ')}</small>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}