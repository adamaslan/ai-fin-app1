// 'use client'

// import { useState, useEffect } from 'react';

// interface TechnicalJustification {
//   [key: string]: string;
// }


// interface SpreadSuggestion {
//   id: number;
//   stock_symbol: string;
//   timeframe: string;
//   expiration_date: string;
//   expected_move: number;
//   call_type: string;
//   call_short_strike: number;
//   call_long_strike: number;
//   call_width: number;
//   call_max_profit: string;
//   call_max_loss: string;
//   call_breakeven: string;
//   put_type: string;
//   put_short_strike: number;
//   put_long_strike: number;
//   put_width: number;
//   put_max_profit: string;
//   put_max_loss: string;
//   put_breakeven: string;
//   technical_justification: TechnicalJustification;
// }

// export default function SpreadSuggestionsClient() {
//   const [data, setData] = useState<SpreadSuggestion | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     fetchSpreadSuggestions();
//   }, []);

//   const fetchSpreadSuggestions = async (): Promise<void> => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await fetch('/api/spread-suggestions');
//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }
//       const result: SpreadSuggestion = await response.json();
//       setData(result);
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
//       setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (dateString: string): string => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   const formatCurrency = (value: number | string): string => {
//     if (typeof value === 'string' && value.startsWith('$')) {
//       return value;
//     }
//     return `$${Number(value).toFixed(2)}`;
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-lg text-gray-600">Loading spread suggestions...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-lg text-red-600">Error: {error}</div>
//       </div>
//     );
//   }

//   if (!data) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-lg text-gray-600">No data available</div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="bg-white rounded-lg shadow-lg overflow-hidden">
//           {/* Header */}
//           <div className="bg-blue-600 text-white px-6 py-4">
//             <h1 className="text-2xl font-bold">Options Spread Suggestions</h1>
//             <div className="mt-2 flex flex-wrap items-center gap-4 text-blue-100">
//               <span className="font-semibold text-lg">{data.stock_symbol}</span>
//               <span>{data.timeframe}</span>
//               <span>Expires: {formatDate(data.expiration_date)}</span>
//               <span>Expected Move: {(data.expected_move * 100).toFixed(1)}%</span>
//             </div>
//           </div>

//           <div className="p-6">
//             <div className="grid md:grid-cols-2 gap-8">
//               {/* Call Spread */}
//               <div className="bg-green-50 rounded-lg p-6 border border-green-200">
//                 <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center">
//                   <span className="bg-green-600 text-white px-2 py-1 rounded text-sm mr-2">CALL</span>
//                   {data.call_type}
//                 </h2>
                
//                 <div className="space-y-3">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <div className="text-sm text-gray-600">Short Strike</div>
//                       <div className="text-lg font-semibold">{formatCurrency(data.call_short_strike)}</div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-gray-600">Long Strike</div>
//                       <div className="text-lg font-semibold">{formatCurrency(data.call_long_strike)}</div>
//                     </div>
//                   </div>
                  
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <div className="text-sm text-gray-600">Width</div>
//                       <div className="text-lg font-semibold">{formatCurrency(data.call_width)}</div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-gray-600">Breakeven</div>
//                       <div className="text-lg font-semibold">{data.call_breakeven}</div>
//                     </div>
//                   </div>
                  
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <div className="text-sm text-gray-600">Max Profit</div>
//                       <div className="text-lg font-semibold text-green-600">{data.call_max_profit}</div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-gray-600">Max Loss</div>
//                       <div className="text-lg font-semibold text-red-600">{data.call_max_loss}</div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Put Spread */}
//               <div className="bg-red-50 rounded-lg p-6 border border-red-200">
//                 <h2 className="text-xl font-bold text-red-800 mb-4 flex items-center">
//                   <span className="bg-red-600 text-white px-2 py-1 rounded text-sm mr-2">PUT</span>
//                   {data.put_type}
//                 </h2>
                
//                 <div className="space-y-3">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <div className="text-sm text-gray-600">Short Strike</div>
//                       <div className="text-lg font-semibold">{formatCurrency(data.put_short_strike)}</div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-gray-600">Long Strike</div>
//                       <div className="text-lg font-semibold">{formatCurrency(data.put_long_strike)}</div>
//                     </div>
//                   </div>
                  
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <div className="text-sm text-gray-600">Width</div>
//                       <div className="text-lg font-semibold">{formatCurrency(data.put_width)}</div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-gray-600">Breakeven</div>
//                       <div className="text-lg font-semibold">{data.put_breakeven}</div>
//                     </div>
//                   </div>
                  
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <div className="text-sm text-gray-600">Max Profit</div>
//                       <div className="text-lg font-semibold text-green-600">{data.put_max_profit}</div>
//                     </div>
//                     <div>
//                       <div className="text-sm text-gray-600">Max Loss</div>
//                       <div className="text-lg font-semibold text-red-600">{data.put_max_loss}</div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Technical Justification */}
//             {data.technical_justification && (
//               <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
//                 <h3 className="text-lg font-bold text-blue-800 mb-4">Technical Analysis</h3>
//                 <div className="space-y-2">
//                   {Object.entries(data.technical_justification).map(([key, value]) => (
//                     <div key={key} className="flex items-start">
//                       <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full mr-3 mt-0.5 min-w-[20px] text-center">
//                         {parseInt(key) + 1}
//                       </span>
//                       <span className="text-gray-700">{value}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Refresh Button */}
//             <div className="mt-6 text-center">
//               <button
//                 onClick={fetchSpreadSuggestions}
//                 className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
//                 disabled={loading}
//               >
//                 {loading ? 'Loading...' : 'Refresh Data'}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }