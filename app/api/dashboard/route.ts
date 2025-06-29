import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const stocks = await prisma.stockData.findMany({
      select: {
        symbol: true,
        current_price: true,
        price_change: true,
        price_change_percent: true,
        market_bias: true,
        last_updated: true,
      },
      orderBy: {
        last_updated: 'desc',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: stocks.map((stock: { 
          symbol: string;
          current_price: number;
          price_change: number;
          price_change_percent: number;
          market_bias: string;
          last_updated: Date;
        }) => ({
          symbol: stock.symbol,
          current_price: stock.current_price,
          change: stock.price_change,
          change_percent: stock.price_change_percent,
          market_bias: stock.market_bias,
          last_updated: stock.last_updated.toISOString(),
        })),
        message: null,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        data: [],
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}