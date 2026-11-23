import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  CheckCircle2, 
  XCircle, 
  Target, 
  Percent, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw 
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';
import { api } from '../services/api';
import { HitMissAnalysis } from '../types';

export const HitMissPage: React.FC = () => {
  const [data, setData] = useState<HitMissAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await api.getHitMiss();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const donutData = data
    ? [
        { name: 'Hits (Correct)', value: data.hitsCount || 1, color: '#10B981' },
        { name: 'Misses (Error)', value: data.missesCount || 0, color: '#EF4444' }
      ]
    : [];

  const barData = data
    ? [
        { name: 'Intrusions (TP + FP)', count: data.truePositives + data.falsePositives, fill: '#EF4444' },
        { name: 'Normal Traffic (TN + FN)', count: data.trueNegatives + data.falseNegatives, fill: '#10B981' }
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
            Module 3: Hit–Miss Analysis Under Real-Time Workloads
          </span>
          <h2 className="text-xl font-tech font-bold text-slate-900 dark:text-slate-100">
            DETECTION ACCURACY & CONFUSION MATRIX
          </h2>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
            Evaluates pipelined classification against ground-truth labels across real-time streams.
          </p>
        </div>

        <button
          onClick={fetchAnalysis}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-mono flex items-center gap-1.5 transition text-slate-700 dark:text-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Confusion Matrix & Key Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Confusion Matrix (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-tech font-bold text-slate-900 dark:text-slate-100 uppercase mb-4">
            CONFUSION MATRIX
          </h3>

          <div className="grid grid-cols-2 gap-3 text-center font-mono">
            {/* TP */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/50">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase block font-bold">
                TRUE POSITIVE (TP)
              </span>
              <span className="text-2xl font-tech font-bold text-emerald-600 dark:text-emerald-400">
                {data?.truePositives ?? 0}
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Actual Intrusion → Detected Intrusion
              </p>
            </div>

            {/* FP */}
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500/50">
              <span className="text-[10px] text-amber-700 dark:text-amber-300 uppercase block font-bold">
                FALSE POSITIVE (FP)
              </span>
              <span className="text-2xl font-tech font-bold text-amber-600 dark:text-amber-400">
                {data?.falsePositives ?? 0}
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Normal Traffic → Flagged Intrusion (False Alarm)
              </p>
            </div>

            {/* FN */}
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border-2 border-red-500/50">
              <span className="text-[10px] text-red-700 dark:text-red-300 uppercase block font-bold">
                FALSE NEGATIVE (FN)
              </span>
              <span className="text-2xl font-tech font-bold text-red-600 dark:text-red-400">
                {data?.falseNegatives ?? 0}
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Actual Intrusion → Missed as Safe
              </p>
            </div>

            {/* TN */}
            <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border-2 border-cyan-500/50">
              <span className="text-[10px] text-cyan-700 dark:text-cyan-300 uppercase block font-bold">
                TRUE NEGATIVE (TN)
              </span>
              <span className="text-2xl font-tech font-bold text-cyan-600 dark:text-cyan-400">
                {data?.trueNegatives ?? 0}
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Normal Traffic → Verified Safe
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span>Total Evaluated Records:</span>
            <strong className="text-slate-900 dark:text-slate-100">{data?.totalProcessed ?? 0}</strong>
          </div>
        </div>

        {/* Statistical Performance Cards (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block">Accuracy</span>
            <span className="text-2xl sm:text-3xl font-tech font-bold text-cyan-600 dark:text-cyan-400">
              {data?.accuracy ?? 100}%
            </span>
            <p className="text-[10px] font-mono text-slate-400 mt-1">(TP + TN) ÷ Total</p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block">Precision</span>
            <span className="text-2xl sm:text-3xl font-tech font-bold text-emerald-600 dark:text-emerald-400">
              {data?.precision ?? 100}%
            </span>
            <p className="text-[10px] font-mono text-slate-400 mt-1">TP ÷ (TP + FP)</p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block">Recall</span>
            <span className="text-2xl sm:text-3xl font-tech font-bold text-blue-600 dark:text-blue-400">
              {data?.recall ?? 100}%
            </span>
            <p className="text-[10px] font-mono text-slate-400 mt-1">TP ÷ (TP + FN)</p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block">F1-Score</span>
            <span className="text-2xl sm:text-3xl font-tech font-bold text-purple-600 dark:text-purple-400">
              {data?.f1Score ?? 100}%
            </span>
            <p className="text-[10px] font-mono text-slate-400 mt-1">Harmonic mean P & R</p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block">Detection Rate</span>
            <span className="text-2xl sm:text-3xl font-tech font-bold text-teal-600 dark:text-teal-400">
              {data?.detectionRate ?? 100}%
            </span>
            <p className="text-[10px] font-mono text-slate-400 mt-1">True positive rate</p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block">False Alarm Rate</span>
            <span className="text-2xl sm:text-3xl font-tech font-bold text-amber-600 dark:text-amber-400">
              {data?.falseAlarmRate ?? 0}%
            </span>
            <p className="text-[10px] font-mono text-slate-400 mt-1">FP ÷ (FP + TN)</p>
          </div>
        </div>
      </div>

      {/* Charts Section: Donut + Bar + Accuracy Trend Line */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Donut: Hits vs Misses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h4 className="text-xs font-tech font-bold uppercase text-slate-700 dark:text-slate-300 mb-3">
            HITS VS MISSES DISTRIBUTION
          </h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar: Intrusion vs Normal */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h4 className="text-xs font-tech font-bold uppercase text-slate-700 dark:text-slate-300 mb-3">
            TRAFFIC VOLUME CLASSIFICATION
          </h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line: Accuracy Trend over last N records */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h4 className="text-xs font-tech font-bold uppercase text-slate-700 dark:text-slate-300 mb-3">
            ACCURACY TREND (LAST 50 RECORDS)
          </h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="index" tick={{ fontSize: 10 }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                  name="Accuracy %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
