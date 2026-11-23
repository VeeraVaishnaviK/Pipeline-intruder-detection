import { 
  NetworkRecord, 
  PipelineEvent, 
  Alert, 
  Notification, 
  RuleConfig, 
  PerformanceMetrics, 
  HitMissAnalysis, 
  ComparisonResult 
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('ids_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(username: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Session expired');
    return res.json();
  },

  // Pipeline
  async runSingle(record: Partial<NetworkRecord>) {
    const res = await fetch(`${API_BASE}/pipeline/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(record)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to execute pipeline');
    }
    return res.json() as Promise<{
      record: NetworkRecord;
      event: PipelineEvent;
      alert: Alert | null;
      metrics: PerformanceMetrics;
    }>;
  },

  async runBatch(params: { count?: number; attackRatio?: number; records?: any[] }) {
    const res = await fetch(`${API_BASE}/pipeline/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to queue batch');
    }
    return res.json();
  },

  async getConfig() {
    const res = await fetch(`${API_BASE}/pipeline/config`);
    return res.json();
  },

  async updateConfig(config: { stageDelayMs?: number; mode?: 'pipelined' | 'sequential'; anomalyConfig?: any }) {
    const res = await fetch(`${API_BASE}/pipeline/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(config)
    });
    return res.json();
  },

  async resetPipeline() {
    const res = await fetch(`${API_BASE}/pipeline/reset`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  },

  // Metrics
  async getMetrics(): Promise<PerformanceMetrics> {
    const res = await fetch(`${API_BASE}/metrics`);
    return res.json();
  },

  async getComparison(n = 20): Promise<ComparisonResult> {
    const res = await fetch(`${API_BASE}/metrics/compare?n=${n}`);
    return res.json();
  },

  async getHitMiss(): Promise<HitMissAnalysis> {
    const res = await fetch(`${API_BASE}/hitmiss`);
    return res.json();
  },

  // Logs & Alerts
  async getLogs(limit = 100): Promise<any[]> {
    const res = await fetch(`${API_BASE}/logs?limit=${limit}`);
    return res.json();
  },

  async getEvents(limit = 100): Promise<PipelineEvent[]> {
    const res = await fetch(`${API_BASE}/events?limit=${limit}`);
    return res.json();
  },

  async getAlerts(): Promise<Alert[]> {
    const res = await fetch(`${API_BASE}/alerts`);
    return res.json();
  },

  async acknowledgeAlert(id: string): Promise<Alert> {
    const res = await fetch(`${API_BASE}/alerts/${id}/ack`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to acknowledge alert');
    }
    return res.json();
  },

  async getNotifications(): Promise<Notification[]> {
    const res = await fetch(`${API_BASE}/notifications`);
    return res.json();
  },

  // Rules
  async getRules(): Promise<RuleConfig[]> {
    const res = await fetch(`${API_BASE}/rules`);
    return res.json();
  },

  async updateRules(rules: RuleConfig[]): Promise<RuleConfig[]> {
    const res = await fetch(`${API_BASE}/rules`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ rules })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update rules');
    }
    return res.json();
  },

  // Health & Self-Test
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async runSelfTest() {
    const res = await fetch(`${API_BASE}/selftest`, {
      method: 'POST',
      headers: { ...getAuthHeader() }
    });
    return res.json();
  }
};
