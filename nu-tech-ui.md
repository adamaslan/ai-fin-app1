# Technical Analysis Dashboard - GCP & TypeScript Implementation

## GCP Storage Integration

### Environment Configuration
- **Required Variables**:
  - `GCP_PROJECT_ID` - Google Cloud Project ID
  - `GCP_CREDENTIALS` or `GOOGLE_APPLICATION_CREDENTIALS` - Authentication credentials

### Authentication Setup
```typescript
// Supports both JSON string and file path credentials
function getGCPCredentials() {
  const raw = process.env.GCP_CREDENTIALS ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;
  
  if (raw.trim().startsWith("{")) {
    // JSON string credentials
    return JSON.parse(raw.trim());
  } else {
    // File path to service account JSON
    const fileContents = fs.readFileSync(raw, "utf8");
    return JSON.parse(fileContents);
  }
}

Storage Structure
text

Bucket: ttb-bucket1
Prefix: daily/
Structure: daily/YYYY-MM-DD/
File patterns:
  - signals_SYMBOL_*.json (technical data)
  - SYMBOL_gemini_analysis_*.json (AI analysis)

JSON File Processing
Technical Data Interface
typescript

interface TechnicalData {
  price?: number;
  change_pct?: number;
  volume?: number;
  indicators?: Record<string, number>;
  moving_averages?: Record<string, number>;
  bullish_count?: number;
  bearish_count?: number;
}

Data Fetching Strategy

    Symbol Discovery: Scan all date folders to find available symbols

    Latest Data Retrieval: Search date folders in reverse chronological order

    File Pattern Matching:

        Technical data: signals_${symbol}_*.json

        Gemini analysis: ${symbol}_gemini_analysis_*.json

Type Safety & Parsing
typescript

// Type assertions for parsed JSON data
const technicalData = fetched?.technicalData as unknown as TechnicalData;
const analysisData = fetched?.geminiAnalysis as unknown as AnalysisData;

UI Data Flow Issue
Problem Statement

The technicalData interface is defined but not properly displayed in the UI despite being fetched from GCP.
Current Implementation Gaps

    Data Availability Check: UI renders technical section only if technicalData exists

    Type Mismatch: Potential inconsistency between stored JSON structure and TypeScript interface

    Error Handling: Missing fallback for malformed technical data

Root Cause Analysis

The technical data section (Price & Indicators Overview) only renders when technicalData is truthy:
typescript

{technicalData && (
  <section className="mb-6">
    {/* Technical indicators grid */}
  </section>
)}

Debugging Steps

    Verify GCP bucket contains valid signals_SYMBOL_*.json files

    Check JSON structure matches TechnicalData interface

    Add console logging to trace data parsing

    Validate environment variables and GCP permissions

Expected JSON Structure
json

{
  "price": 150.25,
  "change_pct": 2.5,
  "volume": 1500000,
  "indicators": {
    "RSI": 65.5,
    "MACD": 0.25,
    "Stochastic": 75.2,
    "ADX": 28.1
  },
  "moving_averages": {
    "SMA_20": 148.30,
    "EMA_20": 148.75
  },
  "bullish_count": 8,
  "bearish_count": 3
}

Resolution Steps

    Add comprehensive error logging for data parsing

    Implement data validation against the interface

    Add fallback UI for missing technical data fields

    Verify GCP file permissions and bucket accessibility

t