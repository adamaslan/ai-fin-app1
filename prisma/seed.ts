import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();


async function fetchStockData() {
  const response = await fetch("http://localhost:8000/stocks/");
  if (!response.ok) {
    throw new Error("Failed to fetch data from FastAPI");
  }
  return response.json();
}

async function main() {
  const stockData = await fetchStockData();

  for (const stock of stockData) {
    await prisma.stock_data.create({
      data: {
        symbol: stock.symbol,
        indicators_symbol: stock.indicators_symbol,
        indicators_timestamp: new Date(stock.indicators_timestamp),
        price: stock.price,
        change: stock.change,
        change_percent: stock.change_percent,
        //volume: (stock.volume),
        //avg_volume: (stock.avg_volume),
        ema_10: stock.ema_10,
        ema_20: stock.ema_20,
        sma_50: stock.sma_50,
        rsi: stock.rsi,
        macd: stock.macd,
        macd_signal: stock.macd_signal,
        macd_histogram: stock.macd_histogram,
        bb_upper: stock.bb_upper,
        bb_middle: stock.bb_middle,
        bb_lower: stock.bb_lower,
        stoch_k: stock.stoch_k,
        stoch_d: stock.stoch_d,
        williams_r: stock.williams_r,
        cci: stock.cci,
        market_bias: stock.market_bias,
        bias_strength: stock.bias_strength,
        support_levels: stock.support_levels,
        resistance_levels: stock.resistance_levels,
        overall_recommendation: stock.overall_recommendation,
        expected_moves: stock.expected_moves,
        last_updated: new Date(stock.last_updated),
        is_updating: stock.is_updating,
        spread_suggestions: {
          create: stock.spread_suggestions.map((suggestion: any) => ({
            timeframe: suggestion.timeframe,
            expiration_date: new Date(suggestion.expiration_date),
            expected_move: suggestion.expected_move,
            call_type: suggestion.call_type,
            call_short_strike: suggestion.call_short_strike,
            call_long_strike: suggestion.call_long_strike,
            call_width: suggestion.call_width,
            call_max_profit: suggestion.call_max_profit,
            call_max_loss: suggestion.call_max_loss,
            call_breakeven: suggestion.call_breakeven,
            put_type: suggestion.put_type,
            put_short_strike: suggestion.put_short_strike,
            put_long_strike: suggestion.put_long_strike,
            put_width: suggestion.put_width,
            put_max_profit: suggestion.put_max_profit,
            put_max_loss: suggestion.put_max_loss,
            put_breakeven: suggestion.put_breakeven,
            technical_justification: suggestion.technical_justification,
          })),
        },
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
