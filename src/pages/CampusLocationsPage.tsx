import React, { useState, useEffect } from 'react';
import { CampusLocation } from '../types';
import { CampusMap } from '../components/CampusMap';
import {
  MapPin,
  Search,
  HeartPulse,
  Shield,
  BookOpen,
  Zap,
  PhoneCall,
  Clock,
  Navigation,
} from 'lucide-react';

export const CampusLocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  useEffect(() => {
    async function loadLocations() {
      try {
        const res = await fetch('/api/locations');
        const data = await res.json();
        if (data.success && Array.isArray(data.locations)) {
          setLocations(data.locations);
        }
      } catch (e) {
        // ignore
      }
    }
    loadLocations();
  }, []);

  const types = ['All', 'Medical', 'Security', 'AED', 'Library', 'Hostel', 'Canteen', 'Lab'];

  const filtered = locations.filter((loc) => {
    const matchesType = selectedType === 'All' || loc.type.toLowerCase() === selectedType.toLowerCase();
    const matchesSearch =
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.description.toLowerCase().includes(search.toLowerCase()) ||
      (loc.building && loc.building.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Anurag University Campus Landmarks & Safety Points</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse automated external defibrillators (AEDs), medical clinics, 24/7 security posts, and facilities.
          </p>
        </div>
      </div>

      {/* Map */}
      <CampusMap height="420px" locations={locations} />

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search AED, building, facility..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedType === t
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Landmark Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((loc) => (
          <div
            key={loc._id}
            className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                    loc.type === 'Medical'
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : loc.type === 'Security'
                      ? 'bg-blue-950 text-blue-300 border-blue-800'
                      : loc.type === 'AED'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-purple-950 text-purple-300 border-purple-800'
                  }`}
                >
                  {loc.type}
                </span>

                {loc.hours && (
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{loc.hours}</span>
                  </span>
                )}
              </div>

              <h3 className="font-extrabold text-sm text-white mt-2">{loc.name}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{loc.description}</p>
              {loc.building && (
                <div className="text-[11px] text-slate-300 mt-2">
                  📍 {loc.building} {loc.floor && `• Floor ${loc.floor}`} {loc.room && `• Room ${loc.room}`}
                </div>
              )}
            </div>

            {loc.contact && (
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 font-bold">{loc.contact}</span>
                <a
                  href={`tel:${loc.contact}`}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>Call</span>
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
