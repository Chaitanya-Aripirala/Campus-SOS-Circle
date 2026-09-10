import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Incident } from '../types';
import {
  FileText,
  Search,
  Plus,
  Sparkles,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
} from 'lucide-react';

interface IncidentsPageProps {
  onOpenReportModal: () => void;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({ onOpenReportModal }) => {
  const { token } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const loadIncidents = async () => {
    try {
      const res = await fetch('/api/incidents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.incidents)) {
        setIncidents(data.incidents);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [token]);

  const categories = ['All', 'Security', 'Infrastructure', 'Harassment', 'Cleanliness', 'Medical'];

  const filtered = incidents.filter((inc) => {
    const matchesCat = selectedCategory === 'All' || inc.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesStatus = selectedStatus === 'All' || inc.status === selectedStatus;
    const matchesSearch =
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      inc.description.toLowerCase().includes(search.toLowerCase()) ||
      inc.locationName.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Campus Community Incident Reports</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track and report non-emergency maintenance issues, facility safety, and campus concerns.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Report Incident</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, description, landmark..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((inc) => (
          <div
            key={inc._id}
            className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {inc.category}
                </span>
                <span
                  className={`px-2 py-0.5 rounded ${
                    inc.status === 'RESOLVED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : inc.status === 'IN_PROGRESS'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {inc.status}
                </span>
              </div>

              <h3 className="font-extrabold text-sm text-white">{inc.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-3">{inc.description}</p>

              {inc.aiAnalysis?.summary && (
                <div className="p-2 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-[11px] text-cyan-300 flex items-start space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-cyan-400" />
                  <span>{inc.aiAnalysis.summary}</span>
                </div>
              )}

              {inc.imageUrl && (
                <div className="h-32 w-full rounded-2xl overflow-hidden border border-slate-800 mt-2">
                  <img src={inc.imageUrl} alt={inc.title} className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center space-x-1 truncate max-w-[170px]">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span className="truncate">{inc.locationName}</span>
              </span>
              <span>{new Date(inc.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
