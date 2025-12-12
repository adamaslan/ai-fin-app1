// ============================================================================
// Fibonacci Retracement Chart Component - Next.js + Recharts
// ============================================================================
// File: app/components/FibonacciChart.tsx
// 
// This component reads JSON analysis data and creates dynamic Fibonacci
// retracement charts with support for multiple timeframes

'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from 'recharts';

interface AnalysisData {
  metadata: {
    symbol: string;
    period: string;
    timestamp: string;
    price: number;
    price_change: number;
  };
  key_indicators: {
    RSI: number;
    MACD: number;
    ADX: number;
    ATR: number;
    Volatility: number;
    [key: string]: number;
  };
  signals: Array<{
    signal: string;
    desc: string;
    strength: string;
    category: string;
    ai_score?: number;
  }>;
}

interface ChartDataPoint {
  name: string;
  price: number;
  fib_236?: number;
  fib_382?: number;
  fib_500?: number;
  fib_618?: number;
  fib_786?: number;
  rsi?: number;
  volume?: number;
  [key: string]: any;
}

interface FibonacciLevel {
  name: string;
  value: number;
  color: string;
  dasharray: string;
  width: number;
}

const FIBONACCI_COLORS = {
  236: '#FF6B9D', // Pink
  382: '#FFA07A', // Light Salmon
  500: '#FFD700', // Gold
  618: '#32CD32', // Lime Green
  786: '#20B2AA', // Light Sea Green
};

const FIBONACCI_LEVELS = [
  { level: 0.236, name: '23.6%', color: '#FF6B9D' },
  { level: 0.382, name: '38.2%', color: '#FFA07A' },
  { level: 0.5, name: '50%', color: '#FFD700' },
  { level: 0.618, name: '61.8%', color: '#32CD32' },
  { level: 0.786, name: '78.6%', color: '#20B2AA' },
];

const TIMEFRAME_OPTIONS = ['1D', '5D', '1W', '2W', '1M', '3M', '6M', '1Y', '2Y'];

interface FibonacciChartProps {
  jsonData: AnalysisData;
  priceData?: ChartDataPoint[];
  height?: number;
  showVolume?: boolean;
  showRSI?: boolean;
  defaultTimeframe?: string;
}

