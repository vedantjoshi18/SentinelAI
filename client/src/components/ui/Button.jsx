import React from 'react';

const VARIANTS = {
  primary: 'bg-luxury-ink text-luxury-bg hover:bg-opacity-90 active:scale-[0.98] shadow-sm',
  secondary: 'bg-luxury-surface-hover text-luxury-ink hover:bg-luxury-border border border-luxury-border active:scale-[0.98]',
  outline: 'border border-luxury-border text-luxury-ink hover:bg-luxury-surface-hover hover:border-luxury-border-strong active:scale-[0.98]',
  ghost: 'text-luxury-muted hover:text-luxury-ink hover:bg-luxury-surface-hover active:scale-[0.98]',
  danger: 'bg-rose-500 text-white hover:bg-rose-600 active:scale-[0.98]',
  gold: 'bg-amber-500 text-stone-950 font-medium hover:bg-amber-400 active:scale-[0.98] shadow-sm',
};

const SIZES = {
  sm: 'px-2.5 py-1 text-xs font-medium rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm font-medium rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base font-medium rounded-xl gap-2.5',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  onClick,
  type = 'button',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-sans transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-luxury-ink disabled:opacity-45 disabled:pointer-events-none select-none cursor-pointer';
  const variantClasses = VARIANTS[variant] || VARIANTS.primary;
  const sizeClasses = SIZES[size] || SIZES.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
      {!loading && IconRight && <IconRight className="w-4 h-4 shrink-0" />}
    </button>
  );
}
