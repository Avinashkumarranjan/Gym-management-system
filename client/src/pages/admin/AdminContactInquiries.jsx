import React, { useState, useEffect } from 'react';
import {
  Mail,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Phone,
  Calendar,
  X,
  Save,
  Loader2,
} from 'lucide-react';
import contactService from '../../services/contactService';
import Button from '../../components/common/Button';

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  in_progress: { label: 'In Progress', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  resolved: { label: 'Resolved', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

const AdminContactInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected inquiry for detail modal
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [modalStatus, setModalStatus] = useState('new');
  const [modalNotes, setModalNotes] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
      };
      const res = await contactService.getInquiries(params);
      if (res.success) {
        setInquiries(res.data);
        setTotalPages(res.pagination.pages || 1);
        setTotalCount(res.pagination.total || 0);
      }
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchInquiries();
  };

  const handleOpenDetail = (inquiry) => {
    setSelectedInquiry(inquiry);
    setModalStatus(inquiry.status);
    setModalNotes(inquiry.adminNotes || '');
    setNoteSuccess(false);
  };

  const handleCloseDetail = () => {
    setSelectedInquiry(null);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedInquiry) return;
    try {
      setModalStatus(newStatus);
      await contactService.updateStatus(selectedInquiry._id, newStatus);
      // Update local state
      setInquiries((prev) =>
        prev.map((item) => (item._id === selectedInquiry._id ? { ...item, status: newStatus } : item))
      );
      setSelectedInquiry((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    try {
      setSavingNote(true);
      setNoteSuccess(false);
      await contactService.updateNotes(selectedInquiry._id, modalNotes);
      setInquiries((prev) =>
        prev.map((item) => (item._id === selectedInquiry._id ? { ...item, adminNotes: modalNotes } : item))
      );
      setSelectedInquiry((prev) => ({ ...prev, adminNotes: modalNotes }));
      setNoteSuccess(true);
      setTimeout(() => setNoteSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Contact Inquiries
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage inquiries, membership queries, and direct outreach from prospective members.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary-500/10 text-primary-500 border border-primary-500/20">
            Total Inquiries: {totalCount}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-sm font-medium">Loading inquiries...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Mail className="w-12 h-12 text-slate-400 mx-auto opacity-50" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              No inquiries found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              There are no messages matching your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">Sender Details</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm">
                {inquiries.map((item) => {
                  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.new;
                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.email}
                          </p>
                          {item.phone && (
                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {item.phone}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">
                        {item.subject}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {cfg.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleOpenDetail(item)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={ChevronRight}
                iconPosition="right"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Inquiry Details
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Submitted on {new Date(selectedInquiry.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleCloseDetail}
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Sender Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Sender Name:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                    {selectedInquiry.name}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Email:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                    <a href={`mailto:${selectedInquiry.email}`} className="text-primary-500 hover:underline">
                      {selectedInquiry.email}
                    </a>
                  </p>
                </div>
                {selectedInquiry.phone && (
                  <div>
                    <span className="text-slate-400 font-medium">Phone:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                      <a href={`tel:${selectedInquiry.phone}`} className="text-primary-500 hover:underline">
                        {selectedInquiry.phone}
                      </a>
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 font-medium">Status:</span>
                  <div className="mt-1 flex items-center gap-2">
                    <select
                      value={modalStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-white text-xs focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Subject & Message */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Subject
                </label>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white text-base">
                  {selectedInquiry.subject}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Message Content
                </label>
                <div className="mt-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Admin Internal Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Admin Internal Notes
                  </label>
                  {noteSuccess && (
                    <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                    </span>
                  )}
                </div>
                <textarea
                  rows="3"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Record call summary, lead assignment notes, or resolution details..."
                  className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/30">
              <Button variant="secondary" onClick={handleCloseDetail}>
                Close
              </Button>
              <Button
                variant="primary"
                icon={Save}
                loading={savingNote}
                onClick={handleSaveNotes}
              >
                Save Notes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContactInquiries;
