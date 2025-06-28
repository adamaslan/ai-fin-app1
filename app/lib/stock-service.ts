import { prisma } from './prisma';
import { StockData, SpreadSuggestion } from './types';

export class StockService {
  static async getStockData(symbol: string): Promise<StockData | null> {
    try {
      const stockData = await prisma.stock_data.findUnique({
        where: { symbol: symbol.toUpperCase() },
        include: {
          spreadSuggestions: {
            orderBy: { expirationDate: 'asc' }
          }
        }
      });

      if (!stockData) {
        return null;
      }

      return this.formatStockData(stockData);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      throw new Error('Failed to fetch stock data');
    }
  }

  static async updateStockData(symbol: string, data: Partial<StockData>): Promise<StockData> {
    try {
      const { indicators, spreads } = data;
      
      if (!indicators || !spreads) {
        throw new Error('Missing required data');
      }

      // Update or create stock data
      const updatedStock = await prisma.stock_data.upsert({
        where: { symbol: symbol.toUpperCase() },
        update: {
          currentPrice: indicators.current_price.price,
          priceChange: indicators.current_price.change,
          priceChangePercent: indicators.current_price.change_percent,
          volume: BigInt(indicators.current_price.volume),
          avgVolume: BigInt(indicators.current_price.avg_volume),
          ema10: indicators.indicators.EMA_10,
          ema20: indicators.indicators.EMA_20,
          sma50: indicators.indicators.SMA_50,
          rsi: indicators.indicators.RSI,
          macd: indicators.indicators.MACD,
          macdSignal: indicators.indicators.MACD_Signal,
          macdHistogram: indicators.indicators.MACD_Histogram,
          bbUpper: indicators.indicators.BB_Upper,
          bbMiddle: indicators.indicators.BB_Middle,
          bbLower: indicators.indicators.BB_Lower,
          stochK: indicators.indicators.Stoch_K,
          stochD: indicators.indicators.Stoch_D,
          williamsR: indicators.indicators.Williams_R,
          cci: indicators.indicators.CCI,
          marketBias: spreads.market_bias,
          biasStrength: spreads.bias_strength,
          supportLevels: spreads.support_levels,
          resistanceLevels: spreads.resistance_levels,
          overallRecommendation: spreads.overall_recommendation,
          expectedMoves: spreads.expected_moves,
          isUpdating: false,
        },
        create: {
          symbol: symbol.toUpperCase(),
          currentPrice: indicators.current_price.price,
          priceChange: indicators.current_price.change,
          priceChangePercent: indicators.current_price.change_percent,
          volume: BigInt(indicators.current_price.volume),
          avgVolume: BigInt(indicators.current_price.avg_volume),
          ema10: indicators.indicators.EMA_10,
          ema20: indicators.indicators.EMA_20,
          sma50: indicators.indicators.SMA_50,
          rsi: indicators.indicators.RSI,
          macd: indicators.indicators.MACD,
          macdSignal: indicators.indicators.MACD_Signal,
          macdHistogram: indicators.indicators.MACD_Histogram,
          bbUpper: indicators.indicators.BB_Upper,
          bbMiddle: indicators.indicators.BB_Middle,
          bbLower: indicators.indicators.BB_Lower,
          stochK: indicators.indicators.Stoch_K,
          stochD: indicators.indicators.Stoch_D,
          williamsR: indicators.indicators.Williams_R,
          cci: indicators.indicators.CCI,
          marketBias: spreads.market_bias,
          biasStrength: spreads.bias_strength,
          supportLevels: spreads.support_levels,
          resistanceLevels: spreads.resistance_levels,
          overallRecommendation: spreads.overall_recommendation,
          expectedMoves: spreads.expected_moves,
        },
        include: {
          spreadSuggestions: true
        }
      });

      // Delete existing spread suggestions and create new ones
      await prisma.spreadSuggestions.deleteMany({
        where: { stockDataId: updatedStock.id }
      });

      if (spreads.spread_suggestions.length > 0) {
        await prisma.spreadSuggestions.createMany({
          data: spreads.spread_suggestions.map((suggestion) => ({
            stockDataId: updatedStock.id,
            timeframe: suggestion.timeframe,
            expirationDate: new Date(suggestion.expiration_date),
            expectedMove: suggestion.expected_move,
            callType: suggestion.call_spread.type,
            callShortStrike: suggestion.call_spread.short_strike,
            callLongStrike: suggestion.call_spread.long_strike,
            callWidth: suggestion.call_spread.width,
            callMaxProfit: suggestion.call_spread.max_profit,
            callMaxLoss: suggestion.call_spread.max_loss,
            callBreakeven: suggestion.call_spread.breakeven,
            putType: suggestion.put_spread.type,
            putShortStrike: suggestion.put_spread.short_strike,
            putLongStrike: suggestion.put_spread.long_strike,
            putWidth: suggestion.put_spread.width,
            putMaxProfit: suggestion.put_spread.max_profit,
            putMaxLoss: suggestion.put_spread.max_loss,
            putBreakeven: suggestion.put_spread.breakeven,
            technicalJustification: suggestion.technical_justification,
          }))
        });
      }

      // Fetch the updated data with spread suggestions
      const finalData = await prisma.stock_data.findUnique({
        where: { symbol: updatedStock.symbol },
        include: {
          spreadSuggestions: {
            orderBy: { expirationDate: 'asc' }
          }
        }
      });

      if (!finalData) {
        throw new Error('Failed to retrieve updated data');
      }

      return this.formatStockData(finalData);
    } catch (error) {
      console.error('Error updating stock data:', error);
      throw new Error('Failed to update stock data');
    }
  }

