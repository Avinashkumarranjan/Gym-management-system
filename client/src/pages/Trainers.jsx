import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  X,
  CheckCircle2,
  Clock,
  CalendarCheck,
  UserCheck,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import memberService from '../services/memberService';

const fallbackTrainers = [
  {
    _id: 'fallback-1',
    name: 'Rahul Sharma',
    specializations: ['Strength & Conditioning', 'Compound Lifting'],
    experienceYears: 5,
    initials: 'RS',
    color: 'from-blue-600 to-indigo-800',
    bio: 'Former national powerlifting athlete passionate about scientific barbell mechanics, hyper-efficient compound lifting, and neurological strength development.',
    qualifications: ['CSCS Certified Strength Coach', 'USA Weightlifting Level 2', 'CPR/AED Pro'],
  },
  {
    _id: 'fallback-2',
    name: 'Priya Mehta',
    specializations: ['Yoga & Mobility', 'Functional Range'],
    experienceYears: 4,
    initials: 'PM',
    color: 'from-emerald-600 to-teal-800',
    bio: 'Integrates traditional Vinyasa with contemporary functional range conditioning, joint hygiene, and spinal decompression techniques.',
    qualifications: ['RYT-500 Yoga Alliance', 'Functional Range Conditioning (FRC)', 'Mobility Specialist'],
  },
  {
    _id: 'fallback-3',
    name: 'Arjun Verma',
    specializations: ['Fat Loss & Functional Training', 'Metabolic HIIT'],
    experienceYears: 6,
    initials: 'AV',
    color: 'from-amber-600 to-orange-800',
    bio: 'High-energy coach dedicated to high-volume metabolic conditioning, kettlebell complexes, and sustainable body recomposition strategies.',
    qualifications: ['ACE Certified Personal Trainer', 'Precision Nutrition Level 1', 'Kettlebell Athletics'],
  },
];

const colorPalette = [
  'from-blue-600 to-indigo-800',
  'from-emerald-600 to-teal-800',
  'from-amber-600 to-orange-800',
  'from-purple-600 to-violet-800',
  'from-rose-600 to-red-800',
  'from-cyan-600 to-blue-800',
];

