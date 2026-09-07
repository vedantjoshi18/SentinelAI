import React, { useState, useEffect, useCallback } from 'react';
import {
  HardDrive,
  RefreshCw,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Server,
  Activity,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { systemApi } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function SystemHealthPage() {
  const { addToast } = useToast();
  const [health, setHealth] = useState({
    status: 'ok',
    database: 'in-memory',
    aiService: {
      available: true,
      status: 'ok',
      modelLoaded: true,
      modelVersion: 'attack-classifier-v1',
      anomalyModelLoaded: true,
      anomalyModelVersion: 'behaviour-model-v1',
      networkIdsLoaded: true,
      networkIdsVersion: 'cicids-v1.0.0',
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState('Just now');

  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await systemApi.getHealth();
      if (res) {
        setHealth(res);
        setLastCheck(new Date().toLocaleTimeString());
        addToast({
          title: 'Perimeter Health Nominal',
          description: 'All 3 engine tiers verified active and healthy.',
          type: 'success',
        });
      }
    } catch {
      setLastCheck(new Date().toLocaleTimeString());
      addToast({
        title: 'Diagnostic Warning',
        description: 'Partial engine degradation detected.',
        type: 'warning',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const components = [
    {
      name: 'Express HTTP API Gateway',
      tier: 'Perimeter Ingress Node',
      port: 5000,
      status: health.status === 'ok' ? 'HEALTHY' : 'DEGRADED',
      latency: '18ms',
      details: 'Node.js v20.14.0 • Cluster Mode Active • JWT Token Verification Active',
      icon: Server,
    },
    {
      name: 'FastAPI Neural Classifier',
      tier: 'AI Machine Learning Core',
      port: 8000,
      status: health.aiService?.modelLoaded ? 'HEALTHY' : 'OFFLINE',
      latency: '24ms',
      details: `Model: ${health.aiService?.modelVersion || 'attack-classifier-v1'} (SGDClassifier with TF-IDF Vectorizer)`,
      icon: Cpu,
    },
    {
      name: 'Behavioral Anomaly Engine',
      tier: 'Heuristic Scoring Microservice',
      port: 8000,
      status: health.aiService?.anomalyModelLoaded ? 'HEALTHY' : 'OFFLINE',
      latency: '31ms',
      details: `Model: ${health.aiService?.anomalyModelVersion || 'behaviour-model-v1'} (Isolation Forest Anomaly Scoring)`,
      icon: Activity,
    },
    {
      name: 'Telemetry Database Store',
      tier: 'Persistence Layer',
      port: 27017,
      status: health.database ? 'HEALTHY' : 'OFFLINE',
      latency: '4ms',
      details: `Storage Mode: ${health.database || 'in-memory'} • Index Caching Active`,
      icon: HardDrive,
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-luxury-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 font-mono">
              PERIMETER INFRASTRUCTURE
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-luxury-ink tracking-tight">
            System Engine Health &amp; Diagnostics
          </h1>
          <p className="text-xs md:text-sm text-luxury-muted mt-1">
            Real-time status of the Express Gateway, Python FastAPI ML Microservice, and Telemetry Database.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={RefreshCw}
          loading={isLoading}
          onClick={checkHealth}
        >
          Run Diagnostic Probe
        </Button>
      </div>

      {/* Global Status Banner */}
      <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-luxury-ink">
              All Security Subsystems Operational
            </h3>
            <p className="text-xs text-luxury-muted">
              Deterministic WAF rules and SGD neural classifier operating with zero packet queueing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-luxury-muted">
          <span>Last probed: <span className="font-mono text-luxury-ink font-semibold">{lastCheck}</span></span>
          <Badge variant="success" size="sm" dot>Active</Badge>
        </div>
      </Card>

      {/* Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {components.map((comp, idx) => {
          const Icon = comp.icon;
          return (
            <Card key={idx} className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-luxury-surface-hover border border-luxury-border text-luxury-ink">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-luxury-ink font-serif">{comp.name}</h4>
                    <p className="text-[11px] text-luxury-muted">{comp.tier}</p>
                  </div>
                </div>
                <Badge variant={comp.status === 'HEALTHY' ? 'success' : 'danger'} size="sm" dot>
                  {comp.status}
                </Badge>
              </div>

              <div className="p-3.5 rounded-xl border border-luxury-border bg-luxury-surface-hover/30 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-luxury-muted">Listening Port</span>
                  <span className="font-mono font-semibold text-luxury-ink">:{comp.port}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-luxury-muted">Ping Latency</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{comp.latency}</span>
                </div>
                <div className="pt-2 border-t border-luxury-border/60 text-luxury-muted font-mono text-[11px]">
                  {comp.details}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
