// app/components/OptionsAnalysisDashboardClient/page.tsx
'use client';

import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, ChevronDown, AlertCircle } from 'lucide-react';

interface AnalysisSignal {
  signal: string;
  desc: string;
  strength: string;
  category: string;
}

interface Spread {
  type: string;
  expiration: string;
  strategy: string;
  credit: string;
  risk: string;
  rationale: string;
}

interface OptionsAnalysisData {
  ticker: string;
  date: string;
  referencePrice: number;
  indicators: Record<string, any>;
  spreads: Spread[];
}

interface DashboardProps {
  user: { firstName: string };
  availableSymbols: string[];
  selectedSymbol: string;
  optionsAnalysisData: OptionsAnalysisData | null;
  technicalData: any;
  historicalPriceData: any[] | null;
  bucketName: string;
}

function StrengthBadge({ strength }: { strength: string }) {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
  const color =
    strength.includes("BEAR") || strength.includes("BEARISH")
      ? "bg-red-600 text-red-100"
      : strength.includes("BULL") || strength.includes("BULLISH")
      ? "bg-green-600 text-green-100"
      : strength.includes("EXTREME") || strength.includes("HIGH RISK")
      ? "bg-yellow-600 text-yellow-100"
      : "bg-gray-600 text-gray-100";

  return <span className={`${base} ${color}`}>{strength}</span>;
}

