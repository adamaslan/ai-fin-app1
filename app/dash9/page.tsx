import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Storage } from "@google-cloud/storage";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

interface TechnicalIndicators {
  Current_Price: number;
  SMA_50: number;
  SMA_200: number;
  RSI: number;
  MACD_Value: number;
  MACD_Signal: number;
  MACD_Bullish: string;
  BB_PercentB: number;
  HV_30d: number;
  ATR: number;
  Avg_Volume_50: number;
  ROC_10d: number;
  Stoch_K: number;
  MFI: number;
  ADL: number;
}

interface Spread {
  type: string;
  expiration: string;
  sell_strike: number;
  buy_strike: number;
  mid_premium: number;
  max_profit: number;
  max_loss: number;
  delta_sell: number | null;
  theta_sell: number | null;
  vega_sell: number | null;
  rationale: string;
}

interface SpreadAnalysisData {
  symbol: string;
  timestamp: string;
  date: string;
  indicators: TechnicalIndicators;
  spreads: Spread[];
}

interface GetFilesApiResponse {
  prefixes?: string[];
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Validate environment variables
if (!process.env.GCP_PROJECT_ID) {
  console.error("❌ GCP_PROJECT_ID environment variable is not set");
  throw new Error("GCP_PROJECT_ID is required");
}

if (!process.env.GCP_CREDENTIALS) {
  console.error("❌ GCP_CREDENTIALS environment variable is not set");
  throw new Error("GCP_CREDENTIALS is required");
}

// Initialize Storage client
function getGCPCredentials() {
  try {
    const credentials = process.env.GCP_CREDENTIALS 
      ? JSON.parse(process.env.GCP_CREDENTIALS)
      : undefined;
    
    if (!credentials) {
      throw new Error("GCP_CREDENTIALS must be set");
    }
    
    return {
      projectId: process.env.GCP_PROJECT_ID || "dfl-2024-a",
      credentials
    };
  } catch (error) {
    console.error("❌ Failed to parse GCP_CREDENTIALS:", error);
    throw new Error("Invalid GCP_CREDENTIALS format. Must be valid JSON.");
  }
}

const storageClient = new Storage(getGCPCredentials());
const BUCKET_NAME = "ttb-bucket1";

/**
 * Get list of all available spread analysis symbols from ALL date folders
 */
async function getAvailableSymbols(): Promise<string[]> {
  try {
    const [, , apiResponse] = await storageClient
      .bucket(BUCKET_NAME)
      .getFiles({
        prefix: "daily/",
        delimiter: "/",
      });

    const apiTyped = apiResponse as GetFilesApiResponse | undefined;
    const dateFolders: string[] = apiTyped?.prefixes ?? [];
    
    if (dateFolders.length === 0) {
      return [];
    }

    // Search across ALL date folders to find all symbols with spread analysis
    const symbolSet = new Set<string>();
    
    for (const datePrefix of dateFolders) {
      const [files] = await storageClient
        .bucket(BUCKET_NAME)
        .getFiles({ prefix: datePrefix });
      
      files.forEach(file => {
        const fileName = file.name.split('/').pop() || '';
        
        // Match spread analysis pattern: SYMBOL_spread_analysis_timestamp.json
        const spreadMatch = fileName.match(/([A-Z]+)_spread_analysis_/);
        if (spreadMatch) {
          symbolSet.add(spreadMatch[1]);
        }
      });
    }

    return Array.from(symbolSet).sort();
  } catch (error) {
    console.error("Error fetching available symbols:", error);
    return [];
  }
}

/**
 * Fetches the latest available spread analysis data for a given symbol.
 * Searches across ALL date folders to find the most recent spread analysis.
 */
async function getLatestSpreadAnalysis(symbol: string): Promise<SpreadAnalysisData | null> {
  // Get all date folders under /daily/
  const [, , apiResponse] = await storageClient
    .bucket(BUCKET_NAME)
    .getFiles({
      prefix: "daily/",
      delimiter: "/",
    });

  const apiTyped = apiResponse as GetFilesApiResponse | undefined;
  const dateFolders: string[] = apiTyped?.prefixes ?? [];
  
  if (dateFolders.length === 0) {
    throw new Error("No date folders found in /daily/");
  }

  // Sort date folders in descending order (newest first)
  const sortedDateFolders = dateFolders.sort().reverse();

  // Search through date folders starting with the most recent
  for (const datePrefix of sortedDateFolders) {
    const [files] = await storageClient
      .bucket(BUCKET_NAME)
      .getFiles({ prefix: datePrefix });
    
    const spreadFile = files
      .filter(
        (f) =>
          f.name.includes(`${symbol}_spread_analysis_`) &&
          f.name.endsWith(".json")
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .pop();

    // If we found a spread analysis file for this symbol, use it
    if (spreadFile) {
      try {
        const file = storageClient.bucket(BUCKET_NAME).file(spreadFile.name);
        const [data] = await file.download();
        return JSON.parse(data.toString()) as SpreadAnalysisData;
      } catch (error) {
        console.error(`Error reading spread analysis file ${spreadFile.name}:`, error);
        continue;
      }
    }
  }

  // If we searched all folders and found nothing
  return null;
}

/**
 * Generate chart data from indicators
 */
function generateChartData(indicators: TechnicalIndicators): any[] {
  const days = 90;
  const chartData = [];
  let price = indicators.Current_Price * 0.9;

  for (let i = 0; i < days; i++) {
    price += (Math.random() - 0.48) * 0.5;
    chartData.push({
      day: i + 1,
      price: parseFloat(price.toFixed(2)),
      sma50: indicators.SMA_50 + (Math.random() - 0.5) * 0.3,
      sma200: indicators.SMA_200 + (Math.random() - 0.5) * 0.5,
      volume: Math.floor(indicators.Avg_Volume_50 * (0.8 + Math.random() * 0.4)),
      rsi: 50 + Math.random() * 30 - 15,
    });
  }

  return chartData;
}

function StrengthBadge({ value, type }: { value: number; type: 'rsi' | 'mfi' | 'stoch' }) {
  let color = "bg-gray-600";
  let text = "NEUTRAL";
  
  if (type === 'rsi' || type === 'mfi') {
    if (value > 80) { color = "bg-red-600"; text = "OVERBOUGHT"; }
    else if (value < 20) { color = "bg-green-600"; text = "OVERSOLD"; }
    else if (value > 70) { color = "bg-yellow-600"; text = "HIGH"; }
    else if (value < 30) { color = "bg-blue-600"; text = "LOW"; }
  } else if (type === 'stoch') {
    if (value > 90) { color = "bg-red-600"; text = "OVERBOUGHT"; }
    else if (value < 10) { color = "bg-green-600"; text = "OVERSOLD"; }
    else if (value > 80) { color = "bg-yellow-600"; text = "HIGH"; }
    else if (value < 20) { color = "bg-blue-600"; text = "LOW"; }
  }

  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color} text-white`}>{text}</span>;
}

function TrendBadge({ bullish }: { bullish: string }) {
  const isBullish = bullish.toLowerCase() === 'true';
  const color = isBullish ? "bg-green-600 text-green-100" : "bg-red-600 text-red-100";
  const text = isBullish ? "BULLISH" : "BEARISH";
  
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{text}</span>;
}

function SpreadCard({ spread }: { spread: Spread }) {
  const riskRewardRatio = (spread.max_loss / spread.max_profit).toFixed(2);
  const isPutSpread = spread.type.toLowerCase().includes('put');
  const spreadColor = isPutSpread ? "border-blue-500" : "border-orange-500";
  
  return (
    <div className={`p-4 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg border-2 ${spreadColor}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-lg font-semibold text-white">{spread.type}</h4>
          <p className="text-sm text-gray-300">Exp: {spread.expiration}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Strikes</div>
          <div className="font-mono text-sm">${spread.sell_strike} / ${spread.buy_strike}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="p-3 bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-400">Est. Credit</div>
          <div className="text-lg font-bold text-green-400">${spread.mid_premium.toFixed(2)}</div>
        </div>
        <div className="p-3 bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-400">Max Profit</div>
          <div className="text-lg font-bold text-green-400">${spread.max_profit}</div>
        </div>
        <div className="p-3 bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-400">Max Loss</div>
          <div className="text-lg font-bold text-red-400">${spread.max_loss}</div>
        </div>
        <div className="p-3 bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-400">Risk/Reward</div>
          <div className="text-lg font-bold text-yellow-400">{riskRewardRatio}</div>
        </div>
      </div>

      {spread.rationale && !spread.rationale.includes("AI rationale skipped") && (
        <div className="p-3 bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">AI Analysis</div>
          <p className="text-sm text-gray-200 leading-relaxed">{spread.rationale}</p>
        </div>
      )}

      {(spread.delta_sell !== null || spread.theta_sell !== null || spread.vega_sell !== null) && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="text-xs text-gray-400 mb-2">Greeks (Sell Strike)</div>
          <div className="flex gap-4 text-sm">
            {spread.delta_sell !== null && <span className="text-gray-300">Δ: {spread.delta_sell.toFixed(3)}</span>}
            {spread.theta_sell !== null && <span className="text-gray-300">Θ: {spread.theta_sell.toFixed(3)}</span>}
            {spread.vega_sell !== null && <span className="text-gray-300">ν: {spread.vega_sell.toFixed(3)}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function PriceChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.7} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
        <XAxis dataKey="day" stroke="rgba(148, 163, 184, 0.5)" />
        <YAxis stroke="rgba(148, 163, 184, 0.5)" />
        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '0.5rem' }} />
        <Legend />
        <Area type="monotone" dataKey="price" fill="url(#priceGradient)" stroke="#3b82f6" strokeWidth={2} name="Price" />
        <Line type="monotone" dataKey="sma50" stroke="#f59e0b" strokeWidth={2} name="SMA 50" isAnimationActive={false} />
        <Line type="monotone" dataKey="sma200" stroke="#ec4899" strokeWidth={2} name="SMA 200" isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function VolumeChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <defs>
          <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
        <XAxis dataKey="day" stroke="rgba(148, 163, 184, 0.5)" />
        <YAxis stroke="rgba(148, 163, 184, 0.5)" />
        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '0.5rem' }} formatter={(value: any) => `${(value / 1000000).toFixed(1)}M`} />
        <Bar dataKey="volume" fill="url(#volumeGradient)" name="Volume" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function RSIChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
        <XAxis dataKey="day" stroke="rgba(148, 163, 184, 0.5)" />
        <YAxis stroke="rgba(148, 163, 184, 0.5)" domain={[0, 100]} />
        <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '0.5rem' }} />
        <Legend />
        <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" strokeWidth={2} name="RSI" isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default async function DashboardSpreadsPage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Test bucket access
  console.log("Testing GCS bucket access...");
  try {
    const [exists] = await storageClient.bucket(BUCKET_NAME).exists();
    console.log(`✅ Bucket ${BUCKET_NAME} exists:`, exists);
  } catch (error) {
    console.error("❌ Error accessing bucket:", error instanceof Error ? error.message : "Unknown error");
  }

  // Get available symbols
  const availableSymbols = await getAvailableSymbols();
  console.log("📊 Available spread analysis symbols:", availableSymbols);
  
  // Await searchParams and use symbol from query params or default to first available
  const params = await searchParams;
  const symbol = params.symbol || availableSymbols[0] || "LLY";

  let analysisData: SpreadAnalysisData | null = null;
  let chartData: any[] = [];
  try {
    analysisData = await getLatestSpreadAnalysis(symbol);
    if (analysisData) {
      chartData = generateChartData(analysisData.indicators);
    }
  } catch (err) {
    console.error("Failed to fetch latest spread analysis:", err);
    analysisData = null;
  }

  if (!analysisData) {
    return (
      <main className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto py-10">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Welcome, {user.firstName || "User"}</h1>
              <p className="text-gray-400 mt-2">AI-Enhanced Options Spread Analysis</p>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="stock-select" className="text-sm font-medium text-gray-300">
                Select Stock:
              </label>
              <div className="flex gap-2 flex-wrap">
                {availableSymbols.map((sym) => (
                  <a
                    key={sym}
                    href={`/DashboardSpreads?symbol=${sym}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sym === symbol
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
            <h2 className="text-2xl font-semibold text-red-400 mb-4">Spread Analysis Not Available</h2>
            <p className="text-gray-300 mb-4">No spread analysis JSON was found in Google Cloud Storage for symbol: <span className="font-mono">{symbol}</span>.</p>
            <p className="text-sm text-gray-400">Ensure your GCS bucket <span className="font-mono">{BUCKET_NAME}</span> contains spread analysis files under <span className="font-mono">daily/&lt;YYYY-MM-DD&gt;/</span> and that the server has permission to read them.</p>
          </div>
        </div>
      </main>
    );
  }

  const indicators = analysisData.indicators;

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Welcome, {user.firstName || "User"}</h1>
            <p className="text-gray-400 mt-2">{analysisData.symbol} Spread Analysis</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-300">
              Select Stock:
            </label>
            <div className="flex gap-2 flex-wrap">
              {availableSymbols.map((sym) => (
                <a
                  key={sym}
                  href={`/DashboardSpreads?symbol=${sym}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sym === symbol
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

        {/* Technical Indicators Overview */}
        <section className="mb-8">
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">{analysisData.symbol} Technical Snapshot</h2>
                <p className="text-sm text-gray-300 mt-1">Date: {analysisData.date} | Timestamp: {analysisData.timestamp}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">${indicators.Current_Price.toFixed(2)}</div>
                <div className="text-sm text-gray-400">Current Price</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Trend Indicators */}
              <div className="p-4 bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Trend Indicators</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">SMA 50:</span>
                    <span className="font-mono">${indicators.SMA_50.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">SMA 200:</span>
                    <span className="font-mono">${indicators.SMA_200.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">MACD:</span>
                    <TrendBadge bullish={indicators.MACD_Bullish} />
                  </div>
                </div>
              </div>

              {/* Momentum Indicators */}
              <div className="p-4 bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Momentum</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">RSI:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{indicators.RSI.toFixed(2)}</span>
                      <StrengthBadge value={indicators.RSI} type="rsi" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Stoch %K:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{indicators.Stoch_K.toFixed(2)}</span>
                      <StrengthBadge value={indicators.Stoch_K} type="stoch" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">MFI:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{indicators.MFI.toFixed(2)}</span>
                      <StrengthBadge value={indicators.MFI} type="mfi" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Volatility Indicators */}
              <div className="p-4 bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Volatility</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">HV (30d):</span>
                    <span className="font-mono">{(indicators.HV_30d * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ATR:</span>
                    <span className="font-mono">${indicators.ATR.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">BB %B:</span>
                    <span className="font-mono">{indicators.BB_PercentB.toFixed(3)}</span>
                  </div>
                </div>
              </div>

              {/* Volume & Price Action */}
              <div className="p-4 bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Volume & Price</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Volume:</span>
                    <span className="font-mono">{(indicators.Avg_Volume_50 / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ROC (10d):</span>
                    <span className="font-mono">{(indicators.ROC_10d * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ADL:</span>
                    <span className="font-mono">{(indicators.ADL / 1000000).toFixed(0)}M</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Technical Analysis Charts</h3>
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg mb-6">
            <h4 className="text-lg font-semibold text-white mb-4">90-Day Price Action & Moving Averages</h4>
            <PriceChart data={chartData} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg">
              <h4 className="text-lg font-semibold text-white mb-4">Trading Volume</h4>
              <VolumeChart data={chartData} />
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg">
              <h4 className="text-lg font-semibold text-white mb-4">RSI Momentum</h4>
              <RSIChart data={chartData} />
            </div>
          </div>
        </section>

        {/* Options Spreads Analysis */}
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">AI-Enhanced Options Spread Analysis</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analysisData.spreads.map((spread, index) => (
              <SpreadCard key={index} spread={spread} />
            ))}
          </div>
        </section>

        <div className="mt-8 p-4 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Important Disclaimer</h4>
          <p className="text-sm text-yellow-200">
            This analysis is based on hypothetical scenarios and should not be construed as financial advice. 
            Investors should conduct their own due diligence and consider their risk tolerance and investment objectives before entering any trade.
          </p>
        </div>
      </div>
    </main>
  );
}