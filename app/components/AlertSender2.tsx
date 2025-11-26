import { Resend } from 'resend';

// Define the expected return type for the API consumer
interface EmailResult {
  success: boolean;
  error?: string;
}

interface AnalysisSignal {
  signal: string;
  desc: string;
  strength: string;
  category: string;
  ai_score?: number;
  ai_reasoning?: string;
  rank?: number;
}

interface SendAlertEmailProps {
  signals: AnalysisSignal[];
  symbol: string;
  userEmail: string;
  dateRange: string;
  analysisDate: string;
}

// Initialize Resend outside component for reuse
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Server utility function that sends email alerts for top AI-ranked signals.
 *
 * @param props The alert configuration data.
 * @returns A promise that resolves to an EmailResult object indicating success or failure.
 */
export default async function sendAlertEmail({ 
  signals, 
  symbol, 
  userEmail, 
  dateRange,
  analysisDate 
}: SendAlertEmailProps): Promise<EmailResult> {
  try {
    // Get top 3 AI-ranked signals
    const topSignals = signals
      .filter(s => typeof s.ai_score === 'number')
      .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0))
      .slice(0, 3);

    if (topSignals.length === 0) {
      console.log('⚠️ No AI-scored signals found, skipping email');
      // Report success, but indicate that no action was taken
      return { success: true, error: 'No AI-scored signals found to send' };
    }

    const emailContent = generateEmailHTML(topSignals, symbol, dateRange, analysisDate);

    const result = await resend.emails.send({
      from: 'Stock Alerts <alerts@finance.tastytechbytes.com>',
      to: userEmail,
      subject: `🏆 ${symbol} Weekly Alert: Top ${topSignals.length} AI-Ranked Signals`,
      html: emailContent,
    });

    if (result.error) {
       console.error(`❌ Resend API Error for ${userEmail}:`, result.error);
       return { success: false, error: result.error.message };
    }

    console.log(`✅ Weekly AI-ranked alert sent to ${userEmail} for ${symbol}`, result.data?.id);
    
    // Correct return for success
    return { success: true };

  } catch (error) {
    console.error('❌ Failed to send AI-ranked alert email:', error);
    // Correct return for failure
    return { success: false, error: error instanceof Error ? error.message : 'Unknown email send error' };
  }
}

/**
 * Generate HTML email content with AI-ranked signals
 */