function PriceChart({ technicalData, historicalData }: { technicalData: any; historicalData: any[] | null }) {
  // Use actual historical data if available, otherwise create mock data with better patterns
  const chartData = historicalData && historicalData.length > 0
    ? historicalData.slice(-30).map((candle: any, idx: number) => ({
        day: idx + 1,
        price: parseFloat(candle.close?.toFixed(2) || candle.price?.toFixed(2) || "0"),
        sma20: parseFloat(candle.sma20?.toFixed(2) || "0"),
        sma50: parseFloat(candle.sma50?.toFixed(2) || "0"),
        high: parseFloat(candle.high?.toFixed(2) || "0"),
        low: parseFloat(candle.low?.toFixed(2) || "0"),
      }))
    : Array.from({ length: 30 }, (_, i) => {
        // Generate realistic mock data with trend
        const basePrice = technicalData.price || 100;
        const trend = Math.sin(i / 10) * 5;
        const noise = (Math.random() - 0.5) * 3;
        const price = basePrice + trend + noise;
        
        const sma20Base = technicalData.moving_averages?.SMA_20 || basePrice - 2;
        const sma50Base = technicalData.moving_averages?.SMA_50 || basePrice - 3;
        
        return {
          day: i + 1,
          price: parseFloat(price.toFixed(2)),
          sma20: parseFloat((sma20Base + trend * 0.5).toFixed(2)),
          sma50: parseFloat((sma50Base + trend * 0.3).toFixed(2)),
          high: parseFloat((price + Math.abs(noise)).toFixed(2)),
          low: parseFloat((price - Math.abs(noise)).toFixed(2)),
        };
      });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
        <XAxis dataKey="day" stroke="rgba(148, 163, 184, 0.5)" />
        <YAxis stroke="rgba(148, 163, 184, 0.5)" />
        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)' }} />
        <Legend />
        <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} name="Price" isAnimationActive={false} />
        <Line type="monotone" dataKey="sma20" stroke="#f59e0b" strokeWidth={2} name="SMA 20" isAnimationActive={false} />
        <Line type="monotone" dataKey="sma50" stroke="#ec4899" strokeWidth={2} name="SMA 50" isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function IndicatorChart({ indicators }: { indicators: Record<string, number> }) {
  const chartData = Object.entries(indicators)
    .filter(([key]) => ['RSI', 'MACD_Value', 'Stoch_K', 'MFI', 'ATR'].includes(key))
    .map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value: typeof value === 'number' ? parseFloat(value.toFixed(2)) : 0,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
        <XAxis dataKey="name" stroke="rgba(148, 163, 184, 0.5)" />
        <YAxis stroke="rgba(148, 163, 184, 0.5)" />
        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)' }} />
        <Bar dataKey="value" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SpreadCard({ spread, index }: { spread: Spread; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl shadow-lg border border-gray-600 overflow-hidden">
      <div
        className="p-5 cursor-pointer hover:bg-gray-750 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-white mb-3">{spread.type}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Expiration:</span>
                <p className="text-white font-mono">{spread.expiration}</p>
              </div>
              <div>
                <span className="text-gray-400">Strategy:</span>
                <p className="text-white font-mono text-xs">{spread.strategy}</p>
              </div>
              <div>
                <span className="text-gray-400">Max Profit:</span>
                <p className="text-green-400 font-semibold">${spread.credit}</p>
              </div>
              <div>
                <span className="text-gray-400">Max Risk:</span>
                <p className="text-red-400 font-semibold">${spread.risk}</p>
              </div>
            </div>
          </div>
          <div className="ml-4">
            <ChevronDown
              size={24}
              className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-600 p-5 bg-black/20">
          <div className="space-y-4">
            <div>
              <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                <AlertCircle size={18} />
                AI Analysis
              </h5>
              <p className="text-gray-300 leading-relaxed text-sm">
                {spread.rationale || 'No analysis available'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-600">
              <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                <div className="text-xs text-green-300 uppercase tracking-wide mb-1">Max Profit</div>
                <div className="text-2xl font-bold text-green-400">${spread.credit}</div>
                <div className="text-xs text-green-300 mt-1">If profitable at expiration</div>
              </div>
              <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                <div className="text-xs text-red-300 uppercase tracking-wide mb-1">Max Risk</div>
                <div className="text-2xl font-bold text-red-400">${spread.risk}</div>
                <div className="text-xs text-red-300 mt-1">If assignment occurs</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OptionsAnalysisDashboard({
  user,
  availableSymbols,
  selectedSymbol,
  optionsAnalysisData,
  technicalData,
  historicalPriceData,
  bucketName,
}: DashboardProps) {
  if (!optionsAnalysisData) {
    return (
      <main className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto py-10">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Welcome, {user.firstName}</h1>
              <p className="text-gray-400 mt-2">Options Analysis Dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-300">Select Stock:</label>
              <div className="flex gap-2 flex-wrap">
                {availableSymbols.map((sym) => (
                  <a
                    key={sym}
                    href={`/dashboard?symbol=${sym}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sym === selectedSymbol
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                    }`}
                  >
                    {sym}
                  </a>
                ))}
              </div>
            </div>
          </header>

          <div className="max-w-lg mx-auto text-center p-8 bg-gray-800 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-red-400 mb-4">Options Analysis Not Available</h2>
            <p className="text-gray-300 mb-4">
              No markdown analysis found in GCS bucket for symbol: <span className="font-mono">{selectedSymbol}</span>
            </p>
            <p className="text-sm text-gray-400">
              Ensure your GCS bucket <span className="font-mono">{bucketName}</span> contains analysis files under
              <span className="font-mono"> spreads-yo/</span>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Welcome, {user.firstName}</h1>
            <p className="text-gray-400 mt-2">{optionsAnalysisData.ticker} — Options Analysis</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-300">Select Stock:</label>
            <div className="flex gap-2 flex-wrap">
              {availableSymbols.map((sym) => (
                <a
                  key={sym}
                  href={`/dashboard?symbol=${sym}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sym === selectedSymbol
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                  }`}
                >
                  {sym}
                </a>
              ))}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        {technicalData && (
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-8 rounded-2xl shadow-2xl border border-blue-700/50 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-sm text-blue-200 uppercase tracking-wide mb-2">Current Price</div>
                <div className="text-4xl font-bold text-white">${technicalData.price?.toFixed(2)}</div>
                <div className={`text-lg font-semibold mt-1 ${(technicalData.change_pct ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(technicalData.change_pct ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(technicalData.change_pct ?? 0).toFixed(2)}%
                </div>
              </div>

              <div>
                <div className="text-sm text-blue-200 uppercase tracking-wide mb-2">Volume</div>
                <div className="text-4xl font-bold text-white">{(technicalData.volume / 1000000).toFixed(1)}M</div>
                <div className="text-sm text-blue-300 mt-1">shares traded</div>
              </div>

              <div>
                <div className="text-sm text-blue-200 uppercase tracking-wide mb-2">Analysis Date</div>
                <div className="text-2xl font-bold text-white">{optionsAnalysisData.date}</div>
              </div>

              <div>
                <div className="text-sm text-blue-200 uppercase tracking-wide mb-2">Total Spreads</div>
                <div className="text-4xl font-bold text-white">{optionsAnalysisData.spreads.length}</div>
                <div className="text-sm text-blue-300 mt-1">strategies analyzed</div>
              </div>
            </div>
          </div>
        )}

        {/* Technical Indicators Grid */}
        {technicalData?.indicators && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(technicalData.indicators).map(([key, value]: [string, any]) => {
              let color = 'from-gray-800 to-gray-700';
              let textColor = 'text-gray-200';
              let borderColor = 'border-gray-600';

              if (key === 'RSI') {
                if (value > 70) {
                  color = 'from-red-900 to-red-800';
                  textColor = 'text-red-200';
                  borderColor = 'border-red-700';
                } else if (value < 30) {
                  color = 'from-green-900 to-green-800';
                  textColor = 'text-green-200';
                  borderColor = 'border-green-700';
                } else {
                  color = 'from-blue-900 to-blue-800';
                  textColor = 'text-blue-200';
                  borderColor = 'border-blue-700';
                }
              } else if (key === 'MACD_Value') {
                color = value > 0 ? 'from-green-900 to-green-800' : 'from-red-900 to-red-800';
                textColor = value > 0 ? 'text-green-200' : 'text-red-200';
                borderColor = value > 0 ? 'border-green-700' : 'border-red-700';
              } else if (key === 'Stoch_K') {
                if (value > 80) {
                  color = 'from-red-900 to-red-800';
                  textColor = 'text-red-200';
                  borderColor = 'border-red-700';
                } else if (value < 20) {
                  color = 'from-green-900 to-green-800';
                  textColor = 'text-green-200';
                  borderColor = 'border-green-700';
                } else {
                  color = 'from-blue-900 to-blue-800';
                  textColor = 'text-blue-200';
                  borderColor = 'border-blue-700';
                }
              }

              return (
                <div key={key} className={`bg-gradient-to-br ${color} p-4 rounded-xl shadow-lg border ${borderColor}`}>
                  <div className="text-xs uppercase tracking-wider text-gray-300 mb-1">{key.replace(/_/g, ' ')}</div>
                  <div className={`text-2xl font-bold ${textColor}`}>
                    {typeof value === 'number' ? value.toFixed(2) : value}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Charts Section */}
        {technicalData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Key Indicators</h3>
              <IndicatorChart indicators={technicalData.indicators || {}} />
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-semibold mb-4">
                30-Day Price Action
                {historicalPriceData && historicalPriceData.length > 0 && (
                  <span className="text-xs font-normal text-green-400 ml-2">• Real Data</span>
                )}
                {!historicalPriceData && (
                  <span className="text-xs font-normal text-gray-400 ml-2">• Mock Data</span>
                )}
              </h3>
              <PriceChart technicalData={technicalData} historicalData={historicalPriceData} />
            </div>
          </div>
        )}

        {/* Moving Averages */}
        {technicalData?.moving_averages && (
          <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-6 rounded-xl shadow-lg border border-indigo-700/50 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Moving Averages
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(technicalData.moving_averages).map(([key, value]: [string, any]) => {
                const currentPrice = technicalData.price ?? 0;
                const isAbove = currentPrice > value;

                return (
                  <div key={key} className="bg-white/5 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                    <div className="text-xs text-indigo-200 uppercase tracking-wide mb-1">{key.replace(/_/g, ' ')}</div>
                    <div className="text-xl font-bold text-white mb-1">${value?.toFixed(2)}</div>
                    <div className={`text-xs font-medium ${isAbove ? 'text-green-400' : 'text-red-400'}`}>
                      {isAbove ? '↑ Above' : '↓ Below'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Credit Spreads Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <span>📈</span> Credit Spread Strategies ({optionsAnalysisData.spreads.length})
          </h2>
          <div className="space-y-4">
            {optionsAnalysisData.spreads.map((spread, idx) => (
              <SpreadCard key={idx} spread={spread} index={idx} />
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl border border-gray-600 text-center">
          <p className="text-gray-400 text-sm">
            💡 <strong>Disclaimer:</strong> This is hypothetical analysis for educational purposes only. Not financial advice.
            All spreads use mid-price estimates and are not executable orders.
          </p>
        </div>
      </div>
    </main>
  );
}