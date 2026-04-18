import React, { useRef, useState } from 'react';
import { Download, X, Building2, Calendar, Droplets, Zap, Wifi, Wind, Home, CheckCircle } from 'lucide-react';
import { toJpeg } from 'html-to-image';

export default function ReceiptModal({ isOpen, onClose, invoice, softwareName }) {
  const receiptRef = useRef();
  const [loading, setLoading] = useState(false);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  if (!isOpen || !invoice) return null;

  const handleDownloadPDF = async () => {
    setLoading(true);
    const btnContainer = document.getElementById('receipt-action-buttons');
    if (btnContainer) btnContainer.style.display = 'none';

    try {
      await new Promise(resolve => setTimeout(resolve, 50)); // Allow DOM repaint
      const element = receiptRef.current;
      const dataUrl = await toJpeg(element, { 
        quality: 1.0, 
        pixelRatio: 2.0,
        height: element.scrollHeight,
        canvasHeight: element.scrollHeight,
        style: { transform: 'none' } 
      });
      
      if (btnContainer) btnContainer.style.display = 'flex';
      
      const fileName = `Receipt_INV-${invoice.id.toString().padStart(5, '0')}.jpg`;

      // 1. Mobile-First: Attempt native Share Sheet API to prevent iOS Safari blob trapping
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobileDevice && navigator.share) {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Receipt ${fileName}`
            });
            setLoading(false);
            return; // Successfully handed off to OS
          }
        } catch (shareErr) {
          console.error("Native share cancelled or failed", shareErr);
        }
      }

      // 2. Desktop Fallback: Standard anchor download
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();

    } catch (err) {
      console.error(err);
      alert("Failed to export picture");
      if (btnContainer) btnContainer.style.display = 'flex';
    } finally {
      if (btnContainer) btnContainer.style.display = 'flex';
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex flex-col">
      {/* Independently Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start pb-24">
        {/* Receipt content wrapper */}
        <div id="receipt-content" ref={receiptRef} className="bg-white max-w-md w-full rounded-2xl print:rounded-none shadow-2xl print:shadow-none text-left relative overflow-hidden flex flex-col mt-4 sm:mt-0">
          
          {/* Internal Action Icons */}
          <div id="receipt-action-buttons" className="absolute top-4 right-4 z-20 flex gap-2">
            <button 
               onClick={handleDownloadPDF} 
               disabled={loading} 
               title="Export Receipt"
               className="w-10 h-10 bg-slate-100/80 backdrop-blur-sm text-slate-600 flex items-center justify-center rounded-full shadow-sm border border-slate-200 hover:bg-white hover:text-blue-600 hover:scale-105 hover:shadow-md transition-all disabled:opacity-50"
            >
               <Download size={18} />
            </button>
            <button 
               onClick={onClose} 
               title="Close Receipt"
               className="w-10 h-10 bg-rose-50/80 backdrop-blur-sm text-rose-500 flex items-center justify-center rounded-full shadow-sm border border-rose-100 hover:bg-rose-100 hover:text-rose-700 hover:scale-105 hover:shadow-md transition-all"
            >
               <X size={18} />
            </button>
          </div>

           <div className="p-8 pb-4 pt-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md"><Building2 size={24} /></div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 leading-tight">{softwareName || 'Skyview Residences'}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Official Receipt</p>
                </div>
              </div>

             <div className="flex justify-between items-end border-b-2 border-slate-100 pb-6 mb-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To</p>
                  <h3 className="text-lg font-bold text-slate-800">{invoice.user_name || invoice.Tenant?.name || 'Unknown'}</h3>
                  <p className="text-sm text-slate-500">{invoice.user_email || invoice.Tenant?.email || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Invoice ID</p>
                  <p className="font-mono font-bold text-slate-800 text-sm">#INV-{invoice.id.toString().padStart(5, '0')}</p>
                  <p className="text-xs text-slate-500 mt-1">{monthNames[invoice.month -1]} {invoice.year}</p>
                </div>
             </div>

             <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between items-center text-slate-600 font-semibold p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span>Base Unit Rent</span>
                  <span className="text-slate-900">$ {Number(invoice.rent_amount).toFixed(2)}</span>
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                  <div className="flex justify-between items-center text-slate-600 font-semibold p-3 bg-slate-100/50">
                    <span>Shared Utilities Overhead</span>
                    <span className="text-slate-900">$ {Number(invoice.shared_bill_amount).toFixed(2)}</span>
                  </div>
                  {(invoice.electricity != null || invoice.MasterBill) && (
                    <div className="p-3 text-xs space-y-2 border-t border-slate-100 font-medium text-slate-500 bg-white">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5"><Zap size={10} className="text-amber-500"/> Electricity (Bldg Total)</span>
                        <span>${Number(invoice.electricity || invoice.MasterBill?.electricity_total).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5"><Droplets size={10} className="text-cyan-500"/> Water (Bldg Total)</span>
                        <span>${Number(invoice.water || invoice.MasterBill?.water_total).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5"><Wifi size={10} className="text-blue-500"/> WiFi (Bldg Total)</span>
                        <span>${Number(invoice.wifi || invoice.MasterBill?.wifi_total).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5"><Wind size={10} className="text-emerald-500"/> Dust/Cleaning (Bldg Total)</span>
                        <span>${Number(invoice.dust || invoice.MasterBill?.dust_total).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-dashed border-slate-200 pt-2 mt-1">
                        <span className="text-slate-600 font-bold">Your Calculated Split</span>
                        <span className="text-slate-700 font-bold">${Number(invoice.split_per_user || (Number(invoice.shared_bill_amount) - Number(invoice.MasterBill?.bua_total))).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-bold flex items-center gap-1.5"><Home size={10} className="text-indigo-500"/> Maid (Bua) Flat Fee</span>
                        <span className="text-slate-700 font-bold">${Number(invoice.bua || invoice.MasterBill?.bua_total).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center p-3 border-b border-dashed border-slate-300 my-2"></div>

                <div className="flex justify-between items-center font-bold text-slate-800 px-3">
                  <span>Total Sum Due</span>
                  <span className="text-lg">$ {Number(invoice.total_amount).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center font-bold px-3">
                  <span className="text-slate-500">Payments Applied</span>
                  <span className="text-emerald-600">- $ {Number(invoice.amount_paid).toFixed(2)}</span>
                </div>
             </div>
             
             <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mt-6 text-xs text-blue-800 flex flex-col gap-1">
                <p className="font-bold">Payment Instructions:</p>
                <p>Please pay before the 10th day of the month to avoid any late fees.</p>
                <p className="font-semibold">You can pay using Bkash or Nagad to the following number: <span className="font-bold tracking-wider">01836979604</span></p>
             </div>
           </div>

           <div className={`${(Number(invoice.total_amount) - Number(invoice.amount_paid)) <= 0 ? 'bg-emerald-600' : 'bg-slate-800'} p-6 flex justify-between items-center text-white transition-colors mt-auto`}>
             <div>
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">Remaining Balance</p>
                <p className="text-3xl font-black">$ {Math.max(0, Number(invoice.total_amount) - Number(invoice.amount_paid)).toFixed(2)}</p>
             </div>
             <div className="text-right">
               {invoice.status.toLowerCase() === 'paid' && <span className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-sm shadow-sm border border-white/30"><CheckCircle size={14} /> PAID IN FULL</span>}
               {invoice.status.toLowerCase() === 'partial' && <span className="inline-flex items-center gap-1.5 bg-amber-500/80 px-3 py-1.5 text-xs font-bold rounded-full shadow-sm text-white border border-amber-400">PARTIAL PAYMENT</span>}
               {invoice.status.toLowerCase() === 'unpaid' && <span className="inline-flex items-center gap-1.5 bg-rose-500/80 px-3 py-1.5 text-xs font-bold rounded-full shadow-sm text-white border border-rose-400">UNPAID</span>}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
