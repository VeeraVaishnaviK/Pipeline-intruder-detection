import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Bell, 
  Mail, 
  Download, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import { Alert, Notification } from '../types';
import { useAuth } from '../context/AuthContext';

export const LogsAlertsPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'alerts' | 'logs' | 'notifications'>('alerts');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [a, l, n] = await Promise.all([
        api.getAlerts(),
        api.getLogs(100),
        api.getNotifications()
      ]);
      setAlerts(a);
      setLogs(l);
      setNotifications(n);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      await api.acknowledgeAlert(id);
      fetchData();
    } catch (e: any) {
      alert(`Error acknowledging alert: ${e.message}`);
    }
  };

  const exportCsv = () => {
    if (tab === 'alerts') {
      const headers = ['ID', 'Event ID', 'IP', 'Port', 'Threat Level', 'Priority', 'Status', 'Acknowledged By', 'Timestamp'];
      const rows = alerts.map(a => [
        a.id,
        a.event_id,
        a.ip,
        a.port,
        a.threat_level,
        a.priority,
        a.status,
        a.acknowledged_by || 'Unacknowledged',
        a.created_at
      ]);
      downloadCsv('alerts_export.csv', [headers, ...rows]);
    } else if (tab === 'logs') {
      const headers = ['Log ID', 'Record ID', 'IP', 'Port', 'PacketSizeKB', 'AccessType', 'Rate', 'Timestamp'];
      const rows = logs.map(l => [
        l.id,
        l.record?.id,
        l.record?.ip,
        l.record?.port,
        l.record?.packetSizeKB,
        l.record?.accessType,
        l.record?.requestRate,
        l.created_at
      ]);
      downloadCsv('sensor_logs_export.csv', [headers, ...rows]);
    } else {
      const headers = ['Notification ID', 'Alert ID', 'Channel', 'Recipient', 'Message', 'Timestamp'];
      const rows = notifications.map(n => [
        n.id,
        n.alert_id,
        n.channel,
        n.recipient,
        `"${n.message.replace(/"/g, '""')}"`,
        n.created_at
      ]);
      downloadCsv('notifications_outbox_export.csv', [headers, ...rows]);
    }
  };

  const downloadCsv = (filename: string, rows: any[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAlerts = alerts.filter(a => 
    a.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.threat_level.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.matched_rules && a.matched_rules.join(' ').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredLogs = logs.filter(l =>
    (l.record?.ip || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.record?.accessType || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNotifications = notifications.filter(n =>
    n.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
            Module 5: Alert Generation & Audit System
          </span>
          <h2 className="text-xl font-tech font-bold text-slate-900 dark:text-slate-100">
            LOGS, ALERTS & NOTIFICATIONS OUTBOX
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex space-x-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab('alerts')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              tab === 'alerts'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Intrusion Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setTab('logs')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              tab === 'logs'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileText className="w-4 h-4" />
            Sensor Logs ({logs.length})
          </button>
          <button
            onClick={() => setTab('notifications')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              tab === 'notifications'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Mail className="w-4 h-4" />
            Notifications Outbox ({notifications.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search records, IP, status..."
            className="pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {tab === 'alerts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">ALERT ID</th>
                  <th className="py-3 px-4">TIMESTAMP</th>
                  <th className="py-3 px-4">SOURCE IP:PORT</th>
                  <th className="py-3 px-4">THREAT LEVEL</th>
                  <th className="py-3 px-4">MATCHED RULES</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No alerts found.
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-red-600 dark:text-red-400">{a.id}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(a.created_at).toLocaleTimeString()}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{a.ip}:{a.port}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800">
                          {a.threat_level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {a.matched_rules.join(', ')}
                      </td>
                      <td className="py-3 px-4">
                        {a.status === 'Acknowledged' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Ack by {a.acknowledged_by}
                          </span>
                        ) : (
                          <span className="text-amber-500 font-bold animate-pulse">New / Active</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {a.status === 'New' && (
                          <button
                            onClick={() => handleAcknowledge(a.id)}
                            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-cyan-600 dark:text-cyan-400 font-bold transition"
                          >
                            Acknowledge
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'logs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">LOG ID</th>
                  <th className="py-3 px-4">TIMESTAMP</th>
                  <th className="py-3 px-4">RECORD ID</th>
                  <th className="py-3 px-4">IP ADDRESS</th>
                  <th className="py-3 px-4">PORT</th>
                  <th className="py-3 px-4">PACKET SIZE</th>
                  <th className="py-3 px-4">PROTOCOL</th>
                  <th className="py-3 px-4">RATE (REQ/S)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-cyan-600 dark:text-cyan-400">{l.id}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(l.created_at).toLocaleTimeString()}</td>
                      <td className="py-3 px-4 font-bold">{l.record?.id}</td>
                      <td className="py-3 px-4">{l.record?.ip}</td>
                      <td className="py-3 px-4">{l.record?.port}</td>
                      <td className="py-3 px-4">{l.record?.packetSizeKB} KB</td>
                      <td className="py-3 px-4">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">
                          {l.record?.accessType}
                        </span>
                      </td>
                      <td className="py-3 px-4">{l.record?.requestRate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">NOTIF ID</th>
                  <th className="py-3 px-4">CHANNEL</th>
                  <th className="py-3 px-4">RECIPIENT</th>
                  <th className="py-3 px-4">SIMULATED MESSAGE</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">DISPATCHED AT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No notifications dispatched.
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map(n => (
                    <tr key={n.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-bold text-cyan-600 dark:text-cyan-400">{n.id}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          n.channel === 'EMAIL' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {n.channel}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{n.recipient}</td>
                      <td className="py-3 px-4 max-w-md text-slate-600 dark:text-slate-300">{n.message}</td>
                      <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-bold">{n.status}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(n.created_at).toLocaleTimeString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
