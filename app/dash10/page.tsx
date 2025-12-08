// app/dashboard-options/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Storage } from "@google-cloud/storage";
import fs from "fs";
import OptionsAnalysisDashboardClient from "../../components/OptionsAnalysisDashboardClient/page";

interface Spread {
  type: string;
  expiration: string;
  strategy: string;
  credit: string;
  risk: string;
  rationale: string;
}

interface OptionsAnalysisData {
  ticker: string;
  date: string;
  referencePrice: number;
  indicators: Record<string, any>;
  spreads: Spread[];
}

interface GetFilesApiResponse {
  prefixes?: string[];
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Validate environment variables
if (!process.env.GCP_PROJECT_ID) {
  throw new Error("GCP_PROJECT_ID is required");
}

if (!process.env.GCP_CREDENTIALS && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error("GCP_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS is required");
}

function getGCPCredentials() {
  try {
    const raw = process.env.GCP_CREDENTIALS ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!raw) {
      throw new Error("No GCP credentials provided via env vars");
    }

    let credentials: Record<string, unknown>;
    const trimmed = raw.trim();
    if (trimmed.startsWith("{")) {
      credentials = JSON.parse(trimmed) as Record<string, unknown>;
    } else {
      const filePath = raw;
      const fileContents = fs.readFileSync(filePath, "utf8");
      credentials = JSON.parse(fileContents) as Record<string, unknown>;
    }

    return {
      projectId: process.env.GCP_PROJECT_ID || "dfl-2024-a",
      credentials,
    };
  } catch (error) {
    console.error("Failed to load GCP credentials:", error);
    throw error;
  }
}

const storageClient = new Storage(getGCPCredentials());
const BUCKET_NAME = "ttb-bucket1";

/**
 * Get all available tickers from spreads-yo folder
 */
async function getAvailableTickersFromSpreads(): Promise<string[]> {
  try {
    const [, , apiResponse] = await storageClient
      .bucket(BUCKET_NAME)
      .getFiles({
        prefix: "spreads-yo/",
        delimiter: "/",
      });

    const apiTyped = apiResponse as GetFilesApiResponse | undefined;
    const prefixes: string[] = apiTyped?.prefixes ?? [];

    // Extract tickers from folder names if organized by ticker
    // Otherwise, scan all files
    if (prefixes.length > 0) {
      return prefixes
        .map((p) => p.split("/").filter(Boolean).pop() || "")
        .filter(Boolean)
        .sort();
    }

    // Fallback: scan files directly
    const [files] = await storageClient
      .bucket(BUCKET_NAME)
      .getFiles({
        prefix: "spreads-yo/",
      });

    const tickerSet = new Set<string>();

    files.forEach((file) => {
      const fileName = file.name.split("/").pop() || "";
      const match = fileName.match(/^([A-Z]+)_spread_analysis_/);
      if (match) {
        tickerSet.add(match[1]);
      }
    });

    return Array.from(tickerSet).sort();
  } catch (error) {
    console.error("Error fetching available tickers from spreads-yo:", error);
    return [];
  }
}

/**
 * Get latest markdown analysis file for a ticker
 */
async function getLatestOptionsAnalysis(
  ticker: string
): Promise<OptionsAnalysisData | null> {
  try {
    const [tickerFiles] = await storageClient
      .bucket(BUCKET_NAME)
      .getFiles({
        prefix: `spreads-yo/${ticker}_spread_analysis_`,
      });

    if (tickerFiles.length === 0) {
      return null;
    }

    // Sort files in descending order (newest first) and get the first element
    tickerFiles.sort((a, b) => b.name.localeCompare(a.name));
    const latestFile = tickerFiles[0];

    const [markdown] = await latestFile.download();
    const content = markdown.toString();

    // Parse markdown
    return parseMarkdownAnalysis(content);
  } catch (error) {
    console.error(`Error fetching options analysis for ${ticker}:`, error);
    return null;
  }
}

/**
 * Parse markdown analysis from Python script output
 */
