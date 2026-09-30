import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BarChart3,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import paymentService from '../../services/paymentService';
import adminService from '../../services/adminService';
import StatCard from '../../components/admin/StatCard';
import Button from '../../components/common/Button';

const PIE_COLORS = ['#ea580c', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

const AdminPayments = () => {
  // Payments state
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [method, setMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Manual payment modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [membersList, setMembersList] = useState([]);
  const [plansList, setPlansList] = useState([]);
  const [manualForm, setManualForm] = useState({
    memberId: '',
    membershipPlanId: '',
    paymentMethod: 'cash',
    notes: '',
  });
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState('');

  // Details modal state
  const [detailsPayment, setDetailsPayment] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Download state
  const [downloadingId, setDownloadingId] = useState(null);

  // Fetch payments list
  const fetchPayments = async (targetPage = 1) => {
    try {
      setLoading(true);
      const res = await paymentService.getAdminPayments({
        page: targetPage,
        limit: 10,
        search: search.trim() || undefined,
        status: status || undefined,
        method: method || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (res.success) {
        setPayments(res.data || []);
        setPage(res.pagination.page);
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch admin payments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const res = await paymentService.getRevenueAnalytics();
      if (res.success) {
        setAnalytics(res);
      }
    } catch (err) {
      console.error('Failed to fetch revenue analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Pre-load members and plans for manual payment modal
  const loadModalData = async () => {
    try {
      const [membersRes, plansRes] = await Promise.allSettled([
        adminService.getMembers({ limit: 100 }),
        paymentService.getPlans(),
      ]);

      if (membersRes.status === 'fulfilled' && membersRes.value.success) {
        setMembersList(membersRes.value.data || []);
      }
      if (plansRes.status === 'fulfilled' && plansRes.value.success) {
        setPlansList(plansRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load modal data:', err);
    }
  };

  useEffect(() => {
    fetchPayments(1);
    fetchAnalytics();
    loadModalData();
  }, []);

  // Handle Search / Filter Submit
  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchPayments(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setMethod('');
    setStartDate('');
    setEndDate('');
    fetchPayments(1);
  };

  // Record manual payment
  const handleManualPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.memberId || !manualForm.membershipPlanId) {
      setManualError('Please select both a member and a membership plan.');
      return;
    }

    try {
      setManualLoading(true);
      setManualError('');

      const res = await paymentService.recordManualPayment(manualForm);

      if (res.success) {
        setIsManualModalOpen(false);
        setManualForm({
          memberId: '',
          membershipPlanId: '',
          paymentMethod: 'cash',
          notes: '',
        });
        // Refresh tables and stats
        fetchPayments(1);
        fetchAnalytics();
      } else {
        setManualError(res.message || 'Failed to record manual payment.');
      }
    } catch (err) {
      setManualError(
        err.response?.data?.message || err.message || 'Error recording manual payment.'
      );
    } finally {
      setManualLoading(false);
    }
  };

  // Download PDF Receipt
  const handleDownloadReceipt = async (paymentId, receiptNumber) => {
    try {
      setDownloadingId(paymentId);
      await paymentService.downloadAdminReceipt(paymentId, receiptNumber);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download receipt.');
    } finally {
      setDownloadingId(null);
    }
  };

  const stats = analytics?.stats || {};
  const monthlyRevenue = analytics?.monthlyRevenue || [];
  const revenueByPlan = analytics?.revenueByPlan || [];

  const getStatusBadge = (s) => {
    switch (s) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" /> Paid
          </span>
        );
      case 'created':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-500 border border-slate-500/20">
            {s}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-400 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-primary-500" /> Revenue &amp; Billing Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            FitCore Financial Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Live Razorpay online transactions, cash collections, and real-time revenue analytics.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          iconPosition="left"
          onClick={() => {
            setManualError('');
            setIsManualModalOpen(true);
          }}
          className="shadow-md shadow-primary-500/20 shrink-0"
        >
          Record Manual / Cash Payment
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={`₹${Number(stats.totalRevenue || 0).toLocaleString()}`}
          detail="All verified paid transactions"
          color="orange"
        />
        <StatCard
          icon={TrendingUp}
          title="Revenue This Month"
          value={`₹${Number(stats.revenueThisMonth || 0).toLocaleString()}`}
          detail="Current calendar month intake"
          color="emerald"
        />
        <StatCard
          icon={CreditCard}
          title="Today's Collections"
          value={`₹${Number(stats.paymentsTodayAmount || 0).toLocaleString()}`}
          detail={`${stats.paymentsTodayCount || 0} transaction(s) today`}
          color="blue"
        />
        <StatCard
          icon={ShieldCheck}
          title="Success Ratio"
          value={`${stats.successfulPaymentsCount || 0} Paid`}
          detail={`${stats.pendingPaymentsCount || 0} Pending · ${stats.failedPaymentsCount || 0} Failed`}
          color="amber"
        />
      </div>

      {/* Revenue Charts Section (Real MongoDB Aggregation) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Monthly Revenue Performance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified collections over the last 6 months
              </p>
            </div>
            <span className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-500 border border-primary-200/60 dark:border-primary-800/60">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            {monthlyRevenue && monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
                  />
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#ea580c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No revenue recorded in the selected period yet.
              </div>
            )}
          </div>
        </div>

        {/* Revenue by Plan Pie Chart */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Revenue by Plan Tier
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gross earnings breakdown by subscription tier
              </p>
            </div>
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 border border-blue-200/60 dark:border-blue-800/60">
              <PieChart className="w-4 h-4" />
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {revenueByPlan && revenueByPlan.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByPlan}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {revenueByPlan.map((entry, idx) => (
                      <Cell key={`plan-cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400">
                No plan tier sales recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleApplyFilters} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search member, email, ref..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Method Filter */}
            <div>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Methods</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="cash">Cash (Manual)</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* End Date */}
            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">
              Found <strong className="text-slate-900 dark:text-white">{totalCount}</strong> transaction(s)
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleResetFilters}
                className="text-xs"
              >
                Reset Filters
              </Button>
              <Button variant="primary" size="sm" type="submit" className="text-xs">
                Apply Filters
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Main Transactions Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Transactions Registry
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPayments(page)}
            className="text-xs p-1.5"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Member</th>
                <th className="py-3 px-3">Plan</th>
                <th className="py-3 px-3">Transaction Ref</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Paid Date</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading transaction records...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 space-y-1">
                    <p className="font-bold text-slate-600 dark:text-slate-300">
                      No payments match current criteria.
                    </p>
                    <p className="text-[11px]">Adjust your search query or clear active filters.</p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr
                    key={p._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                          {p.member?.name ? p.member.name.charAt(0) : 'M'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate">
                            {p.member?.name || 'Unknown Athlete'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{p.member?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {p.membershipPlan?.name || 'Plan'}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {p.membershipPlan?.durationMonths}m
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                      {p.transactionReference}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                      ₹{Number(p.amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 uppercase text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {p.paymentMethod || 'Online'}
                    </td>
                    <td className="py-3.5 px-3">{getStatusBadge(p.status)}</td>
                    <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400">
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : new Date(p.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setDetailsPayment(p);
                            setIsDetailsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {p.status === 'paid' && (
                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(p._id, p.receiptNumber)}
                            disabled={downloadingId === p._id}
                            className="p-1.5 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/60 disabled:opacity-50"
                            title="Download Receipt PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPayments(page - 1)}
                disabled={page <= 1}
                className="text-xs p-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPayments(page + 1)}
                disabled={page >= totalPages}
                className="text-xs p-1.5"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Manual Cash Payment */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6 relative">
            <button
              type="button"
              onClick={() => {
                if (!manualLoading) setIsManualModalOpen(false);
              }}
              disabled={manualLoading}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-primary-500">
                Front Desk Billing
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                Record Manual / Cash Payment
              </h3>
              <p className="text-xs text-slate-500">
                Instantly activates or renews the athlete's membership using verified database plan rates.
              </p>
            </div>

            {manualError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{manualError}</span>
              </div>
            )}

            <form onSubmit={handleManualPaymentSubmit} className="space-y-4 text-xs">
              {/* Select Member */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Select Athlete Member <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={manualForm.memberId}
                  onChange={(e) => setManualForm({ ...manualForm, memberId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Choose Member --</option>
                  {membersList.map((m) => {
                    const usr = m.user || m;
                    return (
                      <option key={usr._id} value={usr._id}>
                        {usr.name} ({usr.email})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Select Plan */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Select Membership Tier <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={manualForm.membershipPlanId}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, membershipPlanId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Choose Plan --</option>
                  {plansList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.durationMonths}m) — ₹{Number(p.price).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Payment Collection Method <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={manualForm.paymentMethod}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, paymentMethod: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Point of Sale (Card Machine)</option>
                  <option value="upi">Direct UPI / QR Transfer</option>
                  <option value="bank_transfer">Direct Bank Transfer</option>
                  <option value="other">Other / Cheque</option>
                </select>
              </div>

              {/* Optional Note */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Transaction Notes / Memo
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Paid in cash at reception counter..."
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  disabled={manualLoading}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={manualLoading}>
                  {manualLoading ? 'Recording...' : 'Confirm & Activate Membership'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Details Modal */}
      {isDetailsModalOpen && detailsPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 relative">
            <button
              type="button"
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary-500">
                Transaction Record
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                Audit Details
              </h3>
              <p className="text-xs text-slate-500">{detailsPayment.transactionReference}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between">
                <span className="text-slate-400">Member</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {detailsPayment.member?.name} ({detailsPayment.member?.email})
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between">
                <span className="text-slate-400">Membership Tier</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {detailsPayment.membershipPlan?.name}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between">
                <span className="text-slate-400">Gross Amount</span>
                <span className="font-bold text-primary-500">
                  ₹{Number(detailsPayment.amount).toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between">
                <span className="text-slate-400">Gateway / Provider</span>
                <span className="uppercase font-semibold text-slate-700 dark:text-slate-300">
                  {detailsPayment.provider || 'Razorpay'}
                </span>
              </div>

              {detailsPayment.razorpayOrderId && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between">
                  <span className="text-slate-400">Razorpay Order ID</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {detailsPayment.razorpayOrderId}
                  </span>
                </div>
              )}

              {detailsPayment.razorpayPaymentId && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between">
                  <span className="text-slate-400">Razorpay Payment ID</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {detailsPayment.razorpayPaymentId}
                  </span>
                </div>
              )}

              {detailsPayment.receiptNumber && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between">
                  <span className="text-slate-400">Official Receipt #</span>
                  <span className="font-mono font-bold text-primary-500">
                    {detailsPayment.receiptNumber}
                  </span>
                </div>
              )}

              {detailsPayment.membershipStartDate && detailsPayment.membershipEndDate && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between">
                  <span className="text-slate-400">Covered Validity</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {new Date(detailsPayment.membershipStartDate).toLocaleDateString()} –{' '}
                    {new Date(detailsPayment.membershipEndDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {detailsPayment.notes && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                  <span className="text-slate-400 block">Notes / Reconciliation</span>
                  <span className="text-slate-700 dark:text-slate-300">{detailsPayment.notes}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-between items-center">
              {detailsPayment.status === 'paid' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    handleDownloadReceipt(detailsPayment._id, detailsPayment.receiptNumber)
                  }
                  className="text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download Receipt PDF
                </Button>
              ) : (
                <span />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
