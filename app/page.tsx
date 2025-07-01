"use client"
import Image from "next/image";

// import QubtComponent from "./(components)/stock4";

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

          {/* CTA Button */}
          <div className="pt-4">
            <button 
              onClick={() => document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-300 ease-out transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur group-hover:blur-md transition duration-300"></div>
              <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-full px-8 py-4 border border-white/20 group-hover:border-white/40 transition duration-300">
                <span className="flex items-center gap-3">
                  View Dashboard
                  <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Component Section */}
      <div id="dashboard" className="relative z-10 min-h-screen bg-gradient-to-b from-transparent to-slate-900/50">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Live Dashboard</h2>
            <p className="text-white/60">Real-time QUBT stock analysis and option strategies</p>
          </div>
          
          {/* Dashboard container with subtle styling */}
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden">
     {/* <QubtComponent /> */}
          </div>
        </div>
      </div>

      <style jsx>{`
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}