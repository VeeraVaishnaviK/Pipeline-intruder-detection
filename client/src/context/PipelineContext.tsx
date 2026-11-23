import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PerformanceMetrics, PipelineEvent, Alert } from '../types';
import { api } from '../services/api';

export interface StageState {
  index: number;
  name: string;
  idleText: string;
  activeText: string;
  status: 'idle' | 'active' | 'done';
  activeRecordId?: string;
  progressPercent: number;
}

const INITIAL_STAGES: StageState[] = [
  { index: 1, name: 'INPUT FETCH', idleText: 'Awaiting data...', activeText: 'Input data fetched', status: 'idle', progressPercent: 0 },
  { index: 2, name: 'PREPROCESSING', idleText: 'Idle', activeText: 'Data normalized and validated', status: 'idle', progressPercent: 0 },
  { index: 3, name: 'FEATURE ANALYSIS', idleText: 'Idle', activeText: 'Features extracted', status: 'idle', progressPercent: 0 },
  { index: 4, name: 'DETECTION LOGIC', idleText: 'Idle', activeText: 'Intrusion analysis complete', status: 'idle', progressPercent: 0 },
  { index: 5, name: 'DECISION', idleText: 'Idle', activeText: 'Decision made', status: 'idle', progressPercent: 0 },
  { index: 6, name: 'ALERT GENERATION', idleText: 'Idle', activeText: 'Alert generated', status: 'idle', progressPercent: 0 }
];

interface PipelineContextType {
  stages: StageState[];
  isPipelineRunning: boolean;
  activeRecordIds: Record<number, string>;
  lastEvent: PipelineEvent | null;
  activeAlertModal: Alert | null;
  dismissAlertModal: () => void;
  metrics: PerformanceMetrics;
  stageDelayMs: number;
  setStageDelayMs: (ms: number) => void;
  mode: 'pipelined' | 'sequential';
  setMode: (mode: 'pipelined' | 'sequential') => void;
  refreshMetrics: () => void;
  resetAll: () => Promise<void>;
  pendingAlertsQueue: Alert[];
  acknowledgeAlert: (alertId: string) => Promise<void>;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export const PipelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stages, setStages] = useState<StageState[]>(INITIAL_STAGES);
  const [activeRecordIds, setActiveRecordIds] = useState<Record<number, string>>({});
  const [lastEvent, setLastEvent] = useState<PipelineEvent | null>(null);
  const [activeAlertModal, setActiveAlertModal] = useState<Alert | null>(null);
  const [pendingAlertsQueue, setPendingAlertsQueue] = useState<Alert[]>([]);
  const [stageDelayMs, setStageDelayState] = useState<number>(500);
  const [mode, setModeState] = useState<'pipelined' | 'sequential'>('pipelined');
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    latencyMs: 3042,
    throughputPerSec: 0.11,
    efficiencyPercent: 98.6,
    processedCount: 0,
    activeMode: 'pipelined',
    sessionStartTime: Date.now(),
    elapsedWallTimeSec: 0
  });

  const refreshMetrics = useCallback(async () => {
    try {
      const data = await api.getMetrics();
      setMetrics(data);
    } catch {
      // offline / mock
    }
  }, []);

  const setStageDelayMs = (ms: number) => {
    setStageDelayState(ms);
    api.updateConfig({ stageDelayMs: ms }).catch(() => {});
  };

  const setMode = (newMode: 'pipelined' | 'sequential') => {
    setModeState(newMode);
    api.updateConfig({ mode: newMode }).catch(() => {});
  };

  const resetAll = async () => {
    try {
      await api.resetPipeline();
      setStages(INITIAL_STAGES);
      setActiveRecordIds({});
      setLastEvent(null);
      setActiveAlertModal(null);
      setPendingAlertsQueue([]);
      refreshMetrics();
    } catch (err) {
      console.error(err);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await api.acknowledgeAlert(alertId);
      setPendingAlertsQueue(prev => prev.filter(a => a.id !== alertId));
      if (activeAlertModal?.id === alertId) {
        setActiveAlertModal(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const dismissAlertModal = () => {
    setActiveAlertModal(null);
  };

  // SSE event listener
  useEffect(() => {
    let evtSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      evtSource = new EventSource('/api/pipeline/stream');

      evtSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'init') {
            if (data.activeRecordIds) setActiveRecordIds(data.activeRecordIds);
            if (data.stageDelayMs) setStageDelayState(data.stageDelayMs);
            if (data.mode) setModeState(data.mode);
            if (data.metrics) setMetrics(data.metrics);
          } else if (data.type === 'stage_start') {
            const stageIdx = data.stageIndex; // 1-based
            setActiveRecordIds(data.activeRecordIds || {});
            setStages(prev => prev.map(s => {
              if (s.index === stageIdx) {
                return { ...s, status: 'active', activeRecordId: data.recordId, progressPercent: 50 };
              }
              return s;
            }));
          } else if (data.type === 'stage_complete') {
            const stageIdx = data.stageIndex;
            setActiveRecordIds(data.activeRecordIds || {});
            setStages(prev => prev.map(s => {
              if (s.index === stageIdx) {
                return { ...s, status: 'done', activeRecordId: undefined, progressPercent: 100 };
              }
              return s;
            }));
          } else if (data.type === 'record_complete') {
            setActiveRecordIds(data.activeRecordIds || {});
            const { event: finishedEvent, alert } = data.payload || {};
            if (finishedEvent) {
              setLastEvent(finishedEvent);
            }
            if (alert) {
              setPendingAlertsQueue(prev => [alert, ...prev]);
              setActiveAlertModal(alert);
            }
            refreshMetrics();
          } else if (data.type === 'pipeline_status') {
            if (data.activeRecordIds) setActiveRecordIds(data.activeRecordIds);
            if (data.stageDelayMs) setStageDelayState(data.stageDelayMs);
            if (data.mode) setModeState(data.mode);
          }
        } catch (e) {
          console.error('SSE parse error', e);
        }
      };

      evtSource.onerror = () => {
        if (evtSource) {
          evtSource.close();
          evtSource = null;
        }
        reconnectTimeout = setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      if (evtSource) evtSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [refreshMetrics]);

  // Initial load
  useEffect(() => {
    refreshMetrics();
    api.getConfig().then(cfg => {
      if (cfg.stageDelayMs) setStageDelayState(cfg.stageDelayMs);
      if (cfg.mode) setModeState(cfg.mode);
    }).catch(() => {});
  }, [refreshMetrics]);

  const isPipelineRunning = Object.keys(activeRecordIds).length > 0 || stages.some(s => s.status === 'active');

  return (
    <PipelineContext.Provider
      value={{
        stages,
        isPipelineRunning,
        activeRecordIds,
        lastEvent,
        activeAlertModal,
        dismissAlertModal,
        metrics,
        stageDelayMs,
        setStageDelayMs,
        mode,
        setMode,
        refreshMetrics,
        resetAll,
        pendingAlertsQueue,
        acknowledgeAlert
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
};

export const usePipeline = () => {
  const ctx = useContext(PipelineContext);
  if (!ctx) throw new Error('usePipeline must be used within a PipelineProvider');
  return ctx;
};
