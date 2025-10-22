// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// import { handlers } from "@/auth-node";

// export const { GET, POST } = handlers;


// // ===========================================================================
// // 1. API ROUTE: app/api/technical-analysis/route.ts
// // ===========================================================================

import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

const storage = new Storage();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol') || 'RGTI';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const bucketName = 'ttb-bucket1';
    const bucket = storage.bucket(bucketName);
    
    // List files for the given date and symbol
    const [files] = await bucket.getFiles({
      prefix: `daily/${date}/${symbol}`,
    });
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No data found for this symbol and date' },
        { status: 404 }
      );
    }
    
    // Find the latest files
    const signalsFile = files
      .filter(f => f.name.includes('signals') && f.name.endsWith('.json'))
      .sort()
      .pop();
    
    const geminiFile = files
      .filter(f => f.name.includes('gemini_analysis') && f.name.endsWith('.json'))
      .sort()
      .pop();
    
    if (!signalsFile) {
      return NextResponse.json(
        { error: 'Signals file not found' },
        { status: 404 }
      );
    }
    
    // Download and parse the signals file
    const [signalsContent] = await signalsFile.download();
    const technicalData = JSON.parse(signalsContent.toString());
    
    // Download and parse the Gemini analysis if available
    let geminiAnalysis = null;
    if (geminiFile) {
      const [geminiContent] = await geminiFile.download();
      geminiAnalysis = JSON.parse(geminiContent.toString());
    }
    
    return NextResponse.json({
      technicalData,
      geminiAnalysis,
    });
    
  } catch (error) {
    console.error('Error fetching technical analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch technical analysis' },
      { status: 500 }
    );
  }
}

// ===========================================================================
// 2. ALTERNATIVE: API ROUTE FOR LOCAL FILES
// app/api/technical-analysis/local/route.ts
// ===========================================================================

// import { NextRequest, NextResponse } from 'next/server';
// import fs from 'fs/promises';
// import path from 'path';

// export async function GET(request: NextRequest) {
//   try {
//     const searchParams = request.nextUrl.searchParams;
//     const symbol = searchParams.get('symbol') || 'RGTI';
//     const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
//     const dataDir = path.join(process.cwd(), 'technical_analysis_data', date);
    
//     // Check if directory exists
//     try {
//       await fs.access(dataDir);
//     } catch {
//       return NextResponse.json(
//         { error: 'No data found for this date' },
//         { status: 404 }
//       );
//     }
    
//     // Read all files in the directory
//     const files = await fs.readdir(dataDir);
    
//     // Find the latest signals and gemini files for the symbol
//     const signalsFiles = files
//       .filter(f => f.includes(symbol) && f.includes('signals') && f.endsWith('.json'))
//       .sort();
    
//     const geminiFiles = files
//       .filter(f => f.includes(symbol)