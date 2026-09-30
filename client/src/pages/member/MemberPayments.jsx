import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Check,
  ShieldCheck,
  Download,
  Eye,
  RefreshCw,
  ExternalLink,
  Receipt,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import memberService from '../../services/memberService';
import paymentService from '../../services/paymentService';
import { loadRazorpayScript } from '../../utils/loadRazorpay';
import Button from '../../components/common/Button';

const MemberPayments = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Membership & Plans state
  const [membership, setMembership] = useState(null);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // History state
  const [payments, setPayments] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  // Checkout modal & process state
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Payment Success state
  const [successData, setSuccessData] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Payment Details modal state
  const [detailsPayment, setDetailsPayment] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Downloading receipt state
  const [downloadingId, setDownloadingId] = useState(null);

  // Load Membership, Plans & Payments
  const fetchMembershipAndPlans = async () => {
    try {
      setPlansLoading(true);
      const [memRes, plansRes] = await Promise.allSettled([
        memberService.getMembership(),
        paymentService.getPlans(),
      ]);

      if (memRes.status === 'fulfilled' && memRes.value.success) {
        setMembership(memRes.value.membership);
      }

      if (plansRes.status === 'fulfilled' && plansRes.value.success) {
        setPlans(plansRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setPlansLoading(false);
    }
  };

  const fetchPayments = async (targetPage = 1, status = statusFilter) => {
    try {
      setHistoryLoading(true);
      const res = await paymentService.getMyPayments({
        page: targetPage,
        limit: 10,
        status: status || undefined,
      });

      if (res.success) {
        setPayments(res.data || []);
        setPage(res.pagination.page);
        setTotalPages(res.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch payments history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchMembershipAndPlans();
    fetchPayments(1);
  }, []);

  // Pre-select plan if passed via URL (e.g. ?plan=planId)
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam && plans.length > 0) {
      const matched = plans.find((p) => p._id === planParam);
      if (matched) {
        setSelectedPlan(matched);
        setIsCheckoutModalOpen(true);
      }
    }
  }, [searchParams, plans]);

  // Handle plan card action
  const handleSelectPlan = (plan) => {
    setCheckoutError('');
    setSelectedPlan(plan);
    setIsCheckoutModalOpen(true);
  };

  // Launch Razorpay Checkout Flow
  const handleProceedToPay = async () => {
    if (!selectedPlan || processingOrder) return;

    try {
      setProcessingOrder(true);
      setCheckoutError('');

      // 1. Ensure Razorpay checkout script is loaded
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection and try again.');
      }

      // 2. Create Order on Backend (Price loaded securely from MongoDB)
      const orderResponse = await paymentService.createOrder(selectedPlan._id);
      if (!orderResponse.success || !orderResponse.order) {
        throw new Error(orderResponse.message || 'Failed to create payment order.');
      }

      const { orderId, amount, currency, keyId, planName } = orderResponse.order;

      // 3. Configure Razorpay Checkout Modal
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'FitCore Gym Club',
        description: `Membership: ${planName}`,
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
        },
        theme: {
          color: '#ea580c', // FitCore Primary Orange
        },
        modal: {
          ondismiss: () => {
            setProcessingOrder(false);
          },
        },
        // 4. On Razorpay payment success handler
        handler: async (response) => {
          try {
            setProcessingOrder(true);

            // Send payment details to backend for HMAC verification
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            const verifyRes = await paymentService.verifyPayment(verifyPayload);

            if (verifyRes.success) {
              setIsCheckoutModalOpen(false);
              setSuccessData({
                plan: selectedPlan,
                payment: verifyRes.payment,
                membership: verifyRes.membership,
                wasRenewed: verifyRes.membership?.wasRenewed,
              });
              setIsSuccessModalOpen(true);

              // Refresh membership status and payment history
              fetchMembershipAndPlans();
              fetchPayments(1);
            } else {
              setCheckoutError(verifyRes.message || 'Payment signature verification failed.');
            }
          } catch (verifyErr) {
            setCheckoutError(
              verifyErr.response?.data?.message || verifyErr.message || 'Payment verification failed.'
            );
          } finally {
            setProcessingOrder(false);
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', (failedRes) => {
        setProcessingOrder(false);
        setCheckoutError(
          failedRes.error?.description || 'Payment was declined by payment gateway or issuing bank.'
        );
      });

      razorpayInstance.open();
    } catch (err) {
      setCheckoutError(err.response?.data?.message || err.message || 'Unable to initiate payment.');
      setProcessingOrder(false);
    }
  };

  // Receipt Download Helper
  const handleDownloadReceipt = async (paymentId, receiptNumber) => {
    try {
      setDownloadingId(paymentId);
      await paymentService.downloadReceipt(paymentId, receiptNumber);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download receipt PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const isCurrentActive = membership?.status === 'active';
  const isCurrentExpired = membership?.status === 'expired';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" /> Paid
          </span>
        );
      case 'created':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <AlertCircle className="w-3 h-3" /> Failed
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-500/10 text-slate-500 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header & Test Mode Notification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-primary-500/10 text-primary-500 border border-primary-500/20">
              Payments &amp; Billing
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Razorpay Test Mode Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            Membership Checkout &amp; Receipts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Select a subscription package, renew seamlessly via Razorpay, and download official receipts.
          </p>
        </div>

        <Link to="/member/membership">
          <Button variant="outline" size="sm" className="text-xs">
            My Enrolled Plan <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>

      {/* SECTION 1: Current Membership Snapshot */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Current Subscription State
              </span>
              <div className="flex items-center gap-2.5 mt-0.5">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {membership?.plan ? membership.plan.name : 'No Active Plan'}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isCurrentActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : isCurrentExpired
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {isCurrentActive ? 'Active' : isCurrentExpired ? 'Expired' : 'Pending Enrollment'}
                </span>
              </div>
            </div>
          </div>

          {membership?.plan && (
            <div className="flex flex-wrap items-center gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Enrolled On</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {membership.startDate
                    ? new Date(membership.startDate).toLocaleDateString()
                    : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Valid Until</span>
                <span
                  className={`font-bold ${
                    isCurrentExpired ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {membership.endDate
                    ? new Date(membership.endDate).toLocaleDateString()
                    : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Renewal Policy</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {isCurrentActive ? 'Extends without losing days' : 'Activates immediately'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Available Membership Plans (From DB Source of Truth) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Available Membership Plans
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified catalog prices loaded directly from FitCore database.
            </p>
          </div>
        </div>

        {plansLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-80 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              No active membership plans available.
            </p>
            <p className="text-xs text-slate-500">Please check back soon or consult gym staff.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan) => {
              const isEnrolledPlan = membership?.plan?._id === plan._id && isCurrentActive;
              const isPopular = plan.durationMonths === 12;

              return (
                <div
                  key={plan._id}
                  className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 ${
                    isPopular
                      ? 'bg-slate-900 text-white dark:bg-slate-900 border-2 border-primary-500 shadow-xl'
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <Sparkles className="w-3 h-3" /> Best Value
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black">{plan.name}</h3>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isPopular
                            ? 'bg-primary-500/20 text-primary-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {plan.durationMonths} {plan.durationMonths === 1 ? 'Month' : 'Months'}
                      </span>
                    </div>

                    <p
                      className={`text-xs leading-relaxed ${
                        isPopular ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {plan.description || 'Full athletic facility and gym floor access.'}
                    </p>

                    <div className="pt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black tracking-tight">
                          ₹{Number(plan.price).toLocaleString()}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            isPopular ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          /{plan.durationMonths}m
                        </span>
                      </div>
                    </div>

                    {/* Benefits List */}
                    <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-primary-500">
                        Included Privileges:
                      </p>
                      <ul className="space-y-1.5 text-xs">
                        {plan.benefits && plan.benefits.length > 0 ? (
                          plan.benefits.map((b, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" />
                              <span
                                className={
                                  isPopular
                                    ? 'text-slate-200'
                                    : 'text-slate-600 dark:text-slate-300'
                                }
                              >
                                {b}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-400">Gym floor access and amenities.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button
                      variant={isPopular ? 'primary' : 'outline'}
                      size="sm"
                      className="w-full justify-center text-xs"
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {isCurrentActive
                        ? isEnrolledPlan
                          ? 'Renew Membership'
                          : 'Renew / Switch Plan'
                        : 'Buy Membership'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: Member Payment History */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Payment History &amp; Official Receipts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit log of all your membership orders, Razorpay transactions, and receipts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                fetchPayments(1, e.target.value);
              }}
              className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPayments(page)}
              className="text-xs p-2"
              title="Refresh History"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {historyLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading payment records...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 space-y-1">
                    <Receipt className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                    <p className="font-bold text-slate-600 dark:text-slate-300">
                      No payment transactions found.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Orders and subscription purchases will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr
                    key={p._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {p.transactionReference}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {p.membershipPlan?.name || 'Plan'}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {p.membershipPlan?.durationMonths} mo
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      ₹{Number(p.amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 uppercase text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {p.paymentMethod || 'Online'}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(p.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setDetailsPayment(p);
                            setIsDetailsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Payment Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {p.status === 'paid' && (
                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(p._id, p.receiptNumber)}
                            disabled={downloadingId === p._id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 hover:bg-primary-100 border border-primary-200 dark:border-primary-800 transition-colors disabled:opacity-50"
                            title="Download Official PDF Receipt"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
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

      {/* MODAL 1: Checkout Confirmation (Double-Click Locked) */}
      {isCheckoutModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-6 relative">
            <button
              type="button"
              onClick={() => {
                if (!processingOrder) setIsCheckoutModalOpen(false);
              }}
              disabled={processingOrder}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-primary-500">
                Order Confirmation
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {isCurrentActive ? 'Renew Subscription' : 'Enroll in FitCore Membership'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Review your package summary before launching the secure Razorpay checkout.
              </p>
            </div>

            {/* Plan Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-800 dark:text-slate-200">Selected Plan</span>
                <span className="text-primary-500">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Duration</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedPlan.durationMonths} {selectedPlan.durationMonths === 1 ? 'Month' : 'Months'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Renewal Behavior</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {isCurrentActive ? 'Starts after current expiration' : 'Activates today'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Total Payable</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  ₹{Number(selectedPlan.price).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Error Message if any */}
            {checkoutError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Test Mode Notice */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
              <Info className="w-4 h-4 shrink-0" />
              <span>Razorpay Test Mode: You can simulate success using standard test credentials.</span>
            </div>

            {/* Actions (One-click button lock) */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                className="w-1/3 justify-center text-xs"
                onClick={() => setIsCheckoutModalOpen(false)}
                disabled={processingOrder}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="w-2/3 justify-center text-xs shadow-md shadow-primary-500/25"
                onClick={handleProceedToPay}
                disabled={processingOrder}
              >
                {processingOrder ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Opening Checkout...
                  </span>
                ) : (
                  <span>Proceed to Pay ₹{Number(selectedPlan.price).toLocaleString()}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Payment Success UI */}
      {isSuccessModalOpen && successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Transaction Verified
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Payment Successful!
              </h3>
              <p className="text-xs text-slate-500">
                {successData.wasRenewed
                  ? 'Your FitCore membership has been successfully renewed and extended.'
                  : 'Your FitCore membership is now active! Welcome aboard.'}
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Plan</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {successData.plan.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid</span>
                <span className="font-bold text-primary-500">
                  ₹{Number(successData.payment?.amount || successData.plan.price).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valid Until</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {successData.membership?.endDate
                    ? new Date(successData.membership.endDate).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400">Transaction Ref</span>
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  {successData.payment?.transactionReference}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center text-xs"
                onClick={() =>
                  handleDownloadReceipt(
                    successData.payment?._id,
                    successData.payment?.receiptNumber
                  )
                }
              >
                <Download className="w-4 h-4 mr-1.5" /> Download Official Receipt PDF
              </Button>

              <Button
                variant="outline"
                size="md"
                className="w-full justify-center text-xs"
                onClick={() => setIsSuccessModalOpen(false)}
              >
                Close &amp; Return to Portal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Payment Details View */}
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
                Payment Details
              </h3>
              <p className="text-xs text-slate-500">
                Internal reference: {detailsPayment.transactionReference}
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between">
                <span className="text-slate-400">Status</span>
                <span>{getStatusBadge(detailsPayment.status)}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between">
                <span className="text-slate-400">Membership Tier</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {detailsPayment.membershipPlan?.name}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between">
                <span className="text-slate-400">Amount</span>
                <span className="font-bold text-primary-500">
                  ₹{Number(detailsPayment.amount).toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between">
                <span className="text-slate-400">Payment Gateway</span>
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
                  <span className="text-slate-400">Receipt Number</span>
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
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download Receipt
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

export default MemberPayments;
