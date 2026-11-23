import { FeatureSet } from '../pipeline/types.js';

export interface DecisionResult {
  verdict: 'SAFE' | 'SUSPICIOUS' | 'INTRUSION';
  threatLevel: 'NONE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  summary: string;
}

export function makeDecision(
  matchedRules: string[],
  features: FeatureSet
): DecisionResult {
  const matchCount = matchedRules.length;
  const hasR1 = matchedRules.some(r => r.startsWith('R1'));
  const hasR2 = matchedRules.some(r => r.startsWith('R2'));

  // Decision logic from Section 7:
  // - 0 rules matched and no anomaly → SAFE
  // - 1 rule matched or anomaly only → SUSPICIOUS, threat level MEDIUM
  // - 2 rules matched → INTRUSION, threat level HIGH
  // - 3+ rules matched, or R1 and R2 together → INTRUSION, threat level CRITICAL
  // - Priority: CRITICAL=P1, HIGH=P2, MEDIUM=P3, safe=P4

  if (matchCount === 0 && !features.anomalyFlag) {
    return {
      verdict: 'SAFE',
      threatLevel: 'NONE',
      priority: 'P4',
      summary: 'Traffic appears legitimate'
    };
  }

  if (matchCount >= 3 || (hasR1 && hasR2)) {
    return {
      verdict: 'INTRUSION',
      threatLevel: 'CRITICAL',
      priority: 'P1',
      summary: 'Critical threat identified by multiple matched intrusion rules'
    };
  }

  if (matchCount === 2) {
    return {
      verdict: 'INTRUSION',
      threatLevel: 'HIGH',
      priority: 'P2',
      summary: 'High severity intrusion pattern detected'
    };
  }

  // 1 rule matched or anomaly only
  return {
    verdict: 'SUSPICIOUS',
    threatLevel: 'MEDIUM',
    priority: 'P3',
    summary: 'Suspicious activity observed; monitoring recommended'
  };
}
