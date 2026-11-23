import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';
import { usePipeline } from '../../context/PipelineContext';

export const PipelineOutputCard: React.FC = () => {
  const { isPipelineRunning, lastEvent } = usePipeline();

  const isIntrusion = lastEvent?.verdict === 'INTRUSION';
  const isSuspicious = lastEvent?.verdict === 'SUSPICIOUS';
  const isSafe = lastEvent?.verdict === 'SAFE';

  return (
    <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 relative overflow-hidden">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          PIPELINE OUTPUT
        </span>
        {lastEvent && (
          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
            ID: {lastEvent.record_id} • Latency: {lastEvent.total_latency_ms} ms
          </span>
        )}
      </div>

      <div className="min-h-[72px] flex items-center justify-center p-4 rounded-xl text-center">
        {isPipelineRunning ? (
          <div className="flex items-center space-x-3 text-cyan-600 dark:text-cyan-400 animate-pulse">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="font-tech text-2xl font-bold tracking-wider">
              Processing...
            </span>
          </div>
        ) : isIntrusion ? (
          <div className="w-full p-4 rounded-xl bg-red-500/10 dark:bg-red-950/40 border border-red-500/50 glow-red animate-fade-in text-left">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <p className="font-mono text-sm sm:text-base font-bold text-red-600 dark:text-red-400 tracking-wide leading-relaxed">
                  ⚠ INTRUSION DETECTED – Intrusion detected – Threat Level: {lastEvent.threat_level}.
                  {lastEvent.matched_rules && lastEvent.matched_rules.length > 0 && (
                    <span className="block mt-1 text-xs font-normal text-red-700 dark:text-red-300 font-mono">
                      Matched Rules: {lastEvent.matched_rules.join(', ')}
                    </span>
                  )}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs font-mono text-slate-600 dark:text-slate-300">
                  <span>Priority: <strong className="text-red-600 dark:text-red-400">{lastEvent.priority}</strong></span>
                  <span>Threat Score: <strong>{lastEvent.features.threatScore}/100</strong></span>
                </div>
              </div>
            </div>
          </div>
        ) : isSuspicious ? (
          <div className="w-full p-4 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/50 text-left">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-mono text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 tracking-wide">
                  ⚡ SUSPICIOUS ACTIVITY – Threat Level: {lastEvent?.threat_level} – Anomalous traffic pattern flagged
                </p>
                {lastEvent?.matched_rules && lastEvent.matched_rules.length > 0 && (
                  <p className="mt-1 text-xs font-mono text-amber-700 dark:text-amber-300">
                    Matched: {lastEvent.matched_rules.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : isSafe ? (
          <div className="w-full p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/50 glow-green animate-fade-in text-left">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-mono text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 tracking-wide">
                  ✓ SAFE ACCESS – No intrusion detected – Traffic appears legitimate
                </p>
                <p className="mt-1 text-xs font-mono text-slate-500 dark:text-slate-400">
                  Threat Score: {lastEvent.features.threatScore}/100 • All 4 rules passed • Anomaly score normal
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm font-mono text-slate-400 dark:text-slate-500 italic">
            Pipeline is idle. Load a sample or execute pipeline to inspect datapath output.
          </p>
        )}
      </div>
    </div>
  );
};
