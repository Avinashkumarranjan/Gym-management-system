import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Scale,
  Activity,
  Plus,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import progressService from '../../services/progressService';
import Button from '../../components/common/Button';

const MemberProgress = () => {
  const [entries, setEntries] = useState([]);
  const [latestData, setLatestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bodyFatPercentage, setBodyFatPercentage] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [arms, setArms] = useState('');
  const [shoulders, setShoulders] = useState('');
  const [thighs, setThighs] = useState('');
  const [hips, setHips] = useState('');
  const [notes, setNotes] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  // Chart Metric Tab
  const [activeMetric, setActiveMetric] = useState('weight'); // 'weight' | 'bmi' | 'bodyFat'

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError('');
      const [historyRes, latestRes] = await Promise.all([
        progressService.getMyProgress(),
        progressService.getLatestProgress(),
      ]);

      if (historyRes.success) {
        setEntries(historyRes.data || []);
        if (historyRes.profileHeight && !height) {
          setHeight(historyRes.profileHeight);
        }
      }

      if (latestRes.success && latestRes.data) {
        setLatestData(latestRes.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load progress records.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, []);

  const handleLogProgress = async (e) => {
    e.preventDefault();
    if (!weight || Number(weight) <= 0) {
      setFormError('Please enter a valid weight in kg.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      const payload = {
        weight: Number(weight),
        height: height ? Number(height) : undefined,
        bodyFatPercentage: bodyFatPercentage ? Number(bodyFatPercentage) : undefined,
        date: logDate || new Date().toISOString(),
        measurements: {
          chest: chest ? Number(chest) : undefined,
          waist: waist ? Number(waist) : undefined,
          arms: arms ? Number(arms) : undefined,
          shoulders: shoulders ? Number(shoulders) : undefined,
          thighs: thighs ? Number(thighs) : undefined,
          hips: hips ? Number(hips) : undefined,
        },
        notes,
      };

      const res = await progressService.addMyProgress(payload);
      if (res.success) {
        setSuccessMsg('Body metrics recorded successfully!');
        setIsModalOpen(false);
        setWeight('');
        setBodyFatPercentage('');
        setChest('');
        setWaist('');
        setArms('');
        setShoulders('');
        setThighs('');
        setHips('');
        setNotes('');
        await fetchProgressData();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      setFormError(
        err.response?.data?.message || err.message || 'Failed to save progress entry.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Format chart data
  const chartData = entries.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: entry.weight,
    bmi: entry.bmi,
    bodyFat: entry.bodyFatPercentage || null,
  }));

  const hasBodyFatData = entries.some((e) => e.bodyFatPercentage != null);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-violet-600 via-purple-700 to-indigo-800 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-purple-200">
              <TrendingUp className="w-3.5 h-3.5" />
              Body Composition Analytics
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Physical Progress Tracking
            </h1>
            <p className="text-xs md:text-sm text-purple-100/90 max-w-xl">
              Log periodic weight readings, circumference measurements, and track body transformation trends.
            </p>
          </div>

          <div>
            <Button
              variant="primary"
              onClick={() => {
                setFormError('');
                setIsModalOpen(true);
              }}
              className="bg-white hover:bg-slate-100 text-purple-900 font-bold border-none shadow-md shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log New Measurement
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Weight */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Current Weight</span>
            <Scale className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {latestData?.currentWeight ? `${latestData.currentWeight} kg` : '—'}
          </div>
          <div className="text-[10px] text-slate-400">Recorded Metric</div>
        </div>

        {/* Calculated BMI */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Body Mass Index</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {latestData?.bmi || '—'}
          </div>
          <div className="text-[10px] text-slate-400">
            {latestData?.bmiCategory || 'Profile Height Needed'}
          </div>
        </div>

        {/* Body Fat % */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Body Fat</span>
            <Target className="w-4 h-4 text-pink-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {latestData?.latestEntry?.bodyFatPercentage != null
              ? `${latestData.latestEntry.bodyFatPercentage}%`
              : '—'}
          </div>
          <div className="text-[10px] text-slate-400">Adipose Tissue Ratio</div>
        </div>

        {/* Total Checkpoints */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Checkpoints</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {entries.length}
          </div>
          <div className="text-[10px] text-slate-400">Logs on Record</div>
        </div>
      </div>

      {/* Progress Charts Section */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-500" />
              Body Transformation Trend
            </h2>
            <p className="text-xs text-slate-500">
              Interactive timeline charting your body progression over training cycles.
            </p>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveMetric('weight')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeMetric === 'weight'
                  ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Weight (kg)
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric('bmi')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeMetric === 'bmi'
                  ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              BMI
            </button>
            {hasBodyFatData && (
              <button
                type="button"
                onClick={() => setActiveMetric('bodyFat')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  activeMetric === 'bodyFat'
                    ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Body Fat %
              </button>
            )}
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Scale className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              No progress measurements recorded yet.
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start logging your weight and body measurements to unlock your progression trend charts.
            </p>
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              className="mt-2 text-xs bg-violet-600 hover:bg-violet-700 font-bold"
            >
              Log First Entry
            </Button>
          </div>
        ) : entries.length === 1 ? (
          <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-violet-500 mx-auto" />
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Single Checkpoint Logged: {entries[0].weight} kg
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Log at least one additional progress reading to view your interactive graphical trajectory.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                />
                <YAxis
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                {activeMetric === 'weight' && (
                  <Line
                    type="monotone"
                    dataKey="weight"
                    name="Weight (kg)"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#8b5cf6' }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {activeMetric === 'bmi' && (
                  <Line
                    type="monotone"
                    dataKey="bmi"
                    name="BMI"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#06b6d4' }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {activeMetric === 'bodyFat' && (
                  <Line
                    type="monotone"
                    dataKey="bodyFat"
                    name="Body Fat %"
                    stroke="#ec4899"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#ec4899' }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Progress History Table */}
      {entries.length > 0 && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-500" />
            Measurement Log History
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="p-3.5 pl-4">Date</th>
                  <th className="p-3.5">Weight</th>
                  <th className="p-3.5">BMI</th>
                  <th className="p-3.5">Body Fat</th>
                  <th className="p-3.5">Circumferences</th>
                  <th className="p-3.5 pr-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[...entries].reverse().map((entry) => (
                  <tr
                    key={entry._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 pl-4 font-bold text-slate-900 dark:text-white">
                      {new Date(entry.date).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 font-black text-violet-600 dark:text-violet-400 text-sm">
                      {entry.weight} kg
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      {entry.bmi ? `${entry.bmi}` : '—'}
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      {entry.bodyFatPercentage != null ? `${entry.bodyFatPercentage}%` : '—'}
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {entry.measurements && (
                        <div className="flex flex-wrap gap-2 text-[10px]">
                          {entry.measurements.waist && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                              Waist: {entry.measurements.waist}cm
                            </span>
                          )}
                          {entry.measurements.chest && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                              Chest: {entry.measurements.chest}cm
                            </span>
                          )}
                          {entry.measurements.arms && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                              Arms: {entry.measurements.arms}cm
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 pr-4 text-slate-400 italic max-w-xs truncate">
                      {entry.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Progress Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-violet-600" />
                Log Body Composition Metrics
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleLogProgress} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="400"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="e.g. 78.5"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g. 178"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Body Fat % (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="70"
                    value={bodyFatPercentage}
                    onChange={(e) => setBodyFatPercentage(e.target.value)}
                    placeholder="e.g. 15.5"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Measurement Date
                  </label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              {/* Optional Circumferences */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Circumference Measurements (cm, Optional)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Chest"
                    value={chest}
                    onChange={(e) => setChest(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Waist"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Arms"
                    value={arms}
                    onChange={(e) => setArms(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Shoulders"
                    value={shoulders}
                    onChange={(e) => setShoulders(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Thighs"
                    value={thighs}
                    onChange={(e) => setThighs(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Hips"
                    value={hips}
                    onChange={(e) => setHips(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Training / Nutrition Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Completed week 4 of hypertrophy split, feeling energetic..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-700 font-bold"
                >
                  {saving ? 'Saving Metrics...' : 'Save Checkpoint'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberProgress;
