// app/dashboard/page.tsx (Server Component)
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Storage } from "@google-cloud/storage";
import fs from "fs";
import DashboardClient from "../components/DashboardClient/page"

interface TechnicalDataResponse {
  technicalData: Record<string, unknown> | null;
  geminiAnalysis: Record<string, unknown> | null;
  date: string;
}

interface GetFilesApiResponse {
  prefixes?: string[];
}

interface AnalysisSignal {
  signal: string;
  desc: string;
  strength: string;
  category: string;
}

interface AnalysisData {
  symbol: string;
  timestamp: string;
  date: string;
  analysis: string;
  signal_count: number;
  signals_analyzed: AnalysisSignal[];
  overall_bias?: string;
  long_term_comment?: string;
  risk?: string[];
  key_levels?: string[];
  recommendation?: string;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Validate environment variables
if (!process.env.GCP_PROJECT_ID) {
  console.error("❌ GCP_PROJECT_ID environment variable is not set");
  throw new Error("GCP_PROJECT_ID is required");
}

if (!process.env.GCP_CREDENTIALS && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("❌ GCP_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS environment variable is not set");
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
    console.error("❌ Failed to load GCP credentials:", error);
    throw new Error(
      "Invalid or unreadable GCP credentials. Provide GCP_CREDENTIALS (JSON string) or GOOGLE_APPLICATION_CREDENTIALS (path to service-account JSON)."
    );
  }
}

const storageClient = new Storage(getGCPCredentials());
const BUCKET_NAME = "ttb-bucket1";

async function getAvailableSymbols(): Promise<string[]> {
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
      return [];
    }

    const symbolSet = new Set<string>();
    
    for (const datePrefix of dateFolders) {
      const [files] = await storageClient
        .bucket(BUCKET_NAME)
        .getFiles({ prefix: datePrefix });
      
      files.forEach(file => {
        const fileName = file.name.split('/').pop() || '';
        const signalsMatch = fileName.match(/signals_([A-Z]+)_/);
        if (signalsMatch) {
          symbolSet.add(signalsMatch[1]);
        }
        const geminiMatch = fileName.match(/([A-Z]+)_gemini_analysis_/);
        if (geminiMatch) {
          symbolSet.add(geminiMatch[1]);
        }
      });
    }

    return Array.from(symbolSet).sort();
  } catch (error) {
    console.error("Error fetching available symbols:", error);
    return [];
  }
}

async function getLatestTechnicalData(symbol: string): Promise<TechnicalDataResponse> {
  const [, , apiResponse] = await storageClient
    .bucket(BUCKET_NAME)
    .getFiles({
      prefix: "daily/",
      delimiter: "/",
    });

  const apiTyped = apiResponse as GetFilesApiResponse | undefined;
  const dateFolders: string[] = apiTyped?.prefixes ?? [];
  
  if (dateFolders.length === 0) {
    throw new Error("No date folders found in /daily/");
  }

  const sortedDateFolders = dateFolders.sort().reverse();

  for (const datePrefix of sortedDateFolders) {
    const [files] = await storageClient
      .bucket(BUCKET_NAME)
      .getFiles({ prefix: datePrefix });
    
    const signalsFile = files
      .filter(
        (f) =>
          f.name.includes(`signals_${symbol}`) &&
          f.name.endsWith(".json")
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .pop();

    const geminiFile = files
      .filter(
        (f) =>
          f.name.includes(`${symbol}_gemini_analysis_`) &&
          f.name.endsWith(".json")
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .pop();

    if (signalsFile || geminiFile) {
      const latestDate = datePrefix.split("/")[1];

      let technicalData: Record<string, unknown> | null = null;
      if (signalsFile) {
        const file = storageClient.bucket(BUCKET_NAME).file(signalsFile.name);
        const [data] = await file.download();
        technicalData = JSON.parse(data.toString()) as Record<string, unknown>;
      }

      let geminiAnalysis: Record<string, unknown> | null = null;
      if (geminiFile) {
        const file = storageClient.bucket(BUCKET_NAME).file(geminiFile.name);
        const [data] = await file.download();
        geminiAnalysis = JSON.parse(data.toString()) as Record<string, unknown>;
      }

      return { technicalData, geminiAnalysis, date: latestDate };
    }
  }

  throw new Error(
    `No matching files found for ${symbol} in any date folder`
  );
}

// ============================================
// SERVER COMPONENT - Does all data fetching
// ============================================
export default async function DashboardPage({
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
    console.error("❌ Error accessing bucket:", error instanceof Error ? error.message : "Unknown error");
  }

  // All data fetching happens here (server-side)
  const availableSymbols = await getAvailableSymbols();
  console.log("📊 Available symbols:", availableSymbols);
  
  const params = await searchParams;
  const symbol = params.symbol || availableSymbols[0] || "ORCL";

  let fetched: TechnicalDataResponse | null = null;
  try {
    fetched = await getLatestTechnicalData(symbol);
  } catch (err) {
    console.error("Failed to fetch latest technical data:", err);
    fetched = null;
  }

  const analysisData = fetched && (fetched.geminiAnalysis ?? fetched.technicalData)
    ? (fetched.geminiAnalysis ?? fetched.technicalData) as unknown as AnalysisData
    : null;

  const technicalData = fetched?.technicalData as unknown as {
    price?: number;
    change_pct?: number;
    volume?: number;
    indicators?: Record<string, number>;
    moving_averages?: Record<string, number>;
    bullish_count?: number;
    bearish_count?: number;
  } | null;

  // ============================================
  // Pass data to client component
  // ============================================
  return (
    <DashboardClient
      user={{ firstName: user?.firstName || "User" }}
      availableSymbols={availableSymbols}
      selectedSymbol={symbol}
      analysisData={analysisData}
      technicalData={technicalData}
      bucketName={BUCKET_NAME}
    />
  );
}