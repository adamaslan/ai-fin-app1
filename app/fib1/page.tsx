// ============================================================================
// Fibonacci Chart Page - Next.js App Router
// ============================================================================
// File: app/fibonacci/page.tsx
//
// This page loads JSON analysis data and displays interactive Fibonacci charts

'use client';

import React, { useState, useCallback } from 'react';
import FibonacciChart from '../../components/FibonacciChart/page';

interface AnalysisData {
  metadata: {
    symbol: string;
    period: string;
    timestamp: string;
    price: number;
    price_change: number;
  };
  key_indicators: {
    [key: string]: number;
    RSI: number;
    MACD: number;
    ADX: number;
    ATR: number;
    Volatility: number;
  };
  signals: Array<{
    signal: string;
    desc: string;
    strength: string;
    category: string;
    ai_score?: number;
  }>;
}

export default function FibonacciChartPage() {
  const [jsonData, setJsonData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  // Handle JSON file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        // Validate JSON structure
        if (!json.metadata || !json.key_indicators || !json.signals) {
          throw new Error(
            'Invalid JSON format. Expected: metadata, key_indicators, signals'
          );
        }

        setJsonData(json);
        setLoading(false);
      } catch (err) {
        setError(`Error parsing JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Error reading file');
      setLoading(false);
    };

    reader.readAsText(file);
  }, []);

  // Sample data for demo (remove in production or use real data)
  const handleLoadSampleData = () => {
    const sampleData: AnalysisData = {
      metadata: {
        symbol: 'AAPL',
        period: '1y',
        timestamp: new Date().toISOString(),
        price: 185.42,
        price_change: 2.35,
      },
      key_indicators: {
        RSI: 65.3,
        MACD: 0.0456,
        ADX: 28.5,
        ATR: 2.15,
        Volatility: 18.5,
        SMA_10: 183.2,
        SMA_20: 181.5,
        SMA_50: 178.9,
        SMA_200: 175.3,
      },
      signals: [
        {
          signal: '1M FIB 61.8%',
          desc: 'Price at Fibonacci 61.8% (1 month)',
          strength: 'SIGNIFICANT',
          category: 'FIBONACCI_1M',
          ai_score: 82,
        },
        {
          signal: '3M FIB 38.2%',
          desc: 'Price at Fibonacci 38.2% (3 months)',
          strength: 'MODERATE',
          category: 'FIBONACCI_3M',
          ai_score: 71,
        },
        {
          signal: '6M FIB 50%',
          desc: 'Price at Fibonacci 50% (6 months)',
          strength: 'SIGNIFICANT',
          category: 'FIBONACCI_6M',
          ai_score: 78,
        },
        {
          signal: 'GOLDEN CROSS',
          desc: '50 MA crossed above 200 MA',
          strength: 'STRONG BULLISH',
          category: 'MA_CROSS',
          ai_score: 88,
        },
        {
          signal: 'RSI ABOVE 50',
          desc: 'RSI crossed into bullish zone',
          strength: 'BULLISH',
          category: 'RSI_CROSS',
          ai_score: 65,
        },
      ],
    };

    setJsonData(sampleData);
    setFileName('sample_analysis.json');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            📊 Fibonacci Retracement Chart
          </h1>
          <p className="text-gray-300 text-lg">
            Dynamic technical analysis visualization with Fibonacci levels
          </p>
        </div>

        {/* Upload Section */}
        {!jsonData && (
          <div className="bg-white rounded-lg shadow-2xl p-8 mb-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Load Analysis Data
                </h2>
                <p className="text-gray-600 mb-6">
                  Upload a JSON file from the Technical Signal Scanner to visualize
                  Fibonacci retracement levels and technical signals.
                </p>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-500 transition-colors">
                <div className="flex items-center justify-center">
                  <label className="cursor-pointer flex flex-col items-center gap-4 w-full">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-700">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">
                        JSON files only (*.json)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      disabled={loading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-semibold">⚠️ Error</p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">Loading JSON...</p>
                </div>
              )}

              {/* Current File */}
              {fileName && !loading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-semibold">✅ File loaded</p>
                  <p className="text-blue-600 text-sm">{fileName}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4 flex-wrap">
                <label className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg cursor-pointer transition-colors">
                  Choose File
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={handleLoadSampleData}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Load Sample Data
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2">📋 Instructions</h3>
                <ol className="text-gray-600 text-sm space-y-1 list-decimal list-inside">
                  <li>
                    Run the Technical Signal Scanner to generate JSON analysis
                  </li>
                  <li>Upload the generated JSON file here</li>
                  <li>View dynamic Fibonacci retracement charts</li>
                  <li>Toggle Fibonacci levels on/off</li>
                  <li>Switch between different timeframes</li>
                  <li>Hover for detailed price and level information</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Chart Section */}
        {jsonData && (
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
            <FibonacciChart
              jsonData={jsonData}
              height={600}
              showVolume={true}
              showRSI={true}
              defaultTimeframe="1M"
            />

            {/* Reset Button */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setJsonData(null);
                  setFileName('');
                  setError(null);
                }}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
              >
                Load Different File
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>
            Fibonacci Retracement Chart | Compatible with Technical Signal Scanner
            JSON output
          </p>
          <p className="mt-2">
            Version 1.0 • Built with Next.js & Recharts
          </p>
        </div>
      </div>
    </div>
  );
}