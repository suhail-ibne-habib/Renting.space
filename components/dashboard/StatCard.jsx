import React from 'react';

export default function StatCard({ title, value, subtext, icon, color }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-500',
    slate: 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 tracking-wider break-words">{title}</span>
        <div className={`p-2 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
          {icon}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        {subtext && <span className="text-xs font-medium text-slate-400">{subtext}</span>}
      </div>
    </div>
  );
}
