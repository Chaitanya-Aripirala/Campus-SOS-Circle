import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { ResponderDashboard } from './pages/ResponderDashboard';
import { SecurityDashboard } from './pages/SecurityDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { CampusLocationsPage } from './pages/CampusLocationsPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { AuthPage } from './pages/AuthPage';
import { SOSModal } from './components/SOSModal';
import { ReportIncidentModal } from './components/ReportIncidentModal';
import { EmergencyContactsModal } from './components/EmergencyContactsModal';
import { CircleAIChatbot } from './components/CircleAIChatbot';
import { X, ShieldAlert, AlertTriangle, CheckCircle, Info } from 'lucide-react';

// Toast Notification Overlay
const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useSocket();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-start space-x-3 transition-all animate-in slide-in-from-right duration-300 ${
            toast.type === 'emergency'
              ? 'bg-rose-950/90 border-rose-500 text-rose-100 shadow-rose-950/50'
              : toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-100'
              : toast.type === 'warning'
              ? 'bg-amber-950/90 border-amber-500 text-amber-100'
              : 'bg-slate-900/90 border-slate-700 text-slate-100'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {toast.type === 'emergency' && <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />}
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
          </div>
          <div className="flex-1 text-xs">
            <div className="font-extrabold text-sm">{toast.title}</div>
            <div className="mt-0.5 opacity-90 leading-relaxed">{toast.message}</div>
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

// Main App Layout & Switcher
const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 animate-pulse">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="text-xs font-mono font-bold tracking-widest text-cyan-400">
          CAMPUS SOS CIRCLE • INITIALIZING
        </div>
      </div>
    );
  }

  // Render dashboard based on role
  const renderHomeDashboard = () => {
    if (!isAuthenticated || !user) {
      return (
        <LandingPage
          onGetStarted={() => setCurrentTab('login')}
          onOpenSOS={() => setIsSOSOpen(true)}
          onOpenContacts={() => setIsContactsOpen(true)}
        />
      );
    }

    switch (user.role) {
      case 'Admin':
        return <AdminDashboard />;
      case 'Security':
        return <SecurityDashboard />;
      case 'Responder':
        return <ResponderDashboard />;
      case 'Student':
      default:
        return (
          <StudentDashboard
            onOpenSOS={() => setIsSOSOpen(true)}
            onOpenReport={() => setIsReportOpen(true)}
            onOpenContacts={() => setIsContactsOpen(true)}
            onOpenMapTab={() => setCurrentTab('map')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Real-Time Toast Notifications */}
      <ToastContainer />

      {/* Global Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSOS={() => setIsSOSOpen(true)}
        onOpenContacts={() => setIsContactsOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentTab === 'home' && renderHomeDashboard()}
        {currentTab === 'map' && <CampusLocationsPage />}
        {currentTab === 'incidents' && (
          <IncidentsPage onOpenReportModal={() => setIsReportOpen(true)} />
        )}
        {currentTab === 'admin' && <AdminDashboard />}
        {currentTab === 'security' && <SecurityDashboard />}
        {currentTab === 'responder' && <ResponderDashboard />}
        {currentTab === 'login' && <AuthPage onSuccess={() => setCurrentTab('home')} />}
      </main>

      {/* Global Emergency Floating Chatbot */}
      <CircleAIChatbot
        onOpenSOS={() => setIsSOSOpen(true)}
        onOpenMap={() => setCurrentTab('map')}
        onOpenContacts={() => setIsContactsOpen(true)}
      />

      {/* Modals */}
      <SOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        onSOSCreated={(newSOS) => {
          setCurrentTab('home');
        }}
      />

      <ReportIncidentModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onIncidentReported={() => {
          setCurrentTab('incidents');
        }}
      />

      <EmergencyContactsModal
        isOpen={isContactsOpen}
        onClose={() => setIsContactsOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
