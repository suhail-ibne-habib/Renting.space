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

export default function ExpensesChart({ reports }) {
  const [selectedMetric, setSelectedMetric] = useState('All');

  // Format the reports data for the chart
  const data = reports.map((report) => {
    // Generate a short month name (e.g., Jan, Feb)
    const date = new Date(report.year, report.month - 1);
    const monthName = date.toLocaleString('default', { month: 'short' });

    return {
      name: `${monthName} ${report.year}`,
      Electricity: Number(report.electricity || 0),
      Water: Number(report.water || 0),
      Wifi: Number(report.wifi || 0),
      Dust: Number(report.dust || 0),
      BUA: Number(report.bua || 0),
      TotalUtilities: Number(report.utilities_total || 0),
    };
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Utility Expenses Overview</h2>
          <p className="text-sm text-slate-500">Track and monitor monthly utility bills</p>
        </div>
        <select 
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-700"
        >
          <option value="All">All Expenses</option>
          <option value="TotalUtilities">Total Expenses Only</option>
          <option value="Electricity">Electricity Only</option>
          <option value="Water">Water Only</option>
          <option value="Wifi">WiFi Only</option>
        </select>
      </div>

      <div className="h-[300px] w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`$${value.toFixed(2)}`, undefined]}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
              {(selectedMetric === 'All' || selectedMetric === 'TotalUtilities') && (
                <Line type="monotone" dataKey="TotalUtilities" name="Total Expenses" stroke="#0ea5e9" strokeWidth={selectedMetric === 'TotalUtilities' ? 3 : 3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              )}
              {(selectedMetric === 'All' || selectedMetric === 'Electricity') && (
                <Line type="monotone" dataKey="Electricity" name="Electricity" stroke="#f59e0b" strokeWidth={selectedMetric === 'Electricity' ? 3 : 2} dot={selectedMetric === 'Electricity' ? { r: 4 } : false} activeDot={{ r: 6 }} />
              )}
              {(selectedMetric === 'All' || selectedMetric === 'Water') && (
                <Line type="monotone" dataKey="Water" name="Water" stroke="#3b82f6" strokeWidth={selectedMetric === 'Water' ? 3 : 2} dot={selectedMetric === 'Water' ? { r: 4 } : false} activeDot={{ r: 6 }} />
              )}
              {(selectedMetric === 'All' || selectedMetric === 'Wifi') && (
                <Line type="monotone" dataKey="Wifi" name="WiFi" stroke="#8b5cf6" strokeWidth={selectedMetric === 'Wifi' ? 3 : 2} dot={selectedMetric === 'Wifi' ? { r: 4 } : false} activeDot={{ r: 6 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            No expenses data available yet.
          </div>
        )}
      </div>
    </div>
  );
}
