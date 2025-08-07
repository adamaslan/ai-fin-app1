import prisma from "../lib/prisma"; // Direct server-side import
import { format } from 'date-fns';
import Link from 'next/link'; // For date formatting

// Define the type for a SpreadSuggestion, matching your Prisma schema
interface SpreadSuggestion {
  id: number;
  stock_symbol: string;
  timeframe: string;
  call_type: string;
  call_max_profit: string;
  call_max_loss: string;
  call_breakeven: string;
  put_type: string;
  put_max_profit: string;
  put_max_loss: string;
  put_breakeven: string;
  technical_justification: string[];
  expiration_date: Date;
  expected_move: number;
  // Add relation to stock data
  stock_data?: StockData;
}

// Define the type for StockData
interface StockData {
  symbol: string;
  indicators_symbol: string;
  indicators_timestamp: Date;
  price: number;
  change: number;
  change_percent: number;
  // volume: number;        // Commented out due to BigInt type mismatch
  // avg_volume: number;    // Commented out due to BigInt type mismatch
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
  last_updated: Date;
  is_updating: boolean;
}

export default async function SpreadSuggestionsPage() {
  // Data fetching logic with stock data relation
  const suggestions = await prisma.spread_suggestions.findMany({
    include: {
      stock_data: true, // Include the related stock data
    },
    orderBy: { expiration_date: 'desc' },
  });

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Latest Spread Suggestions</h1>

      {suggestions.length === 0 ? (
        <p>No spread suggestions found.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
          {suggestions.map((sugg: SpreadSuggestion) => (
            <article key={sugg.id} className="border rounded-2xl p-6 shadow-lg">
              <header className="mb-6">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-2xl font-semibold">
                    {sugg.stock_symbol} — {sugg.timeframe}
                  </h2>
                  {sugg.stock_data && (
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        ${sugg.stock_data.price.toFixed(2)}
                      </div>
                      <div className={`text-sm ${
                        sugg.stock_data.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {sugg.stock_data.change >= 0 ? '+' : ''}
                        {sugg.stock_data.change.toFixed(2)} 
                        ({sugg.stock_data.change_percent.toFixed(2)}%)
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <p>Expires: {format(sugg.expiration_date, 'MMMM dd, yyyy')}</p>
                  <p>Expected Move: {sugg.expected_move?.toFixed(2)}</p>
                </div>

                {/* Stock Data Technical Indicators */}
                {sugg.stock_data && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold mb-3 text-gray-800">Market Data & Indicators</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">RSI:</span>
                        <span className={`ml-1 font-medium ${
                          sugg.stock_data.rsi > 70 ? 'text-red-600' : 
                          sugg.stock_data.rsi < 30 ? 'text-green-600' : 'text-gray-800'
                        }`}>
                          {sugg.stock_data.rsi.toFixed(1)}
                        </span>
                      </div>
                      
                      {/* <div>
                        <span className="text-gray-500">Volume:</span>
                        <span className="ml-1 font-medium text-gray-800">
                          {(sugg.stock_data.volume / 1000000).toFixed(1)}M
                        </span>
                      </div> */}
                      
                      <div>
                        <span className="text-gray-500">EMA 10:</span>
                        <span className="ml-1 font-medium text-gray-800">
                          ${sugg.stock_data.ema_10.toFixed(2)}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">SMA 50:</span>
                        <span className="ml-1 font-medium text-gray-800">
                          ${sugg.stock_data.sma_50.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-between items-center">
                      <div>
                        <span className="text-gray-500">Bias:</span>
                        <span className={`ml-1 font-semibold ${
                          sugg.stock_data.market_bias.toLowerCase() === 'bullish' ? 'text-green-600' :
                          sugg.stock_data.market_bias.toLowerCase() === 'bearish' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {sugg.stock_data.market_bias}
                        </span>
                        <span className="ml-1 text-sm text-gray-500">
                          ({sugg.stock_data.bias_strength.toFixed(1)})
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Recommendation:</span>
                        <span className="ml-1 font-semibold text-blue-600">
                          {sugg.stock_data.overall_recommendation}
                        </span>
                      </div>
                    </div>

                    {/* Support and Resistance Levels */}
                    {(sugg.stock_data.support_levels.length > 0 || sugg.stock_data.resistance_levels.length > 0) && (
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        {sugg.stock_data.support_levels.length > 0 && (
                          <div>
                            <span className="text-gray-500">Support:</span>
                            <div className="text-green-600 font-medium">
                              {sugg.stock_data.support_levels.slice(0, 2).map(level => `$${level.toFixed(2)}`).join(', ')}
                            </div>
                          </div>
                        )}
                        {sugg.stock_data.resistance_levels.length > 0 && (
                          <div>
                            <span className="text-gray-500">Resistance:</span>
                            <div className="text-red-600 font-medium">
                              {sugg.stock_data.resistance_levels.slice(0, 2).map(level => `$${level.toFixed(2)}`).join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </header>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <section className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Call Leg</h3>
                  <ul className="space-y-1 text-sm">
                    <li><span className="text-gray-600">Type:</span> <span className="font-medium">{sugg.call_type}</span></li>
                    <li><span className="text-gray-600">Max Profit:</span> <span className="font-medium text-green-600">{sugg.call_max_profit}</span></li>
                    <li><span className="text-gray-600">Max Loss:</span> <span className="font-medium text-red-600">{sugg.call_max_loss}</span></li>
                    <li><span className="text-gray-600">Breakeven:</span> <span className="font-medium">{sugg.call_breakeven}</span></li>
                  </ul>
                </section>

                <section className="bg-red-50 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">Put Leg</h3>
                  <ul className="space-y-1 text-sm">
                    <li><span className="text-gray-600">Type:</span> <span className="font-medium">{sugg.put_type}</span></li>
                    <li><span className="text-gray-600">Max Profit:</span> <span className="font-medium text-green-600">{sugg.put_max_profit}</span></li>
                    <li><span className="text-gray-600">Max Loss:</span> <span className="font-medium text-red-600">{sugg.put_max_loss}</span></li>
                    <li><span className="text-gray-600">Breakeven:</span> <span className="font-medium">{sugg.put_breakeven}</span></li>
                  </ul>
                </section>
              </div>

              <section className="mb-6">
                <h3 className="font-semibold mb-2">Technical Justification</h3>
                <ul className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  {sugg.technical_justification.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </section>

              <div className="flex justify-between items-center pt-4 border-t">
                {sugg.stock_data && (
                  <div className="text-xs text-gray-500">
                    Last updated: {format(sugg.stock_data.last_updated, 'MMM dd, HH:mm')}
                    {sugg.stock_data.is_updating && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Updating...
                      </span>
                    )}
                  </div>
                )}
                
                <Link href="/DataPage-AG-1">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
                    View in AG Grid
                  </button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}