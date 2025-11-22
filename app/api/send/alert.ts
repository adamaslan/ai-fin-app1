// app/api/send/alert.ts
import { NextResponse } from 'next/server';
import { sendAlertEmail } from '../../components/AlertSender2'

interface EmailResult {
  success: boolean;
  error?: string;
}

export async function POST(request: Request) {
  const { symbol, dateRange, analysisDate, signals } = await request.json();

  // Get recipients from environment variable
  const alertRecipients = process.env.RESEND_ALERT_RECIPIENTS?.split(',') || [];

  if (alertRecipients.length === 0) {
    console.warn('⚠️ No alert recipients configured in RESEND_ALERT_RECIPIENTS');
    return NextResponse.json(
      { error: 'No recipients configured' },
      { status: 400 }
    );
  }

  try {
    const results = await Promise.all(
      alertRecipients.map(async (userEmail): Promise<EmailResult> => {
        return await sendAlertEmail({ signals, symbol, userEmail, dateRange, analysisDate });
      })
    );

    const failures = results.filter(result => !result.success);
    if (failures.length > 0) {
      return NextResponse.json(
        { error: 'Some emails failed to send', failures },
        { status: 400 }
      );
    }

    console.log(`📤 Alerts sent to ${alertRecipients.join(', ')}`);
    return NextResponse.json({ success: true, recipients: alertRecipients });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
