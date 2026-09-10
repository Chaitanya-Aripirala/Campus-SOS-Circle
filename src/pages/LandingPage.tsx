import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import {
  ShieldAlert,
  Radio,
  Sparkles,
  MapPin,
  HeartPulse,
  Flame,
  PhoneCall,
  CheckCircle2,
  Users,
  Lock,
  ArrowRight,
  Shield,
  Activity,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenSOS: () => void;
  onOpenContacts: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onOpenSOS, onOpenContacts }) => {
  const { quickDemoLogin } = useAuth();

  const demoRoles: Array<{ role: Role; title: string; desc: string; icon: any; color: string }> = [
    {
      role: 'Student',
      title: 'Student Portal',
      desc: 'Trigger GPS-enabled SOS, find nearest AEDs & report campus issues.',
      icon: Users,
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-300',
    },
    {
      role: 'Responder',
      title: 'First Responder',
      desc: 'Receive instant proximity dispatch, navigate to scene & resolve alarms.',
      icon: ShieldAlert,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300',
    },
    {
      role: 'Security',
      title: 'Security Command',
      desc: 'Live campus radar, dispatch management & 24/7 helpline monitoring.',
      icon: Activity,
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/40 text-blue-300',
    },
    {
      role: 'Admin',
      title: 'Campus Safety Admin',
      desc: 'Analytics, AI safety insights, email domain policy & campus landmark manager.',
      icon: Shield,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-300',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden bg-slate-950 text-slate-100">
      {/* Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-600/15 via-indigo-600/15 to-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 text-center relative z-10">
        {/* AU Live Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 backdrop-blur-xl mb-6 shadow-xl">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-mono font-bold text-slate-300 tracking-wide">
            Anurag University Live Campus Safety Network
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight sm:leading-none">
          <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            CAMPUS SOS
          </span>{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400 bg-clip-text text-transparent">
            CIRCLE
          </span>
        </h1>

        <p className="mt-4 text-lg sm:text-xl text-slate-300 font-medium max-w-2xl mx-auto">
          One campus. One circle. Help when it matters.
        </p>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Real-time GPS emergency response, smart proximity responder assignment, live Leaflet campus navigation, and Gemini AI-powered safety triage.
        </p>

        {/* Primary Call to Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <button
            onClick={onOpenSOS}
            className="group px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm shadow-2xl shadow-rose-600/40 active:scale-95 transition-all flex items-center space-x-2"
          >
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <span>ACTIVATE EMERGENCY SOS</span>
          </button>

          <button
            onClick={onGetStarted}
            className="px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700/80 shadow-xl active:scale-95 transition-all flex items-center space-x-2"
          >
            <span>Student Sign In / Register</span>
            <ArrowRight className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            onClick={onOpenContacts}
            className="px-5 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-slate-300 font-bold text-sm border border-slate-800 flex items-center space-x-2 transition-all"
          >
            <PhoneCall className="w-4 h-4 text-cyan-400" />
            <span>Emergency Directory</span>
          </button>
        </div>

        {/* Role Testing Sandbox Section */}
        <div className="mt-16 text-left">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span>Instant Role Switcher Sandbox</span>
              </h2>
              <p className="text-xs text-slate-400">
                Click any persona below to immediately log in and explore complete workflows.
              </p>
            </div>
            <span className="hidden sm:inline-block text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-900 text-cyan-400 border border-slate-800">
              Zero-setup Sandbox
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {demoRoles.map((d) => {
              const Icon = d.icon;
              return (
                <button
                  key={d.role}
                  onClick={() => quickDemoLogin(d.role)}
                  className={`p-4 rounded-3xl bg-slate-900/70 border ${d.color} hover:scale-[1.02] active:scale-[0.98] transition-all text-left flex flex-col justify-between group shadow-xl`}
                >
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-black/40 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-sm text-white">{d.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{d.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold">
                    <span>Launch as {d.role}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Architecture & Feature Highlights */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="text-cyan-400 font-extrabold text-lg">3.2 min</div>
            <div className="text-xs text-slate-400 mt-0.5">Average Response Time</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="text-emerald-400 font-extrabold text-lg">100% Real-Time</div>
            <div className="text-xs text-slate-400 mt-0.5">Socket.IO Live Broadcasts</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="text-purple-400 font-extrabold text-lg">Gemini 2.5</div>
            <div className="text-xs text-slate-400 mt-0.5">AI Safety & Incident Triage</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <div className="text-rose-400 font-extrabold text-lg">24/7 Security</div>
            <div className="text-xs text-slate-400 mt-0.5">Ghatkesar Campus Control</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-4 bg-slate-950 text-center text-xs text-slate-500">
        <p>
          Campus SOS Circle • Anurag University, Venkatapur, Ghatkesar, Medchal-Malkajgiri, Hyderabad, Telangana 500088
        </p>
      </footer>
    </div>
  );
};
