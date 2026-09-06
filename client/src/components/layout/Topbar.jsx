import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  RefreshCw,
  Cpu,
  Database,
  Activity,
  UserCheck,
  LogOut,
  LogIn,
} from 'lucide-react';

export default function Topbar({
  healthStatus,
  pollingInterval,
  setPollingInterval,
  onRefresh,
  isRefreshing,
  onOpenAuthModal,
}) {
  const { user, isAuthenticated, logout, loginAsDemoAnalyst, loginAsDemoAdmin } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-[#111827]/90 backdrop-blur sticky top-0 z-40 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-black tracking-wider uppercase bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              SentinelAI
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              SOC v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            AI-Powered Application Security & Intrusion Detection Platform
          </p>
        </div>
      </div>

      {/* Center: Health & Polling Controls */}
      <div className="flex items-center space-x-3 text-xs">
        {/* Microservice Health Indicators */}
        <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-lg">
          {/* Express Gateway */}
          <div className="flex items-center space-x-1.5 pr-2 border-r border-slate-800">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Gateway:</span>
            <span
              className={`font-semibold ${
                healthStatus?.server === 'ok' ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {healthStatus?.server === 'ok' ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          {/* AI Attack Classifier */}
          <div className="flex items-center space-x-1.5 pr-2 border-r border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">Classifier:</span>
            <span
              className={`font-semibold ${
                healthStatus?.aiModelLoaded ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {healthStatus?.aiModelLoaded ? 'READY' : 'STANDBY'}
            </span>
          </div>

          {/* Isolation Forest Anomaly */}
          <div className="flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-pink-400" />
            <span className="text-slate-400">Anomaly IF:</span>
            <span
              className={`font-semibold ${
                healthStatus?.anomalyModelLoaded ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {healthStatus?.anomalyModelLoaded ? 'READY' : 'STANDBY'}
            </span>
          </div>
        </div>

        {/* Polling Interval Dropdown */}
        <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1.5">
          <span className="text-slate-400">Sync:</span>
          <select
            value={pollingInterval}
            onChange={(e) => setPollingInterval(Number(e.target.value))}
            className="bg-transparent text-cyan-400 font-semibold focus:outline-none cursor-pointer"
          >
            <option value={5000} className="bg-slate-900 text-white">5s</option>
            <option value={10000} className="bg-slate-900 text-white">10s</option>
            <option value={30000} className="bg-slate-900 text-white">30s</option>
            <option value={0} className="bg-slate-900 text-white">Off</option>
          </select>
        </div>

        {/* Manual Refresh Trigger */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh live telemetry now"
          className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>

      {/* Right: Auth Controls */}
      <div className="flex items-center space-x-2.5">
        {isAuthenticated && user ? (
          <div className="flex items-center space-x-3 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="font-semibold text-white leading-tight">{user.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Role:{' '}
                  <span className="text-cyan-400 font-bold">{user.role}</span>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1 text-slate-400 hover:text-rose-400 transition ml-2"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={loginAsDemoAnalyst}
              className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold tracking-wider transition flex items-center space-x-1"
            >
              <span>Demo Analyst</span>
            </button>
            <button
              onClick={loginAsDemoAdmin}
              className="px-2.5 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-semibold tracking-wider transition flex items-center space-x-1"
            >
              <span>Demo Admin</span>
            </button>
            <button
              onClick={onOpenAuthModal}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition flex items-center space-x-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
