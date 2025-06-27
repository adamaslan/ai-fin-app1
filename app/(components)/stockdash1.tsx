"use client"
// components/StockDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Updated types to match Prisma schema
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
  volume: bigint | number;
  avg_volume: bigint | number;
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
  spread_suggestions: SpreadSuggestion[];
}

interface ApiResponse {
  success: boolean;
  data: StockData | null;
  message: string | null;
  timestamp: string;
}

interface StockDashboardProps {
  symbol?: string;
  initialData?: StockData;
  refreshInterval?: number;
}

// Loading skeleton component
const LoadingSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto p-6 space-y-6 animate-pulse">
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="h-8 bg-gray-300 rounded w-1/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="h-6 bg-gray-300 rounded w-1/5 mb-4"></div>
      <div className="grid grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-8 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Error boundary component
const ErrorDisplay: React.FC<{ error: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md">
      <h3 className="font-semibold mb-2">Error Loading Data</h3>
      <p className="mb-4">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

const StockDashboard: React.FC<StockDashboardProps> = ({ 
  symbol = 'QUBT', 
  initialData,
  refreshInterval = 30000 
}) => {
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(
    initialData ? { success: true, data: initialData, message: null, timestamp: new Date().toISOString() } : null
  );
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState<boolean>(false);

  // Hydration safety
  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/dashboard/${symbol}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add cache busting for real-time data
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Stock symbol "${symbol}" not found`);
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`Server error: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch data');
      }

      setData(result);
      setError(null);
    } catch (err: unknown) {
      console.error('Failed to fetch data:', err);
      
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error. Please check your connection.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (!initialData) {
      fetchData();
    }
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, initialData, refreshInterval]);

  // Utility functions - optimized for performance
  const formatCurrency = useCallback((value: number): string => 
    value.toFixed(2), []);
  
  const formatPercent = useCallback((value: number): string => 
    `${value.toFixed(2)}%`, []);

  const formatVolume = useCallback((value: bigint | number): string => {
    const num = typeof value === 'bigint' ? Number(value) : value;
    return num.toLocaleString();
  }, []);

  const formatDate = useCallback((timestamp: string): string => {
    if (!isClient) return 'Loading...';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  }, [isClient]);
  
  const formatExpirationDate = useCallback((dateString: string): string => {
    if (!isClient) return 'Loading...';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  }, [isClient]);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} />;
  }

  if (!data?.success || !data.data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No data available for {symbol}
        </div>
      </div>
    );
  }

  const stockData = data.data;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{stockData.symbol}</h1>
            <p className="text-sm text-gray-500">
              Last updated: {formatDate(stockData.last_updated)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {stockData.is_updating && (
              <div className="flex items-center text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Updating...
              </div>
            )}
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Current Price */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Current Price</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              ${formatCurrency(stockData.price)}
            </p>
            <p className="text-sm text-gray-500">Price</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${stockData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stockData.change >= 0 ? '+' : ''}${formatCurrency(stockData.change)}
            </p>
            <p className="text-sm text-gray-500">Change</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${stockData.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stockData.change_percent >= 0 ? '+' : ''}{formatPercent(stockData.change_percent)}
            </p>
            <p className="text-sm text-gray-500">Change %</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              {formatVolume(stockData.volume)}
            </p>
            <p className="text-sm text-gray-500">Volume</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              {formatVolume(stockData.avg_volume)}
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
            <p className="font-semibold">${formatCurrency(stockData.ema_10)}</p>
            <p className="text-sm text-gray-500">EMA 10</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="font-semibold">${formatCurrency(stockData.ema_20)}</p>
            <p className="text-sm text-gray-500">EMA 20</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="font-semibold">${formatCurrency(stockData.sma_50)}</p>
            <p className="text-sm text-gray-500">SMA 50</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="font-semibold">{stockData.rsi.toFixed(1)}</p>
            <p className="text-sm text-gray-500">RSI</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="font-semibold">{stockData.macd.toFixed(4)}</p>
            <p className="text-sm text-gray-500">MACD</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="font-semibold">{stockData.stoch_k.toFixed(1)}</p>
            <p className="text-sm text-gray-500">Stoch K</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <p className="font-semibold">{stockData.cci.toFixed(1)}</p>
            <p className="text-sm text-gray-500">CCI</p>
          </div>
        </div>
        
        {/* Bollinger Bands */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Bollinger Bands</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <p className="font-semibold">${formatCurrency(stockData.bb_upper)}</p>
              <p className="text-sm text-gray-500">Upper</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <p className="font-semibold">${formatCurrency(stockData.bb_middle)}</p>
              <p className="text-sm text-gray-500">Middle</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <p className="font-semibold">${formatCurrency(stockData.bb_lower)}</p>
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
                stockData.market_bias === 'BULLISH' ? 'bg-green-100 text-green-800' : 
                stockData.market_bias === 'BEARISH' ? 'bg-red-100 text-red-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {stockData.market_bias}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Bias Strength: {stockData.bias_strength.toFixed(2)}/1.0
            </p>
            
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Support Levels</h4>
              <div className="flex flex-wrap gap-2">
                {stockData.support_levels.map((level, index) => (
                  <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    ${formatCurrency(level)}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Resistance Levels</h4>
              <div className="flex flex-wrap gap-2">
                {stockData.resistance_levels.map((level, index) => (
                  <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                    ${formatCurrency(level)}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Overall Recommendation</h4>
            <p className="text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-400">
              {stockData.overall_recommendation}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Expected Move: {stockData.expected_moves.toFixed(4)}
            </p>
          </div>
        </div>
      </div>

      {/* Spread Suggestions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Spread Suggestions</h2>
        {stockData.spread_suggestions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No spread suggestions available</p>
        ) : (
          <div className="space-y-4">
            {stockData.spread_suggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-lg">{suggestion.timeframe}</h3>
                  <span className="text-sm text-gray-500">
                    Expires: {formatExpirationDate(suggestion.expiration_date)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Call Spread */}
                  <div className="bg-red-50 p-4 rounded">
                    <h4 className="font-semibold text-red-800 mb-2">Call Spread</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Type:</span> {suggestion.call_type}</p>
                      <p><span className="font-medium">Short Strike:</span> ${formatCurrency(suggestion.call_short_strike)}</p>
                      <p><span className="font-medium">Long Strike:</span> ${formatCurrency(suggestion.call_long_strike)}</p>
                      <p><span className="font-medium">Width:</span> ${formatCurrency(suggestion.call_width)}</p>
                      <p><span className="font-medium">Max Profit:</span> {suggestion.call_max_profit}</p>
                      <p><span className="font-medium">Max Loss:</span> {suggestion.call_max_loss}</p>
                      <p><span className="font-medium">Breakeven:</span> {suggestion.call_breakeven}</p>
                    </div>
                  </div>
                  
                  {/* Put Spread */}
                  <div className="bg-green-50 p-4 rounded">
                    <h4 className="font-semibold text-green-800 mb-2">Put Spread</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Type:</span> {suggestion.put_type}</p>
                      <p><span className="font-medium">Short Strike:</span> ${formatCurrency(suggestion.put_short_strike)}</p>
                      <p><span className="font-medium">Long Strike:</span> ${formatCurrency(suggestion.put_long_strike)}</p>
                      <p><span className="font-medium">Width:</span> ${formatCurrency(suggestion.put_width)}</p>
                      <p><span className="font-medium">Max Profit:</span> {suggestion.put_max_profit}</p>
                      <p><span className="font-medium">Max Loss:</span> {suggestion.put_max_loss}</p>
                      <p><span className="font-medium">Breakeven:</span> {suggestion.put_breakeven}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Technical Justification</h4>
                  <ul className="text-sm space-y-1">
                    {suggestion.technical_justification.map((reason, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-blue-500 mr-2 mt-1">•</span>
                        <span>{reason}</span>
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
        )}
      </div>
    </div>
  );
};

export default StockDashboard;