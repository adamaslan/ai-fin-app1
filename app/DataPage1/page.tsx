// app/spread-suggestions/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function SpreadSuggestionsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Fetching data...');
        const res = await fetch('/api/spread-suggestions');
        console.log('Response status:', res.status);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const result = await res.json();
        console.log('Data received:', result);
        setData(result);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">Error: {error}</div>
          <div className="text-sm">Check the browser console for more details</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">No data received</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Options Spread Suggestions</h1>
          
          {/* Debug: Show raw data */}
       
       

          {/* Basic Info */}
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Symbol</div>
                <div className="font-semibold">{(data as any)?.stock_symbol || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Timeframe</div>
                <div className="font-semibold">{data.timeframe || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Expiration</div>
                <div className="font-semibold">{data.expiration_date || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Expected Move</div>
                <div className="font-semibold">
                  {data.expected_move ? `${(data.expected_move * 100).toFixed(1)}%` : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Call Spread */}
            <div className="border border-green-200 rounded-lg p-4">
              <h2 className="text-lg font-bold text-green-800 mb-4">
                Call Spread - {data.call_type || 'N/A'}
              </h2>
              <div className="space-y-2">
                <div>Short Strike: ${data.call_short_strike || 'N/A'}</div>
                <div>Long Strike: ${data.call_long_strike || 'N/A'}</div>
                <div>Width: ${data.call_width || 'N/A'}</div>
                <div>Breakeven: {data.call_breakeven || 'N/A'}</div>
                <div>Max Profit: {data.call_max_profit || 'N/A'}</div>
                <div>Max Loss: {data.call_max_loss || 'N/A'}</div>
              </div>
            </div>

            {/* Put Spread */}
            <div className="border border-red-200 rounded-lg p-4">
              <h2 className="text-lg font-bold text-red-800 mb-4">
                Put Spread - {data.put_type || 'N/A'}
              </h2>
              <div className="space-y-2">
                <div>Short Strike: ${data.put_short_strike || 'N/A'}</div>
                <div>Long Strike: ${data.put_long_strike || 'N/A'}</div>
                <div>Width: ${data.put_width || 'N/A'}</div>
                <div>Breakeven: {data.put_breakeven || 'N/A'}</div>
                <div>Max Profit: {data.put_max_profit || 'N/A'}</div>
                <div>Max Loss: {data.put_max_loss || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Technical Justification */}
          {data.technical_justification && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-3">Technical Analysis</h3>
              <div className="space-y-1">
                {Object.entries(data.technical_justification).map(([key, value]) => (
                  <div key={key}>• {value}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}