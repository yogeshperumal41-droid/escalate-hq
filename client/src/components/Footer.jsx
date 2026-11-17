import React from 'react';
import { ShieldCheck, Mail, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-slate-900 tracking-tight">
                Escalate<span className="text-rose-600">HQ</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-mono border border-slate-200">
                v1.0
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed text-xs">
              Autonomous corporate escalation protocol. Holding franchise branch networks accountable for staff rudeness, meter fraud, and customer neglect.
            </p>
          </div>

          {/* Pillars */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Guaranteed Protocols
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>48-Hour Corporate SLA Clock</span>
              </li>
              <li className="flex items-center gap-2 text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>GPS Location Proximity Verification</span>
              </li>
              <li className="flex items-center gap-2 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Direct Nodemailer Grievance Dispatch</span>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Platform Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-slate-600 hover:text-rose-600 transition-colors">
                  Public Transparency Feed
                </Link>
              </li>
              <li>
                <Link to="/report" className="text-slate-600 hover:text-rose-600 transition-colors">
                  File a Verified Complaint
                </Link>
              </li>
              <li>
                <Link to="/brands" className="text-slate-600 hover:text-rose-600 transition-colors">
                  Brand Resolution Scorecards
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-slate-600 hover:text-rose-600 transition-colors">
                  Corporate Grievance Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* SLA Statement */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 mb-1">
              Public Ledger Transparency
            </h4>
            <p className="text-[11px] text-slate-600 leading-normal">
              Every filed grievance is time-stamped. Brands that fail to resolve grievances within 48 hours are automatically marked with the <strong className="text-rose-600">Escalated</strong> badge across search engines.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} EscalateHQ. Built for Consumer Rights & Franchise Accountability.</p>
          <div className="flex items-center gap-4">
            <span>Powered by MERN + AWS S3 + Geolocation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
