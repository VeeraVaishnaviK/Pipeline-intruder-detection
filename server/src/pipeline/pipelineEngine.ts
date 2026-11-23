import EventEmitter from 'events';
import { NetworkRecord, PipelineEvent, StageTiming, FeatureSet } from './types.js';
import { db } from '../db/database.js';
import { extractFeatures } from '../detection/features.js';
import { evaluateRules } from '../detection/rulesEngine.js';
import { makeDecision } from '../detection/decision.js';
import { AlertManager } from '../alerts/alertManager.js';
import { metricsEngine } from '../metrics/metricsEngine.js';

export interface PipelineStreamEvent {
  type: 'stage_start' | 'stage_progress' | 'stage_complete' | 'record_complete' | 'batch_progress' | 'batch_complete';
  recordId: string;
  stageIndex?: number;
  stageName?: string;
  stageStatus?: string;
  activeRecordIds?: Record<number, string>; // stageIndex -> recordId
  payload?: any;
  timestamp: number;
}

export interface InFlightRecord {
  record: NetworkRecord;
  currentStage: number; // 1 to 6
  stageTimings: StageTiming[];
  stageStartTime: number;
  features?: FeatureSet;
  matchedRules?: string[];
  verdict?: 'SAFE' | 'SUSPICIOUS' | 'INTRUSION';
  threatLevel?: 'NONE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
  summary?: string;
  onComplete?: (event: PipelineEvent) => void;
}

export class PipelineEngine extends EventEmitter {
  private queues: InFlightRecord[][] = [[], [], [], [], [], []]; // queues for stages 1 to 6
  private isProcessingStage: boolean[] = [false, false, false, false, false, false];
  private activeRecordByStage: Record<number, string> = {}; // 1..6 -> recordId
  private isSequentialLocked: boolean = false;
  private isRunning: boolean = true;
  private recentHistory: NetworkRecord[] = [];

  constructor() {
    super();
    // Warm up recent history from existing events in DB
    this.recentHistory = db.events.map(e => ({
      id: e.record_id,
      ip: '192.168.1.100',
      port: 8080,
      packetSizeKB: e.features.normalizedPacketSize * 10000,
      accessType: 'HTTP',
      timestamp: e.created_at,
      requestRate: e.features.normalizedRequestRate * 1000
    }));
  }

  public getStageDelay(): number {
    return db.config.stageDelayMs || 500;
  }

  public setStageDelay(ms: number) {
    db.config.stageDelayMs = Math.max(50, Math.min(1500, ms));
    db.save();
    this.emitStatus();
  }

  public getMode(): 'pipelined' | 'sequential' {
    return db.config.mode;
  }

  public setMode(mode: 'pipelined' | 'sequential') {
    db.config.mode = mode;
    db.save();
    this.emitStatus();
  }

  public getActiveStages(): Record<number, string> {
    return { ...this.activeRecordByStage };
  }

  public emitStatus() {
    this.emit('stream', {
      type: 'pipeline_status',
      activeRecordIds: this.getActiveStages(),
      stageDelayMs: this.getStageDelay(),
      mode: this.getMode(),
      timestamp: Date.now()
    });
  }

  /**
   * Enqueue a record into Stage 1
   */
  public enqueue(record: NetworkRecord): Promise<PipelineEvent> {
    return new Promise((resolve) => {
      const inFlight: InFlightRecord = {
        record,
        currentStage: 1,
        stageTimings: [],
        stageStartTime: Date.now(),
        onComplete: (event: PipelineEvent) => resolve(event)
      };

      if (this.getMode() === 'sequential') {
        // Enqueue to sequential queue
        this.queues[0].push(inFlight);
        this.processSequential();
      } else {
        // Pipelined mode: enqueue to Stage 1 queue and kick off stage 1 worker
        this.queues[0].push(inFlight);
        this.triggerStageWorkers();
      }
    });
  }

  /**
   * Pipelined Mode: Trigger independent workers for all 6 stages
   */
  private triggerStageWorkers() {
    for (let stageIdx = 0; stageIdx < 6; stageIdx++) {
      this.runStageWorker(stageIdx);
    }
  }

  private async runStageWorker(stageIdx: number) {
    if (this.isProcessingStage[stageIdx]) return;
    if (this.queues[stageIdx].length === 0) return;

    this.isProcessingStage[stageIdx] = true;
    const item = this.queues[stageIdx].shift()!;
    const stageNumber = stageIdx + 1;
    this.activeRecordByStage[stageNumber] = item.record.id;

    const stageNames = [
      'INPUT FETCH',
      'PREPROCESSING',
      'FEATURE ANALYSIS',
      'DETECTION LOGIC',
      'DECISION',
      'ALERT GENERATION'
    ];
    const stageName = stageNames[stageIdx];

    // Emit stage start event
    this.emit('stream', {
      type: 'stage_start',
      recordId: item.record.id,
      stageIndex: stageNumber,
      stageName,
      stageStatus: 'active',
      activeRecordIds: this.getActiveStages(),
      timestamp: Date.now()
    });

    const startTime = Date.now();
    const delay = this.getStageDelay();

    // Perform actual stage work during simulated delay
    await this.executeStageWork(stageIdx, item);
    await new Promise(r => setTimeout(r, delay));

    const endTime = Date.now();
    const durationMs = endTime - startTime;

    item.stageTimings.push({
      stageIndex: stageNumber,
      stageName,
      startTime,
      endTime,
      durationMs
    });

    // Finished this stage
    delete this.activeRecordByStage[stageNumber];

    this.emit('stream', {
      type: 'stage_complete',
      recordId: item.record.id,
      stageIndex: stageNumber,
      stageName,
      stageStatus: 'done',
      activeRecordIds: this.getActiveStages(),
      timestamp: Date.now()
    });

    this.isProcessingStage[stageIdx] = false;

    // Move to next stage or complete
    if (stageIdx < 5) {
      item.currentStage = stageNumber + 1;
      this.queues[stageIdx + 1].push(item);
    } else {
      // Completed Stage 6
      this.finalizeRecord(item);
    }

    // Trigger workers again for any remaining items in queues
    this.triggerStageWorkers();
  }

