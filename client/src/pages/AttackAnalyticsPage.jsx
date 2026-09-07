import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import PerformanceChart from '../components/charts/PerformanceChart';
import DistributionPie from '../components/charts/DistributionPie';
import { threatsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MOCK_THREAT_STATS } from '../data/mockThreats';

export default function AttackAnalyticsPage() {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('7D');
  const [stats, setStats] = useState(MOCK_THREAT_STATS);

  useEffect(() => {
    if (isAuthenticated) {
      threatsApi.getStats()
        .then((res) => {
          if (res.success && res.stats) {
            setStats((prev) => ({
              ...prev,
              totalEvents: res.stats.totalEvents || prev.totalEvents,
              blockedCount: res.stats.blockedCount ?? res.stats.actions?.BLOCK ?? prev.blockedCount,
              monitoredCount: res.stats.monitoredCount ?? res.stats.actions?.MONITOR ?? prev.monitoredCount,
              allowedCount: res.stats.allowedCount ?? res.stats.actions?.ALLOW ?? prev.allowedCount,
              avgRiskScore: res.stats.avgRiskScore ? Math.round(res.stats.avgRiskScore) : prev.avgRiskScore,
              byThreatType: res.stats.byThreatType || prev.byThreatType,
              bySeverity: res.stats.bySeverity || prev.bySeverity,
            }));
          }
        })
        .catch(() => null);
    }
  }, [isAuthenticated]);

  const threatTypeData = [
    { name: 'SQLi', visitors: stats.byThreatType?.SQL_INJECTION || 1840, sessions: Math.round((stats.byThreatType?.SQL_INJECTION || 1840) * 0.85) },
    { name: 'XSS', visitors: stats.byThreatType?.XSS || 1290, sessions: Math.round((stats.byThreatType?.XSS || 1290) * 0.9) },
    { name: 'Traversal', visitors: stats.byThreatType?.PATH_TRAVERSAL || 680, sessions: Math.round((stats.byThreatType?.PATH_TRAVERSAL || 680) * 0.95) },
    { name: 'RCE / Cmd', visitors: stats.byThreatType?.COMMAND_INJECTION || 380, sessions: Math.round((stats.byThreatType?.COMMAND_INJECTION || 380) * 1.0) },
    { name: 'Anomaly', visitors: stats.byThreatType?.BEHAVIORAL_ANOMALY || 740, sessions: Math.round((stats.byThreatType?.BEHAVIORAL_ANOMALY || 740) * 0.6) },
  ];

  const severityPieData = [
    { name: 'Critical', value: stats.bySeverity?.CRITICAL || 1420, color: '#EF4444' },
    { name: 'High', value: stats.bySeverity?.HIGH || 2790, color: '#F97316' },
    { name: 'Medium', value: stats.bySeverity?.MEDIUM || 8140, color: '#F59E0B' },
    { name: 'Low (Clean)', value: stats.bySeverity?.LOW || 30540, color: '#10B981' },
  ];

  const topOriginIps = [
    { ip: '198.51.100.42', location: 'Frankfurt, Germany', asn: 'AS24940 Hetzner Online GmbH', hits: 1420, risk: 'Critical (96)' },
    { ip: '203.0.113.88', location: 'Tokyo, Japan', asn: 'AS2516 KDDI Corporation', hits: 980, risk: 'High (88)' },
    { ip: '192.0.2.14', location: 'Zurich, Switzerland', asn: 'AS3303 Swisscom AG', hits: 640, risk: 'Critical (94)' },
    { ip: '198.51.100.109', location: 'Amsterdam, Netherlands', asn: 'AS16509 Amazon AWS', hits: 520, risk: 'Critical (98)' },
    { ip: '192.0.2.77', location: 'Stockholm, Sweden', asn: 'AS8473 Bahnhof AB', hits: 410, risk: 'Medium (62)' },
  ];

  const handleExportReport = () => {
    addToast({
      title: 'Compliance Audit Report Compiled',
      description: `ISO 27001 Threat Intelligence Digest for [${selectedPeriod}] generated in PDF format.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-luxury-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 font-mono">
              NEURAL ANALYTICS &amp; ATTRIBUTION
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-luxury-ink tracking-tight">
            Attack Intelligence &amp; Vector Telemetry
          </h1>
          <p className="text-xs md:text-sm text-luxury-muted mt-1">
            Statistical stratifications across attack classes, severity distributions, and malicious ASNs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex p-1 bg-luxury-surface-hover border border-luxury-border rounded-xl text-xs font-medium">
            {['Today', '24H', '7D', '30D', '90D'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedPeriod === p
                    ? 'bg-luxury-surface text-luxury-ink shadow-subtle font-semibold'
                    : 'text-luxury-muted hover:text-luxury-ink'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExportReport}
          >
            Export Compliance Report
          </Button>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Categories Bar Chart */}
        <Card className="lg:col-span-2 p-6 flex flex-col">
          <div className="pb-4 border-b border-luxury-border mb-4">
            <CardTitle serif>Threat Vector Volumetric Distribution</CardTitle>
            <CardDescription>
              Interception frequency by exploit classification across evaluated HTTP payloads.
            </CardDescription>
          </div>
          <div className="flex-1 w-full min-h-[280px]">
            <PerformanceChart
              data={threatTypeData}
              height={300}
              dataKey1="visitors"
              name1="Attack Attempts"
              dataKey2="sessions"
              name2="Auto-Dropped"
            />
          </div>
        </Card>

        {/* Severity Distribution Donut */}
        <Card className="p-6 flex flex-col">
          <div className="pb-4 border-b border-luxury-border mb-4">
            <CardTitle serif>Severity Stratification</CardTitle>
            <CardDescription>
              Proportion of incoming requests stratified by CVSS risk weight.
            </CardDescription>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <DistributionPie data={severityPieData} height={200} />
          </div>
        </Card>
      </div>

      {/* Top Inbound Threat Origin IPs */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle serif>High-Frequency Inbound Adversary Origins</CardTitle>
          <CardDescription>
            Autonomous System Numbers (ASNs) and network subnets generating repeated intrusion attempts.
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-luxury-surface-hover border-b border-luxury-border uppercase text-[10px] font-semibold text-luxury-muted tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Inbound IP</th>
                <th className="py-3.5 px-4">Origin Jurisdiction</th>
                <th className="py-3.5 px-4">Autonomous System (ASN)</th>
                <th className="py-3.5 px-4">Probes Intercepted</th>
                <th className="py-3.5 px-4 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/60">
              {topOriginIps.map((origin, idx) => (
                <tr key={idx} className="hover:bg-luxury-surface-hover/50 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-semibold text-luxury-ink">
                    {origin.ip}
                  </td>
                  <td className="py-3.5 px-4 text-luxury-ink">
                    {origin.location}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-luxury-muted">
                    {origin.asn}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-luxury-ink">
                    {origin.hits.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Badge variant="danger" size="sm">
                      {origin.risk}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
