import { FeatureSet } from '../pipeline/types.js';
import { db } from '../db/database.js';

export interface RuleEvaluationResult {
  matchedRules: string[];
  ruleDetails: { code: string; name: string; matched: boolean; reason: string }[];
}

export function evaluateRules(features: FeatureSet): RuleEvaluationResult {
  const matchedRules: string[] = [];
  const ruleDetails: { code: string; name: string; matched: boolean; reason: string }[] = [];

  const r1 = db.rules.find(r => r.code === 'R1');
  const r2 = db.rules.find(r => r.code === 'R2');
  const r3 = db.rules.find(r => r.code === 'R3');
  const r4 = db.rules.find(r => r.code === 'R4');

  // R1: DDoS + Insecure Protocol
  const r1Matched = !!(r1?.enabled && features.isHighRate && features.isInsecureProtocol);
  if (r1Matched) {
    matchedRules.push('R1: DDoS + Insecure Protocol');
  }
  ruleDetails.push({
    code: 'R1',
    name: 'DDoS + Insecure Protocol',
    matched: r1Matched,
    reason: r1Matched ? 'High request rate and insecure protocol detected' : 'Normal request rate or secure protocol'
  });

  // R2: Attack Port + Abnormal Packet
  const r2Matched = !!(r2?.enabled && features.isAttackPort && features.isAbnormalPacket);
  if (r2Matched) {
    matchedRules.push('R2: Attack Port + Abnormal Packet');
  }
  ruleDetails.push({
    code: 'R2',
    name: 'Attack Port + Abnormal Packet',
    matched: r2Matched,
    reason: r2Matched ? 'Targeting known exploit port with abnormal packet size' : 'Standard port or normal packet size'
  });

  // R3: External IP + High Threat Score
  const r3Threshold = r3?.params?.threatScoreThreshold ?? 70;
  const r3Matched = !!(r3?.enabled && features.isExternalIP && features.threatScore >= r3Threshold);
  if (r3Matched) {
    matchedRules.push('R3: External IP + High Threat Score');
  }
  ruleDetails.push({
    code: 'R3',
    name: 'External IP + High Threat Score',
    matched: r3Matched,
    reason: r3Matched ? `External IP with threat score ${features.threatScore} >= ${r3Threshold}` : 'Internal IP or threat score below threshold'
  });

  // R4: Multiple Threat Indicators
  // Check boolean indicators: isExternalIP, isInsecureProtocol, isAttackPort, isAbnormalPacket, isHighRate
  const booleanIndicators = [
    features.isExternalIP,
    features.isInsecureProtocol,
    features.isAttackPort,
    features.isAbnormalPacket,
    features.isHighRate
  ];
  const trueCount = booleanIndicators.filter(Boolean).length;
  const minIndicators = r4?.params?.minIndicators ?? 3;
  const r4Matched = !!(r4?.enabled && trueCount >= minIndicators);
  if (r4Matched) {
    matchedRules.push('R4: Multiple Threat Indicators');
  }
  ruleDetails.push({
    code: 'R4',
    name: 'Multiple Threat Indicators',
    matched: r4Matched,
    reason: r4Matched ? `${trueCount} threat indicators active (>= ${minIndicators})` : `${trueCount} indicators active`
  });

  return {
    matchedRules,
    ruleDetails
  };
}
