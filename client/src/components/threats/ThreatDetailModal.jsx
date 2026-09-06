import React, { useState } from 'react';
import { SeverityBadge, ActionBadge, ThreatTypeBadge } from '../common/StatusBadge';
import { X, ShieldAlert, Cpu, Activity, Database, Check, Save } from 'lucide-react';
import { threatsApi } from '../../services/api';

export default function ThreatDetailModal({ event, onClose, onUpdated }) {
  const [resolved, setResolved] = useState(event?.resolved || false);
  const [notes, setNotes] = useState(event?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  if (!event) return null;

  const handleSaveTriage = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const res = await threatsApi.updateStatus(event._id, { resolved, notes });
      if (res.success) {
        setSaveSuccess(true);
        if (typeof onUpdated === 'function') onUpdated(res.event);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setSaveError(err.response?.data?.error || err.message || 'Failed to update triage status');
    } finally {
      setIsSaving(false);
    }
  };

  const telemetry = event.telemetry || {};
  const breakdown = event.breakdown || {};
  const factors = event.factors || [];
  const rules = event.ruleMatches || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start space-x-3 mb-6">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 mt-1">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Incident Forensic Inspection
              </h2>
              <span className="font-mono text-xs text-slate-500">#{event._id.slice(-8)}</span>
            </div>
            <p className="text-xs text-slate-400">
              Recorded at {new Date(event.timestamp).toLocaleString()} from {event.ip}
            </p>
          </div>
        </div>

        {/* High-Level Badges Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl mb-6 text-xs">
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-semibold mb-1">Threat Type</div>
            <ThreatTypeBadge type={event.threatType} />
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-semibold mb-1">Risk Score</div>
            <div className="font-mono text-sm font-bold text-white">
              {event.riskScore} <span className="text-slate-500 text-xs">/ 100</span>
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-semibold mb-1">Severity</div>
            <SeverityBadge severity={event.severity} />
          </div>
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-semibold mb-1">Gateway Action</div>
            <ActionBadge action={event.action} />
          </div>
        </div>

        {/* Target Request Info */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Target Request Metadata
          </h4>
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-mono space-y-1 text-slate-300">
            <div>
              <span className="text-slate-500">Method:</span>{' '}
              <span className="text-blue-400 font-bold">{event.method}</span>
            </div>
            <div>
              <span className="text-slate-500">Path:</span>{' '}
              <span className="text-cyan-400">{event.path}</span>
            </div>
            {event.userAgent && (
              <div className="truncate">
                <span className="text-slate-500">User-Agent:</span> {event.userAgent}
              </div>
            )}
          </div>
        </div>

        {/* Multi-Signal Diagnostic Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs">
          {/* Rule Matches & AI */}
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <div className="flex items-center space-x-2 font-bold text-slate-200 mb-3">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Inspection Signals</span>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-slate-400">Rule Matches:</span>{' '}
                {rules.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {rules.map((r, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[11px]"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500 font-mono">None</span>
                )}
              </div>
              <div>
                <span className="text-slate-400">AI Model Prediction:</span>{' '}
                <span className="font-mono text-cyan-400 font-semibold">
                  {event.threatType} ({(event.aiConfidence * 100).toFixed(1)}% confidence)
                </span>
              </div>
              <div>
                <span className="text-slate-400">Model Version:</span>{' '}
                <span className="font-mono text-slate-300">{event.aiModelVersion}</span>
              </div>
              {factors.length > 0 && (
                <div>
                  <span className="text-slate-400">Triggered Floors:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {factors.map((f, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-[10px]"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Behavioral Telemetry */}
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <div className="flex items-center space-x-2 font-bold text-slate-200 mb-3">
              <Activity className="w-4 h-4 text-pink-400" />
              <span>Behavioral Telemetry (Isolation Forest)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">Velocity (req/min)</div>
                <div className="font-bold text-white">{telemetry.requestFrequency || 1}</div>
              </div>
              <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">Burst (req/10s)</div>
                <div className="font-bold text-white">{telemetry.burstFrequency || 1}</div>
              </div>
              <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">Failed Logins</div>
                <div className="font-bold text-white">{telemetry.failedAuthAttempts || 0}</div>
              </div>
              <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">4xx Error Rate</div>
                <div className="font-bold text-white">
                  {typeof telemetry.error4xxRate === 'number' ? telemetry.error4xxRate.toFixed(2) : '0.00'}
                </div>
              </div>
              <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">Path Entropy</div>
                <div className="font-bold text-white">{telemetry.pathEntropy || 1.0}</div>
              </div>
              <div className="p-2 bg-slate-900/90 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">Anomaly Score</div>
                <div className="font-bold text-pink-400">
                  {typeof telemetry.anomalyScore === 'number' ? telemetry.anomalyScore.toFixed(3) : '0.000'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payload Snippet */}
        {event.payloadSnippet && (
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Sanitized Inbound Payload Snippet
            </h4>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap">
              {event.payloadSnippet}
            </pre>
          </div>
        )}

        {/* Analyst Triage Section */}
        <div className="border-t border-slate-800 pt-5 mt-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center space-x-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>SOC Analyst Triage & Incident Notes</span>
          </h4>

          {saveError && (
            <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
              {saveError}
            </div>
          )}

          {saveSuccess && (
            <div className="mb-3 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center space-x-1.5 font-semibold">
              <Check className="w-4 h-4" />
              <span>Triage status and notes updated successfully!</span>
            </div>
          )}

          <div className="space-y-3">
            <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-semibold text-slate-300 select-none">
              <input
                type="checkbox"
                checked={resolved}
                onChange={(e) => setResolved(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
              />
              <span>Mark Incident as Resolved / Triaged</span>
            </label>

            <textarea
              rows={3}
              placeholder="Add incident investigation findings, mitigation notes, or IP blocklist rationale..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />

            <button
              onClick={handleSaveTriage}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Triage Update'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
