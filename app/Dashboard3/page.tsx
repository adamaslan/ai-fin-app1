import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Storage } from "@google-cloud/storage";

interface TechnicalDataResponse {
  technicalData: Record<string, unknown> | null;
  geminiAnalysis: Record<string, unknown> | null;
  date: string;
}

interface GetFilesApiResponse {
  prefixes?: string[];
}

interface AnalysisSignal {
  signal: string;
  desc: string;
  strength: string;
  category: string;
}

interface Indicators {
  RSI: number;
  MACD: number;
  ADX: number;
  Stochastic: number;
  CCI: number;
  MFI: number;
  BB_Position: number;
  Volatility: number;
}

interface MovingAverages {
  SMA_10: number;
  SMA_20: number;
  SMA_50: number;
  SMA_200: number;
  EMA_10: number;
  EMA_20: number;
}

interface AnalysisData {
  symbol: string;
  timestamp: string;
  date: string;
  price: number;
  change_pct: number;
  volume: number;
  indicators: Indicators;
  moving_averages: MovingAverages;
  signals: AnalysisSignal[];
  signal_count: number;
  bullish_count: number;
  bearish_count: number;
  analysis?: string;
  risk?: string[];
  key_levels?: string[];
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
 * Get list of all available symbols from ALL date folders
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

    // Search across ALL date folders to find all symbols
    const symbolSet = new Set<string>();
    
