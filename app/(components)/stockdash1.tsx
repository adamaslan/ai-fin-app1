// types/stock.ts
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

// components/StockDashboard.tsx
import React, { useState, useEffect } from 'react';
import { ApiResponse } from '../types/stock';

const StockDashboard: React.FC = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/dashboard/QUBT');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: ApiResponse = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Optional: Set up polling for real-time updates
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!data?.success || !data.data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No data available
        </div>
      </div>
    );
  }

  const { indicators, spreads } = data.data;
  const { current_price, indicators: tech } = indicators;

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{indicators.symbol}</h1>
            <p className="text-sm text-gray-500">
              Last updated: {new Date(data.data.last_updated).toLocaleString()}
            </p>
          </div>
          {data.data.is_updating && (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Updating...
            </div>
          )}
        </div>
      </div>

      {/* Current Price */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Current Price</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(current_price.price)}
            </p>
            <p className="text-sm text-gray-500">Price</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${current_price.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {current_price.change >= 0 ? '+' : ''}{formatCurrency(current_price.change)}
            </p>
            <p className="text-sm text-gray-500">Change</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${current_price.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {current_price.change_percent >= 0 ? '+' : ''}{formatPercent(current_price.change_percent)}
            </p>
            <p className="text-sm text-gray-500">Change %</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              {current_price.volume.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Volume</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              {current_price.avg_volume.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Avg Volume</p>
          </div>
        </div>
      </div>

      {/* Technical Indicators */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Technical Indicators</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="font-semibold">{formatCurrency(tech.EMA_10)}</p>
            <p className="text-sm text-gray-500">EMA 10</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="font-semibold">{formatCurrency(tech.EMA_20)}</p>
            <p className="text-sm text-gray-500">EMA 20</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="font-semibold">{formatCurrency(tech.SMA_50)}</p>
            <p className="text-sm text-gray-500">SMA 50</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="font-semibold">{tech.RSI.toFixed(1)}</p>
            <p className="text-sm text-gray-500">RSI</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="font-semibold">{tech.MACD.toFixed(4)}</p>
            <p className="text-sm text-gray-500">MACD</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="font-semibold">{tech.Stoch_K.toFixed(1)}</p>
            <p className="text-sm text-gray-500">Stoch K</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="font-semibold">{tech.CCI.toFixed(1)}</p>
            <p className="text-sm text-gray-500">CCI</p>
          </div>
        </div>
        
        {/* Bollinger Bands */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Bollinger Bands</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <p className="font-semibold">{formatCurrency(tech.BB_Upper)}</p>
              <p className="text-sm text-gray-500">Upper</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <p className="font-semibold">{formatCurrency(tech.BB_Middle)}</p>
              <p className="text-sm text-gray-500">Middle</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <p className="font-semibold">{formatCurrency(tech.BB_Lower)}</p>
              <p className="text-sm text-gray-500">Lower</p>
            </div>
          </div>
        </div>
      </div>

      {/* Market Analysis */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Market Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center mb-2">
              <span className="font-semibold">Market Bias:</span>
              <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                spreads.market_bias === 'BULLISH' ? 'bg-green-100 text-green-800' : 
                spreads.market_bias === 'BEARISH' ? 'bg-red-100 text-red-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {spreads.market_bias}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Bias Strength: {spreads.bias_strength}/1.0
            </p>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Support Levels</h4>
              <div className="flex flex-wrap gap-2">
                {spreads.support_levels.map((level, index) => (
                  <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    {formatCurrency(level)}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Resistance Levels</h4>
              <div className="flex flex-wrap gap-2">
                {spreads.resistance_levels.map((level, index) => (
                  <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                    {formatCurrency(level)}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Overall Recommendation</h4>
            <p className="text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-400">
              {spreads.overall_recommendation}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Expected Move: {spreads.expected_moves.toFixed(4)}
            </p>
          </div>
        </div>
      </div>

      {/* Spread Suggestions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Spread Suggestions</h2>
        <div className="space-y-4">
          {spreads.spread_suggestions.map((suggestion, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">{suggestion.timeframe}</h3>
                <span className="text-sm text-gray-500">
                  Expires: {new Date(suggestion.expiration_date).toLocaleDateString()}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Call Spread */}
                <div className="bg-red-50 p-4 rounded">
                  <h4 className="font-semibold text-red-800 mb-2">Call Spread</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Type:</span> {suggestion.call_spread.type}</p>
                    <p><span className="font-medium">Short Strike:</span> {formatCurrency(suggestion.call_spread.short_strike)}</p>
                    <p><span className="font-medium">Long Strike:</span> {formatCurrency(suggestion.call_spread.long_strike)}</p>
                    <p><span className="font-medium">Width:</span> {formatCurrency(suggestion.call_spread.width)}</p>
                    <p><span className="font-medium">Max Profit:</span> {suggestion.call_spread.max_profit}</p>
                    <p><span className="font-medium">Max Loss:</span> {suggestion.call_spread.max_loss}</p>
                    <p><span className="font-medium">Breakeven:</span> {suggestion.call_spread.breakeven}</p>
                  </div>
                </div>
                
                {/* Put Spread */}
                <div className="bg-green-50 p-4 rounded">
                  <h4 className="font-semibold text-green-800 mb-2">Put Spread</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Type:</span> {suggestion.put_spread.type}</p>
                    <p><span className="font-medium">Short Strike:</span> {formatCurrency(suggestion.put_spread.short_strike)}</p>
                    <p><span className="font-medium">Long Strike:</span> {formatCurrency(suggestion.put_spread.long_strike)}</p>
                    <p><span className="font-medium">Width:</span> {formatCurrency(suggestion.put_spread.width)}</p>
                    <p><span className="font-medium">Max Profit:</span> {suggestion.put_spread.max_profit}</p>
                    <p><span className="font-medium">Max Loss:</span> {suggestion.put_spread.max_loss}</p>
                    <p><span className="font-medium">Breakeven:</span> {suggestion.put_spread.breakeven}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Technical Justification</h4>
                <ul className="text-sm space-y-1">
                  {suggestion.technical_justification.map((reason, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
              
              <p className="text-sm text-gray-600 mt-2">
                Expected Move: {suggestion.expected_move.toFixed(4)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockDashboard;