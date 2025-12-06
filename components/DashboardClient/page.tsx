// app/dashboard/DashboardClient.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalysisSignal {
  signal: string;
  desc: string;
  strength: string;
  category: string;
}

interface AnalysisData {
  symbol: string;
  timestamp: string;
  date: string;
  analysis: string;
  signal_count: number;
  signals_analyzed: AnalysisSignal[];
  overall_bias?: string;
  long_term_comment?: string;
  risk?: string[];
  key_levels?: string[];
  recommendation?: string;
}

interface TechnicalData {
  price?: number;
  change_pct?: number;
  volume?: number;
  indicators?: Record<string, number>;
  moving_averages?: Record<string, number>;
  bullish_count?: number;
  bearish_count?: number;
}

interface DashboardClientProps {
  user: { firstName: string };
  availableSymbols: string[];
  selectedSymbol: string;
  analysisData: AnalysisData | null;
  technicalData: TechnicalData | null;
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

function MarkdownAnalysis({ text }: { text: string }) {
  const renderInline = (s: string, keyPrefix = "") => {
    const parts = s.split(/\*\*/);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <strong key={keyPrefix + i} className="font-semibold">{part}</strong>
      ) : (
        <span key={keyPrefix + i}>{part}</span>
      )
    );
  };

  const blocks = text.split(/\n\n+/).map(b => b.trim()).filter(Boolean);

  return (
    <div className="text-gray-200 mt-2 space-y-4">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();

        if (trimmed.startsWith("**") && trimmed.endsWith("**") && !trimmed.includes("\n")) {
          const inner = trimmed.slice(2, -2).trim();
          return <h4 key={idx} className="text-lg font-semibold text-white">{renderInline(inner, `h${idx}-`)}</h4>;
        }

        const lines = block.split(/\n/).map(l => l.trim()).filter(Boolean);
        const isList = lines.every(l => l.startsWith("*") || l.startsWith("-"));
        if (isList) {
          return (
            <ul key={idx} className="list-disc list-inside space-y-1 text-sm text-gray-200">
              {lines.map((line, i) => {
                const content = line.replace(/^\*+\s?|-+\s?/, "");
                return <li key={i}>{renderInline(content, `li${idx}-${i}-`)}</li>;
              })}
            </ul>
          );
        }

        const paragraphParts = block.split(/\n/).map((p, i) => (
          <span key={i}>
            {renderInline(p, `p${idx}-${i}-`)}
            {i < block.split(/\n/).length - 1 ? <br /> : null}
          </span>
        ));

        return (
          <p key={idx} className="text-sm leading-relaxed">
            {paragraphParts}
          </p>
        );
      })}
    </div>
  );
}

function PriceChart({ technicalData }: { technicalData: TechnicalData }) {
  // Generate mock chart data from technical data
  const chartData = Array.from({ length: 30 }, (_, i) => {
    const price = (technicalData.price || 100) + (Math.random() - 0.5) * 10;
    const sma20 = (technicalData.moving_averages?.SMA_20 || 100) + (Math.random() - 0.5) * 5;
    const sma50 = (technicalData.moving_averages?.SMA_50 || 100) + (Math.random() - 0.5) * 5;
    
    return {
      day: i + 1,
      price: parseFloat(price.toFixed(2)),
      sma20: parseFloat(sma20.toFixed(2)),
      sma50: parseFloat(sma50.toFixed(2)),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
        <XAxis dataKey="day" stroke="rgba(148, 163, 184, 0.5)" />
        <YAxis stroke="rgba(148, 163, 184, 0.5)" />
        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '0.5rem' }} />
        <Legend />
        <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} name="Price" isAnimationActive={false} />
        <Line type="monotone" dataKey="sma20" stroke="#f59e0b" strokeWidth={2} name="SMA 20" isAnimationActive={false} />
        <Line type="monotone" dataKey="sma50" stroke="#ec4899" strokeWidth={2} name="SMA 50" isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function DashboardClient({
  user,
  availableSymbols,
  selectedSymbol,
  analysisData,
  technicalData,
  bucketName,
}: DashboardClientProps) {
  if (!analysisData) {
    return (
      <main className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto py-10">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Welcome, {user.firstName}</h1>
              <p className="text-gray-400 mt-2">Technical Analysis Dashboard</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-300">
                Select Stock:
              </label>
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
            <h2 className="text-2xl font-semibold text-red-400 mb-4">Data Not Available</h2>
            <p className="text-gray-300 mb-4">No analysis JSON was found in Google Cloud Storage for symbol: <span className="font-mono">{selectedSymbol}</span>.</p>
            <p className="text-sm text-gray-400">Ensure your GCS bucket <span className="font-mono">{bucketName}</span> contains the expected files under <span className="font-mono">daily/&lt;YYYY-MM-DD&gt;/</span> and that the server has permission to read them.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Welcome, {user.firstName}</h1>
            <p className="text-gray-400 mt-2">{analysisData.symbol} Analysis</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-300">
              Select Stock:
            </label>
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

        {/* Price & Indicators Overview */}
        {technicalData && (
          <section className="mb-6">
            {/* Hero Price Card */}
            <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-8 rounded-2xl shadow-2xl border border-blue-700/50 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Current Price */}
                <div className="text-center md:text-left">
                  <div className="text-sm text-blue-200 uppercase tracking-wide mb-2">Current Price</div>
                  <div className="text-5xl font-bold text-white mb-2">
                    ${technicalData.price?.toFixed(2) || 'N/A'}
                  </div>
                  <div className={`text-2xl font-semibold ${(technicalData.change_pct ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(technicalData.change_pct ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(technicalData.change_pct ?? 0).toFixed(2)}%
                  </div>
                </div>

                {/* Volume */}
                <div className="text-center">
                  <div className="text-sm text-blue-200 uppercase tracking-wide mb-2">Volume</div>
                  <div className="text-3xl font-bold text-white mb-2">
                    {(technicalData.volume ?? 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-300">shares traded</div>
                </div>

                {/* Signal Summary */}
                <div className="text-center md:text-right">
                  <div className="text-sm text-blue-200 uppercase tracking-wide mb-2">Signal Summary</div>
                  <div className="flex justify-center md:justify-end gap-4 mb-2">
                    <div className="bg-green-500/20 px-4 py-2 rounded-lg border border-green-500/50">
                      <div className="text-2xl font-bold text-green-400">{technicalData.bullish_count ?? 0}</div>
                      <div className="text-xs text-green-300">Bullish</div>
                    </div>
                    <div className="bg-red-500/20 px-4 py-2 rounded-lg border border-red-500/50">
                      <div className="text-2xl font-bold text-red-400">{technicalData.bearish_count ?? 0}</div>
                      <div className="text-xs text-red-300">Bearish</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Indicators Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {technicalData.indicators && Object.entries(technicalData.indicators).map(([key, value]) => {
                let color = 'from-gray-800 to-gray-700';
                let textColor = 'text-gray-200';
                let borderColor = 'border-gray-600';
                
                if (key === 'RSI') {
                  if (value > 70) { color = 'from-red-900 to-red-800'; textColor = 'text-red-200'; borderColor = 'border-red-700'; }
                  else if (value < 30) { color = 'from-green-900 to-green-800'; textColor = 'text-green-200'; borderColor = 'border-green-700'; }
                  else { color = 'from-blue-900 to-blue-800'; textColor = 'text-blue-200'; borderColor = 'border-blue-700'; }
                } else if (key === 'MACD') {
                  color = value > 0 ? 'from-green-900 to-green-800' : 'from-red-900 to-red-800';
                  textColor = value > 0 ? 'text-green-200' : 'text-red-200';
                  borderColor = value > 0 ? 'border-green-700' : 'border-red-700';
                } else if (key === 'Stochastic') {
                  if (value > 80) { color = 'from-red-900 to-red-800'; textColor = 'text-red-200'; borderColor = 'border-red-700'; }
                  else if (value < 20) { color = 'from-green-900 to-green-800'; textColor = 'text-green-200'; borderColor = 'border-green-700'; }
                  else { color = 'from-blue-900 to-blue-800'; textColor = 'text-blue-200'; borderColor = 'border-blue-700'; }
                }

                return (
                  <div key={key} className={`bg-gradient-to-br ${color} p-4 rounded-xl shadow-lg border ${borderColor}`}>
                    <div className="text-xs uppercase tracking-wider text-gray-300 mb-1">{key}</div>
                    <div className={`text-2xl font-bold ${textColor}`}>
                      {typeof value === 'number' ? value.toFixed(2) : value}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chart Section */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg mb-6">
              <h3 className="text-xl font-semibold mb-4">30-Day Price Action</h3>
              <PriceChart technicalData={technicalData} />
            </div>

            {/* Moving Averages */}
            {technicalData.moving_averages && (
              <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-6 rounded-xl shadow-lg border border-indigo-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Moving Averages
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(technicalData.moving_averages).map(([key, value]) => {
                    const currentPrice = technicalData.price ?? 0;
                    const isAbove = currentPrice > value;
                    
                    return (
                      <div key={key} className="bg-white/5 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                        <div className="text-xs text-indigo-200 uppercase tracking-wide mb-1">{key.replace('_', ' ')}</div>
                        <div className="text-xl font-bold text-white mb-1">
                          ${typeof value === 'number' ? value.toFixed(2) : value}
                        </div>
                        <div className={`text-xs font-medium ${isAbove ? 'text-green-400' : 'text-red-400'}`}>
                          {isAbove ? '↑ Above' : '↓ Below'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Analysis Section */}
        <div className="grid grid-cols-1 gap-6">
          <section className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold">{analysisData.symbol} — Technical Snapshot</h2>
                <p className="text-sm text-gray-300 mt-1">Signal count: {analysisData.signal_count}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Timestamp</div>
                <div className="font-mono text-sm">{analysisData.timestamp}</div>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-lg font-medium">Strongest Signal</h3>
                {analysisData.analysis ? (
                  <MarkdownAnalysis text={analysisData.analysis} />
                ) : (
                  <p className="text-gray-200 mt-1">(no analysis text provided)</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Signals Analyzed */}
        <section className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Signals Analyzed</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.isArray(analysisData.signals_analyzed) ? (
              (analysisData.signals_analyzed as AnalysisSignal[]).map((s, idx) => (
                <div key={idx} className="p-3 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{s.signal}</div>
                      <div className="text-sm text-gray-300">{s.desc}</div>
                    </div>
                    <div className="ml-3">
                      <StrengthBadge strength={s.strength} />
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">{s.category}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-400">No signals array found in analysis JSON.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}