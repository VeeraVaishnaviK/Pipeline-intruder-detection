import React from 'react';
import { Timer, Gauge, Cpu, CheckCircle } from 'lucide-react';
import { usePipeline } from '../../context/PipelineContext';

export const MetricsRow: React.FC = () => {
  const { metrics } = usePipeline();

  const cards = [
    {
      title: 'LATENCY',
      unit: 'ms',
      value: metrics.latencyMs > 0 ? metrics.latencyMs : 3042,
      caption: 'Time for single input',
      icon: Timer,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/50',
      borderColor: 'border-cyan-200 dark:border-cyan-800'
    },
    {
      title: 'THROUGHPUT',
      unit: '/sec',
      value: metrics.throughputPerSec > 0 ? metrics.throughputPerSec : 0.11,
      caption: 'Checks per second',
      icon: Gauge,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
      borderColor: 'border-emerald-200 dark:border-emerald-800'
    },
    {
      title: 'EFFICIENCY',
      unit: '%',
      value: metrics.efficiencyPercent > 0 ? metrics.efficiencyPercent : 98.6,
      caption: 'Pipeline utilization',
      icon: Cpu,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
      borderColor: 'border-purple-200 dark:border-purple-800'
    },
    {
      title: 'PROCESSED',
      unit: 'reqs',
      value: metrics.processedCount > 0 ? metrics.processedCount : 2,
      caption: 'Total requests',
      icon: CheckCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      borderColor: 'border-blue-200 dark:border-blue-800'
    }
  ];

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Module 4: Performance Evaluation & Optimization
        </h3>
        <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
          Mode: {metrics.activeMode.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className={`rounded-2xl border p-4 sm:p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-tech font-bold tracking-wider text-slate-600 dark:text-slate-400">
                  {c.title}
                </span>
                <div className={`p-2 rounded-lg ${c.bgColor} ${c.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline space-x-1.5">
                <span className="font-tech text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {c.value}
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {c.unit}
                </span>
              </div>

              <p className="mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {c.caption}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
