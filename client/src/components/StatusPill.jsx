import React from 'react';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

const StatusPill = ({ status, size = 'md' }) => {
  const isSmall = size === 'sm';
  const paddingClass = isSmall ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs font-semibold';

  if (status === 'Escalated') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 text-rose-700 font-bold uppercase tracking-wider ${paddingClass} escalated-pulse`}
      >
        <AlertTriangle className={isSmall ? 'w-3 h-3 text-rose-600' : 'w-3.5 h-3.5 text-rose-600'} />
        <span>Escalated (SLA Breached)</span>
      </span>
    );
  }

  if (status === 'Resolved') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold uppercase tracking-wider ${paddingClass}`}
      >
        <CheckCircle2 className={isSmall ? 'w-3 h-3 text-emerald-600' : 'w-3.5 h-3.5 text-emerald-600'} />
        <span>Resolved</span>
      </span>
    );
  }

  // Default 'Open'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 font-semibold uppercase tracking-wider ${paddingClass}`}
    >
      <Clock className={isSmall ? 'w-3 h-3 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />
      <span>Open (In SLA)</span>
    </span>
  );
};

export default StatusPill;
