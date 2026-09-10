import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { CampusLocation, Incident, SOSRequest } from '../types';
import { SOSStatusTracker } from '../components/SOSStatusTracker';
import { CampusMap } from '../components/CampusMap';
import {
  ShieldAlert,
  MapPin,
  FileText,
  PhoneCall,
  Sparkles,
  HeartPulse,
  BookOpen,
  Shield,
  Zap,
  Navigation,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface StudentDashboardProps {
  onOpenSOS: () => void;
  onOpenReport: () => void;
  onOpenContacts: () => void;
  onOpenMapTab: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onOpenSOS,
  onOpenReport,
  onOpenContacts,
  onOpenMapTab,
}) => {
  const { user, token } = useAuth();
  const { activeEmergencies, refreshActiveSOS } = useSocket();

  const [nearbyLocations, setNearbyLocations] = useState<CampusLocation[]>([]);
  const [myIncidents, setMyIncidents] = useState<Incident[]>([]);
  const [myActiveSOS, setMyActiveSOS] = useState<SOSRequest | null>(null);

  // Check if student has an active emergency
  useEffect(() => {
    if (user && activeEmergencies.length > 0) {
      const active = activeEmergencies.find((s) => s.userId === user._id || s.userEmail === user.email);
      setMyActiveSOS(active || null);
    } else {
      setMyActiveSOS(null);
    }
  }, [user, activeEmergencies]);

  // Fetch nearby facilities and student's recent incidents
  useEffect(() => {
    async function loadStudentData() {
      try {
        const [locRes, incRes] = await Promise.all([
          fetch('/api/locations/nearby?lat=17.4206&lng=78.6558&maxDistance=3000'),
          fetch('/api/incidents/my', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const locData = await locRes.json();
        if (locData.success && Array.isArray(locData.nearbyLocations)) {
          setNearbyLocations(locData.nearbyLocations.slice(0, 4));
        }

        const incData = await incRes.json();
        if (incData.success && Array.isArray(incData.incidents)) {
          setMyIncidents(incData.incidents.slice(0, 3));
        }
      } catch (e) {
        // ignore
      }
    }

    loadStudentData();
  }, [token]);

  const handleCancelSOS = async (sosId: string) => {
    if (!confirm('Are you sure you want to cancel this emergency request?')) return;
    try {
      const res = await fetch(`/api/sos/${sosId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'CANCELLED', note: 'Cancelled by student (false alarm/safe)' }),
      });
      const data = await res.json();
      if (data.success) {
        refreshActiveSOS();
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      {/* Student Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              Anurag University • Student Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Hello, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Roll No: <span className="font-mono text-cyan-300">{user?.rollNumber || '23EG105A50'}</span> •{' '}
            Dept: <span className="text-slate-300">{user?.department || 'Computer Science'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenContacts}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all shadow-md"
          >
            <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
            <span>Emergency Directory</span>
          </button>
          <button
            onClick={onOpenReport}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/30"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* ACTIVE SOS STATUS BANNER (Shown if student currently has an active emergency) */}
      {myActiveSOS && (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <div className="mb-2 text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>LIVE EMERGENCY IN PROGRESS</span>
          </div>
          <SOSStatusTracker sos={myActiveSOS} onCancelSOS={handleCancelSOS} />
        </div>
      )}

      {/* TACTILE 3D EMERGENCY SOS BUTTON SECTION */}
      {!myActiveSOS && (
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900 to-rose-950/20 border border-slate-800/90 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
          {/* Pulsing Background Radar */}
          <div className="absolute w-[360px] h-[360px] rounded-full bg-rose-600/10 blur-2xl pointer-events-none animate-pulse" />

          <span className="text-xs font-mono font-extrabold text-rose-400 uppercase tracking-widest px-3 py-1 rounded-full bg-rose-950/60 border border-rose-800/60 mb-6">
            Instant 1-Tap Emergency Response
          </span>

          {/* Big Tactile SOS Button */}
          <button
            onClick={onOpenSOS}
            className="group relative flex items-center justify-center w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr from-rose-700 via-red-600 to-rose-500 hover:from-rose-600 hover:to-red-500 shadow-2xl shadow-rose-600/50 hover:shadow-rose-600/70 border-4 border-rose-400/40 active:scale-95 transition-all cursor-pointer"
          >
            {/* Pulsing Ring Effects */}
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-40"></span>

            <div className="flex flex-col items-center justify-center z-10 text-white">
              <ShieldAlert className="w-12 h-12 sm:w-14 sm:h-14 group-hover:scale-110 transition-transform" />
              <span className="text-2xl sm:text-3xl font-black tracking-wider mt-1">SOS</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-200">
                Tap for Help
              </span>
            </div>
          </button>

          <p className="mt-6 text-xs text-slate-400 max-w-md">
            Broadcasts your GPS position to on-duty campus responders, medical team, and Ghatkesar campus security control.
          </p>
        </div>
      )}

      {/* TWO COLUMN GRID: Nearest Facilities & Campus Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nearest Campus Safety Landmarks (1 Col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Nearest Campus Facilities</span>
            </h2>
            <button
              onClick={onOpenMapTab}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {nearbyLocations.map((loc) => (
              <div
                key={loc._id}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                      loc.type === 'Medical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : loc.type === 'Security'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : loc.type === 'AED'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {loc.type === 'Medical' && <HeartPulse className="w-4 h-4" />}
                    {loc.type === 'Security' && <Shield className="w-4 h-4" />}
                    {loc.type === 'AED' && <Zap className="w-4 h-4" />}
                    {loc.type === 'Library' && <BookOpen className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white truncate max-w-[160px]">
                      {loc.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {loc.building || 'Campus Zone'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-cyan-400">
                    {loc.distanceFormatted || 'Nearby'}
                  </div>
                  {loc.contact && (
                    <a
                      href={`tel:${loc.contact}`}
                      className="text-[10px] text-slate-400 hover:text-white"
                    >
                      Call
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Embedded Interactive Map Preview (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>Campus Live Radar Map</span>
            </h2>
            <button
              onClick={onOpenMapTab}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold"
            >
              Full Screen Map →
            </button>
          </div>

          <CampusMap height="340px" locations={nearbyLocations} activeSOSList={activeEmergencies} />
        </div>
      </div>

      {/* RECENT SUBMITTED COMMUNITY INCIDENTS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>My Submitted Campus Reports</span>
          </h2>
          <button
            onClick={onOpenReport}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
          >
            + New Report
          </button>
        </div>

        {myIncidents.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-500">
            You have not submitted any non-emergency maintenance or safety reports.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {myIncidents.map((inc) => (
              <div
                key={inc._id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                    {inc.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded ${
                      inc.status === 'RESOLVED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {inc.status}
                  </span>
                </div>
                <h3 className="font-extrabold text-xs text-white truncate">{inc.title}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">{inc.description}</p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                  <span>📍 {inc.locationName}</span>
                  <span>{new Date(inc.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
