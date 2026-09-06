import React from 'react';
import { Send, Play, Terminal } from 'lucide-react';

export default function CustomPayloadEditor({
  payloadText,
  setPayloadText,
  method,
  setMethod,
  path,
  setPath,
  onInspect,
  isInspecting,
}) {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center space-x-2.5 mb-4">
        <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
          <Terminal className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">
            Sandbox Request Constructor
          </h3>
          <p className="text-xs text-slate-400">
            Submit arbitrary requests to evaluate gateway rules, AI models, and risk scoring
          </p>
        </div>
      </div>

      {/* HTTP Method & Target Path */}
      <div className="flex space-x-2 mb-3">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-xs font-mono font-bold text-blue-400 focus:outline-none focus:border-blue-500 transition cursor-pointer"
        >
          <option value="POST">POST</option>
          <option value="GET">GET</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="/api/example/endpoint"
          className="flex-1 bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition"
        />
      </div>

      {/* Request Body Editor */}
      <div className="flex-1 flex flex-col min-h-[220px]">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
          <span>Inspectable Payload (JSON or Raw Text)</span>
          <span className="font-mono text-slate-500">{payloadText.length} chars</span>
        </label>
        <textarea
          rows={10}
          value={payloadText}
          onChange={(e) => setPayloadText(e.target.value)}
          placeholder='{"param": "test value"}'
          className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={onInspect}
        disabled={isInspecting || !payloadText.trim()}
        className="w-full mt-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-40 cursor-pointer"
      >
        <Play className={`w-4 h-4 ${isInspecting ? 'animate-spin' : ''}`} />
        <span>{isInspecting ? 'Evaluating Threat Engine...' : 'Inspect Payload in Sandbox'}</span>
      </button>
    </div>
  );
}
