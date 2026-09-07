import React from 'react';

export function Card({
  children,
  className = '',
  hover = false,
  onClick,
  ...props
}) {
  const hoverClasses = hover
    ? 'hover:border-luxury-border-strong hover:shadow-subtle transition-all duration-200 cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`bg-luxury-surface border border-luxury-border rounded-xl md:rounded-2xl transition-colors duration-150 ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`p-5 md:p-6 border-b border-luxury-border ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', serif = false }) {
  const font = serif ? 'font-serif' : 'font-sans';
  return (
    <h3
      className={`${font} text-base md:text-lg font-semibold tracking-tight text-luxury-ink ${className}`}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-xs md:text-sm text-luxury-muted font-sans mt-1 leading-relaxed ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-5 md:p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div
      className={`p-4 md:p-5 border-t border-luxury-border bg-luxury-surface-hover/50 rounded-b-xl md:rounded-b-2xl flex items-center justify-between gap-4 ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;
