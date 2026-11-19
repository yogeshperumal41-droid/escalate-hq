import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Send,
  ExternalLink,
  Filter,
  CheckCircle2,
  Sliders,
  Building,
  Star,
  RefreshCw,
  Search,
  Map,
  X,
  Compass,
} from 'lucide-react';
import { branchService, brandService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CITIES = ['All', 'Bengaluru', 'New Delhi', 'Mumbai'];
const LIMIT_THRESHOLDS = [
  { value: 1, label: '1+ Complaint (All)' },
  { value: 2, label: '2+ Complaints (Elevated)' },
  { value: 3, label: '3+ Complaints (Critical Limit)', default: true },
  { value: 5, label: '5+ Complaints (Severe)' },
];

const PRESET_REASONS = [
  'Persistent rude staff behavior and harassment exceeding branch tolerance threshold.',
  'Chronic overcharging, hidden billing surcharges, and refusal of receipts.',
  'Severe hygiene and sanitation violations continuously reported by customers.',
  'Unacceptable service delays and refusal to accept corporate customer complaints.',
];

const CriticalFranchiseMapPage = () => {
  const { user, isAuthenticated } = useAuth();

  const [branches, setBranches] = useState([]);
  const [metrics, setMetrics] = useState({
    totalMonitoredBranches: 0,
    criticalLimitThreshold: 3,
    exceededBranchesCount: 0,
    totalComplaintsInCritical: 0,
    topCriticizedCity: 'N/A',
    totalCorporateAlertsDispatched: 0,
  });

  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(3);
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [onlyExceeded, setOnlyExceeded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Reporting Modal State
  const [reportingBranch, setReportingBranch] = useState(null);
  const [reportReason, setReportReason] = useState(PRESET_REASONS[0]);
  const [reporterName, setReporterName] = useState(user?.name || '');
  const [reporterEmail, setReporterEmail] = useState(user?.email || '');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccessMessage, setReportSuccessMessage] = useState('');
  const [reportError, setReportError] = useState('');

  // Fetch critical branches from backend
  const fetchCriticalBranches = async () => {
    setLoading(true);
    try {
      const params = {
        limit,
        city: selectedCity,
        onlyExceeded: onlyExceeded ? 'true' : 'false',
      };
      if (selectedBrand !== 'All') {
        params.brandId = selectedBrand;
      }

      const res = await branchService.getCriticalBranches(params);
      if (res.data.success) {
        setBranches(res.data.branches || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
        if (res.data.branches?.length > 0 && !selectedBranch) {
          setSelectedBranch(res.data.branches[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load critical branches on map radar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriticalBranches();
  }, [limit, selectedCity, selectedBrand, onlyExceeded]);

  // Handle reporting chronic branch to corporate HQ
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportingBranch) return;

    setSubmittingReport(true);
    setReportError('');
    setReportSuccessMessage('');

    try {
      const payload = {
        reason: reportReason,
        limitThreshold: limit,
        reporterName: reporterName || user?.name || 'Concerned Consumer',
        reporterEmail: reporterEmail || user?.email || 'consumer@escalatehq.org',
      };

      const res = await branchService.reportCriticalBranch(reportingBranch._id, payload);
      if (res.data.success) {
        setReportSuccessMessage(
          `Official grievance notice successfully dispatched to ${
            reportingBranch.brandId?.name || 'Corporate HQ'
          } Grievance Directorate!`
        );

        // Update branch state locally
        setBranches((prev) =>
          prev.map((b) =>
            b._id === reportingBranch._id
              ? {
                  ...b,
                  isCriticallyFlagged: true,
                  criticAlertsCount: (b.criticAlertsCount || 0) + 1,
                  lastCriticalReportAt: new Date().toISOString(),
                }
              : b
          )
        );

        setMetrics((prev) => ({
          ...prev,
          totalCorporateAlertsDispatched: prev.totalCorporateAlertsDispatched + 1,
        }));

        setTimeout(() => {
          setReportingBranch(null);
          setReportSuccessMessage('');
        }, 2500);
      }
    } catch (err) {
      console.error('Failed to report chronic branch:', err);
      setReportError(
        err.response?.data?.message || 'Failed to submit critical report. Please retry.'
      );
    } finally {
      setSubmittingReport(false);
    }
  };

  // Filter branches locally by search query
  const filteredBranches = branches.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.branchName.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q) ||
      b.brandId?.name?.toLowerCase().includes(q)
    );
  });

  const activeBranchCoords = selectedBranch?.location?.coordinates || [77.6271, 12.9352]; // [lon, lat]
  const googleMapsUrl = selectedBranch
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${selectedBranch.branchName}, ${selectedBranch.address}, ${selectedBranch.city}`
      )}`
    : 'https://maps.google.com';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-slate-50">
      {/* Top Header Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>Google Maps Grievance Radar</span>
            </span>
            <span className="text-xs text-slate-500 font-mono">Live Proximity & Chronic Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Chronically Criticized Franchise Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
            Identifies local branches crossing corporate grievance limits on Google Maps. If a franchise exceeds
            the tolerance threshold, consumers can officially report it to corporate headquarters for urgent audit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCriticalBranches}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : ''}`} />
            <span>Refresh Radar</span>
          </button>
          <Link
            to="/report"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 flex items-center gap-1.5 transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>File New Incident</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Critical Limit Threshold</span>
            <Sliders className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {limit} <span className="text-xs font-normal text-slate-500">complaints limit</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Tolerance threshold on radar</p>
        </div>

        <div className="bg-white border border-rose-200 bg-rose-50/40 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold mb-1">
            <span>Limit Exceeded Branches</span>
            <Flame className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {metrics.exceededBranchesCount}
          </div>
          <p className="text-[11px] text-rose-700 font-medium mt-1">Branches crossing critical limit</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>High-Grievance Hotspot</span>
            <MapPin className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 truncate">
            {metrics.topCriticizedCity}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">City with most chronic branches</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>HQ Escalation Notices</span>
            <Send className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {metrics.totalCorporateAlertsDispatched}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Audits dispatched to corporate HQs</p>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Threshold Limit Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
              <Sliders className="w-3.5 h-3.5 text-rose-600" />
              <span>Criticism Limit:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {LIMIT_THRESHOLDS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setLimit(t.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    limit === t.value
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search branch name or address..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Second Row: City and Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Filter City:</span>
            <div className="flex items-center gap-1">
              {CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCity(c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedCity === c
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={onlyExceeded}
              onChange={(e) => setOnlyExceeded(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
            />
            <span>Show ONLY branches exceeding limit ({limit}+ complaints)</span>
          </label>
        </div>
      </div>

      {/* Split Interactive View: Google Map Visualizer + Branch Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Interactive Map Radar View (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {/* Map Canvas Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-rose-400 animate-spin" style={{ animationDuration: '8s' }} />
                <div>
                  <h3 className="font-bold text-sm">Interactive Google Maps Radar</h3>
                  <p className="text-[11px] text-slate-400">
                    Pins colored by complaint severity against limit threshold ({limit})
                  </p>
                </div>
              </div>

              {selectedBranch && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Google Maps</span>
                </a>
              )}
            </div>

            {/* Visual Interactive Map Frame */}
            <div className="relative bg-slate-100 h-96 sm:h-[460px] w-full overflow-hidden border-b border-slate-200 flex flex-col justify-between">
              {/* Google Map Mock/Live Visualization Layer */}
              <div className="absolute inset-0 opacity-80 pointer-events-none">
                <iframe
                  title="Google Map Canvas"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'contrast(1.05) saturate(1.1)' }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${activeBranchCoords[1]},${activeBranchCoords[0]}&z=14&output=embed`}
                />
              </div>

              {/* Floating Overlay: Branch Pin Indicators */}
              <div className="relative z-10 p-4 pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-3 shadow-md max-w-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Active Map Target
                    </span>
                    {selectedBranch?.isLimitExceeded ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] border border-rose-200 flex items-center gap-1 animate-pulse">
                        <Flame className="w-3 h-3 text-rose-600" />
                        <span>Limit Exceeded</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                        Under Threshold
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {selectedBranch?.branchName || 'Select a branch'}
                  </h4>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">
                    {selectedBranch?.address}, {selectedBranch?.city}
                  </p>

                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[11px]">
                    <span className="font-semibold text-rose-600">
                      {selectedBranch?.totalComplaints || 0} complaint{selectedBranch?.totalComplaints !== 1 ? 's' : ''}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1 font-medium">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                      <span>{selectedBranch?.ratingScore || 3.5}★</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Map Callout Button */}
              {selectedBranch && (
                <div className="relative z-10 p-4 flex justify-end pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => setReportingBranch(selectedBranch)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-300 flex items-center gap-1.5 transition-transform hover:scale-105"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Report This Branch to Corporate HQ</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Branches Pin Bar */}
            <div className="p-3 bg-slate-50 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap pl-1">
                Plotted Branches ({filteredBranches.length}):
              </span>
              {filteredBranches.map((b) => {
                const isSelected = selectedBranch?._id === b._id;
                return (
                  <button
                    key={b._id}
                    type="button"
                    onClick={() => setSelectedBranch(b)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all text-xs font-semibold ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-xs'
                        : b.isLimitExceeded
                        ? 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : b.isLimitExceeded ? 'text-rose-600' : 'text-slate-400'}`} />
                    <span>{b.branchName.split('-')[0].trim()}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      {b.totalComplaints}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Franchise List & Reporting Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Chronic Offender Watchlist</span>
            </h3>
            <span className="text-xs text-slate-500">
              Showing {filteredBranches.length} branch{filteredBranches.length !== 1 ? 'es' : ''}
            </span>
          </div>

          {filteredBranches.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-800 text-sm">No branches exceed current filter limit</p>
              <p className="mt-1">Try lowering the criticism limit threshold above to view all branches.</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredBranches.map((b) => {
                const isSelected = selectedBranch?._id === b._id;
                const isOverLimit = b.isLimitExceeded;

                return (
                  <div
                    key={b._id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-rose-50/60 border-2 border-rose-500 shadow-sm'
                        : isOverLimit
                        ? 'bg-white border-rose-200 hover:border-rose-400 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {b.brandId?.name || 'Parent Brand'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {b.city}
                          </span>
                          {isOverLimit && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <Flame className="w-3 h-3 text-rose-600" />
                              <span>Limit Exceeded ({b.totalComplaints} ≥ {limit})</span>
                            </span>
                          )}
                        </div>

                        <h4
                          onClick={() => setSelectedBranch(b)}
                          className="font-bold text-xs sm:text-sm text-slate-900 cursor-pointer hover:text-rose-600 transition-colors"
                        >
                          {b.branchName}
                        </h4>
                        <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                          {b.address}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xs font-black block ${isOverLimit ? 'text-rose-600' : 'text-slate-800'}`}>
                          {b.totalComplaints} complaint{b.totalComplaints !== 1 ? 's' : ''}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-0.5 justify-end font-medium mt-0.5">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                          <span>{b.ratingScore}★</span>
                        </span>
                      </div>
                    </div>

                    {/* Reporting Stats & Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <div className="text-[11px] text-slate-500">
                        {b.criticAlertsCount > 0 ? (
                          <span className="text-amber-800 font-semibold flex items-center gap-1">
                            <Send className="w-3 h-3 text-amber-600" />
                            <span>{b.criticAlertsCount} HQ Alert{b.criticAlertsCount !== 1 ? 's' : ''} Sent</span>
                          </span>
                        ) : (
                          <span>Corporate: {b.brandId?.escalationEmail || 'HQ Desk'}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedBranch(b)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                        >
                          Locate
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportingBranch(b)}
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 transition-all"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          <span>Report to HQ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Official Corporate Grievance Reporting Modal */}
      {reportingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => {
                setReportingBranch(null);
                setReportError('');
                setReportSuccessMessage('');
              }}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-rose-600">
                  Official Corporate Escalation
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Report Chronic Franchise to HQ
                </h3>
              </div>
            </div>

            {/* Target Branch Details Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-4">
              <div className="flex items-center justify-between mb-1">
                <strong className="text-slate-900 text-sm">{reportingBranch.branchName}</strong>
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                  {reportingBranch.totalComplaints} Complaints Recorded
                </span>
              </div>
              <p className="text-slate-600">{reportingBranch.address}, {reportingBranch.city}</p>
              <p className="text-slate-500 font-mono mt-1 text-[11px]">
                Target Corporate Grievance Email:{' '}
                <strong className="text-slate-800">
                  {reportingBranch.brandId?.escalationEmail || 'grievance@corporate-hq.com'}
                </strong>
              </p>
            </div>

            {reportSuccessMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 my-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Dispatched Successfully!</p>
                  <p className="mt-0.5">{reportSuccessMessage}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                {reportError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{reportError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Incident Pattern / Criticism Reason
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  >
                    {PRESET_REASONS.map((r, idx) => (
                      <option key={idx} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custom Audit Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Provide additional details on why this franchise exceeds tolerable limits..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reporter Name
                    </label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Your Name (e.g. Alex User)"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reporter Email
                    </label>
                    <input
                      type="email"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      placeholder="Your Email"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Submitting logs an official chronic offender audit dispatch and alerts the brand's Grievance Directorate.
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReportingBranch(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingReport ? 'Dispatching...' : 'Dispatch HQ Notice'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CriticalFranchiseMapPage;
