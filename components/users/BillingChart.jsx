import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Activity } from 'lucide-react';

export default function BillingChart({ invoices }) {
  const [selectedMetric, setSelectedMetric] = useState('All');

  const data = [...invoices].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  }).map(inv => {
    const date = new Date(inv.year, inv.month - 1);
    const monthName = date.toLocaleString('default', { month: 'short' });
    return {
      name: `${monthName} ${inv.year.toString().slice(-2)}`,
      Total: Number(inv.total_amount),
      Rent: Number(inv.rent_amount),
      Utilities: Number(inv.shared_bill_amount),
      Paid: Number(inv.amount_paid),
      Electricity: Number(inv.electricity || 0)
    };
  });

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
             <Activity size={16}/> Billing Trend
          </h3>
          <p className="text-xs text-slate-500">Track cycle-over-cycle rent and utilities</p>
        </div>
        <select 
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
        >
          <option value="All">All Metrics</option>
          <option value="Total">Total Billed Only</option>
          <option value="Paid">Amount Paid Only</option>
          <option value="Rent">Base Rent Only</option>
          <option value="Utilities">Utilities Only</option>
          <option value="Electricity">Electricity Trend</option>
        </select>
      </div>

      <div className="h-56 w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`$${value.toFixed(2)}`, undefined]}
              />
              <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
              
              {(selectedMetric === 'All' || selectedMetric === 'Total') && (
                <Line type="monotone" dataKey="Total" name="Total Billed" stroke="#4f46e5" strokeWidth={selectedMetric === 'Total' ? 3 : 2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              )}
              {(selectedMetric === 'All' || selectedMetric === 'Paid') && (
                <Line type="monotone" dataKey="Paid" name="Amount Paid" stroke="#10b981" strokeWidth={selectedMetric === 'Paid' ? 3 : 2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              )}
              {(selectedMetric === 'All' || selectedMetric === 'Rent') && (
                <Line type="monotone" dataKey="Rent" name="Base Rent" stroke="#f59e0b" strokeWidth={selectedMetric === 'Rent' ? 3 : 2} strokeDasharray="5 5" dot={selectedMetric === 'Rent' ? { r: 3 } : false} activeDot={{ r: 5 }} />
              )}
              {(selectedMetric === 'All' || selectedMetric === 'Utilities') && (
                <Line type="monotone" dataKey="Utilities" name="Utilities Contribution" stroke="#3b82f6" strokeWidth={selectedMetric === 'Utilities' ? 3 : 2} strokeDasharray="5 5" dot={selectedMetric === 'Utilities' ? { r: 3 } : false} activeDot={{ r: 5 }} />
              )}
              {(selectedMetric === 'All' || selectedMetric === 'Electricity') && (
                <Line type="monotone" dataKey="Electricity" name="Bldg. Electricity" stroke="#f43f5e" strokeWidth={selectedMetric === 'Electricity' ? 3 : 2} strokeDasharray="3 3" dot={selectedMetric === 'Electricity' ? { r: 3 } : false} activeDot={{ r: 5 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No billing data available yet.
          </div>
        )}
      </div>
    </div>
  );
}
