import React, { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function PaymentLedger({ reports }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const reversedReports = [...reports].reverse();
  const totalPages = Math.ceil(reversedReports.length / itemsPerPage);
  const visibleReports = reversedReports.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col">
       <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-slate-800">Recent Collections</h2>
        <Link href="/bills" className="text-sm font-medium text-blue-600 flex items-center hover:text-blue-800 transition-colors">
          View Monthly Bills <ArrowRight size={16} className="ml-1" />
        </Link>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <th className="pb-3 px-2">Month</th>
              <th className="pb-3 px-2">Utilities Billed</th>
              <th className="pb-3 px-2">Total Expected</th>
              <th className="pb-3 px-2">Collected</th>
              <th className="pb-3 px-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleReports.map((report, idx) => {
              const fullyPaid = Number(report.outstanding_balance) <= 0;
              return (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                   <td className="py-4 px-2 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">Mo</div>
                    <span className="font-medium text-slate-800">{report.month} / {report.year}</span>
                  </td>
                  <td className="py-4 px-2 text-slate-500">${Number(report.utilities_total || 0).toFixed(2)}</td>
                  <td className="py-4 px-2 font-medium text-slate-800">${Number(report.expected_revenue || 0).toFixed(2)}</td>
                  <td className="py-4 px-2 text-slate-500">${Number(report.collected_revenue || 0).toFixed(2)}</td>
                  <td className="py-4 px-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${fullyPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {fullyPaid ? 'Settled' : 'Pending'}
                    </span>
                  </td>
                </tr>
              );
            })}
            {reports.length === 0 && (
              <tr>
                 <td colSpan="5" className="py-8 text-center text-slate-400">No collections data yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 border-t border-slate-50 pt-4">
          <span className="text-xs font-medium text-slate-400 font-bold tracking-wider">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
