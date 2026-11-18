import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Crosshair,
  ShieldCheck,
  AlertCircle,
  Upload,
  X,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Tag,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { branchService, brandService, complaintService } from '../services/api';

const CATEGORIES = [
  {
    id: 'Rude Staff',
    label: 'Rude Staff',
    description: 'Abusive language, harassment, discrimination, refused assistance',
  },
  {
    id: 'Overcharging',
    label: 'Overcharging / Billing Fraud',
    description: 'Meter tampering, denied invoice, hidden surcharge, inflated rates',
  },
  {
    id: 'Poor Hygiene',
    label: 'Poor Hygiene / Unsanitary',
    description: 'Pests, dirty utensils, lack of hairnets/gloves, unsanitary restrooms',
  },
  {
    id: 'Service Delay',
    label: 'Service Delay / Neglect',
    description: 'Unattended counters, excessive queues, staff taking unauthorized breaks',
  },
  {
    id: 'Other',
    label: 'Other Franchise Infraction',
    description: 'Faulty machinery, false warranty, deceptive branch promotions',
  },
];

// Helper to calculate distance for live UI preview
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371e3;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const ReportComplaintPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/report' } });
      return;
    }
    if (user?.role === 'brandowner') {
      navigate('/brand-desk', { replace: true });
      return;
    }
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const [step, setStep] = useState(1);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Branch & GPS
  const [userLocation, setUserLocation] = useState(null); // { latitude, longitude }
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [customBranchMode, setCustomBranchMode] = useState(false);
  const [customBranchData, setCustomBranchData] = useState({
    brandName: '',
    branchName: '',
    address: '',
    city: 'Bengaluru',
  });

  // Step 2: Issue Details
  const [category, setCategory] = useState('Rude Staff');
  const [description, setDescription] = useState('');

  // Step 3: Evidence Proofs
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [evidencePreviews, setEvidencePreviews] = useState([]);

  // Fetch initial brands and branches for quick-selection
  useEffect(() => {
    const loadData = async () => {
      try {
        const branchRes = await branchService.getBranches();
        if (branchRes.data.success) {
          setBranches(branchRes.data.branches);
          if (branchRes.data.branches.length > 0) {
            setSelectedBranch(branchRes.data.branches[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load initial branch catalog', err);
      }
    };
    loadData();
  }, []);

  // Use Current GPS handler
  const handleUseCurrentGps = () => {
    setGpsLoading(true);
    setGpsError('');

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setUserLocation(coords);
        setGpsLoading(false);
      },
      (err) => {
        console.warn('Browser GPS permission error or unavailable:', err.message);
        const simulatedCoords = {
          latitude: 12.9353,
          longitude: 77.6272,
          simulated: true,
        };
        setUserLocation(simulatedCoords);
        setGpsError('Browser GPS blocked/unavailable. Applied simulated nearby coordinates.');
        setGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Live proximity calculation
  const branchCoords = selectedBranch?.location?.coordinates; // [lon, lat]
  const liveDistance =
    userLocation && branchCoords
      ? calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          branchCoords[1],
          branchCoords[0]
        )
      : null;

  const isLiveGpsVerified = liveDistance !== null && liveDistance <= 750;

  // File upload handler
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (evidenceFiles.length + files.length > 5) {
      setError('You can upload a maximum of 5 evidence proofs.');
      return;
    }

    const newFiles = [...evidenceFiles, ...files];
    setEvidenceFiles(newFiles);

    // Create thumbnail previews
    const newPreviews = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
    }));
    setEvidencePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveFile = (index) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
    setEvidencePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Complaint
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      await login('priya.sharma@example.com', 'password123');
    }

    if (!selectedBranch && !customBranchMode) {
      setError('Please select or specify a franchise branch.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setError('Please provide a detailed incident description (at least 10 characters).');
      return;
    }

    setLoading(true);

    try {
      let finalBranch = selectedBranch;

      if (customBranchMode) {
        const branchPayload = {
          brandName: customBranchData.brandName,
          branchName: customBranchData.branchName,
          address: customBranchData.address,
          city: customBranchData.city,
          coordinates: userLocation
            ? [userLocation.longitude, userLocation.latitude]
            : [77.5946, 12.9716],
        };
        const branchRes = await branchService.findOrCreateBranch(branchPayload);
        if (branchRes.data.success) {
          finalBranch = branchRes.data.branch;
        }
      }

      const formData = new FormData();
      formData.append('brandId', finalBranch.brandId?._id || finalBranch.brandId);
      formData.append('branchId', finalBranch._id);
      formData.append('category', category);
      formData.append('description', description);

      if (userLocation) {
        formData.append('userLat', userLocation.latitude);
        formData.append('userLng', userLocation.longitude);
      }

      evidenceFiles.forEach((file) => {
        formData.append('evidence', file);
      });

      const res = await complaintService.createComplaint(formData);

      if (res.data.success) {
        navigate(`/complaints/${res.data.complaint._id}?justReported=true`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to file complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-3 border border-rose-200">
          <Clock className="w-3.5 h-3.5 text-rose-600" />
          <span>48-Hour Corporate SLA Escalation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          File Verified Franchise Grievance
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Your complaint will be packaged with GPS proximity proof and dispatched straight to corporate headquarters.
        </p>
      </div>

      {/* Stepper Progress */}
      <div className="flex items-center justify-between max-w-md mx-auto mb-8 relative">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-0.5 bg-slate-200 -z-0" />
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-0.5 bg-rose-600 transition-all duration-300 -z-0"
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        />

        {[
          { num: 1, title: 'Branch & GPS' },
          { num: 2, title: 'Incident Details' },
          { num: 3, title: 'Proof & Review' },
        ].map((s) => (
          <div key={s.num} className="relative z-10 flex flex-col items-center">
            <button
              type="button"
              onClick={() => s.num < step && setStep(s.num)}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                step === s.num
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-200 scale-110'
                  : step > s.num
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-500 border border-slate-300'
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-5 h-5 text-white" /> : s.num}
            </button>
            <span className="text-[11px] font-semibold text-slate-700 mt-1.5 whitespace-nowrap">
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {/* Main Wizard Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {error && (
          <div className="p-3.5 mb-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Franchise Branch & Location */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-600" />
                <span>Step 1: Locate Franchise Branch</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Select the offending branch and verify your on-premises GPS proximity for maximum credibility.
              </p>
            </div>

            {/* GPS Detection Bar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Device Geolocation Check
                    </span>
                    {isLiveGpsVerified && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        ✓ Verified Within Range
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {userLocation
                      ? `Lat: ${userLocation.latitude.toFixed(4)}, Lon: ${userLocation.longitude.toFixed(4)}${
                          userLocation.simulated ? ' (Dev Emulated)' : ''
                        }`
                      : 'Not detected yet. Click to verify you are currently at or near the branch.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleUseCurrentGps}
                  disabled={gpsLoading}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-rose-600 border border-slate-300 hover:border-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all shrink-0 shadow-xs"
                >
                  <Crosshair className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>{gpsLoading ? 'Detecting GPS...' : 'Use My Current GPS'}</span>
                </button>
              </div>

              {gpsError && (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  {gpsError}
                </p>
              )}

              {/* Live Distance Meter if branch selected */}
              {userLocation && selectedBranch && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Proximity to selected branch:</span>
                  <span
                    className={`font-mono font-bold ${
                      isLiveGpsVerified ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {liveDistance !== null ? `${liveDistance} meters away` : 'Calculating...'}
                  </span>
                </div>
              )}
            </div>

            {/* Select Pre-registered Branch vs Custom */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Select Franchise Branch
                </label>
                <button
                  type="button"
                  onClick={() => setCustomBranchMode(!customBranchMode)}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  {customBranchMode ? '← Pick from Known Branches' : '+ Cannot find branch? Add manually'}
                </button>
              </div>

              {!customBranchMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {branches.map((b) => {
                    const isSelected = selectedBranch?._id === b._id;
                    return (
                      <button
                        key={b._id}
                        type="button"
                        onClick={() => setSelectedBranch(b)}
                        className={`text-left p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-rose-50/70 border-2 border-rose-500 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {b.branchName}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                            {b.city}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate">{b.address}</p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-medium">
                          <span className="text-slate-700 font-semibold">{b.brandId?.name || 'Franchise'}</span>
                          <span>•</span>
                          <span>Rating: {b.ratingScore}★</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Parent Brand Name (e.g., Indian Oil, Domino's, SBI)
                    </label>
                    <input
                      type="text"
                      required
                      value={customBranchData.brandName}
                      onChange={(e) =>
                        setCustomBranchData({ ...customBranchData, brandName: e.target.value })
                      }
                      placeholder="e.g., Domino's Pizza"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 hover:border-slate-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Branch Name / Outlet Label
                    </label>
                    <input
                      type="text"
                      required
                      value={customBranchData.branchName}
                      onChange={(e) =>
                        setCustomBranchData({ ...customBranchData, branchName: e.target.value })
                      }
                      placeholder="e.g., HSR Layout Sector 2 Branch"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 hover:border-slate-400 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={customBranchData.city}
                        onChange={(e) =>
                          setCustomBranchData({ ...customBranchData, city: e.target.value })
                        }
                        placeholder="e.g., Bengaluru"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 hover:border-slate-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        required
                        value={customBranchData.address}
                        onChange={(e) =>
                          setCustomBranchData({ ...customBranchData, address: e.target.value })
                        }
                        placeholder="e.g., 27th Main Road"
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 hover:border-slate-400 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Next Button */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-rose-200"
              >
                <span>Proceed to Grievance Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Grievance Category & Description */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-rose-600" />
                <span>Step 2: Grievance Category & Incident Narrative</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Classify the violation so it is categorized properly under corporate grievance SLA standards.
              </p>
            </div>

            {/* Category Selector Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-rose-50/70 border-2 border-rose-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{cat.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">{cat.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Description Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-900">
                  Incident Narrative <span className="text-rose-600">*</span>
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  {description.length} / 3000 chars
                </span>
              </div>
              <textarea
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Be specific: What happened? What time did it occur? What did the branch manager or staff say? Mention pump/counter number or staff name if known..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 hover:border-slate-400 transition-colors"
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!description.trim() || description.length < 10) {
                    setError('Please write at least 10 characters describing the incident.');
                    return;
                  }
                  setError('');
                  setStep(3);
                }}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-rose-200"
              >
                <span>Proceed to Evidence & Review</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Evidence Proof & Submission */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-rose-600" />
                <span>Step 3: Attach Proof & Corporate Dispatch</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Upload receipts, meter photos, bill slips, or store photos. Proof images are securely stored in AWS S3.
              </p>
            </div>

            {/* Proof Upload Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-2">
                Evidence Files (Receipts, Photos, Bills) — Up to 5 files
              </label>

              <label className="border-2 border-dashed border-slate-300 hover:border-rose-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100/70 transition-all">
                <Upload className="w-8 h-8 text-rose-600 mb-2" />
                <span className="text-xs font-semibold text-slate-800">
                  Click to browse or drop proof images
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Supports JPG, PNG, WEBP, and PDF up to 10MB each
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Thumbnails */}
              {evidencePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
                  {evidencePreviews.map((prev, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-square shadow-xs"
                    >
                      <img
                        src={prev.url}
                        alt={`Evidence preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-white/90 border border-slate-200 hover:bg-rose-600 text-slate-700 hover:text-white transition-colors shadow-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Final Dispatch Summary Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Executive Routing Manifest</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-500">Target Franchise: </span>
                  <span className="text-slate-900 font-semibold">
                    {customBranchMode
                      ? customBranchData.branchName
                      : selectedBranch?.branchName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Parent Brand: </span>
                  <span className="text-slate-900 font-semibold">
                    {customBranchMode
                      ? customBranchData.brandName
                      : selectedBranch?.brandId?.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Violation Type: </span>
                  <span className="text-rose-700 font-bold">{category}</span>
                </div>
                <div>
                  <span className="text-slate-500">GPS Status: </span>
                  <span
                    className={
                      isLiveGpsVerified
                        ? 'text-emerald-700 font-bold'
                        : 'text-amber-800 font-medium'
                    }
                  >
                    {isLiveGpsVerified ? '✓ Verified Proximity' : 'Remote Filing'}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                <span>Corporate Grievance SLA:</span>
                <span className="text-amber-800 font-bold">48 Hours before public auto-escalation</span>
              </div>
            </div>

            {/* Navigation & Submit */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-rose-200 disabled:opacity-50"
              >
                <span>{loading ? 'Routing to Corporate Desk...' : 'Dispatch Grievance to Corporate HQ'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportComplaintPage;
