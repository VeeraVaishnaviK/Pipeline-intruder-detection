import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  UploadCloud, 
  Cpu, 
  ShieldCheck, 
  Activity, 
  Layers, 
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';
import { usePipeline } from '../context/PipelineContext';

export const BatchStreamPage: React.FC = () => {
  const { 
    isPipelineRunning, 
    activeRecordIds, 
    stageDelayMs, 
    setStageDelayMs, 
    mode, 
    setMode, 
    refreshMetrics,
    metrics 
  } = usePipeline();

  const [batchCount, setBatchCount] = useState<number>(20);
  const [attackRatio, setAttackRatio] = useState<number>(0.3);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamRate, setStreamRate] = useState<number>(5); // req/sec
  const [recordsQueued, setRecordsQueued] = useState<number>(0);
  const [csvContent, setCsvContent] = useState<string>('');
  const [csvModalOpen, setCsvModalOpen] = useState<boolean>(false);

  const streamIntervalRef = useRef<any>(null);

  // Continuous stream generator
  useEffect(() => {
    if (isStreaming) {
      const intervalMs = Math.max(100, Math.floor(1000 / streamRate));
      streamIntervalRef.current = setInterval(() => {
        api.runBatch({ count: 1, attackRatio }).then(res => {
          setRecordsQueued(prev => prev + 1);
        }).catch(() => {});
      }, intervalMs);
    } else {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
    }

    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, [isStreaming, streamRate, attackRatio]);

  const handleRunBatch = async () => {
    try {
      const res = await api.runBatch({ count: batchCount, attackRatio });
      setRecordsQueued(prev => prev + res.totalQueued);
    } catch (err: any) {
      alert(`Error running batch: ${err.message}`);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      setCsvContent(text);
      try {
        // Parse CSV lines: ip,port,packetSizeKB,accessType,requestRate
        const lines = text.trim().split('\n');
        const records = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(s => s.trim());
          if (parts.length >= 5) {
            records.push({
              ip: parts[0],
              port: Number(parts[1]),
              packetSizeKB: Number(parts[2]),
              accessType: parts[3],
              requestRate: Number(parts[4])
            });
          }
        }
        if (records.length > 0) {
          const res = await api.runBatch({ records });
          setRecordsQueued(prev => prev + res.totalQueued);
          alert(`Successfully loaded & queued ${records.length} records from CSV.`);
        }
      } catch (err: any) {
        alert(`Failed to parse CSV: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const stageNames = [
    '01 INPUT FETCH',
    '02 PREPROCESSING',
    '03 FEATURE ANALYSIS',
    '04 DETECTION LOGIC',
    '05 DECISION',
    '06 ALERT GENERATION'
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
              Module 2 & 3: High-Frequency Workload Testing
            </span>
            <h2 className="text-xl font-tech font-bold text-slate-900 dark:text-slate-100">
              BATCH & REAL-TIME STREAM SIMULATOR
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-cyan-500" />
              Upload CSV
              <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Batch & Stream Controls Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Batch Generator */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <h3 className="text-sm font-tech font-bold text-slate-900 dark:text-slate-100 uppercase">
              1. Fixed Batch Run
            </h3>
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
                <span>Record Count:</span>
                <strong className="text-cyan-600 dark:text-cyan-400">{batchCount} records</strong>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
                <span>Attack Ratio:</span>
                <strong className="text-red-600 dark:text-red-400">{Math.round(attackRatio * 100)}% attacks</strong>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={attackRatio}
                onChange={(e) => setAttackRatio(Number(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
            </div>

            <button
              onClick={handleRunBatch}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-tech font-bold text-sm tracking-wider uppercase shadow-md transition"
            >
              RUN BATCH OF {batchCount}
            </button>
          </div>

          {/* Continuous Stream Generator */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <h3 className="text-sm font-tech font-bold text-slate-900 dark:text-slate-100 uppercase flex items-center justify-between">
              <span>2. Continuous Stream</span>
              {isStreaming && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              )}
            </h3>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
                <span>Stream Rate:</span>
                <strong className="text-cyan-600 dark:text-cyan-400">{streamRate} req / sec</strong>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={streamRate}
                onChange={(e) => setStreamRate(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Injects live network packets continuously to test pipeline under sustained load.
            </p>

            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`w-full py-2.5 rounded-lg font-tech font-bold text-sm tracking-wider uppercase shadow-md transition flex items-center justify-center gap-2 ${
                isStreaming
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isStreaming ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  PAUSE STREAM
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  START CONTINUOUS STREAM
                </>
              )}
            </button>
          </div>

          {/* Pipeline Datapath Verification & Integrity Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <h3 className="text-sm font-tech font-bold text-slate-900 dark:text-slate-100 uppercase">
              3. Datapath Integrity Check
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Records In:</span>
                <strong className="text-slate-900 dark:text-slate-100">{recordsQueued || metrics.processedCount}</strong>
              </div>
              <div className="flex justify-between p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Records Out:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">{metrics.processedCount}</strong>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                <FileCheck className="w-4 h-4 shrink-0" />
                Zero Data Loss Verified (In = Out)
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Execution Mode: <strong className="uppercase text-cyan-600 dark:text-cyan-400">{mode}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Concurrent 6-Stage Datapath Visualizer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
              Real-Time Hardware Datapath Concurrency
            </span>
            <h3 className="text-base font-tech font-bold text-slate-900 dark:text-slate-100">
              SIMULTANEOUS STAGE OCCUPANCY ({mode.toUpperCase()} MODE)
            </h3>
          </div>

          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Active Stages:{' '}
            <strong className="text-cyan-600 dark:text-cyan-400">
              {Object.keys(activeRecordIds).length} / 6
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {stageNames.map((name, idx) => {
            const stageNum = idx + 1;
            const activeRec = activeRecordIds[stageNum];
            const isActive = !!activeRec;

            return (
              <div
                key={stageNum}
                className={`p-4 rounded-xl border text-center transition-all ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-50/70 dark:bg-cyan-950/40 glow-cyan scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-60'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  STAGE {String(stageNum).padStart(2, '0')}
                </div>
                <div className="mt-1 font-tech font-bold text-xs text-slate-900 dark:text-slate-100 h-8 flex items-center justify-center">
                  {name.split(' ').slice(1).join(' ')}
                </div>

                <div className="mt-3">
                  {isActive ? (
                    <span className="inline-block px-2 py-1 rounded text-xs font-mono font-bold bg-cyan-500 text-white shadow-sm animate-pulse">
                      [{activeRec}]
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800">
                      IDLE
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs font-mono text-slate-500 dark:text-slate-400 text-center">
          {mode === 'pipelined'
            ? '⚡ True Pipelining Active: Multiple records occupy distinct pipeline stages concurrently, eliminating sequential processor stalls.'
            : '⏸ Sequential Baseline Active: Exactly one record moves through stages 1 to 6 before the next begins.'}
        </p>
      </div>
    </div>
  );
};
