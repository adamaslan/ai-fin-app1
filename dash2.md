Here’s a **Markdown documentation draft** (`dashboard.md`) describing your stock analysis dashboard page, its architecture, and ideas for extending it with more stocks and interactive viewing options:

---

# 📊 Stock Technical Analysis Dashboard (Next.js + GCP)

This page is a **dynamic stock analysis dashboard** that fetches and displays the latest technical and AI (Gemini) analyses for different stock symbols.
It integrates **Google Cloud Storage**, **Clerk authentication**, and **Next.js Server Components** to serve dynamic, authenticated, and data-rich dashboards.

---

## 🧩 Core Features

### 🔐 Authentication

* Uses [`@clerk/nextjs`](https://clerk.com/docs/nextjs) to manage user sessions.
* Redirects to `/sign-in` if no user is logged in.
* Displays personalized greetings using the authenticated user’s name.

```ts
const user = await currentUser();
if (!user) redirect("/sign-in");
```

---

### ☁️ Google Cloud Storage Integration

* Connects securely to **GCP Storage** using credentials stored in environment variables.

* Reads analysis JSON files from a bucket (`ttb-bucket1`) structured as:

  ```
  daily/YYYY-MM-DD/
      signals_<SYMBOL>_<timestamp>.json
      <SYMBOL>_gemini_analysis_<timestamp>.json
  ```

* Automatically parses available date folders and extracts **stock symbols** from filenames.

---

### 🔍 Symbol & Data Management

#### 1. `getAvailableSymbols()`

Scans all `daily/` folders for files containing stock tickers and returns a sorted list of available symbols.

#### 2. `getLatestTechnicalData(symbol)`

Finds the **most recent** available date folder for a symbol, loads both:

* `signals_<SYMBOL>.json` → technical indicators
* `<SYMBOL>_gemini_analysis.json` → AI commentary and bias

Returns:

```ts
{
  technicalData: Record<string, unknown> | null,
  geminiAnalysis: Record<string, unknown> | null,
  date: string
}
```

---

### 🧠 Data Schema Overview

#### `AnalysisData`

Each JSON represents a single stock’s combined analysis:

```ts
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
```

#### `AnalysisSignal`

Each technical signal includes:

```ts
interface AnalysisSignal {
  signal: string;
  desc: string;
  strength: string;
  category: string;
}
```

---

## 🧱 Page Layout

| Section                | Description                                                                    |
| ---------------------- | ------------------------------------------------------------------------------ |
| **Header**             | Shows username and stock symbol selector.                                      |
| **Technical Snapshot** | Displays the analysis summary and strongest signals with markdown rendering.   |
| **Bias & Risk Panels** | Visual boxes for bias, risk, and key levels.                                   |
| **Signals Grid**       | A responsive grid of analyzed signals with badges (e.g. “BULLISH”, “BEARISH”). |

---

## 💡 Adding More Stocks (Easiest Way)

1. **Upload new analysis files** to your GCS bucket:

   ```
   gsutil cp signals_MSFT_2025-10-24.json gs://ttb-bucket1/daily/2025-10-24/
   gsutil cp MSFT_gemini_analysis_2025-10-24.json gs://ttb-bucket1/daily/2025-10-24/
   ```

2. The dashboard **automatically detects** new symbols—no code changes needed!

3. (Optional) Add a local JSON validator or upload form in your app:

   ```bash
   npx tsx scripts/validate-analysis.ts
   ```

   to ensure uploaded data follows the `AnalysisData` schema.

---

## 🎮 Fun Ways to View & Interact

You can turn the dashboard into an **explorable stock universe** with these extensions:

### 🧭 1. Symbol Explorer

* Add a searchable dropdown (e.g. using shadcn/ui `Combobox`).
* Filter by **bias** (Bullish/Bearish/Neutral).
* Sort by **signal strength** or **risk**.

### 📈 2. Animated Chart Mode

* Integrate **Recharts** or **Plotly.js** to visualize trends in `signal_count` or `key_levels`.
* Animate color gradients based on “BULLISH/BEARISH” state transitions.

### 🎡 3. “Spin-the-Wheel” Random Stock Picker

* Create a “🎲 Random Stock” button that randomly selects a symbol and fetches its analysis.

### 🕹️ 4. Interactive 3D Dashboard (Advanced)

* Use **Three.js** or **React Three Fiber** to place each stock as a node in a 3D cluster.
* Node color → bias (green/bullish, red/bearish).
* Node size → signal strength.

### 🧑‍💻 5. Quick Upload Panel (Admin)

* Build a simple `/admin/upload` route to drop `.json` files.
* Auto-parse and push to GCP via an API route.

---

## ⚙️ Environment Setup

### Required `.env` variables:

```bash
GCP_PROJECT_ID=
GCP_CREDENTIALS='{"type": "...", "project_id": "...", ...}'
CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

### GCP Permissions

Your service account must have:

```
roles/storage.objectViewer
roles/storage.objectLister
```

---

## 🚀 Future Improvements

| Idea                          | Description                                                              |
| ----------------------------- | ------------------------------------------------------------------------ |
| **Trend Tracking**            | Cache each day’s `signal_count` to visualize trends over time.           |
| **Multi-symbol Compare View** | Side-by-side view of multiple stocks.                                    |
| **Auto-refresh**              | Re-fetch every 24h or via Cloud Scheduler + Pub/Sub.                     |
| **Watchlist Sync**            | Let users “favorite” stocks via Clerk + Firestore.                       |
| **AI Summary Chat**           | Generate a daily natural-language summary of all bullish/bearish shifts. |

---

### 🗂️ File Summary

| File                       | Purpose                          |
| -------------------------- | -------------------------------- |
| `Dashboard2/page.tsx`      | Main dynamic page                |
| `getAvailableSymbols()`    | Detects stock list from GCS      |
| `getLatestTechnicalData()` | Fetches latest analysis JSONs    |
| `StrengthBadge`            | UI component for signal strength |
| `MarkdownAnalysis`         | Lightweight markdown renderer    |

---

## 🧭 Suggested Naming Convention for Uploaded Files

Use clear consistent naming for automation:

```
signals_<TICKER>_<YYYYMMDD>.json
<TICKER>_gemini_analysis_<YYYYMMDD>.json
```

Example:

```
signals_TSLA_20251024.json
TSLA_gemini_analysis_20251024.json
```

---

