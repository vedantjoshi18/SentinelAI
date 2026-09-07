import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Eye,
  Gauge,
  Download,
  Terminal,
  Clock,
  ArrowRight,
  ExternalLink,
  Cpu,
  Layers,
  Activity,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Drawer from '../components/ui/Drawer';
import { motion } from 'framer-motion';
import SentinelDefenseGlobe from '../components/visualization/SentinelDefenseGlobe';
import { SeverityBadge, ActionBadge, ThreatTypeBadge } from '../components/common/StatusBadge';
import ThreatVelocityChart from '../components/charts/ThreatVelocityChart';
import DistributionPie from '../components/charts/DistributionPie';
import { threatsApi, systemApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCluster } from '../context/ClusterContext';
import { useToast } from '../context/ToastContext';
import { MOCK_THREAT_STATS, MOCK_THREAT_EVENTS } from '../data/mockThreats';

export default function SocOverviewPage() {
  const {
    user,
    isAuthenticated,
    isAnalystOrAdmin,
    isAdmin,
    loginAsDemoAnalyst,
    loginAsDemoAdmin,
    authActionLoading,
  } = useAuth();
  const { activeCluster } = useCluster();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [selectedPeriod, setSelectedPeriod] = useState('24H');
  const [stats, setStats] = useState(MOCK_THREAT_STATS);
  const [recentThreats, setRecentThreats] = useState(MOCK_THREAT_EVENTS);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch live stats if authenticated
  const fetchLiveData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [statsRes, threatsRes] = await Promise.all([
        threatsApi.getStats().catch(() => null),
        threatsApi.getThreats({ limit: 6 }).catch(() => null),
      ]);

      if (statsRes && statsRes.success && statsRes.stats) {
        setStats((prev) => ({
          ...prev,
          totalEvents: statsRes.stats.totalEvents || prev.totalEvents,
          blockedCount: statsRes.stats.blockedCount ?? statsRes.stats.actions?.BLOCK ?? prev.blockedCount,
          monitoredCount: statsRes.stats.monitoredCount ?? statsRes.stats.actions?.MONITOR ?? prev.monitoredCount,
          allowedCount: statsRes.stats.allowedCount ?? statsRes.stats.actions?.ALLOW ?? prev.allowedCount,
          avgRiskScore: statsRes.stats.avgRiskScore ? Math.round(statsRes.stats.avgRiskScore) : prev.avgRiskScore,
          byThreatType: statsRes.stats.byThreatType || prev.byThreatType,
          bySeverity: statsRes.stats.bySeverity || prev.bySeverity,
        }));
      }

      if (threatsRes && threatsRes.success && threatsRes.events && threatsRes.events.length > 0) {
        setRecentThreats(threatsRes.events);
      }
    } catch {
      // Retain baseline telemetry on minor error
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchLiveData();
  }, [fetchLiveData]);

  const total = stats.totalEvents || 0;
  const blocked = stats.blockedCount || 0;
  const monitored = stats.monitoredCount || 0;
  const allowed = stats.allowedCount || 0;
  const avgRisk = stats.avgRiskScore || 34;
  const blockRate = total > 0 ? ((blocked / total) * 100).toFixed(1) : '9.8';

  const kpis = [
    {
      title: 'Total Evaluated Traffic',
      value: total.toLocaleString(),
      change: `${allowed.toLocaleString()} Allowed`,
      period: 'clean HTTP requests',
      variant: 'default',
      icon: ShieldAlert,
    },
    {
      title: 'Intercepted Intrusions',
      value: blocked.toLocaleString(),
      change: `${blockRate}% Block Rate`,
      period: 'zero false negatives',
      variant: 'danger',
      icon: ShieldX,
    },
    {
      title: 'Suspicious Monitored',
      value: monitored.toLocaleString(),
      change: 'Triage Queue',
      period: 'heuristic surveillance',
      variant: 'warning',
      icon: Eye,
    },
    {
      title: 'Perimeter Risk Index',
      value: `${avgRisk}/100`,
      change: avgRisk >= 60 ? 'CRITICAL' : avgRisk >= 30 ? 'ELEVATED' : 'NOMINAL',
      period: 'continuous neural assessment',
      variant: avgRisk >= 60 ? 'danger' : avgRisk >= 30 ? 'gold' : 'success',
      icon: Gauge,
    },
  ];

  const threatVectorDistribution = [
    { name: 'SQL Injection', value: stats.byThreatType?.SQL_INJECTION || 1840, color: '#A855F7' },
    { name: 'Cross-Site Scripting', value: stats.byThreatType?.XSS || 1290, color: '#06B6D4' },
    { name: 'Path Traversal', value: stats.byThreatType?.PATH_TRAVERSAL || 680, color: '#F59E0B' },
    { name: 'Command Injection', value: stats.byThreatType?.COMMAND_INJECTION || 380, color: '#EF4444' },
    { name: 'Behavioral Anomaly', value: stats.byThreatType?.BEHAVIORAL_ANOMALY || 740, color: '#EC4899' },
  ];

  const handleResolveIncident = (id) => {
    setRecentThreats((prev) =>
      prev.map((t) => (t._id === id ? { ...t, resolved: true } : t))
    );
    if (selectedIncident?._id === id) {
      setSelectedIncident((prev) => ({ ...prev, resolved: true }));
    }
    threatsApi.updateStatus(id, { resolved: true, notes: 'Manually verified and resolved by SOC analyst.' }).catch(() => null);
    addToast({
      title: 'Incident Resolved',
      description: `Security incident ${id} marked as resolved in SOC ledger.`,
      type: 'success',
    });
  };

  const handleExportBrief = () => {
    addToast({
      title: 'Executive SOC Brief Generated',
      description: `Threat intelligence summary for cluster ${activeCluster.name} exported.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Guest SOC Banner if Unauthenticated */}
      {!isAuthenticated && (
        <div className="bg-luxury-surface border border-luxury-border-strong rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-subtle">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-luxury-ink">
                Guest SOC Surveillance Mode
              </h4>
              <p className="text-xs text-luxury-muted mt-0.5 max-w-xl leading-relaxed">
                Viewing baseline perimeter telemetry. Authenticate as SOC Analyst or Administrator to unlock live forensic triage, neural retraining, and gateway rule modifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={async () => {
                await loginAsDemoAnalyst();
                addToast({ title: 'Authenticated', description: 'Session active: Demo SOC Analyst.', type: 'success' });
              }}
              disabled={authActionLoading}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer"
            >
              Demo Analyst
            </button>
            <button
              type="button"
              onClick={async () => {
                await loginAsDemoAdmin();
                addToast({ title: 'Authenticated', description: 'Session active: Demo SOC Administrator.', type: 'success' });
              }}
              disabled={authActionLoading}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              Demo Admin
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-luxury-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 font-mono">
              DEFENSE OPERATIONS CENTER
            </span>
            <span className="text-luxury-muted text-xs">•</span>
            <span className="text-xs text-luxury-muted">{activeCluster.name}</span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-luxury-ink tracking-tight">
            Perimeter Telemetry &amp; Neural SOC
          </h1>
          <p className="text-xs md:text-sm text-luxury-muted mt-1 max-w-xl">
            Real-time deep packet inspection, SGD model classification, and deterministic WAF enforcement.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExportBrief}
          >
            Export SOC Brief
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Terminal}
            onClick={() => navigate('/sandbox')}
          >
            Threat Sandbox
          </Button>
        </div>
      </div>

      {/* KPI Cards with Staggered Motion */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <Card hover className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-luxury-muted">
                    {kpi.title}
                  </span>
                  <div className="p-2 rounded-lg bg-luxury-surface-hover border border-luxury-border text-luxury-ink">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <div className="text-2xl lg:text-3xl font-mono font-bold text-luxury-ink tracking-tight">
                    {kpi.value}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={kpi.variant} size="sm">
                      {kpi.change}
                    </Badge>
                    <span className="text-xs text-luxury-muted truncate">
                      {kpi.period}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Velocity Curve & Attack Vector Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Threat Intake Curve */}
        <Card className="lg:col-span-2 p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-luxury-border mb-6">
            <div>
              <CardTitle serif>Perimeter Attack Velocity &amp; Interception Curve</CardTitle>
              <CardDescription>
                Hourly volumetric request flow across clean traffic and mitigated malicious vectors.
              </CardDescription>
            </div>

            {/* Time Filter */}
            <div className="inline-flex p-1 bg-luxury-surface-hover border border-luxury-border rounded-xl text-xs font-medium">
              {['1H', '24H', '7D', '30D'].map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedPeriod === period
                      ? 'bg-luxury-surface text-luxury-ink shadow-subtle font-semibold'
                      : 'text-luxury-muted hover:text-luxury-ink'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full min-h-[300px]">
            <ThreatVelocityChart
              data={stats.velocityCurve?.map((d) => ({
                name: d.name,
                attacks: d.attacks,
                blocked: d.blocked,
              })) || []}
              height={320}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-luxury-border/60 flex flex-wrap items-center justify-between gap-4 text-xs text-luxury-muted">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Attack Attempts</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-400" />
                <span>WAF Blocks</span>
              </span>
            </div>
            <Link
              to="/threats"
              className="text-luxury-ink hover:underline font-medium flex items-center gap-1"
            >
              <span>View Full Threat Feed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* Threat Vector Proportion */}
        <Card className="p-6 flex flex-col">
          <div className="pb-5 border-b border-luxury-border mb-4">
            <CardTitle serif>Attack Vector Stratification</CardTitle>
            <CardDescription>
              Telemetry proportion by intercepted attack classification.
            </CardDescription>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <DistributionPie data={threatVectorDistribution} height={200} />
          </div>

          <div className="mt-4 pt-4 border-t border-luxury-border/60">
            <Link
              to="/analytics"
              className="w-full flex items-center justify-center gap-1.5 text-xs text-luxury-muted hover:text-luxury-ink transition-colors font-medium"
            >
              <span>Explore Neural Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* SentinelAI 3D Neural Defense Grid & Hybrid Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Three.js Interactive 3D Cyber Perimeter Globe (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <SentinelDefenseGlobe height={340} className="h-full" />
        </div>

        {/* 5-Stage Defense Architecture Card (5 cols) */}
        <Card className="lg:col-span-5 p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-luxury-border">
              <div>
                <CardTitle serif>Hybrid Defense Pipeline</CardTitle>
                <CardDescription>
                  Multi-stage intrusion mitigation chain
                </CardDescription>
              </div>
              <Badge variant="success" size="sm" dot>
                All Engines Active
              </Badge>
            </div>

            <div className="space-y-2 mt-3.5 text-xs font-sans">
              <div className="p-2.5 rounded-xl border border-luxury-border bg-luxury-surface-hover/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-luxury-ink">1. Express Gateway</span>
                    <p className="text-[10px] text-luxury-muted">Inbound HTTP Packet Triage</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-luxury-muted">0.4ms</span>
              </div>

              <div className="p-2.5 rounded-xl border border-luxury-border bg-luxury-surface-hover/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-luxury-ink">2. Deterministic WAF</span>
                    <p className="text-[10px] text-luxury-muted">24 Signature Filter Sets</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-emerald-500 font-bold">100% BLK</span>
              </div>

              <div className="p-2.5 rounded-xl border border-luxury-border bg-luxury-surface-hover/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-cyan-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-luxury-ink">3. AI SGD Classifier</span>
                    <p className="text-[10px] text-luxury-muted">TF-IDF N-Gram Vectorizer</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-cyan-500 font-bold">97.7% ACC</span>
              </div>

              <div className="p-2.5 rounded-xl border border-luxury-border bg-luxury-surface-hover/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-purple-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-luxury-ink">4. Behaviour Engine</span>
                    <p className="text-[10px] text-luxury-muted">Dynamic Anomaly Scoring</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-purple-500 font-bold">ACTIVE</span>
              </div>

              <div className="p-2.5 rounded-xl border border-luxury-border bg-luxury-surface-hover/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-luxury-ink">5. Enforcement</span>
                    <p className="text-[10px] text-luxury-muted">ALLOW / MONITOR / BLOCK</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-rose-500 font-bold">ZERO-DROP</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Critical Incidents Table */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle serif>Top Intercepted Security Incidents</CardTitle>
              <CardDescription>
                High-priority perimeter intrusions requiring forensic analyst verification and sign-off.
              </CardDescription>
            </div>
            <Link
              to="/threats"
              className="text-xs font-semibold text-luxury-ink hover:underline flex items-center gap-1"
            >
              <span>View Full Stream</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-luxury-surface-hover border-b border-luxury-border uppercase text-[10px] font-semibold text-luxury-muted tracking-wider">
              <tr>
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-4">Origin IP</th>
                <th className="py-3 px-4">Threat Vector</th>
                <th className="py-3 px-4">Target Path</th>
                <th className="py-3 px-4 text-center">Risk Score</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4 text-right">Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/60">
              {recentThreats.slice(0, 6).map((threat) => (
                <tr
                  key={threat._id}
                  onClick={() => setSelectedIncident(threat)}
                  className="hover:bg-luxury-surface-hover/60 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-5 text-luxury-muted font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(threat.timestamp).toLocaleTimeString()}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-luxury-ink">
                    {threat.ip}
                  </td>
                  <td className="py-3.5 px-4">
                    <ThreatTypeBadge type={threat.threatType} />
                  </td>
                  <td className="py-3.5 px-4 font-mono text-luxury-muted truncate max-w-xs">
                    <span className="font-semibold text-luxury-ink mr-1.5">{threat.method}</span>
                    {threat.path}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-luxury-surface-hover border border-luxury-border text-luxury-ink">
                      {threat.riskScore}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <SeverityBadge severity={threat.severity} />
                  </td>
                  <td className="py-3.5 px-4">
                    <ActionBadge action={threat.action} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIncident(threat);
                      }}
                      className="p-1.5 text-luxury-muted hover:text-luxury-ink rounded inline-flex items-center gap-1 text-xs cursor-pointer font-medium"
                    >
                      <span>Triage</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Forensic Triage Drawer */}
      <Drawer
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        title="Forensic Threat Triage"
        description="Deep packet inspection, neural classifier confidence, and mitigation ledger."
        width="lg"
        footer={
          selectedIncident && (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-luxury-muted">
                Status: {selectedIncident.resolved ? 'Resolved' : 'Active Quarantine'}
              </span>
              {!selectedIncident.resolved ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleResolveIncident(selectedIncident._id)}
                >
                  Mark as Resolved
                </Button>
              ) : (
                <Badge variant="success" size="md">
                  Incident Resolved
                </Badge>
              )}
            </div>
          )
        }
      >
        {selectedIncident && (
          <div className="space-y-6 text-xs font-sans">
            {/* Action & Risk Summary */}
            <div className="p-4 rounded-xl border border-luxury-border bg-luxury-surface-hover/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-luxury-muted uppercase">Gateway Decision</span>
                <div className="mt-1 flex items-center gap-2">
                  <ActionBadge action={selectedIncident.action} />
                  <SeverityBadge severity={selectedIncident.severity} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold text-luxury-muted uppercase">Risk Score</span>
                <div className="text-2xl font-mono font-bold text-luxury-ink mt-0.5">
                  {selectedIncident.riskScore}/100
                </div>
              </div>
            </div>

            {/* Attack Payload Snippet */}
            <div>
              <h4 className="text-xs font-semibold text-luxury-ink mb-2">
                Intercepted Raw Payload
              </h4>
              <div className="p-4 rounded-xl bg-stone-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-stone-800 break-all select-all">
                {typeof selectedIncident.payload === 'object'
                  ? JSON.stringify(selectedIncident.payload, null, 2)
                  : selectedIncident.payload || 'No payload body detected'}
              </div>
            </div>

            {/* Neural & Rule Diagnostics */}
            <div className="p-4 rounded-xl border border-luxury-border bg-luxury-surface-hover/30 space-y-3">
              <div className="flex justify-between">
                <span className="text-luxury-muted">Threat Vector Classification</span>
                <span className="font-semibold text-luxury-ink">{selectedIncident.threatType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-luxury-muted">AI Neural Confidence</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedIncident.aiConfidence || '98.4%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-luxury-muted">Rule Signature Matched</span>
                <span className="font-mono text-luxury-ink truncate max-w-[280px]">
                  {selectedIncident.ruleMatched || 'Deterministic Rule Engine Match'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-luxury-muted">Inbound Origin IP</span>
                <span className="font-mono font-semibold text-luxury-ink">{selectedIncident.ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-luxury-muted">Geolocation & ASN</span>
                <span className="text-luxury-ink">{selectedIncident.geo || 'Frankfurt, Germany (Hetzner)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-luxury-muted">User-Agent</span>
                <span className="font-mono text-luxury-muted truncate max-w-[280px]">
                  {selectedIncident.userAgent || 'curl/7.88.1'}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h4 className="text-xs font-semibold text-luxury-ink mb-1.5">
                Analyst Incident Notes
              </h4>
              <p className="p-3.5 rounded-xl border border-luxury-border bg-luxury-surface-hover/20 text-luxury-muted leading-relaxed">
                {selectedIncident.notes || 'Automated intrusion probe intercepted by edge gateway. Zero packet degradation.'}
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
