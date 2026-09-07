import React from 'react';

const VARIANTS = {
  default: 'bg-luxury-surface-hover text-luxury-ink border border-luxury-border',
  gold: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  neutral: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border border-stone-500/20',
  subtle: 'bg-transparent text-luxury-muted border border-luxury-border',
  dark: 'bg-luxury-ink text-luxury-bg border border-transparent',
};

const DOT_COLORS = {
  default: 'bg-luxury-ink',
  gold: 'bg-amber-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  neutral: 'bg-stone-400',
  subtle: 'bg-stone-400',
  dark: 'bg-white',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  const variantClasses = VARIANTS[variant] || VARIANTS.default;
  const dotColor = DOT_COLORS[variant] || DOT_COLORS.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans font-medium tracking-tight rounded-md select-none transition-colors duration-150 ${sizeClasses} ${variantClasses} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      )}
      <span>{children}</span>
    </span>
  );
}
