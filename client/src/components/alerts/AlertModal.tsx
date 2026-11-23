import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Bell, X } from 'lucide-react';
import { usePipeline } from '../../context/PipelineContext';

export const AlertModal: React.FC = () => {
  const { activeAlertModal, dismissAlertModal, acknowledgeAlert, pendingAlertsQueue } = usePipeline();

  if (!activeAlertModal) return null;

  const count = pendingAlertsQueue.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-2 border-red-500/80 rounded-2xl shadow-2xl p-6 sm:p-8 glow-red">
        {/* Close icon button */}
        <button
          onClick={dismissAlertModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Heading */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 dark:bg-red-950/50 border border-red-500/40 flex items-center justify-center text-red-500 mb-4 animate-bounce">
            <AlertTriangle className="w-9 h-9" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-tech font-bold text-red-600 dark:text-red-400 tracking-wider">
            INTRUSION DETECTED
          </h2>

          {count > 1 && (
            <span className="mt-1 px-3 py-0.5 text-xs font-mono bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-full border border-red-300 dark:border-red-800">
              {count} New Alerts Pending
            </span>
          )}

          <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-left w-full space-y-2 text-xs sm:text-sm font-mono">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Threat Level:</span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-600 text-white animate-pulse">
                {activeAlertModal.threat_level}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Source:</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">
                {activeAlertModal.ip}:{activeAlertModal.port}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Matched Rules:</span>
              <div className="space-y-1">
                {activeAlertModal.matched_rules.map((rule, idx) => (
                  <div key={idx} className="px-2 py-1 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-900">
                    ⚠ {rule}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 italic">
              Simulated security notification dispatched to Email & SMS outbox.
            </div>
          </div>

          {/* Action button */}
          <div className="mt-6 flex w-full gap-3">
            <button
              onClick={() => acknowledgeAlert(activeAlertModal.id)}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-tech font-bold tracking-wider rounded-xl shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              ACKNOWLEDGE
            </button>
            <button
              onClick={dismissAlertModal}
              className="py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono font-medium transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
