"use client"
import Image from "next/image";
import SpreadSuggestionsServer from "./(components)/Spread1";
import Link from 'next/link';
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Hero section */}
        <div className="text-center space-y-8 max-w-4xl mb-12">
          {/* Logo */}
          <div className="inline-block bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <Image
              className="dark:invert"
              src="/next.svg"
              alt="Stock Dashboard"
              width={100}
              height={20}
              priority
            />
          </div>

          {/* Main heading */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Stock Dashboard
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-white/70 font-light max-w-2xl mx-auto">
              Real-time technical analysis with AI-powered option strategies
            </p>
          </div>

          {/* Quick features */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-white/60">
            <span className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">📊 Live Technical Indicators</span>
            <span className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">🎯 Smart Option Spreads</span>
            <span className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">⚡ Real-time Updates</span>
          </div>


      {/* Dashboard Component Section */}
      <div id="dashboard" className="relative z-10 min-h-screen bg-gradient-to-b from-transparent to-slate-900/50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Live Dashboard</h2>
            <p className="text-white/60">Real-time QUBT stock analysis and option strategies</p>
         go to DataPage1
         <Link href="/DataPage1">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md">
            View in AG Grid
          </button>
        </Link>
          </div>
          
          {/* Dashboard container with subtle styling */}

<div className="opacity-0 animate-fade-in-up bg-white/5 text-white/60 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-green-500/30">
  <SpreadSuggestionsServer />
</div>

        </div>
      </div>

    
    </div>
  </div>
        </div>
    
  );
}