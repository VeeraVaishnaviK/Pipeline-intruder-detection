import { PipelineEvent, Alert, Notification, NetworkRecord } from '../pipeline/types.js';
import { db } from '../db/database.js';

export class AlertManager {
  public static handleEvent(event: PipelineEvent, record: NetworkRecord): Alert | null {
    // Only raise alert for INTRUSION or CRITICAL/HIGH
    if (event.verdict !== 'INTRUSION') {
      return null;
    }

    const alertId = `ALT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const matchedRulesText = event.matched_rules.join(', ') || 'Rule Threshold Exceeded';
    const alertMessage = `Intrusion detected – Threat Level: ${event.threat_level}. Matched Rules: ${matchedRulesText}`;

    const alert: Alert = {
      id: alertId,
      event_id: event.id,
      record_id: record.id,
      threat_level: event.threat_level as 'MEDIUM' | 'HIGH' | 'CRITICAL',
      priority: event.priority,
      matched_rules: event.matched_rules,
      ip: record.ip,
      port: record.port,
      status: 'New',
      alert_message: alertMessage,
      created_at: new Date().toISOString()
    };

    db.alerts.unshift(alert);

    // Simulate notification dispatch to outbox
    const emailNotification: Notification = {
      id: `NOTIF-EMAIL-${Date.now()}`,
      alert_id: alert.id,
      channel: 'EMAIL',
      recipient: 'soc-admin@defense.internal',
      message: `[SECURITY ALERT] ${event.threat_level} priority incident from IP ${record.ip}:${record.port}. Rules: ${matchedRulesText}`,
      status: 'SENT_SIMULATED',
      created_at: new Date().toISOString()
    };

    const smsNotification: Notification = {
      id: `NOTIF-SMS-${Date.now()}`,
      alert_id: alert.id,
      channel: 'SMS',
      recipient: '+1-555-0199 (Duty Analyst)',
      message: `CRITICAL SEC ALERT: ${record.ip} triggered ${matchedRulesText}`,
      status: 'SENT_SIMULATED',
      created_at: new Date().toISOString()
    };

    db.notifications.unshift(emailNotification);
    if (event.threat_level === 'CRITICAL') {
      db.notifications.unshift(smsNotification);
    }

    db.save();
    return alert;
  }

  public static acknowledgeAlert(alertId: string, username: string): Alert | null {
    const alert = db.alerts.find(a => a.id === alertId);
    if (!alert) return null;

    alert.status = 'Acknowledged';
    alert.acknowledged_by = username;
    alert.acknowledged_at = new Date().toISOString();
    db.save();
    return alert;
  }

  public static getSystemHealth() {
    return {
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      modules: {
        sensor: {
          name: 'Sensor Interface & Data Acquisition',
          status: 'OPERATIONAL',
          details: 'Input validation, packet parsing, and rate tracking online'
        },
        pipeline: {
          name: 'Pipelined Data Path Architecture',
          status: 'OPERATIONAL',
          details: `6-stage queue active (${db.config.mode} mode, ${db.config.stageDelayMs}ms cycle)`
        },
        detection: {
          name: 'Hit-Miss Analysis & Detection Logic',
          status: 'OPERATIONAL',
          details: 'R1-R4 rules engine & rolling Z-score anomaly detector active'
        },
        metrics: {
          name: 'Performance Evaluation & Optimization',
          status: 'OPERATIONAL',
          details: 'Latency, throughput, and efficiency profiling engine running'
        },
        alerts: {
          name: 'Alert Generation & System Integration',
          status: 'OPERATIONAL',
          details: `Active alerts: ${db.alerts.filter(a => a.status === 'New').length}, Outbox: ${db.notifications.length}`
        }
      }
    };
  }
}
