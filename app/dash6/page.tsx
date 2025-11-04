// app/dash6/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Storage } from "@google-cloud/storage";
import AlertSender from "../components/AlertSender";

interface TechnicalDataResponse {
  technicalData: Record<string, unknown> | null;
  geminiAnalysis: Record<string, unknown> | null;
  date: string;
}

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

interface WeeklySignalResult {
  signal: AnalysisSignal;
  date: string;
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
 * OPTIMIZED: Single API call instead of N+1 calls
 */
async function getAvailableSymbols(): Promise<string[]> {
  try {
    // Fetch ALL files under daily/ in one recursive call
    const [files] = await storageClient
      .bucket(BUCKET_NAME)
      .getFiles({ prefix: "daily/" });

    const symbolSet = new Set<string>();

    files.forEach(file => {
      const fileName = file.name.split('/').pop() || '';

      // Match signals_SYMBOL_ pattern
      const signalsMatch = fileName.match(/signals_([A-Z]+)_/);
      if (signalsMatch) {
        symbolSet.add(signalsMatch[1]);
      }

      // Match SYMBOL_gemini_analysis pattern
      const geminiMatch = fileName.match(/([A-Z]+)_gemini_analysis_/);
      if (geminiMatch) {
        symbolSet.add(geminiMatch[1]);
      }
    });

    return Array.from(symbolSet).sort();
  } catch (error) {
    console.error("Error fetching available symbols:", error);
    return [];
  }
}

/**
 * Get date folders from the past 7 days
 */
function getDateFoldersLastWeek(): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    dates.push(`daily/${dateStr}/`);
  }
  
  return dates;
}

/**
 * Fetches the latest available technical + gemini data for a given symbol.
 * Searches across ALL date folders to find the most recent data for the symbol.
 */
async function getLatestTechnicalData(symbol: string): Promise<TechnicalDataResponse> {
  // Fetch ALL files under daily/ in one call
  const [files] = await storageClient
    .bucket(BUCKET_NAME)
    .getFiles({ prefix: "daily/" });

  if (files.length === 0) {
    throw new Error("No files found in /daily/");
  }

  // Filter files for this symbol
  const symbolFiles = files.filter(f => {
    const fileName = f.name.split('/').pop() || '';
    return (
      fileName.includes(`signals_${symbol}`) ||
      fileName.includes(`${symbol}_gemini_analysis_`)
    ) && fileName.endsWith('.json');
  });

  if (symbolFiles.length === 0) {
    throw new Error(`No matching files found for ${symbol}`);
  }

  // Sort by file path (which includes date) to get most recent
  symbolFiles.sort((a, b) => b.name.localeCompare(a.name));

  // Get the most recent signals and gemini files
  const signalsFile = symbolFiles.find(f => f.name.includes(`signals_${symbol}`));
  const geminiFile = symbolFiles.find(f => f.name.includes(`${symbol}_gemini_analysis_`));

  const latestDate = signalsFile?.name.split('/')[1] || geminiFile?.name.split('/')[1] || '';

  let technicalData: Record<string, unknown> | null = null;
  if (signalsFile) {
    const [data] = await signalsFile.download();
    technicalData = JSON.parse(data.toString()) as Record<string, unknown>;
  }

  let geminiAnalysis: Record<string, unknown> | null = null;
  if (geminiFile) {
    const [data] = await geminiFile.download();
    geminiAnalysis = JSON.parse(data.toString()) as Record<string, unknown>;
  }

  return { technicalData, geminiAnalysis, date: latestDate };
}

/**
 * Get the strongest signal from the past week for a given symbol
 */
