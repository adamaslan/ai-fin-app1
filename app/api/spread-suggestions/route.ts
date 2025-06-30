// app/api/spread-suggestions/route.js
import { prisma } from "../../../prisma/globalprisma"; // <-- This line MUST be uncommented

export async function GET() { // Renamed to GET for handling GET requests
  try {
    const spreadSuggestions = await prisma.spread_suggestions.findMany();

    return Response.json(spreadSuggestions);
  } catch (error) {
    console.error("Error fetching spread suggestions:", error);
    return Response.json(
      { error: "Failed to fetch spread suggestions" },
      { status: 500 }
    );
  }
}