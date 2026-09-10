import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { SOSRequest, SOSStatus } from '../types';
import { CampusMap } from '../components/CampusMap';
import {
  ShieldAlert,
  PhoneCall,
  Navigation,
  CheckCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  Flame,
  HeartPulse,
  Activity,
  ArrowRight,
  Radio,
} from 'lucide-react';

export const ResponderDashboard: React.FC = () => {
  const { user, token, updateUser } = useAuth();
  const { activeEmergencies, refreshActiveSOS } = useSocket();

  const [isAvailable, setIsAvailable] = useState<boolean>(user?.isAvailable ?? true);
  const [activeSOS, setActiveSOS] = useState<SOSRequest[]>([]);
  const [claimedSOS, setClaimedSOS] = useState<SOSRequest | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setActiveSOS(activeEmergencies);
    if (user) {
      const myClaimed = activeEmergencies.find((s) => s.assignedResponder?.id === user._id);
      setClaimedSOS(myClaimed || null);
    }
  }, [activeEmergencies, user]);

  const toggleAvailability = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    try {
      await fetch('/api/users/availability', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: nextState }),
      });
      updateUser({ isAvailable: nextState });
    } catch (e) {
      setIsAvailable(!nextState);
    }
  };

  const handleClaimSOS = async (sosId: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/sos/${sosId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.sos) {
        setClaimedSOS(data.sos);
        refreshActiveSOS();
      } else {
        alert(data.message || 'Failed to claim SOS');
      }
    } catch (e) {
      alert('Network error claiming SOS');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (status: SOSStatus, note?: string) => {
    if (!claimedSOS) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/sos/${claimedSOS._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          note: note || `Status advanced to ${status} by responder ${user?.name}`,
        }),
      });
      const data = await res.json();
      if (data.success && data.sos) {
        if (status === 'RESOLVED' || status === 'CANCELLED') {
          setClaimedSOS(null);
          setResolutionNote('');
        } else {
          setClaimedSOS(data.sos);
        }
        refreshActiveSOS();
      }
    } catch (e) {
      alert('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      {/* Responder Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Campus First Responder Dispatch
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Officer {user?.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Unit: <span className="text-slate-200">{user?.department || 'Rapid Emergency Response'}</span> •{' '}
            Phone: <span className="font-mono text-cyan-300">{user?.phone || '+91-8415-255555'}</span>
          </p>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center space-x-3 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
          <div className="text-right">
            <div className="text-xs font-bold text-white">Duty Status</div>
            <div className={`text-[11px] font-mono ${isAvailable ? 'text-emerald-400' : 'text-slate-500'}`}>
              {isAvailable ? 'AVAILABLE FOR DISPATCH' : 'OFF DUTY'}
            </div>
          </div>
          <button
            onClick={toggleAvailability}
            className={`w-14 h-8 rounded-full p-1 transition-colors ${
              isAvailable ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                isAvailable ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ACTIVE CLAIMED DISPATCH COMMAND UNIT (If responder currently accepted an SOS) */}
      {claimedSOS && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border-2 border-rose-500/60 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-rose-800/60">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/50 animate-pulse">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  ASSIGNED DISPATCH IN PROGRESS
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {claimedSOS.type.toUpperCase()}: {claimedSOS.userName}
                </h3>
                <p className="text-xs text-slate-300">
                  Location: <strong className="text-white">{claimedSOS.location?.addressName || 'Campus Grounds'}</strong>
                </p>
              </div>
            </div>

            {/* Direct Call Student Button */}
            {claimedSOS.userPhone && (
              <a
                href={`tel:${claimedSOS.userPhone}`}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-md shadow-cyan-500/20"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Student ({claimedSOS.userPhone})</span>
              </a>
            )}
          </div>

          {/* Stepper Progress Controls for Responder */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <button
              onClick={() => handleUpdateStatus('RESPONDER_ON_THE_WAY')}
              disabled={isUpdating || claimedSOS.status === 'RESPONDER_ON_THE_WAY'}
              className={`p-3 rounded-2xl text-xs font-bold border transition-all ${
                claimedSOS.status === 'RESPONDER_ON_THE_WAY'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              1. On The Way
            </button>

            <button
              onClick={() => handleUpdateStatus('ARRIVED')}
              disabled={isUpdating || claimedSOS.status === 'ARRIVED'}
              className={`p-3 rounded-2xl text-xs font-bold border transition-all ${
                claimedSOS.status === 'ARRIVED'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-600/30'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              2. Mark Arrived
            </button>

            <button
              onClick={() => {
                const notes = prompt('Enter resolution report / action taken:', 'Student attended, first aid administered, situation safe.');
                if (notes) handleUpdateStatus('RESOLVED', notes);
              }}
              disabled={isUpdating}
              className="p-3 rounded-2xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-slate-950 border border-emerald-400 shadow-lg shadow-emerald-600/30 transition-all col-span-2 sm:col-span-2 flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>3. Resolve Emergency</span>
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE EMERGENCY BROADCAST FEED */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>Active Campus Emergency Dispatches ({activeSOS.length})</span>
          </h2>
          <button
            onClick={refreshActiveSOS}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-bold"
          >
            Refresh Feed
          </button>
        </div>

        {activeSOS.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-500 space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-500/50 mx-auto" />
            <p className="font-bold text-slate-400">All quiet across Anurag University campus.</p>
            <p>No active emergency SOS signals at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSOS.map((sos) => {
              const isClaimedByMe = sos.assignedResponder?.id === user?._id;
              return (
                <div
                  key={sos._id}
                  className={`p-5 rounded-3xl border transition-all space-y-3 ${
                    isClaimedByMe
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-xl shadow-rose-900/10'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-white">{sos.type}</span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                            {sos.severity}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Student: <strong className="text-slate-200">{sos.userName}</strong> ({sos.userRollNumber || 'AU'})
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-cyan-400 font-bold">
                      {new Date(sos.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                    <div className="font-bold text-slate-200">📍 {sos.location?.addressName || 'Campus Zone'}</div>
                    {sos.description && <p className="mt-1 text-slate-400 italic">"{sos.description}"</p>}
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      Status: <span className="font-bold text-cyan-400">{sos.status}</span>
                    </div>

                    {!claimedSOS && sos.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleClaimSOS(sos._id)}
                        disabled={isUpdating}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1"
                      >
                        <span>Accept Dispatch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Radar Map */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
          <Navigation className="w-4 h-4 text-cyan-400" />
          <span>Live Campus Responder Radar</span>
        </h2>
        <CampusMap height="360px" activeSOSList={activeSOS} />
      </div>
    </div>
  );
};
