import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Edit3,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  Check,
  X,
  AlertCircle,
  Tag,
  DollarSign,
} from 'lucide-react';
import adminService from '../../services/adminService';
import StatusBadge from '../../components/admin/StatusBadge';
import ConfirmModal from '../../components/admin/ConfirmModal';
import Button from '../../components/common/Button';

const MembershipPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Plan Modal state (Create / Edit)
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    durationMonths: 1,
    price: 1499,
    benefits: ['Full Gym Access', 'Locker Room & Showers', 'Free WiFi'],
    benefitInput: '',
    isActive: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Status toggle confirmation modal
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    plan: null,
    targetState: false,
    loading: false,
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getMembershipPlans();
      if (res.success) {
        setPlans(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load membership plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setSelectedPlan(null);
    setFormData({
      name: '',
      description: '',
      durationMonths: 1,
      price: 1499,
      benefits: ['Full Gym Access', 'Locker Room Access', 'Fitness Assessment'],
      benefitInput: '',
      isActive: true,
    });
    setFormError('');
    setModalMode('create');
  };

  const openEditModal = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      durationMonths: plan.durationMonths || 1,
      price: plan.price || 0,
      benefits: plan.benefits && plan.benefits.length > 0 ? plan.benefits : [],
      benefitInput: '',
      isActive: plan.isActive !== false,
    });
    setFormError('');
    setModalMode('edit');
  };

  const handleAddBenefit = () => {
    if (!formData.benefitInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      benefits: [...prev.benefits, prev.benefitInput.trim()],
      benefitInput: '',
    }));
  };

  const handleRemoveBenefit = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return setFormError('Plan name is required.');
    if (formData.durationMonths < 1) return setFormError('Duration must be at least 1 month.');
    if (formData.price < 0) return setFormError('Price cannot be negative.');

    try {
      setFormLoading(true);
      setFormError('');

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        durationMonths: Number(formData.durationMonths),
        price: Number(formData.price),
        benefits: formData.benefits,
        isActive: formData.isActive,
      };

      if (modalMode === 'create') {
        const res = await adminService.createMembershipPlan(payload);
        if (res.success) {
          setModalMode(null);
          fetchPlans();
        }
      } else {
        const res = await adminService.updateMembershipPlan(selectedPlan._id, payload);
        if (res.success) {
          setModalMode(null);
          fetchPlans();
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Operation failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusModal.plan) return;
    try {
      setStatusModal((prev) => ({ ...prev, loading: true }));
      const res = await adminService.updateMembershipPlanStatus(
        statusModal.plan._id,
        statusModal.targetState
      );
      if (res.success) {
        setStatusModal({ isOpen: false, plan: null, targetState: false, loading: false });
        fetchPlans();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update plan status.');
      setStatusModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Membership Plans
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure subscription tiers, pricing packages, durations, and included perks.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={openCreateModal}
          className="flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create New Plan
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Plans List Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <CreditCard className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No membership plans found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get started by creating your gym's first subscription tier with custom duration and pricing.
          </p>
          <Button variant="primary" onClick={openCreateModal} className="mt-2 text-xs">
            Create Plan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`rounded-2xl border p-6 flex flex-col justify-between transition-all bg-white dark:bg-slate-900 shadow-sm ${
                plan.isActive
                  ? 'border-slate-200 dark:border-slate-800 hover:shadow-md'
                  : 'border-slate-200/60 dark:border-slate-800/50 opacity-70 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
                      plan.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {plan.isActive ? 'Active Plan' : 'Archived'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(plan)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Plan"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {plan.isActive ? (
                      <button
                        onClick={() =>
                          setStatusModal({
                            isOpen: true,
                            plan,
                            targetState: false,
                            loading: false,
                          })
                        }
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Deactivate Plan"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setStatusModal({
                            isOpen: true,
                            plan,
                            targetState: true,
                            loading: false,
                          })
                        }
                        className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                        title="Reactivate Plan"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                    {plan.description || 'Standard membership tier.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      ₹{Number(plan.price).toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400">
                      / {plan.durationMonths} {plan.durationMonths === 1 ? 'Month' : 'Months'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Included Benefits
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {(plan.benefits || []).slice(0, 4).map((b, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                        <span className="truncate">{b}</span>
                      </li>
                    ))}
                    {(plan.benefits || []).length > 4 && (
                      <li className="text-[11px] text-slate-400 pl-5.5">
                        +{plan.benefits.length - 4} more perks
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="w-3.5 h-3.5 text-brand-500" />
                  {plan.subscriberCount || 0} Members
                </span>
                <span className="text-[11px] text-slate-400">
                  {plan.durationMonths}m term
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full my-8 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {modalMode === 'create' ? 'Create Membership Plan' : 'Edit Membership Plan'}
              </h2>
              <button
                onClick={() => setModalMode(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quarterly Pro, Annual VIP"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Target audience or key plan highlights..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Months) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={formData.durationMonths}
                    onChange={(e) =>
                      setFormData({ ...formData, durationMonths: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Plan Perks & Benefits
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add benefit (e.g. Free Locker, Sauna Access)"
                    value={formData.benefitInput}
                    onChange={(e) => setFormData({ ...formData, benefitInput: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBenefit();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddBenefit}
                    className="text-xs px-3"
                  >
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                  {formData.benefits.map((b, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      {b}
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(idx)}
                        className="hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActivePlanCheckbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="isActivePlanCheckbox" className="font-medium text-slate-700 dark:text-slate-300">
                  Plan is currently active & available for assignment
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalMode(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={formLoading}
                >
                  {formLoading
                    ? 'Saving...'
                    : modalMode === 'create'
                    ? 'Create Plan'
                    : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={statusModal.isOpen}
        title={statusModal.targetState ? 'Reactivate Plan' : 'Deactivate Plan'}
        message={
          statusModal.targetState
            ? `Are you sure you want to reactivate the "${statusModal.plan?.name}" plan? It will become available for new member enrollments.`
            : `Are you sure you want to deactivate the "${statusModal.plan?.name}" plan? Existing enrolled members will retain their status until expiration.`
        }
        confirmText={statusModal.targetState ? 'Reactivate' : 'Deactivate'}
        confirmVariant={statusModal.targetState ? 'success' : 'danger'}
        isLoading={statusModal.loading}
        onConfirm={handleToggleStatus}
        onCancel={() =>
          setStatusModal({ isOpen: false, plan: null, targetState: false, loading: false })
        }
      />
    </div>
  );
};

export default MembershipPlans;
