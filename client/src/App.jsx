import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Cpu, Database, CheckCircle2, AlertCircle } from 'lucide-react';

function App() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then((data) => {
        if (data.status === 'ok') {
          setBackendStatus('online');
        } else {
          setBackendStatus('error');
        }
      })
      .catch(() => {
        setBackendStatus('offline');
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-[#111827]/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider uppercase text-slate-100">SentinelAI</h1>
            <p className="text-xs text-slate-400">AI-Powered Application Security & Intrusion Detection Platform</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
            Phase 0: Foundation Active
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-8 flex flex-col justify-center">
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            System Foundation & Health Monitor
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl">
            Real-time status of SentinelAI microservices, core architectural pipeline, and integration health.
          </p>
        </div>

        {/* Service Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* React Frontend */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                <Activity className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ACTIVE
              </span>
            </div>
            <h3 className="font-semibold text-slate-100 text-base">React Client (Vite)</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">SOC Dashboard & Dark-Themed UI layer</p>
            <div className="text-xs text-slate-500 border-t border-slate-800/80 pt-3 flex justify-between">
              <span>Port: 5173</span>
              <span className="text-emerald-400">Hot Reload Active</span>
            </div>
          </div>

          {/* Express Backend */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
                <Database className="w-5 h-5" />
              </div>
              {backendStatus === 'online' ? (
                <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> HEALTHY
                </span>
              ) : backendStatus === 'checking' ? (
                <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded text-amber-400 bg-amber-500/10 border border-amber-500/20">
                  CHECKING...
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded text-rose-400 bg-rose-500/10 border border-rose-500/20">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> OFFLINE
                </span>
              )}
            </div>
            <h3 className="font-semibold text-slate-100 text-base">Node.js / Express API</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Security Middleware, RBAC & Risk Engine</p>
            <div className="text-xs text-slate-500 border-t border-slate-800/80 pt-3 flex justify-between">
              <span>GET /api/health</span>
              <span className={backendStatus === 'online' ? 'text-emerald-400' : 'text-slate-400'}>
                {backendStatus === 'online' ? '{ status: "ok" }' : 'Pending start'}
              </span>
            </div>
          </div>

          {/* AI FastAPI Service */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> READY
              </span>
            </div>
            <h3 className="font-semibold text-slate-100 text-base">FastAPI AI Engine</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">Payload Classifier & Anomaly Detection</p>
            <div className="text-xs text-slate-500 border-t border-slate-800/80 pt-3 flex justify-between">
              <span>GET /health</span>
              <span className="text-purple-400">Port 8000</span>
            </div>
          </div>
        </div>

        {/* Architectural Flow Diagram Box */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
          <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-4">
            Architectural Pipeline Flow
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-center text-xs font-mono">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-slate-300">
              User Request
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-blue-400">
              React App
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-indigo-400">
              Auth & Security
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-purple-400">
              FastAPI AI
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-amber-400">
              Risk Engine
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-rose-400">
              Policy Action
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-emerald-400">
              SOC Log & UI
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        SentinelAI &copy; 2026 &bull; Application Security and Intrusion Detection Platform
      </footer>
    </div>
  );
}

export default App;