function parseMarkdownAnalysis(content: string): OptionsAnalysisData | null {
  try {
    const lines = content.split("\n");
    const data: OptionsAnalysisData = {
      ticker: "",
      date: "",
      referencePrice: 0,
      indicators: {},
      spreads: [],
    };

    let currentSpread: Spread | null = null;
    let inRationale = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Extract title and ticker
      if (line.startsWith("# AI-Enhanced")) {
        const match = line.match(/Analysis: (\w+)/);
        if (match) data.ticker = match[1];
      }

      // Extract date
      if (line.startsWith("**Date:**")) {
        const dateMatch = line.match(/Date:\*\* (.*)/);
        if (dateMatch) data.date = dateMatch[1];
      }

      // Extract reference price
      if (line.startsWith("**Reference Price:**")) {
        const priceMatch = line.match(/\$([0-9.]+)/);
        if (priceMatch) data.referencePrice = parseFloat(priceMatch[1]);
      }

      // Extract indicators
      if (line.startsWith("- **") && !line.includes("Spread")) {
        const indicatorMatch = line.match(/- \*\*([^:]+):\*\* (.*)/);
        if (indicatorMatch) {
          const value = parseFloat(indicatorMatch[2]);
          data.indicators[indicatorMatch[1]] = isNaN(value)
            ? indicatorMatch[2]
            : value;
        }
      }

      // Detect spread sections (e.g., "### Put Credit Spread (2025-02-28)")
      if (line.includes("Credit Spread") && line.includes("(")) {
        if (currentSpread) data.spreads.push(currentSpread);

        const typeMatch = line.match(/(Put|Call) Credit Spread/);
        const expMatch = line.match(/\((.*?)\)/);

        currentSpread = {
          type: typeMatch ? `${typeMatch[1]} Credit Spread` : "Credit Spread",
          expiration: expMatch ? expMatch[1] : "",
          strategy: "",
          credit: "",
          risk: "",
          rationale: "",
        };
        inRationale = false;
      }

      // Extract strategy
      if (currentSpread && line.startsWith("**Strategy:**")) {
        const stratMatch = line.match(/Strategy:\*\* (.*)/);
        if (stratMatch) currentSpread.strategy = stratMatch[1];
      }

      // Extract credit and risk
      if (currentSpread && line.startsWith("**Est. Credit:**")) {
        const parts = line.match(/Credit:\*\* \$([\d.]+).*Risk:\*\* \$([\d.]+)/);
        if (parts) {
          currentSpread.credit = parts[1];
          currentSpread.risk = parts[2];
        }
      }

      // Extract analysis/rationale
      if (currentSpread && line.startsWith("**Analysis:**")) {
        inRationale = true;
        continue;
      }

      if (
        currentSpread &&
        inRationale &&
        line.trim() &&
        !line.startsWith("**") &&
        !line.startsWith("###") &&
        !line.startsWith("---")
      ) {
        currentSpread.rationale += (currentSpread.rationale ? " " : "") + line;
      }

      if (
        currentSpread &&
        inRationale &&
        (line.startsWith("###") || line.startsWith("---"))
      ) {
        inRationale = false;
      }
    }

    if (currentSpread) data.spreads.push(currentSpread);

    return data.spreads.length > 0 ? data : null;
  } catch (error) {
    console.error("Error parsing markdown analysis:", error);
    return null;
  }
}

/**
 * Fetch historical price data for a ticker
 */
