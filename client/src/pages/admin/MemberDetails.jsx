import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Award,
  Activity,
  Edit,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Loader2,
  FileText,
  MapPin,
  Heart,
  Scale,
} from 'lucide-react';
import adminService from '../../services/adminService';
import StatusBadge from '../../components/admin/StatusBadge';
import ConfirmModal from '../../components/admin/ConfirmModal';
import Button from '../../components/common/Button';

const MemberDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Auxiliary data
  const [plans, setPlans] = useState([]);
  const [trainers, setTrainers] = useState([]);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({});
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [membershipForm, setMembershipForm] = useState({
    membershipPlanId: '',
    startDate: new Date().toISOString().split('T')[0],
  });
  const [modalLoading, setModalLoading] = useState(false);

  const fetchMember = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminService.getMemberById(id);
      if (res.success) {
        setMember(res.data);
        // Pre-fill edit form
        setEditFormData({
          name: res.data.user?.name || '',
          phone: res.data.user?.phone || '',
          gender: res.data.gender || 'unspecified',
          dateOfBirth: res.data.dateOfBirth ? res.data.dateOfBirth.split('T')[0] : '',
          height: res.data.height || '',
          weight: res.data.weight || '',
          fitnessGoal: res.data.fitnessGoal || 'general_fitness',
          address: res.data.address || '',
          emergencyName: res.data.emergencyContact?.name || '',
          emergencyPhone: res.data.emergencyContact?.phone || '',
          emergencyRelation: res.data.emergencyContact?.relation || '',
          notes: res.data.notes || '',
        });
        setSelectedTrainerId(res.data.assignedTrainer?._id || '');
        setMembershipForm({
          membershipPlanId: res.data.membershipPlan?._id || '',
          startDate: res.data.membershipStartDate
            ? res.data.membershipStartDate.split('T')[0]
            : new Date().toISOString().split('T')[0],
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load member profile.');
    } finally {
      setLoading(false);
    }
  };

  const loadDropdowns = async () => {
    try {
      const [plansRes, trainersRes] = await Promise.all([
        adminService.getMembershipPlans(),
        adminService.getTrainers({ limit: 50, status: 'active' }),
      ]);
      if (plansRes.success) setPlans(plansRes.data);
      if (trainersRes.success) setTrainers(trainersRes.data);
    } catch (e) {
      console.warn('Error loading plans/trainers:', e.message);
    }
  };

  useEffect(() => {
    fetchMember();
    loadDropdowns();
  }, [id]);

  // Derived BMI display calculation
  const calculateBmi = () => {
    if (!member?.height || !member?.weight) return null;
    const heightInMeters = member.height / 100;
    const bmiVal = (member.weight / (heightInMeters * heightInMeters)).toFixed(1);

    let category = 'Normal';
    let catColor = 'text-emerald-500';
    if (bmiVal < 18.5) {
      category = 'Underweight';
      catColor = 'text-amber-500';
    } else if (bmiVal >= 25 && bmiVal < 30) {
      category = 'Overweight';
      catColor = 'text-amber-500';
    } else if (bmiVal >= 30) {
      category = 'Obese';
      catColor = 'text-red-500';
    }

    return { value: bmiVal, category, catColor };
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await adminService.updateMember(member._id, {
        name: editFormData.name,
        phone: editFormData.phone,
        gender: editFormData.gender,
        dateOfBirth: editFormData.dateOfBirth || null,
        height: editFormData.height ? Number(editFormData.height) : undefined,
        weight: editFormData.weight ? Number(editFormData.weight) : undefined,
        fitnessGoal: editFormData.fitnessGoal,
        address: editFormData.address,
        emergencyContact: {
          name: editFormData.emergencyName,
          phone: editFormData.emergencyPhone,
          relation: editFormData.emergencyRelation,
        },
        notes: editFormData.notes,
      });
      setIsEditModalOpen(false);
      fetchMember();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update member');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAssignTrainerSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await adminService.assignTrainer(member._id, selectedTrainerId || null);
      setIsTrainerModalOpen(false);
      fetchMember();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign coach');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAssignMembershipSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await adminService.assignMembership(
        member._id,
        membershipForm.membershipPlanId,
        membershipForm.startDate
      );
      setIsMembershipModalOpen(false);
      fetchMember();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign membership');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    setModalLoading(true);
    try {
      await adminService.updateMemberStatus(member._id, !member.user?.isActive);
      setIsStatusModalOpen(false);
      fetchMember();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-xs uppercase font-bold tracking-wider text-slate-400">
          Loading Member Profile...
        </p>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="p-8 rounded-3xl bg-red-50 dark:bg-red-950/30 text-center space-y-3">
        <p className="text-sm font-bold text-red-600 dark:text-red-400">{error || 'Member not found.'}</p>
        <Button to="/admin/members" variant="outline" size="sm">
          Return to Member Directory
        </Button>
      </div>
    );
  }

  const bmi = calculateBmi();

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/members"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {member.user?.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Member ID: {member._id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outlineMuted"
            size="sm"
            icon={Edit}
            iconPosition="left"
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Profile
          </Button>

          <Button
            type="button"
            variant={member.user?.isActive ? 'outline' : 'primary'}
            size="sm"
            onClick={() => setIsStatusModalOpen(true)}
          >
            {member.user?.isActive ? 'Deactivate Member' : 'Activate Member'}
          </Button>
        </div>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Core Identity Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col items-center text-center space-y-3 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary-600 to-primary-500 text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-primary-500/20">
                {member.user?.name ? member.user.name.charAt(0).toUpperCase() : 'M'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {member.user?.name}
                </h3>
                <p className="text-xs text-slate-400">Enrolled Member</p>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={member.user?.isActive ? 'active' : 'inactive'} />
                <StatusBadge status={member.membershipStatus} />
              </div>
            </div>

            {/* Quick Contact Details */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                <Mail className="w-4 h-4 text-primary-500 shrink-0" />
                <span className="truncate">{member.user?.email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                <Phone className="w-4 h-4 text-primary-500 shrink-0" />
                <span>{member.user?.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-primary-500 shrink-0" />
                <span>
                  Member Since:{' '}
                  {member.user?.createdAt
                    ? new Date(member.user.createdAt).toLocaleDateString()
                    : '—'}
                </span>
              </div>
              {member.address && (
                <div className="flex items-start gap-2.5 text-slate-600 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                  <span>{member.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-red-500" /> Emergency Contact
            </h4>
            {member.emergencyContact?.name ? (
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">
                  {member.emergencyContact.name}{' '}
                  <span className="font-normal text-slate-400">
                    ({member.emergencyContact.relation || 'Relation unspecified'})
                  </span>
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  {member.emergencyContact.phone}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No emergency contact provided.</p>
            )}
          </div>
        </div>

        {/* Right Column: Physical Metrics, Membership, Coach (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card: Body Metrics & Fitness Goal */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-500" /> Physical Metrics &amp; Objectives
              </h4>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-500 uppercase">
                {member.fitnessGoal?.replace('_', ' ') || 'General Fitness'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Height</p>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {member.height ? `${member.height} cm` : '—'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Weight</p>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {member.weight ? `${member.weight} kg` : '—'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Derived BMI</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {bmi ? bmi.value : '—'}
                  </span>
                  {bmi && (
                    <span className={`text-[10px] font-bold ${bmi.catColor}`}>
                      ({bmi.category})
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Gender</p>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-1 capitalize">
                  {member.gender || 'Unspecified'}
                </p>
              </div>
            </div>

            {member.notes && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 text-xs">
                <p className="font-semibold text-slate-500 mb-1">Coach / Desk Notes:</p>
                <p className="text-slate-700 dark:text-slate-300">{member.notes}</p>
              </div>
            )}
          </div>

          {/* Card: Membership Subscription */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary-500" /> Membership Plan Subscription
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMembershipModalOpen(true)}
              >
                {member.membershipPlan ? 'Change Plan' : 'Assign Plan'}
              </Button>
            </div>

            {member.membershipPlan ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <h5 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {member.membershipPlan.name}
                    </h5>
                    <p className="text-xs text-slate-400">
                      Duration: {member.membershipPlan.durationMonths} Months • ₹{member.membershipPlan.price}
                    </p>
                  </div>
                  <StatusBadge status={member.membershipStatus} />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <div>
                    <span className="text-slate-400">Start Date:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {member.membershipStartDate
                        ? new Date(member.membershipStartDate).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Expiration Date:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {member.membershipEndDate
                        ? new Date(member.membershipEndDate).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-400">No active membership plan attached to this athlete.</p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsMembershipModalOpen(true)}
                >
                  Assign Plan Now
                </Button>
              </div>
            )}
          </div>

          {/* Card: Coach Assignment */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-500" /> Assigned Master Coach
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsTrainerModalOpen(true)}
              >
                {member.assignedTrainer ? 'Change Coach' : 'Assign Coach'}
              </Button>
            </div>

            {member.assignedTrainer ? (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm">
                    {member.assignedTrainer.name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      {member.assignedTrainer.name}
                    </h5>
                    <p className="text-xs text-slate-400">
                      {member.assignedTrainer.email} • {member.assignedTrainer.phone}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/admin/trainers/${member.assignedTrainer._id}`}
                  className="text-xs text-blue-500 font-bold hover:underline"
                >
                  View Coach Profile &rarr;
                </Link>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-400">This member trains autonomously without an assigned personal trainer.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTrainerModalOpen(true)}
                >
                  Assign Dedicated Coach
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto space-y-5">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Edit Member Profile
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Phone</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Gender</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="unspecified">Unspecified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">DOB</label>
                  <input
                    type="date"
                    value={editFormData.dateOfBirth}
                    onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Height (cm)</label>
                  <input
                    type="number"
                    value={editFormData.height}
                    onChange={(e) => setEditFormData({ ...editFormData, height: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Weight (kg)</label>
                  <input
                    type="number"
                    value={editFormData.weight}
                    onChange={(e) => setEditFormData({ ...editFormData, weight: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Fitness Goal</label>
                <select
                  value={editFormData.fitnessGoal}
                  onChange={(e) => setEditFormData({ ...editFormData, fitnessGoal: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="general_fitness">General Fitness</option>
                  <option value="weight_loss">Weight Loss</option>
                  <option value="muscle_building">Muscle Building</option>
                  <option value="strength">Raw Strength</option>
                  <option value="weight_gain">Weight Gain</option>
                  <option value="endurance">Endurance</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Emergency Name</label>
                  <input
                    type="text"
                    value={editFormData.emergencyName}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Emergency Phone</label>
                  <input
                    type="tel"
                    value={editFormData.emergencyPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyPhone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Relation</label>
                  <input
                    type="text"
                    value={editFormData.emergencyRelation}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyRelation: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Address</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Notes</label>
                <textarea
                  rows="2"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outlineMuted" size="sm" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={modalLoading}>
                  {modalLoading ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Coach Modal */}
      {isTrainerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsTrainerModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Assign Dedicated Coach
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select an active certified coach from the FitCore roster.
            </p>

            <form onSubmit={handleAssignTrainerSubmit} className="space-y-4 text-xs">
              <select
                value={selectedTrainerId}
                onChange={(e) => setSelectedTrainerId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">No Coach (Unassigned)</option>
                {trainers.map((t) => (
                  <option key={t.user?._id || t._id} value={t.user?._id}>
                    {t.user?.name} ({t.specializations?.slice(0, 2).join(', ') || 'Coach'})
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outlineMuted" size="sm" onClick={() => setIsTrainerModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={modalLoading}>
                  {modalLoading ? 'Updating Coach...' : 'Save Assignment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Membership Plan Modal */}
      {isMembershipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsMembershipModalOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 z-10 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Assign Membership Subscription
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              End date will be automatically computed based on the selected plan duration.
            </p>

            <form onSubmit={handleAssignMembershipSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Select Plan *</label>
                <select
                  required
                  value={membershipForm.membershipPlanId}
                  onChange={(e) => setMembershipForm({ ...membershipForm, membershipPlanId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">Select Plan...</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — ₹{p.price} ({p.durationMonths} Mo)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Subscription Start Date</label>
                <input
                  type="date"
                  required
                  value={membershipForm.startDate}
                  onChange={(e) => setMembershipForm({ ...membershipForm, startDate: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outlineMuted" size="sm" onClick={() => setIsMembershipModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={modalLoading}>
                  {modalLoading ? 'Assigning Plan...' : 'Activate Subscription'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Active/Inactive toggle */}
      <ConfirmModal
        isOpen={isStatusModalOpen}
        title={member.user?.isActive ? 'Deactivate Member Account' : 'Activate Member Account'}
        message={`Are you sure you want to ${
          member.user?.isActive ? 'deactivate' : 'activate'
        } ${member.user?.name}?`}
        confirmText={member.user?.isActive ? 'Deactivate' : 'Activate'}
        confirmVariant={member.user?.isActive ? 'outline' : 'primary'}
        loading={modalLoading}
        onConfirm={handleToggleStatus}
        onCancel={() => setIsStatusModalOpen(false)}
      />
    </div>
  );
};

export default MemberDetails;
