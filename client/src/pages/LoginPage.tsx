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
import { ThemeToggle } from '../components/ThemeToggle';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isLoading } = useAuth();

  // Mode: signin or signup
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Selected role for login/signup
  const [selectedRole, setSelectedRole] = useState<'driver' | 'owner' | 'admin'>('driver');

  // Form fields
  const [email, setEmail] = useState<string>('driver@parkshare.com');
  const [password, setPassword] = useState<string>('password123');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Status message
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Switch role handler with appropriate defaults
  const handleSelectRole = (r: 'driver' | 'owner' | 'admin') => {
    setSelectedRole(r);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (r === 'driver') {
      setEmail('driver@parkshare.com');
      setPassword('password123');
    } else if (r === 'owner') {
      setEmail('owner@parkshare.com');
      setPassword('password123');
    } else if (r === 'admin') {
      setEmail('admin@parkshare.com');
      setPassword('password123');
      setMode('signin'); // Admin accounts are signin only
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const r = params.get('role');
    const m = params.get('mode');
    if (m === 'signup' || m === 'signin') {
      setMode(m);
    }
    if (r === 'driver' || r === 'owner' || r === 'admin') {
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
    <div className="min-h-screen flex flex-col justify-between items-center px-4 py-6 sm:py-10 relative bg-[#080d16]">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[140px]"></div>
      </div>

      {/* Standalone Top Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between mb-4 z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <span>← Back to Homepage</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Bank-Grade 256-Bit Encryption</span>
          </div>
        </div>
      </header>

      <div className="w-full max-w-md bg-[#0f172a]/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-auto">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
              <span className="font-black text-white text-lg">P</span>
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">
              Park<span className="text-emerald-400">Share</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {mode === 'signin' ? 'Account Sign In' : 'Create Account'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {selectedRole === 'driver' && 'Customer Profile: Find spots, manage vehicles & entry passes'}
            {selectedRole === 'owner' && 'Space Owner Profile: Host parking, manage rates & earnings'}
            {selectedRole === 'admin' && 'Admin Profile: Platform verifications & system governance'}
          </p>
        </div>

        {/* 3-Way Dedicated Profile Role Switcher */}
        <div className="mb-5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
            Choose Your Login Profile
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleSelectRole('driver')}
              className={`py-2 px-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center ${
                selectedRole === 'driver'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectRole('owner')}
              className={`py-2 px-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center ${
                selectedRole === 'owner'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Owner</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectRole('admin')}
              className={`py-2 px-2 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 text-center ${
                selectedRole === 'admin'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Autofill Demo Helper Button for Active Selected Role */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => handleSelectRole(selectedRole)}
            className={`w-full py-1.5 px-3 rounded-xl border text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === 'driver'
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : selectedRole === 'owner'
                ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30'
                : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>
              Auto-fill {selectedRole === 'driver' ? 'Customer' : selectedRole === 'owner' ? 'Owner' : 'Super Admin'} Demo Credentials
            </span>
          </button>
        </div>

        {/* Admin notice indicator if admin email is typed */}
        {email.toLowerCase().includes('admin') && (
          <div className="mb-4 p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Shield className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="leading-tight">
              <strong>Admin ID detected:</strong> Logging in will open the Platform Admin Operations Console.
            </span>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sen"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Email / Username</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="driver@parkshare.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98300 00000"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => alert('For demo, use password: password123')}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In to ParkShare' : 'Create Account & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch mode footer */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
          {selectedRole === 'admin' ? (
            <p className="text-slate-400 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin credentials are provisioned by Security Operations.</span>
            </p>
          ) : mode === 'signin' ? (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-emerald-400 font-bold hover:underline"
              >
                Sign up as {selectedRole === 'owner' ? 'an Owner' : 'a Customer'}
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
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
      <footer className="mt-6 text-center text-xs text-slate-500 z-10 space-y-1">
        <p>© {new Date().getFullYear()} ParkShare Technologies Inc. All rights reserved.</p>
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
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
