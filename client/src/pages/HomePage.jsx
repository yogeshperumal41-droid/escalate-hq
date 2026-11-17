import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Building,
  PlusCircle,
} from 'lucide-react';
import ComplaintCard from '../components/ComplaintCard';
import FilterBar from '../components/FilterBar';
import ResolveModal from '../components/ResolveModal';
import { complaintService, brandService, statsService } from '../services/api';

const HomePage = () => {
  const [complaints, setComplaints] = useState([]);
  const [brands, setBrands] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolvingComplaint, setResolvingComplaint] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    city: 'All',
    brandId: '',
    category: 'All',
    status: 'All',
    isGpsVerified: false,
  });

  const fetchOverview = async () => {
    try {
      const res = await statsService.getOverview();
      if (res.data.success) {
        setMetrics(res.data.metrics);
      }
    } catch (e) {
      console.warn('Could not fetch metrics overview', e);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await brandService.getBrands();
      if (res.data.success) {
        setBrands(res.data.brands);
      }
    } catch (e) {
      console.warn('Could not fetch brands', e);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.city && filters.city !== 'All') params.city = filters.city;
      if (filters.brandId) params.brandId = filters.brandId;
      if (filters.category && filters.category !== 'All') params.category = filters.category;
      if (filters.status && filters.status !== 'All') params.status = filters.status;
      if (filters.isGpsVerified) params.isGpsVerified = 'true';

      const res = await complaintService.getComplaints(params);
      if (res.data.success) {
        setComplaints(res.data.complaints);
      }
    } catch (e) {
      console.error('Error fetching complaints', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchBrands();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchComplaints();
    }, 250);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      city: 'All',
      brandId: '',
      category: 'All',
      status: 'All',
      isGpsVerified: false,
    });
  };

  const handleResolveSuccess = (updatedComplaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c._id === updatedComplaint._id ? updatedComplaint : c))
    );
    fetchOverview();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 border-b border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mb-6 shadow-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Direct Corporate Escalation & GPS Proof Protocol</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
              Rude Staff? Overcharging?{' '}
              <span className="text-rose-600">
                Route Directly to Corporate HQ.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8">
              Local franchise branches often ignore customer grievances. <strong>EscalateHQ</strong> bypasses store managers, delivers GPS-verified evidence directly to parent headquarters, and enforces an autonomous <strong>48-hour resolution SLA</strong>.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/report"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 group"
              >
                <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                <span>Report Franchise Incident Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/brands"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Building className="w-4 h-4 text-rose-600" />
                <span>Explore Brand Scorecards</span>
              </Link>
            </div>
          </div>

          {/* Platform Metrics Bar */}
          {metrics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-12 pt-8 border-t border-slate-200">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">{metrics.totalComplaints}</p>
                  <p className="text-xs text-slate-500 font-medium">Total Grievances Filed</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-amber-600">{metrics.openComplaints}</p>
                  <p className="text-xs text-slate-500 font-medium">Under 48h SLA Clock</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
                <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-rose-600">{metrics.escalatedComplaints}</p>
                  <p className="text-xs text-slate-500 font-medium">SLA Breached / Escalated</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-600">{metrics.resolutionRate}%</p>
                  <p className="text-xs text-slate-500 font-medium">Brand Resolution Rate</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content: Filter & Complaints Feed */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Live Transparency Feed
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Real-time feed of consumer grievances across petrol pumps, banks, dining, and retail franchises.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-600">Live SLA Sentinel Active</span>
          </div>
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          brands={brands}
          totalCount={complaints.length}
        />

        {/* Complaints Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-white border border-slate-200 shadow-sm animate-pulse"
              />
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <ShieldAlert className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">
              No grievances found matching criteria
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto mb-6">
              Try adjusting your city, brand, or category filters to explore grievances across other regions.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition-colors border border-slate-200"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaints.map((complaint) => (
              <ComplaintCard
                key={complaint._id}
                complaint={complaint}
                onResolveClick={(c) => setResolvingComplaint(c)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Resolution Modal */}
      <ResolveModal
        complaint={resolvingComplaint}
        isOpen={Boolean(resolvingComplaint)}
        onClose={() => setResolvingComplaint(null)}
        onSuccess={handleResolveSuccess}
      />
    </div>
  );
};

export default HomePage;
