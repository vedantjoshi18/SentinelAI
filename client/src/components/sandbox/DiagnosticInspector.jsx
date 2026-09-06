import React from 'react';
import { SeverityBadge, ActionBadge, ThreatTypeBadge } from '../common/StatusBadge';
import { ShieldAlert, Cpu, Layers, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function DiagnosticInspector({ result, error }) {
  if (error) {
    return (
      <div className="bg-[#111827] border border-rose-500/30 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400 mb-3 border border-rose-500/20">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h4 className="text-white font-bold text-sm mb-1">Inspection Failed</h4>
        <p className="text-xs text-rose-400 max-w-sm">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center h-full min-h-[300px]">
        <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400 mb-3 border border-cyan-500/20">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h4 className="text-white font-bold text-sm mb-1">Sandbox Ready for Inspection</h4>
        <p className="text-xs text-slate-400 max-w-xs">
          Select an attack preset or enter a custom payload to trigger deep packet security inspection.
        </p>
      </div>
    );
  }

  const analysis = result.analysis || {};
  const riskScore = analysis.riskScore ?? 0;
  const severity = analysis.severity || 'LOW';
  const action = analysis.action || 'ALLOW';
  const threatType = analysis.threatType || 'NORMAL';
  const rules = analysis.ruleMatches || (analysis.rules && analysis.rules.matches) || [];
  const factors = analysis.factors || [];
  const breakdown = analysis.breakdown || {};
  const ai = analysis.aiPrediction || analysis.ai || {};

  const scoreColor =
    riskScore >= 80
      ? 'text-rose-400 border-rose-500/40 bg-rose-500/10'
      : riskScore >= 60
      ? 'text-orange-400 border-orange-500/40 bg-orange-500/10'
      : riskScore >= 30
      ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
      : 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Top Banner: Score & Action */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Engine Decision
          </div>
          <div className="flex items-center space-x-2">
            <ActionBadge action={action} />
            <SeverityBadge severity={severity} />
            <ThreatTypeBadge type={threatType} />
          </div>
        </div>

        {/* Big Score Gauge */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Calculated Risk</div>
            <div className="text-xs font-semibold text-slate-300">
              {riskScore >= 60 ? 'Active Intrusion' : riskScore >= 30 ? 'Suspicious' : 'Clean Input'}
            </div>
          </div>
          <div
            className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-mono font-black text-2xl shadow-lg ${scoreColor}`}
          >
            {riskScore}
          </div>
        </div>
      </div>

      {/* Multi-Signal Breakdown Cards */}
      <div className="space-y-4 text-xs">
        {/* Deterministic Rule Engine */}
        <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="flex items-center space-x-2 font-bold text-slate-200 mb-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Deterministic Rule Matches</span>
            <span className="font-mono text-slate-500 font-normal">({rules.length})</span>
          </div>
          {rules.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {rules.map((rule, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[11px] font-semibold"
                >
                  {rule}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 font-mono text-[11px]">No signature rules triggered.</p>
          )}
        </div>

        {/* AI Attack Classifier */}
        <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded-xl">
          <div className="flex items-center space-x-2 font-bold text-slate-200 mb-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>AI Attack Classifier</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
            <div>
              <span className="text-slate-500">Predicted Threat:</span>{' '}
              <span className="font-bold text-cyan-400">{ai.threatType || 'NORMAL'}</span>
            </div>
            <div>
              <span className="text-slate-500">Confidence:</span>{' '}
              <span className="font-bold text-white">
                {typeof ai.confidence === 'number' ? `${(ai.confidence * 100).toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            <div className="col-span-2 text-slate-500 text-[10px]">
              Model: {ai.modelVersion || 'attack-classifier-v1'}
            </div>
          </div>
        </div>

        {/* Triggered Floors & Signal Breakdown */}
        {factors.length > 0 && (
          <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <div className="flex items-center space-x-1.5 font-bold text-amber-400 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Defensive Floors Triggered</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {factors.map((f, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px]"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Weights & Sub-scores */}
        <div className="p-3.5 bg-slate-900/40 border border-slate-800 rounded-xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Telemetry Sub-Score Breakdown (0–100)
          </div>
          <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-center">
            <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
              <div className="text-slate-500">AI Subscore</div>
              <div className="font-bold text-white text-xs">{breakdown.ai ?? 0}</div>
            </div>
            <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
              <div className="text-slate-500">Rule Subscore</div>
              <div className="font-bold text-white text-xs">{breakdown.rule ?? 0}</div>
            </div>
            <div className="p-1.5 bg-slate-900 rounded border border-slate-800">
              <div className="text-slate-500">Anomaly Subscore</div>
              <div className="font-bold text-white text-xs">{breakdown.anomaly ?? 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
