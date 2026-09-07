import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Plus,
  CheckCircle2,
  ShieldAlert,
  Code2,
  Filter,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { SearchInput, Input, Select, Textarea } from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { SeverityBadge, ActionBadge } from '../components/common/StatusBadge';
import { DETERMINISTIC_RULES as initialRules } from '../data/mockRules';
import { useToast } from '../context/ToastContext';

export default function WafRulesPage() {
  const [rules, setRules] = useState(initialRules);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isNewRuleModalOpen, setIsNewRuleModalOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    id: '',
    name: '',
    category: 'SQL Injection',
    pattern: '',
    severity: 'HIGH',
    action: 'BLOCK',
    description: '',
  });

  const { addToast } = useToast();

  const categories = ['All', 'SQL Injection', 'Cross-Site Scripting', 'Path Traversal', 'Command Injection', 'Behavioral Anomaly'];

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const matchSearch =
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.pattern.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'All' || r.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [rules, searchQuery, categoryFilter]);

  const toggleRuleActive = (ruleId) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r))
    );
    addToast({
      title: 'Rule Status Changed',
      description: `Rule ${ruleId} operational state updated.`,
      type: 'info',
    });
  };

  const handleCreateRule = (e) => {
    e.preventDefault();
    if (!newRule.name.trim() || !newRule.pattern.trim()) return;

    const id = newRule.id.trim() || 'RULE-CUSTOM-' + Math.floor(100 + Math.random() * 900);
    const created = {
      ...newRule,
      id,
      active: true,
      matchesCount: 0,
    };

    setRules([created, ...rules]);
    setIsNewRuleModalOpen(false);
    setNewRule({
      id: '',
      name: '',
      category: 'SQL Injection',
      pattern: '',
      severity: 'HIGH',
      action: 'BLOCK',
      description: '',
    });

    addToast({
      title: 'WAF Rule Provisioned',
      description: `Rule ${created.id} compiled and deployed to edge nodes.`,
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
              PERIMETER FILTER SIGNATURES
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-luxury-ink tracking-tight">
            Deterministic WAF Rules &amp; Signatures
          </h1>
          <p className="text-xs md:text-sm text-luxury-muted mt-1">
            Deterministic regular expression matchers evaluated ahead of the neural classifier pipeline.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsNewRuleModalOpen(true)}
        >
          Add Custom Rule
        </Button>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="inline-flex p-1 bg-luxury-surface-hover border border-luxury-border rounded-xl text-xs font-medium overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const count =
              cat === 'All'
                ? rules.length
                : rules.filter((r) => r.category === cat).length;
            const isActive = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-luxury-surface text-luxury-ink shadow-subtle font-semibold'
                    : 'text-luxury-muted hover:text-luxury-ink'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-luxury-surface-hover text-luxury-ink'
                      : 'bg-luxury-border text-luxury-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search rule ID, regex pattern, exploit..."
          />
        </div>
      </div>

      {/* Rules Table */}
      {filteredRules.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No WAF rules match search"
          description={`No deterministic signatures located for "${searchQuery}".`}
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setCategoryFilter('All');
          }}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-luxury-surface-hover border-b border-luxury-border uppercase text-[10px] font-semibold text-luxury-muted tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Rule Identifier</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Regex Signature</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4 text-center">Hits</th>
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/60">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-luxury-surface-hover/50 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-luxury-ink">
                      <div className="font-mono text-xs font-bold text-luxury-ink">{rule.id}</div>
                      <div className="text-[11px] text-luxury-muted font-normal">{rule.name}</div>
                    </td>
                    <td className="py-3.5 px-4 text-luxury-ink font-medium">
                      {rule.category}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-luxury-muted truncate max-w-xs">
                      <span className="p-1 rounded bg-stone-950 text-emerald-400 font-mono text-[11px]">
                        {rule.pattern}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={rule.severity} />
                    </td>
                    <td className="py-3.5 px-4">
                      <ActionBadge action={rule.action} />
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-luxury-ink">
                      {rule.matchesCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleRuleActive(rule.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          rule.active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-luxury-surface-hover text-luxury-muted border border-luxury-border'
                        }`}
                      >
                        {rule.active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* New Rule Modal */}
      <Modal
        isOpen={isNewRuleModalOpen}
        onClose={() => setIsNewRuleModalOpen(false)}
        title="Deploy Custom WAF Rule"
        description="Add a deterministic regex pattern to intercept known attack payloads at ingress."
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewRuleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateRule}
            >
              Compile &amp; Deploy Rule
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateRule} className="space-y-4">
          <Input
            label="Rule Name / Title"
            placeholder="e.g. Prototype Pollution Object Constructor"
            value={newRule.name}
            onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Threat Category"
              value={newRule.category}
              onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
              options={[
                { value: 'SQL Injection', label: 'SQL Injection' },
                { value: 'Cross-Site Scripting', label: 'Cross-Site Scripting' },
                { value: 'Path Traversal', label: 'Path Traversal' },
                { value: 'Command Injection', label: 'Command Injection' },
                { value: 'Behavioral Anomaly', label: 'Behavioral Anomaly' },
              ]}
            />
            <Select
              label="Severity"
              value={newRule.severity}
              onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
              options={[
                { value: 'CRITICAL', label: 'CRITICAL' },
                { value: 'HIGH', label: 'HIGH' },
                { value: 'MEDIUM', label: 'MEDIUM' },
                { value: 'LOW', label: 'LOW' },
              ]}
            />
          </div>

          <Input
            label="Regex Pattern Signature"
            placeholder="e.g. (__proto__|constructor\.prototype)"
            value={newRule.pattern}
            onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
            required
          />

          <Textarea
            label="Exploit Description / CVE Reference"
            placeholder="Describe the threat mechanism mitigated by this signature..."
            value={newRule.description}
            onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
            rows={3}
          />
        </form>
      </Modal>
    </div>
  );
}
