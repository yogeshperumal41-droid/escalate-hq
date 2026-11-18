import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertTriangle,
  MapPin,
  TrendingDown,
  TrendingUp,
  PlusCircle,
  Mail,
  Star,
} from 'lucide-react';
import ComplaintCard from '../components/ComplaintCard';
import ResolveModal from '../components/ResolveModal';
import { brandService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const BrandScorecardPage = () => {
  const { user } = useAuth();
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolvingComplaint, setResolvingComplaint] = useState(null);

  const fetchBrandScorecard = async () => {
    setLoading(true);
    try {
      const res = await brandService.getBrandBySlug(slug);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Brand not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrandScorecard();
  }, [slug]);

  const handleResolveSuccess = (updatedComplaint) => {
    if (data) {
      setData((prev) => ({
        ...prev,
        recentComplaints: prev.recentComplaints.map((c) =>
          c._id === updatedComplaint._id ? updatedComplaint : c
        ),
      }));
    }
    fetchBrandScorecard();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 text-sm">Loading brand scorecard and franchise audit...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Scorecard Unavailable</h2>
        <p className="text-slate-600 text-sm mb-6">{error || 'Could not load brand data'}</p>
        <Link
          to="/brands"
          className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors"
        >
          ← Return to All Brands
        </Link>
      </div>
    );
  }

  const { brand, metrics, recentComplaints } = data;
  const resolutionRate = metrics?.resolutionRate || 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Brand Header Banner */}
      <section className="bg-white border-b border-slate-200 pt-10 pb-12 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Brand Identity */}
            <div className="flex items-center gap-5">
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 bg-slate-50 shadow-sm"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center font-black text-2xl text-rose-600">
                  {brand.name.charAt(0)}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{brand.name}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {brand.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-rose-600" />
                    <span>HQ Desk: <strong className="text-slate-800 font-mono">{brand.escalationEmail}</strong></span>
                  </span>
                  <span>•</span>
                  <span>{metrics.totalBranches} Monitored Branches</span>
                </div>
              </div>
            </div>

            {/* Role-sensitive Action */}
            {user?.role === 'brandowner' ? (
              <Link
                to="/brand-desk"
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all shrink-0"
              >
                <span>Brand Ops Desk</span>
              </Link>
            ) : user?.role === 'admin' ? (
              <Link
                to="/admin"
                className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 flex items-center gap-2 transition-all shrink-0"
              >
                <span>Moderate in Admin Desk</span>
              </Link>
            ) : (
              <Link
                to="/report"
                className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 flex items-center gap-2 transition-all shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report Issue at {brand.name}</span>
              </Link>
            )}
          </div>

          {/* Key KPI Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-200">
            {/* Resolution Rate */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-600 block mb-1">Resolution Rate</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600">{resolutionRate}%</span>
                <span className="text-[11px] text-slate-500 font-medium">corporate turnaround</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${resolutionRate}%` }}
                />
              </div>
            </div>

            {/* Total Complaints */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-600 block mb-1">Total Escalations</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{metrics.totalComplaints}</span>
                <span className="text-[11px] text-slate-500">logged cases</span>
              </div>
            </div>

            {/* Resolved Count */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-600 block mb-1">Cases Resolved</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-600">{metrics.resolvedCount}</span>
                <span className="text-[11px] text-slate-500">satisfactorily closed</span>
              </div>
            </div>

            {/* Branch Rating Average */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-600 block mb-1">Franchise Sentiment</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-600 flex items-center gap-1">
                  {brand.averageRating} <Star className="w-4 h-4 fill-amber-500 text-amber-500 inline" />
                </span>
                <span className="text-[11px] text-slate-500">/ 5.0 score</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Body: Branch Leaderboards & Complaints */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Branch Leaderboards: Worst vs Best */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Problematic Branches (Highest complaints / lowest rating) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Worst Performing Branches</h3>
                <p className="text-xs text-slate-600">Branches with highest complaints and repeated SLA breaches</p>
              </div>
            </div>

            {metrics.worstBranches && metrics.worstBranches.length > 0 ? (
              <div className="space-y-3">
                {metrics.worstBranches.map((b, idx) => (
                  <div
                    key={b._id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{b.branchName}</h4>
                        <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{b.city}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-rose-600 block">
                        {b.totalComplaints} complaint{b.totalComplaints !== 1 ? 's' : ''}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Rating: {b.ratingScore}★
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                No problematic branches with excessive complaint volume.
              </p>
            )}
          </div>

          {/* Top Performing Branches */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Top Responsive Branches</h3>
                <p className="text-xs text-slate-600">Franchises with high resolution compliance and positive feedback</p>
              </div>
            </div>

            {metrics.bestBranches && metrics.bestBranches.length > 0 ? (
              <div className="space-y-3">
                {metrics.bestBranches.map((b, idx) => (
                  <div
                    key={b._id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{b.branchName}</h4>
                        <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{b.city}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-600 block">
                        {b.resolvedComplaints} resolved
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Rating: {b.ratingScore}★
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                No branch benchmarks recorded yet.
              </p>
            )}
          </div>
        </div>

        {/* Category Breakdown Visual */}
        {metrics.categoryBreakdown && metrics.categoryBreakdown.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-4">
              Grievance Breakdown by Issue Type
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.categoryBreakdown.map((item) => (
                <div
                  key={item._id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs"
                >
                  <span className="text-xs font-semibold text-slate-600 block mb-1">
                    {item._id}
                  </span>
                  <span className="text-2xl font-black text-slate-900">{item.count}</span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {Math.round((item.count / (metrics.totalComplaints || 1)) * 100)}% of total brand complaints
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Brand Recent Complaints Feed */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Recent Grievances Filed Against {brand.name}
              </h3>
              <p className="text-xs text-slate-600">
                Audited timeline of customer submissions and resolution status
              </p>
            </div>
          </div>

          {recentComplaints && recentComplaints.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentComplaints.map((c) => (
                <ComplaintCard
                  key={c._id}
                  complaint={{ ...c, brandId: brand }}
                  onResolveClick={(item) => setResolvingComplaint(item)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500 text-xs">
              No grievances filed for {brand.name} yet.
            </div>
          )}
        </div>
      </main>

      {/* Resolve Modal */}
      <ResolveModal
        complaint={resolvingComplaint}
        isOpen={Boolean(resolvingComplaint)}
        onClose={() => setResolvingComplaint(null)}
        onSuccess={handleResolveSuccess}
      />
    </div>
  );
};

export default BrandScorecardPage;
