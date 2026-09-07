import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  Activity,
  BarChart3,
  Terminal,
  Layers,
  Users,
  HardDrive,
  Settings,
  X,
  Sun,
  Moon,
  Search,
  Check,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useCommand } from '../../context/CommandContext';
import { useCluster } from '../../context/ClusterContext';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { name: 'SOC Overview', path: '/', icon: ShieldAlert },
  { name: 'Threat Feed', path: '/threats', icon: Activity },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Sandbox', path: '/sandbox', icon: Terminal },
  { name: 'WAF Rules', path: '/rules', icon: Layers },
  { name: 'Admin', path: '/admin', icon: Users },
  { name: 'System', path: '/system', icon: HardDrive },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function SentinelMobileDrawer({ isOpen, onClose }) {
  const { theme, toggleTheme } = useTheme();
  const { openCommandPalette } = useCommand();
  const { activeCluster, clusters, switchCluster } = useCluster();
  const { user, isAuthenticated, logout } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-luxury-surface border-r border-luxury-border shadow-elevated flex flex-col z-10 animate-slideLeft font-sans">
        {/* Header */}
        <div className="p-5 border-b border-luxury-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-bold tracking-tight text-luxury-ink">
              SENTINEL AI
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              SOC
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-luxury-muted hover:text-luxury-ink rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Search */}
        <div className="p-4 border-b border-luxury-border">
          <button
            type="button"
            onClick={() => {
              onClose();
              openCommandPalette();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-luxury-surface-hover border border-luxury-border text-xs text-luxury-muted cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              <span>Search SOC telemetry...</span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-luxury-surface border border-luxury-border rounded">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-luxury-ink text-luxury-bg shadow-sm'
                      : 'text-luxury-muted hover:text-luxury-ink hover:bg-luxury-surface-hover'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Cluster Switcher */}
        <div className="p-4 border-t border-luxury-border">
          <label className="text-[11px] font-semibold text-luxury-muted uppercase tracking-wider block mb-2">
            Perimeter Gateway Cluster
          </label>
          <div className="space-y-1">
            {clusters.map((cls) => (
              <button
                key={cls.id}
                type="button"
                onClick={() => {
                  switchCluster(cls.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  activeCluster.id === cls.id
                    ? 'bg-luxury-surface-hover text-luxury-ink border border-luxury-border'
                    : 'text-luxury-muted hover:text-luxury-ink'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{cls.name}</span>
                </div>
                {activeCluster.id === cls.id && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-luxury-border flex items-center justify-between">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 text-xs text-luxury-muted hover:text-luxury-ink cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="text-xs text-rose-500 hover:underline cursor-pointer"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SentinelMobileBottomBar({ onOpenDrawer, onOpenNotifications }) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-luxury-surface/95 backdrop-blur-md border-t border-luxury-border px-4 py-2 flex items-center justify-around font-sans">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            isActive ? 'text-luxury-ink' : 'text-luxury-muted'
          }`
        }
      >
        <ShieldAlert className="w-5 h-5" />
        <span>Overview</span>
      </NavLink>

      <NavLink
        to="/threats"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            isActive ? 'text-luxury-ink' : 'text-luxury-muted'
          }`
        }
      >
        <Activity className="w-5 h-5" />
        <span>Threats</span>
      </NavLink>

      <NavLink
        to="/sandbox"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            isActive ? 'text-luxury-ink' : 'text-luxury-muted'
          }`
        }
      >
        <Terminal className="w-5 h-5" />
        <span>Sandbox</span>
      </NavLink>

      <button
        type="button"
        onClick={onOpenNotifications}
        className="flex flex-col items-center gap-1 text-[11px] font-medium text-luxury-muted hover:text-luxury-ink cursor-pointer"
      >
        <Activity className="w-5 h-5" />
        <span>Alerts</span>
      </button>

      <button
        type="button"
        onClick={onOpenDrawer}
        className="flex flex-col items-center gap-1 text-[11px] font-medium text-luxury-muted hover:text-luxury-ink cursor-pointer"
      >
        <div className="w-5 h-5 flex flex-col justify-center gap-1">
          <span className="w-full h-0.5 bg-current rounded" />
          <span className="w-full h-0.5 bg-current rounded" />
        </div>
        <span>Menu</span>
      </button>
    </div>
  );
}
