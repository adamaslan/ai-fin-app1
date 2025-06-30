// app/api/stocks/route.js
import { prisma } from "../../../prisma/globalprisma";

export async function GET() { // Renamed to GET for handling GET requests
  try {
    const stocks = await prisma.stock_data.findMany();

    // Convert BigInt to string for JSON serialization
    const serializedStocks = stocks.map(stock => ({
      ...stock,
      volume: stock.volume.toString(),
      avg_volume: stock.avg_volume.toString()
    }));

    return Response.json(serializedStocks);
  } catch (error) {
    console.error("Error fetching stocks:", error);
    return Response.json(
      { error: "Failed to fetch stocks" },
      { status: 500 }
    );
  }
}