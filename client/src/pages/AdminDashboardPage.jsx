import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Clock,
  Play,
  Mail,
  Shield,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { complaintService, statsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusPill from '../components/StatusPill';
import ResolveModal from '../components/ResolveModal';
import { formatDate, timeAgo, getRemainingSlaHours } from '../utils/formatters';

const AdminDashboardPage = () => {
  const { user, setShowDemoModal } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState(null);
  const [resolvingComplaint, setResolvingComplaint] = useState(null);
  const [activeTab, setActiveTab] = useState('sla'); // 'sla' or 'emails'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, emailRes] = await Promise.all([
        complaintService.getComplaints({ limit: 50 }),
        statsService.getEmailLogs(),
      ]);
      if (compRes.data.success) setComplaints(compRes.data.complaints);
      if (emailRes.data.success) setEmailLogs(emailRes.data.logs);
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTriggerCron = async () => {
    setCronRunning(true);
    setCronResult(null);
    try {
      const res = await complaintService.triggerCron();
      if (res.data.success) {
        setCronResult(res.data.result);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to trigger cron job', err);
    } finally {
      setCronRunning(false);
    }
  };

  const openTickets = complaints.filter((c) => c.status === 'Open');
  const escalatedTickets = complaints.filter((c) => c.status === 'Escalated');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <Sliders className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Corporate Grievance & SLA Operations Desk
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Monitor 48-hour SLA countdowns, review outgoing corporate grievance emails, and trigger cron auto-escalations.
          </p>
        </div>

        {/* Action: Trigger Cron */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-300 transition-colors shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleTriggerCron}
            disabled={cronRunning}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            title="Runs Node-Cron 48-hour SLA scan immediately"
          >
            <Play className={`w-3.5 h-3.5 ${cronRunning ? 'animate-spin' : ''}`} />
            <span>{cronRunning ? 'Scanning Overdue SLA...' : 'Run 48h SLA Cron Now'}</span>
          </button>
        </div>
      </div>

      {/* Cron Result Alert */}
      {cronResult && (
        <div className="p-4 mb-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Cron SLA Job Finished:</strong> Scanned {cronResult.overdueFound} tickets past 48h deadline. Upgraded {cronResult.escalatedCount} ticket(s) to <strong>Escalated</strong> status.
            </span>
          </div>
          <button
            onClick={() => setCronResult(null)}
            className="text-amber-800 hover:text-amber-900 text-xs font-bold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Role Notice */}
      <div className="p-4 mb-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-rose-600" />
          <span className="text-slate-700">
            Active Role: <strong className="text-rose-600 uppercase font-bold">{user?.role || 'Guest'}</strong> ({user?.name || 'Unauthenticated'})
          </span>
        </div>
        <button
          onClick={() => setShowDemoModal(true)}
          className="text-amber-700 hover:underline font-semibold"
        >
          Switch to Brand Admin or Super Admin →
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('sla')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'sla'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>SLA Queue ({openTickets.length} Open, {escalatedTickets.length} Escalated)</span>
        </button>

        <button
          onClick={() => setActiveTab('emails')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'emails'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Corporate Nodemailer Logs ({emailLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: SLA Queue */}
      {activeTab === 'sla' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Franchise Grievances Awaiting Resolution
              </h3>
              <span className="text-xs text-slate-500 font-medium">Sorted by SLA Urgency</span>
            </div>

            <div className="divide-y divide-slate-100">
              {complaints.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No grievances found.
                </div>
              ) : (
                complaints.map((c) => {
                  const remaining = getRemainingSlaHours(c.createdAt, c.status);
                  return (
                    <div
                      key={c._id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            #{c.ticketId}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {c.brandId?.name}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-xs text-slate-600">
                            {c.branchId?.branchName} ({c.branchId?.city})
                          </span>
                          <StatusPill status={c.status} size="sm" />
                        </div>
                        <p className="text-xs text-slate-700 line-clamp-1">
                          "{c.description}"
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span>Reported {timeAgo(c.createdAt)}</span>
                          <span>•</span>
                          <span>Category: <strong className="text-slate-700">{c.category}</strong></span>
                          <span>•</span>
                          <span>Proof: {c.evidenceUrls?.length || 0} file(s)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        {c.status === 'Open' && (
                          <div className="text-right text-xs">
                            <span className="text-[10px] text-slate-500 block font-medium">SLA Remaining</span>
                            <span className="font-mono font-bold text-amber-700">
                              {remaining > 0 ? `${remaining}h` : 'Breach imminent'}
                            </span>
                          </div>
                        )}

                        {c.status !== 'Resolved' && (
                          <button
                            onClick={() => setResolvingComplaint(c)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                          >
                            Resolve Ticket
                          </button>
                        )}

                        <a
                          href={`/complaints/${c._id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-all"
                        >
                          View Details
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Corporate Nodemailer Logs */}
      {activeTab === 'emails' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              Dispatched Corporate Escalation Emails
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Real-time dispatch log of emails triggered by EscalateHQ to corporate grievance desks via Nodemailer.
            </p>

            {emailLogs.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                No outgoing emails logged in this session yet. File a complaint to trigger a dispatch!
              </div>
            ) : (
              <div className="space-y-3">
                {emailLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-bold text-slate-900">{log.subject}</span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {formatDate(log.sentAt)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-slate-600">
                      <span>Recipient: <strong className="text-rose-600 font-mono">{log.to}</strong></span>
                      <span>•</span>
                      <span>Ticket: <strong className="text-slate-800 font-mono">{log.ticketId || 'N/A'}</strong></span>
                    </div>

                    {log.previewUrl && (
                      <div className="pt-2 border-t border-slate-200">
                        <a
                          href={log.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 hover:underline font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Rendered Email in Ethereal Sandbox →</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      <ResolveModal
        complaint={resolvingComplaint}
        isOpen={Boolean(resolvingComplaint)}
        onClose={() => setResolvingComplaint(null)}
        onSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
};

export default AdminDashboardPage;
