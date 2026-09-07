import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ShieldAlert,
  Activity,
  BarChart3,
  Terminal,
  Layers,
  Users,
  HardDrive,
  Settings,
  Sun,
  Moon,
  ArrowRight,
  X,
  Database,
  Code2,
  FolderGit2,
} from 'lucide-react';
import { useCommand } from '../../context/CommandContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DETERMINISTIC_RULES } from '../../data/mockRules';

export default function SentinelCommandPalette() {
  const { isOpen, closeCommandPalette } = useCommand();
  const { theme, toggleTheme } = useTheme();
  const { loginAsDemoAnalyst, loginAsDemoAdmin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const baseCommands = useMemo(() => [
    { id: 'nav-overview', title: 'Go to SOC Overview', category: 'Navigation', icon: ShieldAlert, path: '/' },
    { id: 'nav-threats', title: 'Go to Live Threat Feed', category: 'Navigation', icon: Activity, path: '/threats' },
    { id: 'nav-analytics', title: 'Go to Neural Analytics', category: 'Navigation', icon: BarChart3, path: '/analytics' },
    { id: 'nav-sandbox', title: 'Go to Threat Sandbox & Inspector', category: 'Navigation', icon: Terminal, path: '/sandbox' },
    { id: 'nav-rules', title: 'Go to Deterministic WAF Rules', category: 'Navigation', icon: Layers, path: '/rules' },
    { id: 'nav-admin', title: 'Go to Access Governance & Admin', category: 'Navigation', icon: Users, path: '/admin' },
    { id: 'nav-system', title: 'Go to System & Pipeline Health', category: 'Navigation', icon: HardDrive, path: '/system' },
    { id: 'nav-settings', title: 'Go to Security Policies & Settings', category: 'Navigation', icon: Settings, path: '/settings' },
    {
      id: 'act-analyst',
      title: 'Sign In as Demo SOC Analyst',
      category: 'Authentication',
      icon: ShieldAlert,
      action: async () => {
        await loginAsDemoAnalyst();
        addToast({ title: 'Authenticated', description: 'Session active: Demo SOC Analyst.', type: 'success' });
      },
    },
    {
      id: 'act-admin',
      title: 'Sign In as Demo SOC Administrator',
      category: 'Authentication',
      icon: Users,
      action: async () => {
        await loginAsDemoAdmin();
        addToast({ title: 'Authenticated', description: 'Session active: Demo SOC Administrator.', type: 'success' });
      },
    },
    {
      id: 'act-theme',
      title: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      category: 'Preferences',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => toggleTheme(),
    },
  ], [theme, toggleTheme, loginAsDemoAnalyst, loginAsDemoAdmin, addToast]);

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return baseCommands;

    const matchedCommands = baseCommands.filter((cmd) =>
      cmd.title.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q)
    );

    const matchedRules = DETERMINISTIC_RULES
      .filter((r) => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q) || r.id.toLowerCase().includes(q))
      .slice(0, 4)
      .map((r) => ({
        id: `rule-${r.id}`,
        title: `${r.id}: ${r.name}`,
        category: `WAF Rule (${r.severity})`,
        icon: Layers,
        path: '/rules',
      }));

    return [...matchedCommands, ...matchedRules];
  }, [query, baseCommands]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) executeItem(selected);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  const executeItem = (item) => {
    closeCommandPalette();
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/50 backdrop-blur-sm transition-opacity"
        onClick={closeCommandPalette}
      />

      {/* Palette */}
      <div className="relative w-full max-w-2xl bg-luxury-surface border border-luxury-border rounded-2xl shadow-elevated z-10 overflow-hidden animate-slideUp font-sans">
        {/* Search Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-luxury-border">
          <Search className="w-5 h-5 text-luxury-muted shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search commands, threat vectors, WAF rules, and telemetry..."
            className="w-full bg-transparent text-luxury-ink text-sm placeholder:text-luxury-muted focus:outline-none"
          />
          <button
            type="button"
            onClick={closeCommandPalette}
            className="p-1 text-luxury-muted hover:text-luxury-ink rounded transition-colors ml-2 cursor-pointer"
            aria-label="Close command palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-luxury-border/30">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-luxury-muted text-sm">
              No matching security actions or telemetry entities found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="space-y-1 py-1">
              {filteredItems.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-luxury-surface-hover text-luxury-ink'
                        : 'text-luxury-muted hover:text-luxury-ink'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-md border ${
                          isSelected
                            ? 'bg-luxury-surface border-luxury-border text-luxury-ink'
                            : 'bg-luxury-surface-hover border-luxury-border text-luxury-muted'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-medium text-luxury-ink truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-luxury-muted truncate">
                          {item.category}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {isSelected && (
                        <span className="text-[11px] text-luxury-muted hidden sm:inline-flex items-center gap-1">
                          Execute
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-luxury-surface-hover border-t border-luxury-border flex items-center justify-between text-[11px] text-luxury-muted">
          <div className="flex items-center gap-3">
            <span>Use <kbd className="px-1.5 py-0.5 bg-luxury-surface border border-luxury-border rounded text-[10px] font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 bg-luxury-surface border border-luxury-border rounded text-[10px] font-mono">↓</kbd> to navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-luxury-surface border border-luxury-border rounded text-[10px] font-mono">↵</kbd> to select</span>
          </div>
          <span><kbd className="px-1.5 py-0.5 bg-luxury-surface border border-luxury-border rounded text-[10px] font-mono">esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
