import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { symbol, dateRange, analysisDate, signals } = req.body;

  const { data, error } = await resend.emails.send({
    from: 'Stock Alerts <alerts@finance.tastytechbytes.com>',
    to: ['chillcoders@gmail.com', 'adamtimuraslan@gmail.com'],
    subject: `🏆 ${symbol} Weekly Alert: Top AI-Ranked Signals`,
    html: generateEmailHTML(signals, symbol, dateRange, analysisDate), // Use your HTML generator
  });

  if (error) {
    return res.status(400).json(error);
  }

  res.status(200).json(data);
};

// Add your `generateEmailHTML` function here or import it
function generateEmailHTML(signals: any[], symbol: string, dateRange: string, analysisDate: string) {
  // Your existing email HTML logic
  return `<html>...</html>`;
}
