import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const WIDTHS = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

export default function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'md',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
        <div
          className={`w-screen ${WIDTHS[width] || WIDTHS.md} bg-luxury-surface border-l border-luxury-border shadow-elevated flex flex-col transform transition-transform duration-300 animate-slideLeft`}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-luxury-border">
            <div>
              {title && (
                <h2 className="text-lg font-semibold text-luxury-ink tracking-tight font-sans">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs md:text-sm text-luxury-muted mt-1 leading-relaxed font-sans">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-luxury-muted hover:text-luxury-ink hover:bg-luxury-surface-hover rounded-lg transition-colors ml-4 cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 font-sans" data-lenis-prevent>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="p-5 border-t border-luxury-border bg-luxury-surface-hover/50 flex items-center justify-end gap-3 font-sans">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
