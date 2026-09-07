import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { threatsApi, systemApi } from './services/api';

import Topbar from './components/layout/Topbar';
import TabNavigation from './components/layout/TabNavigation';
import MetricCards from './components/dashboard/MetricCards';
import RecentIncidentsTable from './components/dashboard/RecentIncidentsTable';
import ThreatFilterBar from './components/threats/ThreatFilterBar';
import ThreatEventsTable from './components/threats/ThreatEventsTable';
import ThreatDetailModal from './components/threats/ThreatDetailModal';
import ThreatCategoryBarChart from './components/charts/ThreatCategoryBarChart';
import SeverityDistributionPie from './components/charts/SeverityDistributionPie';
import PayloadPresetSelector, { PRESETS } from './components/sandbox/PayloadPresetSelector';
import CustomPayloadEditor from './components/sandbox/CustomPayloadEditor';
import DiagnosticInspector from './components/sandbox/DiagnosticInspector';
import AuthModal from './components/common/AuthModal';
import UserManagementView from './components/admin/UserManagementView';

import { Sparkles, AlertCircle, ShieldAlert, ShieldCheck, Cpu, Layers } from 'lucide-react';

function DashboardContent() {
  const { isAuthenticated, isAnalystOrAdmin, isAdmin, loginAsDemoAnalyst, loginAsDemoAdmin } = useAuth();

  // Navigation state
  const [activeTab, setActiveTab] = useState('overview');

  // Polling & sync state
  const [pollingInterval, setPollingInterval] = useState(10000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthStatus, setHealthStatus] = useState({ server: 'checking', aiModelLoaded: false, anomalyModelLoaded: false });

  // Data state
  const [stats, setStats] = useState(null);
  const [threats, setThreats] = useState([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 15;

  // Filter state
  const [filters, setFilters] = useState({
    threatType: '',
    severity: '',
    action: '',
    resolved: '',
    search: '',
  });

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Threat Sandbox state
  const [sandboxPresetId, setSandboxPresetId] = useState('sqli_tautology');
  const [sandboxMethod, setSandboxMethod] = useState('POST');
  const [sandboxPath, setSandboxPath] = useState('/api/auth/login');
  const [sandboxPayloadText, setSandboxPayloadText] = useState(
    JSON.stringify(PRESETS[0].payload, null, 2)
  );
  const [sandboxResult, setSandboxResult] = useState(null);
  const [sandboxError, setSandboxError] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);

  // Health check
  const checkSystemHealth = useCallback(async () => {
    try {
      const res = await systemApi.getHealth();
      setHealthStatus({
        server: res.status === 'ok' ? 'ok' : 'error',
        aiModelLoaded: Boolean(res.aiService?.modelLoaded),
        anomalyModelLoaded: Boolean(res.aiService?.anomalyModelLoaded),
      });
    } catch {
      setHealthStatus({ server: 'offline', aiModelLoaded: false, anomalyModelLoaded: false });
    }
  }, []);

  // Fetch threat statistics
  const fetchStatsData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await threatsApi.getStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch {
      // Ignore 401 or network errors gracefully
    }
  }, [isAuthenticated]);

  // Fetch threat events
  const fetchThreatsData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const params = { page, limit };
      if (filters.threatType) params.threatType = filters.threatType;
      if (filters.severity) params.severity = filters.severity;
      if (filters.action) params.action = filters.action;
      if (filters.resolved !== '') params.resolved = filters.resolved === 'true';
      if (filters.search) params.search = filters.search.trim();

      const res = await threatsApi.getThreats(params);
      if (res.success) {
        setThreats(res.events || []);
        setTotalEvents(res.pagination?.total ?? res.pagination?.totalEvents ?? (res.events ? res.events.length : 0));
      }
    } catch {
      // Ignore 401
    }
  }, [isAuthenticated, page, limit, filters]);

  // Combined refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([checkSystemHealth(), fetchStatsData(), fetchThreatsData()]);
    setIsRefreshing(false);
  }, [checkSystemHealth, fetchStatsData, fetchThreatsData]);

  // Auto-polling effect
  useEffect(() => {
    handleRefresh();

    if (pollingInterval > 0) {
      const timer = setInterval(() => {
        handleRefresh();
      }, pollingInterval);
      return () => clearInterval(timer);
    }
  }, [pollingInterval, handleRefresh]);

  // Sandbox Preset Selection
  const handleSelectPreset = (preset) => {
    setSandboxPresetId(preset.id);
    setSandboxPayloadText(JSON.stringify(preset.payload, null, 2));
    setSandboxResult(null);
    setSandboxError('');

    if (preset.category === 'PATH_TRAVERSAL') {
      setSandboxMethod('GET');
      setSandboxPath('/api/files/download');
    } else {
      setSandboxMethod('POST');
      setSandboxPath('/api/auth/login');
    }
  };

  // Run Sandbox Inspection
  const handleInspectPayload = async () => {
    setIsInspecting(true);
    setSandboxError('');
    setSandboxResult(null);

    let parsedBody = sandboxPayloadText;
    try {
      parsedBody = JSON.parse(sandboxPayloadText);
    } catch {
      // Raw string payload
    }

    try {
      const res = await threatsApi.inspect({
        payload: sandboxPayloadText,
        method: sandboxMethod,
        path: sandboxPath,
        body: parsedBody,
        query: sandboxMethod === 'GET' && typeof parsedBody === 'object' ? parsedBody : {},
      });

      if (res.success) {
        setSandboxResult(res);
      } else {
        setSandboxError(res.error || 'Inspection failed');
      }
    } catch (err) {
      setSandboxError(err.response?.data?.error || err.message || 'Inspection failed');
    } finally {
      setIsInspecting(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ threatType: '', severity: '', action: '', resolved: '', search: '' });
    setPage(1);
  };

  const handleIncidentUpdated = (updatedEvent) => {
    setThreats((prev) =>
      prev.map((e) => (e._id === updatedEvent._id ? { ...e, ...updatedEvent } : e))
    );
    setSelectedEvent(updatedEvent);
    fetchStatsData();
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Topbar */}
      <Topbar
        healthStatus={healthStatus}
        pollingInterval={pollingInterval}
        setPollingInterval={setPollingInterval}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        eventCount={totalEvents}
        isAdmin={isAdmin}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Guest Banner if not authenticated */}
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-blue-500/5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Guest SOC Mode Active</h4>
                <p className="text-xs text-slate-300">
                  You are viewing the dashboard in unauthenticated demo mode. Live audit logs and threat statistics require an Analyst session.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={loginAsDemoAnalyst}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5"
              >
                <span>Demo Analyst</span>
              </button>
              <button
                onClick={loginAsDemoAdmin}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5"
              >
                <span>Demo Admin</span>
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: SOC Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metric Cards */}
            <MetricCards stats={stats} />

            {/* Recent Incidents Table */}
            <RecentIncidentsTable
              recentThreats={stats?.recentThreats || threats.slice(0, 5)}
              onSelectIncident={(incident) => setSelectedEvent(incident)}
            />

            {/* SentinelAI Architecture Pipeline */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-base">SentinelAI Defense Pipeline</h3>
                  <p className="text-xs text-slate-400">
                    Real-time request flow across our hybrid security engine
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ALL ENGINES ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center text-xs font-semibold">
                <div className="bg-slate-900/80 border border-cyan-500/30 p-4 rounded-xl text-cyan-400 flex flex-col items-center justify-center space-y-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span>1. Express Gateway</span>
                  <span className="text-[10px] text-slate-400 font-normal">HTTP Interceptor</span>
                </div>
                <div className="bg-slate-900/80 border border-purple-500/30 p-4 rounded-xl text-purple-400 flex flex-col items-center justify-center space-y-2">
                  <Layers className="w-5 h-5" />
                  <span>2. Rule Engine</span>
                  <span className="text-[10px] text-slate-400 font-normal">24 Deterministic Rules</span>
                </div>
                <div className="bg-slate-900/80 border border-blue-500/30 p-4 rounded-xl text-blue-400 flex flex-col items-center justify-center space-y-2">
                  <Cpu className="w-5 h-5" />
                  <span>3. AI Classifier</span>
                  <span className="text-[10px] text-slate-400 font-normal">TF-IDF + SGD (97.7%)</span>
                </div>
                <div className="bg-slate-900/80 border border-amber-500/30 p-4 rounded-xl text-amber-400 flex flex-col items-center justify-center space-y-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>4. Risk Engine</span>
                  <span className="text-[10px] text-slate-400 font-normal">0–100 Dynamic Score</span>
                </div>
                <div className="bg-slate-900/80 border border-rose-500/30 p-4 rounded-xl text-rose-400 flex flex-col items-center justify-center space-y-2">
                  <ShieldAlert className="w-5 h-5" />
                  <span>5. Enforcement & SOC</span>
                  <span className="text-[10px] text-slate-400 font-normal">ALLOW / MONITOR / BLOCK</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Threat Event Feed */}
        {activeTab === 'threats' && (
          <div className="space-y-5">
            <ThreatFilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
            />

            <ThreatEventsTable
              events={threats}
              totalEvents={totalEvents}
              page={page}
              limit={limit}
              onPageChange={(p) => setPage(p)}
              onSelectEvent={(event) => setSelectedEvent(event)}
              isLoading={isRefreshing}
            />
          </div>
        )}

        {/* Tab 3: Attack Visualizations */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ThreatCategoryBarChart threatTypes={stats?.byThreatType || {}} />
              <SeverityDistributionPie severities={stats?.bySeverity || {}} />
            </div>

            {/* Quick Metrics Summary */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h4 className="font-bold text-white text-sm mb-2">SOC Telemetry Summary</h4>
              <p className="text-xs text-slate-400 mb-4">
                Real-time breakdown of intercepted attacks, anomalies, and benign requests processed by the SentinelAI gateway.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div className="text-slate-500">Allowed Requests</div>
                  <div className="text-lg font-bold text-emerald-400">{stats?.allowedCount ?? 0}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div className="text-slate-500">Monitored Alerts</div>
                  <div className="text-lg font-bold text-amber-400">{stats?.monitoredCount ?? 0}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div className="text-slate-500">Blocked Intrusions</div>
                  <div className="text-lg font-bold text-rose-400">{stats?.blockedCount ?? 0}</div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div className="text-slate-500">Total Telemetry</div>
                  <div className="text-lg font-bold text-cyan-400">{stats?.totalEvents ?? 0}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Threat Sandbox */}
        {activeTab === 'sandbox' && (
          <div className="space-y-6">
            <PayloadPresetSelector
              selectedPresetId={sandboxPresetId}
              onSelectPreset={handleSelectPreset}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CustomPayloadEditor
                payloadText={sandboxPayloadText}
                setPayloadText={setSandboxPayloadText}
                method={sandboxMethod}
                setMethod={setSandboxMethod}
                path={sandboxPath}
                setPath={setSandboxPath}
                onInspect={handleInspectPayload}
                isInspecting={isInspecting}
              />

              <DiagnosticInspector
                result={sandboxResult}
                error={sandboxError}
              />
            </div>
          </div>
        )}

        {/* Tab 5: Admin & User Management */}
        {activeTab === 'admin' && (
          <UserManagementView />
        )}
      </main>

      {/* Forensic Triage Modal */}
      {selectedEvent && (
        <ThreatDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdated={handleIncidentUpdated}
        />
      )}

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 bg-[#0B0F19]">
        SentinelAI &copy; 2026 &bull; AI-Powered Application Security & Intrusion Detection Platform
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}