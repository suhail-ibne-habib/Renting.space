"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Home, X, LogOut, UserCircle } from 'lucide-react';

export default function TenantLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-800/50 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl md:shadow-none border-r border-slate-200 flex flex-col transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
             <h2 className="text-xl font-black text-slate-800 tracking-tight">Skyview</h2>
             <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Resident Portal</p>
          </div>
          <button className="md:hidden text-slate-400 hover:text-slate-600" onClick={() => setIsSidebarOpen(false)}>
             <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/tenant" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 font-bold rounded-xl transition-colors">
            <UserCircle size={20}/> My Dashboard
          </Link>
          {user.role === 'admin' && (
            <Link href="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-colors mt-4">
              <Home size={20}/> Return to Admin
            </Link>
          )}
        </nav>
        
        <div className="p-4 border-t border-slate-100">
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-600 font-bold px-4 py-3 rounded-xl hover:bg-rose-100 transition-colors">
            <LogOut size={18}/> Logout
          </button>
        </div>
      </aside>
      
      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4">
          <button className="p-2 -ml-2 text-slate-500 hover:text-blue-600" onClick={() => setIsSidebarOpen(true)}>
             <Menu size={24} />
          </button>
          <div className="ml-2 font-bold text-slate-800">Skyview Resident Portal</div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