async function getHistoricalPriceData(ticker: string): Promise<any[] | null> {
  try {
    // Check if there's a historical data file in GCP
    // This would need to be generated by your data pipeline
    const [files] = await storageClient
      .bucket(BUCKET_NAME)
      .getFiles({
        prefix: `historical/${ticker}_`,
      });

    if (files.length === 0) {
      console.log(
        `No historical data found for ${ticker}, chart will use mock data`
      );
      return null;
    }

    // Get most recent historical data file
    files.sort((a, b) => b.name.localeCompare(a.name));
    const [data] = await files[0].download();
    return JSON.parse(data.toString());
  } catch (error) {
    console.error(
      `Error fetching historical price data for ${ticker}:`,
      error
    );
    return null;
  }
}
async function getTechnicalData(ticker: string): Promise<any> {
  try {
    const [, , apiResponse] = await storageClient
      .bucket(BUCKET_NAME)
      .getFiles({
        prefix: "daily/",
        delimiter: "/",
      });

    const apiTyped = apiResponse as GetFilesApiResponse | undefined;
    const dateFolders: string[] = apiTyped?.prefixes ?? [];

    if (dateFolders.length === 0) {
      return null;
    }

    const sortedDateFolders = dateFolders.sort().reverse();

    for (const datePrefix of sortedDateFolders) {
      const [files] = await storageClient
        .bucket(BUCKET_NAME)
        .getFiles({ prefix: datePrefix });

      const geminiFile = files
        .filter(
          (f) =>
            f.name.includes(`${ticker}_gemini_analysis_`) &&
            f.name.endsWith(".json")
        )
        .sort((a, b) => b.name.localeCompare(a.name))
        .pop();

      if (geminiFile) {
        const [data] = await geminiFile.download();
        return JSON.parse(data.toString());
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching technical data for ${ticker}:`, error);
    return null;
  }
}

export default async function OptionsAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  console.log("Testing GCS bucket access...");
  try {
    const [exists] = await storageClient.bucket(BUCKET_NAME).exists();
    console.log(`✅ Bucket ${BUCKET_NAME} exists:`, exists);
  } catch (error) {
    console.error("❌ Error accessing bucket:", error);
  }

  // Get available tickers from spreads-yo folder
  const availableSymbols = await getAvailableTickersFromSpreads();
  console.log("📊 Available symbols with options analysis:", availableSymbols);

  const params = await searchParams;
  const symbol = params.symbol || availableSymbols[0] || "MP";

  // Fetch options analysis markdown
  let optionsAnalysisData = null;
  try {
    optionsAnalysisData = await getLatestOptionsAnalysis(symbol);
    console.log(
      `✅ Loaded options analysis for ${symbol}:`,
      optionsAnalysisData?.spreads.length,
      "spreads"
    );
  } catch (error) {
    console.error("Failed to fetch options analysis:", error);
  }

  // Fetch technical data from gemini analysis
  let technicalData = null;
  try {
    technicalData = await getTechnicalData(symbol);
    console.log(`✅ Loaded technical data for ${symbol}`);
  } catch (error) {
    console.error("Failed to fetch technical data:", error);
  }

  // Fetch historical price data for charts
  let historicalPriceData = null;
  try {
    historicalPriceData = await getHistoricalPriceData(symbol);
    if (historicalPriceData) {
      console.log(
        `✅ Loaded historical price data for ${symbol} (${historicalPriceData.length} candles)`
      );
    }
  } catch (error) {
    console.error("Failed to fetch historical price data:", error);
  }

  // Provide fallback technical data structure if gemini data unavailable
  if (!technicalData && optionsAnalysisData) {
    technicalData = {
      price: optionsAnalysisData.referencePrice,
      change_pct: 0,
      volume: 0,
      indicators: Object.entries(optionsAnalysisData.indicators)
        .filter(([key]) =>
          [
            "RSI",
            "MACD_Value",
            "Stoch_K",
            "MFI",
            "ATR",
            "HV_30d",
          ].includes(key)
        )
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
      moving_averages: Object.entries(optionsAnalysisData.indicators)
        .filter(([key]) => key.startsWith("SMA_"))
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
      bullish_count: 0,
      bearish_count: 0,
    };
  }

  return (
    <OptionsAnalysisDashboardClient
      user={{ firstName: user?.firstName || "User" }}
      availableSymbols={availableSymbols}
      selectedSymbol={symbol}
      optionsAnalysisData={optionsAnalysisData}
      technicalData={technicalData}
      historicalPriceData={historicalPriceData}
      bucketName={BUCKET_NAME}
    />
  );
}