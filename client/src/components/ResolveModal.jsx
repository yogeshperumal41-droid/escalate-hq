import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { complaintService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ResolveModal = ({ complaint, isOpen = true, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [tokenInput, setTokenInput] = useState(complaint?.resolveToken || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      setError('Please provide resolution details / action taken.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let res;
      if (user?.role === 'brandowner') {
        res = await complaintService.resolveMyBrandComplaint(complaint._id, { resolutionNotes });
      } else {
        res = await complaintService.updateStatus(complaint._id, {
          status: 'Resolved',
          resolutionNotes,
          token: tokenInput || complaint.resolveToken,
        });
      }

      if (res.data.success) {
        onSuccess(res.data.complaint);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update resolution status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-lg">Mark Grievance Resolved</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
            <p><strong>Ticket ID:</strong> #{complaint.ticketId}</p>
            <p><strong>Franchise:</strong> {complaint.branchId?.branchName} ({complaint.branchId?.city})</p>
            <p><strong>Brand:</strong> {complaint.brandId?.name}</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resolution Action / Corporate Notes <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Detail actions taken: e.g. Store manager warned, customer given full refund & voucher, staff retrained on etiquette..."
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 hover:border-slate-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Resolution Security Token (From Email)
            </label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Pre-filled if accessed via email resolution link"
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 hover:border-slate-400 transition-colors"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Allows resolution directly from corporate escalation email without login.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResolveModal;
