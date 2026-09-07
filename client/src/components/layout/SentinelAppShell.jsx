import React, { useState } from 'react';
import SentinelHeader from './SentinelHeader';
import { SentinelMobileDrawer, SentinelMobileBottomBar } from './SentinelMobileNav';
import SentinelCommandPalette from '../search/SentinelCommandPalette';
import SentinelNotificationDrawer from '../notifications/SentinelNotificationDrawer';

export default function SentinelAppShell({ children }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-luxury-bg text-luxury-ink flex flex-col font-sans transition-colors duration-150 selection:bg-amber-500/20 selection:text-amber-900 dark:selection:text-amber-100">
      {/* Top Luxury Sentinel Navigation Header */}
      <SentinelHeader
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
      />

      {/* Global Security Command Palette */}
      <SentinelCommandPalette />

      {/* Global Security Alert Drawer */}
      <SentinelNotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* Mobile Drawer */}
      <SentinelMobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 mb-14 lg:mb-0">
        {children}
      </main>

      {/* Mobile Bottom Bar */}
      <SentinelMobileBottomBar
        onOpenDrawer={() => setIsMobileDrawerOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
      />
    </div>
  );
}
