import { NextRequest, NextResponse } from 'next/server';
import { StockService } from '../../lib/stock-service';
import { ApiResponse} from '../../lib/types';

interface RouteParams {
  params: {
    symbol: string;
  };
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { symbol } = params;
    
    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          data: {} as any,
          message: 'Symbol parameter is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const stockData = await StockService.getStockData(symbol);
    
    if (!stockData) {
      return NextResponse.json(
        {
          success: false,
          data: {} as any,
          message: `Stock data not found for symbol: ${symbol}`,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: stockData,
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
        data: {} as any,
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
  try {
    const { symbol } = params;
    
    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          data: {} as any,
          message: 'Symbol parameter is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const stockData = await StockService.updateStockData(symbol, body);

    return NextResponse.json(
      {
        success: true,
        data: stockData,
        message: 'Stock data updated successfully',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        data: {} as any,
        message: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