  private static formatStockData(data: any): StockData {
    const spreadSuggestions: SpreadSuggestion[] = data.spreadSuggestions.map((suggestion: any) => ({
      timeframe: suggestion.timeframe,
      expiration_date: suggestion.expirationDate.toISOString(),
      expected_move: suggestion.expectedMove,
      call_spread: {
        type: suggestion.callType,
        short_strike: suggestion.callShortStrike,
        long_strike: suggestion.callLongStrike,
        width: suggestion.callWidth,
        max_profit: suggestion.callMaxProfit,
        max_loss: suggestion.callMaxLoss,
        breakeven: suggestion.callBreakeven,
      },
      put_spread: {
        type: suggestion.putType,
        short_strike: suggestion.putShortStrike,
        long_strike: suggestion.putLongStrike,
        width: suggestion.putWidth,
        max_profit: suggestion.putMaxProfit,
        max_loss: suggestion.putMaxLoss,
        breakeven: suggestion.putBreakeven,
      },
      technical_justification: Array.isArray(suggestion.technicalJustification) 
        ? suggestion.technicalJustification 
        : [],
    }));

    return {
      symbol: data.symbol,
      indicators: {
        symbol: data.symbol,
        timestamp: data.timestamp.toISOString(),
        current_price: {
          price: data.currentPrice,
          change: data.priceChange,
          change_percent: data.priceChangePercent,
          volume: Number(data.volume),
          avg_volume: Number(data.avgVolume),
        },
        indicators: {
          EMA_10: data.ema10,
          EMA_20: data.ema20,
          SMA_50: data.sma50,
          RSI: data.rsi,
          MACD: data.macd,
          MACD_Signal: data.macdSignal,
          MACD_Histogram: data.macdHistogram,
          BB_Upper: data.bbUpper,
          BB_Middle: data.bbMiddle,
          BB_Lower: data.bbLower,
          Stoch_K: data.stochK,
          Stoch_D: data.stochD,
          Williams_R: data.williamsR,
          CCI: data.cci,
        },
      },
      spreads: {
        market_bias: data.marketBias,
        bias_strength: data.biasStrength,
        support_levels: data.supportLevels,
        resistance_levels: data.resistanceLevels,
        spread_suggestions: spreadSuggestions,
        overall_recommendation: data.overallRecommendation,
        expected_moves: data.expectedMoves,
      },
      last_updated: data.lastUpdated.toISOString(),
      is_updating: data.isUpdating,
    };
  }
}