  /**
   * Sequential Mode: A record runs from Stage 1 through Stage 6 with exclusive lock
   */
  private async processSequential() {
    if (this.isSequentialLocked) return;
    if (this.queues[0].length === 0) return;

    this.isSequentialLocked = true;
    const item = this.queues[0].shift()!;

    const stageNames = [
      'INPUT FETCH',
      'PREPROCESSING',
      'FEATURE ANALYSIS',
      'DETECTION LOGIC',
      'DECISION',
      'ALERT GENERATION'
    ];

    for (let s = 0; s < 6; s++) {
      const stageNumber = s + 1;
      const stageName = stageNames[s];
      this.activeRecordByStage[stageNumber] = item.record.id;

      this.emit('stream', {
        type: 'stage_start',
        recordId: item.record.id,
        stageIndex: stageNumber,
        stageName,
        stageStatus: 'active',
        activeRecordIds: this.getActiveStages(),
        timestamp: Date.now()
      });

      const startTime = Date.now();
      await this.executeStageWork(s, item);
      await new Promise(r => setTimeout(r, this.getStageDelay()));

      const endTime = Date.now();
      item.stageTimings.push({
        stageIndex: stageNumber,
        stageName,
        startTime,
        endTime,
        durationMs: endTime - startTime
      });

      delete this.activeRecordByStage[stageNumber];

      this.emit('stream', {
        type: 'stage_complete',
        recordId: item.record.id,
        stageIndex: stageNumber,
        stageName,
        stageStatus: 'done',
        activeRecordIds: this.getActiveStages(),
        timestamp: Date.now()
      });
    }

    this.finalizeRecord(item);
    this.isSequentialLocked = false;

    // Process next sequential item
    if (this.queues[0].length > 0) {
      this.processSequential();
    }
  }

  /**
   * Execute stage logic
   */
  private async executeStageWork(stageIdx: number, item: InFlightRecord) {
    switch (stageIdx) {
      case 0: // 01: INPUT FETCH
        // Accept record, assign log entry
        db.logs.unshift({
          id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          record: item.record,
          created_at: new Date().toISOString()
        });
        break;

      case 1: // 02: PREPROCESSING
        // Normalization and validation
        break;

      case 2: // 03: FEATURE ANALYSIS
        // Derive features & threat score
        item.features = extractFeatures(item.record, this.recentHistory);
        this.recentHistory.push(item.record);
        if (this.recentHistory.length > 100) this.recentHistory.shift();
        break;

      case 3: // 04: DETECTION LOGIC
        // Rule evaluation & anomaly test
        if (!item.features) {
          item.features = extractFeatures(item.record, this.recentHistory);
        }
        const evalRes = evaluateRules(item.features);
        item.matchedRules = evalRes.matchedRules;
        break;

      case 4: // 05: DECISION
        // Synthesize verdict, threat level, priority
        if (!item.features) item.features = extractFeatures(item.record, this.recentHistory);
        if (!item.matchedRules) item.matchedRules = evaluateRules(item.features).matchedRules;

        const dec = makeDecision(item.matchedRules, item.features);
        item.verdict = dec.verdict;
        item.threatLevel = dec.threatLevel;
        item.priority = dec.priority;
        item.summary = dec.summary;
        break;

      case 5: // 06: ALERT GENERATION
        // Event persistence and alert dispatch
        break;
    }
  }

  /**
   * Finalize record after Stage 6
   */
  private finalizeRecord(item: InFlightRecord) {
    const totalLatency = item.stageTimings.reduce((sum, st) => sum + st.durationMs, 0);

    const event: PipelineEvent = {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      record_id: item.record.id,
      verdict: item.verdict || 'SAFE',
      threat_level: item.threatLevel || 'NONE',
      priority: item.priority || 'P4',
      matched_rules: item.matchedRules || [],
      features: item.features!,
      stage_timings: item.stageTimings,
      ground_truth: item.record.groundTruth,
      created_at: new Date().toISOString(),
      total_latency_ms: totalLatency
    };

    db.events.unshift(event);

    // Alert handling
    const alert = AlertManager.handleEvent(event, item.record);

    // Update metrics engine
    metricsEngine.recordEventMetrics(event);

    // Persist to store
    db.save();

    // Stream completion event
    this.emit('stream', {
      type: 'record_complete',
      recordId: item.record.id,
      payload: {
        event,
        record: item.record,
        alert
      },
      activeRecordIds: this.getActiveStages(),
      timestamp: Date.now()
    });

    if (item.onComplete) {
      item.onComplete(event);
    }
  }

  public resetAll() {
    this.queues = [[], [], [], [], [], []];
    this.isProcessingStage = [false, false, false, false, false, false];
    this.activeRecordByStage = {};
    this.isSequentialLocked = false;
    db.clearAll();
    metricsEngine.resetSession();
    this.emitStatus();
  }
}

export const pipelineEngine = new PipelineEngine();
