import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Award,
  Clock,
  DollarSign,
  Briefcase,
  Users,
  Edit3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  CheckCircle2,
  X,
} from 'lucide-react';
import adminService from '../../services/adminService';
import StatusBadge from '../../components/admin/StatusBadge';
import ConfirmModal from '../../components/admin/ConfirmModal';
import Button from '../../components/common/Button';

const SPECIALIZATION_LIST = [
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

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const TrainerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trainer, setTrainer] = useState(null);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    specializations: [],
    experienceYears: 0,
    qualifications: '',
    bio: '',
    availableDays: [],
    availableTime: '',
    salary: 0,
    isAvailable: true,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Status Confirmation Modal
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    targetState: false,
    loading: false,
  });

  const fetchTrainerData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getTrainerById(id);
      if (res.success) {
        setTrainer(res.data);
        setAssignedMembers(res.assignedMembers || []);

        const prof = res.data.trainerProfile || {};
        setEditForm({
          name: res.data.name || '',
          phone: res.data.phone || '',
          specializations: prof.specializations || [],
          experienceYears: prof.experienceYears || 0,
          qualifications: prof.qualifications || '',
          bio: prof.bio || '',
          availableDays: prof.availableDays || [],
          availableTime: prof.availableTime || '',
          salary: prof.salary || 0,
          isAvailable: prof.isAvailable !== false,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load trainer details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainerData();
  }, [id]);

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
          ? value === ''
            ? ''
            : Number(value)
          : value,
    }));
  };

  const handleSpecializationToggle = (spec) => {
    setEditForm((prev) => {
      const exists = prev.specializations.includes(spec);
      return {
        ...prev,
        specializations: exists
          ? prev.specializations.filter((s) => s !== spec)
          : [...prev.specializations, spec],
      };
    });
  };

  const handleDayToggle = (day) => {
    setEditForm((prev) => {
      const exists = prev.availableDays.includes(day);
      return {
        ...prev,
        availableDays: exists
          ? prev.availableDays.filter((d) => d !== day)
          : [...prev.availableDays, day],
      };
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setEditLoading(true);
      setEditError('');
      const res = await adminService.updateTrainer(id, editForm);
      if (res.success) {
        setIsEditOpen(false);
        fetchTrainerData();
      }
    } catch (err) {
      setEditError(err.response?.data?.message || err.message || 'Could not update trainer.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      setStatusModal((prev) => ({ ...prev, loading: true }));
      const res = await adminService.updateTrainerStatus(id, statusModal.targetState);
      if (res.success) {
        setStatusModal({ isOpen: false, targetState: false, loading: false });
        fetchTrainerData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update status');
      setStatusModal((prev) => ({ ...prev, loading: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <div className="max-w-xl mx-auto p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {error || 'Trainer Not Found'}
        </h2>
        <Link to="/admin/trainers">
          <Button variant="primary">Return to Trainers</Button>
        </Link>
      </div>
    );
  }

  const profile = trainer.trainerProfile || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/admin/trainers"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Trainers
        </Link>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Profile
          </Button>

          {trainer.isActive ? (
            <Button
              variant="outline"
              onClick={() =>
                setStatusModal({ isOpen: true, targetState: false, loading: false })
              }
              className="flex items-center gap-1.5 text-xs border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <XCircle className="w-3.5 h-3.5" />
              Deactivate
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() =>
                setStatusModal({ isOpen: true, targetState: true, loading: false })
              }
              className="flex items-center gap-1.5 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Activate
            </Button>
          )}
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg shrink-0">
          {trainer.name ? trainer.name.charAt(0).toUpperCase() : 'T'}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {trainer.name}
            </h1>
            <StatusBadge status={trainer.isActive ? 'active' : 'inactive'} />
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
              Trainer Account
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {trainer.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {trainer.phone || 'No phone set'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Joined {new Date(trainer.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex md:flex-col items-center md:items-end gap-2 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
          <div className="text-xs text-slate-400 uppercase font-semibold">
            Assigned Clients
          </div>
          <div className="text-2xl font-black text-brand-600 dark:text-brand-400">
            {assignedMembers.length}
          </div>
        </div>
      </div>

      {/* Grid: Coaching Expertise, Schedule & Qualifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Specialization & Bio */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Coaching Specializations & Bio
            </h2>

            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                Specializations
              </div>
              {profile.specializations && profile.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.specializations.map((spec, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No specializations entered yet.</p>
              )}
            </div>

            <div className="pt-2">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Certifications / Qualifications
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {profile.qualifications || 'No certifications listed.'}
              </p>
            </div>

            <div className="pt-2">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Bio / Background
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {profile.bio || 'No personal bio added.'}
              </p>
            </div>
          </div>

          {/* Assigned Members Section */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-500" />
                Assigned Members ({assignedMembers.length})
              </h2>
            </div>

            {assignedMembers.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-sm">
                No active members currently assigned to this trainer.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Member</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Goal</th>
                      <th className="py-2.5 px-3">Plan</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {assignedMembers.map((m) => (
                      <tr key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {m.user?.name || 'Member'}
                          </div>
                          <div className="text-[11px] text-slate-500">{m.user?.email}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {m.user?.phone || '—'}
                        </td>
                        <td className="py-3 px-3 capitalize">
                          {m.fitnessGoal ? m.fitnessGoal.replace('_', ' ') : '—'}
                        </td>
                        <td className="py-3 px-3">
                          {m.membershipPlan ? (
                            <span className="font-medium text-brand-600 dark:text-brand-400">
                              {m.membershipPlan.name}
                            </span>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            to={`/admin/members/${m._id}`}
                            className="p-1 rounded text-slate-500 hover:text-brand-600 transition-colors inline-block"
                            title="View Member"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Schedule & Administrative Info */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" />
              Schedule & Availability
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Working Shift</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  {profile.availableTime || 'Flexible hours'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1.5">Available Days</span>
                <div className="flex flex-wrap gap-1">
                  {profile.availableDays && profile.availableDays.length > 0 ? (
                    profile.availableDays.map((d, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {d}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400">All week</span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Coaching Status</span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    profile.isAvailable !== false
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                  }`}
                >
                  {profile.isAvailable !== false ? 'Taking New Clients' : 'Schedule Full'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-500" />
              Staff Compensation
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Years of Experience</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {profile.experienceYears || 0} Years
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Base Monthly Salary</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                  ₹{Number(profile.salary || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Trainer Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-2xl w-full my-8 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Edit Trainer Profile
              </h2>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Trainer Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    name="experienceYears"
                    min="0"
                    value={editForm.experienceYears}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Salary (₹)
                  </label>
                  <input
                    type="number"
                    name="salary"
                    min="0"
                    value={editForm.salary}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Specializations
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SPECIALIZATION_LIST.map((spec) => {
                    const isSelected = editForm.specializations.includes(spec);
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => handleSpecializationToggle(spec)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {spec}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Certifications
                </label>
                <input
                  type="text"
                  name="qualifications"
                  value={editForm.qualifications}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bio / Philosophy
                </label>
                <textarea
                  name="bio"
                  rows="2"
                  value={editForm.bio}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Available Working Days
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = editForm.availableDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Available Time Shift
                </label>
                <input
                  type="text"
                  name="availableTime"
                  value={editForm.availableTime}
                  onChange={handleEditChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isAvailableCheckbox"
                  name="isAvailable"
                  checked={editForm.isAvailable}
                  onChange={handleEditChange}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="isAvailableCheckbox" className="font-medium text-slate-700 dark:text-slate-300">
                  Currently accepting new member clients
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={statusModal.isOpen}
        title={statusModal.targetState ? 'Reactivate Trainer' : 'Deactivate Trainer'}
        message={
          statusModal.targetState
            ? `Are you sure you want to reactivate ${trainer.name}? They will be able to access FitCore.`
            : `Are you sure you want to deactivate ${trainer.name}? They will no longer be able to log in.`
        }
        confirmText={statusModal.targetState ? 'Reactivate' : 'Deactivate'}
        confirmVariant={statusModal.targetState ? 'success' : 'danger'}
        isLoading={statusModal.loading}
        onConfirm={handleToggleStatus}
        onCancel={() =>
          setStatusModal({ isOpen: false, targetState: false, loading: false })
        }
      />
    </div>
  );
};

export default TrainerDetails;
