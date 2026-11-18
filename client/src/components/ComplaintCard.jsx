import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ArrowRight, Image as ImageIcon, ChevronRight, X } from 'lucide-react';
import StatusPill from './StatusPill';
import GpsVerificationBadge from './GpsVerificationBadge';
import { timeAgo, getCategoryColor, getRemainingSlaHours } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

const ComplaintCard = ({ complaint, onResolveClick }) => {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);

  const brand = complaint.brandId || {};
  const branch = complaint.branchId || {};
  const categoryStyle = getCategoryColor(complaint.category);
  const remainingHours = getRemainingSlaHours(complaint.createdAt, complaint.status);

  // Check if current user is authorized to resolve this complaint
  const isBrandOwnerOfTicket =
    user?.role === 'brandowner' &&
    (user?.brandId?._id || user?.brandId)?.toString() === (brand?._id || complaint?.brandId)?.toString();
  const canResolveTicket = (isBrandOwnerOfTicket || user?.role === 'admin') && user?.role !== 'user';

  return (
    <div
      className={`relative bg-white rounded-2xl border transition-all duration-200 hover:border-slate-300 hover:shadow-md shadow-sm overflow-hidden flex flex-col justify-between ${
        complaint.status === 'Escalated'
          ? 'border-rose-300 ring-1 ring-rose-200'
          : 'border-slate-200'
      }`}
    >
      {/* Top Bar: Brand, Category, Status */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Brand Info */}
          <Link
            to={`/brands/${brand.slug || ''}`}
            className="flex items-center gap-3 group"
          >
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-50 group-hover:border-rose-300 transition-colors shadow-xs"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-rose-600 group-hover:border-rose-300 transition-colors">
                {brand.name ? brand.name.charAt(0) : 'B'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors text-base leading-tight">
                  {brand.name || 'Unknown Brand'}
                </h3>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
              </div>
              <span className="text-xs text-slate-500">
                {brand.category || 'Franchise'}
              </span>
            </div>
          </Link>

          {/* Status Pill */}
          <StatusPill status={complaint.status} size="sm" />
        </div>

        {/* Branch Details */}
        <div className="flex items-center gap-2 text-xs text-slate-700 font-medium mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="truncate text-slate-900 font-semibold">
            {branch.branchName || 'Local Branch'}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600 shrink-0 font-medium">
            {branch.city || 'National'}
          </span>
        </div>

        {/* Category & GPS Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryStyle.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${categoryStyle.dot}`} />
            {complaint.category}
          </span>

          <GpsVerificationBadge
            isVerified={complaint.isGpsVerified}
            distanceMeters={complaint.distanceMeters}
          />

          <span className="text-[11px] font-mono text-slate-500 ml-auto">
            #{complaint.ticketId}
          </span>
        </div>

        {/* Description Excerpt */}
        <p className="text-sm text-slate-700 leading-relaxed line-clamp-3 mb-4">
          "{complaint.description}"
        </p>

        {/* Evidence Photos Preview */}
        {complaint.evidenceUrls && complaint.evidenceUrls.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Evidence Proof ({complaint.evidenceUrls.length})</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {complaint.evidenceUrls.slice(0, 3).map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(url)}
                  className="relative group shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-slate-200 hover:border-rose-400 transition-all shadow-xs"
                >
                  <img
                    src={url}
                    alt={`Evidence ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-slate-500/10 group-hover:bg-transparent transition-colors" />
                </button>
              ))}
              {complaint.evidenceUrls.length > 3 && (
                <Link
                  to={`/complaints/${complaint._id}`}
                  className="shrink-0 w-16 h-16 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-700 hover:text-rose-600 hover:border-slate-300 transition-colors"
                >
                  +{complaint.evidenceUrls.length - 3} more
                </Link>
              )}
            </div>
          </div>
        )}

        {/* SLA Notice for Open tickets */}
        {complaint.status === 'Open' && remainingHours !== null && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              48h Corporate SLA Window:
            </span>
            <span className="font-bold text-amber-900 font-mono">
              {remainingHours > 0 ? `${remainingHours} hrs remaining` : 'Breach pending'}
            </span>
          </div>
        )}

        {/* Escalated Alert */}
        {complaint.status === 'Escalated' && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between mb-2">
            <span className="font-bold text-rose-700">⚠️ Escalated to Executive Directorate</span>
            <span className="text-rose-600 text-[11px] font-semibold">SLA Breached</span>
          </div>
        )}

        {/* Resolved Alert */}
        {complaint.status === 'Resolved' && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 line-clamp-1 mb-2">
            <span className="font-semibold text-emerald-700">Resolved: </span>
            {complaint.resolutionNotes || 'Action taken by brand.'}
          </div>
        )}
      </div>

      {/* Footer Info & Action */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>{timeAgo(complaint.createdAt)}</span>
          <span>•</span>
          <span>by {complaint.userId?.name || 'Customer'}</span>
        </div>

        <div className="flex items-center gap-2">
          {onResolveClick && canResolveTicket && complaint.status !== 'Resolved' && (
            <button
              onClick={() => onResolveClick(complaint)}
              className="text-xs px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold transition-colors"
            >
              Resolve
            </button>
          )}

          <Link
            to={`/complaints/${complaint._id}`}
            className="flex items-center gap-1 text-slate-700 hover:text-rose-600 font-semibold transition-colors group"
          >
            <span>View Case</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-3xl max-h-[90vh] relative bg-white p-2 rounded-2xl shadow-2xl">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-slate-700 border border-slate-200 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={selectedImage}
              alt="Evidence Full View"
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
            />
            <p className="text-center text-xs text-slate-500 mt-2">Click anywhere to close preview</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintCard;
