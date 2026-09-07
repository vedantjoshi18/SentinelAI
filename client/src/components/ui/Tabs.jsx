import React from 'react';

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
}) {
  if (variant === 'pills') {
    return (
      <div
        className={`inline-flex items-center gap-1 p-1 bg-luxury-surface-hover border border-luxury-border rounded-xl font-sans text-xs ${className}`}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-luxury-surface text-luxury-ink shadow-subtle'
                  : 'text-luxury-muted hover:text-luxury-ink'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-luxury-surface-hover text-luxury-ink'
                      : 'bg-luxury-border text-luxury-muted'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-6 border-b border-luxury-border overflow-x-auto no-scrollbar font-sans text-sm ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 py-3 font-medium whitespace-nowrap transition-colors relative cursor-pointer ${
              isActive
                ? 'text-luxury-ink'
                : 'text-luxury-muted hover:text-luxury-ink'
            }`}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-luxury-surface-hover text-luxury-ink font-semibold'
                    : 'bg-luxury-surface-hover text-luxury-muted'
                }`}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-luxury-ink rounded-full animate-fadeIn" />
            )}
          </button>
        );
      })}
    </div>
  );
}