    for (const datePrefix of dateFolders) {
      const [files] = await storageClient
        .bucket(BUCKET_NAME)
        .getFiles({ prefix: datePrefix });
      
      files.forEach(file => {
        const fileName = file.name.split('/').pop() || '';
        
        // Match signals_SYMBOL_ pattern (case-insensitive)
        const signalsMatch = fileName.match(/signals_([A-Z]+)_/i);
        if (signalsMatch) {
          symbolSet.add(signalsMatch[1].toUpperCase());
        }
        
        // Match SYMBOL_gemini_analysis pattern (case-insensitive)
        const geminiMatch = fileName.match(/([A-Z]+)_gemini_analysis_/i);
        if (geminiMatch) {
          symbolSet.add(geminiMatch[1].toUpperCase());
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
 * Fetches the latest available technical + gemini data for a given symbol.
 * Searches across ALL date folders to find the most recent data for the symbol.
 */
async function getLatestTechnicalData(symbol: string): Promise<TechnicalDataResponse> {
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
    
    const signalsFile = files
      .filter(
        (f) =>
          f.name.toLowerCase().includes(`signals_${symbol.toLowerCase()}`) &&
          f.name.endsWith(".json")
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .pop();

    const geminiFile = files
      .filter(
        (f) =>
          f.name.toLowerCase().includes(`${symbol.toLowerCase()}_gemini_analysis_`) &&
          f.name.endsWith(".json")
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .pop();

    // If we found files for this symbol in this date folder, use them
    if (signalsFile || geminiFile) {
      const latestDate = datePrefix.split("/")[1];

      let technicalData: Record<string, unknown> | null = null;
      if (signalsFile) {
        const file = storageClient.bucket(BUCKET_NAME).file(signalsFile.name);
        const [data] = await file.download();
        technicalData = JSON.parse(data.toString()) as Record<string, unknown>;
      }

      let geminiAnalysis: Record<string, unknown> | null = null;
      if (geminiFile) {
        const file = storageClient.bucket(BUCKET_NAME).file(geminiFile.name);
        const [data] = await file.download();
        geminiAnalysis = JSON.parse(data.toString()) as Record<string, unknown>;
      }

      return { technicalData, geminiAnalysis, date: latestDate };
    }
  }

  // If we searched all folders and found nothing
  throw new Error(
    `No matching files found for ${symbol} in any date folder`
  );
}

export default async function DashboardPage({
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
  console.log("📊 Available symbols:", availableSymbols);
  
  // Await searchParams and use symbol from query params or default to first available
  const params = await searchParams;
  const symbol = params.symbol || availableSymbols[0] || "ORCL";

  let fetched: TechnicalDataResponse | null = null;
  try {
    fetched = await getLatestTechnicalData(symbol);
  } catch (err) {
    console.error("Failed to fetch latest technical data:", err);
    fetched = null;
  }

  const analysisData = fetched && (fetched.geminiAnalysis ?? fetched.technicalData)
    ? (fetched.geminiAnalysis ?? fetched.technicalData) as unknown as AnalysisData
    : null;

  function StrengthBadge({ strength }: { strength: string }) {
    const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
    const color =
      strength.includes("BEAR") || strength.includes("BEARISH")
        ? "bg-red-600 text-red-100"
        : strength.includes("BULL") || strength.includes("BULLISH")
        ? "bg-green-600 text-green-100"
        : strength.includes("EXTREME") || strength.includes("HIGH RISK") || strength.includes("CAUTION") || strength.includes("OVERBOUGHT") || strength.includes("OVERSOLD")
        ? "bg-yellow-600 text-yellow-100"
        : strength.includes("TRENDING")
        ? "bg-blue-600 text-blue-100"
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

  if (!analysisData) {
    return (
      <main className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto py-10 px-4">
          <header className="mb-6">
            <div className="mb-4">
              <h1 className="text-4xl font-bold">Welcome, {user.firstName || "User"}</h1>
              <p className="text-gray-400 mt-2">Technical Analysis Dashboard</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">
                Select Stock:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                {availableSymbols.map((sym) => (
                  <a
                    key={sym}
                    href={`/Dashboard2?symbol=${sym}`}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-center ${
                      sym === symbol
                        ? "bg-blue-600 text-white shadow-lg scale-105"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 hover:scale-102"
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
            <p className="text-gray-300 mb-4">No analysis JSON was found in Google Cloud Storage for symbol: <span className="font-mono">{symbol}</span>.</p>
            <p className="text-sm text-gray-400">Ensure your GCS bucket <span className="font-mono">{BUCKET_NAME}</span> contains the expected files under <span className="font-mono">daily/&lt;YYYY-MM-DD&gt;/</span> and that the server has permission to read them.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-10 px-4">
        <header className="mb-6">
          <div className="mb-4">
            <h1 className="text-4xl font-bold">Welcome, {user.firstName || "User"}</h1>
            <p className="text-gray-400 mt-2">{analysisData.symbol ?? symbol} Analysis</p>
          </div>
          
          {/* Mobile-responsive stock selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">
              Select Stock:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
              {availableSymbols.map((sym) => (
                <a
                  key={sym}
                  href={`/Dashboard2?symbol=${sym}`}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-center ${
                    sym === symbol
                      ? "bg-blue-600 text-white shadow-lg scale-105"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 hover:scale-102"
                  }`}
                >
                  {sym}
                </a>
              ))}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <section className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{analysisData.symbol ?? symbol} — Technical Snapshot</h2>
                <p className="text-sm text-gray-300 mt-1">
                  {analysisData.signal_count} signals • {analysisData.bullish_count} bullish • {analysisData.bearish_count} bearish
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Timestamp</div>
                <div className="font-mono text-sm">{analysisData.timestamp}</div>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {/* Price & Volume + Signal Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Price & Volume Card */}
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Price & Volume</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Date:</span>
                      <span className="text-white font-mono">{analysisData.date ?? "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Price:</span>
                      <span className="text-white text-lg font-semibold">
                        ${analysisData.price !== undefined && analysisData.price !== null ? analysisData.price.toFixed(2) : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Change:</span>
                      <span className={`font-semibold ${
                        (analysisData.change_pct ?? 0) < 0 ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {analysisData.change_pct !== undefined && analysisData.change_pct !== null 
                          ? `${analysisData.change_pct > 0 ? '+' : ''}${analysisData.change_pct.toFixed(2)}%` 
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Volume:</span>
                      <span className="text-white font-mono text-sm">
                        {analysisData.volume !== undefined && analysisData.volume !== null 
                          ? analysisData.volume.toLocaleString() 
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Signal Summary Card */}
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Signal Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Bullish Signals</span>
                      <span className="text-green-400 text-2xl font-bold">{analysisData.bullish_count ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Bearish Signals</span>
                      <span className="text-red-400 text-2xl font-bold">{analysisData.bearish_count ?? 0}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Net Bias</span>
                        <span className={`font-semibold ${
                          (analysisData.bullish_count ?? 0) > (analysisData.bearish_count ?? 0) 
                            ? 'text-green-400' 
                            : (analysisData.bullish_count ?? 0) < (analysisData.bearish_count ?? 0)
                            ? 'text-red-400'
                            : 'text-gray-400'
                        }`}>
                          {(analysisData.bullish_count ?? 0) > (analysisData.bearish_count ?? 0) 
                            ? 'BULLISH' 
                            : (analysisData.bullish_count ?? 0) < (analysisData.bearish_count ?? 0)
                            ? 'BEARISH'
                            : 'NEUTRAL'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Moving Averages */}
              <div className="p-4 bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Moving Averages</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {analysisData.moving_averages ? (
                    <>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">10 SMA</div>
                        <div className="text-lg font-semibold text-white">${analysisData.moving_averages.SMA_10.toFixed(2)}</div>
                        <div className={`text-xs ${
                          analysisData.price > analysisData.moving_averages.SMA_10 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {((analysisData.price - analysisData.moving_averages.SMA_10) / analysisData.moving_averages.SMA_10 * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">20 SMA</div>
                        <div className="text-lg font-semibold text-white">${analysisData.moving_averages.SMA_20.toFixed(2)}</div>
                        <div className={`text-xs ${
                          analysisData.price > analysisData.moving_averages.SMA_20 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {((analysisData.price - analysisData.moving_averages.SMA_20) / analysisData.moving_averages.SMA_20 * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">50 SMA</div>
                        <div className="text-lg font-semibold text-white">${analysisData.moving_averages.SMA_50.toFixed(2)}</div>
                        <div className={`text-xs ${
                          analysisData.price > analysisData.moving_averages.SMA_50 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {((analysisData.price - analysisData.moving_averages.SMA_50) / analysisData.moving_averages.SMA_50 * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">200 SMA</div>
                        <div className="text-lg font-semibold text-white">${analysisData.moving_averages.SMA_200.toFixed(2)}</div>
                        <div className={`text-xs ${
                          analysisData.price > analysisData.moving_averages.SMA_200 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {((analysisData.price - analysisData.moving_averages.SMA_200) / analysisData.moving_averages.SMA_200 * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">10 EMA</div>
                        <div className="text-lg font-semibold text-white">${analysisData.moving_averages.EMA_10.toFixed(2)}</div>
                        <div className={`text-xs ${
                          analysisData.price > analysisData.moving_averages.EMA_10 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {((analysisData.price - analysisData.moving_averages.EMA_10) / analysisData.moving_averages.EMA_10 * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">20 EMA</div>
                        <div className="text-lg font-semibold text-white">${analysisData.moving_averages.EMA_20.toFixed(2)}</div>
                        <div className={`text-xs ${
                          analysisData.price > analysisData.moving_averages.EMA_20 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {((analysisData.price - analysisData.moving_averages.EMA_20) / analysisData.moving_averages.EMA_20 * 100).toFixed(1)}%
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-400 text-sm col-span-3">No moving average data available</p>
                  )}
                </div>
              </div>

              {/* Key Oscillators */}
              <div className="p-4 bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Key Oscillators</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  {analysisData.indicators ? (
                    <>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">RSI</div>
                        <div className={`text-2xl font-bold ${
                          analysisData.indicators.RSI > 70 ? 'text-red-400' :
                          analysisData.indicators.RSI < 30 ? 'text-green-400' :
                          'text-white'
                        }`}>
                          {analysisData.indicators.RSI.toFixed(1)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">MACD</div>
                        <div className={`text-2xl font-bold ${
                          analysisData.indicators.MACD > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {analysisData.indicators.MACD.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">ADX</div>
                        <div className={`text-2xl font-bold ${
                          analysisData.indicators.ADX > 25 ? 'text-blue-400' : 'text-gray-400'
                        }`}>
                          {analysisData.indicators.ADX.toFixed(1)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">Stochastic</div>
                        <div className={`text-2xl font-bold ${
                          analysisData.indicators.Stochastic > 80 ? 'text-red-400' :
                          analysisData.indicators.Stochastic < 20 ? 'text-green-400' :
                          'text-white'
                        }`}>
                          {analysisData.indicators.Stochastic.toFixed(1)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">CCI</div>
                        <div className={`text-2xl font-bold ${
                          analysisData.indicators.CCI > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {analysisData.indicators.CCI.toFixed(1)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">MFI</div>
                        <div className={`text-2xl font-bold ${
                          analysisData.indicators.MFI > 80 ? 'text-red-400' :
                          analysisData.indicators.MFI < 20 ? 'text-green-400' :
                          'text-white'
                        }`}>
                          {analysisData.indicators.MFI.toFixed(1)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">BB Position</div>
                        <div className={`text-2xl font-bold ${
                          analysisData.indicators.BB_Position > 0.8 ? 'text-red-400' :
                          analysisData.indicators.BB_Position < 0.2 ? 'text-green-400' :
                          'text-white'
                        }`}>
                          {(analysisData.indicators.BB_Position * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-400 mb-1">Volatility</div>
                        <div className={`text-2xl font-bold ${
                          analysisData.indicators.Volatility > 50 ? 'text-yellow-400' : 'text-white'
                        }`}>
                          {analysisData.indicators.Volatility.toFixed(0)}%
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-8 text-gray-400 text-sm text-center">No oscillator data available</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Signals Analyzed ({analysisData.signals?.length ?? 0})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.isArray(analysisData.signals) && analysisData.signals.length > 0 ? (
              (analysisData.signals as AnalysisSignal[]).map((s, idx) => (
                <div key={idx} className="p-3 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg border border-gray-700 hover:border-gray-600 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">{s.signal}</div>
                      <div className="text-sm text-gray-300 mt-1">{s.desc}</div>
                    </div>
                    <div className="flex-shrink-0">
                      <StrengthBadge strength={s.strength} />
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2 uppercase tracking-wide">{s.category}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 col-span-full text-center py-8">No signals found in analysis data.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}