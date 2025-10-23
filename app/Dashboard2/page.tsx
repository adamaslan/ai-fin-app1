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

export const dynamic = "force-dynamic";

const storage = new Storage();
const BUCKET_NAME = "ttb-bucket1";

/**
 * Get list of all available symbols from ALL date folders
 */
async function getAvailableSymbols(): Promise<string[]> {
  const bucket = storage.bucket(BUCKET_NAME);

  try {
    const [, , apiResponse] = await bucket.getFiles({
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
      const [files] = await bucket.getFiles({ prefix: datePrefix });
      
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
  const bucket = storage.bucket(BUCKET_NAME);

  // 1️⃣ Get all date folders under /daily/
  const [, , apiResponse] = await bucket.getFiles({
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

  // 2️⃣ Search through date folders starting with the most recent
  for (const datePrefix of sortedDateFolders) {
    const [files] = await bucket.getFiles({ prefix: datePrefix });
    
    const signalsFile = files
      .filter(
        (f) =>
          f.name.includes(`signals_${symbol}`) &&
          f.name.endsWith(".json")
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .pop();

    const geminiFile = files
      .filter(
        (f) =>
          f.name.includes(`${symbol}_gemini_analysis_`) &&
          f.name.endsWith(".json")
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .pop();

    // If we found files for this symbol in this date folder, use them
    if (signalsFile || geminiFile) {
      const latestDate = datePrefix.split("/")[1];

      let technicalData: Record<string, unknown> | null = null;
      if (signalsFile) {
        const [signalsContent] = await signalsFile.download();
        technicalData = JSON.parse(signalsContent.toString()) as Record<string, unknown>;
      }

      let geminiAnalysis: Record<string, unknown> | null = null;
      if (geminiFile) {
        const [geminiContent] = await geminiFile.download();
        geminiAnalysis = JSON.parse(geminiContent.toString()) as Record<string, unknown>;
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

  // Get available symbols
  const availableSymbols = await getAvailableSymbols();
  
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
              <label htmlFor="stock-select" className="text-sm font-medium text-gray-300">
                Select Stock:
              </label>
              <div className="flex gap-2 flex-wrap">
                {availableSymbols.map((sym) => (
                  <a
                    key={sym}
                    href={`/Dashboard2?symbol=${sym}`}
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
                  href={`/Dashboard2?symbol=${sym}`}
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

        <div className="grid grid-cols-1 gap-6">
          <section className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold">{analysisData.symbol ?? symbol} — Technical Snapshot</h2>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-300">Overall Bias</h4>
                  <p className="mt-2 text-white">{analysisData.overall_bias ?? "N/A"}</p>
                  <p className="text-sm text-gray-400 mt-1">{analysisData.long_term_comment ?? ""}</p>
                </div>

                <div className="p-4 bg-gray-800 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-300">Risk</h4>
                  <ul className="mt-2 text-sm text-gray-200 space-y-1 list-disc list-inside">
                    {Array.isArray(analysisData?.risk) ? (
                      (analysisData!.risk as string[]).map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      ))
                    ) : (
                      <>
                        <li>High volatility — see analysis</li>
                        <li>Signals may be noisy</li>
                        <li>Confirm before trading</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300">Key Levels</h4>
                <div className="mt-2 flex flex-wrap gap-3">
                  {Array.isArray(analysisData?.key_levels) ? (
                    (analysisData!.key_levels as string[]).map((k: string, i: number) => (
                      <div key={i} className="bg-gray-700 px-3 py-1 rounded-md">{k}</div>
                    ))
                  ) : (
                    <>
                      <div className="bg-gray-700 px-3 py-1 rounded-md">Support 1</div>
                      <div className="bg-gray-700 px-3 py-1 rounded-md">Support 2</div>
                      <div className="bg-gray-700 px-3 py-1 rounded-md">Resistance 1</div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-300">Recommendation</h4>
                <p className="mt-2 text-white">{analysisData?.recommendation ?? "No recommendation provided."}</p>
              </div>
            </div>
          </section>
        </div>

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