import React, { useState, useEffect } from 'react';
import { PipelineEvent } from '../../types';
import { api } from '../../services/api';
import { usePipeline } from '../../context/PipelineContext';
import { ShieldCheck, ShieldAlert, AlertTriangle, Eye, RefreshCw } from 'lucide-react';

export const RecentEventsTable: React.FC = () => {
  const { lastEvent } = usePipeline();
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PipelineEvent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getEvents(10);
      setEvents(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [lastEvent]);

  return (
    <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
            Real-Time Audit Trail
          </span>
          <h3 className="text-base font-tech font-bold text-slate-900 dark:text-slate-100">
            RECENT PIPELINE EVENTS
          </h3>
        </div>
        <button
          onClick={fetchEvents}
          className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Refresh Events"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <th className="py-2.5 px-3">RECORD ID</th>
              <th className="py-2.5 px-3">TIMESTAMP</th>
              <th className="py-2.5 px-3">VERDICT</th>
              <th className="py-2.5 px-3">THREAT LEVEL</th>
              <th className="py-2.5 px-3">PRIORITY</th>
              <th className="py-2.5 px-3">LATENCY</th>
              <th className="py-2.5 px-3">MATCHED RULES</th>
              <th className="py-2.5 px-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {events.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-400 dark:text-slate-500">
                  No events recorded yet. Run the pipeline to view real-time datapath transitions.
                </td>
              </tr>
            ) : (
              events.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-bold text-cyan-600 dark:text-cyan-400">
                    {evt.record_id}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                    {new Date(evt.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3">
                    {evt.verdict === 'INTRUSION' ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center gap-1 w-fit">
                        <ShieldAlert className="w-3 h-3" />
                        INTRUSION
                      </span>
                    ) : evt.verdict === 'SUSPICIOUS' ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" />
                        SUSPICIOUS
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 w-fit">
                        <ShieldCheck className="w-3 h-3" />
                        SAFE
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-semibold">
                    <span className={evt.threat_level === 'CRITICAL' ? 'text-red-600 dark:text-red-400 animate-pulse' : ''}>
                      {evt.threat_level}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      {evt.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                    {evt.total_latency_ms} ms
                  </td>
                  <td className="py-2.5 px-3 max-w-xs truncate text-slate-600 dark:text-slate-300">
                    {evt.matched_rules && evt.matched_rules.length > 0 ? evt.matched_rules.join(', ') : 'None'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => setSelectedEvent(evt)}
                      className="p-1 rounded text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Inspect Features & Timings"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-xl shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-tech font-bold text-slate-900 dark:text-slate-100">
                DATAPATH TRACE: {selectedEvent.record_id}
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Verdict:</span>{' '}
                  <strong className="text-cyan-600 dark:text-cyan-400">{selectedEvent.verdict}</strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Threat Level:</span>{' '}
                  <strong>{selectedEvent.threat_level}</strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Threat Score:</span>{' '}
                  <strong>{selectedEvent.features.threatScore} / 100</strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Total Latency:</span>{' '}
                  <strong>{selectedEvent.total_latency_ms} ms</strong>
                </div>
              </div>

              {/* Per-Stage Timings Breakdown */}
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Pipeline Stage Breakdown (6 Stages)
                </h4>
                <div className="space-y-1.5">
                  {selectedEvent.stage_timings.map((st) => (
                    <div
                      key={st.stageIndex}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-[11px]"
                    >
                      <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                        Stage {String(st.stageIndex).padStart(2, '0')}: {st.stageName}
                      </span>
                      <span>{st.durationMs} ms</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature Values */}
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Extracted Feature Vector
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <div>External IP: <strong>{String(selectedEvent.features.isExternalIP)}</strong></div>
                  <div>Insecure Protocol: <strong>{String(selectedEvent.features.isInsecureProtocol)}</strong></div>
                  <div>Attack Port: <strong>{String(selectedEvent.features.isAttackPort)}</strong></div>
                  <div>Abnormal Packet: <strong>{String(selectedEvent.features.isAbnormalPacket)}</strong></div>
                  <div>High Rate: <strong>{String(selectedEvent.features.isHighRate)}</strong></div>
                  <div>Anomaly Flag: <strong>{String(selectedEvent.features.anomalyFlag)}</strong></div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