function generateEmailHTML(
  topSignals: AnalysisSignal[], 
  symbol: string, 
  dateRange: string,
  analysisDate: string
): string {
  const topSignal = topSignals[0];
  const strengthColor = getStrengthColor(topSignal.strength);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container { 
            max-width: 650px; 
            margin: 20px auto; 
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 26px;
            font-weight: 700;
          }
          .header p {
            margin: 8px 0 0 0;
            opacity: 0.95;
            font-size: 15px;
          }
          .content { 
            padding: 30px 25px;
          }
          .date-badge {
            display: inline-block;
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 10px 15px;
            margin: 0 0 20px 0;
            border-radius: 4px;
            font-size: 13px;
            color: #1e40af;
            font-weight: 600;
          }
          .ai-badge {
            display: inline-block;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 15px;
          }
          .hero-signal { 
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            padding: 25px;
            margin: 25px 0;
            border-radius: 12px;
            border-left: 6px solid ${strengthColor};
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .score-display {
            font-size: 48px;
            font-weight: 900;
            color: ${strengthColor};
            line-height: 1;
            margin-bottom: 10px;
          }
          .score-label {
            font-size: 12px;
            text-transform: uppercase;
            color: #6b7280;
            font-weight: 600;
            letter-spacing: 1px;
          }
          .signal-title {
            font-size: 22px;
            font-weight: 700;
            color: #1f2937;
            margin: 15px 0 8px 0;
          }
          .signal-desc {
            font-size: 15px;
            color: #4b5563;
            margin-bottom: 15px;
          }
          .ai-reasoning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            border-radius: 6px;
            margin-top: 15px;
          }
          .ai-reasoning-title {
            font-weight: 700;
            color: #92400e;
            font-size: 13px;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .ai-reasoning-text {
            color: #78350f;
            font-size: 14px;
            line-height: 1.6;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .meta-row:last-child {
            border-bottom: none;
          }
          .meta-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 13px;
          }
          .meta-value {
            color: #1f2937;
            font-size: 13px;
          }
          .additional-signals {
            margin-top: 30px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
          }
          .signal-card {
            background: #f9fafb;
            padding: 18px;
            margin-bottom: 12px;
            border-radius: 8px;
            border-left: 4px solid #9ca3af;
          }
          .signal-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }
          .rank-badge {
            background: #6b7280;
            color: white;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 700;
          }
          .score-badge {
            font-size: 18px;
            font-weight: 700;
            color: #374151;
          }
          .signal-name {
            font-weight: 600;
            color: #1f2937;
            font-size: 15px;
            margin-bottom: 5px;
          }
          .signal-reason {
            font-size: 13px;
            color: #6b7280;
            font-style: italic;
          }
          .cta-box {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border: 2px solid #3b82f6;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
            text-align: center;
          }
          .cta-title {
            font-weight: 700;
            color: #1e40af;
            font-size: 16px;
            margin-bottom: 10px;
          }
          .cta-text {
            color: #1e3a8a;
            font-size: 14px;
            line-height: 1.6;
          }
          .footer { 
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            padding: 20px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 ${symbol} Weekly Analysis</h1>
            <p>AI-Powered Technical Signal Rankings</p>
          </div>
          
          <div class="content">
            <div class="date-badge">
              📅 Analysis Period: ${dateRange} • Latest Data: ${analysisDate}
            </div>

            <p style="font-size: 15px; color: #4b5563; margin: 0 0 20px 0;">
              Our AI has analyzed all technical signals for <strong>${symbol}</strong> and identified the most actionable opportunities based on a comprehensive 1-100 scoring system.
            </p>

            <!-- TOP SIGNAL -->
            <div class="hero-signal">
              <div class="ai-badge">🤖 AI TOP PICK</div>
              <div class="score-display">${topSignal.ai_score}/100</div>
              <div class="score-label">AI Confidence Score</div>
              
              <div class="signal-title">${topSignal.signal}</div>
              <div class="signal-desc">${topSignal.desc}</div>
              
              <div style="margin-top: 15px;">
                ${topSignal.rank ? `
                <div class="meta-row">
                  <span class="meta-label">RANK</span>
                  <span class="meta-value">#${topSignal.rank} of all signals</span>
                </div>
                ` : ''}
                <div class="meta-row">
                  <span class="meta-label">CATEGORY</span>
                  <span class="meta-value">${topSignal.category}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">STRENGTH</span>
                  <span class="meta-value">${topSignal.strength}</span>
                </div>
              </div>

              ${topSignal.ai_reasoning ? `
              <div class="ai-reasoning">
                <div class="ai-reasoning-title">🤖 AI Analysis</div>
                <div class="ai-reasoning-text">${topSignal.ai_reasoning}</div>
              </div>
              ` : ''}
            </div>

            <!-- ADDITIONAL TOP SIGNALS -->
            ${topSignals.length > 1 ? `
            <div class="additional-signals">
              <div class="section-title">Other Strong Signals</div>
              ${topSignals.slice(1).map((signal, idx) => `
                <div class="signal-card">
                  <div class="signal-card-header">
                    <span class="rank-badge">#${signal.rank || idx + 2}</span>
                    <span class="score-badge">${signal.ai_score}/100</span>
                  </div>
                  <div class="signal-name">${signal.signal}</div>
                  <div class="signal-desc">${signal.desc}</div>
                  ${signal.ai_reasoning ? `
                  <div class="signal-reason">"${signal.ai_reasoning.substring(0, 100)}..."</div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
            ` : ''}

            <div class="cta-box">
              <div class="cta-title">⚡ Ready to Act?</div>
              <div class="cta-text">
                Review the complete analysis in your dashboard for entry points, stop losses, and full technical context before making any trades.
              </div>
            </div>

            <p style="font-size: 12px; color: #6b7280; margin: 20px 0 0 0; text-align: center;">
              Generated ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })}
            </p>
          </div>
          
          <div class="footer">
            <p><strong>TastyTechBytes Finance</strong> • AI-Powered Technical Analysis</p>
            <p>You're receiving this because you have weekly AI-ranked alerts enabled.</p>
            <p style="margin-top: 10px; font-size: 11px;">
              Scores are AI-generated based on actionability, reliability, timing, risk/reward, and market context.
            </p>
            <p>© ${new Date().getFullYear()} TastyTechBytes. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Get color based on signal strength
 */
function getStrengthColor(strength: string): string {
  const upperStrength = strength.toUpperCase();
  
  if (upperStrength.includes('EXTREME')) return '#ea580c'; // orange-600
  if (upperStrength.includes('STRONG') && upperStrength.includes('BULL')) return '#16a34a'; // green-600
  if (upperStrength.includes('STRONG') && upperStrength.includes('BEAR')) return '#dc2626'; // red-600
  if (upperStrength.includes('BULL')) return '#22c55e'; // green-500
  if (upperStrength.includes('BEAR')) return '#ef4444'; // red-500
  if (upperStrength.includes('HIGH')) return '#2563eb'; // blue-600
  
  return '#6b7280'; // gray-500
}