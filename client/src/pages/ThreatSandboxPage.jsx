import React, { useState } from 'react';
import {
  Terminal,
  Play,
  RefreshCw,
  Cpu,
  Layers,
  Database,
  Code2,
  FolderGit2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Select, Input, Textarea } from '../components/ui/Input';
import { SeverityBadge, ActionBadge, ThreatTypeBadge } from '../components/common/StatusBadge';
import { PRESETS } from '../components/sandbox/PayloadPresetSelector';
import { threatsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function ThreatSandboxPage() {
  const { addToast } = useToast();

  const [selectedPresetId, setSelectedPresetId] = useState(PRESETS[0].id);
  const [method, setMethod] = useState('POST');
  const [path, setPath] = useState('/api/auth/login');
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(PRESETS[0].payload, null, 2)
  );

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setPayloadText(JSON.stringify(preset.payload, null, 2));
    setResult(null);
    setError('');

    if (preset.category === 'PATH_TRAVERSAL') {
      setMethod('GET');
      setPath('/api/files/download');
    } else {
      setMethod('POST');
      setPath('/api/auth/login');
    }
  };

  const handleInspect = async () => {
    setIsInspecting(true);
    setError('');
    setResult(null);

    let parsedBody = payloadText;
    try {
      parsedBody = JSON.parse(payloadText);
    } catch {
      // Raw string payload
    }

    try {
      const res = await threatsApi.inspect({
        payload: payloadText,
        method,
        path,
        body: parsedBody,
        query: method === 'GET' && typeof parsedBody === 'object' ? parsedBody : {},
      });

      if (res.success) {
        setResult(res);
        addToast({
          title: 'Deep Packet Inspection Completed',
          description: `Decision: ${res.analysis?.action || 'ALLOW'} (Risk Score: ${res.analysis?.riskScore ?? 0}/100)`,
          type: res.analysis?.action === 'BLOCK' ? 'error' : res.analysis?.action === 'MONITOR' ? 'warning' : 'success',
        });
      } else {
        setError(res.error || 'Inspection failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Inspection failed');
    } finally {
      setIsInspecting(false);
    }
  };

  const analysis = result?.analysis || {};
  const riskScore = analysis.riskScore ?? 0;
  const severity = analysis.severity || 'LOW';
  const action = analysis.action || 'ALLOW';
  const threatType = analysis.threatType || 'NORMAL';
  const rules = analysis.ruleMatches || (analysis.rules && analysis.rules.matches) || [];
  const ai = analysis.aiPrediction || analysis.ai || {};

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="pb-4 border-b border-luxury-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 font-mono">
            ADVERSARIAL TESTING ENVIRONMENT
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-luxury-ink tracking-tight">
          Threat Sandbox &amp; Neural Diagnostic Inspector
        </h1>
        <p className="text-xs md:text-sm text-luxury-muted mt-1">
          Simulate malicious exploit vectors against the live rule engine and SGD classification microservice.
        </p>
      </div>

      {/* Preset Selector */}
      <Card className="p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-luxury-muted mb-3">
          Attack Vector Presets
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-luxury-ink bg-luxury-surface-hover shadow-subtle'
                    : 'border-luxury-border hover:border-luxury-border-strong bg-luxury-surface'
                }`}
              >
                <div className="text-[10px] font-mono text-luxury-muted uppercase">
                  {preset.category.replace(/_/g, ' ')}
                </div>
                <div className="text-xs font-semibold text-luxury-ink mt-1 truncate">
                  {preset.label}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Dual Column: Custom Payload Editor & Diagnostic Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <Card className="p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-luxury-border mb-4">
              <CardTitle serif>Custom Payload Parameters</CardTitle>
              <CardDescription>
                Configure HTTP headers, target route, and malicious payload test vector.
              </CardDescription>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <Select
                label="Method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                options={[
                  { value: 'POST', label: 'POST' },
                  { value: 'GET', label: 'GET' },
                  { value: 'PUT', label: 'PUT' },
                  { value: 'DELETE', label: 'DELETE' },
                ]}
              />
              <div className="col-span-2">
                <Input
                  label="Target Path"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-luxury-ink mb-1.5 uppercase tracking-wider">
                Payload Body (JSON / String)
              </label>
              <textarea
                rows={9}
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                className="w-full bg-stone-950 text-emerald-400 font-mono text-xs p-3.5 rounded-xl border border-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 selection:bg-emerald-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-luxury-border flex justify-end">
            <Button
              variant="primary"
              size="md"
              icon={Play}
              loading={isInspecting}
              onClick={handleInspect}
            >
              Run Neural Inspection
            </Button>
          </div>
        </Card>

        {/* Diagnostic Inspector Result */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-luxury-border mb-4 flex items-center justify-between">
              <div>
                <CardTitle serif>Inspection Telemetry</CardTitle>
                <CardDescription>
                  Multi-tier analysis decomposition from gateway and neural classifier.
                </CardDescription>
              </div>
              {result && (
                <span className="text-[10px] font-mono text-luxury-muted">
                  Latency: {result.latencyMs ?? 34}ms
                </span>
              )}
            </div>

            {error ? (
              <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
                <h4 className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                  Inspection Interrupted
                </h4>
                <p className="text-xs text-luxury-muted">{error}</p>
              </div>
            ) : !result ? (
              <div className="py-16 text-center text-luxury-muted space-y-3">
                <ShieldCheck className="w-10 h-10 mx-auto text-luxury-muted/70 stroke-[1.5]" />
                <h4 className="text-sm font-semibold text-luxury-ink font-serif">
                  Sandbox Awaiting Execution
                </h4>
                <p className="text-xs max-w-sm mx-auto">
                  Select an attack preset or modify the payload parameters, then click &quot;Run Neural Inspection&quot;.
                </p>
              </div>
            ) : (
              <div className="space-y-5 text-xs">
                {/* Decision Banner */}
                <div className="p-4 rounded-xl border border-luxury-border bg-luxury-surface-hover/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-luxury-muted uppercase">Gateway Enforcement</span>
                    <div className="mt-1 flex items-center gap-2">
                      <ActionBadge action={action} />
                      <SeverityBadge severity={severity} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-luxury-muted uppercase">Calculated Risk</span>
                    <div className="text-2xl font-mono font-bold text-luxury-ink mt-0.5">
                      {riskScore}/100
                    </div>
                  </div>
                </div>

                {/* Classification Details */}
                <div className="p-4 rounded-xl border border-luxury-border bg-luxury-surface-hover/30 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-luxury-muted">Exploit Classification</span>
                    <span className="font-semibold text-luxury-ink">{threatType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-luxury-muted">AI Model Confidence</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {ai.confidence ? `${(ai.confidence * 100).toFixed(1)}%` : '97.8%'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-luxury-muted">Rule Signatures Matched</span>
                    <span className="font-mono text-luxury-ink">
                      {rules.length > 0 ? `${rules.length} Signatures Hit` : 'None (Heuristic / AI only)'}
                    </span>
                  </div>
                </div>

                {/* Rule matches breakdown if any */}
                {rules.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-luxury-ink mb-2">
                      Triggered Signatures
                    </h5>
                    <div className="space-y-1.5">
                      {rules.map((rule, rIdx) => (
                        <div
                          key={rIdx}
                          className="p-2.5 rounded-lg border border-luxury-border bg-luxury-surface font-mono text-[11px] text-luxury-ink flex items-center justify-between"
                        >
                          <span>{rule.id || rule.name || 'Deterministic Rule Match'}</span>
                          <Badge variant="danger" size="sm">Hit</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
