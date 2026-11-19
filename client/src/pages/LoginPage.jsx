import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, LogIn, AlertCircle, Sparkles, User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    if (res.success) {
      const from = location.state?.from?.pathname || location.state?.from;
      if (from) {
        navigate(from, { replace: true });
      } else if (res.user?.role === 'brandowner') {
        navigate('/brand-desk', { replace: true });
      } else if (res.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/my-complaints', { replace: true });
      }
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white mx-auto mb-3 shadow-md shadow-rose-200">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Welcome Back</h1>
          <p className="text-xs text-slate-600 mt-1">
            Sign in to track filed grievances, resolve tickets, or audit SLAs
          </p>
        </div>

        {/* Quick Demo Credentials */}
        <div className="mb-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5 text-amber-600 font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Test Credentials</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <button
              type="button"
              onClick={() => fillDemo('user@example.com', 'password123')}
              className="text-left px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 transition-colors flex items-center justify-between text-[11px] border border-slate-200 shadow-xs"
            >
              <span className="font-semibold">Consumer (User)</span>
              <span className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded font-mono font-bold">user</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('owner.indianoil@example.com', 'password123')}
              className="text-left px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 transition-colors flex items-center justify-between text-[11px] border border-slate-200 shadow-xs"
            >
              <span className="font-semibold">Indian Oil Corporate Desk</span>
              <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-mono font-bold">brandowner</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin@escalatehq.org', 'password123')}
              className="text-left px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 transition-colors flex items-center justify-between text-[11px] border border-slate-200 shadow-xs"
            >
              <span className="font-semibold">EscalateHQ Platform Auditor</span>
              <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-mono font-bold">admin</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 hover:border-slate-400 transition-colors shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 hover:border-slate-400 transition-colors shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-rose-600 font-bold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
