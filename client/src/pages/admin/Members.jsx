import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  UserPlus,
  Eye,
  CheckCircle,
  XCircle,
  MoreVertical,
  Dumbbell,
} from 'lucide-react';
import adminService from '../../services/adminService';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import Pagination from '../../components/admin/Pagination';
import ConfirmModal from '../../components/admin/ConfirmModal';
import Button from '../../components/common/Button';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [membershipPlan, setMembershipPlan] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [sort, setSort] = useState('newest');

  // Pagination State
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Available plans for filter
  const [plans, setPlans] = useState([]);

  // Confirmation Modal state
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    member: null,
    targetState: false,
    loading: false,
  });

  const fetchPlans = async () => {
    try {
      const res = await adminService.getMembershipPlans();
      if (res.success) setPlans(res.data);
    } catch (e) {
      console.warn('Could not load plans for filter:', e.message);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: status || undefined,
        membershipPlan: membershipPlan || undefined,
        fitnessGoal: fitnessGoal || undefined,
        sort,
      };

      const res = await adminService.getMembers(params);
      if (res.success) {
        setMembers(res.data);
        setPages(res.pages);
        setTotal(res.total);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [page, status, membershipPlan, fitnessGoal, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMembers();
  };

  const handleToggleStatus = async () => {
    if (!statusModal.member) return;
    try {
      setStatusModal((prev) => ({ ...prev, loading: true }));
      await adminService.updateMemberStatus(statusModal.member._id, statusModal.targetState);
      setStatusModal({ isOpen: false, member: null, targetState: false, loading: false });
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update member status');
      setStatusModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const columns = [
    { header: 'Member' },
    { header: 'Contact' },
    { header: 'Membership' },
    { header: 'Coach' },
    { header: 'Join Date' },
    { header: 'Status' },
    { header: 'Actions', align: 'right' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Registered Athletes &amp; Members
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Search, filter, assign trainers, or review member subscriptions.
          </p>
        </div>

        <Button
          to="/admin/members/new"
          variant="primary"
          size="sm"
          icon={UserPlus}
          iconPosition="left"
        >
          Add New Member
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <Button type="submit" variant="primary" size="sm">
            Search
          </Button>
        </form>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Account Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Inactive Accounts</option>
          </select>

          {/* Membership Plan Filter */}
          <select
            value={membershipPlan}
            onChange={(e) => {
              setMembershipPlan(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Plans</option>
            {plans.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Fitness Goal Filter */}
          <select
            value={fitnessGoal}
            onChange={(e) => {
              setFitnessGoal(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Goals</option>
            <option value="weight_loss">Weight Loss</option>
            <option value="muscle_building">Muscle Building</option>
            <option value="strength">Strength</option>
            <option value="general_fitness">General Fitness</option>
            <option value="endurance">Endurance</option>
          </select>

          {/* Sorting */}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="name">Sort: By Name</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Members Table */}
      <DataTable
        columns={columns}
        data={members}
        loading={loading}
        emptyMessage="No members match the current filter criteria."
      >
        {members.map((member) => (
          <tr
            key={member._id}
            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
          >
            {/* Member Identity */}
            <td className="px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                  {member.user?.name ? member.user.name.charAt(0) : 'M'}
                </div>
                <div>
                  <Link
                    to={`/admin/members/${member._id}`}
                    className="font-bold text-slate-900 dark:text-white hover:text-primary-500 transition-colors"
                  >
                    {member.user?.name}
                  </Link>
                  <p className="text-[11px] text-slate-400 capitalize">
                    {member.fitnessGoal?.replace('_', ' ') || 'General Fitness'}
                  </p>
                </div>
              </div>
            </td>

            {/* Contact */}
            <td className="px-5 py-4 text-xs">
              <div className="text-slate-800 dark:text-slate-200">{member.user?.email}</div>
              <div className="text-slate-400">{member.user?.phone}</div>
            </td>

            {/* Membership */}
            <td className="px-5 py-4 text-xs">
              {member.membershipPlan ? (
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {member.membershipPlan.name}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    ₹{member.membershipPlan.price}
                  </p>
                </div>
              ) : (
                <span className="text-slate-400 italic">No plan</span>
              )}
            </td>

            {/* Coach */}
            <td className="px-5 py-4 text-xs">
              {member.assignedTrainer ? (
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {member.assignedTrainer.name}
                </span>
              ) : (
                <span className="text-slate-400 italic">Unassigned</span>
              )}
            </td>

            {/* Join Date */}
            <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
              {member.user?.createdAt
                ? new Date(member.user.createdAt).toLocaleDateString()
                : '—'}
            </td>

            {/* Status */}
            <td className="px-5 py-4">
              <StatusBadge status={member.user?.isActive ? 'active' : 'inactive'} />
            </td>

            {/* Actions */}
            <td className="px-5 py-4 text-right">
              <div className="inline-flex items-center gap-1.5">
                <Link
                  to={`/admin/members/${member._id}`}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="View Profile"
                >
                  <Eye className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    setStatusModal({
                      isOpen: true,
                      member,
                      targetState: !member.user?.isActive,
                      loading: false,
                    })
                  }
                  className={`p-1.5 rounded-lg transition-colors ${
                    member.user?.isActive
                      ? 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                      : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                  }`}
                  title={member.user?.isActive ? 'Deactivate Member' : 'Activate Member'}
                >
                  {member.user?.isActive ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Pagination */}
      <Pagination
        page={page}
        pages={pages}
        total={total}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* Status Confirmation Modal */}
      <ConfirmModal
        isOpen={statusModal.isOpen}
        title={statusModal.targetState ? 'Activate Member Account' : 'Deactivate Member Account'}
        message={`Are you sure you want to ${
          statusModal.targetState ? 'activate' : 'deactivate'
        } ${statusModal.member?.user?.name || 'this member'}? Deactivated members cannot access their portal.`}
        confirmText={statusModal.targetState ? 'Activate' : 'Deactivate'}
        confirmVariant={statusModal.targetState ? 'primary' : 'outline'}
        loading={statusModal.loading}
        onConfirm={handleToggleStatus}
        onCancel={() =>
          setStatusModal({ isOpen: false, member: null, targetState: false, loading: false })
        }
      />
    </div>
  );
};

export default Members;
