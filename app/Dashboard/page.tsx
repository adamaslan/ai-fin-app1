import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Storage } from "@google-cloud/storage";

interface TechnicalDataResponse {
  technicalData: Record<string, unknown> | null;
  geminiAnalysis: Record<string, unknown> | null;
  date: string;
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
  const [, , apiResponse] = await bucket.getFiles({
    prefix: "daily/",
    delimiter: "/",
  });

  const dateFolders: string[] = (apiResponse as any).prefixes ?? [];
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

  const symbol = "RGTI";
  // For quick preview / dev: embed the provided analysis JSON and render it
  const date = "2025-10-21";

  const analysisData = {
    symbol: "RGTI",
    timestamp: "20251021_103548",
    date: "2025-10-21",
    analysis: `Okay, let's analyze RGTI based on the provided technical data.

**1. STRONGEST SIGNAL:**

The **Strongest Signal** is the confluence of **"LARGE LOSS - -6.6% today"** combined with the **"RSI BEARISH DIVERGENCE"** and **"MACD BEAR CROSS / MACD MOMENTUM DOWN / MACD WEAK MOMENTUM".** This indicates a likely shift in momentum and a potential short-term correction. While the ADX indicates a strong trend, the sharp price drop coupled with bearish divergences in momentum oscillators often precedes pullbacks.

**2. OVERALL BIAS:**

**Short-Term Bearish Bias with Moderate Confidence.** While the long-term trend remains bullish based on moving averages and Ichimoku cloud, the recent price action and momentum signals suggest a pullback is probable. The extreme volatility makes the current situation highly risky for new entries.

**3. KEY LEVELS:**

*   **Support 1:** $40.50 (previous low, psychological level)
*   **Support 2:** $36.00 (20-day SMA)
*   **Resistance 1:** $46.40 (yesterday's high)
*   **Resistance 2:** $48.00 (recent peak)

**4. RISK ASSESSMENT:**

*   **High Volatility:** The extreme volatility (146.8%) increases the risk of sudden price swings and whipsaws.
*   **Potential Pullback:** The bearish signals suggest a potential pullback, which could erase recent gains.
*   **Overbought Conditions:** The price is significantly extended from the 200-day SMA, increasing the risk of mean reversion.
*   **False Signals:** In such a volatile market, momentum indicators are more likely to give off false signals, especially divergences, so confirmation is necessary before taking action.

**5. TRADING RECOMMENDATION:**

**RECOMMENDATION: WAIT/REDUCE.**

*   **Current Holders:** Consider reducing exposure or tightening stop-loss orders to protect profits. A stop-loss order near $40.50 could be prudent.
*   **New Entries:** Avoid new long positions at this time. Wait for a clearer signal of support or a significant pullback to the 20-day SMA (~$36.00) before considering entry.

**Entry/Exit Strategy (If Bullish Signal Confirmed):**

*   **Entry:** If price retraces to the $36 level and shows signs of support (e.g., bullish candlestick patterns, RSI bouncing off oversold territory), consider a long entry.
*   **Target 1:** $46.40 (yesterday's high)
*   **Target 2:** $48.00 (recent peak)
*   **Stop-Loss:** Place a stop-loss order just below the support level where you entered (e.g., if you entered at $36, place a stop-loss just below $36.)

**Entry/Exit Strategy (If Bearish Signal Confirmed):**

*   **Entry:** Look for a short entry around $43-$43.31, confirm with another drop and price action.
*   **Target 1:** $40.50 (previous low, psychological level)
*   **Target 2:** $36.00 (20-day SMA)
*   **Stop-Loss:** Place a stop-loss order just above the entry point, for example, at $44.00.

**6. TIMEFRAME:**

**Short-Term to Medium-Term (Days to Weeks):** This analysis is primarily focused on the short-term pullback potential. Long-term investors may remain bullish, but should be aware of short-term volatility.
`,
    signal_count: 22,
    signals_analyzed: [
      { signal: "RSI BEARISH DIVERGENCE", desc: "Price up but RSI down", strength: "BEARISH", category: "DIVERGENCE" },
      { signal: "MACD BEAR CROSS", desc: "MACD crossed below signal", strength: "BEARISH", category: "MACD" },
      { signal: "MACD MOMENTUM DOWN", desc: "Histogram expanding bearish", strength: "BEARISH", category: "MACD" },
      { signal: "MACD WEAK MOMENTUM", desc: "Histogram accelerating down", strength: "STRONG BEARISH", category: "MACD" },
      { signal: "MACD FULLY BULLISH", desc: "Both lines above zero", strength: "BULLISH", category: "MACD" },
      { signal: "OBV FALLING", desc: "Selling pressure increasing", strength: "BEARISH", category: "VOLUME" },
      { signal: "STRONG UPTREND", desc: "ADX: 72.2", strength: "TRENDING", category: "TREND" },
      { signal: "VERY STRONG TREND", desc: "ADX: 72.2", strength: "EXTREME", category: "TREND" },
      { signal: "STRONG UPTREND CONFIRMED", desc: "+DI > -DI with high ADX", strength: "BULLISH", category: "TREND" },
      { signal: "LARGE LOSS", desc: "-6.6% today", strength: "STRONG BEARISH", category: "PRICE_ACTION" },
      { signal: "LOWER LOW", desc: "Breaking below yesterday", strength: "BEARISH", category: "PRICE_ACTION" },
      { signal: "WIDE RANGE DAY", desc: "Range: 13.3%", strength: "VOLATILE", category: "PRICE_ACTION" },
      { signal: "MOMENTUM BUILDING", desc: "Consecutive positive momentum", strength: "BULLISH", category: "MOMENTUM" },
      { signal: "STRONG 20D MOMENTUM", desc: "+52.7% in 20 days", strength: "STRONG BULLISH", category: "MOMENTUM" },
      { signal: "HIGH VOLATILITY", desc: "147% annualized", strength: "CAUTION", category: "VOLATILITY" },
      { signal: "EXTREME VOLATILITY", desc: "147% annualized", strength: "HIGH RISK", category: "VOLATILITY" },
      { signal: "ATR ELEVATED", desc: "Above-average true range", strength: "VOLATILE", category: "VOLATILITY" },
      { signal: "ABOVE CLOUD", desc: "Ichimoku bullish", strength: "BULLISH", category: "ICHIMOKU" },
      { signal: "CLOUD BULLISH", desc: "Senkou A above B", strength: "BULLISH", category: "ICHIMOKU" },
      { signal: "MA ALIGNMENT BULLISH", desc: "10 > 20 > 50 SMA", strength: "STRONG BULLISH", category: "MA_TREND" },
      { signal: "ABOVE 200 SMA", desc: "Long-term uptrend", strength: "BULLISH", category: "MA_TREND" },
      { signal: "EXTENDED FROM 200 SMA", desc: "182.0% above", strength: "OVERBOUGHT", category: "MA_TREND" }
    ]
  } as const;

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

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-10">
        <header className="mb-6">
          <h1 className="text-4xl font-bold">Welcome, {user.firstName || "User"}</h1>
          <p className="text-gray-400 mt-2">RGTI Analysis — {date}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Card */}
          <section className="lg:col-span-2 bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold">RGTI — Technical Snapshot</h2>
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
                <p className="text-gray-200 mt-1">Large loss (-6.6%) + RSI bearish divergence + bearish MACD signals — indicates likely short-term correction.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-300">Overall Bias</h4>
                  <p className="mt-2 text-white">Short-Term Bearish (Moderate Confidence)</p>
                  <p className="text-sm text-gray-400 mt-1">Long-term trend remains bullish, but momentum and price action favor a pullback.</p>
                </div>

                <div className="p-4 bg-gray-800 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-300">Risk</h4>
                  <ul className="mt-2 text-sm text-gray-200 space-y-1 list-disc list-inside">
                    <li>High volatility (≈147%)</li>
                    <li>False signals possible</li>
                    <li>Overextended vs 200 SMA (mean reversion risk)</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-300">Key Levels</h4>
                <div className="mt-2 flex flex-wrap gap-3">
                  <div className="bg-gray-700 px-3 py-1 rounded-md">Support 1: $40.50</div>
                  <div className="bg-gray-700 px-3 py-1 rounded-md">Support 2: $36.00</div>
                  <div className="bg-gray-700 px-3 py-1 rounded-md">Resistance 1: $46.40</div>
                  <div className="bg-gray-700 px-3 py-1 rounded-md">Resistance 2: $48.00</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300">Recommendation</h4>
                  <p className="mt-2 text-white">WAIT / REDUCE — tighten stops or wait for clearer support before adding longs.</p>
                </div>
                <div>
                  <a href="#raw-json" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md">View Raw JSON</a>
                </div>
              </div>
            </div>
          </section>

          {/* Raw JSON Card */}
          <aside id="raw-json" className="bg-gray-800 p-4 rounded-xl shadow-inner overflow-auto">
            <h3 className="text-lg font-medium mb-3">Raw Analysis JSON</h3>
            <pre className="bg-gray-900 p-3 rounded text-sm overflow-auto max-h-[60vh]">
              <code>{JSON.stringify(analysisData, null, 2)}</code>
            </pre>
          </aside>
        </div>

        {/* Detailed signals table */}
        <section className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Signals Analyzed</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {analysisData.signals_analyzed.map((s, idx) => (
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
            ))}
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