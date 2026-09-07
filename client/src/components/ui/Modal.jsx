import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn" data-lenis-prevent>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm transition-opacity"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Modal dialog */}
      <div
        className={`relative w-full ${SIZES[size] || SIZES.md} bg-luxury-surface border border-luxury-border rounded-2xl shadow-elevated z-10 my-auto overflow-hidden animate-slideUp`}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-start justify-between p-5 md:p-6 border-b border-luxury-border">
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
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-5 md:p-6 max-h-[75vh] overflow-y-auto font-sans">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 md:p-5 border-t border-luxury-border bg-luxury-surface-hover/50 flex items-center justify-end gap-3 font-sans">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
