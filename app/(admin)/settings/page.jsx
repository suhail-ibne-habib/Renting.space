"use client";
import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';
import { Settings as SettingsIcon, Save } from 'lucide-react';

export default function SettingsPage() {
  const [softwareName, setSoftwareName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(res => {
      if (res.data && res.data.software_name) {
        setSoftwareName(res.data.software_name);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', { key: 'software_name', value: softwareName });
      alert("Settings saved successfully! Please refresh the page to see changes in the sidebar.");
    } catch (err) {
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 leading-tight flex items-center gap-3">
             <SettingsIcon size={28} className="text-slate-600" /> System Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Global configurations and white-label preferences.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8">
           <form onSubmit={handleSave} className="space-y-6">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Software Name (White-label)</label>
               <input 
                 type="text" 
                 value={softwareName} 
                 onChange={e => setSoftwareName(e.target.value)} 
                 placeholder="e.g. Skyview Residences"
                 className="w-full md:w-1/2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-blue-400 focus:bg-white transition-colors" 
                 required 
               />
               <p className="text-xs text-slate-400 mt-2">This name appears in the top-left sidebar and is used throughout the application.</p>
             </div>

             <div className="pt-4 border-t border-slate-100">
               <button 
                 type="submit" 
                 disabled={saving}
                 className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70"
               >
                 <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
               </button>
             </div>
           </form>
        </div>
      </div>
    </div>
  );
}
