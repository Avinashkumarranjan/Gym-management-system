import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  UserPlus,
  Eye,
  CheckCircle,
  XCircle,
  Award,
  Users,
  Briefcase,
  Phone,
  Mail,
} from 'lucide-react';
import adminService from '../../services/adminService';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import Pagination from '../../components/admin/Pagination';
import ConfirmModal from '../../components/admin/ConfirmModal';
import Button from '../../components/common/Button';

const SPECIALIZATION_OPTIONS = [
  'Strength Training',
  'Weight Loss',
  'Bodybuilding',
  'Yoga',
  'Mobility',
  'Functional Training',
  'Cardio',
  'Nutrition Guidance',
  'General Fitness',
];

const Trainers = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [sort, setSort] = useState('newest');

  // Pagination State
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Status Confirmation Modal
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    trainer: null,
    targetState: false,
    loading: false,
  });

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: status || undefined,
        specialization: specialization || undefined,
        sort,
      };

      const res = await adminService.getTrainers(params);
      if (res.success) {
        setTrainers(res.data);
        setPages(res.pages);
        setTotal(res.total);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load trainers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, [page, status, specialization, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTrainers();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setSpecialization('');
    setSort('newest');
    setPage(1);
  };

  const handleToggleStatus = async () => {
    if (!statusModal.trainer) return;
    try {
      setStatusModal((prev) => ({ ...prev, loading: true }));
      const res = await adminService.updateTrainerStatus(
        statusModal.trainer._id,
        statusModal.targetState
      );
      if (res.success) {
        setStatusModal({ isOpen: false, trainer: null, targetState: false, loading: false });
        fetchTrainers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update trainer status');
      setStatusModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const columns = [
    {
      header: 'Trainer',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-amber-500 text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
            {row.name ? row.name.charAt(0).toUpperCase() : 'T'}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              {row.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Joined {new Date(row.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: (row) => (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-[170px]">{row.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{row.phone || 'No phone'}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Specializations',
      accessor: (row) => {
        const specs = row.trainerProfile?.specializations || [];
        if (specs.length === 0) {
          return <span className="text-xs text-slate-400">Not specified</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {specs.slice(0, 2).map((s, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50"
              >
                {s}
              </span>
            ))}
            {specs.length > 2 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800">
                +{specs.length - 2}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Experience',
      accessor: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {row.trainerProfile?.experienceYears || 0}
          </span>{' '}
          years
        </div>
      ),
    },
    {
      header: 'Assigned Members',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 border border-brand-200/50 dark:border-brand-800/40">
            <Users className="w-3.5 h-3.5" />
            {row.assignedMemberCount || 0}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <StatusBadge status={row.isActive ? 'active' : 'inactive'} />
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={`/admin/trainers/${row._id}`}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Link>

          {row.isActive ? (
            <button
              onClick={() =>
                setStatusModal({
                  isOpen: true,
                  trainer: row,
                  targetState: false,
                  loading: false,
                })
              }
              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              title="Deactivate Trainer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() =>
                setStatusModal({
                  isOpen: true,
                  trainer: row,
                  targetState: true,
                  loading: false,
                })
              }
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              title="Activate Trainer"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Trainer Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage fitness trainers, coach profiles, expertise, and member assignments.
          </p>
        </div>

        <Link to="/admin/trainers/new">
          <Button variant="primary" className="flex items-center gap-2 shadow-sm">
            <UserPlus className="w-4 h-4" />
            Add Trainer
          </Button>
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search trainers by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
          <Button type="submit" variant="primary" className="shrink-0 px-5">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Specialization Filter */}
          <select
            value={specialization}
            onChange={(e) => {
              setSpecialization(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">All Specializations</option>
            {SPECIALIZATION_OPTIONS.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
          </select>

          {(search || status || specialization || sort !== 'newest') && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline ml-auto font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Trainers Table */}
      <DataTable
        columns={columns}
        data={trainers}
        loading={loading}
        emptyMessage="No trainers found matching your search or filters."
      />

      {/* Pagination */}
      {!loading && trainers.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={pages}
          totalItems={total}
          itemsPerPage={10}
          onPageChange={(p) => setPage(p)}
        />
      )}

      {/* Status Toggle Modal */}
      <ConfirmModal
        isOpen={statusModal.isOpen}
        title={statusModal.targetState ? 'Reactivate Trainer' : 'Deactivate Trainer'}
        message={
          statusModal.targetState
            ? `Are you sure you want to reactivate ${statusModal.trainer?.name}? They will be able to log in and accept member assignments.`
            : `Are you sure you want to deactivate ${statusModal.trainer?.name}? They will no longer be able to log into FitCore.`
        }
        confirmText={statusModal.targetState ? 'Reactivate' : 'Deactivate'}
        confirmVariant={statusModal.targetState ? 'success' : 'danger'}
        isLoading={statusModal.loading}
        onConfirm={handleToggleStatus}
        onCancel={() =>
          setStatusModal({ isOpen: false, trainer: null, targetState: false, loading: false })
        }
      />
    </div>
  );
};

export default Trainers;
