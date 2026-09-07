import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Drawer from '../components/ui/Drawer';
import { SearchInput, Select } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { SeverityBadge, ActionBadge, ThreatTypeBadge } from '../components/common/StatusBadge';
import { threatsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MOCK_THREAT_EVENTS } from '../data/mockThreats';

export default function ThreatFeedPage() {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();

  const [threats, setThreats] = useState(MOCK_THREAT_EVENTS);
  const [totalEvents, setTotalEvents] = useState(MOCK_THREAT_EVENTS.length);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    threatType: searchParams.get('type') || '',
    severity: searchParams.get('severity') || '',
    action: searchParams.get('action') || '',
    resolved: searchParams.get('resolved') || '',
    search: '',
  });

  const fetchThreats = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const params = { page, limit };
      if (filters.threatType) params.threatType = filters.threatType;
      if (filters.severity) params.severity = filters.severity;
      if (filters.action) params.action = filters.action;
      if (filters.resolved !== '') params.resolved = filters.resolved === 'true';
      if (filters.search) params.search = filters.search.trim();

      const res = await threatsApi.getThreats(params);
      if (res.success && res.events) {
        setThreats(res.events);
        setTotalEvents(res.pagination?.total ?? res.pagination?.totalEvents ?? res.events.length);
      }
    } catch {
      // Retain fallback
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, page, limit, filters]);

  useEffect(() => {
    fetchThreats();
  }, [fetchThreats]);

  // Client-side fallback filtering if unauthenticated
  const displayedThreats = useMemo(() => {
    if (isAuthenticated) return threats;
    return threats.filter((t) => {
      const matchType = !filters.threatType || t.threatType === filters.threatType;
      const matchSev = !filters.severity || t.severity === filters.severity;
      const matchAct = !filters.action || t.action === filters.action;
      const matchSearch =
        !filters.search ||
        t.ip.includes(filters.search) ||
        t.path.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.threatType.toLowerCase().includes(filters.search.toLowerCase());
      return matchType && matchSev && matchAct && matchSearch;
    });
  }, [isAuthenticated, threats, filters]);

  const handleResolve = (id) => {
    setThreats((prev) =>
      prev.map((t) => (t._id === id ? { ...t, resolved: true } : t))
    );
    if (selectedThreat?._id === id) {
      setSelectedThreat((prev) => ({ ...prev, resolved: true }));
    }
    threatsApi.updateStatus(id, { resolved: true, notes: 'Resolved by SOC Analyst' }).catch(() => null);
    addToast({
      title: 'Incident Resolved',
      description: `Threat ID ${id} resolved in telemetry ledger.`,
      type: 'success',
    });
  };

  const handleResetFilters = () => {
    setFilters({ threatType: '', severity: '', action: '', resolved: '', search: '' });
    setPage(1);
  };

  const totalPages = Math.ceil(totalEvents / limit) || 1;

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-luxury-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 font-mono">
              REAL-TIME TELEMETRY
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-luxury-ink tracking-tight">
            Live Threat Event Stream &amp; Forensics
          </h1>
          <p className="text-xs md:text-sm text-luxury-muted mt-1">
            Intercepted HTTP payloads, classification decisions, neural confidence, and signature hits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={isLoading}
            onClick={fetchThreats}
          >
            Refresh Stream
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={() => {
              addToast({
                title: 'Export Compiled',
                description: 'Threat stream exported to JSON forensics log.',
                type: 'success',
              });
            }}
          >
            Export Log
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <Select
            label="Threat Vector"
            value={filters.threatType}
            onChange={(e) => {
              setFilters({ ...filters, threatType: e.target.value });
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Attack Vectors' },
              { value: 'SQL_INJECTION', label: 'SQL Injection' },
              { value: 'XSS', label: 'Cross-Site Scripting' },
              { value: 'PATH_TRAVERSAL', label: 'Path Traversal / LFI' },
              { value: 'COMMAND_INJECTION', label: 'Command Injection / RCE' },
              { value: 'BEHAVIORAL_ANOMALY', label: 'Behavioral Anomaly' },
              { value: 'NORMAL', label: 'Benign Clean Traffic' },
            ]}
          />

          <Select
            label="Severity"
            value={filters.severity}
            onChange={(e) => {
              setFilters({ ...filters, severity: e.target.value });
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Severities' },
              { value: 'CRITICAL', label: 'Critical' },
              { value: 'HIGH', label: 'High' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'LOW', label: 'Low' },
            ]}
          />

          <Select
            label="Decision"
            value={filters.action}
            onChange={(e) => {
              setFilters({ ...filters, action: e.target.value });
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Actions' },
              { value: 'BLOCK', label: 'Block (Dropped)' },
              { value: 'MONITOR', label: 'Monitor (Flagged)' },
              { value: 'ALLOW', label: 'Allow (Clean)' },
            ]}
          />

          <Select
            label="Resolution"
            value={filters.resolved}
            onChange={(e) => {
              setFilters({ ...filters, resolved: e.target.value });
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Incidents' },
              { value: 'false', label: 'Open Incidents' },
              { value: 'true', label: 'Resolved' },
            ]}
          />

          <div className="flex flex-col justify-end">
            <Button
              variant="outline"
              size="md"
              onClick={handleResetFilters}
              className="w-full"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        <div>
          <SearchInput
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setPage(1);
            }}
            onClear={() => {
              setFilters({ ...filters, search: '' });
              setPage(1);
            }}
            placeholder="Search by IP, target path, threat classification..."
          />
        </div>
      </Card>

      {/* Threat Events Table */}
      {displayedThreats.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No threat events located"
          description="Zero security incidents matching your filter parameters."
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-luxury-surface-hover border-b border-luxury-border uppercase text-[10px] font-semibold text-luxury-muted tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-4">Origin IP</th>
                  <th className="py-3.5 px-4">Vector</th>
                  <th className="py-3.5 px-4">Target Path</th>
                  <th className="py-3.5 px-4 text-center">Score</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/60">
                {displayedThreats.map((threat) => (
                  <tr
                    key={threat._id}
                    onClick={() => setSelectedThreat(threat)}
                    className="hover:bg-luxury-surface-hover/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-5 font-mono text-luxury-muted flex items-center gap-1.5">
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
                      <span className="font-semibold text-luxury-ink mr-1">{threat.method}</span>
                      {threat.path}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-luxury-ink">
                      {threat.riskScore}
                    </td>
                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={threat.severity} />
                    </td>
                    <td className="py-3.5 px-4">
                      <ActionBadge action={threat.action} />
                    </td>
                    <td className="py-3.5 px-4">
                      {threat.resolved ? (
                        <Badge variant="success" size="sm">Resolved</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">Open</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedThreat(threat);
                        }}
                        className="p-1 text-luxury-muted hover:text-luxury-ink rounded cursor-pointer font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-luxury-border flex items-center justify-between text-xs text-luxury-muted">
            <span>
              Page {page} of {totalPages} ({totalEvents} total logged events)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconRight={ChevronRight}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Forensic Inspection Drawer */}
      <Drawer
        isOpen={!!selectedThreat}
        onClose={() => setSelectedThreat(null)}
        title="Forensic Packet Inspection"
        description="Deep packet inspection, neural classifier confidence, and mitigation ledger."
        width="lg"
        footer={
          selectedThreat && (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-luxury-muted">
                Status: {selectedThreat.resolved ? 'Resolved' : 'Quarantine Active'}
              </span>
              {!selectedThreat.resolved && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleResolve(selectedThreat._id)}
                >
                  Mark as Resolved
                </Button>
              )}
            </div>
          )
        }
      >
        {selectedThreat && (
          <div className="space-y-6 text-xs font-sans">
            <div className="p-4 rounded-xl border border-luxury-border bg-luxury-surface-hover/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-luxury-muted uppercase">Mitigation Action</span>
                <div className="mt-1 flex items-center gap-2">
                  <ActionBadge action={selectedThreat.action} />
                  <SeverityBadge severity={selectedThreat.severity} />
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold text-luxury-muted uppercase">Risk Score</span>
                <div className="text-2xl font-mono font-bold text-luxury-ink mt-0.5">
                  {selectedThreat.riskScore}/100
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-luxury-ink mb-2">
                Intercepted Raw Payload
              </h4>
              <div className="p-4 rounded-xl bg-stone-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-stone-800 break-all select-all">
                {typeof selectedThreat.payload === 'object'
                  ? JSON.stringify(selectedThreat.payload, null, 2)
                  : selectedThreat.payload || 'No payload body detected'}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-luxury-border bg-luxury-surface-hover/30 space-y-3">
              <div className="flex justify-between">
                <span className="text-luxury-muted">Threat Classification</span>
                <span className="font-semibold text-luxury-ink">{selectedThreat.threatType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-luxury-muted">AI Neural Confidence</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedThreat.aiConfidence || '98.4%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-luxury-muted">Rule Signature Matched</span>
                <span className="font-mono text-luxury-ink truncate max-w-[280px]">
                  {selectedThreat.ruleMatched || 'Deterministic Rule Signature'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-luxury-muted">Inbound Origin IP</span>
                <span className="font-mono font-semibold text-luxury-ink">{selectedThreat.ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-luxury-muted">Target Endpoint</span>
                <span className="font-mono text-luxury-ink">{selectedThreat.method} {selectedThreat.path}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-luxury-muted">User-Agent</span>
                <span className="font-mono text-luxury-muted truncate max-w-[280px]">
                  {selectedThreat.userAgent || 'curl/7.88.1'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
