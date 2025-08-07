'use client';

import { useMemo, useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams, ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import { format } from 'date-fns';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Define the type for a SpreadSuggestion, matching your Prisma schema
interface SpreadSuggestion {
  id: number;
  stock_symbol: string;
  timeframe: string;
  call_type: string;
  call_max_profit: string;
  call_max_loss: string;
  call_breakeven: string;
  put_type: string;
  put_max_profit: string;
  put_max_loss: string;
  put_breakeven: string;
  technical_justification: string[];
  expiration_date: string; // Now serialized as string from server
  expected_move: number;
  // price?: number;            // ← newly added
}

// Custom cell renderer for Call Leg details
const CallLegRenderer = (params: ICellRendererParams) => {
  const { call_type, call_max_profit, call_max_loss, call_breakeven } = params.data;
  
  return (
    <div className="py-2">
      <div className="font-medium mb-2">Call Leg</div>
      <div className="space-y-1 text-sm">
        <div>• Type: {call_type}</div>
        <div>• Max Profit: {call_max_profit}</div>
        <div>• Max Loss: {call_max_loss}</div>
        <div>• Breakeven: {call_breakeven}</div>
      </div>
    </div>
  );
};

// Custom cell renderer for Put Leg details
const PutLegRenderer = (params: ICellRendererParams) => {
  const { put_type, put_max_profit, put_max_loss, put_breakeven } = params.data;
  
  return (
    <div className="py-2">
      <div className="font-medium mb-2">Put Leg</div>
      <div className="space-y-1 text-sm">
        <div>• Type: {put_type}</div>
        <div>• Max Profit: {put_max_profit}</div>
        <div>• Max Loss: {put_max_loss}</div>
        <div>• Breakeven: {put_breakeven}</div>
      </div>
    </div>
  );
};

// Custom cell renderer for Technical Justification
const TechnicalJustificationRenderer = (params: ICellRendererParams) => {
  const justifications = params.value || [];
  
  return (
    <div className="py-2">
      <div className="font-medium mb-2">Technical Justification</div>
      <ol className="list-decimal list-inside space-y-1 text-sm">
        {justifications.map((point: string, idx: number) => (
          <li key={idx}>{point}</li>
        ))}
      </ol>
    </div>
  );
};

// Custom cell renderer for Stock Symbol and Timeframe
const SymbolTimeframeRenderer = (params: ICellRendererParams) => {
  const { stock_symbol, timeframe } = params.data;
  
  return (
    <div className="py-2">
      <div className="text-xl font-semibold">
        {stock_symbol} — {timeframe}
      </div>
    </div>
  );
};

// Custom cell renderer for Expiration Date
const ExpirationRenderer = (params: ICellRendererParams) => {
  const date = new Date(params.value);
  
  return (
    <div className="py-2">
      <div className="text-sm text-gray-500">
        Expires: {format(date, 'MMMM dd, yyyy')}
      </div>
    </div>
  );
};

// Custom cell renderer for Expected Move
const ExpectedMoveRenderer = (params: ICellRendererParams) => {
  const expectedMove = params.value;
  
  return (
    <div className="py-2">
      <div className="text-lg font-medium">
        Expected Move: {expectedMove?.toFixed(2)}
      </div>
    </div>
  );
};

interface SpreadSuggestionsGridProps {
  suggestions: SpreadSuggestion[];
}

export default function SpreadSuggestionsGrid({ suggestions }: SpreadSuggestionsGridProps) {
  const [rowData, setRowData] = useState<SpreadSuggestion[]>([]);

  console.log('Grid received suggestions:', suggestions); // Debug log

  useEffect(() => {
    // Sort suggestions by expiration date (desc) to match original behavior
    if (suggestions && Array.isArray(suggestions)) {
      const sortedSuggestions = [...suggestions].sort((a, b) => 
        new Date(b.expiration_date).getTime() - new Date(a.expiration_date).getTime()
      );
      console.log('Sorted suggestions:', sortedSuggestions); // Debug log
      setRowData(sortedSuggestions);
    }
  }, [suggestions]);

  const columnDefs: ColDef[] = useMemo(() => [
    {
      headerName: 'Stock & Timeframe',
      field: 'stock_symbol',
      cellRenderer: SymbolTimeframeRenderer,
      width: 250,
      pinned: 'left',
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Expiration',
      field: 'expiration_date',
      cellRenderer: ExpirationRenderer,
      width: 200,
      sortable: true,
      sort: 'desc', // Default sort
    },
    {
      headerName: 'Expected Move',
      field: 'expected_move',
      cellRenderer: ExpectedMoveRenderer,
      width: 180,
      sortable: true,
      filter: 'agNumberColumnFilter',
    },
    {
      headerName: 'Call Leg',
      field: 'call_type',
      cellRenderer: CallLegRenderer,
      width: 250,
      sortable: false,
    },
    {
      headerName: 'Put Leg',
      field: 'put_type',
      cellRenderer: PutLegRenderer,
      width: 250,
      sortable: false,
    },
    {
      headerName: 'Technical Justification',
      field: 'technical_justification',
      cellRenderer: TechnicalJustificationRenderer,
      width: 400,
      sortable: false,
      flex: 1, // Takes remaining space
    },
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    filter: true,
    autoHeight: true, // Allows rows to expand based on content
  }), []);

  return (
    <div className="ag-theme-alpine w-full" style={{ height: '800px' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pagination={true}
        paginationPageSize={10}
        animateRows={true}
        rowHeight={120} // Increased row height to accommodate content
        headerHeight={50}
        suppressRowClickSelection={true}
        rowClass="border-b border-gray-200 hover:bg-gray-50"
        theme="legacy" // Use legacy theme to avoid conflict with CSS files
      />

      <style jsx global>{`
        .ag-theme-alpine {
          --ag-border-radius: 16px;
          --ag-card-radius: 16px;
        }
        
        .ag-theme-alpine .ag-root-wrapper {
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        }
        
        .ag-theme-alpine .ag-header {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .ag-theme-alpine .ag-header-cell {
          font-weight: 600;
        }
        
        .ag-theme-alpine .ag-row:hover {
          background-color: #f9fafb;
        }
        
        .ag-theme-alpine .ag-cell {
          padding: 8px 12px;
        }
      `}</style>
    </div>
  );
}
