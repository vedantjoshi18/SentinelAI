import React, { useState } from 'react';
import {
  Settings,
  Shield,
  KeyRound,
  Bell,
  Palette,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Sun,
  Moon,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export default function SecuritySettingsPage() {
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('thresholds');
  const [thresholds, setThresholds] = useState({
    criticalScoreThreshold: 70,
    maxFailedAttempts: 5,
    banDurationMinutes: 30,
    autoDropEnabled: true,
  });

  const [apiKeys, setApiKeys] = useState([
    {
      id: 'key-1',
      name: 'Production Cloudflare Ingress Token',
      prefix: 'sentinel_live_9f82...',
      created: '2026-02-14',
      lastUsed: '2 minutes ago',
      permissions: 'Ingress & Inspection',
    },
    {
      id: 'key-2',
      name: 'Staging VPC Agent Token',
      prefix: 'sentinel_test_3c17...',
      created: '2026-04-20',
      lastUsed: '1 hour ago',
      permissions: 'Read Only',
    },
  ]);

  const [isNewKeyModalOpen, setIsNewKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const handleSaveThresholds = (e) => {
    e.preventDefault();
    addToast({
      title: 'Thresholds Updated',
      description: 'Mitigation rules and rate-limiting thresholds persisted.',
      type: 'success',
    });
  };

  const handleGenerateKey = (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const created = {
      id: 'key-' + Math.random().toString(36).substring(2, 7),
      name: newKeyName.trim(),
      prefix: 'sentinel_live_' + Math.random().toString(36).substring(2, 6) + '...',
      created: '2026-09-07',
      lastUsed: 'Never',
      permissions: 'Ingress & Inspection',
    };

    setApiKeys([...apiKeys, created]);
    setIsNewKeyModalOpen(false);
    setNewKeyName('');
    addToast({
      title: 'Token Generated',
      description: `Provisioned agent token for "${created.name}".`,
      type: 'success',
    });
  };

  const handleRevokeKey = (id, name) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
    addToast({
      title: 'Token Revoked',
      description: `Revoked token "${name}". Ingress requests with this key will now be dropped.`,
      type: 'warning',
    });
  };

  const tabs = [
    { id: 'thresholds', label: 'Mitigation Thresholds', icon: Shield },
    { id: 'keys', label: 'Agent API Tokens', icon: KeyRound, count: apiKeys.length },
    { id: 'appearance', label: 'Appearance & UI', icon: Palette },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="pb-4 border-b border-luxury-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 font-mono">
            DEFENSE GOVERNANCE
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-luxury-ink tracking-tight">
          Security Policies &amp; Edge Configurations
        </h1>
        <p className="text-xs md:text-sm text-luxury-muted mt-1">
          Manage automated quarantine thresholds, edge gateway API keys, and notification triggers.
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Tabs */}
        <div className="lg:col-span-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-luxury-ink text-luxury-bg shadow-sm'
                    : 'text-luxury-muted hover:text-luxury-ink hover:bg-luxury-surface-hover'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-luxury-surface/20' : 'bg-luxury-surface-hover text-luxury-muted'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Tab Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Tab 1: Thresholds */}
          {activeTab === 'thresholds' && (
            <Card className="p-6 space-y-6 animate-fadeIn">
              <div>
                <CardTitle serif>Automated Intrusion Mitigation Thresholds</CardTitle>
                <CardDescription>
                  Configure automated IP rate-limiting, risk score triggers, and packet drop policies.
                </CardDescription>
              </div>

              <form onSubmit={handleSaveThresholds} className="space-y-4 max-w-xl">
                <Input
                  label="Critical Risk Score Drop Threshold (0-100)"
                  type="number"
                  value={thresholds.criticalScoreThreshold}
                  onChange={(e) => setThresholds({ ...thresholds, criticalScoreThreshold: parseInt(e.target.value) || 70 })}
                  helperText="Packets exceeding this score are immediately dropped (ACTION: BLOCK)."
                />

                <Input
                  label="Maximum Failed Authentication Attempts"
                  type="number"
                  value={thresholds.maxFailedAttempts}
                  onChange={(e) => setThresholds({ ...thresholds, maxFailedAttempts: parseInt(e.target.value) || 5 })}
                  helperText="Consecutive login failures before IP quarantine is enforced."
                />

                <Input
                  label="Quarantine Duration (Minutes)"
                  type="number"
                  value={thresholds.banDurationMinutes}
                  onChange={(e) => setThresholds({ ...thresholds, banDurationMinutes: parseInt(e.target.value) || 30 })}
                  helperText="Duration that abusive IP addresses remain blocked from all routes."
                />

                <div className="pt-4 border-t border-luxury-border flex justify-end">
                  <Button variant="primary" size="sm" type="submit">
                    Save Policies
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Tab 2: API Keys */}
          {activeTab === 'keys' && (
            <Card className="overflow-hidden animate-fadeIn">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle serif>Perimeter Agent API Tokens</CardTitle>
                    <CardDescription>
                      Authenticated tokens for SentinelAI edge reverse proxies and ingress containers.
                    </CardDescription>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Plus}
                    onClick={() => setIsNewKeyModalOpen(true)}
                  >
                    Generate Token
                  </Button>
                </div>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-luxury-surface-hover border-b border-luxury-border uppercase text-[10px] font-semibold text-luxury-muted tracking-wider">
                    <tr>
                      <th className="py-3 px-5">Agent Name</th>
                      <th className="py-3 px-4">Key Prefix</th>
                      <th className="py-3 px-4">Scope</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4">Last Ingress</th>
                      <th className="py-3 px-4 text-right">Revoke</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-luxury-border/60">
                    {apiKeys.map((key) => (
                      <tr key={key.id} className="hover:bg-luxury-surface-hover/50 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-luxury-ink">{key.name}</td>
                        <td className="py-3.5 px-4 font-mono text-luxury-muted">{key.prefix}</td>
                        <td className="py-3.5 px-4"><Badge variant="subtle" size="sm">{key.permissions}</Badge></td>
                        <td className="py-3.5 px-4 text-luxury-muted">{key.created}</td>
                        <td className="py-3.5 px-4 text-luxury-muted">{key.lastUsed}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRevokeKey(key.id, key.name)}
                            className="p-1 text-rose-500 hover:text-rose-600 rounded cursor-pointer"
                            aria-label="Revoke"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Tab 3: Appearance */}
          {activeTab === 'appearance' && (
            <Card className="p-6 space-y-6 animate-fadeIn">
              <CardTitle serif>SOC Dashboard Aesthetic</CardTitle>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer ${
                    theme === 'light'
                      ? 'border-luxury-ink bg-luxury-surface-hover'
                      : 'border-luxury-border hover:border-luxury-border-strong'
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-500" />
                  <div className="text-left">
                    <div className="text-xs font-semibold text-luxury-ink">Light Aesthetic</div>
                    <div className="text-[10px] text-luxury-muted">Warm editorial paper</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? 'border-luxury-ink bg-luxury-surface-hover'
                      : 'border-luxury-border hover:border-luxury-border-strong'
                  }`}
                >
                  <Moon className="w-5 h-5 text-amber-400" />
                  <div className="text-left">
                    <div className="text-xs font-semibold text-luxury-ink">Dark Aesthetic</div>
                    <div className="text-[10px] text-luxury-muted">Luxury charcoal ink</div>
                  </div>
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Generate Key Modal */}
      <Modal
        isOpen={isNewKeyModalOpen}
        onClose={() => setIsNewKeyModalOpen(false)}
        title="Generate Edge Ingress Token"
        description="Provision an HMAC signature token for edge packet forwarding to SentinelAI."
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewKeyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateKey}
            >
              Generate Key
            </Button>
          </>
        }
      >
        <form onSubmit={handleGenerateKey} className="space-y-4">
          <Input
            label="Agent Node Identifier"
            placeholder="e.g. AWS US-West EKS Cluster Gateway"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            required
            autoFocus
          />
        </form>
      </Modal>
    </div>
  );
}
