// components/TechnicalAnalysisDashboard.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Activity, AlertTriangle, 
  BarChart3, Brain, ChevronDown, ChevronUp, Search,
  Filter, Download, Calendar, DollarSign, Volume2,
  Target, Shield, Clock, Sparkles
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface Indicator {
  RSI: number;
  MACD: number;
  ADX: number;
  Stochastic: number;
  CCI: number;
  MFI: number;
  BB_Position: number;
  Volatility: number;
}

interface MovingAverage {
  SMA_10: number;
  SMA_20: number;
  SMA_50: number;
  SMA_200: number | null;
  EMA_10: number;
  EMA_20: number;
}

interface Signal {
  signal: string;
  desc: string;
  strength: string;
  category: string;
}

interface TechnicalData {
  symbol: string;
  timestamp: string;
  date: string;
  price: number;
  change_pct: number;
  volume: number;
  indicators: Indicator;
  moving_averages: MovingAverage;
  signals: Signal[];
  signal_count: number;
  bullish_count: number;
  bearish_count: number;
}

interface GeminiAnalysis {
  symbol: string;
  timestamp: string;
  date: string;
  analysis: string;
  signal_count: number;
  signals_analyzed: Signal[];
}

interface Props {
  technicalData: TechnicalData;
  geminiAnalysis?: GeminiAnalysis;
  className?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getSignalColor = (strength: string): string => {
  if (strength.includes('BULLISH')) return 'text-green-600 bg-green-50 border-green-200';
  if (strength.includes('BEARISH')) return 'text-red-600 bg-red-50 border-red-200';
  if (strength.includes('NEUTRAL')) return 'text-gray-600 bg-gray-50 border-gray-200';
  if (strength.includes('WATCH')) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (strength.includes('VOLATILE')) return 'text-purple-600 bg-purple-50 border-purple-200';
  return 'text-blue-600 bg-blue-50 border-blue-200';
};

const getIndicatorStatus = (name: string, value: number): { color: string; status: string } => {
  switch (name) {
    case 'RSI':
      if (value < 30) return { color: 'text-green-600', status: 'Oversold' };
      if (value > 70) return { color: 'text-red-600', status: 'Overbought' };
      return { color: 'text-gray-600', status: 'Neutral' };
    
    case 'Stochastic':
      if (value < 20) return { color: 'text-green-600', status: 'Oversold' };
      if (value > 80) return { color: 'text-red-600', status: 'Overbought' };
      return { color: 'text-gray-600', status: 'Neutral' };
    
    case 'ADX':
      if (value > 25) return { color: 'text-blue-600', status: 'Strong Trend' };
      if (value < 20) return { color: 'text-gray-600', status: 'Weak Trend' };
      return { color: 'text-gray-600', status: 'Moderate' };
    
    case 'MFI':
      if (value < 20) return { color: 'text-green-600', status: 'Oversold' };
      if (value > 80) return { color: 'text-red-600', status: 'Overbought' };
      return { color: 'text-gray-600', status: 'Neutral' };
    
    default:
      return { color: 'text-gray-600', status: 'Normal' };
  }
};

const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals);
};

