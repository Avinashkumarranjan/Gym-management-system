import React, { useState, useEffect } from 'react';
import {
  Award,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  UserCheck,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Sparkles,
  Calendar,
  Target,
} from 'lucide-react';
import adminService from '../../services/adminService';
import memberService from '../../services/memberService';
import Button from '../../components/common/Button';

const AdminTrainerAssignments = () => {
  const [requests, setRequests] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  // Modal State for assigning coach
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [reqRes, trainersRes] = await Promise.all([
        adminService.getTrainerAssignments({ status: filterStatus }),
        memberService.getAvailableTrainers(),
      ]);

      if (reqRes.success) {
        setRequests(reqRes.data || []);
        setPendingCount(reqRes.pendingCount || 0);
      }
      if (trainersRes.success) {
        setTrainers(trainersRes.data || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load trainer assignments.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const handleOpenAssignModal = (request) => {
    setSelectedRequest(request);
    // Pre-select requested trainer if available, else first active trainer
    setSelectedTrainerId(
      request.requestedTrainer?._id || (trainers.length > 0 ? trainers[0]._id : '')
    );
    setAssignNotes('');
    setActionSuccess('');
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setSelectedTrainerId('');
    setAssignNotes('');
  };

  const handleAssignTrainer = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !selectedTrainerId) return;

    try {
      setSubmitting(true);
      const res = await adminService.assignTrainerToRequest(
        selectedRequest._id,
        selectedTrainerId,
        assignNotes
      );
      if (res.success) {
        setActionSuccess(res.message);
        setTimeout(() => {
          handleCloseModal();
          fetchData();
        }, 1200);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to assign trainer.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.member?.name?.toLowerCase().includes(q) ||
      r.member?.email?.toLowerCase().includes(q) ||
      r.requestedTrainer?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" /> Member Coaching Matching
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Trainer Assignment Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Review active members waiting for coach allocation and pair them with certified trainers.
          </p>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-4 py-3 rounded-2xl">
          <Clock className="w-6 h-6 text-amber-400 shrink-0" />
          <div>
            <div className="text-2xl font-black text-white">{pendingCount}</div>
            <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
              Pending Allocations
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm w-fit">
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'approved'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Approved
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Requests
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search member or coach..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Main Content Table */}
      {loading ? (
        <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Loading assignment requests...
          </p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-3xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            Retry Fetching
          </Button>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <UserCheck className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Requests Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filterStatus === 'pending'
              ? 'All active members currently have coaches assigned or no pending matching requests exist.'
              : 'No matching trainer assignment records for this view.'}
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Membership Plan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Fitness Goal</th>
                  <th className="px-6 py-4">Requested Coach</th>
                  <th className="px-6 py-4">Request Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRequests.map((req) => {
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';

                  return (
                    <tr
                      key={req._id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Member */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                            {req.member?.name ? req.member.name.charAt(0).toUpperCase() : 'M'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {req.member?.name || 'Unknown Member'}
                            </div>
                            <div className="text-[11px] text-slate-500">{req.member?.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Membership Plan */}
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                          {req.memberProfile?.membershipPlan || 'Active Plan'}
                        </span>
                      </td>

                      {/* Membership Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            req.memberProfile?.membershipStatus === 'active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {req.memberProfile?.membershipStatus || 'active'}
                        </span>
                      </td>

                      {/* Fitness Goal */}
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 capitalize">
                        {req.memberProfile?.fitnessGoal
                          ? req.memberProfile.fitnessGoal.replace(/_/g, ' ')
                          : 'General Fitness'}
                      </td>

                      {/* Requested Coach */}
                      <td className="px-6 py-4">
                        {req.requestedTrainer ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {req.requestedTrainer.name}
                            </span>
                            <span className="text-[10px] text-primary-500 font-bold bg-primary-50 dark:bg-primary-950/60 px-1.5 py-0.5 rounded">
                              Preferred
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Any Available Coach</span>
                        )}
                      </td>

                      {/* Request Date */}
                      <td className="px-6 py-4 text-slate-500 text-[11px]">
                        {new Date(req.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        {isPending ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenAssignModal(req)}
                            className="inline-flex items-center gap-1.5 text-xs py-1.5 px-3.5 shadow-sm"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Assign Coach
                          </Button>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4" /> Assigned
                          </span>
                        ) : (
                          <span className="text-slate-400 capitalize">{req.status}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-6 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Assign Certified Coach
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pair athlete with their designated gym coach.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {actionSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-black text-emerald-700 dark:text-emerald-300">
                  {actionSuccess}
                </h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Member profile updated and in-app notifications dispatched.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAssignTrainer} className="space-y-5">
                {/* Member Info Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Athlete
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {selectedRequest.member?.name}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {selectedRequest.member?.email}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Plan Enrolled
                    </span>
                    <span className="text-xs font-bold text-primary-500">
                      {selectedRequest.memberProfile?.membershipPlan || 'Active Plan'}
                    </span>
                  </div>
                </div>

                {/* Trainer Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Select Active Trainer:
                  </label>
                  <select
                    value={selectedTrainerId}
                    onChange={(e) => setSelectedTrainerId(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-2xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose certified coach --</option>
                    {trainers.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} — {t.specializations?.join(', ') || 'General Fitness'} (
                        {t.experienceYears || 0} yrs exp)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional Admin Notes */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Admin Notes (Optional):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Member requested focus on barbell mechanics and fat loss."
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-white resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCloseModal}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={submitting}
                    disabled={!selectedTrainerId || submitting}
                  >
                    Confirm Assignment
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTrainerAssignments;
