import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CommandContext = createContext(null);

export function CommandProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openCommand = useCallback(() => setIsOpen(true), []);
  const closeCommand = useCallback(() => setIsOpen(false), []);
  const toggleCommand = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // ⌘K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommand();
      }
      // '/' outside input / textarea
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) &&
        !document.activeElement?.isContentEditable
      ) {
        e.preventDefault();
        openCommand();
      }
      // Escape closes
      if (e.key === 'Escape' && isOpen) {
        closeCommand();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommand, openCommand, closeCommand, isOpen]);

  return (
    <CommandContext.Provider
      value={{
        isOpen,
        openCommand,
        openCommandPalette: openCommand,
        closeCommand,
        closeCommandPalette: closeCommand,
        toggleCommand,
        toggleCommandPalette: toggleCommand,
      }}
    >
      {children}
    </CommandContext.Provider>
  );
}

export function useCommand() {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommand must be used within a CommandProvider');
  }
  return context;
}