const formatVolume = (vol: number): string => {
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(2)}K`;
  return vol.toString();
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const StatCard: React.FC<{
  label: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}> = ({ label, value, change, icon, trend }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <div className="text-gray-400">{icon}</div>
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    {change !== undefined && (
      <div className={`flex items-center mt-1 text-sm ${
        change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
      }`}>
        {change > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
        {Math.abs(change).toFixed(2)}%
      </div>
    )}
  </div>
);

const IndicatorCard: React.FC<{
  name: string;
  value: number;
  max?: number;
}> = ({ name, value, max = 100 }) => {
  const { color, status } = getIndicatorStatus(name, value);
  const percentage = (value / max) * 100;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <span className={`text-xs font-semibold ${color}`}>{status}</span>
      </div>
      <div className="text-xl font-bold text-gray-900 mb-2">
        {formatNumber(value, name === 'MACD' ? 4 : 1)}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            value < 30 || (name === 'Stochastic' && value < 20)
              ? 'bg-green-500'
              : value > 70 || (name === 'Stochastic' && value > 80)
              ? 'bg-red-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

const SignalBadge: React.FC<{ signal: Signal }> = ({ signal }) => {
  const colorClass = getSignalColor(signal.strength);
  
  return (
    <div className={`border rounded-lg p-3 ${colorClass}`}>
      <div className="flex items-start justify-between mb-1">
        <span className="font-semibold text-sm">{signal.signal}</span>
        <span className="text-xs font-medium px-2 py-1 rounded bg-white/50">
          {signal.category}
        </span>
      </div>
      <p className="text-xs mt-1">{signal.desc}</p>
      <span className="text-xs font-medium mt-2 inline-block">{signal.strength}</span>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TechnicalAnalysisDashboard: React.FC<Props> = ({
  technicalData,
  geminiAnalysis,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'ai'>('overview');
  const [signalFilter, setSignalFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    indicators: true,
    movingAverages: true,
    signals: true,
    aiAnalysis: true
  });

  // Filter signals based on search and filter
  const filteredSignals = useMemo(() => {
    return technicalData.signals.filter(signal => {
      const matchesSearch = signal.signal.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          signal.desc.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (signalFilter === 'all') return true;
      if (signalFilter === 'bullish') return signal.strength.includes('BULLISH');
      if (signalFilter === 'bearish') return signal.strength.includes('BEARISH');
      if (signalFilter === 'neutral') return signal.strength.includes('NEUTRAL') || signal.strength.includes('WATCH');
      
      return true;
    });
  }, [technicalData.signals, signalFilter, searchTerm]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const downloadJSON = () => {
    const data = { technicalData, geminiAnalysis };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${technicalData.symbol}-analysis-${technicalData.date}.json`;
    a.click();
  };

  return (
    <div className={`w-full max-w-7xl mx-auto p-4 space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{technicalData.symbol}</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {technicalData.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {technicalData.timestamp}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={downloadJSON}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Current Price"
          value={`$${formatNumber(technicalData.price)}`}
          change={technicalData.change_pct}
          icon={<DollarSign className="w-5 h-5" />}
          trend={technicalData.change_pct > 0 ? 'up' : 'down'}
        />
        <StatCard
          label="Volume"
          value={formatVolume(technicalData.volume)}
          icon={<Volume2 className="w-5 h-5" />}
        />
        <StatCard
          label="Total Signals"
          value={technicalData.signal_count.toString()}
          icon={<Activity className="w-5 h-5" />}
        />
        <StatCard
          label="Bullish Signals"
          value={technicalData.bullish_count.toString()}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Signal Sentiment */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Signal Sentiment</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 w-20">Bullish</span>
            <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
              <div
                className="bg-green-500 h-4 rounded-full transition-all"
                style={{ width: `${(technicalData.bullish_count / technicalData.signal_count) * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold text-green-600 w-12 text-right">
              {technicalData.bullish_count}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 w-20">Bearish</span>
            <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
              <div
                className="bg-red-500 h-4 rounded-full transition-all"
                style={{ width: `${(technicalData.bearish_count / technicalData.signal_count) * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold text-red-600 w-12 text-right">
              {technicalData.bearish_count}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 w-20">Neutral</span>
            <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
              <div
                className="bg-gray-400 h-4 rounded-full transition-all"
                style={{
                  width: `${((technicalData.signal_count - technicalData.bullish_count - technicalData.bearish_count) / technicalData.signal_count) * 100}%`
                }}
              />
            </div>
            <span className="text-sm font-bold text-gray-600 w-12 text-right">
              {technicalData.signal_count - technicalData.bullish_count - technicalData.bearish_count}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('signals')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'signals'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Signals ({technicalData.signal_count})
            </div>
          </button>
          {geminiAnalysis && (
            <button
              onClick={() => setActiveTab('ai')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'ai'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Analysis
                <Sparkles className="w-3 h-3" />
              </div>
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Indicators */}
          <div className="bg-white rounded-lg border border-gray-200">
            <button
              onClick={() => toggleSection('indicators')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">Key Indicators</h3>
              {expandedSections.indicators ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.indicators && (
              <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <IndicatorCard name="RSI" value={technicalData.indicators.RSI} />
                <IndicatorCard name="Stochastic" value={technicalData.indicators.Stochastic} />
                <IndicatorCard name="ADX" value={technicalData.indicators.ADX} />
                <IndicatorCard name="MFI" value={technicalData.indicators.MFI} />
                <IndicatorCard name="CCI" value={technicalData.indicators.CCI} max={200} />
                <IndicatorCard name="MACD" value={technicalData.indicators.MACD} max={10} />
                <IndicatorCard name="BB Position" value={technicalData.indicators.BB_Position * 100} />
                <IndicatorCard name="Volatility" value={technicalData.indicators.Volatility} max={100} />
              </div>
            )}
          </div>

          {/* Moving Averages */}
          <div className="bg-white rounded-lg border border-gray-200">
            <button
              onClick={() => toggleSection('movingAverages')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">Moving Averages</h3>
              {expandedSections.movingAverages ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.movingAverages && (
              <div className="p-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(technicalData.moving_averages).map(([key, value]) => {
                    if (value === null) return null;
                    const distance = ((technicalData.price - value) / value) * 100;
                    return (
                      <div key={key} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{key.replace('_', ' ')}</span>
                          <span className={`text-xs font-semibold ${
                            distance > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {distance > 0 ? '+' : ''}{formatNumber(distance)}%
                          </span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          ${formatNumber(value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Top Signals Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Signals</h3>
              <button
                onClick={() => setActiveTab('signals')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {technicalData.signals.slice(0, 6).map((signal, idx) => (
                <SignalBadge key={idx} signal={signal} />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'signals' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search signals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'bullish', 'bearish', 'neutral'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSignalFilter(filter)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm capitalize transition-colors ${
                      signalFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredSignals.length} of {technicalData.signal_count} signals
            </div>
          </div>

          {/* Signals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSignals.map((signal, idx) => (
              <SignalBadge key={idx} signal={signal} />
            ))}
          </div>

          {filteredSignals.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No signals match your filters</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ai' && geminiAnalysis && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Gemini AI Analysis</h3>
                <p className="text-sm text-gray-600">AI-powered insights and recommendations</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                {geminiAnalysis.analysis}
              </pre>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
              <Shield className="w-4 h-4" />
              <span>Analyzed {geminiAnalysis.signal_count} signals</span>
              <span>•</span>
              <span>{geminiAnalysis.timestamp}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicalAnalysisDashboard;