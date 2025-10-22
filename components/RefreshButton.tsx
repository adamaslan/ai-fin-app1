'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { refreshTechnicalData } from '@/app/actions/technical-analysis';

interface RefreshButtonProps {
  symbol: string;
  date: string;
}

export function RefreshButton({ symbol, date }: RefreshButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const result = await refreshTechnicalData(symbol, date);
      if (result.error) {
        alert(result.error);
      } else {
        // Page will automatically refresh due to revalidatePath
        window.location.reload();
      }
    } catch (error) {
      console.error('Refresh error:', error);
      alert('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}
