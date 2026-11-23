import { NetworkRecord, FeatureSet } from '../pipeline/types.js';
import { db } from '../db/database.js';

// Checks if IP is outside RFC 1918 private ranges & loopback
export function isExternalIP(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return false;
  // 10.0.0.0/8
  if (parts[0] === 10) return false;
  // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false;
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return false;

  return true;
}

export function isInsecureProtocol(protocol: string): boolean {
  const insecure = ['HTTP', 'FTP', 'Telnet'];
  return insecure.includes(protocol.toUpperCase());
}

export function isAttackPort(port: number, attackPortsList?: number[]): boolean {
  const defaultAttackPorts = [22, 23, 21, 445, 3389, 1433, 3306, 5900, 6667, 31337];
  const list = attackPortsList || defaultAttackPorts;
  return list.includes(port);
}

export function isAbnormalPacket(packetSizeKB: number, minKB = 1, maxKB = 4096): boolean {
  return packetSizeKB < minKB || packetSizeKB > maxKB;
}

export function isHighRate(requestRate: number, threshold = 100): boolean {
  return requestRate > threshold;
}

// Rolling baseline z-score anomaly calculation
export function calculateAnomalyZScore(
  packetSize: number,
  requestRate: number,
  recentRecords: NetworkRecord[],
  zThreshold = 3.0
): { anomalyFlag: boolean; packetSizeZScore: number; requestRateZScore: number } {
  if (recentRecords.length < 5) {
    // Insufficient baseline
    return {
      anomalyFlag: false,
      packetSizeZScore: 0,
      requestRateZScore: 0
    };
  }

  const sizes = recentRecords.map(r => r.packetSizeKB);
  const rates = recentRecords.map(r => r.requestRate);

  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const std = (arr: number[], m: number) => {
    const variance = arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / arr.length;
    return Math.sqrt(variance) || 1e-6;
  };

  const meanSize = mean(sizes);
  const stdSize = std(sizes, meanSize);
  const sizeZ = Math.abs(packetSize - meanSize) / stdSize;

  const meanRate = mean(rates);
  const stdRate = std(rates, meanRate);
  const rateZ = Math.abs(requestRate - meanRate) / stdRate;

  const anomalyFlag = sizeZ > zThreshold || rateZ > zThreshold;

  return {
    anomalyFlag,
    packetSizeZScore: Number(sizeZ.toFixed(2)),
    requestRateZScore: Number(rateZ.toFixed(2))
  };
}

export function extractFeatures(
  record: NetworkRecord,
  recentHistory: NetworkRecord[] = []
): FeatureSet {
  const r2Rule = db.rules.find(r => r.code === 'R2');
  const attackPorts = r2Rule?.params?.attackPorts;
  const minPacket = r2Rule?.params?.minPacketSizeKB ?? 1;
  const maxPacket = r2Rule?.params?.maxPacketSizeKB ?? 4096;

  const r1Rule = db.rules.find(r => r.code === 'R1');
  const rateThreshold = r1Rule?.params?.rateThreshold ?? 100;

  const external = isExternalIP(record.ip);
  const insecure = isInsecureProtocol(record.accessType);
  const attackP = isAttackPort(record.port, attackPorts);
  const abnormalP = isAbnormalPacket(record.packetSizeKB, minPacket, maxPacket);
  const highR = isHighRate(record.requestRate, rateThreshold);

  const zConfig = db.config.anomalyConfig;
  const anomalyRes = calculateAnomalyZScore(
    record.packetSizeKB,
    record.requestRate,
    recentHistory.slice(-zConfig.windowSize),
    zConfig.zScoreThreshold
  );

  // threatScore = clamp( 25·isExternalIP + 20·isInsecureProtocol + 20·isAttackPort + 15·isAbnormalPacket + 20·isHighRate + 10·anomalyFlag , 0, 100)
  const rawScore =
    (external ? 25 : 0) +
    (insecure ? 20 : 0) +
    (attackP ? 20 : 0) +
    (abnormalP ? 15 : 0) +
    (highR ? 20 : 0) +
    (anomalyRes.anomalyFlag ? 10 : 0);

  const threatScore = Math.min(100, Math.max(0, rawScore));

  // Normalizations for UI/metrics (0-1 scale)
  const normalizedPacketSize = Math.min(1, record.packetSizeKB / 10000);
  const normalizedRequestRate = Math.min(1, record.requestRate / 1000);

  return {
    isExternalIP: external,
    isInsecureProtocol: insecure,
    isAttackPort: attackP,
    isAbnormalPacket: abnormalP,
    isHighRate: highR,
    anomalyFlag: anomalyRes.anomalyFlag,
    threatScore,
    packetSizeZScore: anomalyRes.packetSizeZScore,
    requestRateZScore: anomalyRes.requestRateZScore,
    normalizedPacketSize: Number(normalizedPacketSize.toFixed(4)),
    normalizedRequestRate: Number(normalizedRequestRate.toFixed(4))
  };
}
