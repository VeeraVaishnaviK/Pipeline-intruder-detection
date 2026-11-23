import React, { useState, useEffect } from 'react';
import { Sliders, Shield, Save, CheckCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { RuleConfig } from '../types';
import { useAuth } from '../context/AuthContext';

export const RulesPage: React.FC = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<RuleConfig[]>([]);
  const [zScoreThreshold, setZScoreThreshold] = useState<number>(3.0);
  const [windowSize, setWindowSize] = useState<number>(50);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    api.getRules().then(setRules).catch(console.error);
    api.getConfig().then(cfg => {
      if (cfg.anomalyConfig) {
        setZScoreThreshold(cfg.anomalyConfig.zScoreThreshold);
        setWindowSize(cfg.anomalyConfig.windowSize);
      }
    }).catch(console.error);
  }, []);

  const handleToggle = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleParamChange = (id: string, key: string, val: any) => {
    setRules(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          params: { ...r.params, [key]: val }
        };
      }
      return r;
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.updateRules(rules);
      await api.updateConfig({
        anomalyConfig: {
          zScoreThreshold: Number(zScoreThreshold),
          windowSize: Number(windowSize)
        }
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e: any) {
      alert(`Error saving rules: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-tech font-bold text-slate-900 dark:text-slate-100">
          Admin Access Required
        </h3>
        <p className="text-xs font-mono text-slate-500 mt-1">
          Only administrators can configure intrusion detection rule thresholds and parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
            Module 3: Intrusion Detection Engine Rules
          </span>
          <h2 className="text-xl font-tech font-bold text-slate-900 dark:text-slate-100">
            RULES CONFIGURATION & ANOMALY THRESHOLDS
          </h2>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
            Fine-tune Stage 04 detection logic thresholds and statistical baseline parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-tech font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center gap-1.5"
        >
          {savedSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 text-white" />
              SAVED!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              SAVE RULES
            </>
          )}
        </button>
      </div>

      {/* Rules List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-6 rounded-2xl border transition-all ${
              rule.enabled
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/50 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <span className="px-2 py-0.5 rounded text-xs font-tech font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                  {rule.code}
                </span>
                <h3 className="text-sm font-tech font-bold text-slate-900 dark:text-slate-100">
                  {rule.name}
                </h3>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => handleToggle(rule.id)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            <p className="mt-3 text-xs font-mono text-slate-500 dark:text-slate-400">
              {rule.description}
            </p>

            {/* Configurable Parameters */}
            <div className="mt-4 space-y-3 font-mono text-xs">
              {rule.code === 'R1' && (
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Request Rate Threshold (req/sec):
                  </label>
                  <input
                    type="number"
                    value={rule.params?.rateThreshold ?? 100}
                    onChange={(e) => handleParamChange(rule.id, 'rateThreshold', Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}

              {rule.code === 'R2' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1">Min Packet Size (KB):</label>
                      <input
                        type="number"
                        value={rule.params?.minPacketSizeKB ?? 1}
                        onChange={(e) => handleParamChange(rule.id, 'minPacketSizeKB', Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 mb-1">Max Packet Size (KB):</label>
                      <input
                        type="number"
                        value={rule.params?.maxPacketSizeKB ?? 4096}
                        onChange={(e) => handleParamChange(rule.id, 'maxPacketSizeKB', Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1">Monitored Exploit Ports:</label>
                    <input
                      type="text"
                      value={(rule.params?.attackPorts ?? []).join(', ')}
                      onChange={(e) => {
                        const ports = e.target.value.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
                        handleParamChange(rule.id, 'attackPorts', ports);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}

              {rule.code === 'R3' && (
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Threat Score Threshold (0 - 100):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={rule.params?.threatScoreThreshold ?? 70}
                    onChange={(e) => handleParamChange(rule.id, 'threatScoreThreshold', Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}

              {rule.code === 'R4' && (
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    Minimum Triggered Threat Indicators:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={rule.params?.minIndicators ?? 3}
                    onChange={(e) => handleParamChange(rule.id, 'minIndicators', Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Anomaly Detection Settings Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-tech font-bold text-slate-900 dark:text-slate-100 uppercase mb-3">
          STATISTICAL ANOMALY DETECTOR CONFIGURATION
        </h3>
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-4">
          Calculates rolling mean and standard deviation of packet sizes and rates to flag z-score outliers (|z| &gt; threshold).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">
              Z-Score Outlier Threshold (|z| &gt; X):
            </label>
            <input
              type="number"
              step="0.1"
              value={zScoreThreshold}
              onChange={(e) => setZScoreThreshold(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 mb-1">
              Rolling History Window Size (Records):
            </label>
            <input
              type="number"
              value={windowSize}
              onChange={(e) => setWindowSize(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
