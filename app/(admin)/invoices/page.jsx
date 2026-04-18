"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../../lib/api';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender 
} from '@tanstack/react-table';
import { FileText, DollarSign, X, CheckCircle, Clock, Plus, Wifi, Droplets, Wind, Zap, Home, Calculator, Search, Eye, Building2, Trash2, ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import ReceiptModal from '../../../components/invoices/ReceiptModal';

export default function BillingAndInvoicesPage() {
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' or 'bills'
  
  // Shared States
  const [loading, setLoading] = useState(false);
  const [softwareName, setSoftwareName] = useState('');
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // ===================== INVOICES STATE =====================
  const [invoices, setInvoices] = useState([]);
  const [invoiceGlobalFilter, setInvoiceGlobalFilter] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // ===================== BILLS STATE =====================
  const [bills, setBills] = useState([]);
  const [billGlobalFilter, setBillGlobalFilter] = useState('');
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billFormData, setBillFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    wifi: '', water: '', dust: '', electricity: '', bua: ''
  });

  // ===================== LEDGER STATE =====================
  const [transactions, setTransactions] = useState([]);
  const [expandedLedgerMonths, setExpandedLedgerMonths] = useState({});

  const toggleLedgerMonth = (key) => setExpandedLedgerMonths(prev => ({ ...prev, [key]: !prev[key] }));

  const groupedTransactions = useMemo(() => {
    const groups = {};
    transactions.forEach(tx => {
      const date = new Date(tx.payment_date);
      const year = date.getFullYear();
      const monthStr = monthNames[date.getMonth()];
      const key = `${monthStr} ${year}`;
      
      if (!groups[key]) {
        groups[key] = {
           monthStr,
           year,
           total: 0,
           transactions: []
        };
      }
      
      groups[key].transactions.push(tx);
      groups[key].total += Number(tx.amount);
    });
    
    return Object.values(groups).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return monthNames.indexOf(b.monthStr) - monthNames.indexOf(a.monthStr);
    });
  }, [transactions]);

  // ===================== FETCHERS =====================
  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBills = async () => {
    try {
      const res = await api.get('/bills');
      setBills(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchBills();
    fetchTransactions();
    api.get('/settings').then(res => {
      if (res.data?.software_name) setSoftwareName(res.data.software_name);
    }).catch(console.error);
  }, []);

  // ===================== HANDLERS =====================
  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await api.delete(`/invoices/${invoiceId}`);
      fetchInvoices();
    } catch (err) {
      alert("Failed to delete invoice");
    }
  };

  const handleDeleteBill = async (billId) => {
    if (!window.confirm("Are you sure you want to delete this master bill? This will also delete all associated tenant invoices.")) return;
    try {
      await api.delete(`/bills/${billId}`);
      fetchBills();
      fetchInvoices();
    } catch (err) {
      alert("Failed to delete master bill");
    }
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    const balance = Number(invoice.total_amount) - Number(invoice.amount_paid);
    setPaymentAmount(balance.toFixed(2));
    setPaymentMethod('cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsPaymentModalOpen(true);
  };

  const openReceiptModal = (invoice) => {
    setSelectedInvoice(invoice);
    setIsReceiptModalOpen(true);
  };

  const openReportModal = (bill) => {
    setSelectedBill(bill);
    setIsReportModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/transactions', {
        invoice_id: selectedInvoice.id,
        amount: paymentAmount,
        payment_method: paymentMethod,
        payment_date: paymentDate
      });
      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
      setPaymentAmount('');
      fetchInvoices();
      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.error || "Error recording payment");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/bills', {
        ...billFormData,
        wifi: Number(billFormData.wifi) || 0,
        water: Number(billFormData.water) || 0,
        dust: Number(billFormData.dust) || 0,
        electricity: Number(billFormData.electricity) || 0,
        bua: Number(billFormData.bua) || 0,
      });
      setIsBillModalOpen(false);
      setBillFormData({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        wifi: '', water: '', dust: '', electricity: '', bua: ''
      });
      fetchBills();
      fetchInvoices(); 
    } catch (err) {
      alert(err.response?.data?.error || "Error generating bills");
    } finally {
      setLoading(false);
    }
  };



  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Payment Date,Tenant Name,Applied To Cycle,Amount Paid,Invoice ID\n";
    
    transactions.forEach(tx => {
      const date = new Date(tx.payment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const cycle = `${monthNames[tx.month - 1]} ${tx.year}`;
      // Clean up string potentials
      csvContent += `"${date}","${(tx.user_name || '').replace(/"/g, '""')}","${cycle}","${tx.amount}","${tx.invoice_id}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Payment_Ledger_Export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calendar Icon Component
  function CalendarIcon() {
     return <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0"><Clock size={14} /></div>
  }

  // ===================== INVOICE COLUMNS =====================
  const invoiceColumns = useMemo(() => [
      {
        accessorKey: 'user_name',
        header: 'TENANT',
        cell: info => {
           const row = info.row.original;
           return (
             <div className="flex flex-col">
               <span className="font-bold text-sm text-slate-800">
                 {row.user_name}
               </span>
               <span className="text-xs text-slate-400 font-medium">{row.user_email}</span>
             </div>
           )
        }
      },
      {
        accessorKey: 'billing_cycle',
        header: 'BILLING CYCLE',
        accessorFn: row => `${monthNames[row.month - 1]} ${row.year}`,
        cell: info => (
          <div className="flex items-center gap-2">
            <CalendarIcon />
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
               <div className="flex justify-between items-center w-32"><span className="text-slate-400">Rent:</span> <span className="font-semibold text-slate-600">${Number(row.rent_amount).toFixed(2)}</span></div>
               <div className="flex justify-between items-center w-32"><span className="text-slate-400">Utilities:</span> <span className="font-semibold text-slate-600">${Number(row.shared_bill_amount).toFixed(2)}</span></div>
             </div>
          )
        }
      },
      {
        accessorKey: 'balance',
        header: 'BALANCE',
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
           if (status === 'inactive') color = 'bg-slate-200 text-slate-500 italic';
           return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${color}`}>{status}</span>
        }
      },
      {
        id: 'actions',
        header: '',
        cell: info => {
          const row = info.row.original;
          const isPaid = row.status === 'paid';
          return (
            <div className="text-right flex items-center justify-end gap-2">
              <button onClick={() => openReceiptModal(row)} className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors" title="View Single Invoice Receipt">
                <Eye size={16} />
              </button>
              <button onClick={() => handleDeleteInvoice(row.id)} className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-200 transition-colors" title="Delete Invoice">
                <Trash2 size={16} />
              </button>
              {!isPaid && (
                <button onClick={() => openPaymentModal(row)} className="px-4 py-1.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-lg hover:bg-blue-100 transition-colors">
                  Record Payment
                </button>
              )}
              {isPaid && (
                 <span className="flex items-center gap-1 font-bold text-emerald-500 text-xs px-2">
                   <CheckCircle size={14} /> Settled
                 </span>
              )}
            </div>
          )
        }
      }
    ],
    []
  );

  const invoiceTable = useReactTable({
    data: invoices,
    columns: invoiceColumns,
    state: { globalFilter: invoiceGlobalFilter },
    onGlobalFilterChange: setInvoiceGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // ===================== BILLS COLUMNS =====================
  const billColumns = useMemo(() => [
      {
        accessorKey: 'month_year',
        header: 'BILLING CYCLE',
        accessorFn: row => `${monthNames[row.month - 1]} ${row.year}`,
        cell: info => (
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
               <CalendarIcon />
             </div>
             <div>
               <span className="font-bold text-sm text-slate-800">{info.getValue()}</span>
               <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">ID: #B-{(info.row.original.id * 782).toString().substring(0, 4)}</p>
             </div>
          </div>
        )
      },
      {
        id: 'utilities',
        header: 'UTILITIES LOGGED',
        cell: info => {
          const row = info.row.original;
          return (
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
               <div className="flex flex-col gap-1.5 border-r border-slate-100 pr-4">
                 <span className="flex items-center gap-1.5"><Zap size={12} className="text-amber-500" /> ${row.electricity} Electric</span>
                 <span className="flex items-center gap-1.5"><Wifi size={12} className="text-blue-500" /> ${row.wifi} Wifi</span>
               </div>
               <div className="flex flex-col gap-1.5 border-r border-slate-100 pr-4">
                 <span className="flex items-center gap-1.5"><Droplets size={12} className="text-cyan-500" /> ${row.water} Water</span>
                 <span className="flex items-center gap-1.5"><Wind size={12} className="text-emerald-500" /> ${row.dust} Dust/Clean</span>
               </div>
               <div className="flex flex-col justify-center border-l-2 pl-4 border-indigo-100">
                  <span className="flex items-center gap-1.5 text-indigo-600 font-bold tracking-tight"><Home size={12} /> ${row.bua} Maid (Flat)</span>
               </div>
            </div>
          )
        }
      },
      {
        accessorKey: 'total_amount',
        header: 'TOTAL UTILITIES',
        cell: info => <span className="font-bold text-slate-800">${Number(info.getValue()).toFixed(2)}</span>
      },
      {
        accessorKey: 'split_per_user',
        header: 'SPLIT / USER',
        cell: info => (
          <div className="flex items-center gap-2">
            <Calculator size={14} className="text-slate-400" />
            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">${Number(info.getValue()).toFixed(2)}</span>
            <span className="text-[10px] text-slate-400 italic font-semibold">(excl. Bua)</span>
          </div>
        )
      },
      {
        id: 'actions',
        header: '',
        cell: info => (
            <div className="text-right flex items-center justify-end gap-2">
              <button onClick={() => handleDeleteBill(info.row.original.id)} className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-200 transition-colors" title="Delete Master Bill and Invoices">
                <Trash2 size={16} />
              </button>
              <button onClick={() => openReportModal(info.row.original)} className="px-4 py-1.5 bg-slate-50 text-slate-600 font-bold text-xs rounded-lg flex items-center gap-2 hover:bg-slate-200 transition-colors border border-slate-200">
                <Eye size={14} /> View Report
              </button>
            </div>
        )
      }
    ],
    []
  );

  const billTable = useReactTable({
    data: bills,
    columns: billColumns,
    state: { globalFilter: billGlobalFilter },
    onGlobalFilterChange: setBillGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const unpaidCount = invoices.filter(i => i.status === 'unpaid' || i.status === 'partial').length;

  return (
    <div className="space-y-6 max-w-full">
      {/* Header section with Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-2">
        <div className="w-full">
          <h1 className="text-3xl font-bold text-slate-800 leading-tight flex items-center gap-3">
             <FileText size={28} className="text-blue-600" /> Billing & Invoices
          </h1>
          <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4 w-full overflow-x-auto">
            <button 
              onClick={() => setActiveTab('invoices')}
              className={`pb-3 border-b-2 font-bold text-sm transition-colors ${activeTab === 'invoices' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Tenant Invoices
            </button>
            <button 
              onClick={() => setActiveTab('bills')}
              className={`pb-3 border-b-2 font-bold text-sm transition-colors ${activeTab === 'bills' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Master Utility Bills
            </button>
            <button 
              onClick={() => setActiveTab('ledger')}
              className={`pb-3 border-b-2 font-bold text-sm transition-colors ${activeTab === 'ledger' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Payment Ledger
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'invoices' && (
         <div className="mt-2 space-y-4">
           {/* Invoices Search and Stats Header */}
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="w-full sm:w-auto">
                {unpaidCount > 0 && <p className="text-sm font-semibold text-rose-600 bg-rose-50 px-4 py-2 rounded-lg inline-block border border-rose-100 w-full sm:w-auto text-center sm:text-left">{unpaidCount} invoices are awaiting settlement.</p>}
              </div>

              {/* SEARCH BAR (Invoices) */}
              <div className="flex items-center bg-white rounded-lg px-4 py-2 w-full md:w-72 border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all shadow-sm">
                <Search size={16} className="text-slate-400 mr-2 shrink-0" />
                <input 
                  type="text" 
                  value={invoiceGlobalFilter}
                  onChange={(e) => setInvoiceGlobalFilter(e.target.value)}
                  placeholder="Search invoices by name or cycle..." 
                  className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
                />
              </div>
           </div>
           
           <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col mt-4">
             <div className="overflow-x-auto">
               <table className="w-full text-left bg-white whitespace-nowrap">
                 <thead className="bg-slate-50 border-b border-slate-100">
                   {invoiceTable.getHeaderGroups().map(headerGroup => (
                     <tr key={headerGroup.id}>
                       {headerGroup.headers.map(header => (
                         <th key={header.id} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-4 px-6">
                           {flexRender(header.column.columnDef.header, header.getContext())}
                         </th>
                       ))}
                     </tr>
                   ))}
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {invoiceTable.getRowModel().rows.map(row => (
                     <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                       {row.getVisibleCells().map(cell => (
                         <td key={cell.id} className="py-5 px-6">
                           {flexRender(cell.column.columnDef.cell, cell.getContext())}
                         </td>
                       ))}
                     </tr>
                   ))}
                   {invoiceTable.getRowModel().rows.length === 0 && (
                     <tr>
                        <td colSpan={invoiceColumns.length} className="py-12 text-center text-slate-400 text-sm font-medium">
                          No matching invoices found.
                        </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
             <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs text-slate-500 font-medium">
               <div>
                  Showing <span className="font-bold text-slate-700">
                    {invoiceTable.getRowModel().rows.length > 0 ? invoiceTable.getState().pagination.pageIndex * invoiceTable.getState().pagination.pageSize + 1 : 0}-
                    {Math.min((invoiceTable.getState().pagination.pageIndex + 1) * invoiceTable.getState().pagination.pageSize, invoiceTable.getFilteredRowModel().rows.length)}
                  </span> of {invoiceTable.getFilteredRowModel().rows.length} results
               </div>
               <div className="flex items-center gap-2">
                 <button onClick={() => invoiceTable.previousPage()} disabled={!invoiceTable.getCanPreviousPage()} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 disabled:opacity-50">&lt;</button>
                 {invoiceTable.getPageOptions().map(pageIdx => (
                   <button 
                     key={pageIdx} 
                     onClick={() => invoiceTable.setPageIndex(pageIdx)}
                     className={`w-8 h-8 flex items-center justify-center ${invoiceTable.getState().pagination.pageIndex === pageIdx ? 'rounded-lg bg-white text-blue-600 font-bold border border-slate-200 shadow-sm' : 'rounded-lg hover:bg-slate-200'}`}
                   >
                     {pageIdx + 1}
                   </button>
                 ))}
                 <button onClick={() => invoiceTable.nextPage()} disabled={!invoiceTable.getCanNextPage()} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 disabled:opacity-50">&gt;</button>
               </div>
             </div>
           </div>
         </div>
      )}

      {activeTab === 'bills' && (
         <div className="mt-4 space-y-4">
           {/* Bills Search and Generate Header */}
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* SEARCH BAR (Master Bills) */}
              <div className="flex items-center bg-white rounded-lg px-4 py-2 w-72 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all shadow-sm">
                <Search size={16} className="text-slate-400 mr-2" />
                <input 
                  type="text" 
                  value={billGlobalFilter}
                  onChange={(e) => setBillGlobalFilter(e.target.value)}
                  placeholder="Search master cycles..." 
                  className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
                />
              </div>

              <button onClick={() => setIsBillModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow w-full sm:w-auto">
                <Plus size={18} /> Generate New Bill
              </button>
           </div>
           
           <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
             <div className="overflow-x-auto">
               <table className="w-full text-left bg-white whitespace-nowrap">
                 <thead className="bg-slate-50 border-b border-slate-100">
                   {billTable.getHeaderGroups().map(headerGroup => (
                     <tr key={headerGroup.id}>
                       {headerGroup.headers.map(header => (
                         <th key={header.id} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-4 px-6">
                           {flexRender(header.column.columnDef.header, header.getContext())}
                         </th>
                       ))}
                     </tr>
                   ))}
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {billTable.getRowModel().rows.map(row => (
                     <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                       {row.getVisibleCells().map(cell => (
                         <td key={cell.id} className="py-5 px-6">
                           {flexRender(cell.column.columnDef.cell, cell.getContext())}
                         </td>
                       ))}
                     </tr>
                   ))}
                   {billTable.getRowModel().rows.length === 0 && (
                     <tr>
                        <td colSpan={billColumns.length} className="py-12 text-center text-slate-400 text-sm font-medium">
                          No matching bills found.
                        </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
             
             <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs text-slate-500 font-medium">
               <div>
                  Showing <span className="font-bold text-slate-700">
                    {billTable.getRowModel().rows.length > 0 ? billTable.getState().pagination.pageIndex * billTable.getState().pagination.pageSize + 1 : 0}-
                    {Math.min((billTable.getState().pagination.pageIndex + 1) * billTable.getState().pagination.pageSize, billTable.getFilteredRowModel().rows.length)}
                  </span> of {billTable.getFilteredRowModel().rows.length} results
               </div>
               <div className="flex items-center gap-2">
                 <button onClick={() => billTable.previousPage()} disabled={!billTable.getCanPreviousPage()} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 disabled:opacity-50">&lt;</button>
                 {billTable.getPageOptions().map(pageIdx => (
                   <button 
                     key={pageIdx} 
                     onClick={() => billTable.setPageIndex(pageIdx)}
                     className={`w-8 h-8 flex items-center justify-center ${billTable.getState().pagination.pageIndex === pageIdx ? 'rounded-lg bg-white text-indigo-600 font-bold border border-slate-200 shadow-sm' : 'rounded-lg hover:bg-slate-200'}`}
                   >
                     {pageIdx + 1}
                   </button>
                 ))}
                 <button onClick={() => billTable.nextPage()} disabled={!billTable.getCanNextPage()} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 disabled:opacity-50">&gt;</button>
               </div>
             </div>
           </div>
         </div>
      )}

      {activeTab === 'ledger' && (
         <div className="mt-4 space-y-6">
           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm">
             <div>
               <h2 className="text-emerald-800 font-extrabold text-lg flex items-center gap-2"><DollarSign size={20} /> Payment Ledger</h2>
               <p className="text-emerald-600 font-medium text-xs mt-1">Cash flow timeline based on the date payments were received.</p>
             </div>
             <div className="flex flex-row items-center gap-4 w-full lg:w-auto">
                 <button onClick={handleExportCSV} className="bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-sm">
                   <FileSpreadsheet size={16} /> Export to CSV
                 </button>
                 <div className="bg-white px-4 py-2 rounded-lg border border-emerald-100 shadow-sm text-center flex-1 lg:flex-none">
                     <p className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">Total Revenue</p>
                     <p className="font-black text-emerald-600 text-xl">${transactions.reduce((acc, tx) => acc + Number(tx.amount), 0).toFixed(2)}</p>
                 </div>
             </div>
           </div>

           {groupedTransactions.length === 0 ? (
              <div className="py-12 bg-white rounded-3xl border border-slate-100 text-center shadow-sm">
                <DollarSign size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500 font-bold">No payments have been recorded yet.</p>
              </div>
           ) : (
              <div className="space-y-4">
                {groupedTransactions.map(group => {
                  const groupKey = `${group.monthStr} ${group.year}`;
                  const isOpen = expandedLedgerMonths[groupKey] !== false; // default true
                  return (
                    <div key={groupKey} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
                       <button 
                         onClick={() => toggleLedgerMonth(groupKey)}
                         className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-slate-50 hover:bg-slate-100 transition-colors gap-4"
                       >
                         <div className="flex items-center gap-3 w-full sm:w-auto">
                           <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                              <DollarSign size={20} />
                           </div>
                           <div className="text-left flex-1 border-b sm:border-0 border-slate-200 pb-3 sm:pb-0">
                             <h3 className="font-extrabold text-slate-800 text-lg whitespace-nowrap">{group.monthStr} {group.year}</h3>
                             <p className="text-xs text-slate-500 font-semibold whitespace-nowrap">{group.transactions.length} recorded payments</p>
                           </div>
                         </div>
                         <div className="flex justify-between sm:justify-end items-center gap-6 w-full sm:w-auto">
                            <div className="text-left sm:text-right">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collected</p>
                               <p className="font-black text-emerald-600 text-xl whitespace-nowrap">${group.total.toFixed(2)}</p>
                            </div>
                            <div className="text-slate-400 shrink-0">
                               {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                         </div>
                       </button>

                       {isOpen && (
                         <div className="border-t border-slate-100 p-4">
                            <div className="bg-white overflow-hidden rounded-xl border border-slate-100">
                               <table className="w-full text-left whitespace-nowrap">
                                  <thead className="bg-slate-50">
                                     <tr>
                                       <th className="text-[10px] font-bold text-slate-500 uppercase px-4 py-3 border-b border-slate-100">Date Logged</th>
                                       <th className="text-[10px] font-bold text-slate-500 uppercase px-4 py-3 border-b border-slate-100">Tenant</th>
                                       <th className="text-[10px] font-bold text-slate-500 uppercase px-4 py-3 border-b border-slate-100">Applied To Cycle</th>
                                       <th className="text-[10px] font-bold text-slate-500 uppercase px-4 py-3 text-right border-b border-slate-100">Amount Paid</th>
                                     </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                     {group.transactions.map((tx, idx) => (
                                       <tr key={tx.id || idx} className="hover:bg-slate-50 transition-colors">
                                          <td className="px-4 py-3 text-sm font-semibold text-slate-600">
                                             {new Date(tx.payment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                          </td>
                                          <td className="px-4 py-3">
                                             <div className="font-bold text-slate-800 text-sm">{tx.user_name}</div>
                                             <div className="text-[10px] text-slate-400 uppercase font-semibold">Payment #{tx.id}</div>
                                          </td>
                                          <td className="px-4 py-3">
                                             <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded inline-flex items-center gap-1.5 text-xs font-bold border border-indigo-100">
                                                <Clock size={12}/> {monthNames[tx.month - 1]} {tx.year}
                                             </span>
                                          </td>
                                          <td className="px-4 py-3 text-right">
                                             <span className="font-black text-emerald-600">+ ${Number(tx.amount).toFixed(2)}</span>
                                          </td>
                                       </tr>
                                     ))}
                                  </tbody>
                               </table>
                            </div>
                         </div>
                       )}
                    </div>
                  );
                })}
              </div>
           )}
         </div>
      )}


      {/* ================= MODALS ================= */}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-extrabold text-slate-800">Record Payment</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm space-y-2">
                 <div className="flex justify-between items-center font-bold text-slate-800">
                   <span>{selectedInvoice.user_name}</span>
                   <span>#{selectedInvoice.id}</span>
                 </div>
                 <div className="flex justify-between items-center text-slate-500">
                   <span>Total Due:</span>
                   <span>${Number(selectedInvoice.total_amount).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-slate-500">
                   <span>Already Paid:</span>
                   <span className="text-emerald-600">+${Number(selectedInvoice.amount_paid).toFixed(2)}</span>
                 </div>
                 <div className="h-px bg-slate-200 my-2"></div>
                 <div className="flex justify-between items-center font-extrabold text-rose-600">
                   <span>Outstanding Balance:</span>
                   <span>${(Number(selectedInvoice.total_amount) - Number(selectedInvoice.amount_paid)).toFixed(2)}</span>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} required className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-blue-500 focus:border-blue-500 transition-all shadow-sm">
                    <option value="cash">Cash</option>
                    <option value="bkash">Bkash</option>
                    <option value="nagad">Nagad</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Date</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-blue-500 focus:border-blue-500 transition-all shadow-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><DollarSign size={14} className="text-blue-500"/> Payment Received Amount</label>
                <div className="relative">
                  <div className="absolute top-[14px] left-4 text-slate-800 font-bold text-lg">$</div>
                  <input type="number" min="0" step="0.01" max={(Number(selectedInvoice.total_amount) - Number(selectedInvoice.amount_paid)).toFixed(2)} value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required className="w-full pl-8 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-lg text-slate-800 focus:outline-blue-500 focus:border-blue-500 transition-all shadow-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-5 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="bg-[#1E40AF] hover:bg-blue-800 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? 'Processing...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Bill Modal */}
      {isBillModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col border border-indigo-100">
            <div className="px-6 py-4 border-b border-indigo-50 flex justify-between items-center bg-indigo-50/50">
              <h3 className="text-xl font-extrabold text-indigo-900">Distribute Utilities</h3>
              <button onClick={() => setIsBillModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleGenerateBill} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Billing Month</label>
                   <select value={billFormData.month} onChange={e => setBillFormData({...billFormData, month: Number(e.target.value)})} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-indigo-500 focus:border-indigo-500">
                      {monthNames.map((m, i) => (
                        <option key={i} value={i+1}>{m}</option>
                      ))}
                   </select>
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Billing Year</label>
                   <input type="number" required value={billFormData.year} onChange={e => setBillFormData({...billFormData, year: Number(e.target.value)})} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-indigo-500 focus:border-indigo-500" />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                 <div className="relative">
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Wifi size={12} className="text-blue-500"/> Wifi Cost</label>
                   <div className="absolute top-[29px] left-3 text-slate-400 font-semibold">$</div>
                   <input type="number" min="0" step="0.01" value={billFormData.wifi} onChange={e => setBillFormData({...billFormData, wifi: e.target.value})} className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-indigo-500 focus:border-indigo-500 transition-all shadow-sm" placeholder="0.00" />
                 </div>
                 <div className="relative">
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Zap size={12} className="text-amber-500"/> Electricity</label>
                   <div className="absolute top-[29px] left-3 text-slate-400 font-semibold">$</div>
                   <input type="number" min="0" step="0.01" value={billFormData.electricity} onChange={e => setBillFormData({...billFormData, electricity: e.target.value})} className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-indigo-500 focus:border-indigo-500 transition-all shadow-sm" placeholder="0.00" />
                 </div>
                 <div className="relative">
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Droplets size={12} className="text-cyan-500"/> Water</label>
                   <div className="absolute top-[29px] left-3 text-slate-400 font-semibold">$</div>
                   <input type="number" min="0" step="0.01" value={billFormData.water} onChange={e => setBillFormData({...billFormData, water: e.target.value})} className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-indigo-500 focus:border-indigo-500 transition-all shadow-sm" placeholder="0.00" />
                 </div>
                 <div className="relative">
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Wind size={12} className="text-emerald-500"/> Dust/Cleaning</label>
                   <div className="absolute top-[29px] left-3 text-slate-400 font-semibold">$</div>
                   <input type="number" min="0" step="0.01" value={billFormData.dust} onChange={e => setBillFormData({...billFormData, dust: e.target.value})} className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-indigo-500 focus:border-indigo-500 transition-all shadow-sm" placeholder="0.00" />
                 </div>
                 <div className="relative col-span-2">
                   <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Home size={12} className="text-indigo-500"/> Maid (Bua) Cost - FLAT RATE</label>
                   <div className="absolute top-[29px] left-3 text-slate-400 font-semibold">$</div>
                   <input type="number" min="0" step="0.01" value={billFormData.bua} onChange={e => setBillFormData({...billFormData, bua: e.target.value})} className="w-full pl-7 pr-3 py-2.5 bg-indigo-50 border-2 border-indigo-200 rounded-xl text-sm font-bold text-indigo-900 focus:outline-none focus:border-indigo-500 transition-all shadow-sm" placeholder="0.00 (Unsplit)" />
                 </div>
              </div>

              <div className="bg-indigo-50 p-4 rounded-xl flex items-start gap-3 border border-indigo-100">
                 <Calculator size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                 <p className="text-xs text-indigo-800 font-medium leading-relaxed">
                   Generating this bill divides utilities evenly. The Maid (Bua) tax will be applied directly as a fixed flat rate per active lease.
                 </p>
              </div>
              
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsBillModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? 'Processing Splits...' : 'Generate Shared Invoices'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SINGLE INVOICE RECEIPT MODAL */}
      <ReceiptModal 
         isOpen={isReceiptModalOpen} 
         onClose={() => setIsReceiptModalOpen(false)} 
         invoice={selectedInvoice} 
         softwareName={softwareName} 
      />

      {/* SINGLE BILL REPORT MODAL */}
      {isReportModalOpen && selectedBill && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
             <button onClick={() => setIsReportModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1.5 rounded-full hover:bg-slate-100 transition-colors z-10"><X size={24}/></button>

             <div className="p-8 pb-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shadow-inner"><Calculator size={28} /></div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 leading-tight">Master Utilities Report</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Cycle Focus: {monthNames[selectedBill.month -1]} {selectedBill.year}</p>
                  </div>
                </div>
             </div>

             <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                     <Zap size={18} className="text-amber-500 shrink-0 mt-0.5" />
                     <div>
                       <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Electricity</p>
                       <p className="font-bold text-slate-800 text-lg">${Number(selectedBill.electricity).toFixed(2)}</p>
                     </div>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                     <Wifi size={18} className="text-blue-500 shrink-0 mt-0.5" />
                     <div>
                       <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Wifi Network</p>
                       <p className="font-bold text-slate-800 text-lg">${Number(selectedBill.wifi).toFixed(2)}</p>
                     </div>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                     <Droplets size={18} className="text-cyan-500 shrink-0 mt-0.5" />
                     <div>
                       <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Water Supply</p>
                       <p className="font-bold text-slate-800 text-lg">${Number(selectedBill.water).toFixed(2)}</p>
                     </div>
                   </div>
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                     <Wind size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                     <div>
                       <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Cleaning / Dust</p>
                       <p className="font-bold text-slate-800 text-lg">${Number(selectedBill.dust).toFixed(2)}</p>
                     </div>
                   </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <Home size={24} className="text-indigo-600" />
                     <div>
                       <p className="text-[11px] font-bold uppercase text-indigo-400 tracking-wider">Flat Maid Rate (Bua)</p>
                       <p className="text-xs text-indigo-800 font-semibold mt-0.5">Applied to all tenants individually</p>
                     </div>
                   </div>
                   <p className="font-black text-indigo-700 text-xl">${Number(selectedBill.bua).toFixed(2)}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center px-2">
                   <div>
                     <p className="text-xs font-bold text-slate-400">Total Sum Splittable:</p>
                     <p className="text-sm font-black text-slate-800">${(Number(selectedBill.wifi) + Number(selectedBill.electricity) + Number(selectedBill.water) + Number(selectedBill.dust)).toFixed(2)}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xs font-bold text-slate-400">Final Split / User:</p>
                     <p className="text-xl font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg inline-block border border-blue-100">${Number(selectedBill.split_per_user).toFixed(2)}</p>
                   </div>
                </div>
             </div>
           </div>
         </div>
      )}

    </div>
  );
}
