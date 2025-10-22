// app/dashboard/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Storage } from '@google-cloud/storage';
import TechnicalAnalysisDashboard from "../(components)/TechnicalAnalysisDashboard";

export const dynamic = "force-dynamic";

// Initialize Google Cloud Storage
const storage = new Storage();

// Direct data fetching function
async function getTechnicalData(symbol: string, date: string) {
  const bucketName = 'ttb-bucket1';
  const bucket = storage.bucket(bucketName);

  // List files for the given date and symbol
  const [files] = await bucket.getFiles({
    prefix: `daily/${date}/${symbol}`,
  });

  if (files.length === 0) {
    throw new Error(`No data found for ${symbol} on ${date}`);
  }

  // Find the latest signals file
  const signalsFile = files
    .filter(f => f.name.includes('signals') && f.name.endsWith('.json'))
    .sort()
    .pop();

  // Find the latest Gemini analysis file
  const geminiFile = files
    .filter(f => f.name.includes('gemini_analysis') && f.name.endsWith('.json'))
    .sort()
    .pop();

  if (!signalsFile) {
    throw new Error('Signals file not found');
  }

  // Download and parse signals file
  const [signalsContent] = await signalsFile.download();
  const technicalData = JSON.parse(signalsContent.toString());

  // Download and parse Gemini analysis if available
  let geminiAnalysis = null;
  if (geminiFile) {
    const [geminiContent] = await geminiFile.download();
    geminiAnalysis = JSON.parse(geminiContent.toString());
  }

  return { technicalData, geminiAnalysis };
}

export default async function DashboardPage() {
  // 1. Authenticate with Clerk
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // 2. Set symbol and date
  const symbol = "RGTI";
  const date = new Date().toISOString().split("T")[0];

  try {
    // 3. Fetch data directly from GCP
    const { technicalData, geminiAnalysis } = await getTechnicalData(symbol, date);

    // 4. Render dashboard
    return (
      <main className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto py-10">
          <header className="mb-8">
            <h1 className="text-4xl font-bold">
              Welcome, {user.firstName || 'User'}
            </h1>
            <p className="text-gray-400 mt-2">
              Technical Analysis Dashboard - {symbol}
            </p>
          </header>

          <TechnicalAnalysisDashboard
            technicalData={technicalData}
            geminiAnalysis={geminiAnalysis}
          />
        </div>
      </main>
    );
  } catch (error) {
    console.error("Dashboard error:", error);

    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-red-400">
            Error Loading Dashboard
          </h1>
          <p className="text-gray-400 mb-6">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Try Again
          </a>
        </div>
      </main>
    );
  }
}


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