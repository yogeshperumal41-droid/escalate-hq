import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Mail,
  Share2,
  X,
  Image as ImageIcon,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import StatusPill from '../components/StatusPill';
import GpsVerificationBadge from '../components/GpsVerificationBadge';
import ResolveModal from '../components/ResolveModal';
import { complaintService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, getCategoryColor } from '../utils/formatters';

const ComplaintDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const actionFromUrl = searchParams.get('action');
  const tokenFromUrl = searchParams.get('token');
  const justReported = searchParams.get('justReported') === 'true';

  const fetchComplaint = async () => {
    setLoading(true);
    try {
      const res = await complaintService.getComplaintById(id);
      if (res.data.success) {
        setComplaint(res.data.complaint);
        if (actionFromUrl === 'resolve') {
          setIsResolveModalOpen(true);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Complaint ticket not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleResolveSuccess = (updatedComplaint) => {
    setComplaint(updatedComplaint);
  };

  const handleAdminEscalate = async () => {
    try {
      const res = await complaintService.escalateComplaint(id, {
        reason: 'Ticket manually escalated by Platform Administrator from Case Detail view.',
      });
      if (res.data.success) {
        setComplaint(res.data.complaint);
        setActionNotice('Complaint has been forcefully escalated to Executive Directorate.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to escalate ticket');
    }
  };

  const handleAdminDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this grievance ticket?')) return;
    try {
      const res = await complaintService.deleteComplaint(id);
      if (res.data.success) {
        alert('Ticket deleted successfully.');
        navigate('/admin');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete ticket');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 text-sm">Loading grievance manifest and audit trail...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Ticket Not Found</h2>
        <p className="text-slate-600 text-sm mb-6">{error || 'Could not find this complaint'}</p>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors"
        >
          ← Return to Public Feed
        </Link>
      </div>
    );
  }

  const brand = complaint.brandId || {};
  const branch = complaint.branchId || {};
  const categoryStyle = getCategoryColor(complaint.category);

  // RBAC Permission checks
  const isBrandOwnerOfTicket =
    user?.role === 'brandowner' &&
    (user?.brandId?._id || user?.brandId)?.toString() === (brand?._id || complaint?.brandId?._id || complaint?.brandId)?.toString();

  const canResolve =
    complaint.status !== 'Resolved' &&
    (isBrandOwnerOfTicket || Boolean(tokenFromUrl) || user?.role === 'admin') &&
    user?.role !== 'user';

  const canForceEscalate = user?.role === 'admin' && complaint.status === 'Open';
  const canDeleteTicket = user?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 min-h-screen bg-slate-50">
      {/* Back button & Share */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-rose-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Transparency Feed</span>
        </Link>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors shadow-xs"
        >
          <Share2 className="w-3.5 h-3.5 text-rose-600" />
          <span>{copyFeedback ? 'Link Copied!' : 'Share Case'}</span>
        </button>
      </div>

      {/* Just Reported Banner */}
      {justReported && (
        <div className="p-4 mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm text-emerald-900">Grievance Successfully Dispatched!</p>
              <p className="text-emerald-700 mt-0.5">
                Official grievance delivered to {brand.name} Corporate Directorate ({brand.escalationEmail}).
              </p>
            </div>
          </div>
          <span className="font-mono font-bold bg-emerald-100 border border-emerald-200 px-2 py-1 rounded text-emerald-800">
            48h SLA Active
          </span>
        </div>
      )}

      {/* Main Ticket Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                #{complaint.ticketId}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryStyle.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${categoryStyle.dot}`} />
                {complaint.category}
              </span>
              <StatusPill status={complaint.status} />
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {complaint.category} Grievance at {branch.branchName || 'Franchise Branch'}
            </h1>
          </div>

          {/* RBAC Authorized Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            {canResolve && (
              <button
                onClick={() => setIsResolveModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Resolved</span>
              </button>
            )}

            {canForceEscalate && (
              <button
                onClick={handleAdminEscalate}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Force-escalate ticket"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Force Escalate</span>
              </button>
            )}

            {canDeleteTicket && (
              <button
                onClick={handleAdminDelete}
                className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all"
                title="Delete ticket"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Brand & Branch Metas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Brand Card */}
          <Link
            to={`/brands/${brand.slug || ''}`}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all flex items-center gap-3.5 group"
          >
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white group-hover:scale-105 transition-transform shadow-xs"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-rose-600">
                {brand.name?.charAt(0) || 'B'}
              </div>
            )}
            <div>
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Parent Company</p>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-rose-600 transition-colors">
                {brand.name}
              </h3>
              <p className="text-xs text-slate-500 font-mono truncate max-w-[220px]">
                {brand.escalationEmail}
              </p>
            </div>
          </Link>

          {/* Branch Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Local Franchise</p>
              <h3 className="font-bold text-slate-900 text-sm truncate max-w-[220px]">
                {branch.branchName}
              </h3>
              <p className="text-xs text-slate-600 truncate max-w-[220px]">
                {branch.address}, {branch.city}
              </p>
            </div>
          </div>
        </div>

        {/* GPS Verification Audit Section */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Geolocation Audit Verification
              </span>
            </div>
            <GpsVerificationBadge
              isVerified={complaint.isGpsVerified}
              distanceMeters={complaint.distanceMeters}
              showDetails={true}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
            <div>
              <span className="text-slate-500 block text-[10px] font-medium">User Coordinates:</span>
              <span className="font-mono text-slate-800">
                {complaint.userCoordinates
                  ? `${complaint.userCoordinates.latitude.toFixed(4)}, ${complaint.userCoordinates.longitude.toFixed(4)}`
                  : 'Not captured'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-medium">Branch Coordinates:</span>
              <span className="font-mono text-slate-800">
                {branch.location?.coordinates
                  ? `${branch.location.coordinates[1].toFixed(4)}, ${branch.location.coordinates[0].toFixed(4)}`
                  : 'Registered Point'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] font-medium">Proximity Distance:</span>
              <span className="font-mono font-bold text-slate-900">
                {complaint.distanceMeters !== null
                  ? `${complaint.distanceMeters} meters (Radius: 750m)`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Incident Narrative */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Incident Description & Grievance Narrative
          </h3>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
            {complaint.description}
          </div>
        </div>

        {/* Evidence Photos */}
        {complaint.evidenceUrls && complaint.evidenceUrls.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-rose-600" />
              <span>Evidence Proof Files ({complaint.evidenceUrls.length})</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {complaint.evidenceUrls.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(url)}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video shadow-xs"
                >
                  <img
                    src={url}
                    alt={`Evidence ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-slate-800 bg-white/95 border border-slate-200 px-2 py-0.5 rounded shadow-sm">
                      View Proof
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resolution Notes (If Resolved) */}
        {complaint.status === 'Resolved' && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Official Corporate Resolution Notes
              </span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              {complaint.resolutionNotes}
            </p>
            {complaint.resolvedAt && (
              <p className="text-[11px] text-emerald-700 pt-1">
                Resolved on {formatDate(complaint.resolvedAt)}
              </p>
            )}
          </div>
        )}

        {/* Chain of Custody / Timeline */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Official SLA Audit Trail & Chain of Custody</span>
          </h3>

          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
            {complaint.timeline && complaint.timeline.length > 0 ? (
              complaint.timeline.map((event, idx) => (
                <div key={idx} className="relative flex items-start gap-3 pl-8">
                  <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-rose-600 border-2 border-white ring-2 ring-rose-200" />
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 w-full text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{event.action}</span>
                      <span className="text-[11px] text-slate-500">{formatDate(event.timestamp)}</span>
                    </div>
                    <p className="text-slate-600 mb-1">{event.notes}</p>
                    <span className="text-[10px] text-slate-500 font-mono">Actor: {event.actor}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 pl-8">No timeline entries recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] bg-white p-3 rounded-2xl relative shadow-2xl">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-slate-700 border border-slate-200 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={selectedImage}
              alt="Evidence Full View"
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
            <p className="text-center text-xs text-slate-500 mt-2">Click anywhere to close preview</p>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      <ResolveModal
        complaint={complaint}
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        onSuccess={handleResolveSuccess}
      />
    </div>
  );
};

export default ComplaintDetailPage;
