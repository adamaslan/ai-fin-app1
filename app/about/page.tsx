import Link from "next/link";

export default function About() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-indigo-900 text-white">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-4">About this app</h1>

          <p className="text-lg text-white/70 mb-6">
            Our provides concise, trade-ready technical analysis and option strategy suggestions powered by
            automated signal processing and AI. It turns raw market data into prioritized signals, clear risk metrics,
            and actionable entry/exit ideas so traders can move faster.
          </p>

          <section className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
            <h2 className="text-2xl font-semibold mb-3">What you get (preview)</h2>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Real-time technical snapshots: moving averages, MACD, stochastic, MFI, ADX and Ichimoku status.</li>
              <li>Signal ranking: strongest signals highlighted with confidence scores and timestamps.</li>
              <li>Key levels: immediate support/resistance, SMA levels (20/50/200) and trade triggers.</li>
              <li>Risk metrics: volatility, ADX trend strength, and overbought/extended warnings.</li>
              <li>Trade ideas: conditional long/short entries, stop-loss placement, and initial targets.</li>
            </ul>
          </section>

          <section className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
            <h2 className="text-2xl font-semibold mb-3">What you see after logging in</h2>
            <ul className="list-disc list-inside text-white/70 space-y-2">
              <li>Interactive charts with overlayed indicators and annotated trade triggers.</li>
              <li>Live-updating signal stream and historical signal context.</li>
              <li>AI-assisted option spread suggestions tailored to the selected timeframe and risk profile.</li>
              <li>Exportable trade-ready entries (price, stop, target) and volume-confirmation filters.</li>
            </ul>
          </section>

          <section className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
            <h2 className="text-2xl font-semibold mb-3">Who it&apos;s for</h2>
            <p className="text-white/70">Active traders, prop traders, and technically-minded investors who want fast, data-driven trade ideas with clear risk controls.</p>
          </section>

          <section className="text-sm text-white/60 mb-6">
            <h3 className="font-semibold mb-2">Important notes</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Not financial advice—use signals together with your own research and risk management.</li>
              <li>Signals are snapshot-driven and may change rapidly; monitor volume and broader market context.</li>
              <li>Some features require an account — charts, live streams, and option strategy generation are behind login.</li>
            </ul>
          </section>

          <div className="flex gap-4 items-center">
            <Link href="/login" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg">
              Log in
            </Link>

            <Link href="/signup" className="inline-block border border-white/20 text-white/90 px-6 py-3 rounded-lg">
              Create account
            </Link>

            <Link href="/" className="ml-auto text-sm text-white/60 underline">
              Back home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
