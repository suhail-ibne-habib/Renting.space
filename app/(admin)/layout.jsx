"use client";
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  BarChart3, 
  HelpCircle, 
  LogOut,
  Search,
  Bell,
  Settings,
  Plus,
  UserCircle,
  Menu
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [softwareName, setSoftwareName] = useState('Skyview Residences');

  useEffect(() => {
    api.get('/settings').then(res => {
      if (res.data && res.data.software_name) {
        setSoftwareName(res.data.software_name);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return <div className="p-8 flex items-center justify-center h-screen">Loading...</div>;

  const isActive = (path) => pathname === path;

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-800/50 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-slate-900">{softwareName}</h1>
            <p className="text-xs text-slate-500">Management Console</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link href="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive('/') ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
            <LayoutDashboard size={20} className={isActive('/') ? 'text-blue-600' : 'text-slate-400'} />
            Overview
          </Link>
          <Link href="/rooms" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive('/rooms') ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Building2 size={20} className={isActive('/rooms') ? 'text-blue-600' : 'text-slate-400'} />
            Rooms
          </Link>
          <Link href="/users" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive('/users') ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Users size={20} className={isActive('/users') ? 'text-blue-600' : 'text-slate-400'} />
            Tenants
          </Link>
          <Link href="/invoices" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive('/invoices') ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
            <BarChart3 size={20} className={isActive('/invoices') ? 'text-blue-600' : 'text-slate-400'} />
            Billing & Invoices
          </Link>
          <Link href="/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive('/settings') ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Settings size={20} className={isActive('/settings') ? 'text-blue-600' : 'text-slate-400'} />
            System Settings
          </Link>
        </nav>

        <div className="p-4 space-y-1 border-t border-slate-100">
          <Link href="/tenant" className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
            <UserCircle size={20} className="text-slate-400" />
            My Tenant Profile
          </Link>
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
            <HelpCircle size={20} className="text-slate-400" />
            Help
          </button>
          <button onClick={logout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
            <LogOut size={20} className="text-slate-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between md:justify-end px-4 md:px-8">
          <button className="md:hidden p-2 text-slate-500 hover:text-blue-600" onClick={() => setIsSidebarOpen(true)}>
             <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-slate-400">
              <button className="hover:text-slate-600 relative">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
              <button className="hover:text-slate-600"><Settings size={20} /></button>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-slate-600 text-sm">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
