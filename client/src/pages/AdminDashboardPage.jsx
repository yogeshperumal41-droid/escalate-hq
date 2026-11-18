import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sliders,
  Clock,
  Play,
  Mail,
  Shield,
  RefreshCw,
  Building,
  Users,
  Trash2,
  AlertTriangle,
  PlusCircle,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
  X,
} from 'lucide-react';
import { complaintService, brandService, adminService, statsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusPill from '../components/StatusPill';
import { formatDate, timeAgo, getRemainingSlaHours } from '../utils/formatters';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('moderation'); // 'moderation' | 'brands' | 'users' | 'sla'
  const [loading, setLoading] = useState(true);

  // Data states
  const [complaints, setComplaints] = useState([]);
  const [brands, setBrands] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);

  // Action states
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState(null);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  // Add Brand Modal
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [newBrand, setNewBrand] = useState({
    name: '',
    category: 'Petrol Pump / Fuel',
    escalationEmail: '',
    logoUrl: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, brandRes, userRes, emailRes] = await Promise.all([
        complaintService.getComplaints({ limit: 100 }),
        brandService.getBrands(),
        adminService.getUsers(),
        statsService.getEmailLogs(),
      ]);

      if (compRes.data.success) setComplaints(compRes.data.complaints);
      if (brandRes.data.success) setBrands(brandRes.data.brands);
      if (userRes.data.success) setUsersList(userRes.data.users);
      if (emailRes.data.success) setEmailLogs(emailRes.data.logs);
    } catch (err) {
      console.error('Failed to load admin dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (text, type = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage({ text: '', type: '' }), 4000);
  };

  // 1. Force Escalate Complaint
  const handleForceEscalate = async (complaintId) => {
    try {
      const res = await complaintService.escalateComplaint(complaintId, {
        reason: 'Force-escalated by platform administrator audit',
      });
      if (res.data.success) {
        showNotification('Complaint forcefully escalated to Executive Directorate.');
        setComplaints((prev) =>
          prev.map((c) => (c._id === complaintId ? res.data.complaint : c))
        );
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to escalate ticket', 'error');
    }
  };

  // 2. Delete Fake / Spam Complaint
  const handleDeleteComplaint = async (complaintId) => {
    if (!window.confirm('Are you sure you want to delete this grievance record? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await complaintService.deleteComplaint(complaintId);
      if (res.data.success) {
        showNotification('Complaint ticket permanently deleted.');
        setComplaints((prev) => prev.filter((c) => c._id !== complaintId));
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to delete ticket', 'error');
    }
  };

  // 3. Create New Brand
  const handleCreateBrand = async (e) => {
    e.preventDefault();
    if (!newBrand.name || !newBrand.escalationEmail) {
      alert('Please fill out required brand details.');
      return;
    }
    try {
      const res = await brandService.createBrand(newBrand);
      if (res.data.success) {
        showNotification(`Brand '${newBrand.name}' registered successfully!`);
        setIsAddBrandOpen(false);
        setNewBrand({
          name: '',
          category: 'Petrol Pump / Fuel',
          escalationEmail: '',
          logoUrl: '',
        });
        fetchData();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to create brand', 'error');
    }
  };

  // 4. Delete Brand
  const handleDeleteBrand = async (brandId, brandName) => {
    if (!window.confirm(`Are you sure you want to remove '${brandName}'?`)) {
      return;
    }
    try {
      const res = await brandService.deleteBrand(brandId);
      if (res.data.success) {
        showNotification(`Brand '${brandName}' deleted.`);
        setBrands((prev) => prev.filter((b) => b._id !== brandId));
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to delete brand', 'error');
    }
  };

  // 5. Update User Role & Brand Assignment
  const handleUserRoleChange = async (userId, newRole, brandId = null) => {
    try {
      const res = await adminService.updateUserRole(userId, { role: newRole, brandId });
      if (res.data.success) {
        showNotification(`User role updated to '${newRole}'.`);
        setUsersList((prev) =>
          prev.map((u) => (u._id === userId ? res.data.user : u))
        );
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update user role', 'error');
    }
  };

  // 6. Trigger Cron Job
  const handleTriggerCron = async () => {
    setCronRunning(true);
    setCronResult(null);
    try {
      const res = await complaintService.triggerCron();
      if (res.data.success) {
        setCronResult(res.data.result);
        showNotification('Cron job triggered successfully.');
        await fetchData();
      }
    } catch (err) {
      showNotification('Failed to trigger cron job', 'error');
    } finally {
      setCronRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-slate-50">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Admin Control Panel & Moderation
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Platform governance: Manage franchise brands, assign Brand Owner permissions, moderate tickets, and enforce 48h corporate SLAs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-300 transition-colors shadow-xs"
            title="Refresh All Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddBrandOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-rose-200"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Parent Brand</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage.text && (
        <div
          className={`p-3.5 mb-6 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
            actionMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage({ text: '', type: '' })}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 flex-wrap">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'moderation'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Ticket Moderation ({complaints.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('brands')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'brands'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Brand Directory ({brands.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Role Management ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sla')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'sla'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>SLA Sentinel & Cron</span>
        </button>
      </div>

      {/* TAB 1: TICKET MODERATION */}
      {activeTab === 'moderation' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">
              All Platform Complaint Records (Moderation Queue)
            </h3>
            <span className="text-xs text-slate-500">
              Only platform admins can force-escalate or remove spam tickets.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Ticket ID</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Brand & Branch</th>
                  <th className="px-5 py-3.5">Complainant</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Filed</th>
                  <th className="px-5 py-3.5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      <Link to={`/complaints/${c._id}`} className="hover:text-rose-600 hover:underline">
                        #{c.ticketId}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">
                      {c.category}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{c.brandId?.name || 'Brand'}</p>
                      <p className="text-[11px] text-slate-500">{c.branchId?.branchName || 'Branch'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {c.userId?.name || 'Customer'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={c.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {timeAgo(c.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.status === 'Open' && (
                          <button
                            onClick={() => handleForceEscalate(c._id)}
                            className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold transition-colors"
                            title="Force Escalate to Executive Directorate"
                          >
                            Force Escalate
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteComplaint(c._id)}
                          className="p-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                          title="Delete Spam Ticket"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BRAND DIRECTORY */}
      {activeTab === 'brands' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {brands.map((b) => (
              <div
                key={b._id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={b.logoUrl}
                        alt={b.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white shadow-2xs"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{b.name}</h4>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          {b.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBrand(b._id, b.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Brand"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4 text-xs space-y-1">
                    <p className="text-slate-500">Corporate Grievance Routing:</p>
                    <p className="font-mono text-slate-800 font-bold truncate">{b.escalationEmail}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-center mb-4">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <p className="text-[10px] text-slate-400">Total Grievances</p>
                      <p className="font-bold text-slate-900 text-sm">{b.totalComplaints}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                      <p className="text-[10px] text-emerald-700">Resolved</p>
                      <p className="font-bold text-emerald-800 text-sm">{b.resolvedCount}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Resolution: <span className="font-bold text-slate-800">{b.resolutionRate}%</span>
                  </span>
                  <Link
                    to={`/brands/${b.slug}`}
                    className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700"
                  >
                    <span>View Public Card</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: USER ROLES MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Registered Users & Role Authority Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Grant 'brandowner' role and bind them to a specific parent brand, or assign platform 'admin' status.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600">{usersList.length} Accounts Registered</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">User Details</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Current Role</th>
                  <th className="px-5 py-3.5">Assigned Brand (for brandowner)</th>
                  <th className="px-5 py-3.5 text-right">Role Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-[10px] text-slate-400">Created: {formatDate(u.createdAt)}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {u.email}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block font-bold px-2 py-0.5 rounded text-[10px] border ${
                          u.role === 'user'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : u.role === 'brandowner'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.role === 'brandowner' ? (
                        <select
                          value={u.brandId?._id || ''}
                          onChange={(e) => handleUserRoleChange(u._id, 'brandowner', e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                        >
                          <option value="">-- Select Assigned Brand --</option>
                          {brands.map((b) => (
                            <option key={b._id} value={b._id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-slate-400 italic">N/A ({u.role})</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleUserRoleChange(u._id, e.target.value, u.brandId?._id || null)}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-rose-500"
                        >
                          <option value="user">user (Customer)</option>
                          <option value="brandowner">brandowner (Corporate Desk)</option>
                          <option value="admin">admin (Platform Auditor)</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SLA SENTINEL & CRON */}
      {activeTab === 'sla' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">Node-Cron 48-Hour SLA Daemon</h3>
              </div>
              <p className="text-xs text-slate-500">
                Hourly background worker scans Open grievances older than 48 hours and auto-escalates them to Executive Directorate.
              </p>
            </div>
            <button
              onClick={handleTriggerCron}
              disabled={cronRunning}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${cronRunning ? 'animate-spin' : ''}`} />
              <span>{cronRunning ? 'Scanning Overdue Tickets...' : 'Trigger Hourly Scan Now'}</span>
            </button>
          </div>

          {cronResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900">
              <p className="font-bold mb-1">Cron Job Execution Summary:</p>
              <p>Escalated {cronResult.escalatedCount} overdue tickets automatically.</p>
            </div>
          )}

          {/* Email Audit Logs */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-600" />
                <h4 className="font-bold text-slate-900 text-sm">Outgoing Corporate Grievance Emails</h4>
              </div>
              <span className="text-xs text-slate-500">Simulated Ethereal test mailbox</span>
            </div>

            <div className="divide-y divide-slate-100">
              {emailLogs.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-400">No emails dispatched in this session yet.</p>
              ) : (
                emailLogs.map((log, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{log.subject}</p>
                      <p className="text-[11px] text-slate-500">To: {log.to} • {formatDate(log.sentAt)}</p>
                    </div>
                    {log.previewUrl && (
                      <a
                        href={log.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1 border border-slate-200"
                      >
                        <span>View Ethereal Email</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Parent Brand Modal */}
      {isAddBrandOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Register Parent Brand</h3>
              <button
                onClick={() => setIsAddBrandOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBrand} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starbucks India"
                  value={newBrand.name}
                  onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Corporate Grievance Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. grievances@starbucks.in"
                  value={newBrand.escalationEmail}
                  onChange={(e) => setNewBrand({ ...newBrand, escalationEmail: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newBrand.category}
                  onChange={(e) => setNewBrand({ ...newBrand, category: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  <option value="Petrol Pump / Fuel">Petrol Pump / Fuel</option>
                  <option value="Banking & Finance">Banking & Finance</option>
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Retail & Supermarket">Retail & Supermarket</option>
                  <option value="Automobile Service">Automobile Service</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brand Logo Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newBrand.logoUrl}
                  onChange={(e) => setNewBrand({ ...newBrand, logoUrl: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBrandOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-200"
                >
                  Save Parent Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
