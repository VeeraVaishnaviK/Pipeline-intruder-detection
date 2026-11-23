import React, { useState } from 'react';
import { Play, ShieldCheck, ShieldAlert, FileUp, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { usePipeline } from '../../context/PipelineContext';

const IPV4_REGEX = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const ACCESS_TYPES = [
  { value: 'HTTP', label: 'HTTP (Insecure)', insecure: true },
  { value: 'HTTPS', label: 'HTTPS (Secure)', insecure: false },
  { value: 'FTP', label: 'FTP (Insecure)', insecure: true },
  { value: 'SSH', label: 'SSH (Encrypted)', insecure: false },
  { value: 'Telnet', label: 'Telnet (Insecure)', insecure: true },
  { value: 'SMTP', label: 'SMTP (Mail)', insecure: false },
  { value: 'DNS', label: 'DNS (Resolution)', insecure: false },
  { value: 'Unknown', label: 'Unknown', insecure: false },
];

export const InputPanel: React.FC = () => {
  const { isPipelineRunning, refreshMetrics } = usePipeline();

  const [ip, setIp] = useState<string>('192.168.1.100');
  const [port, setPort] = useState<number>(8080);
  const [packetSizeKB, setPacketSizeKB] = useState<number>(1024);
  const [accessType, setAccessType] = useState<string>('HTTPS');
  const [timestamp, setTimestamp] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [requestRate, setRequestRate] = useState<number>(10);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [jsonText, setJsonText] = useState<string>('');

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!ip.trim() || !IPV4_REGEX.test(ip.trim())) {
      errs.ip = 'Valid IPv4 address required (e.g. 192.168.1.100)';
    }
    if (isNaN(port) || port < 1 || port > 65535) {
      errs.port = 'Port must be between 1 and 65535';
    }
    if (isNaN(packetSizeKB) || packetSizeKB <= 0) {
      errs.packetSizeKB = 'Packet size must be greater than 0 KB';
    }
    if (!accessType) {
      errs.accessType = 'Select an Access Type';
    }
    if (isNaN(requestRate) || requestRate < 0) {
      errs.requestRate = 'Request rate cannot be negative';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await api.runSingle({
        ip: ip.trim(),
        port: Number(port),
        packetSizeKB: Number(packetSizeKB),
        accessType,
        timestamp: new Date(timestamp).toISOString(),
        requestRate: Number(requestRate)
      });
      refreshMetrics();
    } catch (err: any) {
      alert(`Error running pipeline: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadSampleSafe = () => {
    setIp('192.168.1.100');
    setPort(8080);
    setPacketSizeKB(1024);
    setAccessType('HTTPS');
    setRequestRate(10);
    setTimestamp(new Date().toISOString().slice(0, 16));
    setErrors({});
  };

  const loadSampleAttack = () => {
    setIp('203.0.113.195');
    setPort(23); // Telnet attack port
    setPacketSizeKB(8000); // Abnormal packet (>4096KB)
    setAccessType('Telnet'); // Insecure protocol
    setRequestRate(500); // High request rate
    setTimestamp(new Date().toISOString().slice(0, 16));
    setErrors({});
  };

  const handleImportSubmit = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const record = Array.isArray(parsed) ? parsed[0] : parsed;
      if (record.ip) setIp(record.ip);
      if (record.port) setPort(Number(record.port));
      if (record.packetSizeKB) setPacketSizeKB(Number(record.packetSizeKB));
      if (record.accessType) setAccessType(record.accessType);
      if (record.requestRate) setRequestRate(Number(record.requestRate));
      setImportModalOpen(false);
      setErrors({});
    } catch {
      alert('Invalid JSON format');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 relative">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
            Module 1: Sensor Interface
          </span>
          <h2 className="text-lg font-tech font-bold text-slate-900 dark:text-slate-100">
            DATA ACQUISITION
          </h2>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={loadSampleSafe}
            className="px-2.5 py-1 text-xs font-mono rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Sample Safe
          </button>
          <button
            type="button"
            onClick={loadSampleAttack}
            className="px-2.5 py-1 text-xs font-mono rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 transition flex items-center gap-1"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Sample Attack
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* IP Address */}
        <div>
          <label className="block text-xs font-mono text-slate-600 dark:text-slate-300 mb-1">
            IP Address (IPv4)
          </label>
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="192.168.1.100"
            className={`w-full px-3 py-2 text-sm font-mono rounded-lg border bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition ${
              errors.ip ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
            }`}
          />
          {errors.ip && <p className="text-xs text-red-500 mt-1">{errors.ip}</p>}
        </div>

        {/* Port & Packet Size Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-slate-600 dark:text-slate-300 mb-1">
              Port Number (1-65535)
            </label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
              placeholder="8080"
              className={`w-full px-3 py-2 text-sm font-mono rounded-lg border bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition ${
                errors.port ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.port && <p className="text-xs text-red-500 mt-1">{errors.port}</p>}
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-600 dark:text-slate-300 mb-1">
              Packet Size (KB)
            </label>
            <input
              type="number"
              value={packetSizeKB}
              onChange={(e) => setPacketSizeKB(Number(e.target.value))}
              placeholder="1024"
              className={`w-full px-3 py-2 text-sm font-mono rounded-lg border bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition ${
                errors.packetSizeKB ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.packetSizeKB && <p className="text-xs text-red-500 mt-1">{errors.packetSizeKB}</p>}
          </div>
        </div>

        {/* Access Type & Request Rate */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-slate-600 dark:text-slate-300 mb-1">
              Access Type
            </label>
            <select
              value={accessType}
              onChange={(e) => setAccessType(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            >
              {ACCESS_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-600 dark:text-slate-300 mb-1">
              Request Rate (req/s)
            </label>
            <input
              type="number"
              value={requestRate}
              onChange={(e) => setRequestRate(Number(e.target.value))}
              placeholder="10"
              className={`w-full px-3 py-2 text-sm font-mono rounded-lg border bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition ${
                errors.requestRate ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.requestRate && <p className="text-xs text-red-500 mt-1">{errors.requestRate}</p>}
          </div>
        </div>

        {/* Timestamp */}
        <div>
          <label className="block text-xs font-mono text-slate-600 dark:text-slate-300 mb-1">
            Timestamp
          </label>
          <input
            type="datetime-local"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            type="submit"
            disabled={isPipelineRunning || isSubmitting}
            className={`flex-1 py-3 px-4 rounded-xl font-tech font-bold text-base tracking-wider uppercase text-white shadow-md transition-all flex items-center justify-center gap-2 ${
              isPipelineRunning || isSubmitting
                ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-cyan-500/25 active:scale-[0.99]'
            }`}
          >
            {isPipelineRunning || isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                PIPELINE IN PROGRESS...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                EXECUTE PIPELINE
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="py-3 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono flex items-center justify-center gap-1.5 transition"
          >
            <FileUp className="w-4 h-4" />
            Import JSON
          </button>
        </div>
      </form>

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-base font-tech font-bold text-slate-900 dark:text-slate-100 mb-2">
              Import Custom JSON Record
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-mono">
              Paste JSON network object matching schema:
            </p>
            <textarea
              rows={6}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{\n  "ip": "203.0.113.195",\n  "port": 23,\n  "packetSizeKB": 8000,\n  "accessType": "Telnet",\n  "requestRate": 500\n}'
              className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                className="px-4 py-1.5 rounded-lg text-xs font-mono bg-cyan-500 text-white font-semibold hover:bg-cyan-600"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
