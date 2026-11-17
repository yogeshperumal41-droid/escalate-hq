import React from 'react';
import { ShieldCheck, MapPin } from 'lucide-react';

const GpsVerificationBadge = ({ isVerified, distanceMeters, showDetails = false }) => {
  if (isVerified) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
        title="Coordinates verified within 750m radius of franchise branch"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>GPS-Verified On-Premises</span>
        {distanceMeters !== null && distanceMeters !== undefined && (
          <span className="text-emerald-700 font-normal">({distanceMeters}m)</span>
        )}
      </div>
    );
  }

  if (showDetails) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>Remote Filing</span>
        {distanceMeters && (
          <span className="text-slate-500 font-mono text-[11px]">
            ({(distanceMeters / 1000).toFixed(1)}km away)
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
      title="Filed remotely or without GPS proximity verification"
    >
      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
      <span>Remote / Unverified</span>
    </div>
  );
};

export default GpsVerificationBadge;
