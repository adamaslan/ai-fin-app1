import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Storage } from "@google-cloud/storage";

interface TechnicalDataResponse {
  technicalData: Record<string, unknown> | null;
  geminiAnalysis: Record<string, unknown> | null;
  date: string;
}

// Minimal typing for GCS API response prefixes
interface GetFilesApiResponse {
  prefixes?: string[];
}

// Types for the analysis JSON shown in the UI
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
  // optional helper fields that may appear in the Gemini/analysis JSON
  overall_bias?: string;
  long_term_comment?: string;
  risk?: string[];
  key_levels?: string[];
  recommendation?: string;
}

export const dynamic = "force-dynamic";

// Initialize Google Cloud Storage
const storage = new Storage();
const BUCKET_NAME = "ttb-bucket1";

/**
 * Fetches the latest available technical + gemini data for a given symbol.
 * Matches actual structure:
 * daily/YYYY-MM-DD/{SYMBOL}_gemini_analysis_YYYYMMDD_HHMMSS.json
 * daily/YYYY-MM-DD/signals_{SYMBOL}_YYYY-MM-DD.json
 */
async function getLatestTechnicalData(symbol: string): Promise<TechnicalDataResponse> {
  const bucket = storage.bucket(BUCKET_NAME);

  // 1️⃣ Find latest date folder under /daily/
  // bucket.getFiles with delimiter returns [files, , apiResponse]
  const [, , apiResponse] = await bucket.getFiles({
    prefix: "daily/",
    delimiter: "/",
  });

  const apiTyped = apiResponse as GetFilesApiResponse | undefined;
  const dateFolders: string[] = apiTyped?.prefixes ?? [];
  if (dateFolders.length === 0) {
    throw new Error("No date folders found in /daily/");
  }

  // e.g. ["daily/2025-10-19/", "daily/2025-10-20/"]
  const latestPrefix = dateFolders.sort().pop();
  if (!latestPrefix) {
    throw new Error("Could not determine latest date folder.");
  }

  const latestDate = latestPrefix.split("/")[1]; // "2025-10-20"

  // 2️⃣ List all files in the latest date folder
  const [files] = await bucket.getFiles({ prefix: latestPrefix });
  if (files.length === 0) {
    throw new Error(`No files found in folder: ${latestPrefix}`);
  }

  // 3️⃣ Find signals and gemini analysis files
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

  // 4️⃣ Download + parse JSON data
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

  if (!signalsFile && !geminiFile) {
    throw new Error(
      `No matching files found for ${symbol} in ${latestPrefix}`
    );
  }

  return { technicalData, geminiAnalysis, date: latestDate };
}

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Make this more dynamic later
  const symbol = "RGTI";
  // require data from GCS only; no hard-coded fallback

  let fetched: TechnicalDataResponse | null = null;
  try {
    fetched = await getLatestTechnicalData(symbol);
  } catch (err) {
    console.error("Failed to fetch latest technical data:", err);
    // Rethrow so that the page renders the error UI below
    fetched = null;
  }

  // Prefer geminiAnalysis (already matches AnalysisData shape), otherwise use technicalData
  const analysisData = fetched && (fetched.geminiAnalysis ?? fetched.technicalData)
    ? (fetched.geminiAnalysis ?? fetched.technicalData) as unknown as AnalysisData
    : null;

  function StrengthBadge({ strength }: { strength: string }) {
    const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium";
    const color =
      strength.includes("BEAR") || strength.includes("BEARISH")
        ? "bg-red-600 text-red-100"
        : strength.includes("BULL") || strength.includes("BULL  ISH")
        ? "bg-green-600 text-green-100"
        : strength.includes("EXTREME") || strength.includes("HIGH RISK")
        ? "bg-yellow-600 text-yellow-100"
        : "bg-gray-600 text-gray-100";

    return <span className={`${base} ${color}`}>{strength}</span>;
  }

  // Minimal markdown-like renderer for the analysis text.
  // Supports:
  // - bold markers **bold**
  // - standalone bold headings blocks (e.g. **1. TITLE:**)
  // - bullet lists where lines start with '*'
  function MarkdownAnalysis({ text }: { text: string }) {
    const renderInline = (s: string, keyPrefix = "") => {
      // split by ** to render bold segments
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

          // Standalone bold heading block like: **1. STRONGEST SIGNAL:**
          if (trimmed.startsWith("**") && trimmed.endsWith("**") && !trimmed.includes("\n")) {
            const inner = trimmed.slice(2, -2).trim();
            return <h4 key={idx} className="text-lg font-semibold text-white">{renderInline(inner, `h${idx}-`)}</h4>;
          }

          // Bullet list block: lines starting with '*'
          const lines = block.split(/\n/).map(l => l.trim()).filter(Boolean);
          const isList = lines.every(l => l.startsWith("*") || l.startsWith("-"));
          if (isList) {
            return (
              <ul key={idx} className="list-disc list-inside space-y-1 text-sm text-gray-200">
                {lines.map((line, i) => {
                  // remove leading '*' or '-'
                  const content = line.replace(/^\*+\s?|-+\s?/, "");
                  return <li key={i}>{renderInline(content, `li${idx}-${i}-`)}</li>;
                })}
              </ul>
            );
          }

          // Paragraph block — preserve single newlines as breaks
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
    // Render a clear error UI when GCS JSON isn't available
    return (
      <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="max-w-lg text-center p-8 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-red-400 mb-4">Data Not Available</h2>
          <p className="text-gray-300 mb-4">No analysis JSON was found in Google Cloud Storage for symbol: <span className="font-mono">{symbol}</span>.</p>
          <p className="text-sm text-gray-400">Ensure your GCS bucket <span className="font-mono">{BUCKET_NAME}</span> contains the expected files under <span className="font-mono">daily/&lt;YYYY-MM-DD&gt;/</span> and that the server has permission to read them.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-10">
        <header className="mb-6">
          <h1 className="text-4xl font-bold">Welcome, {user.firstName || "User"}</h1>
          <p className="text-gray-400 mt-2">{analysisData.symbol ?? symbol} Analysis</p>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {/* Summary Card */}
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
                    {/* If the analysis includes a risk array, render it; otherwise render a generic placeholder */}
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

              {/* Key levels — prefer key_levels array if present */}
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

        {/* Detailed signals table */}
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


// // app/dashboard/page.tsx
// import { currentUser } from "@clerk/nextjs/server";
// import { redirect } from "next/navigation";
// import { Storage } from '@google-cloud/storage';
// import TechnicalAnalysisDashboard from "../(components)/TechnicalAnalysisDashboard";

// export const dynamic = "force-dynamic";

// // Initialize Goosgle Cloud Storage
// const storage = new Storage();

// // Direct data fetching function
// async function getTechnicalData(symbol: string, date: string) {
//   const bucketName = 'ttb-bucket1';
//   const bucket = storage.bucket(bucketName);

//   // List files for the given date and symbol
//   const [files] = await bucket.getFiles({
//     prefix: `daily/${date}/${symbol}`,
//   });

//   if (files.length === 0) {
//     throw new Error(`No data found for ${symbol} on ${date}`);
//   }

//   // Find the latest signals file
//   const signalsFile = files
//     .filter(f => f.name.includes('signals') && f.name.endsWith('.json'))
//     .sort()
//     .pop();

//   // Find the latest Gemini analysis file
//   const geminiFile = files
//     .filter(f => f.name.includes('gemini_analysis') && f.name.endsWith('.json'))
//     .sort()
//     .pop();

//   if (!signalsFile) {
//     throw new Error('Signals file not found');
//   }

//   // Download and parse signals file
//   const [signalsContent] = await signalsFile.download();
//   const technicalData = JSON.parse(signalsContent.toString());

//   // Download and parse Gemini analysis if available
//   let geminiAnalysis = null;
//   if (geminiFile) {
//     const [geminiContent] = await geminiFile.download();
//     geminiAnalysis = JSON.parse(geminiContent.toString());
//   }

//   return { technicalData, geminiAnalysis };
// }

// export default async function DashboardPage() {
//   // 1. Authenticate with Clerk
//   const user = await currentUser();

//   if (!user) {
//     redirect('/sign-in');
//   }

//   // 2. Set symbol and date
//   const symbol = "RGTI";
//   const date = new Date().toISOString().split("T")[0];

//   try {
//     // 3. Fetch data directly from GCP
//     const { technicalData, geminiAnalysis } = await getTechnicalData(symbol, date);

//     // 4. Render dashboard
//     return (
//       <main className="min-h-screen bg-gray-900 text-white">
//         <div className="container mx-auto py-10">
//           <header className="mb-8">
//             <h1 className="text-4xl font-bold">
//               Welcome, {user.firstName || 'User'}
//             </h1>
//             <p className="text-gray-400 mt-2">
//               Technical Analysis Dashboard - {symbol}
//             </p>
//           </header>

//           <TechnicalAnalysisDashboard
//             technicalData={technicalData}
//             geminiAnalysis={geminiAnalysis}
//           />
//         </div>
//       </main>
//     );
//   } catch (error) {
//     console.error("Dashboard error:", error);

//     return (
//       <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
//         <div className="text-center max-w-md">
//           <h1 className="text-2xl font-bold mb-4 text-red-400">
//             Error Loading Dashboard
//           </h1>
//           <p className="text-gray-400 mb-6">
//             {error instanceof Error ? error.message : "An unexpected error occurred"}
//           </p>
//           <a
//             href="/dashboard"
//             className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
//           >
//             Try Again
//           </a>
//         </div>
//       </main>
//     );
//   }
// }


// import { currentUser } from "@clerk/nextjs/server";
// import { redirect } from "next/navigation";
// import TechnicalAnalysisDashboard from "../(components)/TechnicalAnalysisDashboard";
// import { RefreshButton } from "@/components/RefreshButton";

// export const dynamic = "force-dynamic";

// async function fetchTechnicalData(symbol: string, date: string) {
//   const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
//                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  
//   const res = await fetch(
//     `${baseUrl}/api/technical-analysis?symbol=${symbol}&date=${date}`,
//     { cache: "no-store" }
//   );

//   if (!res.ok) {
//     throw new Error(`Failed to fetch: ${res.status}`);
//   }

//   return res.json();
// }

// export default async function EnhancedDashboard() {
//   const user = await currentUser();

//   if (!user) {
//     redirect('/sign-in');
//   }

//   const symbol = "RGTI";
//   const date = new Date().toISOString().split("T")[0];

//   try {
//     const { technicalData, geminiAnalysis } = await fetchTechnicalData(symbol, date);

//     return (
//       <main className="min-h-screen bg-gray-900 text-white">
//         <div className="container mx-auto py-10">
//           <div className="flex items-center justify-between mb-8">
//             <div>
//               <h1 className="text-4xl font-bold">
//                 Welcome, {user.firstName || 'User'}
//               </h1>
//               <p className="text-gray-400 mt-2">
//                 {symbol} - {date}
//               </p>
//             </div>
//             <RefreshButton symbol={symbol} date={date} />
//           </div>

//           <TechnicalAnalysisDashboard
//             technicalData={technicalData}
//             geminiAnalysis={geminiAnalysis}
//           />
//         </div>
//       </main>
//     );
//   } catch (error) {
//     console.error("Dashboard error:", error);
    
//     return (
//       <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
//         <div className="text-center">
//           <h1 className="text-2xl font-bold mb-4 text-red-400">Error</h1>
//           <p className="text-gray-400">
//             {error instanceof Error ? error.message : "Failed to load dashboard"}
//           </p>
//         </div>
//       </main>
//     );
//   }
// }