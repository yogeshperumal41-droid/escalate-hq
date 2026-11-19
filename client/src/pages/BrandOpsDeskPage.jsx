import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Building,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { complaintService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusPill from '../components/StatusPill';
import GpsVerificationBadge from '../components/GpsVerificationBadge';
import ResolveModal from '../components/ResolveModal';
import { formatDate, timeAgo, getRemainingSlaHours, getCategoryColor } from '../utils/formatters';

const BrandOpsDeskPage = () => {
  const { user } = useAuth();

  // Strict role protection: Standard users or non-brandowners cannot access Brand Ops Desk
  if (user?.role !== 'brandowner') {
    return <Navigate to="/my-complaints" replace />;
  }

  const [complaints, setComplaints] = useState([]);
  const [brandInfo, setBrandInfo] = useState(user?.brandId || null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [resolvingComplaint, setResolvingComplaint] = useState(null);

  const fetchBrandComplaints = async () => {
    setLoading(true);
    try {
      const res = await complaintService.getMyBrandComplaints();
      if (res.data.success) {
        setComplaints(res.data.complaints || []);
        if (res.data.brand) {
          setBrandInfo(res.data.brand);
        } else if (res.data.complaints?.[0]?.brandId) {
          setBrandInfo(res.data.complaints[0].brandId);
        }
      }
    } catch (err) {
      console.error('Failed to load brand complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.brandId) {
      setBrandInfo(user.brandId);
    }
    fetchBrandComplaints();
  }, [user]);

  const handleResolveSuccess = (updatedComplaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c._id === updatedComplaint._id ? updatedComplaint : c))
    );
    setResolvingComplaint(null);
  };

  const openTickets = complaints.filter((c) => c.status === 'Open');
  const escalatedTickets = complaints.filter((c) => c.status === 'Escalated');
  const resolvedTickets = complaints.filter((c) => c.status === 'Resolved');

  const filteredComplaints = complaints.filter((c) => {
    if (statusFilter === 'All') return true;
    return c.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-slate-50">
      {/* Unassigned Warning Banner */}
      {!brandInfo && !loading && (
        <div className="p-4 mb-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">No Brand Linked to this Account</p>
              <p className="text-amber-700 mt-0.5">
                An administrator can bind your account to a parent brand (e.g. Indian Oil, Domino's, SBI) in the Admin Control Panel.
              </p>
            </div>
          </div>
          <Link
            to="/admin"
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
          >
            Assign Brand in Admin
          </Link>
        </div>
      )}

      {/* Brand Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {brandInfo?.logoUrl ? (
              <img
                src={brandInfo.logoUrl}
                alt={brandInfo.name}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-white shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-white text-2xl font-black shadow-md shadow-amber-200">
                <Building className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {brandInfo?.name || 'Assigned Brand'} Operations Desk
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                  Brand Owner Portal
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Corporate grievance management for {brandInfo?.name || 'your franchise brand'} with 48-hour SLA resolution authority.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchBrandComplaints}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-300 transition-colors shadow-xs"
              title="Refresh Queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {brandInfo?.slug && (
              <Link
                to={`/brands/${brandInfo.slug}`}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-2 border border-slate-300"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Public Scorecard</span>
              </Link>
            )}
          </div>
        </div>

        {/* SLA Status Indicator */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 mb-1">Total Brand Grievances</p>
            <p className="text-2xl font-black text-slate-900">{complaints.length}</p>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
            <p className="text-xs font-semibold text-amber-800 mb-1">In 48h SLA Window</p>
            <p className="text-2xl font-black text-amber-700">{openTickets.length}</p>
          </div>

          <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200">
            <p className="text-xs font-semibold text-rose-800 mb-1">Overdue / Escalated</p>
            <p className="text-2xl font-black text-rose-700">{escalatedTickets.length}</p>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
            <p className="text-xs font-semibold text-emerald-800 mb-1">Resolved Satisfactorily</p>
            <p className="text-2xl font-black text-emerald-700">{resolvedTickets.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          {['All', 'Open', 'Escalated', 'Resolved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === tab
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500 font-medium">
          Showing {filteredComplaints.length} tickets for {brandInfo?.name || 'your brand'}
        </p>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading brand grievance queue...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Building className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">No grievances in queue</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {statusFilter === 'All'
              ? 'There are currently no customer grievances logged against your franchise outlets.'
              : `No grievances matching status '${statusFilter}'.`}
          </p>
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

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      Filed by {c.userId?.name || 'Customer'} • {timeAgo(c.createdAt)}
                    </span>
                    {c.status !== 'Resolved' && (
                      <button
                        onClick={() => setResolvingComplaint(c)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve Ticket</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Outlet: {c.branchId?.branchName || 'Franchise Branch'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {c.branchId?.address}, {c.branchId?.city}, {c.branchId?.state}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                      {c.description}
                    </div>

                    {/* Resolution details if already resolved */}
                    {c.status === 'Resolved' && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Resolution Notes Recorded</span>
                        </div>
                        <p className="text-emerald-900">{c.resolutionNotes}</p>
                        {c.resolvedAt && (
                          <p className="text-[10px] text-emerald-700 mt-1">
                            Recorded on {formatDate(c.resolvedAt)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* SLA countdown notice */}
                    {c.status === 'Open' && remainingHours !== null && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Corporate 48h SLA Window:
                        </span>
                        <span className="font-bold font-mono text-amber-900">
                          {remainingHours > 0 ? `${remainingHours} hrs remaining before auto-escalation` : 'SLA Breached / Auto-Escalating'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Customer Photo Proof
                      </p>
                      {c.evidenceUrls && c.evidenceUrls.length > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          {c.evidenceUrls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 hover:border-amber-400 transition-all shadow-2xs group relative"
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
                        <p className="text-xs text-slate-400 italic">No receipt attached</p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                      <Link
                        to={`/complaints/${c._id}`}
                        className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-amber-600"
                      >
                        <span>Audit Trail & Custody</span>
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

      {/* Resolution Modal */}
      {resolvingComplaint && (
        <ResolveModal
          complaint={resolvingComplaint}
          onClose={() => setResolvingComplaint(null)}
          onSuccess={handleResolveSuccess}
        />
      )}
    </div>
  );
};

export default BrandOpsDeskPage;
