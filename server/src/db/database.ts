import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, PipelineEvent, Alert, Notification, RuleConfig, PipelineConfig } from '../pipeline/types.js';

export interface LogEntry {
  id: string;
  record: any;
  created_at: string;
}

export interface MetricSnapshot {
  id: string;
  latency_ms: number;
  throughput: number;
  efficiency: number;
  processed: number;
  mode: 'pipelined' | 'sequential';
  created_at: string;
}

class Database {
  private dataDir: string;
  private filePath: string;

  public users: User[] = [];
  public logs: LogEntry[] = [];
  public events: PipelineEvent[] = [];
  public alerts: Alert[] = [];
  public notifications: Notification[] = [];
  public rules: RuleConfig[] = [];
  public metricsSnapshots: MetricSnapshot[] = [];
  public config: PipelineConfig = {
    stageDelayMs: 500,
    mode: 'pipelined',
    anomalyConfig: {
      zScoreThreshold: 3.0,
      windowSize: 50
    }
  };

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'data');
    this.filePath = path.join(this.dataDir, 'store.json');
    this.init();
  }

  private init() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.users = parsed.users || [];
        this.logs = parsed.logs || [];
        this.events = parsed.events || [];
        this.alerts = parsed.alerts || [];
        this.notifications = parsed.notifications || [];
        this.rules = parsed.rules || [];
        this.metricsSnapshots = parsed.metricsSnapshots || [];
        if (parsed.config) {
          this.config = { ...this.config, ...parsed.config };
        }
      } catch (err) {
        console.error('Failed to read store.json, re-initializing', err);
      }
    }

    this.seedDefaultUsers();
    this.seedDefaultRules();
    this.save();
  }

  private seedDefaultUsers() {
    const defaultUsers = [
      {
        username: 'admin',
        password: 'admin123',
        role: 'admin' as const
      },
      {
        username: 'analyst',
        password: 'analyst123',
        role: 'analyst' as const
      }
    ];

    for (const u of defaultUsers) {
      const existing = this.users.find(x => x.username === u.username);
      if (!existing) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(u.password, salt);
        this.users.push({
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          username: u.username,
          password_hash: hash,
          role: u.role,
          created_at: new Date().toISOString()
        });
      }
    }
  }

  private seedDefaultRules() {
    if (this.rules.length === 0) {
      this.rules = [
        {
          id: 'rule_1',
          code: 'R1',
          name: 'DDoS + Insecure Protocol',
          description: 'High request rate combined with insecure protocols (HTTP, FTP, Telnet)',
          enabled: true,
          params: {
            rateThreshold: 100,
            insecureProtocols: ['HTTP', 'FTP', 'Telnet']
          }
        },
        {
          id: 'rule_2',
          code: 'R2',
          name: 'Attack Port + Abnormal Packet',
          description: 'Targeting known exploit ports with unusually small or large packet sizes',
          enabled: true,
          params: {
            attackPorts: [22, 23, 21, 445, 3389, 1433, 3306, 5900, 6667, 31337],
            minPacketSizeKB: 1,
            maxPacketSizeKB: 4096
          }
        },
        {
          id: 'rule_3',
          code: 'R3',
          name: 'External IP + High Threat Score',
          description: 'External non-RFC1918 traffic having a cumulative threat score >= 70',
          enabled: true,
          params: {
            threatScoreThreshold: 70
          }
        },
        {
          id: 'rule_4',
          code: 'R4',
          name: 'Multiple Threat Indicators',
          description: 'At least 3 simultaneous suspicious indicators triggered',
          enabled: true,
          params: {
            minIndicators: 3
          }
        }
      ];
    }
  }

  public save() {
    try {
      const data = {
        users: this.users,
        logs: this.logs,
        events: this.events,
        alerts: this.alerts,
        notifications: this.notifications,
        rules: this.rules,
        metricsSnapshots: this.metricsSnapshots,
        config: this.config
      };
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save to store.json', err);
    }
  }

  public clearAll() {
    this.logs = [];
    this.events = [];
    this.alerts = [];
    this.notifications = [];
    this.metricsSnapshots = [];
    this.save();
  }
}

export const db = new Database();
