import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, ChevronDown, Download, AlertCircle } from 'lucide-react';

export default function OptionsAnalysisDashboard() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [technicalData, setTechnicalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTicker, setSearchTicker] = useState('');
  const [expandedSpread, setExpandedSpread] = useState(null);

  // Sample markdown data structure (replace with actual API call)
  const sampleMarkdownData = `# AI-Enhanced Credit Spread Analysis: MP

**Date:** 2025-02-06
**Reference Price:** $142.50

## Technical Landscape (12 Indicators)
- **Current_Price:** 142.50
- **SMA_50:** 138.20
- **SMA_200:** 135.80
- **RSI:** 65.32
- **MACD_Value:** 2.45
- **MACD_Signal:** 1.85
- **MACD_Bullish:** True
- **BB_PercentB:** 0.72
- **HV_30d:** 0.28
- **ATR:** 3.42
- **Avg_Volume_50:** 2850000
- **ROC_10d:** 5.23
- **Stoch_K:** 78.45
- **MFI:** 62.15
- **ADL:** 125000000

---

### Put Credit Spread (2025-02-28)
**Strategy:** Sell $135 / Buy $130
**Est. Credit:** $185 | **Max Risk:** $315
**Analysis:**
With RSI at 65.32, the stock is approaching overbought territory but hasn't quite reached extreme levels, suggesting some room for consolidation. The Bollinger Band %B of 0.72 indicates the price is trading in the upper portion of the bands, consistent with a bullish trend. The positive MACD signal (Value 2.45 > Signal 1.85) reinforces upward momentum. However, a put credit spread at the $135 strike (approximately 5.2% out-of-the-money) offers attractive risk/reward. The 30-day historical volatility of 0.28 provides reasonable premium for the trade. This setup captures theta decay while maintaining a favorable probability of profit if the stock remains above $135 through expiration.

---

### Call Credit Spread (2025-02-28)
**Strategy:** Sell $150 / Buy $155
**Est. Credit:** $145 | **Max Risk:** $355
**Analysis:**
Though momentum remains positive, the RSI at 65.32 and Stochastic %K at 78.45 suggest some caution at higher levels. The call credit spread targets $150 (approximately 5.3% above current price), which aligns with previous resistance levels. With ATR at 3.42, we can expect typical daily moves of this magnitude. The relatively elevated volatility (HV 30d at 0.28) supports premium collection. This bearish-neutral stance hedges against a potential pullback while still allowing profitable upside participation through the short strike.

---

### Put Credit Spread (2025-03-28)
**Strategy:** Sell $140 / Buy $135
**Est. Credit:** $165 | **Max Risk:** $335
**Analysis:**
The 30-day timeframe offers a longer decay window. With SMA_50 at 138.20 and SMA_200 at 135.80, the intermediate and long-term trends remain supportive. Selling the $140 put (in-the-money by ~1.8%) captures premium while maintaining a bullish bias. The Money Flow Index at 62.15 suggests moderate accumulation. This wider-timeframe put spread provides better risk/reward than shorter expirations and lets theta work more aggressively in your favor.

---

### Call Credit Spread (2025-03-28)
**Strategy:** Sell $150 / Buy $155
**Est. Credit:** $175 | **Max Risk:** $325
**Analysis:**
A longer-dated call spread maintains bearish-neutral exposure. The 45-day timeframe increases theta decay significantly. With an ADL (Accumulation/Distribution) at 125M showing historical accumulation, institutions are supporting the stock. However, the Stochastic %K at 78.45 warns against chasing higher prices immediately. This trade structure allows premium collection while avoiding the worst pullback scenarios.`;

  // Parse markdown analysis
  const parseMarkdownAnalysis = (content) => {
    const lines = content.split('\n');
    const data = {
      ticker: '',
      date: '',
      referencePrice: null,
      indicators: {},
      spreads: [],
    };

    let currentSpread = null;
    let rationale = '';
    let inRationale = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Extract title and ticker
      if (line.startsWith('# AI-Enhanced')) {
        const match = line.match(/Analysis: (\w+)/);
        if (match) data.ticker = match[1];
      }

      // Extract date
      if (line.startsWith('**Date:**')) {
        const dateMatch = line.match(/Date:\*\* (.*)/);
        if (dateMatch) data.date = dateMatch[1];
      }

      // Extract reference price
      if (line.startsWith('**Reference Price:**')) {
        const priceMatch = line.match(/\$([0-9.]+)/);
        if (priceMatch) data.referencePrice = parseFloat(priceMatch[1]);
      }

      // Extract indicators
      if (line.startsWith('- **') && !line.includes('Spread') && !line.includes('Strategy')) {
        const indicatorMatch = line.match(/- \*\*([^:]+):\*\* (.*)/);
        if (indicatorMatch) {
          const value = parseFloat(indicatorMatch[2]);
          data.indicators[indicatorMatch[1]] = isNaN(value) ? indicatorMatch[2] : value;
        }
      }

      // Detect spread sections
      if (line.includes('Credit Spread') && line.includes('(')) {
        if (currentSpread) data.spreads.push(currentSpread);
        const expMatch = line.match(/\((.*?)\)/);
        currentSpread = {
          type: line.includes('Put') ? 'Put Credit Spread' : 'Call Credit Spread',
          expiration: expMatch ? expMatch[1] : '',
          strategy: '',
          credit: '',
          risk: '',
          rationale: '',
        };
        inRationale = false;
      }

      // Extract strategy
      if (currentSpread && line.startsWith('**Strategy:**')) {
        const stratMatch = line.match(/Strategy:\*\* (.*)/);
        if (stratMatch) currentSpread.strategy = stratMatch[1];
      }

      // Extract credit and risk
      if (currentSpread && line.startsWith('**Est. Credit:**')) {
        const parts = line.match(/Credit:\*\* \$([\d.]+).*Risk:\*\* \$([\d.]+)/);
        if (parts) {
          currentSpread.credit = parts[1];
          currentSpread.risk = parts[2];
        }
      }

      // Extract analysis/rationale
      if (currentSpread && line.startsWith('**Analysis:**')) {
        inRationale = true;
        continue;
      }

      if (currentSpread && inRationale && line.trim() && !line.startsWith('**') && !line.startsWith('###')) {
        currentSpread.rationale += (currentSpread.rationale ? ' ' : '') + line;
      }

      if (currentSpread && inRationale && (line.startsWith('###') || line.startsWith('---'))) {
        inRationale = false;
      }
    }

    if (currentSpread) data.spreads.push(currentSpread);
    return data;
  };

  // Load sample data on component mount
  useEffect(() => {
    const parsed = parseMarkdownAnalysis(sampleMarkdownData);
    setAnalysisData(parsed);
    
    // Simulate technical data
    setTechnicalData({
      price: parsed.referencePrice,
      change_pct: 2.45,
      volume: 2850000,
      indicators: Object.entries(parsed.indicators)
        .filter(([key]) => ['RSI', 'MACD_Value', 'Stoch_K', 'ATR', 'HV_30d', 'MFI'].includes(key))
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
      moving_averages: {
        'SMA_50': parsed.indicators['SMA_50'],
        'SMA_200': parsed.indicators['SMA_200'],
      },
      bullish_count: 8,
      bearish_count: 2,
    });
  }, []);

  const StrengthBadge = ({ strength }) => {
    const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';
    const colors = {
      'BULLISH': 'bg-green-600 text-green-100',
      'BEARISH': 'bg-red-600 text-red-100',
      'NEUTRAL': 'bg-gray-600 text-gray-100',
      'HIGH': 'bg-yellow-600 text-yellow-100',
    };
    
    let color = 'bg-gray-600 text-gray-100';
    Object.keys(colors).forEach(key => {
      if (strength?.includes(key)) color = colors[key];
    });
    
    return <span className={`${base} ${color}`}>{strength}</span>;
  };

  const IndicatorChart = () => {
    if (!technicalData?.indicators) return null;
    
    const chartData = Object.entries(technicalData.indicators).map(([name, value]) => ({
      name,
      value: typeof value === 'number' ? value : 0,
    }));

    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg mb-6">
        <h3 className="text-lg font-semibold mb-4 text-white">Key Technical Indicators</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="name" stroke="#999" />
            <YAxis stroke="#999" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #444' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const SpreadCard = ({ spread, index }) => {
    const isExpanded = expandedSpread === index;
    
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl shadow-lg border border-gray-600 overflow-hidden mb-4">
        <div 
          className="p-5 cursor-pointer hover:bg-gray-750 transition-colors"
          onClick={() => setExpandedSpread(isExpanded ? null : index)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-white mb-2">{spread.type}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Expiration:</span>
                  <p className="text-white font-mono">{spread.expiration}</p>
                </div>
                <div>
                  <span className="text-gray-400">Strategy:</span>
                  <p className="text-white font-mono text-sm">{spread.strategy}</p>
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
                <h5 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle size={18} />
                  AI Analysis
                </h5>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {spread.rationale || 'No analysis available'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-600">
                <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/30">
                  <div className="text-xs text-green-300 uppercase tracking-wide mb-1">Max Profit</div>
                  <div className="text-2xl font-bold text-green-400">${spread.credit}</div>
                  <div className="text-xs text-green-300 mt-1">If stock stays on profitable side</div>
                </div>
                <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/30">
                  <div className="text-xs text-red-300 uppercase tracking-wide mb-1">Max Risk</div>
                  <div className="text-2xl font-bold text-red-400">${spread.risk}</div>
                  <div className="text-xs text-red-300 mt-1">If stock moves against trade</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-800 rounded-lg w-1/3"></div>
            <div className="h-64 bg-gray-800 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-baseline gap-2 mb-4">
            <h1 className="text-5xl font-bold">{analysisData.ticker}</h1>
            <span className="text-gray-400">AI-Enhanced Options Analysis</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-gray-400">
            <span>📅 {analysisData.date}</span>
            <span>💰 Reference: ${analysisData.referencePrice?.toFixed(2)}</span>
          </div>
        </div>

        {/* Price & Volume Hero */}
        {technicalData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-6 rounded-xl border border-blue-700/50 shadow-lg">
              <div className="text-sm text-blue-200 uppercase tracking-wide mb-2">Current Price</div>
              <div className="text-4xl font-bold mb-2">${technicalData.price?.toFixed(2)}</div>
              <div className={`text-lg font-semibold ${technicalData.change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {technicalData.change_pct >= 0 ? '↑' : '↓'} {Math.abs(technicalData.change_pct).toFixed(2)}%
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-6 rounded-xl border border-purple-700/50 shadow-lg">
              <div className="text-sm text-purple-200 uppercase tracking-wide mb-2">Volume</div>
              <div className="text-4xl font-bold mb-2">{(technicalData.volume / 1000000).toFixed(1)}M</div>
              <div className="text-sm text-purple-300">shares traded</div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-6 rounded-xl border border-indigo-700/50 shadow-lg">
              <div className="text-sm text-indigo-200 uppercase tracking-wide mb-2">Signal Summary</div>
              <div className="flex gap-4 mt-2">
                <div>
                  <div className="text-2xl font-bold text-green-400">{technicalData.bullish_count}</div>
                  <div className="text-xs text-green-300">Bullish</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{technicalData.bearish_count}</div>
                  <div className="text-xs text-red-300">Bearish</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Indicators Chart */}
        <IndicatorChart />

        {/* Moving Averages */}
        {technicalData?.moving_averages && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg border border-gray-600 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-white">📊 Moving Averages</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(technicalData.moving_averages).map(([label, value]) => {
                const isAbove = technicalData.price > value;
                return (
                  <div key={label} className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="text-xs text-gray-300 uppercase tracking-wide mb-2">{label}</div>
                    <div className="text-2xl font-bold text-white mb-2">${value?.toFixed(2)}</div>
                    <div className={`text-xs font-medium ${isAbove ? 'text-green-400' : 'text-red-400'}`}>
                      {isAbove ? '↑ Price Above' : '↓ Price Below'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Spreads Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>📈</span> Credit Spread Strategies
          </h2>
          <div className="space-y-4">
            {analysisData.spreads.map((spread, idx) => (
              <SpreadCard key={idx} spread={spread} index={idx} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl border border-gray-600 text-center">
          <p className="text-gray-400 text-sm">
            💡 <strong>Disclaimer:</strong> This is hypothetical analysis for educational purposes only, not financial advice.
          </p>
        </div>

      </div>
    </div>
  );
}