import React from 'react';
import { Search, X } from 'lucide-react';

export function Input({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  type = 'text',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full font-sans">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-luxury-ink mb-1.5 uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-luxury-muted pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          className={`w-full bg-luxury-surface border text-luxury-ink text-sm rounded-lg transition-colors placeholder:text-luxury-muted/70 focus:outline-none focus:ring-1 focus:ring-luxury-ink focus:border-luxury-ink ${
            Icon ? 'pl-9 pr-3 py-2' : 'px-3 py-2'
          } ${
            error
              ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500'
              : 'border-luxury-border hover:border-luxury-border-strong'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
      {!error && helperText && (
        <p className="text-xs text-luxury-muted mt-1">{helperText}</p>
      )}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  shortcut,
  className = '',
  ...props
}) {
  return (
    <div className={`relative flex items-center w-full font-sans ${className}`}>
      <Search className="absolute left-3 w-4 h-4 text-luxury-muted pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-luxury-surface border border-luxury-border hover:border-luxury-border-strong text-luxury-ink text-sm rounded-lg pl-9 pr-14 py-2 transition-colors placeholder:text-luxury-muted/70 focus:outline-none focus:ring-1 focus:ring-luxury-ink focus:border-luxury-ink"
        {...props}
      />
      <div className="absolute right-2.5 flex items-center gap-1.5">
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="p-1 text-luxury-muted hover:text-luxury-ink rounded cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {shortcut && (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-luxury-muted bg-luxury-surface-hover border border-luxury-border rounded">
            {shortcut}
          </kbd>
        )}
      </div>
    </div>
  );
}

export function Select({
  label,
  options = [],
  error,
  helperText,
  className = '',
  id,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full font-sans">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-luxury-ink mb-1.5 uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full bg-luxury-surface border text-luxury-ink text-sm rounded-lg px-3 py-2 transition-colors focus:outline-none focus:ring-1 focus:ring-luxury-ink focus:border-luxury-ink cursor-pointer ${
          error
            ? 'border-rose-500'
            : 'border-luxury-border hover:border-luxury-border-strong'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
      {!error && helperText && (
        <p className="text-xs text-luxury-muted mt-1">{helperText}</p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  error,
  helperText,
  className = '',
  rows = 4,
  id,
  ...props
}) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full font-sans">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-semibold text-luxury-ink mb-1.5 uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full bg-luxury-surface border text-luxury-ink text-sm rounded-lg p-3 transition-colors placeholder:text-luxury-muted/70 focus:outline-none focus:ring-1 focus:ring-luxury-ink focus:border-luxury-ink resize-y ${
          error
            ? 'border-rose-500 focus:ring-rose-500'
            : 'border-luxury-border hover:border-luxury-border-strong'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
      {!error && helperText && (
        <p className="text-xs text-luxury-muted mt-1">{helperText}</p>
      )}
    </div>
  );
}
