import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CampusLocation, DashboardMetrics, SystemSettings, User } from '../types';
import { CampusMap } from '../components/CampusMap';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Shield,
  Activity,
  Users,
  MapPin,
  Settings,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  FileText,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Lock,
  Radio,
  Clock,
  Mail,
  UserPlus,
  ShieldAlert,
} from 'lucide-react';

const CHART_COLORS = ['#06b6d4', '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];

export const AdminDashboard: React.FC = () => {
  const { token, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'analytics' | 'locations' | 'emailPolicy' | 'users' | 'aiInsights'>('analytics');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [sosTypeData, setSosTypeData] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [locations, setLocations] = useState<CampusLocation[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [registrationAttempts, setRegistrationAttempts] = useState<any[]>([]);

  // AI Insights State
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  // New Location Form State
  const [newLocName, setNewLocName] = useState('');
  const [newLocType, setNewLocType] = useState('Medical');
  const [newLocDesc, setNewLocDesc] = useState('');
  const [newLocLat, setNewLocLat] = useState(17.4206);
  const [newLocLng, setNewLocLng] = useState(78.6558);
  const [newLocBuilding, setNewLocBuilding] = useState('');
  const [newLocContact, setNewLocContact] = useState('+91-8415-255555');

  // New User Form State (Admin creates responder/security)
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Responder' | 'Security' | 'Admin'>('Responder');
  const [newUserPhone, setNewUserPhone] = useState('+91-8415-255555');

  // Email policy update state
  const [policyDomain, setPolicyDomain] = useState('anurag.edu.in');
  const [policyPattern, setPolicyPattern] = useState('{rollNumber}@anurag.edu.in');
  const [policyRegex, setPolicyRegex] = useState('^[0-9]{2}[a-z]{2}[0-9]{3}[a-z0-9]{3}@anurag\\.edu\\.in$');
  const [policySelfReg, setPolicySelfReg] = useState(true);

  const loadAllAdminData = async () => {
    try {
      const [metricsRes, locRes, usersRes, settingsRes, attemptsRes] = await Promise.all([
        fetch('/api/analytics/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/locations'),
        fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/settings'),
        fetch('/api/settings/attempts', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const metricsData = await metricsRes.json();
      if (metricsData.success) {
        setMetrics(metricsData.metrics);
        setAuditLogs(metricsData.recentAuditLogs || []);

        // Format charts
        if (metricsData.categoryStats) {
          const catArray = Object.entries(metricsData.categoryStats).map(([name, value]) => ({ name, value }));
          setCategoryData(catArray);
        }
        if (metricsData.sosTypeStats) {
          const sosArray = Object.entries(metricsData.sosTypeStats).map(([name, value]) => ({ name, value }));
          setSosTypeData(sosArray);
        }
      }

      const locData = await locRes.json();
      if (locData.success) setLocations(locData.locations || []);

      const userData = await usersRes.json();
      if (userData.success) setAllUsers(userData.users || []);

      const settsData = await settingsRes.json();
      if (settsData.success && settsData.settings) {
        setSettings(settsData.settings);
        setPolicyDomain(settsData.settings.studentEmailDomain || 'anurag.edu.in');
        setPolicyPattern(settsData.settings.studentEmailPattern || '{rollNumber}@anurag.edu.in');
        setPolicyRegex(settsData.settings.studentEmailRegex || '^[0-9]{2}[a-z]{2}[0-9]{3}[a-z0-9]{3}@anurag\\.edu\\.in$');
        setPolicySelfReg(settsData.settings.allowSelfRegistration ?? true);
      }

      const attemptsData = await attemptsRes.json();
      if (attemptsData.success) setRegistrationAttempts(attemptsData.attempts || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, [token]);

  const handleGenerateAIInsights = async () => {
    setGeneratingInsights(true);
    try {
      const res = await fetch('/api/ai/insights', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.insights) {
        setAiInsights(data.insights);
      }
    } catch (e) {
      alert('Failed to generate insights');
    } finally {
      setGeneratingInsights(false);
    }
  };

  const handleSaveEmailPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentEmailDomain: policyDomain,
          studentEmailPattern: policyPattern,
          studentEmailRegex: policyRegex,
          allowSelfRegistration: policySelfReg,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Student email policy & registration rules updated successfully!');
        loadAllAdminData();
      }
    } catch (e) {
      alert('Failed to update email settings');
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newLocName,
          type: newLocType,
          description: newLocDesc,
          latitude: newLocLat,
          longitude: newLocLng,
          building: newLocBuilding,
          contact: newLocContact,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewLocName('');
        setNewLocDesc('');
        loadAllAdminData();
        alert('Campus landmark added to interactive map!');
      }
    } catch (e) {
      alert('Failed to add location');
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Are you sure you want to remove this campus landmark?')) return;
    try {
      await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadAllAdminData();
    } catch (e) {
      alert('Failed to delete location');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPass,
          role: newUserRole,
          phone: newUserPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPass('');
        loadAllAdminData();
        alert(`Created new ${newUserRole} account successfully!`);
      } else {
        alert(data.message || 'Failed to create user');
      }
    } catch (e) {
      alert('Failed to create user');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
              Anurag University • Safety Command Administration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Campus Safety Administration Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            System Overseer: <strong className="text-white">{user?.name}</strong> • Full Administrative Authority
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadAllAdminData}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-all shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            <span>Sync Data</span>
          </button>
        </div>
      </div>

      {/* Admin Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-800 no-scrollbar">
        {[
          { id: 'analytics', label: 'Safety Analytics', icon: Activity },
          { id: 'aiInsights', label: 'AI Safety Insights', icon: Sparkles },
          { id: 'locations', label: 'Campus Landmarks & Map', icon: MapPin },
          { id: 'emailPolicy', label: 'Student Email & Security Policy', icon: Mail },
          { id: 'users', label: 'Personnel & Responders', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition-all flex items-center space-x-2 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ANALYTICS & METRICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Counter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Students</div>
              <div className="text-2xl font-black text-cyan-400 mt-1">{metrics?.totalStudents ?? 0}</div>
            </div>
            <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active SOS</div>
              <div className="text-2xl font-black text-rose-500 mt-1">{metrics?.activeSOS ?? 0}</div>
            </div>
            <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resolved SOS</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{metrics?.resolvedSOS ?? 0}</div>
            </div>
            <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Open Reports</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{metrics?.openIncidents ?? 0}</div>
            </div>
            <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Response</div>
              <div className="text-2xl font-black text-purple-400 mt-1">{metrics?.averageResponseTime ?? '3.2 min'}</div>
            </div>
            <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Responders</div>
              <div className="text-2xl font-black text-blue-400 mt-1">{metrics?.availableResponders ?? 0}</div>
            </div>
          </div>

          {/* Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown Bar Chart */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Incident Reports by Category</span>
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SOS Emergency Types Distribution */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Emergency SOS Types Distribution</span>
              </h3>
              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sosTypeData.length > 0 ? sosTypeData : [{ name: 'Medical', value: 1 }, { name: 'Security', value: 2 }]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name }) => name}
                    >
                      {sosTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Real-Time Security & Action Audit Trail</span>
            </h3>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2">Timestamp</th>
                    <th className="pb-2">Action</th>
                    <th className="pb-2">Actor</th>
                    <th className="pb-2">Target / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.slice(0, 8).map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5 font-bold text-cyan-300">{log.action}</td>
                      <td className="py-2.5 text-slate-300">
                        {log.performedBy?.name} ({log.performedBy?.role || 'System'})
                      </td>
                      <td className="py-2.5 text-slate-400 truncate max-w-xs">{log.target || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI CAMPUS SAFETY INSIGHTS */}
      {activeTab === 'aiInsights' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>Gemini 2.5 Campus Intelligence Engine</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Analyzes live incident history and SOS dispatches across Anurag University to detect risk hotspots and recommend safety interventions.
              </p>
            </div>

            <button
              onClick={handleGenerateAIInsights}
              disabled={generatingInsights}
              className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center space-x-2 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generatingInsights ? 'Analyzing Campus Telemetry...' : 'Generate Real-Time Insights'}</span>
            </button>
          </div>

          {aiInsights ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2">
                <h4 className="font-bold text-xs text-purple-400 uppercase tracking-wider">
                  1. Executive Campus Safety Assessment
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed">{aiInsights.summary}</p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2">
                <h4 className="font-bold text-xs text-rose-400 uppercase tracking-wider">
                  2. High-Risk Zones & Hotspots
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {aiInsights.hotspotLocations?.map((loc: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-xl bg-rose-950/60 text-rose-300 border border-rose-800 text-xs font-bold">
                      📍 {loc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2">
                <h4 className="font-bold text-xs text-amber-400 uppercase tracking-wider">
                  3. Peak Incident Time Windows
                </h4>
                <p className="text-xs text-slate-300">{aiInsights.peakTimes || 'Evenings 6:00 PM - 10:00 PM near Hostels and North Gate'}</p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2">
                <h4 className="font-bold text-xs text-emerald-400 uppercase tracking-wider">
                  4. Recommended Interventions
                </h4>
                <ul className="space-y-1 text-xs text-slate-300">
                  {aiInsights.recommendations?.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500 space-y-3">
              <Sparkles className="w-10 h-10 text-purple-400/40 mx-auto" />
              <p>Click "Generate Real-Time Insights" to run automated Gemini AI analysis on campus incident records.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CAMPUS LANDMARKS & MAP MANAGER */}
      {activeTab === 'locations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Landmark Form (1 Col) */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Add Campus Landmark</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Click anywhere on the map to automatically populate GPS coordinates!
            </p>

            <form onSubmit={handleAddLocation} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                  Landmark Name
                </label>
                <input
                  type="text"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  placeholder="e.g., Central Library AED Station"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                  Type
                </label>
                <select
                  value={newLocType}
                  onChange={(e) => setNewLocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500"
                >
                  <option value="Medical">Medical Center</option>
                  <option value="Security">Security Post</option>
                  <option value="AED">AED Defibrillator</option>
                  <option value="Library">Library</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Canteen">Canteen</option>
                  <option value="Lab">Lab</option>
                  <option value="Gate">Gate</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLocLat}
                    onChange={(e) => setNewLocLat(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLocLng}
                    onChange={(e) => setNewLocLng(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                  Building / Block
                </label>
                <input
                  type="text"
                  value={newLocBuilding}
                  onChange={(e) => setNewLocBuilding(e.target.value)}
                  placeholder="e.g., B-Block, 1st Floor"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newLocDesc}
                  onChange={(e) => setNewLocDesc(e.target.value)}
                  placeholder="Details, emergency accessibility, hours..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold transition-all shadow-md shadow-cyan-500/20"
              >
                Add Landmark to Map
              </button>
            </form>
          </div>

          {/* Interactive Map & List (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200">
              💡 <strong>Tip:</strong> Click anywhere on the map below to instantly lock those coordinates into the "Add Campus Landmark" form!
            </div>

            <CampusMap
              height="320px"
              locations={locations}
              onSelectCoordinates={(c) => {
                setNewLocLat(parseFloat(c.lat.toFixed(5)));
                setNewLocLng(parseFloat(c.lng.toFixed(5)));
              }}
            />

            {/* Existing Locations Table */}
            <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                Active Campus Landmarks ({locations.length})
              </h4>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {locations.map((loc) => (
                  <div
                    key={loc._id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-extrabold text-white flex items-center space-x-2">
                        <span>{loc.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
                          {loc.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {loc.building || 'Campus Grounds'} • [{loc.location.coordinates[1].toFixed(4)}, {loc.location.coordinates[0].toFixed(4)}]
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteLocation(loc._id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STUDENT EMAIL CONFIGURATION & REGISTRATION AUDIT */}
      {activeTab === 'emailPolicy' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Policy Settings Form */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>College Email Domain & Registration Rules</span>
            </h3>
            <p className="text-xs text-slate-400">
              Only students with valid college email addresses matching this domain and regex pattern will be allowed to register.
            </p>

            <form onSubmit={handleSaveEmailPolicy} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                  Allowed Student Email Domain
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 rounded-l-xl bg-slate-800 text-slate-400 border border-r-0 border-slate-700">@</span>
                  <input
                    type="text"
                    value={policyDomain}
                    onChange={(e) => setPolicyDomain(e.target.value)}
                    placeholder="anurag.edu.in"
                    className="w-full px-3 py-2 rounded-r-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Example: anurag.edu.in</p>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                  Email Format Pattern
                </label>
                <input
                  type="text"
                  value={policyPattern}
                  onChange={(e) => setPolicyPattern(e.target.value)}
                  placeholder="{rollNumber}@anurag.edu.in"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">Descriptive pattern displayed to students on the signup screen.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                  Validation Regex Pattern (Regular Expression)
                </label>
                <input
                  type="text"
                  value={policyRegex}
                  onChange={(e) => setPolicyRegex(e.target.value)}
                  placeholder="^[0-9]{2}[a-z]{2}[0-9]{3}[a-z0-9]{3}@anurag\.edu\.in$"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-[11px] outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">Enforces format like 23eg105a50@anurag.edu.in</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="font-bold text-white">Allow Student Self-Registration</div>
                  <div className="text-[11px] text-slate-400">If disabled, only Admins can create student accounts.</div>
                </div>
                <input
                  type="checkbox"
                  checked={policySelfReg}
                  onChange={(e) => setPolicySelfReg(e.target.checked)}
                  className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md shadow-purple-600/30"
              >
                Save College Registration Policy
              </button>
            </form>
          </div>

          {/* Registration Attempts Log */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Registration Attempts Log</span>
            </h3>
            <p className="text-xs text-slate-400">
              Audit record of student registration submissions and compliance.
            </p>

            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 text-xs">
              {registrationAttempts.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No registration attempts recorded yet.</div>
              ) : (
                registrationAttempts.slice(0, 15).map((att, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white">{att.email}</div>
                      <div className="text-[11px] text-slate-400">{att.reason || 'Completed successfully'}</div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          att.status === 'SUCCESS'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {att.status}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {new Date(att.attemptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PERSONNEL & RESPONDERS */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Personnel Form (1 Col) */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
              <UserPlus className="w-4 h-4 text-cyan-400" />
              <span>Create Staff / Responder</span>
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Officer Rajesh Rao"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="rajesh.sec@anurag.edu.in"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  placeholder="Min 8 chars (e.g. Secure@1234)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                  Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                >
                  <option value="Responder">First Responder</option>
                  <option value="Security">Security Officer</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="+91-8415-255555"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold transition-all shadow-md shadow-cyan-500/20"
              >
                Create Account
              </button>
            </form>
          </div>

          {/* Users List (2 Cols) */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Campus Users & Personnel ({allUsers.length})</span>
            </h3>

            <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1 text-xs">
              {allUsers.map((u) => (
                <div
                  key={u._id}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <div className="font-extrabold text-white flex items-center space-x-2">
                      <span>{u.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded border ${
                          u.role === 'Admin'
                            ? 'bg-purple-950 text-purple-300 border-purple-800'
                            : u.role === 'Security'
                            ? 'bg-blue-950 text-blue-300 border-blue-800'
                            : u.role === 'Responder'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-slate-900 text-cyan-300 border-slate-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {u.email} • {u.phone || 'No phone'}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-emerald-400">Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
