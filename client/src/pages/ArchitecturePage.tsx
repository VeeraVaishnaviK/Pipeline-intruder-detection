import React, { useState } from 'react';
import { Cpu, ShieldCheck, CheckCircle2, Play, Layers, Activity } from 'lucide-react';
import { api } from '../services/api';

export const ArchitecturePage: React.FC = () => {
  const [selectedLayer, setSelectedLayer] = useState<string>('pipeline');
  const [selfTestRunning, setSelfTestRunning] = useState<boolean>(false);
  const [selfTestResult, setSelfTestResult] = useState<any>(null);

  const runSelfTest = async () => {
    setSelfTestRunning(true);
    try {
      const res = await api.runSelfTest();
      setSelfTestResult(res);
    } catch (e: any) {
      alert(`Self-test failed: ${e.message}`);
    } finally {
      setSelfTestRunning(false);
    }
  };

  const layers = [
    {
      id: 'client',
      title: '1. CLIENT LAYER',
      color: '#38bdf8',
      desc: 'Web Browser Interface (Admin & Analyst roles), Login & Security Dashboard UI, Real-time Pipeline Visualizer, Batch Simulation Workspace.'
    },
    {
      id: 'app',
      title: '2. APPLICATION LAYER',
      color: '#818cf8',
      desc: 'API Gateway / Request Handler, JWT Session Authentication & RBAC, SSE Live Stream Emitter, Rate Limiting & Input Validation Guards.'
    },
    {
      id: 'pipeline',
      title: '3. INTRUSION DETECTION LAYER (THE 6-STAGE PIPELINE)',
      color: '#06b6d4',
      desc: 'Stage 01: Input Fetch → Stage 02: Preprocessing & Normalization → Stage 03: Feature Analysis → Stage 04: Detection Logic (R1–R4 + Anomaly Z-Score) → Stage 05: Decision & Priority Manager → Stage 06: Alert Generation.'
    },
    {
      id: 'data',
      title: '4. DATA PERSISTENCE LAYER',
      color: '#a855f7',
      desc: 'User Authentication Store (bcrypt credentials), Sensor Logs Store, Intrusion Events Store, Real-time Metrics Snapshot Store.'
    },
    {
      id: 'alert',
      title: '5. ALERT & RESPONSE LAYER',
      color: '#ef4444',
      desc: 'Intrusion Alert Generator, Priority Queue (P1–P4), Admin Real-time Modal, Simulated Email/SMS Notification Outbox, Analyst Acknowledgement Tracking.'
    },
    {
      id: 'monitoring',
      title: '6. MONITORING & PIPELINE CONTROL MANAGER',
      color: '#10b981',
      desc: 'Monitors and orchestrates every layer. Pipeline Control (Mode toggling, clock cycle adjustment 50–1500 ms, queue flush, hardware datapath efficiency tracking).'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
            System Specification & Datapath Design
          </span>
          <h2 className="text-xl font-tech font-bold text-slate-900 dark:text-slate-100">
            SYSTEM ARCHITECTURE & SYSTEM HEALTH
          </h2>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
            Layered architectural blueprint mapping computer architecture pipeline stages to software modules.
          </p>
        </div>

        <button
          onClick={runSelfTest}
          disabled={selfTestRunning}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-tech font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center gap-2"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${selfTestRunning ? 'animate-spin' : ''}`} />
          {selfTestRunning ? 'RUNNING SELF-TEST...' : 'EXECUTE END-TO-END SELF-TEST'}
        </button>
      </div>

      {/* Self-Test Banner if ran */}
      {selfTestResult && (
        <div className={`p-5 rounded-2xl border ${
          selfTestResult.status === 'PASS'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50 glow-green'
            : 'bg-red-50 dark:bg-red-950/40 border-red-500/50 glow-red'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-tech font-bold text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              END-TO-END SYSTEM SELF-TEST RESULT: {selfTestResult.status}
            </span>
            <span className="text-xs font-mono text-slate-500">
              Verified 2 Test Vectors
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono mt-3">
            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <strong className="text-emerald-600 dark:text-emerald-400">1. Safe Access Vector:</strong>
              <p className="mt-1">Input: {selfTestResult.safeTest.record.ip}:{selfTestResult.safeTest.record.port} ({selfTestResult.safeTest.record.accessType})</p>
              <p>Verdict: <strong>{selfTestResult.safeTest.verdict}</strong> (Passed: {String(selfTestResult.safeTest.passed)})</p>
            </div>
            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <strong className="text-red-600 dark:text-red-400">2. Attack Vector:</strong>
              <p className="mt-1">Input: {selfTestResult.attackTest.record.ip}:{selfTestResult.attackTest.record.port} (Telnet, Abnormal Size)</p>
              <p>Verdict: <strong>{selfTestResult.attackTest.verdict}</strong> [{selfTestResult.attackTest.threatLevel}] (Passed: {String(selfTestResult.attackTest.passed)})</p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Layered Architecture Diagram */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-tech font-bold text-slate-900 dark:text-slate-100 uppercase mb-4">
          INTERACTIVE LAYERED SYSTEM DIAGRAM (CLICK TO INSPECT)
        </h3>

        <div className="space-y-3">
          {layers.map((layer) => {
            const isSelected = selectedLayer === layer.id;
            return (
              <div
                key={layer.id}
                onClick={() => setSelectedLayer(layer.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 glow-cyan scale-[1.01]'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4
                    className="font-tech text-base font-bold tracking-wider"
                    style={{ color: layer.color }}
                  >
                    {layer.title}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    {isSelected ? 'ACTIVE VIEW' : 'CLICK TO DETAILS'}
                  </span>
                </div>
                <p className="mt-2 text-xs font-mono text-slate-600 dark:text-slate-300 leading-relaxed">
                  {layer.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hardware to Software Mapping Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm font-mono text-xs">
        <h3 className="text-sm font-tech font-bold text-slate-900 dark:text-slate-100 uppercase mb-3">
          HOW THIS MAPS TO COMPUTER ARCHITECTURE PRINCIPLES
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <strong className="text-cyan-600 dark:text-cyan-400 block font-tech text-sm uppercase">
              Hardware Architecture Concept
            </strong>
            <div><strong>Pipeline Stages (IF, ID, EX, MEM, WB):</strong> 6 discrete functional units with independent duties.</div>
            <div><strong>Pipeline Registers / Latches:</strong> Async stage queues that buffer intermediate results between clock cycles.</div>
            <div><strong>Clock Cycle Delay (τ):</strong> Configurable stage delay (50–1500 ms) representing clock frequency.</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <strong className="text-purple-600 dark:text-purple-400 block font-tech text-sm uppercase">
              Quantitative Metrics Mapping
            </strong>
            <div><strong>Latency:</strong> Single packet transit time = k × τ (6 clock periods).</div>
            <div><strong>Throughput:</strong> In steady state, 1 completed packet exits per clock period (1/τ).</div>
            <div><strong>Speedup (S):</strong> (n × k) ÷ (k + n - 1), approaching k (6×) as N becomes large.</div>
            <div><strong>Bottleneck / Stalls:</strong> Slowest stage (Detection Logic) sets minimum clock period.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