const FibonacciChart: React.FC<FibonacciChartProps> = ({
  jsonData,
  priceData = [],
  height = 400,
  showVolume = true,
  showRSI = true,
  defaultTimeframe = '1M',
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(defaultTimeframe);
  const [visibleFibs, setVisibleFibs] = useState<number[]>([0.236, 0.382, 0.5, 0.618, 0.786]);

  // Generate synthetic price data if not provided
  const generatePriceData = (timeframe: string): ChartDataPoint[] => {
    if (priceData.length > 0) return priceData;

    const currentPrice = jsonData.metadata.price;
    const volatility = jsonData.key_indicators.Volatility / 100;
    const days = getDaysFromTimeframe(timeframe);
    const data: ChartDataPoint[] = [];

    // Generate realistic price movement
    let price = currentPrice * 0.95;
    for (let i = 0; i < days; i++) {
      const change = (Math.random() - 0.5) * volatility * 2;
      price *= 1 + change;

      data.push({
        name: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(
          'en-US',
          { month: 'short', day: 'numeric' }
        ),
        price: parseFloat(price.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000 + 500000),
        rsi: Math.random() * 100,
      });
    }

    return data;
  };

  const getDaysFromTimeframe = (tf: string): number => {
    const days: { [key: string]: number } = {
      '1D': 1,
      '5D': 5,
      '1W': 7,
      '2W': 14,
      '1M': 21,
      '3M': 63,
      '6M': 126,
      '1Y': 252,
      '2Y': 504,
    };
    return days[tf] || 21;
  };

  const calculateFibonacciLevels = (data: ChartDataPoint[]) => {
    if (data.length === 0) return {};

    const prices = data.map((d) => d.price);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const diff = high - low;

    return {
      high,
      low,
      236: high - diff * 0.236,
      382: high - diff * 0.382,
      500: high - diff * 0.5,
      618: high - diff * 0.618,
      786: high - diff * 0.786,
    };
  };

  const chartData = useMemo(() => {
    return generatePriceData(selectedTimeframe);
  }, [selectedTimeframe]);

  const fibLevels = useMemo(() => {
    return calculateFibonacciLevels(chartData);
  }, [chartData]);

  // Get Fibonacci signals from JSON data
  const getFibonacciSignals = () => {
    return jsonData.signals
      .filter((s) => s.category.includes('FIBONACCI'))
      .slice(0, 10);
  };

  // Custom tooltip to show price and Fibonacci levels
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-300 rounded shadow-lg">
          <p className="font-bold text-gray-800">{data.name}</p>
          <p className="text-blue-600">Price: ${data.price.toFixed(2)}</p>
          {data.rsi && <p className="text-orange-600">RSI: {data.rsi.toFixed(1)}</p>}
          {visibleFibs.includes(0.236) && fibLevels[236] && (
            <p className="text-pink-600 text-sm">
              23.6%: ${fibLevels[236].toFixed(2)}
            </p>
          )}
          {visibleFibs.includes(0.618) && fibLevels[618] && (
            <p className="text-green-600 text-sm">
              61.8%: ${fibLevels[618].toFixed(2)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const fibonacciSignals = getFibonacciSignals();

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              {jsonData.metadata.symbol} Fibonacci Analysis
            </h2>
            <p className="text-gray-600">
              {jsonData.metadata.timestamp} | Period: {jsonData.metadata.period}
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-gray-900">
              ${jsonData.metadata.price.toFixed(2)}
            </p>
            <p
              className={`text-xl font-semibold ${
                jsonData.metadata.price_change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {jsonData.metadata.price_change >= 0 ? '+' : ''}
              {jsonData.metadata.price_change.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2 flex-wrap">
          {TIMEFRAME_OPTIONS.map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-4 py-2 rounded font-semibold transition-all ${
                selectedTimeframe === tf
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Fibonacci Level Toggles */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-3">Fibonacci Levels</h3>
        <div className="flex gap-4 flex-wrap">
          {FIBONACCI_LEVELS.map((fib) => (
            <label key={fib.level} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleFibs.includes(fib.level)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setVisibleFibs([...visibleFibs, fib.level]);
                  } else {
                    setVisibleFibs(visibleFibs.filter((v) => v !== fib.level));
                  }
                }}
                className="w-4 h-4"
              />
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: fib.color }}
              ></span>
              <span className="text-sm text-gray-700">{fib.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 80, left: 0, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="name"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6B7280"
              label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }}
              yAxisId="left"
              style={{ fontSize: '12px' }}
            />
            {showVolume && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#9CA3AF"
                label={{ value: 'Volume', angle: 90, position: 'insideRight' }}
                style={{ fontSize: '12px' }}
              />
            )}

            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              verticalAlign="top"
              height={36}
            />

            {/* Fibonacci Reference Lines */}
            {visibleFibs.includes(0.236) && fibLevels[236] && (
              <ReferenceLine
                y={fibLevels[236]}
                stroke={FIBONACCI_COLORS[236]}
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `23.6% - $${fibLevels[236].toFixed(2)}`,
                  position: 'right',
                  fill: FIBONACCI_COLORS[236],
                  fontSize: 11,
                }}
              />
            )}
            {visibleFibs.includes(0.382) && fibLevels[382] && (
              <ReferenceLine
                y={fibLevels[382]}
                stroke={FIBONACCI_COLORS[382]}
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `38.2% - $${fibLevels[382].toFixed(2)}`,
                  position: 'right',
                  fill: FIBONACCI_COLORS[382],
                  fontSize: 11,
                }}
              />
            )}
            {visibleFibs.includes(0.5) && fibLevels[500] && (
              <ReferenceLine
                y={fibLevels[500]}
                stroke={FIBONACCI_COLORS[500]}
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `50% - $${fibLevels[500].toFixed(2)}`,
                  position: 'right',
                  fill: FIBONACCI_COLORS[500],
                  fontSize: 11,
                }}
              />
            )}
            {visibleFibs.includes(0.618) && fibLevels[618] && (
              <ReferenceLine
                y={fibLevels[618]}
                stroke={FIBONACCI_COLORS[618]}
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `61.8% - $${fibLevels[618].toFixed(2)}`,
                  position: 'right',
                  fill: FIBONACCI_COLORS[618],
                  fontSize: 11,
                }}
              />
            )}
            {visibleFibs.includes(0.786) && fibLevels[786] && (
              <ReferenceLine
                y={fibLevels[786]}
                stroke={FIBONACCI_COLORS[786]}
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `78.6% - $${fibLevels[786].toFixed(2)}`,
                  position: 'right',
                  fill: FIBONACCI_COLORS[786],
                  fontSize: 11,
                }}
              />
            )}

            {/* Current Price Line */}
            <ReferenceLine
              y={jsonData.metadata.price}
              stroke="#1F2937"
              strokeWidth={3}
              label={{
                value: `Current: $${jsonData.metadata.price.toFixed(2)}`,
                position: 'right',
                fill: '#1F2937',
                fontSize: 12,
                fontWeight: 'bold',
              }}
            />

            {/* Price Line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="price"
              stroke="#3B82F6"
              dot={false}
              strokeWidth={2}
              name="Price"
              isAnimationActive={true}
            />

            {/* Volume Bars */}
            {showVolume && (
              <Bar
                yAxisId="right"
                dataKey="volume"
                fill="#10B98160"
                name="Volume"
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Fibonacci Signals */}
      {fibonacciSignals.length > 0 && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Fibonacci Signals ({fibonacciSignals.length})
          </h3>
          <div className="space-y-3">
            {fibonacciSignals.map((signal, idx) => (
              <div
                key={idx}
                className="p-3 border-l-4 border-blue-500 bg-blue-50 rounded"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{signal.signal}</p>
                    <p className="text-sm text-gray-600">{signal.desc}</p>
                  </div>
                  <div className="text-right">
                    {signal.ai_score && (
                      <p className="font-bold text-lg">
                        {signal.ai_score}
                        <span className="text-xs text-gray-600">/100</span>
                      </p>
                    )}
                    <p className="text-xs text-gray-600">{signal.strength}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-semibold">RSI</p>
          <p className="text-2xl font-bold text-blue-600">
            {jsonData.key_indicators.RSI.toFixed(1)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-semibold">ADX</p>
          <p className="text-2xl font-bold text-purple-600">
            {jsonData.key_indicators.ADX.toFixed(1)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-semibold">Volatility</p>
          <p className="text-2xl font-bold text-orange-600">
            {jsonData.key_indicators.Volatility.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm font-semibold">ATR</p>
          <p className="text-2xl font-bold text-green-600">
            {jsonData.key_indicators.ATR.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FibonacciChart;