import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Layers,
  BarChart3,
  Terminal,
  Activity,
  Users,
  Settings,
  Lock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

const SECTIONS = [
  {
    title: 'Perimeter Defense & SOC',
    items: [
      { name: 'SOC Overview', desc: 'Real-time security posture, telemetry KPIs, and incident feed', path: '/', icon: ShieldAlert },
      { name: 'Live Threat Feed', desc: 'Deep packet inspection log, search, and forensic triage', path: '/threats', icon: Activity },
      { name: 'Recent Interceptions', desc: 'Critical blocked attacks requiring verification', path: '/threats?severity=CRITICAL', icon: ShieldCheck },
    ],
  },
  {
    title: 'Neural Analytics & Vectors',
    items: [
      { name: 'Attack Vector Telemetry', desc: 'SQLi, XSS, Path Traversal, and RCE distributions', path: '/analytics', icon: BarChart3 },
      { name: 'Severity Stratification', desc: 'Critical, High, Medium, and Low risk categorizations', path: '/analytics', icon: Layers },
      { name: 'Compliance Reports', desc: 'Export certified ISO 27001 & SOC 2 audit digests', path: '/analytics', icon: Activity },
    ],
  },
  {
    title: 'Forensics & Threat Sandbox',
    items: [
      { name: 'Payload Sandbox', desc: 'Interactive attack simulation against live AI microservice', path: '/sandbox', icon: Terminal },
      { name: 'Diagnostic Inspector', desc: 'Neural SGD confidence scoring & risk decomposition', path: '/sandbox', icon: Cpu },
      { name: 'Deterministic WAF Rules', desc: '24 built-in regex filters and signature rulesets', path: '/rules', icon: Layers },
    ],
  },
  {
    title: 'Governance & Infrastructure',
    items: [
      { name: 'Access Control & Users', desc: 'SOC Analyst and Admin account management', path: '/admin', icon: Users },
      { name: 'System Engine Health', desc: 'Express Gateway, FastAPI SGD Core, and Database health', path: '/system', icon: Activity },
      { name: 'Security Policies', desc: 'Threshold configurations, rate limits, and API tokens', path: '/settings', icon: Settings },
    ],
  },
];

export default function SentinelMegaMenu({ isOpen, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-40 bg-luxury-surface/95 backdrop-blur-md border-b border-luxury-border shadow-elevated animate-fadeIn">
      <div ref={menuRef} className="max-w-7xl mx-auto px-6 py-8 md:py-10 font-sans">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {SECTIONS.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <h4 className="text-xs uppercase tracking-widest font-semibold text-luxury-muted">
                {section.title}
              </h4>
              <div className="space-y-3">
                {section.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={itemIdx}
                      to={item.path}
                      onClick={onClose}
                      className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-luxury-surface-hover transition-colors duration-150"
                    >
                      <div className="p-2 rounded-lg bg-luxury-surface border border-luxury-border text-luxury-muted group-hover:text-luxury-ink group-hover:border-luxury-border-strong shrink-0 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-luxury-ink group-hover:underline flex items-center gap-1.5">
                          <span>{item.name}</span>
                          <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-luxury-muted" />
                        </div>
                        <div className="text-xs text-luxury-muted mt-0.5 leading-snug line-clamp-2">
                          {item.desc}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-luxury-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-luxury-muted">
          <div className="flex items-center gap-2">
            <span className="font-serif italic text-luxury-ink font-semibold">SentinelAI Defense Core</span>
            <span>—</span>
            <span>Hybrid Rule &amp; Neural Inference Engine v2.4</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/system" onClick={onClose} className="hover:text-luxury-ink transition-colors flex items-center gap-1">
              <span>System Telemetry</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <Link to="/settings" onClick={onClose} className="hover:text-luxury-ink transition-colors">
              Security Governance
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
