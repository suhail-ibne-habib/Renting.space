"use client";
import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Banknote, Home, Briefcase, Wrench } from 'lucide-react';

// Refactored Components
import StatCard from '../../components/dashboard/StatCard';
import PaymentLedger from '../../components/dashboard/PaymentLedger';
import ActionItems from '../../components/dashboard/ActionItems';
import ExpensesChart from '../../components/dashboard/ExpensesChart';

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [metrics, setMetrics] = useState({
    totalCollected: 0,
    occupancy: { rate: 0, occupied: 0, total: 0 },
    pendingPayments: { count: 0, outstanding: 0 },
    monthlyUtilities: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, metricsRes] = await Promise.all([
          api.get('/reports/monthly'),
          api.get('/reports/dashboard-metrics')
        ]);
        setReports(reportsRes.data);
        setMetrics(metricsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Column (Metrics, Collections Ledger) */}
      <div className="flex-1 space-y-6">
        
        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="TOTAL COLLECTED" 
            value={`$${metrics.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            subtext={loading ? "Loading..." : "Total historical revenue"} 
            icon={<Banknote size={18} />} 
            color="blue" 
          />
          <StatCard 
            title="OCCUPANCY RATE" 
            value={`${metrics.occupancy.rate.toFixed(1)}%`} 
            subtext={loading ? "Loading..." : `${metrics.occupancy.occupied}/${metrics.occupancy.total} seats occupied`} 
            icon={<Home size={18} />} 
            color="emerald" 
          />
          <StatCard 
            title="PENDING PAYMENTS" 
            value={metrics.pendingPayments.count.toString()} 
            subtext={loading ? "Loading..." : `$${metrics.pendingPayments.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} outstanding`} 
            icon={<Briefcase size={18} />} 
            color="rose" 
          />
          <StatCard 
            title="MONTHLY UTILITIES" 
            value={`$${metrics.monthlyUtilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            subtext={loading ? "Loading..." : "Current billing cycle"} 
            icon={<Wrench size={18} />} 
            color="slate" 
          />
        </div>

        {/* Utility Expenses Chart */}
        <ExpensesChart reports={reports} />

        {/* Collections Ledger */}
        <PaymentLedger reports={reports} />
      </div>

      {/* Right Column (Action Items Widget) */}
      <div className="w-full lg:w-80 flex flex-col gap-6">
        <ActionItems />
      </div>
    </div>
  );
}
