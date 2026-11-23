import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { db } from './db/database.js';
import { handleLogin, authenticateToken, requireAdmin, AuthenticatedRequest } from './auth/auth.js';
import { NetworkRecordSchema, createNetworkRecord, resetRecordCounter } from './sensor/sensor.js';
import { pipelineEngine } from './pipeline/pipelineEngine.js';
import { metricsEngine } from './metrics/metricsEngine.js';
import { AlertManager } from './alerts/alertManager.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ---------------- AUTH ROUTES ----------------
app.post('/api/auth/login', handleLogin);

app.post('/api/auth/logout', (req: Request, res: Response) => {
  return res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

// ---------------- PIPELINE RUN & BATCH ----------------
app.post('/api/pipeline/run', async (req: Request, res: Response) => {
  try {
    const input = NetworkRecordSchema.parse(req.body);
    const record = createNetworkRecord(input);
    const event = await pipelineEngine.enqueue(record);

    const alert = db.alerts.find(a => a.event_id === event.id) || null;

    return res.json({
      record,
      event,
      alert,
      metrics: metricsEngine.getLiveMetrics()
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    return res.status(500).json({ error: err.message || 'Internal pipeline error' });
  }
});

app.post('/api/pipeline/batch', async (req: Request, res: Response) => {
  try {
    const { count = 10, attackRatio = 0.3, records: customRecords } = req.body;
    const n = Math.min(100, Math.max(1, Number(count)));
    const ratio = Math.max(0, Math.min(1, Number(attackRatio)));

    let recordsToRun: any[] = [];

    if (Array.isArray(customRecords) && customRecords.length > 0) {
      recordsToRun = customRecords.map(r => createNetworkRecord(NetworkRecordSchema.parse(r)));
    } else {
      // Generate synthetic records
      const attackPorts = [22, 23, 21, 445, 3389];
      const safePorts = [80, 443, 8080, 53];
      const safeProtocols = ['HTTPS', 'DNS', 'SMTP', 'SSH'];
      const attackProtocols = ['Telnet', 'HTTP', 'FTP'];

      for (let i = 0; i < n; i++) {
        const isAttack = Math.random() < ratio;
        if (isAttack) {
          recordsToRun.push(
            createNetworkRecord({
              ip: `${Math.floor(Math.random() * 200) + 20}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
              port: attackPorts[Math.floor(Math.random() * attackPorts.length)],
              packetSizeKB: Math.floor(Math.random() * 6000) + 4100, // abnormal packet
              accessType: attackProtocols[Math.floor(Math.random() * attackProtocols.length)] as any,
              requestRate: Math.floor(Math.random() * 400) + 150, // high rate
              groundTruth: 'INTRUSION'
            })
          );
        } else {
          recordsToRun.push(
            createNetworkRecord({
              ip: `192.168.1.${Math.floor(Math.random() * 200) + 10}`,
              port: safePorts[Math.floor(Math.random() * safePorts.length)],
              packetSizeKB: Math.floor(Math.random() * 1500) + 100,
              accessType: safeProtocols[Math.floor(Math.random() * safeProtocols.length)] as any,
              requestRate: Math.floor(Math.random() * 40) + 5,
              groundTruth: 'SAFE'
            })
          );
        }
      }
    }

    // Launch pipeline processing asynchronously
    const recordPromises = recordsToRun.map(rec => pipelineEngine.enqueue(rec));

    // Return acknowledgement with record IDs so client tracks progress via SSE
    res.json({
      message: `Batch of ${recordsToRun.length} records queued for execution`,
      totalQueued: recordsToRun.length,
      recordIds: recordsToRun.map(r => r.id)
    });

    // Await all in background to calculate batch metrics
    Promise.all(recordPromises).then((events) => {
      pipelineEngine.emit('stream', {
        type: 'batch_complete',
        payload: {
          total: events.length,
          metrics: metricsEngine.getLiveMetrics(),
          hitMiss: metricsEngine.getHitMissAnalysis()
        },
        timestamp: Date.now()
      });
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ---------------- SSE STREAM ----------------
app.get('/api/pipeline/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial state
  res.write(`data: ${JSON.stringify({
    type: 'init',
    activeRecordIds: pipelineEngine.getActiveStages(),
    stageDelayMs: pipelineEngine.getStageDelay(),
    mode: pipelineEngine.getMode(),
    metrics: metricsEngine.getLiveMetrics(),
    timestamp: Date.now()
  })}\n\n`);

  const onStreamEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  pipelineEngine.on('stream', onStreamEvent);

  req.on('close', () => {
    pipelineEngine.off('stream', onStreamEvent);
  });
});

// ---------------- CONFIG & CONTROL ----------------
app.get('/api/pipeline/config', (req: Request, res: Response) => {
  res.json({
    stageDelayMs: pipelineEngine.getStageDelay(),
    mode: pipelineEngine.getMode(),
    anomalyConfig: db.config.anomalyConfig
  });
});

app.put('/api/pipeline/config', (req: Request, res: Response) => {
  const { stageDelayMs, mode, anomalyConfig } = req.body;
  if (typeof stageDelayMs === 'number') {
    pipelineEngine.setStageDelay(stageDelayMs);
  }
  if (mode === 'pipelined' || mode === 'sequential') {
    pipelineEngine.setMode(mode);
  }
  if (anomalyConfig) {
    if (typeof anomalyConfig.zScoreThreshold === 'number') {
      db.config.anomalyConfig.zScoreThreshold = anomalyConfig.zScoreThreshold;
    }
    if (typeof anomalyConfig.windowSize === 'number') {
      db.config.anomalyConfig.windowSize = anomalyConfig.windowSize;
    }
    db.save();
  }

  res.json({
    stageDelayMs: pipelineEngine.getStageDelay(),
    mode: pipelineEngine.getMode(),
    anomalyConfig: db.config.anomalyConfig
  });
});

app.post('/api/pipeline/reset', (req: Request, res: Response) => {
  pipelineEngine.resetAll();
  resetRecordCounter();
  res.json({ message: 'Pipeline and database state reset to initial', metrics: metricsEngine.getLiveMetrics() });
});

// ---------------- METRICS & ANALYSIS ----------------
app.get('/api/metrics', (req: Request, res: Response) => {
  res.json(metricsEngine.getLiveMetrics());
});

app.get('/api/metrics/compare', (req: Request, res: Response) => {
  const n = req.query.n ? Number(req.query.n) : 20;
  res.json(metricsEngine.runComparison(n));
});

app.get('/api/hitmiss', (req: Request, res: Response) => {
  res.json(metricsEngine.getHitMissAnalysis());
});

// ---------------- LOGS, EVENTS & ALERTS ----------------
app.get('/api/logs', (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  res.json(db.logs.slice(0, limit));
});

app.get('/api/events', (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  res.json(db.events.slice(0, limit));
});

app.get('/api/alerts', (req: Request, res: Response) => {
  res.json(db.alerts);
});

app.post('/api/alerts/:id/ack', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const alertId = String(req.params.id);
  const username = req.user?.username || 'Security Analyst';
  const updated = AlertManager.acknowledgeAlert(alertId, username);
  if (!updated) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  res.json(updated);
});

app.get('/api/notifications', (req: Request, res: Response) => {
  res.json(db.notifications);
});

// ---------------- RULES MANAGEMENT (ADMIN ONLY) ----------------
app.get('/api/rules', (req: Request, res: Response) => {
  res.json(db.rules);
});

app.put('/api/rules', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { rules } = req.body;
  if (!Array.isArray(rules)) {
    return res.status(400).json({ error: 'Rules array is required' });
  }
  db.rules = rules;
  db.save();
  res.json(db.rules);
});

// ---------------- HEALTH & SELF-TEST ----------------
app.get('/api/health', (req: Request, res: Response) => {
  res.json(AlertManager.getSystemHealth());
});

app.post('/api/selftest', async (req: Request, res: Response) => {
  try {
    // 1. Run Safe sample
    const safeInput = {
      ip: '192.168.1.100',
      port: 8080,
      packetSizeKB: 1024,
      accessType: 'HTTPS' as const,
      timestamp: new Date().toISOString(),
      requestRate: 10,
      groundTruth: 'SAFE' as const
    };
    const safeRecord = createNetworkRecord(safeInput);
    const safeEvent = await pipelineEngine.enqueue(safeRecord);

    // 2. Run Attack sample
    const attackInput = {
      ip: '203.0.113.195',
      port: 23,
      packetSizeKB: 8000,
      accessType: 'Telnet' as const,
      timestamp: new Date().toISOString(),
      requestRate: 500,
      groundTruth: 'INTRUSION' as const
    };
    const attackRecord = createNetworkRecord(attackInput);
    const attackEvent = await pipelineEngine.enqueue(attackRecord);

    const safePass = safeEvent.verdict === 'SAFE';
    const attackPass = attackEvent.verdict === 'INTRUSION' && attackEvent.threat_level === 'CRITICAL';

    res.json({
      status: safePass && attackPass ? 'PASS' : 'FAIL',
      safeTest: {
        record: safeRecord,
        verdict: safeEvent.verdict,
        threatLevel: safeEvent.threat_level,
        passed: safePass
      },
      attackTest: {
        record: attackRecord,
        verdict: attackEvent.verdict,
        threatLevel: attackEvent.threat_level,
        matchedRules: attackEvent.matched_rules,
        passed: attackPass
      },
      health: AlertManager.getSystemHealth()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static frontend files if built
const clientDistPath = path.resolve(process.cwd(), '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req: Request, res: Response, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[Pipelined IDS Server] running on http://localhost:${PORT}`);
});
