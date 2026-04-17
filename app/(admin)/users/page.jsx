"use client";
import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../lib/api';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel, 
  getFilteredRowModel, 
  flexRender 
} from '@tanstack/react-table';
import { Search, SlidersHorizontal, MoreVertical, Plus, Mail, Phone, X } from 'lucide-react';
import Link from 'next/link';

export default function TenantsPage() {
  const [data, setData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Available selections for the modal
  const [rooms, setRooms] = useState([]);
  const [seats, setSeats] = useState([]);

  const fetchData = async () => {
    try {
      const res = await api.get('/users');
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoomsSeats = async () => {
    try {
      const [rRes, sRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/seats')
      ]);
      setRooms(rRes.data);
      setSeats(sRes.data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchData();
    fetchRoomsSeats();
  }, []);

  const openAddModal = () => {
    setEditingUser({ id: null, name: '', email: '', phone: '', seat_id: '', status: 'active', password: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    let formattedDate = '';
    if (user.join_date) {
      formattedDate = new Date(user.join_date).toISOString().split('T')[0];
    }
    setEditingUser({ ...user, join_date: formattedDate });
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(editingUser).forEach(key => {
        if (editingUser[key] !== null && editingUser[key] !== undefined) {
           formData.append(key, editingUser[key]);
        }
      });

      if (editingUser.id) {
        await api.put(`/users/${editingUser.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/users', formData, {
           headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Error saving user. Recheck fields or email uniqueness.");
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'TENANT NAME',
        cell: info => {
          const row = info.row.original;
          const initials = row.name.substring(0,2).toUpperCase();
          const pfpUrl = row.profile_pic ? `http://localhost:5000/uploads/${row.profile_pic}` : null;
          return (
            <div className="flex items-center gap-3">
              {pfpUrl ? (
                <img src={pfpUrl} alt={row.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                  {initials}
                </div>
              )}
              <div className="flex flex-col">
                <Link href={`/users/${row.id}`} className="font-bold text-sm text-slate-800 hover:text-blue-600 transition-colors">
                  {row.name}
                </Link>
                <span className="text-xs text-slate-400">ID: #T-{(row.id * 893).toString().substring(0, 4)}</span>
              </div>
            </div>
          )
        }
      },
      {
        id: 'property',
        header: 'PROPERTY / UNIT',
        accessorFn: row => `${row.room_name} ${row.seat_name}`,
        cell: info => {
          const row = info.row.original;
          return (
            <div className="flex flex-col">
              <span className="font-medium text-sm text-slate-800">{row.room_name || 'Unassigned'}</span>
              <span className="text-xs text-slate-500">{row.seat_name || 'No Unit'}</span>
            </div>
          )
        }
      },
      {
        id: 'contact',
        header: 'CONTACT INFO',
        accessorFn: row => `${row.email} ${row.phone}`,
        cell: info => {
          const row = info.row.original;
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Mail size={12} /> {row.email}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Phone size={12} /> {row.phone || 'N/A'}
              </div>
              {(row.nid_document || row.deed_document) && (
                <div className="flex gap-2 mt-1">
                  {row.nid_document && <a href={`http://localhost:5000/uploads/${row.nid_document}`} target="_blank" rel="noreferrer" className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase font-bold hover:bg-blue-100 transition-colors">NID</a>}
                  {row.deed_document && <a href={`http://localhost:5000/uploads/${row.deed_document}`} target="_blank" rel="noreferrer" className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase font-bold hover:bg-emerald-100 transition-colors">Deed</a>}
                </div>
              )}
            </div>
          )
        }
      },
      {
        accessorKey: 'seat_price',
        header: 'RENT AMOUNT',
        cell: info => (
          <span className="font-bold text-slate-800">${Number(info.getValue() || 0).toFixed(2)}</span>
        )
      },
      {
        accessorKey: 'join_date',
        header: 'LEASE PERIOD',
        cell: info => {
          const dateStr = info.getValue() ? new Date(info.getValue()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown';
          return (
            <div className="flex flex-col w-32">
              <span className="text-xs font-semibold text-slate-700 mb-1">Since {dateStr}</span>
              <div className="h-1 bg-slate-200 rounded-full w-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
          )
        }
      },
      {
        accessorKey: 'status',
        header: 'STATUS',
        cell: info => {
          const status = info.getValue();
          return (
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-4 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
              <span className={`text-[10px] font-bold uppercase ${status === 'active' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {status}
              </span>
            </div>
          )
        }
      },
      {
        id: 'actions',
        header: '',
        cell: info => (
          <button onClick={() => openEditModal(info.row.original)} className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-slate-100 transition-colors">
            <MoreVertical size={18} />
          </button>
        )
      }
    ],
    []
  );

  const filteredData = useMemo(() => {
    return data.filter(d => d.status === activeTab);
  }, [data, activeTab]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
  });

  const activeCount = data.filter(d => d.status === 'active').length;

  return (
    <div className="space-y-6 max-w-full">
      {/* Header section identical to screenshot */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b md:border-0 border-slate-100 pb-4 md:pb-0">
        <div className="w-full md:w-auto">
          <h1 className="text-3xl font-bold text-slate-800 leading-tight block">Tenants</h1>
          <p className="text-sm text-slate-500 mt-1 block">
            Managing <span className="font-bold text-blue-600">{activeCount}</span> active lease agreements across {rooms.length} properties.
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 w-full md:w-auto">
           {/* Top right badges from screenshot */}
           <div className="flex bg-white shadow-sm border border-slate-100 rounded-full px-4 py-1.5 gap-4">
             <div className="flex items-center gap-2 text-sm">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-slate-600">Active: {activeCount}</span>
             </div>
             <div className="w-px bg-slate-200"></div>
             <div className="flex items-center gap-2 text-sm">
               <div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-slate-600">Notice: {data.length - activeCount}</span>
             </div>
           </div>
           
           <button onClick={openAddModal} className="bg-[#1E40AF] hover:bg-blue-800 text-white px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Plus size={18} /> Add Tenant
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('active')}
          className={`py-3 px-6 font-bold text-sm transition-colors border-b-2 ${activeTab === 'active' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Active Tenants ({activeCount})
        </button>
        <button 
          onClick={() => setActiveTab('inactive')}
          className={`py-3 px-6 font-bold text-sm transition-colors border-b-2 ${activeTab === 'inactive' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Historical / Inactive ({data.length - activeCount})
        </button>
      </div>

      {/* Feature-rich Toolbar exactly like screenshot */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
         <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center px-4 py-2 select-none w-full">
            <Search size={18} className="text-slate-400 mr-3 shrink-0" />
            <input 
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search tenants, units, or lease IDs..."
              className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
            />
         </div>
         <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-100 divide-x divide-slate-100 text-sm overflow-hidden">
            <div className="px-5 py-2 hover:bg-slate-50 cursor-pointer flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Property</span>
              <span className="font-semibold text-slate-700">All Properties ⌄</span>
            </div>
            <div className="px-5 py-2 hover:bg-slate-50 cursor-pointer flex flex-col">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Status</span>
               <span className="font-semibold text-slate-700">All Statuses ⌄</span>
            </div>
         </div>
         <button className="bg-[#E6EEF9] text-blue-700 px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-3 hover:bg-blue-100 transition-colors shadow-sm border border-blue-100">
           <div className="flex flex-col items-start leading-tight">
             <span>Advanced Filters</span>
             <span className="text-[10px] font-normal opacity-70">Arrears, Renewal, Pets...</span>
           </div>
           <SlidersHorizontal size={18} />
         </button>
      </div>

      {/* Tanstack Table rendered identical to Screenshot style */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left bg-white">
            <thead className="bg-slate-50 border-b border-slate-100">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-4 px-6">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                   <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                     No tenants found matching your filters.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Bottom Footer matching screenshot */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div>
             Showing <span className="font-bold text-slate-700">
               {table.getRowModel().rows.length > 0 ? table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 : 0}-
               {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredData.length)}
             </span> of {filteredData.length} results
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 disabled:opacity-50">&lt;</button>
            {table.getPageOptions().map(pageIdx => (
              <button 
                key={pageIdx} 
                onClick={() => table.setPageIndex(pageIdx)}
                className={`w-8 h-8 flex items-center justify-center ${table.getState().pagination.pageIndex === pageIdx ? 'rounded-lg bg-white text-blue-600 font-bold border border-slate-200 shadow-sm' : 'rounded-lg hover:bg-slate-200'}`}
              >
                {pageIdx + 1}
              </button>
            ))}
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 disabled:opacity-50">&gt;</button>
          </div>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{editingUser.id ? 'Edit Tenant' : 'Add New Tenant'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                  <input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-blue-400" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                  <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-blue-400" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone</label>
                  <input type="text" value={editingUser.phone} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-blue-400" required />
                </div>
                {!editingUser.id && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Initial Password</label>
                    <input type="text" value={editingUser.password} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-blue-400" required />
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Lease Join Date</label>
                  <input type="date" value={editingUser.join_date || ''} onChange={e => setEditingUser({...editingUser, join_date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-blue-400" required={!editingUser.id} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assign Seat</label>
                  <select value={editingUser.seat_id || ''} onChange={e => setEditingUser({...editingUser, seat_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-blue-400" >
                    <option value="">-- Unassigned --</option>
                    {seats.map(s => {
                       const r = rooms.find(room => room.id === s.room_id);
                       // We can allow assignment to vacant seats, but normally you'd filter out occupied unless it's their own seat. For simplicity we list all.
                       return <option key={s.id} value={s.id}>{r?.name} - {s.name}</option> 
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                  <select value={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-blue-400" required>
                    <option value="active">Active</option>
                    <option value="inactive">Notice/Inactive</option>
                  </select>
                </div>
                
                {/* File Uploads (Span entire width dynamically) */}
                <div className="col-span-2 grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Profile Pic</label>
                    <input type="file" accept="image/*" onChange={e => setEditingUser({...editingUser, profile_pic: e.target.files[0]})} className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">NID Doc</label>
                    <input type="file" accept="image/*,.pdf" onChange={e => setEditingUser({...editingUser, nid_document: e.target.files[0]})} className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Lease Deed</label>
                    <input type="file" accept="image/*,.pdf" onChange={e => setEditingUser({...editingUser, deed_document: e.target.files[0]})} className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="bg-[#1E40AF] hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">{editingUser.id ? 'Save Changes' : 'Create Tenant'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
