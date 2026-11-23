import { z } from 'zod';
import { NetworkRecord } from '../pipeline/types.js';

const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export const NetworkRecordSchema = z.object({
  ip: z.string().trim().regex(ipv4Regex, { message: 'Must be a valid IPv4 address (e.g. 192.168.1.100)' }),
  port: z.coerce.number().int().min(1, 'Port must be between 1 and 65535').max(65535, 'Port must be between 1 and 65535'),
  packetSizeKB: z.coerce.number().positive('Packet size must be greater than 0 KB'),
  accessType: z.enum(['HTTP', 'HTTPS', 'FTP', 'SSH', 'Telnet', 'SMTP', 'DNS', 'Unknown'], {
    errorMap: () => ({ message: 'Please select a valid Access Type' })
  }),
  timestamp: z.string().optional(),
  requestRate: z.coerce.number().min(0, 'Request rate cannot be negative'),
  groundTruth: z.enum(['SAFE', 'INTRUSION']).optional()
});

export type NetworkRecordInput = z.infer<typeof NetworkRecordSchema>;

let recordCounter = 1;

export function createNetworkRecord(input: NetworkRecordInput): NetworkRecord {
  const validated = NetworkRecordSchema.parse(input);
  const now = validated.timestamp ? new Date(validated.timestamp).toISOString() : new Date().toISOString();
  
  return {
    id: `REC-${String(recordCounter++).padStart(5, '0')}`,
    ip: validated.ip,
    port: validated.port,
    packetSizeKB: Number(validated.packetSizeKB),
    accessType: validated.accessType,
    timestamp: now,
    requestRate: Number(validated.requestRate),
    groundTruth: validated.groundTruth
  };
}

export function resetRecordCounter() {
  recordCounter = 1;
}
