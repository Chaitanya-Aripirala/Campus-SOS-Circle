import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Role } from '../types';
import {
  ShieldAlert,
  Radio,
  Volume2,
  VolumeX,
  User as UserIcon,
  LogOut,
  MapPin,
  FileText,
  LayoutDashboard,
  Shield,
  Activity,
  Menu,
  X,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenSOS: () => void;
  onOpenContacts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenSOS, onOpenContacts }) => {
  const { user, isAuthenticated, logout, quickDemoLogin } = useAuth();
  const { isConnected, activeEmergencies, soundEnabled, toggleSound } = useSocket();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);

  const roles: Role[] = ['Student', 'Responder', 'Security', 'Admin'];

  const getRoleBadgeColor = (role?: Role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Security':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Responder':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    }
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('home')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-rose-500 p-[1.5px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
              </div>
              {activeEmergencies.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600 border border-slate-900"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                  CAMPUS SOS CIRCLE
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  AU Live
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
                One campus. One circle. Help when it matters.
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'home'
                  ? 'bg-slate-800/90 text-white shadow-inner border border-slate-700/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('map')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'map'
                  ? 'bg-slate-800/90 text-white shadow-inner border border-slate-700/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <MapPin className="w-4 h-4" />
                <span>Campus Map</span>
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('incidents')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'incidents'
                  ? 'bg-slate-800/90 text-white shadow-inner border border-slate-700/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <FileText className="w-4 h-4" />
                <span>Incidents</span>
              </span>
            </button>

            {user?.role === 'Admin' && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'admin'
                    ? 'bg-purple-950/80 text-purple-200 border border-purple-700/60 shadow-inner'
                    : 'text-purple-300 hover:text-white hover:bg-purple-950/30'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>Admin Hub</span>
                </span>
              </button>
            )}

            {(user?.role === 'Security' || user?.role === 'Admin') && (
              <button
                onClick={() => setCurrentTab('security')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'security'
                    ? 'bg-blue-950/80 text-blue-200 border border-blue-700/60 shadow-inner'
                    : 'text-blue-300 hover:text-white hover:bg-blue-950/30'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>Security Desk</span>
                </span>
              </button>
            )}

            {(user?.role === 'Responder' || user?.role === 'Security' || user?.role === 'Admin') && (
              <button
                onClick={() => setCurrentTab('responder')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentTab === 'responder'
                    ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-700/60 shadow-inner'
                    : 'text-emerald-300 hover:text-white hover:bg-emerald-950/30'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <span>Responder Hub</span>
                </span>
              </button>
            )}
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Live Socket Status indicator */}
            <div
              className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
                isConnected
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                  : 'bg-amber-950/40 border-amber-800/60 text-amber-400'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
              <span>{isConnected ? 'LIVE SYNC' : 'RECONNECTING'}</span>
            </div>

            {/* Audio Siren Mute Toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Emergency Siren Active (Click to Mute)' : 'Muted (Click to Enable)'}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled
                  ? 'bg-slate-900 border-slate-700 text-cyan-400 hover:bg-slate-800'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Quick Emergency Contacts Button */}
            <button
              onClick={onOpenContacts}
              className="px-2.5 py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center space-x-1.5 transition-all"
            >
              <span>Helplines</span>
            </button>

            {/* Emergency SOS Quick Button */}
            <button
              onClick={onOpenSOS}
              className="relative group overflow-hidden px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 active:scale-95 transition-all flex items-center space-x-1.5"
            >
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              <span>SOS</span>
              {activeEmergencies.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-black/40 rounded-full text-[10px]">
                  {activeEmergencies.length}
                </span>
              )}
            </button>

            {/* Demo Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDemoDropdownOpen((prev) => !prev)}
                className="px-2.5 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-950/70 text-cyan-300 text-xs font-semibold flex items-center space-x-1 transition-all"
              >
                <span>Demo: {user?.role || 'Guest'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {demoDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl p-1 z-50 backdrop-blur-2xl">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Role Test
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        quickDemoLogin(r);
                        setDemoDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                        user?.role === r
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{r}</span>
                      {user?.role === r && <span className="text-[10px] text-cyan-400">● Active</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile / Logout */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2 pl-1">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-white truncate max-w-[110px]">{user?.name}</div>
                  <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(user?.role)}`}>
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentTab('login')}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2 backdrop-blur-2xl">
          <button
            onClick={() => {
              setCurrentTab('home');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
          >
            <LayoutDashboard className="w-4 h-4 text-cyan-400" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => {
              setCurrentTab('map');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Campus Map</span>
          </button>
          <button
            onClick={() => {
              setCurrentTab('incidents');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
          >
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Incidents</span>
          </button>

          {user?.role === 'Admin' && (
            <button
              onClick={() => {
                setCurrentTab('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-purple-300 bg-purple-950/40 border border-purple-800/40 flex items-center space-x-2"
            >
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Admin Hub</span>
            </button>
          )}

          {(user?.role === 'Security' || user?.role === 'Admin') && (
            <button
              onClick={() => {
                setCurrentTab('security');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-blue-300 bg-blue-950/40 border border-blue-800/40 flex items-center space-x-2"
            >
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Security Command</span>
            </button>
          )}

          {(user?.role === 'Responder' || user?.role === 'Security' || user?.role === 'Admin') && (
            <button
              onClick={() => {
                setCurrentTab('responder');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 flex items-center space-x-2"
            >
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>Responder Hub</span>
            </button>
          )}

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Audio Siren: {soundEnabled ? 'ON' : 'MUTED'}</span>
            <button
              onClick={toggleSound}
              className="text-xs px-2.5 py-1 rounded bg-slate-800 text-cyan-300 font-medium"
            >
              Toggle Sound
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
