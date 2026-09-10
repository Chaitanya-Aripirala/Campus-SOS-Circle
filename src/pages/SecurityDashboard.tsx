import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { SOSRequest, Incident, User } from '../types';
import { CampusMap } from '../components/CampusMap';
import {
  Activity,
  ShieldAlert,
  Users,
  Radio,
  FileText,
  CheckCircle,
  PhoneCall,
  Clock,
  Filter,
  Sparkles,
  MapPin,
  RefreshCw,
} from 'lucide-react';

export const SecurityDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const { activeEmergencies, refreshActiveSOS } = useSocket();

  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [responders, setResponders] = useState<User[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [incidentSummary, setIncidentSummary] = useState<string>('');
  const [summarizing, setSummarizing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const loadData = async () => {
    try {
      const [incRes, userRes] = await Promise.all([
        fetch('/api/incidents', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const incData = await incRes.json();
      if (incData.success) setAllIncidents(incData.incidents || []);

      const userData = await userRes.json();
      if (userData.success && Array.isArray(userData.users)) {
        setResponders(userData.users.filter((u: User) => u.role === 'Responder' || u.role === 'Security'));
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleUpdateIncidentStatus = async (id: string, status: string) => {
    const notes = prompt(`Enter resolution / update notes for status: ${status}`, 'Verified by Security Desk');
    try {
      const res = await fetch(`/api/incidents/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, notes }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch (e) {
      alert('Failed to update incident');
    }
  };

  const handleGenerateSummary = async (text: string) => {
    setSummarizing(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reportText: text }),
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setIncidentSummary(data.summary);
      }
    } catch (e) {
      // ignore
    } finally {
      setSummarizing(false);
    }
  };

  const filteredIncidents = allIncidents.filter((i) => {
    if (filterCategory === 'All') return true;
    return i.category.toLowerCase() === filterCategory.toLowerCase();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      {/* Command Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
              Central Security Command Center • Main Gate 1
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Campus Dispatch & Security Desk
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Officer on duty: <span className="font-bold text-slate-200">{user?.name}</span> • Active Emergency Link
          </p>
        </div>

        <button
          onClick={() => {
            refreshActiveSOS();
            loadData();
          }}
          className="px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center space-x-2 transition-all shadow-md self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Refresh Feeds</span>
        </button>
      </div>

      {/* EMERGENCY SOS ALERT BOARD */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
            <span>Active Emergency SOS Signals ({activeEmergencies.length})</span>
          </h2>
          <span className="text-xs text-slate-400">Audible Siren Active</span>
        </div>

        {activeEmergencies.length === 0 ? (
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>No active emergency alarms. Campus zones secure.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeEmergencies.map((sos) => (
              <div
                key={sos._id}
                className="p-5 rounded-3xl bg-gradient-to-r from-rose-950/30 to-slate-900 border border-rose-500/50 shadow-xl space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                      {sos.severity} • {sos.type}
                    </span>
                    <h3 className="text-base font-black text-white mt-1">{sos.userName}</h3>
                    <p className="text-xs text-slate-300">
                      Roll: <span className="font-mono text-cyan-300">{sos.userRollNumber || 'Student'}</span> • Phone: {sos.userPhone || 'N/A'}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-400">
                    {new Date(sos.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-xs text-slate-300 bg-black/40 p-3 rounded-2xl">
                  📍 <strong>{sos.location?.addressName || 'Campus'}</strong>
                  {sos.description && <p className="mt-1 text-slate-400">"{sos.description}"</p>}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="text-xs">
                    Assigned: <strong className="text-cyan-400">{sos.assignedResponder?.name || 'Searching nearby...'}</strong>
                  </div>
                  {sos.userPhone && (
                    <a
                      href={`tel:${sos.userPhone}`}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Call</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TWO COLUMNS: Campus Radar Map & Responder Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Map (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Central Campus Live Dispatch Radar</span>
          </h2>
          <CampusMap height="360px" activeSOSList={activeEmergencies} responders={responders} />
        </div>

        {/* Responder Roster (1 Col) */}
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Active Responder Roster ({responders.length})</span>
          </h2>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {responders.map((r) => (
              <div
                key={r._id}
                className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white flex items-center space-x-1.5">
                    <span>{r.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
                      {r.role}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{r.department || 'Security'}</div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.isAvailable
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {r.isAvailable ? 'AVAILABLE' : 'OFFLINE'}
                  </span>
                  {r.phone && (
                    <div className="text-[10px] font-mono text-slate-400 mt-1">{r.phone}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COMMUNITY INCIDENT TRIAGE QUEUE */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Community Incidents Queue ({filteredIncidents.length})</span>
          </h2>

          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {['All', 'Security', 'Infrastructure', 'Harassment', 'Medical'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-xl font-semibold transition-all ${
                  filterCategory === cat
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIncidents.map((inc) => (
            <div
              key={inc._id}
              className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {inc.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded ${
                      inc.priority === 'Urgent'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : inc.priority === 'High'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {inc.priority} Priority
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-white">{inc.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-3">{inc.description}</p>
                <div className="text-[11px] text-slate-500">📍 {inc.locationName}</div>

                {/* AI Analysis Tag */}
                {inc.aiAnalysis?.summary && (
                  <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-200">
                    <span className="font-bold flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>AI Triage:</span>
                    </span>
                    <span className="text-slate-300">{inc.aiAnalysis.summary}</span>
                  </div>
                )}
              </div>

              {/* Status Update Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-slate-400">
                  Status: <strong>{inc.status}</strong>
                </span>

                <div className="flex items-center space-x-1.5">
                  {inc.status !== 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateIncidentStatus(inc._id, 'IN_PROGRESS')}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold"
                    >
                      In Progress
                    </button>
                  )}
                  {inc.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateIncidentStatus(inc._id, 'RESOLVED')}
                      className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
