"use client";
import { useEffect, useState, useMemo } from 'react';
import api from '../../lib/api';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel,
  flexRender 
} from '@tanstack/react-table';
import { 
  UserCircle, Calendar, Phone, Mail, Clock, Download, 
  FileText, CheckCircle, Zap, Wifi, Droplets, Wind, Home, File, Activity
} from 'lucide-react';
import Image from 'next/image';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function TenantDashboard() {
  const [profile, setProfile] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await api.get('/auth/me');
        setProfile(profileRes.data);
        
        // If admin, explicitly request only their invoices
        const invoiceUrl = profileRes.data.role === 'admin' 
          ? `/invoices?userId=${profileRes.data.id}` 
          : '/invoices';
          
        const invoiceRes = await api.get(invoiceUrl);
        setInvoices(invoiceRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns = useMemo(() => [
      {
        accessorKey: 'billing_cycle',
        header: 'BILLING CYCLE',
        accessorFn: row => `${monthNames[row.month - 1]} ${row.year}`,
        cell: info => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0"><Clock size={14} /></div>
            <span className="font-bold text-slate-700 text-sm">{info.getValue()}</span>
          </div>
        )
      },
      {
        id: 'breakdown',
        header: 'BREAKDOWN',
        cell: info => {
          const row = info.row.original;
          return (
             <div className="flex flex-col gap-1 text-xs">
               <div className="flex justify-between items-center w-36"><span className="text-slate-400">Rent:</span> <span className="font-semibold text-slate-600">${Number(row.rent_amount).toFixed(2)}</span></div>
               <div className="flex justify-between items-center w-36"><span className="text-slate-400">Utilities:</span> <span className="font-semibold text-slate-600">${Number(row.shared_bill_amount).toFixed(2)}</span></div>
             </div>
          )
        }
      },
      {
        accessorKey: 'balance',
        header: 'BALANCE DUE',
        cell: info => {
          const row = info.row.original;
          const balance = Number(row.total_amount) - Number(row.amount_paid);
          return (
            <div className="flex flex-col">
              <span className={`font-bold text-base ${balance > 0 ? 'text-slate-800' : 'text-emerald-600'}`}>${balance.toFixed(2)}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total: ${Number(row.total_amount).toFixed(2)}</span>
            </div>
          )
        }
      },
      {
        accessorKey: 'status',
        header: 'STATUS',
        cell: info => {
           const status = info.getValue();
           let color = 'bg-slate-100 text-slate-600';
           if (status === 'paid') color = 'bg-emerald-100 text-emerald-700';
           if (status === 'partial') color = 'bg-amber-100 text-amber-700';
           if (status === 'unpaid') color = 'bg-rose-100 text-rose-700';
           return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${color}`}>{status}</span>
        }
      }
    ],
    []
  );

  const table = useReactTable({
    data: invoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) return <div className="flex items-center justify-center p-8 h-64 text-slate-400">Loading Profile...</div>;
  if (!profile) return <div className="p-8 text-rose-500 font-bold">Failed to load profile.</div>;

  const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.amount_paid), 0);
  const totalDue = totalBilled - totalPaid;

  const chartData = [...invoices].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  }).map(inv => ({
    cycle: `${inv.month}/${inv.year.toString().slice(-2)}`,
    billed: Number(inv.total_amount),
    paid: Number(inv.amount_paid)
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <UserCircle size={32} className="text-indigo-600" />
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Profile & Billing</h1>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Total Billed (Lifetime)</p>
            <p className="font-black text-slate-800 text-3xl mt-1">${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Total Paid (Lifetime)</p>
            <p className="font-black text-emerald-600 text-3xl mt-1">${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center">
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Outstanding Balance</p>
            <p className={`font-black text-3xl mt-1 ${totalDue > 0 ? 'text-rose-600' : 'text-slate-800'}`}>${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Graphical Trends */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 mb-6">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2"><Activity size={16}/> My Billing Trend</h3>
           <div className="h-48 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                 <XAxis dataKey="cycle" tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
                 <YAxis tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false}  />
                 <Tooltip 
                   cursor={{fill: '#f8fafc'}} 
                   contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                 />
                 <Bar dataKey="billed" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Billed Amount" />
                 <Bar dataKey="paid" fill="#10b981" radius={[4, 4, 0, 0]} name="Paid Amount" />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        <div className="px-8 pb-8 relative">
           {/* Avatar */}
           <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center -mt-12 overflow-hidden text-3xl font-black text-indigo-200 bg-indigo-50 shrink-0">
             {profile.profile_pic ? (
               <img src={`http://localhost:5000/uploads/${profile.profile_pic}`} alt="Profile" className="w-full h-full object-cover" />
             ) : (
               profile.name.charAt(0).toUpperCase()
             )}
           </div>

           <div className="flex justify-between items-start mt-4">
             <div>
               <h2 className="text-2xl font-black text-slate-800">{profile.name}</h2>
               <div className="flex items-center gap-4 mt-2">
                 <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                   {profile.role}
                 </span>
                 <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${profile.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                   <span className={`w-1.5 h-1.5 rounded-full ${profile.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                   {profile.status}
                 </span>
               </div>
             </div>
             
             {profile.seat_name && (
               <div className="text-right bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-1 items-end min-w-[200px]">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Unit</span>
                 <span className="text-xl font-black text-slate-800">{profile.room_name} - {profile.seat_name}</span>
                 <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Home size={12}/> Unit Price: ${Number(profile.seat_price).toFixed(2)}/mo</span>
               </div>
             )}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 border-t border-slate-100 pt-8">
             <div className="space-y-4">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Contact & Identity</h3>
               <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                 <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0"><Mail size={16}/></div>
                 {profile.email}
               </div>
               <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                 <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0"><Phone size={16}/></div>
                 {profile.phone || 'No phone number provided'}
               </div>
               <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                 <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center shrink-0"><Calendar size={16}/></div>
                 Joined: {new Date(profile.join_date).toLocaleDateString()}
               </div>
             </div>

             <div className="space-y-4">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Legal Documents</h3>
               <div className="flex flex-col gap-3">
                 <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-xl">
                   <div className="flex items-center gap-3">
                     <FileText size={20} className="text-slate-400" />
                     <span className="text-sm font-bold text-slate-700">Lease Deed Agreement</span>
                   </div>
                   {profile.deed_document ? (
                     <a href={`http://localhost:5000/uploads/${profile.deed_document}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg"><Download size={14}/> View</a>
                   ) : (
                     <span className="text-xs font-bold text-slate-400">Not Uploaded</span>
                   )}
                 </div>
                 <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-xl">
                   <div className="flex items-center gap-3">
                     <File size={20} className="text-slate-400" />
                     <span className="text-sm font-bold text-slate-700">National ID (NID)</span>
                   </div>
                   {profile.nid_document ? (
                     <a href={`http://localhost:5000/uploads/${profile.nid_document}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg"><Download size={14}/> View</a>
                   ) : (
                     <span className="text-xs font-bold text-slate-400">Not Uploaded</span>
                   )}
                 </div>
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* Invoices Section */}
      <div>
        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><FileText size={20} className="text-slate-400" /> My Invoices</h3>
        
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left bg-white whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-4 px-6">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-50">
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="py-5 px-6">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                {table.getRowModel().rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="py-12 text-center text-slate-400 text-sm font-medium">
                      You have no invoices generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
