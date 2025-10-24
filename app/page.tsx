// import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-black text-white">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* <div className="inline-block mb-6 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
            <Image src="/next.svg" alt="AI Fin" width={120} height={28} priority />
          </div> */}

          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">ORCL — Technical Snapshot</h1>
          <p className="text-lg text-white/70 mb-6">Concise, data-driven signals to act faster. Log in to access live charts, trade-ready signals, and option strategies.</p>

          {/* Snapshot card */}
          <section className="bg-white/5 rounded-2xl p-6 text-left shadow-lg border border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-sm text-white/60">Signal count</div>
                <div className="text-2xl font-bold">12</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/60">Timestamp</div>
                <div className="text-sm">20251023_170132</div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-xl font-semibold">Strongest Signal</h3>
              <p className="text-white/70">MA ALIGNMENT BULLISH — 10 &gt; 20 &gt; 50 SMA (note: extended from 200 SMA)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-3 bg-white/3 rounded-lg">
                <div className="text-sm text-white/60">Overall Bias</div>
                <div className="font-semibold">Neutral → Slight Bullish</div>
                <div className="text-xs text-white/60 mt-1">Confidence: 6/10</div>
              </div>

              <div className="p-3 bg-white/3 rounded-lg">
                <div className="text-sm text-white/60">Key Levels</div>
                <div className="font-semibold">Resistance: $280.07 • $285–$290</div>
                <div className="text-xs text-white/60 mt-1">Support: 20 SMA ≈ $271.46 • 50 SMA ≈ $273.61 • 200 SMA ≈ $201.65</div>
              </div>

              <div className="p-3 bg-white/3 rounded-lg">
                <div className="text-sm text-white/60">Risk</div>
                <div className="font-semibold">High — Extended from 200 SMA</div>
                <div className="text-xs text-white/60 mt-1">Volatility ~47% • ADX 15.6 (weak trend)</div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold">Trading Recommendation</h4>
              <ul className="list-disc list-inside text-white/70 mt-2">
                <li>Wait for confirmed breakout above resistance for a small long entry (entry ~ $282; SL below 20-day SMA).</li>
                <li>Alternatively, consider short if price breaks below 20-day SMA (entry ~ $270; tight stop above 20-day SMA).</li>
                <li>Always confirm with volume & broader market context.</li>
              </ul>
            </div>

            <p className="text-xs text-white/50 mt-4">This summary is a preview — full, interactive analysis and trade tools are available after logging in.</p>
          </section>

          {/* CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg"
            >
              Log in to view full analysis
            </Link>

            <Link
              href="/signup"
              className="inline-block border border-white/20 text-white/90 px-6 py-3 rounded-lg"
            >
              Create an account
            </Link>
          </div>

          <p className="text-xs text-white/50 mt-6">Not financial advice. Data shown is a snapshot — log in for live updates, charts, and trade-ready option strategies.</p>
        </div>
      </div>
    </main>
  );
}
