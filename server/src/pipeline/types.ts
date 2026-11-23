export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'analyst';
  created_at: string;
}

export interface NetworkRecord {
  id: string;
  ip: string;
  port: number;
  packetSizeKB: number;
  accessType: string;
  timestamp: string;
  requestRate: number;
  groundTruth?: 'SAFE' | 'INTRUSION';
}

export interface FeatureSet {
  isExternalIP: boolean;
  isInsecureProtocol: boolean;
  isAttackPort: boolean;
  isAbnormalPacket: boolean;
  isHighRate: boolean;
  anomalyFlag: boolean;
  threatScore: number;
  packetSizeZScore: number;
  requestRateZScore: number;
  normalizedPacketSize: number;
  normalizedRequestRate: number;
}

export interface StageTiming {
  stageIndex: number;
  stageName: string;
  startTime: number;
  endTime: number;
  durationMs: number;
}

export interface PipelineEvent {
  id: string;
  record_id: string;
  verdict: 'SAFE' | 'SUSPICIOUS' | 'INTRUSION';
  threat_level: 'NONE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  matched_rules: string[];
  features: FeatureSet;
  stage_timings: StageTiming[];
  ground_truth?: 'SAFE' | 'INTRUSION';
  created_at: string;
  total_latency_ms: number;
}

export interface Alert {
  id: string;
  event_id: string;
  record_id: string;
  threat_level: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priority: string;
  matched_rules: string[];
  ip: string;
  port: number;
  status: 'New' | 'Acknowledged';
  acknowledged_by?: string;
  acknowledged_at?: string;
  alert_message: string;
  created_at: string;
}

export interface Notification {
  id: string;
  alert_id: string;
  channel: 'EMAIL' | 'SMS';
  recipient: string;
  message: string;
  status: 'SENT_SIMULATED';
  created_at: string;
}

export interface RuleConfig {
  id: string;
  code: 'R1' | 'R2' | 'R3' | 'R4';
  name: string;
  description: string;
  enabled: boolean;
  params: Record<string, any>;
}

export interface AnomalyConfig {
  zScoreThreshold: number;
  windowSize: number;
}

export interface PipelineConfig {
  stageDelayMs: number;
  mode: 'pipelined' | 'sequential';
  anomalyConfig: AnomalyConfig;
}
