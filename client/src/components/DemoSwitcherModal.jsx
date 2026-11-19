import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Shield, Building, X, Sparkles } from 'lucide-react';

const ACCOUNTS = [
  {
    role: 'user',
    name: 'User',
    email: 'user@example.com',
    password: 'password123',
    icon: UserCheck,
    title: 'Regular Customer (user)',
    badge: 'role: user',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    description: 'Can file grievances, upload receipt proofs, verify GPS, and view My Complaints. Has no access to Brand Ops Desk.',
  },
  {
    role: 'brandowner',
    name: 'Indian Oil Corporate Desk',
    email: 'owner.indianoil@example.com',
    password: 'password123',
    icon: Building,
    title: 'Brand Owner (brandowner - Indian Oil)',
    badge: 'role: brandowner',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Brand Owner desk: reviews and resolves grievances strictly for Indian Oil branches.',
  },
  {
    role: 'admin',
    name: 'EscalateHQ Platform Auditor',
    email: 'admin@escalatehq.org',
    password: 'password123',
    icon: Shield,
    title: 'Platform Admin (admin)',
    badge: 'role: admin',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Manages parent brands, updates user roles, force-escalates tickets, and removes spam.',
  },
];

const DemoSwitcherModal = () => {
  const navigate = useNavigate();
  const { showDemoModal, setShowDemoModal, login, user } = useAuth();

  if (!showDemoModal) return null;

  const handleSelectAccount = async (account) => {
    const res = await login(account.email, account.password);
    setShowDemoModal(false);
    if (res.success) {
      if (account.role === 'brandowner') {
        navigate('/brand-desk');
      } else if (account.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/my-complaints');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Quick Persona Switcher</h3>
              <p className="text-xs text-slate-500">1-click test logins with pre-configured roles</p>
            </div>
          </div>
          <button
            onClick={() => setShowDemoModal(false)}
            className="text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            const isCurrent = user?.email === acc.email;

            return (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleSelectAccount(acc)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 group ${
                  isCurrent
                    ? 'bg-rose-50/70 border-2 border-rose-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5 text-rose-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-slate-900 text-sm group-hover:text-rose-600 transition-colors">
                      {acc.title}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${acc.badgeColor}`}>
                      {acc.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-1.5">{acc.description}</p>
                  <p className="text-[11px] font-mono text-slate-500">{acc.email}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-600">
            Current active session: <span className="text-slate-900 font-bold">{user ? `${user.name} (${user.role})` : 'Guest'}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoSwitcherModal;
