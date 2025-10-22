
'use server';

import { auth } from '@clerk/nextjs/server';
import { Storage } from '@google-cloud/storage';
import { revalidatePath } from 'next/cache';

const storage = new Storage();

export async function refreshTechnicalData(symbol: string, date: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    const bucketName = 'ttb-bucket1';
    const bucket = storage.bucket(bucketName);

    const [files] = await bucket.getFiles({
      prefix: `daily/${date}/${symbol}`,
    });

    if (files.length === 0) {
      return { error: 'No data found' };
    }

    const signalsFile = files
      .filter(f => f.name.includes('signals') && f.name.endsWith('.json'))
      .sort()
      .pop();

    const geminiFile = files
      .filter(f => f.name.includes('gemini_analysis') && f.name.endsWith('.json'))
      .sort()
      .pop();

    if (!signalsFile) {
      return { error: 'Signals file not found' };
    }

    const [signalsContent] = await signalsFile.download();
    const technicalData = JSON.parse(signalsContent.toString());

    let geminiAnalysis = null;
    if (geminiFile) {
      const [geminiContent] = await geminiFile.download();
      geminiAnalysis = JSON.parse(geminiContent.toString());
    }

    // Revalidate the dashboard page
    revalidatePath('/dashboard');

    return {
      success: true,
      technicalData,
      geminiAnalysis,
    };
  } catch (error) {
    console.error('Error refreshing data:', error);
    return { error: 'Failed to refresh data' };
  }
}