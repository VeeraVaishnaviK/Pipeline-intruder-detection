import React from 'react';
import { ArrowDown, Cpu, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { usePipeline } from '../../context/PipelineContext';

export const PipelineVisualizer: React.FC = () => {
  const { stages, activeRecordIds } = usePipeline();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
            Module 2: Pipelined Data Path
          </span>
          <h2 className="text-lg font-tech font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            6-STAGE PIPELINE ARCHITECTURE
          </h2>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Stages 01 → 06
          </span>
        </div>
      </div>

      {/* Vertically stacked stage cards connected by animated down-arrows */}
      <div className="space-y-2">
        {stages.map((stage, idx) => {
          const isActive = stage.status === 'active';
          const isDone = stage.status === 'done';
          const recordInThisStage = activeRecordIds[stage.index] || (isActive ? stage.activeRecordId : undefined);

          return (
            <React.Fragment key={stage.index}>
              <div
                className={`relative overflow-hidden rounded-xl border p-3.5 transition-all duration-300 ${
                  isActive
                    ? 'border-cyan-400 dark:border-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/30 glow-cyan scale-[1.01]'
                    : isDone
                    ? 'border-cyan-600/40 dark:border-cyan-500/40 bg-white dark:bg-slate-850'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`font-tech text-base font-bold px-2 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-cyan-500 text-white'
                          : isDone
                          ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {String(stage.index).padStart(2, '0')}
                    </span>
                    <div>
                      <h4 className="font-tech text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                        {stage.name}
                      </h4>
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        {isActive ? (
                          <span className="text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {stage.activeText}
                          </span>
                        ) : isDone ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {stage.activeText}
                          </span>
                        ) : (
                          <span>{stage.idleText}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right Record Tag & Status */}
                  <div className="text-right">
                    {recordInThisStage ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500 text-white shadow-sm animate-pulse">
                        [{recordInThisStage}]
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-600">
                        {isDone ? 'READY' : 'STANDBY'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar along bottom edge */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 w-full animate-pulse'
                        : isDone
                        ? 'bg-cyan-500 w-full'
                        : 'w-0'
                    }`}
                  />
                </div>
              </div>

              {/* Connecting animated down-arrow */}
              {idx < stages.length - 1 && (
                <div className="flex justify-center -my-1 relative z-10">
                  <div
                    className={`p-0.5 rounded-full ${
                      isActive || stages[idx + 1].status === 'active'
                        ? 'text-cyan-500 animate-bounce'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
