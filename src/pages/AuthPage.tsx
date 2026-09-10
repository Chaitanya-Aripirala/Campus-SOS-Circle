import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import {
  ShieldAlert,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Phone,
} from 'lucide-react';

interface AuthPageProps {
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const { login, register, googleLogin, quickDemoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('3rd Year');
  const [phone, setPhone] = useState('');

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasDigit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (isRegister) {
      if (!isPasswordValid) {
        setErrorMsg('Password does not meet the security requirements.');
        setLoading(false);
        return;
      }

      const res = await register({
        name,
        email,
        password,
        rollNumber: rollNumber || email.split('@')[0].toUpperCase(),
        department,
        year,
        phone,
      });

      setLoading(false);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.message);
      }
    } else {
      const res = await login(email, password);
      setLoading(false);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-rose-500 p-[2px] shadow-lg shadow-cyan-500/20 mb-2">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {isRegister ? 'Student College Registration' : 'Campus Safety Portal Sign In'}
          </h2>
          <p className="text-xs text-slate-400">
            {isRegister
              ? 'Must use official Anurag University email (@anurag.edu.in)'
              : 'Sign in to access GPS-enabled emergency network & alerts'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              !isRegister ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              isRegister ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register Student
          </button>
        </div>

        {/* Error Alert if any */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {isRegister && (
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
              College Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500"
                required
              />
            </div>
            {isRegister && (
              <p className="text-[10px] text-slate-500 mt-1">
                Format: 23eg105a50@anurag.edu.in
              </p>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-500"
                required
              />
            </div>
            {isRegister && (
              <div className="mt-2 space-y-1 text-[10px] text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <span className={hasMinLength ? 'text-emerald-400' : 'text-slate-600'}>●</span>
                  <span>Minimum 8 characters</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={hasUpper && hasLower ? 'text-emerald-400' : 'text-slate-600'}>●</span>
                  <span>Uppercase & lowercase letters</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={hasDigit ? 'text-emerald-400' : 'text-slate-600'}>●</span>
                  <span>At least one number</span>
                </div>
              </div>
            )}
          </div>

          {isRegister && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                    Academic Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Artificial Intelligence & Machine Learning">AI & Machine Learning</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="School of Pharmacy">School of Pharmacy</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                  Mobile / Emergency Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/20 active:scale-98 transition-all flex items-center justify-center space-x-2 mt-2"
          >
            <span>{loading ? 'Authenticating...' : isRegister ? 'Complete Registration' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-500">or</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setErrorMsg('');
              setLoading(true);
              const res = await googleLogin();
              setLoading(false);
              if (res.success) {
                onSuccess();
              } else {
                setErrorMsg(res.message);
              }
            }}
            className="w-full py-2.5 rounded-2xl bg-slate-950 border border-slate-700 hover:border-cyan-500 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.1-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.8 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
              />
            </svg>
            <span>Continue with Anurag Google Workspace</span>
          </button>
        </form>

        {/* Quick Demo Persona Shortcuts */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Fast Role Sandbox</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(['Student', 'Responder', 'Security', 'Admin'] as Role[]).map((r) => (
              <button
                key={r}
                onClick={async () => {
                  await quickDemoLogin(r);
                  onSuccess();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 text-left transition-all"
              >
                Launch as {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
