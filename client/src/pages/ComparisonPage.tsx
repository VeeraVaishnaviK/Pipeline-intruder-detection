import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Cpu, 
  Timer, 
  Gauge, 
  Zap, 
  AlertTriangle, 
  Download, 
  Play, 
  RefreshCw 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { api } from '../services/api';
import { ComparisonResult } from '../types';

export const ComparisonPage: React.FC = () => {
  const [nRecords, setNRecords] = useState<number>(20);
  const [data, setData] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runComparison = async () => {
    setLoading(true);
    try {
      const res = await api.getComparison(nRecords);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runComparison();
  }, []);

  const timeComparisonData = data
    ? [
        {
          metric: 'Total Time (ms)',
          Pipelined: data.measured.pipelinedTimeMs,
          Sequential: data.measured.sequentialTimeMs
        },
        {
          metric: 'Avg Latency (ms)',
          Pipelined: data.measured.pipelinedAvgLatencyMs,
          Sequential: data.measured.sequentialAvgLatencyMs
        }
      ]
    : [];

  const throughputComparisonData = data
    ? [
        {
          metric: 'Throughput (req/s)',
          Pipelined: data.measured.pipelinedThroughput,
          Sequential: data.measured.sequentialThroughput
        }
      ]
    : [];

  const stageColorMap = [
    '#06b6d4', // S1: cyan
    '#3b82f6', // S2: blue
    '#8b5cf6', // S3: purple
    '#ec4899', // S4: pink (bottleneck)
    '#f59e0b', // S5: amber
    '#10b981'  // S6: emerald
  ];

  const exportReport = () => {
    if (!data) return;
    const report = `PIPELINED INTRUDER DETECTION SYSTEM - ARCHITECTURE EVALUATION REPORT
Date: ${new Date().toISOString()}

1. EXPERIMENTAL PARAMETERS:
- Workload (N): ${data.nRecords} records
- Pipeline Stages (k): ${data.numStages} stages
- Stage Delay (t): ${data.stageDelayMs} ms

2. THEORETICAL ANALYSIS:
- Pipelined Formula: ${data.theoretical.pipelinedFormula}
- Sequential Formula: ${data.theoretical.sequentialFormula}
- Theoretical Speedup: ${data.theoretical.speedupFormula}

3. EMPIRICAL MEASUREMENTS:
- Pipelined Total Time: ${data.measured.pipelinedTimeMs} ms
- Sequential Total Time: ${data.measured.sequentialTimeMs} ms
- Measured Speedup: ${data.measured.actualSpeedup}x
- Pipelined Throughput: ${data.measured.pipelinedThroughput} req/sec
- Sequential Throughput: ${data.measured.sequentialThroughput} req/sec

4. BOTTLENECK ANALYSIS:
- Bottleneck Stage: Stage ${data.bottleneck.stageIndex} (${data.bottleneck.stageName}) - ${data.bottleneck.avgTimeMs} ms
- Optimization: ${data.bottleneck.suggestion}
`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ids_pipeline_report_${data.nRecords}_records.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Title & Controls Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
            Module 4: Performance Evaluation & Optimization
          </span>
          <h2 className="text-xl font-tech font-bold text-slate-900 dark:text-slate-100">
            PIPELINED VS SEQUENTIAL ARCHITECTURE COMPARISON
          </h2>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
            Empirical speedup, classic computer architecture timing diagrams, and bottleneck profiling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span>N =</span>
            <select
              value={nRecords}
              onChange={(e) => setNRecords(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="10">10 records</option>
              <option value="20">20 records (Standard)</option>
              <option value="50">50 records</option>
              <option value="100">100 records</option>
            </select>
          </div>

          <button
            onClick={runComparison}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-tech font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Run Benchmark
          </button>

          <button
            onClick={exportReport}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Export Report"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Speedup & Formula Summary Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/40 glow-cyan">
          <span className="text-xs font-mono text-cyan-700 dark:text-cyan-300 uppercase font-bold">
            MEASURED SPEEDUP
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-tech font-bold text-cyan-600 dark:text-cyan-400">
              {data?.measured.actualSpeedup ?? 4.6}×
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Faster than Sequential
            </span>
          </div>
          <p className="mt-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            Theoretical speedup for N={data?.nRecords}: {data?.theoretical.speedup}×
          </p>
        </div>

        <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm font-mono text-xs space-y-2.5">
          <h4 className="font-tech font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            COMPUTER ARCHITECTURE FORMULATION
          </h4>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-cyan-600 dark:text-cyan-400">
            <strong>Pipelined Execution Time:</strong> {data?.theoretical.pipelinedFormula}
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-400">
            <strong>Sequential Execution Time:</strong> {data?.theoretical.sequentialFormula}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Formula terms: k = {data?.numStages} stages, n = {data?.nRecords} records, t = {data?.stageDelayMs} ms clock cycle delay.
          </div>
        </div>
      </div>

      {/* Comparison Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Time & Latency Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h4 className="text-xs font-tech font-bold uppercase text-slate-700 dark:text-slate-300 mb-4">
            TOTAL EXECUTION TIME (ms)
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeComparisonData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Pipelined" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Sequential" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Throughput Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h4 className="text-xs font-tech font-bold uppercase text-slate-700 dark:text-slate-300 mb-4">
            THROUGHPUT COMPARISON (CHECKS / SEC)
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={throughputComparisonData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Pipelined" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Sequential" fill="#94a3b8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Per-Stage Timing & Bottleneck Identification */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
              Clock Period & Critical Path Profiling
            </span>
            <h3 className="text-base font-tech font-bold text-slate-900 dark:text-slate-100">
              PER-STAGE EXECUTION DELAYS & BOTTLENECK IDENTIFICATION
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.stageTimings || []} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="stageName" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="avgTimeMs" radius={[6, 6, 0, 0]}>
                  {data?.stageTimings.map((entry, index) => (
                    <Cell
                      key={`stage-cell-${index}`}
                      fill={entry.isBottleneck ? '#ef4444' : '#06b6d4'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-5 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-500/40 space-y-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-tech font-bold text-sm uppercase">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Bottleneck Detected: Stage {data?.bottleneck.stageIndex} ({data?.bottleneck.stageName})
            </div>
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
              Average delay: <strong>{data?.bottleneck.avgTimeMs} ms</strong> (critical path limiter).
            </p>
            <div className="mt-2 p-2.5 rounded bg-white dark:bg-slate-900 text-[11px] font-mono text-slate-600 dark:text-slate-400 border border-red-200 dark:border-red-900">
              <strong>Optimization Recommendation:</strong>
              <p className="mt-1">{data?.bottleneck.suggestion}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Classic Computer Architecture Pipeline Gantt Diagram */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
              Instruction Pipeline Timing Diagram
            </span>
            <h3 className="text-base font-tech font-bold text-slate-900 dark:text-slate-100">
              COMPUTER ARCHITECTURE GANTT TIMING DIAGRAM
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            {['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((s, idx) => (
              <span key={s} className="px-1.5 py-0.5 rounded text-white font-bold" style={{ backgroundColor: stageColorMap[idx] }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[650px] space-y-2 text-xs font-mono">
            {data?.ganttChart.map((record, rIdx) => (
              <div key={record.recordId} className="flex items-center gap-2">
                <span className="w-20 font-bold text-slate-600 dark:text-slate-300 shrink-0">
                  {record.recordId}:
                </span>
                <div className="flex-1 flex gap-1 bg-slate-50 dark:bg-slate-800/40 p-1 rounded-lg">
                  {/* Leading offset for pipeline stagger */}
                  {Array.from({ length: rIdx }).map((_, i) => (
                    <div key={`spacer-${i}`} className="w-12 h-6 shrink-0 opacity-0" />
                  ))}

                  {/* 6 Stages for this record */}
                  {record.stages.map((st) => (
                    <div
                      key={st.stageIndex}
                      title={`${st.stageName}: ${st.durationMs}ms`}
                      className="w-12 h-6 shrink-0 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm transition hover:scale-105 cursor-pointer"
                      style={{ backgroundColor: stageColorMap[st.stageIndex - 1] }}
                    >
                      S{st.stageIndex}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-3 text-xs font-mono text-slate-500 dark:text-slate-400 text-center">
          Notice the diagonal stagger: In cycle 6 and beyond, all 6 stages execute concurrently on 6 different packets.
        </p>
      </div>
    </div>
  );
};
