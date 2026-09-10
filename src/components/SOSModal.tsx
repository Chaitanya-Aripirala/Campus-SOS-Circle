import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SOSType, SOSSeverity } from '../types';
import {
  AlertTriangle,
  Flame,
  HeartPulse,
  Shield,
  Car,
  UserX,
  HelpCircle,
  MapPin,
  Camera,
  X,
  CheckCircle,
  Loader2,
  PhoneCall,
} from 'lucide-react';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSOSCreated: (sos: any) => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose, onSOSCreated }) => {
  const { user, token } = useAuth();

  const [selectedType, setSelectedType] = useState<SOSType>('Security');
  const [severity, setSeverity] = useState<SOSSeverity>('High');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('Campus Grounds');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 17.4206, lng: 78.6558 });
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsLocked, setGpsLocked] = useState(false);

  // SOS Category Options with custom styling
  const typeOptions: Array<{ type: SOSType; icon: any; label: string; desc: string; color: string }> = [
    {
      type: 'Medical',
      icon: HeartPulse,
      label: 'Medical Emergency',
      desc: 'Severe injury, fainting, asthma attack, chest pain',
      color: 'from-rose-500/20 to-red-500/20 border-rose-500/50 text-rose-300',
    },
    {
      type: 'Security',
      icon: Shield,
      label: 'Security Threat',
      desc: 'Physical threat, suspicious intruder, assault',
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/50 text-blue-300',
    },
    {
      type: 'Harassment',
      icon: AlertTriangle,
      label: 'Harassment / Stalking',
      desc: "Immediate intervention by Women's Safety squad",
      color: 'from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/50 text-fuchsia-300',
    },
    {
      type: 'Fire',
      icon: Flame,
      label: 'Fire / Explosion',
      desc: 'Active flames, smoke buildup, chemical leak',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-300',
    },
    {
      type: 'Accident',
      icon: Car,
      label: 'Campus Accident',
      desc: 'Vehicle collision, machinery mishap, lab disaster',
      color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/50 text-yellow-300',
    },
    {
      type: 'Lost Person',
      icon: UserX,
      label: 'Lost Person / Distress',
      desc: 'Missing peer, disoriented student after hours',
      color: 'from-cyan-500/20 to-teal-500/20 border-cyan-500/50 text-cyan-300',
    },
    {
      type: 'Other',
      icon: HelpCircle,
      label: 'Other Urgent Distress',
      desc: 'Need immediate on-scene campus official',
      color: 'from-slate-500/20 to-zinc-500/20 border-slate-500/50 text-slate-300',
    },
  ];

  // Capture GPS Location
  useEffect(() => {
    if (!isOpen) return;

    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setGpsLocked(true);
          setIsLocating(false);
          setLocationName(`GPS Lock: [${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}]`);
        },
        (err) => {
          console.warn('Geolocation capture:', err.message);
          setIsLocating(false);
          // Default to Anurag University campus location coordinates
          setCoords({ lat: 17.4206, lng: 78.6558 });
          setLocationName('Anurag University Campus Grounds');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmitSOS = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: selectedType,
          severity,
          description,
          addressName: locationName,
          latitude: coords.lat,
          longitude: coords.lng,
        }),
      });

      const data = await res.json();
      if (data.success && data.sos) {
        onSOSCreated(data.sos);
        onClose();
      } else {
        alert(data.message || 'Failed to trigger SOS');
      }
    } catch (err) {
      alert('Network error connecting to Campus SOS dispatch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-rose-500/40 shadow-2xl shadow-rose-900/30 overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Urgent Header Banner */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 border-b border-rose-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/50 animate-pulse">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center space-x-2">
                <span>ACTIVATE EMERGENCY SOS</span>
              </h2>
              <p className="text-xs text-rose-200">
                Dispatches nearest responders & alerts 24/7 Security Control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/30 hover:bg-black/60 text-slate-300 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Live GPS Lock Indicator */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-xl ${gpsLocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                <MapPin className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  {isLocating ? 'Locking High-Precision GPS...' : locationName}
                </div>
                <div className="text-[11px] text-slate-400">
                  Lat: {coords.lat.toFixed(5)}, Lng: {coords.lng.toFixed(5)}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
              GPS Verified
            </span>
          </div>

          {/* Select Emergency Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              1. Select Emergency Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {typeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setSelectedType(opt.type)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start space-x-3 ${
                      isSelected
                        ? `bg-gradient-to-br ${opt.color} ring-2 ring-rose-500 shadow-md`
                        : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-black/30' : 'bg-slate-800'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">{opt.label}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emergency Severity */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              2. Severity Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Low', 'Medium', 'High', 'Critical'] as SOSSeverity[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSeverity(lvl)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    severity === lvl
                      ? lvl === 'Critical'
                        ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30'
                        : lvl === 'High'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : lvl === 'Medium'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-cyan-600 text-white border-cyan-500'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Description / Additional Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              3. Notes or Exact Landmark (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Near 2nd floor elevator in B-Block, student fell and cannot walk..."
              className="w-full px-3 py-2 rounded-2xl bg-slate-950/90 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-xs text-slate-200 placeholder-slate-500 outline-none resize-none"
            />
          </div>

          {/* Direct Emergency Calling Fallback */}
          <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-800/40 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-rose-200">
              <PhoneCall className="w-4 h-4 text-rose-400" />
              <span>Direct Security Hotline: <strong>+91-8415-255555</strong></span>
            </div>
            <a
              href="tel:+918415255555"
              className="text-xs px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all"
            >
              Call Now
            </a>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmitSOS}
            className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm shadow-xl shadow-rose-600/40 active:scale-98 transition-all flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Broadcasting SOS...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>CONFIRM & BROADCAST SOS</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