async function getStrongestSignalLastWeek(symbol: string): Promise<WeeklySignalResult | null> {
  try {
    const dateFolders = getDateFoldersLastWeek();
    
    // Fetch ALL files in one call
    const [allFiles] = await storageClient
      .bucket(BUCKET_NAME)
      .getFiles({ prefix: "daily/" });

    let strongestOverall: AnalysisSignal | null = null;
    let strongestDate = '';

    // Process each date folder
    for (const datePrefix of dateFolders) {
      const filesInDate = allFiles.filter(f => f.name.startsWith(datePrefix));
      
      const geminiFile = filesInDate.find(
        f => f.name.includes(`${symbol}_gemini_analysis_`) && f.name.endsWith('.json')
      );

      if (geminiFile) {
        try {
          const [data] = await geminiFile.download();
          const analysisData = JSON.parse(data.toString()) as AnalysisData;
          
          if (analysisData.signals_analyzed && analysisData.signals_analyzed.length > 0) {
            const dayStrongest = getStrongestSignal(analysisData.signals_analyzed);
            
            if (dayStrongest) {
              if (!strongestOverall || isStrongerSignal(dayStrongest, strongestOverall)) {
                strongestOverall = dayStrongest;
                strongestDate = datePrefix.split('/')[1]; // Extract YYYY-MM-DD
              }
            }
          }
        } catch (error) {
          console.error(`Error processing file ${geminiFile.name}:`, error);
        }
      }
    }

    if (strongestOverall) {
      return {
        signal: strongestOverall,
        date: strongestDate
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching strongest signal from last week:", error);
    return null;
  }
}

/**
 * Function to find the strongest signal
 * FIXED: Now properly handles null initial value
 */
function getStrongestSignal(signals: AnalysisSignal[]): AnalysisSignal | null {
  const strengthOrder = ["EXTREME", "HIGH", "MEDIUM", "LOW"];
  
  return signals.reduce((strongest, current) => {
    // Handle initial null case
    if (!strongest) {
      return current;
    }
    
    const currentStrength = current.strength.split(" ")[0]; // Extract "EXTREME", "HIGH", etc.
    const strongestStrength = strongest.strength.split(" ")[0];
    
    const currentIndex = strengthOrder.indexOf(currentStrength);
    const strongestIndex = strengthOrder.indexOf(strongestStrength);
    
    // Lower index = stronger signal
    return currentIndex < strongestIndex ? current : strongest;
  }, null as AnalysisSignal | null);
}

/**
 * Compare two signals to determine which is stronger
 */
function isStrongerSignal(signal1: AnalysisSignal, signal2: AnalysisSignal): boolean {
  const strengthOrder = ["EXTREME", "HIGH", "MEDIUM", "LOW"];
  
  const strength1 = signal1.strength.split(" ")[0];
  const strength2 = signal2.strength.split(" ")[0];
  
  const index1 = strengthOrder.indexOf(strength1);
  const index2 = strengthOrder.indexOf(strength2);
  
  // Lower index = stronger signal
  return index1 < index2;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Get available symbols
  const availableSymbols = await getAvailableSymbols();
  console.log("📊 Available symbols:", availableSymbols);

  // Get symbol from query params or default
  const params = await searchParams;
  const symbol = params.symbol || availableSymbols[0] || "ORCL";
  
  // Fetch latest data for display
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

  // Get strongest signal from the past week
  const weeklyStrongestResult = await getStrongestSignalLastWeek(symbol);
  const userEmail = user.primaryEmailAddress?.emailAddress;

  // Calculate date range for display
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  const dateRange = `${weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  // Helper components
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

  if (!analysisData) {
    return (
      <main className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto py-10">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">Welcome, {user.firstName || "User"}</h1>
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
                    href={`/Dashboard5?symbol=${sym}`}
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
      {/* 🚀 Send weekly email alert using server component (no UI rendered) */}
      {weeklyStrongestResult && userEmail && (
        <AlertSender 
          signal={weeklyStrongestResult.signal} 
          symbol={symbol} 
          userEmail={userEmail}
          dateRange={dateRange}
        />
      )}

      <div className="container mx-auto py-10">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Welcome, {user.firstName || "User"}</h1>
            <p className="text-gray-400 mt-2">{analysisData.symbol ?? symbol} Analysis</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-300">
              Select Stock:
            </label>
            <div className="flex gap-2 flex-wrap">
              {availableSymbols.map((sym) => (
                <a
                  key={sym}
                  href={`/Dashboard5?symbol=${sym}`}
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

        {/* Weekly Email confirmation banner */}
        {weeklyStrongestResult && userEmail && (
          <div className="mb-6 p-4 bg-purple-900/30 border border-purple-700 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📧</span>
              <div>
                <p className="text-purple-400 font-medium">
                  Weekly Alert Email Sent
                </p>
                <p className="text-sm text-gray-300">
                  The strongest signal from the past week ({weeklyStrongestResult.signal.signal} on {weeklyStrongestResult.date}) was detected. 
                  An alert has been sent to <span className="font-mono">{userEmail}</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Weekly Strongest Signal Card */}
          {weeklyStrongestResult && (
            <section className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 p-6 rounded-xl shadow-lg border-2 border-purple-700">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-purple-300">🏆 Strongest Signal (Past 7 Days)</h2>
                  <p className="text-sm text-gray-300 mt-1">Date range: {dateRange}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Detected on</div>
                  <div className="font-mono text-sm text-purple-300">{weeklyStrongestResult.date}</div>
                </div>
              </div>
              <div className="p-4 bg-gray-900/50 rounded-lg border border-purple-600">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-xl text-white mb-2">{weeklyStrongestResult.signal.signal}</div>
                    <div className="text-sm text-gray-300 mb-2">{weeklyStrongestResult.signal.desc}</div>
                    <div className="text-xs text-gray-400">Category: {weeklyStrongestResult.signal.category}</div>
                  </div>
                  <div className="ml-4">
                    <StrengthBadge strength={weeklyStrongestResult.signal.strength} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Current Analysis Section */}
          <section className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold">{analysisData.symbol ?? symbol} — Today&apos;s Analysis</h2>
                <p className="text-sm text-gray-300 mt-1">Signal count: {analysisData.signal_count}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Timestamp</div>
                <div className="font-mono text-sm">{analysisData.timestamp}</div>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-lg font-medium">Analysis</h3>
                {analysisData.analysis ? (
                  <MarkdownAnalysis text={analysisData.analysis} />
                ) : (
                  <p className="text-gray-200 mt-1">(no analysis text provided)</p>
                )}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Today&apos;s Signals</h3>
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