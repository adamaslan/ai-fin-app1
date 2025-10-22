import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import TechnicalAnalysisDashboard from "../../(components)/TechnicalAnalysisDashboard";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    symbol: string;
  };
  searchParams: {
    date?: string;
  };
}

export default async function SymbolDashboard({ params, searchParams }: PageProps) {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  const symbol = params.symbol.toUpperCase();
  const date = searchParams.date || new Date().toISOString().split("T")[0];

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  try {
    const res = await fetch(
      `${baseUrl}/api/technical-analysis?symbol=${symbol}&date=${date}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      if (res.status === 404) {
        notFound();
      }
      throw new Error(`API error: ${res.status}`);
    }

    const { technicalData, geminiAnalysis } = await res.json();

    return (
      <main className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto py-10">
          <TechnicalAnalysisDashboard
            technicalData={technicalData}
            geminiAnalysis={geminiAnalysis}
          />
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error loading dashboard:", error);
    throw error; // Let Next.js error boundary handle it
  }
}



// 'use client';
// import { auth } from '@clerk/nextjs/server'
// // import Nav from '../components/Navbar/page'
// // import SpreadSuggestionsServer from '../(components)/Spread1'
// // import Link from 'next/link'
// import  TechnicalAnalysisDashboard from '../(components)/textanalysis'
// import { useState, useEffect } from 'react';
// // import TechnicalAnalysisDashboard from '@/components/TechnicalAnalysisDashboard';
// import { Loader2 } from 'lucide-react';



// export default async function DashboardPage() {
//   // Protect this route - redirects to sign-in if not authenticated
//   const { userId } = await auth()
//   const [data, setData] = useState<any>(null);
//   const [loading, setLoading] = useState(true);


//   if (!userId) {
//     return null
//   }

//     useEffect(() => {
//     async function fetchData() {
//       try {
//         const response = await fetch('/api/technical-analysis/local?symbol=RGTI');
//         const result = await response.json();
//         setData(result);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       } finally {
//         setLoading(false);
//       }
//     }
    
//     fetchData();
//   }, []);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <Loader2 className="w-8 h-8 animate-spin" />
//       </div>
//     );
//   }

//   if (!data) {
//     return <div>No data available</div>;
//   }

//   return (
//     <>
//       {/* <Nav /> */}
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
//         <div className="max-w-7xl mx-auto">
//           <div className="mb-12">
//             <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-8">
//               <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
//                 Stock Newest Dashboard Oct 14th
//               </span>
//             </h1>
//             <p className="text-white/60 text-lg">
//               Welcome! You are signed in with user ID:{' '}
//               <span className="font-mono bg-white/10 px-2 py-1 rounded border border-white/20">
//                 {userId}
//               </span>
//             </p>
//           </div>

//           <div className="animate-fade-in-up bg-white/5 text-white/60 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-green-500/30">
//             {/* <SpreadSuggestionsServer /> */}
//            <TechnicalAnalysisDashboard
//       technicalData={data.technicalData}
//       geminiAnalysis={data.geminiAnalysis}
//     />
//           </div>
//         </div>
//       </div>
//     </>
//   )
// }