const Trainers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  // Member Coaching Status
  const [hasActiveMembership, setHasActiveMembership] = useState(false);
  const [assignedCoach, setAssignedCoach] = useState(null);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState({ type: '', text: '' });

  const fetchTrainersAndMemberStatus = async () => {
    try {
      setLoading(true);
      const [trainersRes, memberRes] = await Promise.allSettled([
        memberService.getAvailableTrainers(),
        user?.role === 'member' ? memberService.getTrainer() : Promise.resolve(null),
      ]);

      if (trainersRes.status === 'fulfilled' && trainersRes.value?.success && trainersRes.value.data?.length > 0) {
        setTrainers(trainersRes.value.data);
      } else {
        setTrainers(fallbackTrainers);
      }

      if (memberRes.status === 'fulfilled' && memberRes.value?.success) {
        setHasActiveMembership(!!memberRes.value.hasActiveMembership);
        setAssignedCoach(memberRes.value.trainer || null);
        setCurrentRequest(memberRes.value.assignmentRequest || null);
      }
    } catch {
      setTrainers(fallbackTrainers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainersAndMemberStatus();
  }, [user]);

  const handleRequestCoach = async (trainer) => {
    if (!user) {
      navigate('/login?redirect=/trainers');
      return;
    }

    if (user.role !== 'member') {
      return;
    }

    if (!hasActiveMembership) {
      navigate('/membership');
      return;
    }

    try {
      setRequestLoading(true);
      setRequestFeedback({ type: '', text: '' });
      const res = await memberService.requestTrainer({
        trainerId: trainer._id,
        notes: `Member preference submitted for coach ${trainer.name}`,
      });

      if (res.success) {
        setRequestFeedback({
          type: 'success',
          text: `Request submitted for ${trainer.name}. Our administration team will confirm your assignment.`,
        });
        setCurrentRequest(res.data);
      }
    } catch (err) {
      setRequestFeedback({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Unable to submit coach request.',
      });
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary-500 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-900">
            Certified Master Coaches
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Our Elite Coaching Team
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
            Every FitCore trainer holds accredited international sports science credentials and brings genuine passion for member milestones.
          </p>
        </div>

        {/* Trainers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-96 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trainers.map((trainer, idx) => {
              const color = colorPalette[idx % colorPalette.length];
              const initials = trainer.name
                ? trainer.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                : 'FC';

              const isAssignedToThisTrainer =
                assignedCoach &&
                (assignedCoach._id?.toString() === trainer._id?.toString() ||
                  assignedCoach.name?.toLowerCase() === trainer.name?.toLowerCase());

              const isRequestedThisTrainer =
                currentRequest?.status === 'pending' &&
                currentRequest?.requestedTrainer?._id?.toString() === trainer._id?.toString();

              return (
                <div
                  key={trainer._id || idx}
                  className="group overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Card Banner / Avatar */}
                  <div
                    className={`h-48 bg-gradient-to-tr ${color} p-6 relative flex items-end justify-between`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-2xl font-black shadow-inner">
                      {initials}
                    </div>

                    {isAssignedToThisTrainer ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                        <UserCheck className="w-3.5 h-3.5" /> Your Trainer
                      </span>
                    ) : isRequestedThisTrainer ? (
                      <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                        <Clock className="w-3.5 h-3.5" /> Request Pending
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary-400" /> Verified Coach
                      </span>
                    )}
                  </div>

                  {/* Content Body */}
                  <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors">
                        {trainer.name}
                      </h3>
                      <p className="text-sm font-semibold text-primary-500 mt-1">
                        {trainer.specializations?.join(', ') || 'Certified Fitness Coach'}
                      </p>

                      <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-500 dark:text-slate-400">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>{trainer.experienceYears || 3}+ Years Experience</span>
                      </div>

                      <p className="mt-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                        {trainer.bio ||
                          'Dedicated to helping members master functional movements and attain peak fitness.'}
                      </p>
                    </div>

                    <div className="pt-6 flex flex-col gap-2">
                      {isAssignedToThisTrainer ? (
                        <Link to="/member/schedule" className="w-full">
                          <Button
                            variant="primary"
                            className="w-full justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                            icon={CalendarCheck}
                          >
                            Book Session
                          </Button>
                        </Link>
                      ) : isRequestedThisTrainer ? (
                        <Button
                          disabled
                          variant="outlineMuted"
                          className="w-full justify-center opacity-70 cursor-not-allowed text-xs font-bold"
                          icon={Clock}
                        >
                          Request Pending
                        </Button>
                      ) : null}

                      <Button
                        type="button"
                        variant={isAssignedToThisTrainer ? 'outlineMuted' : 'outlineMuted'}
                        className="w-full justify-center group-hover:border-primary-500 group-hover:text-primary-500 text-xs font-semibold"
                        onClick={() => {
                          setSelectedTrainer({ ...trainer, color, initials });
                          setRequestFeedback({ type: '', text: '' });
                        }}
                      >
                        {isAssignedToThisTrainer ? 'Coach Profile' : 'View Profile & Match'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Trainer Detail Modal */}
        {selectedTrainer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${selectedTrainer.color} flex items-center justify-center text-white font-black text-xl shadow-md`}
                  >
                    {selectedTrainer.initials}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {selectedTrainer.name}
                    </h3>
                    <p className="text-sm text-primary-500 font-medium">
                      {selectedTrainer.specializations?.join(', ') || 'Personal Trainer'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedTrainer.experienceYears || 3} Years Experience
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTrainer(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  About the Coach
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedTrainer.bio ||
                    'Specializes in biomechanics, progressive strength, and personalized conditioning.'}
                </p>
              </div>

              {selectedTrainer.qualifications && selectedTrainer.qualifications.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Key Credentials &amp; Certifications
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {selectedTrainer.qualifications.map((cert, cIdx) => (
                      <li key={cIdx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Feedback Alert */}
              {requestFeedback.text && (
                <div
                  className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                    requestFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                  }`}
                >
                  {requestFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{requestFeedback.text}</span>
                </div>
              )}

              {/* Action Buttons based on User Role & Membership */}
              <div className="pt-2">
                {!user ? (
                  <Button
                    to={`/login?redirect=/trainers`}
                    variant="primary"
                    className="w-full justify-center"
                    onClick={() => setSelectedTrainer(null)}
                  >
                    Login to Request Coach
                  </Button>
                ) : user.role !== 'member' ? (
                  <Button
                    to={user.role === 'admin' ? '/admin/trainers' : '/trainer/dashboard'}
                    variant="primary"
                    className="w-full justify-center"
                    onClick={() => setSelectedTrainer(null)}
                  >
                    Staff Management Portal
                  </Button>
                ) : !hasActiveMembership ? (
                  <Button
                    to="/membership"
                    variant="primary"
                    className="w-full justify-center"
                    onClick={() => setSelectedTrainer(null)}
                  >
                    Enroll Membership to Request Coach
                  </Button>
                ) : assignedCoach &&
                  (assignedCoach._id?.toString() === selectedTrainer._id?.toString() ||
                    assignedCoach.name?.toLowerCase() === selectedTrainer.name?.toLowerCase()) ? (
                  <Link to="/member/schedule" className="block w-full">
                    <Button
                      variant="primary"
                      className="w-full justify-center bg-emerald-600 hover:bg-emerald-500 shadow-md"
                      icon={CalendarCheck}
                      onClick={() => setSelectedTrainer(null)}
                    >
                      Book 1-on-1 Session
                    </Button>
                  </Link>
                ) : assignedCoach ? (
                  <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-center text-slate-600 dark:text-slate-300">
                    You are currently assigned to <strong className="text-slate-900 dark:text-white">{assignedCoach.name}</strong>. Contact club reception to request a coach change.
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    loading={requestLoading}
                    disabled={requestLoading}
                    className="w-full justify-center"
                    icon={UserCheck}
                    onClick={() => handleRequestCoach(selectedTrainer)}
                  >
                    Request This Trainer
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trainers;
