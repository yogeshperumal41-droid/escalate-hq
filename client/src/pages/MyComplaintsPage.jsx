import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { complaintService } from '../services/api';
import StatusPill from '../components/StatusPill';
import GpsVerificationBadge from '../components/GpsVerificationBadge';
import { formatDate, timeAgo, getRemainingSlaHours, getCategoryColor } from '../utils/formatters';

const MyComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const res = await complaintService.getMyComplaints();
      if (res.data.success) {
        setComplaints(res.data.complaints);
      }
    } catch (err) {
      console.error('Failed to fetch personal complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const openCount = complaints.filter((c) => c.status === 'Open').length;
  const escalatedCount = complaints.filter((c) => c.status === 'Escalated').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;

  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter === 'All') return true;
    return c.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Filed Grievances
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Track corporate responses, 48-hour SLA turnaround timers, and GPS verification for your reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMyComplaints}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-300 transition-colors shadow-xs"
            title="Refresh Complaints"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/report"
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-rose-200"
          >
            <PlusCircle className="w-4 h-4" />
            <span>File New Grievance</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 mb-1">Total Filed</p>
          <p className="text-2xl font-black text-slate-900">{complaints.length}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-rose-600 mb-1">In 48h SLA Window</p>
          <p className="text-2xl font-black text-rose-700">{openCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-amber-600 mb-1">SLA Breached / Escalated</p>
          <p className="text-2xl font-black text-amber-700">{escalatedCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600 mb-1">Resolved by Brand</p>
          <p className="text-2xl font-black text-emerald-700">{resolvedCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        {['All', 'Open', 'Escalated', 'Resolved'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              statusFilter === tab
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading your complaints...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">No grievances found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
            {statusFilter === 'All'
              ? 'You have not submitted any complaints yet. If you faced rude staff, overcharging, or poor hygiene at a local franchise, report it now.'
              : `No complaints found with status '${statusFilter}'.`}
          </p>
          <Link
            to="/report"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-200"
          >
            <PlusCircle className="w-4 h-4" />
            <span>File a Verified Complaint</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((c) => {
            const remainingHours = c.status === 'Open' ? getRemainingSlaHours(c.createdAt, c.status) : null;
            const categoryStyle = getCategoryColor(c.category);

            return (
              <div
                key={c._id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      #{c.ticketId}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryStyle.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${categoryStyle.dot}`} />
                      {c.category}
                    </span>
                    <StatusPill status={c.status} />
                    <GpsVerificationBadge
                      isGpsVerified={c.isGpsVerified}
                      distanceMeters={c.distanceMeters}
                    />
                  </div>

                  <span className="text-xs text-slate-500 font-medium">
                    Reported {timeAgo(c.createdAt)} ({formatDate(c.createdAt)})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {c.brandId?.name || 'Parent Brand'}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs text-slate-600">
                        {c.branchId?.branchName || 'Franchise Branch'} ({c.branchId?.city})
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {c.description}
                    </p>

                    {/* Official Resolution Response if Resolved */}
                    {c.status === 'Resolved' && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Official Corporate Action & Resolution</span>
                        </div>
                        <p className="text-emerald-900 leading-relaxed">
                          {c.resolutionNotes || 'Brand Grievance Directorate took corrective action.'}
                        </p>
                        {c.resolvedAt && (
                          <p className="text-[10px] text-emerald-700 mt-1">
                            Resolved on {formatDate(c.resolvedAt)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* SLA Status for Open Tickets */}
                    {c.status === 'Open' && remainingHours !== null && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Corporate 48-Hour SLA Countdown:
                        </span>
                        <span className="font-bold font-mono text-amber-900">
                          {remainingHours > 0 ? `${remainingHours} hrs remaining` : 'Breach pending / Escalating'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Attached Evidence
                      </p>
                      {c.evidenceUrls && c.evidenceUrls.length > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          {c.evidenceUrls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 hover:border-rose-400 transition-all shadow-2xs group relative"
                            >
                              <img
                                src={url}
                                alt={`Proof ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No photo attached</p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                      <Link
                        to={`/complaints/${c._id}`}
                        className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700"
                      >
                        <span>View Full Ticket Audit</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyComplaintsPage;
