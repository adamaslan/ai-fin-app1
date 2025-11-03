// app/components/AlertSender.tsx
import { Resend } from 'resend';

interface AnalysisSignal {
  signal: string;
  desc: string;
  strength: string;
  category: string;
}

interface AlertSenderProps {
  signal: AnalysisSignal;
  symbol: string;
  userEmail: string;
}

// Initialize Resend outside component for reuse
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Server Component that sends email alerts for strongest signals
 * This component has no UI - it only handles the email sending logic
 */
export default async function AlertSender({ signal, symbol, userEmail }: AlertSenderProps) {
  try {
    const emailContent = generateEmailHTML(signal, symbol);

    const result = await resend.emails.send({
      from: 'Stock Alerts <alerts@finance.tastytechbytes.com>',
      to: userEmail,
      subject: `📊 ${symbol} Alert: ${signal.signal} (${signal.strength})`,
      html: emailContent,
    });

    console.log(`✅ Email sent successfully to ${userEmail} for ${symbol}`, result);
    
    // Return null since this is a server component with no UI
    return null;
  } catch (error) {
    console.error('❌ Failed to send alert email:', error);
    // Return null even on error - we don't want to break the page render
    return null;
  }
}

/**
 * Generate HTML email content
 */
function generateEmailHTML(signal: AnalysisSignal, symbol: string): string {
  const strengthClass = getStrengthClass(signal.strength);
  const strengthColor = getStrengthColor(signal.strength);

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
            max-width: 600px; 
            margin: 20px auto; 
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
          }
          .content { 
            padding: 30px 20px;
          }
          .signal-box { 
            background: #f9fafb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            border-left: 4px solid ${strengthColor};
          }
          .signal-row {
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
          }
          .signal-row:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
          }
          .label { 
            font-weight: 600;
            color: #4b5563;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 5px;
          }
          .value { 
            color: #1f2937;
            font-size: 15px;
          }
          .strength-badge { 
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            background: ${strengthColor};
            color: white;
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
          .cta-note {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #1e40af;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Stock Alert: ${symbol}</h1>
            <p>Strongest Signal Detected</p>
          </div>
          
          <div class="content">
            <p style="font-size: 15px; color: #4b5563; margin-top: 0;">
              Our technical analysis has identified the strongest signal for <strong>${symbol}</strong>:
            </p>
            
            <div class="signal-box">
              <div class="signal-row">
                <span class="label">Signal</span>
                <div class="value">${signal.signal}</div>
              </div>
              
              <div class="signal-row">
                <span class="label">Description</span>
                <div class="value">${signal.desc}</div>
              </div>
              
              <div class="signal-row">
                <span class="label">Category</span>
                <div class="value">${signal.category}</div>
              </div>
              
              <div class="signal-row">
                <span class="label">Strength</span>
                <div>
                  <span class="strength-badge ${strengthClass}">${signal.strength}</span>
                </div>
              </div>
            </div>

            <div class="cta-note">
              <strong>Note:</strong> This is the strongest signal currently detected for ${symbol} based on technical analysis. 
              Review all signals in your dashboard for complete context.
            </div>

            <p style="font-size: 13px; color: #6b7280; margin-bottom: 0;">
              Generated on ${new Date().toLocaleDateString('en-US', { 
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
            <p><strong>TastyTechBytes Finance</strong></p>
            <p>You're receiving this because you have stock alerts enabled.</p>
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
  
  if (upperStrength.includes('BEAR')) return '#dc2626'; // red-600
  if (upperStrength.includes('BULL')) return '#16a34a'; // green-600
  if (upperStrength.includes('EXTREME')) return '#ea580c'; // orange-600
  if (upperStrength.includes('HIGH')) return '#2563eb'; // blue-600
  
  return '#6b7280'; // gray-500
}

/**
 * Get CSS class based on strength
 */
function getStrengthClass(strength: string): string {
  const upperStrength = strength.toUpperCase();
  if (upperStrength.includes('EXTREME')) return 'extreme';
  if (upperStrength.includes('HIGH')) return 'high';
  if (upperStrength.includes('MEDIUM')) return 'medium';
  return 'low';
}