import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { symbol } = req.query;
  if (typeof symbol !== 'string') return res.status(400).json({ success: false, message: 'Invalid symbol' });

  try {
    const stock = await prisma.stock_data.findUnique({ where: { symbol } });
    if (!stock) return res.status(404).json({ success: false, message: 'Not found' });

    res.status(200).json({
      success: true,
      data: stock,
      message: null,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
  console.error('Database error:', e);
  res.status(500).json({ success: false, message: 'Server error' });
}
}
