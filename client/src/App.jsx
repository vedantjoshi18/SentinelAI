import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Context Providers & Smooth Scroll
import SmoothScroll from './components/common/SmoothScroll';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ClusterProvider } from './context/ClusterContext';
import { CommandProvider } from './context/CommandContext';
import { ToastProvider } from './context/ToastContext';

// Layout
import SentinelAppShell from './components/layout/SentinelAppShell';

// SentinelAI Pages
import SocOverviewPage from './pages/SocOverviewPage';
import ThreatFeedPage from './pages/ThreatFeedPage';
import AttackAnalyticsPage from './pages/AttackAnalyticsPage';
import ThreatSandboxPage from './pages/ThreatSandboxPage';
import WafRulesPage from './pages/WafRulesPage';
import AdminGovernancePage from './pages/AdminGovernancePage';
import SystemHealthPage from './pages/SystemHealthPage';
import SecuritySettingsPage from './pages/SecuritySettingsPage';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        <Routes location={location} key={location.pathname}>
          {/* 1. SOC Overview & Threat Telemetry */}
          <Route path="/" element={<SocOverviewPage />} />

          {/* 2. Live Threat Feed & Forensic Triage */}
          <Route path="/threats" element={<ThreatFeedPage />} />

          {/* 3. Attack Analytics & Exploit Attribution */}
          <Route path="/analytics" element={<AttackAnalyticsPage />} />

          {/* 4. Threat Sandbox & Deep Packet Inspection */}
          <Route path="/sandbox" element={<ThreatSandboxPage />} />

          {/* 5. Deterministic WAF Signatures & Rules */}
          <Route path="/rules" element={<WafRulesPage />} />

          {/* 6. Access Governance & User Management */}
          <Route path="/admin" element={<AdminGovernancePage />} />

          {/* 7. System & Microservice Engine Health */}
          <Route path="/system" element={<SystemHealthPage />} />

          {/* 8. Security Policies & Agent API Tokens */}
          <Route path="/settings" element={<SecuritySettingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SmoothScroll>
        <AuthProvider>
          <ThemeProvider>
            <ClusterProvider>
              <CommandProvider>
                <ToastProvider>
                  <SentinelAppShell>
                    <AnimatedRoutes />
                  </SentinelAppShell>
                </ToastProvider>
              </CommandProvider>
            </ClusterProvider>
          </ThemeProvider>
        </AuthProvider>
      </SmoothScroll>
    </BrowserRouter>
  );
}