import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SOSRequest, SOSStatus } from '../types';
import {
  ShieldAlert,
  Clock,
  UserCheck,
  Navigation,
  MapPin,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Activity,
  AlertCircle,
} from 'lucide-react';

interface SOSStatusTrackerProps {
  sos: SOSRequest;
  onCancelSOS?: (sosId: string) => void;
  onClose?: () => void;
}

const STEPS: Array<{ key: SOSStatus; label: string; sub: string }> = [
  { key: 'PENDING', label: 'SOS Received', sub: 'GPS coordinates locked & beacon sent' },
  { key: 'ACKNOWLEDGED', label: 'Security Alerted', sub: 'Central control acknowledged alert' },
  { key: 'ASSIGNED', label: 'Responder Assigned', sub: 'Nearest unit dispatched' },
  { key: 'RESPONDER_ON_THE_WAY', label: 'Help is on the Way', sub: 'Responder rushing to your scene' },
  { key: 'ARRIVED', label: 'Responder Arrived', sub: 'Assistance on site' },
  { key: 'RESOLVED', label: 'Resolved & Safe', sub: 'Emergency resolved successfully' },
];

export const SOSStatusTracker: React.FC<SOSStatusTrackerProps> = ({ sos, onCancelSOS, onClose }) => {
  const currentStepIndex = STEPS.findIndex((s) => s.key === sos.status);

  // Trigger confetti when resolved
  useEffect(() => {
    if (sos.status === 'RESOLVED') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // non-blocking
      }
    }
  }, [sos.status]);

  const isCancelled = sos.status === 'CANCELLED';

  return (
    <div className="relative rounded-3xl bg-slate-900/90 border border-slate-700/80 p-5 sm:p-6 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Background radial glow based on status */}
      <div
        className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 ${
          sos.status === 'RESOLVED'
            ? 'bg-emerald-500'
            : sos.status === 'CANCELLED'
            ? 'bg-slate-500'
            : 'bg-rose-500'
        }`}
      />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
              sos.status === 'RESOLVED'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : isCancelled
                ? 'bg-slate-800 text-slate-400'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
            }`}
          >
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-base text-white">
                Active SOS: {sos.type.toUpperCase()}
              </h3>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  sos.status === 'RESOLVED'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : isCancelled
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                }`}
              >
                {sos.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Triggered: {new Date(sos.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
              {sos.location?.addressName || 'Campus'}
            </p>
          </div>
        </div>

        {/* Cancel Action if not yet resolved */}
        {sos.status !== 'RESOLVED' && !isCancelled && onCancelSOS && (
          <button
            onClick={() => onCancelSOS(sos._id)}
            className="px-3 py-1.5 rounded-xl border border-slate-700 hover:border-rose-500/60 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-all"
          >
            Cancel Alarm
          </button>
        )}
      </div>

      {/* Assigned Responder Spotlight Card */}
      {sos.assignedResponder && (
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider">
                Assigned First Responder
              </div>
              <div className="text-sm font-bold text-white">{sos.assignedResponder.name}</div>
              <div className="text-xs text-slate-400">
                {sos.assignedResponder.role} • {sos.assignedResponder.distanceMeters ? `Approx ${sos.assignedResponder.distanceMeters}m away` : 'On Campus'}
              </div>
            </div>
          </div>
          {sos.assignedResponder.phone && (
            <a
              href={`tel:${sos.assignedResponder.phone}`}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-cyan-500/20 transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Responder</span>
            </a>
          )}
        </div>
      )}

      {/* Animated Vertical Stepper */}
      <div className="my-5 space-y-4">
        {STEPS.map((step, idx) => {
          const isDone = currentStepIndex > idx;
          const isCurrent = currentStepIndex === idx;
          const isPending = currentStepIndex < idx;

          return (
            <div key={step.key} className="flex items-start space-x-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                      : isCurrent
                      ? 'bg-rose-500 text-white ring-4 ring-rose-500/30 animate-pulse'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Activity className="w-3.5 h-3.5" />
                  ) : (
                    idx + 1
                  )}
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`w-0.5 h-6 my-1 transition-colors ${
                      isDone ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
              <div className="pt-0.5">
                <div
                  className={`text-xs font-bold ${
                    isDone
                      ? 'text-slate-200'
                      : isCurrent
                      ? 'text-rose-400 text-sm'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </div>
                <div className="text-[11px] text-slate-400">{step.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resolution Notes if Resolved */}
      {sos.status === 'RESOLVED' && sos.resolutionNotes && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200">
          <span className="font-bold">Resolution Report:</span> {sos.resolutionNotes}
        </div>
      )}
    </div>
  );
};
