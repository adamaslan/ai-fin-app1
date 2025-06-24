import React, { useState, useEffect } from 'react';
// We'll use an icon library for some cute icons.
// In a real Next.js app, you'd install this: npm install lucide-react
// For this example, I'll create simple SVG components for the icons.

// --- Icon Components (so you don't need to install a library) ---
const IconRocket = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.05-3.18-.65-.87-2.12-.8-3.18.05Z"/><path d="m12 15-3-3a9 9 0 0 1 3-13v0c0 3.31 2.69 6 6 6v0a9 9 0 0 1-13 3z"/></svg>;
const IconTrendingUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const IconTrendingDown = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>;
const IconCheckCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconClock = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

// --- Helper Components for a Cuter UI ---

/**
 * A cute card for displaying a single technical indicator.
 */
const IndicatorCard = ({ title, value, unit = '' }) => {
    const displayValue = typeof value === 'number' ? value.toFixed(2) : value;
    return (
        <div className="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 transform hover:scale-105 transition-transform duration-300">
            <h3 className="text-sm font-medium text-slate-400">{title}</h3>
            <p className="text-2xl font-bold text-white mt-1">{displayValue}{unit}</p>
        </div>
    );
};

/**
 * A cute card for displaying spread suggestions (both call and put).
 */
const SpreadCard = ({ suggestion }) => {
    const { timeframe, expiration_date, call_spread, put_spread, technical_justification } = suggestion;

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-slate-700/50">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">{timeframe}</h3>
                <span className="text-sm text-slate-400 font-mono bg-slate-700/50 px-3 py-1 rounded-full">{expiration_date}</span>
            </div>

            {/* Spreads Details */}
            <div className="grid md:grid-cols-2 gap-6 mb-4">
                {/* Put Spread */}
                <div className="bg-slate-900/70 p-4 rounded-lg border border-teal-500/30">
                    <h4 className="font-bold text-teal-400 mb-2">💚 Put Credit Spread</h4>
                    <p className="text-slate-300 text-sm">Sell <span className="font-bold text-white">${put_spread.short_strike}</span> / Buy <span className="font-bold text-white">${put_spread.long_strike}</span></p>
                    <p className="text-slate-400 text-xs mt-1">Width: ${put_spread.width}</p>
                </div>

                {/* Call Spread */}
                 <div className="bg-slate-900/70 p-4 rounded-lg border border-fuchsia-500/30">
                    <h4 className="font-bold text-fuchsia-400 mb-2">💖 Call Credit Spread</h4>
                    <p className="text-slate-300 text-sm">Sell <span className="font-bold text-white">${call_spread.short_strike}</span> / Buy <span className="font-bold text-white">${call_spread.long_strike}</span></p>
                    <p className="text-slate-400 text-xs mt-1">Width: ${call_spread.width}</p>
                </div>
            </div>

            {/* Justification */}
            <div>
                <h5 className="text-sm font-semibold text-slate-300 mb-2">✨ Technical Justification</h5>
                <ul className="space-y-1.5">
                    {technical_justification.map((reason, index) => (
                        <li key={index} className="flex items-center text-xs text-slate-400">
                            <IconCheckCircle />
                            <span className="ml-2">{reason}</span>
                        </li>
                    ))}
                     {technical_justification.length === 0 && (
                        <li className="text-xs text-slate-500">No specific technical flags for this timeframe.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

/**
 * A cute loading spinner animation.
 */
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-fuchsia-500"></div>
        <p className="mt-4 text-lg">Summoning trading data...</p>
    </div>
);

/**
 * A cute error message display.
 */
const ErrorMessage = ({ message }) => (
     <div className="flex flex-col items-center justify-center min-h-screen text-white bg-red-500/10 p-8 rounded-2xl">
        <div className="text-5xl mb-4">😿</div>
        <h2 className="text-2xl font-bold text-red-400">Oops! Something went wrong.</h2>
        <p className="mt-2 text-slate-400">Could not fetch data from the trading API.</p>
        <code className="mt-4 bg-slate-800 text-red-300 p-3 rounded-lg text-sm">{message}</code>
    </div>
);


// --- Main Dashboard Component ---

export default function App() {
    // State to hold the dashboard data, loading status, and errors
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch data from the FastAPI backend when the component mounts
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // IMPORTANT: Make sure your FastAPI server is running on http://localhost:8000
                const response = await fetch('http://localhost:8000/api/dashboard/QUBT');
                if (!response.ok) {
                    throw new Error(`API responded with ${response.status}`);
                }
                const result = await response.json();
                if (result.success) {
                    setData(result.data);
                } else {
                    throw new Error(result.message || 'API call was not successful');
                }
            } catch (err) {
                setError(err.message);
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []); // Empty dependency array means this runs once on mount

    // Handle loading and error states
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!data) return <ErrorMessage message="No data was returned from the API." />;
    
    // Extract data for easier access
    const { indicators, spreads, last_updated, symbol } = data;
    const { market_bias, bias_strength, spread_suggestions } = spreads;

    const BiasIcon = market_bias === 'BULLISH' ? IconTrendingUp : IconTrendingDown;
    const biasColor = market_bias === 'BULLISH' ? 'text-teal-400' : 'text-fuchsia-400';

    return (
        <main className="bg-slate-900 min-h-screen text-white p-4 sm:p-6 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-violet-500 bg-clip-text text-transparent flex items-center gap-3">
                           <IconRocket /> {symbol} Trading Dashboard
                        </h1>
                        <p className="text-slate-400 mt-1">Cute options spread suggestions & indicators.</p>
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-4 sm:mt-0 flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full">
                        <IconClock />
                        Last Updated: {new Date(last_updated).toLocaleTimeString()}
                    </div>
                </header>

                {/* Indicators Grid */}
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-slate-200 mb-4">Key Indicators</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <IndicatorCard title="Current Price" value={indicators.current_price.price} unit="$" />
                        <IndicatorCard title="RSI" value={indicators.indicators.RSI} />
                        <IndicatorCard title="MACD" value={indicators.indicators.MACD} />
                        <IndicatorCard title="EMA 10" value={indicators.indicators.EMA_10} unit="$" />
                        <IndicatorCard title="EMA 20" value={indicators.indicators.EMA_20} unit="$" />
                        <IndicatorCard title="SMA 50" value={indicators.indicators.SMA_50} unit="$" />
                    </div>
                </section>

                {/* Market Bias Section */}
                <section className="mb-10 p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
                    <h2 className="text-2xl font-bold text-slate-200 mb-4">Market Bias</h2>
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                        <div className={`flex items-center gap-3 text-3xl font-extrabold ${biasColor}`}>
                           <BiasIcon /> {market_bias}
                        </div>
                        <div className="w-full md:w-1/2">
                            <div className="flex justify-between text-sm text-slate-400 mb-1">
                                <span>Bias Strength</span>
                                <span>{(bias_strength * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2.5">
                                <div className={`${market_bias === 'BULLISH' ? 'bg-teal-400' : 'bg-fuchsia-400'} h-2.5 rounded-full`} style={{ width: `${bias_strength * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                     <p className="text-sm text-slate-400 mt-4">{spreads.overall_recommendation}</p>
                </section>


                {/* Spread Suggestions Section */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-200 mb-4">🎯 Options Spread Ideas</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {spread_suggestions.map((suggestion, index) => (
                           <SpreadCard key={index} suggestion={suggestion} />
                        ))}
                    </div>
                </section>
                
                <footer className="text-center text-slate-600 mt-12 text-sm">
                    <p>Happy Trading! Always do your own research.</p>
                </footer>
            </div>
        </main>
    );
}
