# AI-Powered Stock Alert Email Pipeline

## 📋 Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Setup & Configuration](#setup--configuration)
- [Pipeline Flow](#pipeline-flow)
- [Testing the System](#testing-the-system)
- [Customization Guide](#customization-guide)
- [Troubleshooting](#troubleshooting)

---

## Overview

This pipeline analyzes stock data using AI-powered technical analysis and sends **weekly email alerts** featuring the **top 3 AI-ranked trading signals** (scored 1-100) to authenticated users.

### Key Features
- ✅ AI scores every technical signal (1-100)
- ✅ Aggregates top signals from past 7 days
- ✅ Sends professional HTML emails via Resend
- ✅ Server-side rendering (no client JavaScript)
- ✅ GCS integration for data storage
- ✅ Clerk authentication for user management

---

## Architecture

```
┌─────────────────┐
│ Python Scanner  │
│ (Gemini AI)     │
└────────┬────────┘
         │
         │ Uploads JSON files
         ▼
┌─────────────────┐
│  Google Cloud   │
│    Storage      │
│  (ttb-bucket1)  │
└────────┬────────┘
         │
         │ Reads data
         ▼
┌─────────────────┐
│ Next.js Server  │
│  Dashboard      │
└────────┬────────┘
         │
         │ Triggers
         ▼
┌─────────────────┐
│  AlertSender    │
│   Component     │
└────────┬────────┘
         │
         │ Sends email
         ▼
┌─────────────────┐
│  Resend API     │
│  (Email)        │
└─────────────────┘
```

---

## Setup & Configuration

### Prerequisites

1. **Google Cloud Storage**
   - Bucket: `ttb-bucket1`
   - Folder structure: `daily/YYYY-MM-DD/`

2. **Resend Account**
   - Sign up at [resend.com](https://resend.com)
   - Get API key
   - Verify domain: `finance.tastytechbytes.com`

3. **Clerk Authentication**
   - User accounts with email addresses

### Environment Variables

Create a `.env.local` file:

```env
# Google Cloud Storage
GCP_PROJECT_ID=your-project-id
GCP_CREDENTIALS={"type":"service_account","project_id":"..."}

# Resend Email
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx

# Clerk Authentication (if needed)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

### Install Dependencies

```bash
npm install resend @google-cloud/storage @clerk/nextjs
```

---

## Pipeline Flow

### Step 1: Python Scanner (Data Generation)

The Python scanner runs and creates AI-analyzed files:

```python
# scanner.py generates:
# 1. YYYY-MM-DD-SYMBOL-ai_analysis-HHMMSS.json
# 2. YYYY-MM-DD-SYMBOL-signals-HHMMSS.json
# 3. YYYY-MM-DD-SYMBOL-ranked_signals-HHMMSS.txt

analyzer = TechnicalAnalyzer(
    symbol='ORCL',
    gemini_api_key=os.getenv('GEMINI_API_KEY')
)
analyzer.fetch_data()
analyzer.calculate_indicators()
analyzer.detect_signals()
analyzer.rank_signals_with_ai()  # AI scores 1-100
analyzer.upload_to_gcp()
```

**Output File Structure** (`YYYY-MM-DD-SYMBOL-ai_analysis-*.json`):
```json
{
  "symbol": "ORCL",
  "timestamp": "2024-11-03 14:30:00",
  "date": "2024-11-03",
  "signal_count": 47,
  "signals_analyzed": [
    {
      "signal": "MACD BULL CROSS",
      "desc": "MACD crossed above signal",
      "strength": "BULLISH",
      "category": "MACD",
      "ai_score": 92,
      "ai_reasoning": "Strong reversal signal with volume confirmation...",
      "rank": 1
    }
  ],
  "top_signal_info": {
    "signal_number": 1,
    "why": "Highest probability setup with best risk/reward"
  }
}
```

### Step 2: Dashboard Loads Data

```typescript
// app/Dashboard5/page.tsx
const latestAnalysis = await getLatestGeminiAnalysis(symbol);
const weeklyTopSignals = await getTopSignalsLastWeek(symbol);
```

**Functions:**
- `getLatestGeminiAnalysis()`: Fetches most recent AI analysis
- `getTopSignalsLastWeek()`: Aggregates top 5 signals from past 7 days

### Step 3: Email Alert Triggered

```typescript
{weeklyTopSignals && weeklyTopSignals.signals.length > 0 && userEmail && (
  <AlertSender 
    signals={weeklyTopSignals.signals}
    symbol={symbol} 
    userEmail={userEmail}
    dateRange={dateRange}
    analysisDate={weeklyTopSignals.date}
  />
)}
```

### Step 4: AlertSender Sends Email

```typescript
// app/components/AlertSender.tsx
const topSignals = signals
  .filter(s => typeof s.ai_score === 'number')
  .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
  .slice(0, 3); // Top 3 signals

await resend.emails.send({
  from: 'Stock Alerts <alerts@finance.tastytechbytes.com>',
  to: userEmail,
  subject: `🏆 ${symbol} Weekly Alert: Top ${topSignals.length} AI-Ranked Signals`,
  html: emailContent,
});
```

---

## Testing the System

### 1. Test with Mock Data

Create a test file in GCS:

```bash
# Upload test data to GCS
gsutil cp test-data.json gs://ttb-bucket1/daily/2024-11-03/ORCL-ai_analysis-143000.json
```

**Test Data** (`test-data.json`):
```json
{
  "symbol": "ORCL",
  "timestamp": "2024-11-03 14:30:00",
  "date": "2024-11-03",
  "signal_count": 3,
  "signals_analyzed": [
    {
      "signal": "MACD BULL CROSS",
      "desc": "MACD crossed above signal line",
      "strength": "BULLISH",
      "category": "MACD",
      "ai_score": 92,
      "ai_reasoning": "Strong reversal signal with volume confirmation. RSI recovering from oversold provides excellent risk/reward setup.",
      "rank": 1
    },
    {
      "signal": "RSI OVERSOLD",
      "desc": "RSI at 28.3",
      "strength": "BULLISH",
      "category": "RSI",
      "ai_score": 85,
      "ai_reasoning": "Oversold reading suggests bounce potential, but wait for momentum confirmation before entering.",
      "rank": 2
    },
    {
      "signal": "VOLUME BREAKOUT",
      "desc": "High volume + price up",
      "strength": "STRONG BULLISH",
      "category": "VOLUME",
      "ai_score": 78,
      "ai_reasoning": "Volume spike confirms buying interest. Watch for follow-through in next session.",
      "rank": 3
    }
  ],
  "top_signal_info": {
    "signal_number": 1,
    "why": "Best risk/reward with strong technical confirmation"
  }
}
```

### 2. Test Email Locally

Create a test route:

```typescript
// app/api/test-email/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  const testSignals = [
    {
      signal: "MACD BULL CROSS",
      desc: "Test signal",
      strength: "BULLISH",
      category: "MACD",
      ai_score: 92,
      ai_reasoning: "This is a test",
      rank: 1
    }
  ];

  try {
    const result = await resend.emails.send({
      from: 'Stock Alerts <alerts@finance.tastytechbytes.com>',
      to: 'your-test-email@example.com',
      subject: '🧪 Test Email',
      html: '<h1>Test Email</h1><p>If you see this, emails are working!</p>',
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

Test it:
```bash
curl http://localhost:3000/api/test-email
```

### 3. Verify Resend Dashboard

1. Go to [resend.com/emails](https://resend.com/emails)
2. Check "Emails" tab
3. Verify delivery status
4. Review email content

### 4. Check Server Logs

```bash
# Development
npm run dev

# Check logs for:
# ✅ Email sent successfully to user@example.com for ORCL
# OR
# ❌ Failed to send email: [error message]
```

---

## Customization Guide

### 1. Change Email Design

Edit `app/components/AlertSender.tsx`:

```typescript
// Modify colors
const strengthColor = '#your-color';

// Update HTML structure
function generateEmailHTML(...) {
  return `
    <!DOCTYPE html>
    <html>
      <!-- Your custom HTML -->
    </html>
  `;
}
```

**Color Schemes:**
- **Corporate**: Blues & Grays
- **High Energy**: Orange & Yellow
- **Premium**: Purple & Gold
- **Finance**: Green & Red (bull/bear)

### 2. Change Number of Signals

```typescript
// Top 5 instead of top 3
const topSignals = signals
  .filter(s => typeof s.ai_score === 'number')
  .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
  .slice(0, 5); // Change from 3 to 5
```

### 3. Add Signal Filtering

```typescript
// Only send if score >= 80
const topSignals = signals
  .filter(s => typeof s.ai_score === 'number' && s.ai_score >= 80)
  .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
  .slice(0, 3);

if (topSignals.length === 0) {
  console.log('⚠️ No high-confidence signals, skipping email');
  return null;
}
```

### 4. Customize Subject Line

```typescript
// Dynamic subject based on top signal
const topSignal = topSignals[0];
const emoji = topSignal.ai_score >= 90 ? '🔥' : '⚡';

await resend.emails.send({
  subject: `${emoji} ${symbol}: ${topSignal.signal} (${topSignal.ai_score}/100)`,
  // ...
});
```

### 5. Add Unsubscribe Link

```typescript
const emailContent = generateEmailHTML(...);

// Add to email footer
html: emailContent + `
  <div style="text-align: center; margin-top: 20px;">
    <a href="https://yoursite.com/unsubscribe?email=${userEmail}">
      Unsubscribe from alerts
    </a>
  </div>
`;
```

### 6. Schedule Emails (Instead of Page Load)

Use a cron job or scheduled function:

```typescript
// app/api/cron/send-alerts/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get all users
  const users = await getAllUsers();
  
  // Send alerts to each user
  for (const user of users) {
    const signals = await getTopSignalsForUser(user);
    await sendAlertEmail(user.email, signals);
  }

  return Response.json({ success: true });
}
```

**Vercel Cron** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/send-alerts",
      "schedule": "0 9 * * 1"
    }
  ]
}
```
(Runs every Monday at 9 AM)

### 7. Add Multiple Recipients

```typescript
// Send to multiple emails
const recipients = [
  user.primaryEmailAddress?.emailAddress,
  user.secondaryEmail,
  'admin@yourcompany.com'
].filter(Boolean);

await resend.emails.send({
  from: 'Stock Alerts <alerts@finance.tastytechbytes.com>',
  to: recipients,
  // ...
});
```

### 8. Conditional Email Sending

```typescript
// Only send on significant signals
const shouldSendEmail = topSignals.some(s => 
  s.ai_score >= 85 || 
  s.strength.includes('EXTREME')
);

if (!shouldSendEmail) {
  console.log('No significant signals, skipping email');
  return null;
}
```

### 9. Customize by User Preferences

```typescript
// Assume user preferences stored in database
const userPrefs = await getUserPreferences(userEmail);

const filteredSignals = topSignals.filter(signal => {
  // Only bullish signals if user prefers
  if (userPrefs.signalType === 'bullish' && !signal.strength.includes('BULL')) {
    return false;
  }
  
  // Minimum score threshold
  if (signal.ai_score < userPrefs.minScore) {
    return false;
  }
  
  return true;
});
```

### 10. Add Attachments

```typescript
await resend.emails.send({
  from: 'Stock Alerts <alerts@finance.tastytechbytes.com>',
  to: userEmail,
  subject: `📊 ${symbol} Weekly Report`,
  html: emailContent,
  attachments: [
    {
      filename: 'signals-report.pdf',
      content: pdfBuffer, // Generate PDF from signals
    }
  ]
});
```

---

## Troubleshooting

### Issue: Emails Not Sending

**Check 1: Resend API Key**
```bash
# Verify in .env.local
echo $RESEND_API_KEY
```

**Check 2: Domain Verification**
- Go to [resend.com/domains](https://resend.com/domains)
- Ensure `finance.tastytechbytes.com` is verified
- Check DNS records

**Check 3: From Address**
```typescript
// Must match verified domain
from: 'Stock Alerts <alerts@finance.tastytechbytes.com>'
// NOT: 'alerts@gmail.com'
```

### Issue: No Signals Found

**Check 1: GCS File Existence**
```bash
gsutil ls gs://ttb-bucket1/daily/2024-11-03/
```

**Check 2: File Naming**
Files must match pattern:
- `YYYY-MM-DD-SYMBOL-ai_analysis-*.json`
- `SYMBOL_gemini_analysis_*.json`

**Check 3: JSON Structure**
```typescript
// Verify signals have ai_score
{
  "signals_analyzed": [
    {
      "ai_score": 85,  // ← Must be present
      // ...
    }
  ]
}
```

### Issue: Wrong Signals Displayed

**Check 1: Date Range**
```typescript
// Verify date calculation
function getDateFoldersLastWeek(): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    console.log('Checking date:', date.toISOString().split('T')[0]);
    // ...
  }
}
```

**Check 2: Sorting**
```typescript
// Ensure sorting by AI score
const rankedSignals = allSignals
  .filter(s => typeof s.ai_score === 'number')
  .sort((a, b) => {
    console.log(`Comparing ${a.signal} (${a.ai_score}) vs ${b.signal} (${b.ai_score})`);
    return (b.ai_score || 0) - (a.ai_score || 0);
  });
```

### Issue: Email Styling Broken

**Check 1: Inline CSS**
Email clients require inline CSS:
```html
<!-- Good -->
<div style="background: #f9fafb; padding: 20px;">

<!-- Bad (won't work in emails) -->
<div class="bg-gray-100 p-4">
```

**Check 2: Test in Email Clients**
- Gmail
- Outlook
- Apple Mail
- Mobile devices

**Tool**: [Litmus](https://litmus.com) or [Email on Acid](https://www.emailonacid.com)

### Issue: Rate Limiting

Resend free tier: 100 emails/day

**Solution 1: Batch Processing**
```typescript
const users = await getAllUsers();
const batchSize = 50;

for (let i = 0; i < users.length; i += batchSize) {
  const batch = users.slice(i, i + batchSize);
  await Promise.all(batch.map(user => sendEmail(user)));
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
}
```

**Solution 2: Upgrade Plan**

### Debug Mode

Enable verbose logging:

```typescript
// app/components/AlertSender.tsx
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('📧 Alert Sender Debug Info:');
  console.log('- Symbol:', symbol);
  console.log('- User Email:', userEmail);
  console.log('- Signals:', topSignals.length);
  console.log('- Date Range:', dateRange);
  console.log('- Top Signal Score:', topSignals[0]?.ai_score);
}
```

---

## Performance Optimization

### 1. Cache GCS Results

```typescript
import { unstable_cache } from 'next/cache';

const getCachedAnalysis = unstable_cache(
  async (symbol: string) => getLatestGeminiAnalysis(symbol),
  ['analysis'],
  { revalidate: 3600 } // Cache for 1 hour
);
```

### 2. Parallel Data Fetching

```typescript
const [latestAnalysis, weeklyTopSignals] = await Promise.all([
  getLatestGeminiAnalysis(symbol),
  getTopSignalsLastWeek(symbol)
]);
```

### 3. Lazy Email Sending

```typescript
// Don't await email send (fire and forget)
sendAlertEmail(userEmail, signals).catch(err => 
  console.error('Email send failed:', err)
);
```

---

## Security Best Practices

1. **Never expose API keys in client code**
2. **Validate user emails** before sending
3. **Rate limit** email sends per user
4. **Sanitize email content** to prevent XSS
5. **Use environment variables** for all secrets
6. **Implement unsubscribe** mechanism
7. **Log all email activities** for auditing

---

## Support & Resources

- **Resend Docs**: [resend.com/docs](https://resend.com/docs)
- **Google Cloud Storage**: [cloud.google.com/storage/docs](https://cloud.google.com/storage/docs)
- **Next.js Server Components**: [nextjs.org/docs](https://nextjs.org/docs)
- **Clerk Auth**: [clerk.com/docs](https://clerk.com/docs)

---

## Quick Reference

### File Structure
```
app/
├── components/
│   └── AlertSender.tsx          # Email sender component
├── Dashboard5/
│   └── page.tsx                 # Main dashboard
└── api/
    └── test-email/
        └── route.ts             # Test endpoint
```

### Key Functions
- `getLatestGeminiAnalysis()` - Fetch latest AI analysis
- `getTopSignalsLastWeek()` - Aggregate top weekly signals
- `generateEmailHTML()` - Create email template
- `resend.emails.send()` - Send email via Resend

### Environment Variables
```env
RESEND_API_KEY=re_xxxxx
GCP_PROJECT_ID=your-project
GCP_CREDENTIALS={"type":"service_account",...}
```

---

**Last Updated**: November 2024  
**Version**: 1.0.0