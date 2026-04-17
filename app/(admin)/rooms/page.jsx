"use client";
import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Plus, Building, User, Edit2, Check, X } from 'lucide-react';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newRoomName, setNewRoomName] = useState('');
  const [newSeat, setNewSeat] = useState({ room_id: '', name: '', price: '' });

  // Edit states
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingSeat, setEditingSeat] = useState(null);

  const fetchData = async () => {
    try {
      const [roomsRes, seatsRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/seats')
      ]);
      setRooms(roomsRes.data);
      setSeats(seatsRes.data);
    } catch (err) {
      console.error('Failed to load rooms/seats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      await api.post('/rooms', { name: newRoomName });
      setNewRoomName('');
      fetchData();
    } catch (err) {
      console.error('Failed to create room', err);
    }
  };

  const handleCreateSeat = async (e) => {
    e.preventDefault();
    if (!newSeat.room_id || !newSeat.name || !newSeat.price) return;
    try {
      await api.post('/seats', newSeat);
      setNewSeat({ room_id: newSeat.room_id, name: '', price: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to create seat', err);
    }
  };

  const submitEditRoom = async (roomId) => {
    if (!editingRoom.name.trim()) return setEditingRoom(null);
    try {
      await api.put(`/rooms/${roomId}`, { name: editingRoom.name });
      setEditingRoom(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const submitEditSeat = async (seatId) => {
    if (!editingSeat.name.trim() || !editingSeat.price) return setEditingSeat(null);
    try {
      await api.put(`/seats/${seatId}`, { name: editingSeat.name, price: editingSeat.price });
      setEditingSeat(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-slate-500 p-8">Loading properties...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Rooms & Capacities</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Forms */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Building size={18} className="text-blue-600" /> Add New Room
            </h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Room Name / Label</label>
                <input 
                  type="text" 
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Master Bedroom" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm flex justify-center items-center gap-2 transition-colors">
                <Plus size={16} /> Create Room
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User size={18} className="text-emerald-600" /> Add Seat to Room
            </h2>
            <form onSubmit={handleCreateSeat} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Target Room</label>
                <select 
                  value={newSeat.room_id}
                  onChange={(e) => setNewSeat({...newSeat, room_id: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-400 transition-all"
                  required
                >
                  <option value="" disabled>-- Select a Room --</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Seat Identifier</label>
                  <input 
                    type="text" 
                    value={newSeat.name}
                    onChange={(e) => setNewSeat({...newSeat, name: e.target.value})}
                    placeholder="e.g. Bed A" 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                    required
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Base Price</label>
                  <input 
                    type="number" 
                    value={newSeat.price}
                    onChange={(e) => setNewSeat({...newSeat, price: e.target.value})}
                    placeholder="$2500" 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={rooms.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg text-sm flex justify-center items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Plus size={16} /> Create Seat
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Listing */}
        <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Current Inventory</h2>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {rooms.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                No rooms or seats created yet. Start by creating a room on the left.
              </div>
            ) : (
              rooms.map((room) => {
                const roomSeats = seats.filter(s => s.room_id === room.id);
                return (
                  <div key={room.id} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    {/* Room Header */}
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center group">
                      {editingRoom?.id === room.id ? (
                        <div className="flex items-center gap-2 flex-1 mr-4">
                          <input 
                            type="text" 
                            value={editingRoom.name} 
                            onChange={(e) => setEditingRoom({...editingRoom, name: e.target.value})}
                            className="flex-1 px-2 py-1 text-sm border rounded focus:outline-blue-400"
                            autoFocus
                          />
                          <button onClick={() => submitEditRoom(room.id)} className="p-1 text-emerald-600 bg-emerald-100 rounded hover:bg-emerald-200"><Check size={14} /></button>
                          <button onClick={() => setEditingRoom(null)} className="p-1 text-rose-600 bg-rose-100 rounded hover:bg-rose-200"><X size={14} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{room.name}</span>
                          <button onClick={() => setEditingRoom(room)} className="text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit2 size={14} />
                          </button>
                        </div>
                      )}
                      <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full shrink-0">
                        {roomSeats.length} Seats
                      </span>
                    </div>

                    {/* Room Seats */}
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {roomSeats.length === 0 ? (
                        <span className="text-sm text-slate-400 col-span-full">No seats added to this room yet.</span>
                      ) : (
                        roomSeats.map(seat => (
                          <div key={seat.id} className={`p-3 rounded-xl border flex flex-col justify-between group ${seat.is_occupied ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                            {editingSeat?.id === seat.id ? (
                              <div className="space-y-2">
                                <input 
                                  type="text" 
                                  value={editingSeat.name} 
                                  onChange={(e) => setEditingSeat({...editingSeat, name: e.target.value})}
                                  className="w-full px-2 py-1 text-sm border rounded"
                                />
                                <input 
                                  type="number" 
                                  value={editingSeat.price} 
                                  onChange={(e) => setEditingSeat({...editingSeat, price: e.target.value})}
                                  className="w-full px-2 py-1 text-sm border rounded"
                                />
                                <div className="flex gap-2">
                                  <button onClick={() => submitEditSeat(seat.id)} className="flex-1 py-1 flex justify-center text-emerald-600 bg-emerald-100 rounded"><Check size={14} /></button>
                                  <button onClick={() => setEditingSeat(null)} className="flex-1 py-1 flex justify-center text-rose-600 bg-rose-100 rounded"><X size={14} /></button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-1">
                                    <span className={`font-bold ${seat.is_occupied ? 'text-rose-700' : 'text-emerald-700'}`}>{seat.name}</span>
                                    {!seat.is_occupied && (
                                      <button onClick={() => setEditingSeat(seat)} className="text-emerald-400 hover:text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                  <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${seat.is_occupied ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {seat.is_occupied ? 'Occupied' : 'Vacant'}
                                  </div>
                                </div>
                                <span className={`text-sm font-medium ${seat.is_occupied ? 'text-rose-600/70' : 'text-emerald-600/70'}`}>Base: ${Number(seat.price).toFixed(2)}</span>
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
