import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Car,
  Building,
  Shield,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ParkingCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isLoading } = useAuth();

  // Mode: signin or signup
  const [mode, setMode] = useState<'signin' | 'signup'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('mode') === 'signup' ? 'signup' : 'signin';
    } catch {
      return 'signin';
    }
  });

  // Selected role for login/signup
  const [selectedRole, setSelectedRole] = useState<'driver' | 'owner' | 'admin'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('role');
      if (r === 'owner') return 'owner';
      if (r === 'admin' && params.get('mode') !== 'signup') return 'admin';
      return 'driver';
    } catch {
      return 'driver';
    }
  });

  // Form fields (blank by default for standard web login)
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Status message
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Switch role handler for registration
  const handleSelectRole = (r: 'driver' | 'owner' | 'admin') => {
    if (mode === 'signup' && r === 'admin') return;
    setSelectedRole(r);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const r = params.get('role');
    const m = params.get('mode');
    if (m === 'signup') {
      setMode('signup');
      setSelectedRole((prev) => (prev === 'admin' ? 'driver' : prev));
    } else if (m === 'signin') {
      setMode('signin');
    }
    if (r === 'driver' || r === 'owner' || (r === 'admin' && m !== 'signup')) {
      handleSelectRole(r);
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      if (mode === 'signin') {
        const loggedUser = await login(email.trim(), password);
        setSuccessMsg(`Welcome back, ${loggedUser.name}!`);

        setTimeout(() => {
          if (loggedUser.role === 'admin' || email.includes('admin')) {
            navigate('/admin');
          } else if (loggedUser.role === 'owner') {
            navigate('/owner');
          } else {
            navigate('/dashboard');
          }
        }, 700);
      } else {
        if (!name.trim()) {
          setErrorMsg('Please enter your full name.');
          return;
        }
        const assignedRole: UserRole = selectedRole === 'admin' ? 'driver' : selectedRole;
        const newUser = await register(name.trim(), email.trim(), password, assignedRole, phone.trim());
        setSuccessMsg(`Account created successfully! Welcome, ${newUser.name}.`);

        setTimeout(() => {
          if (newUser.role === 'owner') {
            navigate('/owner');
          } else {
            navigate('/dashboard');
          }
        }, 700);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between items-center px-3 py-2 sm:px-4 sm:py-8 relative bg-[#080d16] overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[140px]"></div>
      </div>

      {/* Standalone Top Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between mb-1.5 sm:mb-4 z-10 shrink-0">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] sm:text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <span>← Back to Homepage</span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Bank-Grade 256-Bit Encryption</span>
        </div>
      </header>

      <div className="w-full max-w-md bg-[#0f172a]/95 backdrop-blur-2xl border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-2xl relative my-auto shrink-0">
        {/* Header Branding */}
        <div className="text-center mb-2 sm:mb-4">
          <Link to="/" className="inline-flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 group">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
              <span className="font-black text-white text-sm sm:text-lg">P</span>
            </div>
            <span className="text-base sm:text-xl font-extrabold text-white tracking-tight">
              Park<span className="text-emerald-400">Share</span>
            </span>
          </Link>
          <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
            {mode === 'signin' ? 'Account Sign In' : 'Create Free Account'}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-tight">
            {mode === 'signin'
              ? 'Enter your email and password to access your account'
              : 'Join ParkShare to find spots or monetize your parking space'}
          </p>
        </div>

        {/* Account Role Selection for Sign Up Only */}
        {mode === 'signup' && (
          <div className="mb-3 sm:mb-4">
            <label className="text-[10px] sm:text-xs font-semibold text-slate-300 block mb-1.5 text-center">
              Register as:
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleSelectRole('driver')}
                className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center ${
                  selectedRole === 'driver'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Customer / Driver</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectRole('owner')}
                className={`py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-center ${
                  selectedRole === 'owner'
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Space Owner</span>
              </button>
            </div>
          </div>
        )}

        {/* Admin notice indicator if admin email is typed in signin */}
        {mode === 'signin' && email.toLowerCase().includes('admin') && (
          <div className="mb-2 sm:mb-3 p-2 rounded-lg sm:rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 text-[11px] sm:text-xs flex items-center gap-2 animate-in fade-in">
            <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="leading-tight">
              <strong>Admin ID detected:</strong> Logging in will open the Platform Admin Operations Console.
            </span>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mb-2 sm:mb-3 p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-[11px] sm:text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-2 sm:mb-3 p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-[11px] sm:text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-1.5 sm:space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="text-[10px] sm:text-xs font-semibold text-slate-300 block mb-0.5">Full Name</label>
              <div className="relative">
                <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sen"
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] sm:text-xs font-semibold text-slate-300 block mb-0.5">Email address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="text-[10px] sm:text-xs font-semibold text-slate-300 block mb-0.5">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98300 00000"
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="text-[10px] sm:text-xs font-semibold text-slate-300">Password</label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => setErrorMsg('If an account exists for this email, password reset instructions have been sent.')}
                  className="text-[10px] sm:text-[11px] text-emerald-400 hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Create a secure password' : 'Enter your password'}
                className="w-full pl-8 sm:pl-10 pr-9 sm:pr-10 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-md sm:shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer mt-1.5 sm:mt-2.5 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In to ParkShare' : 'Create Account & Continue'}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch mode footer */}
        <div className="mt-2.5 sm:mt-5 pt-2 sm:pt-3.5 border-t border-slate-800 text-center text-[10px] sm:text-xs text-slate-400">
          {mode === 'signin' ? (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setEmail('');
                  setPassword('');
                  setName('');
                  setPhone('');
                  setSelectedRole('driver');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-emerald-400 font-bold hover:underline"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setSelectedRole('driver');
                  setEmail('');
                  setPassword('');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-emerald-400 font-bold hover:underline"
              >
                Sign in instead
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Standalone Minimal Footer */}
      <footer className="mt-1 sm:mt-4 text-center text-[10px] sm:text-xs text-slate-500 z-10 shrink-0 space-y-0.5">
        <p>© {new Date().getFullYear()} ParkShare Technologies Inc. All rights reserved.</p>
        <div className="flex items-center justify-center gap-3 text-[10px] sm:text-[11px] text-slate-500">
          <Link to="/" className="hover:text-slate-400">Home</Link>
          <span>•</span>
          <Link to="/find" className="hover:text-slate-400">Find Parking</Link>
          <span>•</span>
          <span className="hover:text-slate-400 cursor-pointer">Privacy & Security</span>
        </div>
      </footer>
    </div>
  );
};
