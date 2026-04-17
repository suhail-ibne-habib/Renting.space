import React from 'react';

export default function ActionItems() {
  return (
    <div className="bg-[#E6EEF9] rounded-2xl p-5 flex flex-col h-[500px]">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-lg font-bold text-slate-800 leading-tight">Action<br/>Items</h2>
        <div className="bg-white text-blue-700 text-[10px] font-bold px-2 py-1 rounded-md text-center leading-tight shadow-sm">
          ALERTS
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {/* Placeholder Alert 1 */}
        <div className="bg-white p-4 rounded-xl shadow-sm relative overflow-hidden">
           <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
           <h3 className="font-bold text-slate-800 text-sm">Unpaid Invoices</h3>
           <p className="text-xs text-slate-500 mb-3">You have tenants with overdue payments.</p>
           <div className="flex justify-between items-center">
             <span className="text-xs font-medium text-red-500">Requires Action</span>
             <button className="text-xs font-bold text-blue-600 hover:text-blue-800">Review</button>
           </div>
        </div>

         {/* Placeholder Alert 2 */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
           <h3 className="font-bold text-slate-800 text-sm">Empty Seats</h3>
           <p className="text-xs text-slate-500 mb-3">Some rooms have available seats.</p>
           <div className="flex justify-between items-center">
             <span className="text-xs font-medium text-slate-400">Low Priority</span>
             <button className="text-xs font-bold text-blue-600 hover:text-blue-800">Manage</button>
           </div>
        </div>
      </div>
    </div>
  );
}
