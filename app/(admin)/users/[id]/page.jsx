"use client";
import React, { useState, useEffect } from 'react';
import api from '../../../../lib/api';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Mail, Phone, Calendar, Home, DollarSign, FileText, Activity, CreditCard
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ReceiptModal from '../../../../components/invoices/ReceiptModal';

export default function SingleUserPage() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [softwareName, setSoftwareName] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [userRes, invRes, transRes, settingsRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get(`/invoices?userId=${id}`),
          api.get(`/transactions?userId=${id}`),
          api.get('/settings')
        ]);
        setUser(userRes.data);
        setInvoices(invRes.data);
        setTransactions(transRes.data);
        
        if (settingsRes.data?.software_name) {
          setSoftwareName(settingsRes.data.software_name);
        }
      } catch (error) {
         console.error('Error fetching user data', error);
      } finally {
         setLoading(false);
      }
    };
    if (id) fetchUserData();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800">User not found</h2>
        <button onClick={() => router.push('/users')} className="mt-4 text-blue-600 hover:underline">Return to Tenants</button>
      </div>
    );
  }

  const initials = user.name.substring(0, 2).toUpperCase();
  const pfpUrl = user.profile_pic ? `http://localhost:5000/uploads/${user.profile_pic}` : null;
  const activeLease = user.status === 'active';

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
      
      {/* Top Header Navigation */}
      <button onClick={() => router.push('/users')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
        <ArrowLeft size={16} /> Back to Tenants
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 w-full relative">
           <div className="absolute top-4 right-6 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold tracking-widest uppercase flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${activeLease ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
              {user.status}
           </div>
        </div>
        
        <div className="px-8 pb-8 flex flex-col md:flex-row gap-6 items-start md:items-end -mt-12 relative z-10">
          <div className="rounded-full p-2 bg-white shrink-0 shadow-lg">
            {pfpUrl ? (
              <img src={pfpUrl} alt={user.name} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-3xl shadow-inner uppercase">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 pb-2">
            <h1 className="text-3xl font-extrabold text-slate-800">{user.name}</h1>
            <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-4">
               <span className="flex items-center gap-1.5"><Mail size={14}/> {user.email}</span>
               <span className="flex items-center gap-1.5"><Phone size={14}/> {user.phone || 'No phone'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Total Billed (Lifetime)</p>
            <p className="font-black text-slate-800 text-3xl mt-1">${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Total Paid (Lifetime)</p>
            <p className="font-black text-emerald-600 text-3xl mt-1">${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Outstanding Balance</p>
            <p className={`font-black text-3xl mt-1 ${totalDue > 0 ? 'text-rose-600' : 'text-slate-800'}`}>${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Lease & Documents */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Home size={16}/> Lease Details</h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 font-semibold block mb-1">Property / Unit</span>
                <p className="text-md font-bold text-slate-800">{user.room_name || 'Unassigned'} — {user.seat_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block mb-1">Base Rent</span>
                <p className="text-md font-bold text-blue-600">${Number(user.seat_price || 0).toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block mb-1 flex items-center gap-1.5"><Calendar size={12}/> Move-in Date</span>
                <p className="text-sm font-medium text-slate-700">{user.join_date ? new Date(user.join_date).toLocaleDateString('en-US', { day:'numeric', month: 'long', year: 'numeric' }) : 'Unknown'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><FileText size={16}/> Documents</h3>
            <div className="flex flex-col gap-3">
              {user.nid_document ? (
                 <a href={`http://localhost:5000/uploads/${user.nid_document}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-colors group">
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">NID Document</span>
                    <span className="text-[10px] font-bold uppercase bg-slate-100 px-2 py-1 rounded text-slate-500">View</span>
                 </a>
              ) : (
                <div className="p-3 text-sm text-slate-400 italic">No NID uploaded</div>
              )}

              {user.deed_document ? (
                 <a href={`http://localhost:5000/uploads/${user.deed_document}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 transition-colors group">
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700">Lease Deed</span>
                    <span className="text-[10px] font-bold uppercase bg-slate-100 px-2 py-1 rounded text-slate-500">View</span>
                 </a>
              ) : (
                <div className="p-3 text-sm text-slate-400 italic">No Lease Deed uploaded</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Invoices & Activities */}
        <div className="md:col-span-2 space-y-6">
          {/* Graphical Trends */}
          {invoices.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2"><Activity size={16}/> Billing Trend</h3>
               <div className="h-48 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                     <XAxis dataKey="cycle" tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
                     <YAxis tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false}  />
                     <Tooltip 
                       cursor={{fill: '#f1f5f9'}} 
                       contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                     />
                     <Bar dataKey="billed" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Billed Amount" />
                     <Bar dataKey="paid" fill="#10b981" radius={[4, 4, 0, 0]} name="Paid Amount" />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><DollarSign size={16}/> Billing & Invoices</h3>
               <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{invoices.length} Invoices</span>
             </div>

             {invoices.length === 0 ? (
               <div className="py-8 text-center text-slate-400 text-sm">No invoices found for this tenant.</div>
             ) : (
               <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                 {invoices.map(inv => {
                   const isPaid = inv.status.toLowerCase() === 'paid';
                   return (
                     <div key={inv.id} onClick={() => { setSelectedInvoice(inv); setIsReceiptModalOpen(true); }} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:shadow-md cursor-pointer hover:border-blue-200 transition-all group">
                       <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 ${isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                           <FileText size={18} />
                         </div>
                         <div>
                            <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">Invoice #{inv.id}</p>
                            <p className="text-xs text-slate-500 font-medium">{inv.month}/{inv.year} Billing Cycle</p>
                         </div>
                       </div>
                       <div className="text-right flex flex-col items-end">
                          <p className="font-bold text-lg text-slate-800">${Number(inv.total_amount).toFixed(2)}</p>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {inv.status}
                          </span>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Activity size={16}/> Payment History</h3>
               <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{transactions.length} Records</span>
             </div>

             {transactions.length === 0 ? (
               <div className="py-8 text-center text-slate-400 text-sm">No recorded transactions.</div>
             ) : (
               <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 max-h-96 overflow-y-auto pr-4 pb-4">
                 {transactions.map((tx, idx) => (
                   <div key={tx.id} className="relative">
                      <div className="absolute -left-[35px] top-1 w-4 h-4 rounded-full bg-blue-100 border-[3px] border-white flex items-center justify-center">
                         <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                               <CreditCard size={14} className="text-blue-500" />
                               Payment Received
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Applied to Invoice #{tx.invoice_id} ({tx.month}/{tx.year})</p>
                          </div>
                          <div className="text-right">
                             <p className="font-bold text-emerald-600">+${Number(tx.amount).toFixed(2)}</p>
                             <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">
                               {new Date(tx.payment_date).toLocaleDateString()}
                             </p>
                          </div>
                        </div>
                      </div>
                   </div>
                 ))}
                   {selectedInvoice && (
              <ReceiptModal 
                 isOpen={isReceiptModalOpen} 
                 onClose={() => setIsReceiptModalOpen(false)} 
                 invoice={selectedInvoice} 
                 softwareName={softwareName} 
              />
            )}
        </div>
             )}
          </div>

        </div>
      </div>

    </div>
  );
}
