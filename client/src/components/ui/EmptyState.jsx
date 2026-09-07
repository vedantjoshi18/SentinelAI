import React from 'react';
import Button from './Button';

export default function EmptyState({
  title = 'No records found',
  description = 'There are no active records matching your current criteria.',
  icon: Icon,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 md:p-12 border border-dashed border-luxury-border rounded-2xl bg-luxury-surface/50 font-sans ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-luxury-surface-hover border border-luxury-border flex items-center justify-center text-luxury-muted mb-4">
          <Icon className="w-6 h-6 stroke-[1.5]" />
        </div>
      )}
      <h3 className="text-base font-semibold text-luxury-ink tracking-tight font-serif">
        {title}
      </h3>
      <p className="text-xs md:text-sm text-luxury-muted max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
