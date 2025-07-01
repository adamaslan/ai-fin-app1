import prisma from "../lib/prisma"; // Direct server-side import
import { format } from 'date-fns'; // For date formatting

// Define the type for a SpreadSuggestion, matching your Prisma schema
interface SpreadSuggestion {
  id: number;
  stock_symbol: string;
  timeframe: string;
  call_type: string;
  call_max_profit: string;
  call_max_loss: string;
  call_breakeven: string;
  put_type: string;
  put_max_profit: string;
  put_max_loss: string;
  put_breakeven: string;
  technical_justification: string[];
  expiration_date: Date;
}

export default async function SpreadSuggestionsPage() {
  // Data fetching logic
  const suggestions = await prisma.spread_suggestions.findMany({
    orderBy: { expiration_date: 'desc' },
  });

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Latest Spread Suggestions</h1>

      {suggestions.length === 0 ? (
        <p>No spread suggestions found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {suggestions.map((sugg: SpreadSuggestion) => (
            <article key={sugg.id} className="border rounded-2xl p-4 shadow">
              <header className="mb-4">
                <h2 className="text-xl font-semibold">{sugg.stock_symbol} - {sugg.timeframe}</h2>
                <p className="text-sm text-gray-500">
                  Expires: {format(sugg.expiration_date, 'MMMM dd, yyyy')}
                </p>
              </header>

              <section className="mb-4">
                <h3 className="font-medium">Call Leg</h3>
                <ul className="list-disc list-inside">
                  <li>Type: {sugg.call_type}</li>
                  <li>Max Profit: {sugg.call_max_profit}</li>
                  <li>Max Loss: {sugg.call_max_loss}</li>
                  <li>Breakeven: {sugg.call_breakeven}</li>
                </ul>
              </section>

              <section className="mb-4">
                <h3 className="font-medium">Put Leg</h3>
                <ul className="list-disc list-inside">
                  <li>Type: {sugg.put_type}</li>
                  <li>Max Profit: {sugg.put_max_profit}</li>
                  <li>Max Loss: {sugg.put_max_loss}</li>
                  <li>Breakeven: {sugg.put_breakeven}</li>
                </ul>
              </section>

              <section>
                <h3 className="font-medium">Technical Justification</h3>
                <ul className="list-decimal list-inside">
                  {sugg.technical_justification.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </section>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
