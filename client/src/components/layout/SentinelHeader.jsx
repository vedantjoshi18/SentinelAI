import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Compass,
  Check,
  LogOut,
  User,
  Settings as SettingsIcon,
  Menu,
  Activity,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import SentinelMegaMenu from './SentinelMegaMenu';
import Modal from '../ui/Modal';
import { Input, Select } from '../ui/Input';
import Button from '../ui/Button';
import AuthModal from '../common/AuthModal';
import { useCluster } from '../../context/ClusterContext';
import { useTheme } from '../../context/ThemeContext';
import { useCommand } from '../../context/CommandContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { mockSecurityNotifications } from '../../data/mockSecurityNotifications';

const PRIMARY_NAV = [
  { name: 'SOC Overview', path: '/' },
  { name: 'Threat Feed', path: '/threats' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'Sandbox', path: '/sandbox' },
  { name: 'WAF Rules', path: '/rules' },
];

const SECONDARY_NAV = [
  { name: 'Admin', path: '/admin', icon: ShieldCheck },
  { name: 'System', path: '/system', icon: Activity },
  { name: 'Settings', path: '/settings', icon: SettingsIcon },
];

export default function SentinelHeader({ onOpenNotifications, onOpenMobileDrawer }) {
  const { activeCluster, clusters, switchCluster, addCluster } = useCluster();
  const { theme, toggleTheme } = useTheme();
  const { openCommandPalette } = useCommand();
  const { addToast } = useToast();
  const {
    user,
    isAuthenticated,
    loginAsDemoAnalyst,
    authActionLoading,
    logout,
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isClusterMenuOpen, setIsClusterMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNewClusterModalOpen, setIsNewClusterModalOpen] = useState(false);
  const [newClusterName, setNewClusterName] = useState('');
  const [newClusterRegion, setNewClusterRegion] = useState('US-West (Oregon)');
  const [hoveredNav, setHoveredNav] = useState(null);

  const clusterRef = useRef(null);
  const userRef = useRef(null);
  const moreNavRef = useRef(null);

  const unreadCount = mockSecurityNotifications.filter((n) => !n.read).length;

  const isRouteActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isSecondaryActive = SECONDARY_NAV.some((item) => isRouteActive(item.path));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clusterRef.current && !clusterRef.current.contains(e.target)) {
        setIsClusterMenuOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (moreNavRef.current && !moreNavRef.current.contains(e.target)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDemoAnalystLogin = async () => {
    try {
      await loginAsDemoAnalyst();
      addToast({
        title: 'Authenticated as SOC Analyst',
        description: 'Session active: demo.analyst@sentinelai.local. Telemetry streams unlocked.',
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Authentication Notice',
        description: 'Signed in with demo analyst privileges.',
        type: 'info',
      });
    }
  };

  const handleCreateCluster = (e) => {
    e.preventDefault();
    if (!newClusterName.trim()) return;
    const created = addCluster({ name: newClusterName.trim(), region: newClusterRegion });
    setIsNewClusterModalOpen(false);
    setNewClusterName('');
    addToast({
      title: 'Cluster Configured',
      description: `Ingress perimeter gateway initialized: ${created.name}.`,
      type: 'success',
    });
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 dark:bg-[#0A0D14]/75 border-b border-white/30 dark:border-white/[0.07] shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-colors duration-200 font-sans">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left section: Logo & Cluster Selector */}
            <div className="flex items-center gap-4 xl:gap-5 flex-1">
              {/* Mobile menu toggle */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={onOpenMobileDrawer}
                className="lg:hidden p-2 text-luxury-muted hover:text-luxury-ink rounded-lg transition-colors cursor-pointer"
                aria-label="Open mobile menu"
              >
                <Menu className="w-5 h-5" />
              </motion.button>

              {/* Brand Wordmark */}
              <Link
                to="/"
                className="flex items-center gap-2 group cursor-pointer select-none shrink-0"
              >
                <motion.div
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <span className="font-serif text-xl font-bold tracking-tight text-luxury-ink group-hover:opacity-90 transition-opacity">
                    SENTINEL
                  </span>
                  <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    AI
                  </span>
                </motion.div>
              </Link>

              {/* Divider */}
              <div className="hidden sm:block h-4 w-[1px] bg-luxury-border/80" />

              {/* Cluster Selector with Framer Motion */}
              <div className="relative hidden sm:block" ref={clusterRef}>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsClusterMenuOpen(!isClusterMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-full text-xs font-medium text-luxury-ink hover:bg-luxury-surface-hover/80 border border-luxury-border/60 hover:border-luxury-border transition-all cursor-pointer shadow-subtle"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-medium truncate max-w-[130px]">
                    {activeCluster.name}
                  </span>
                  <motion.div
                    animate={{ rotate: isClusterMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-luxury-muted" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {isClusterMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.96 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute left-0 mt-2 w-72 bg-luxury-surface border border-luxury-border rounded-2xl shadow-elevated py-1.5 z-50 origin-top-left"
                    >
                      <div className="px-3.5 py-2 text-[10px] uppercase font-semibold text-luxury-muted tracking-wider border-b border-luxury-border/70 flex items-center justify-between">
                        <span>Perimeter Gateways</span>
                        <span className="font-mono text-[9px] text-emerald-500">LIVE MESH</span>
                      </div>
                      <div className="py-1">
                        {clusters.map((cls) => (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => {
                              switchCluster(cls.id);
                              setIsClusterMenuOpen(false);
                              addToast({
                                title: 'Gateway Switched',
                                description: `Now inspecting perimeter cluster ${cls.name}.`,
                                type: 'info',
                              });
                            }}
                            className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-luxury-ink hover:bg-luxury-surface-hover transition-colors text-left cursor-pointer"
                          >
                            <div className="truncate">
                              <div className="font-medium truncate">{cls.name}</div>
                              <div className="text-[10px] text-luxury-muted">{cls.region} • {cls.latencyMs}ms</div>
                            </div>
                            {activeCluster.id === cls.id && (
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="pt-1 border-t border-luxury-border/70">
                        <button
                          type="button"
                          onClick={() => {
                            setIsClusterMenuOpen(false);
                            setIsNewClusterModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-luxury-ink hover:bg-luxury-surface-hover transition-colors text-left cursor-pointer font-medium"
                        >
                          <Plus className="w-3.5 h-3.5 text-luxury-muted" />
                          <span>Register Gateway Node</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Center section: Dynamic Interactive Pill Navigation */}
            <div className="hidden lg:flex flex-1 justify-center">
              <nav
                className="relative flex items-center gap-1 bg-luxury-surface-hover/70 dark:bg-white/[0.05] rounded-full border border-luxury-border/50 p-1 shadow-subtle backdrop-blur-md"
                onMouseLeave={() => setHoveredNav(null)}
              >
                {PRIMARY_NAV.map((item) => {
                  const active = isRouteActive(item.path);
                  const isHovered = hoveredNav === item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onMouseEnter={() => setHoveredNav(item.path)}
                      className="relative px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors select-none"
                    >
                      {/* Active Pill Indicator */}
                      {active && (
                        <motion.div
                          layoutId="activeNavPill"
                          className="absolute inset-0 rounded-full bg-luxury-ink shadow-sm"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}

                      {/* Hover Pill Indicator (when not active) */}
                      {!active && isHovered && (
                        <motion.div
                          layoutId="hoverNavPill"
                          className="absolute inset-0 rounded-full bg-luxury-surface/80 dark:bg-white/[0.09] shadow-subtle"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}

                      <span
                        className={`relative z-10 transition-colors duration-150 ${
                          active
                            ? 'text-luxury-bg font-semibold'
                            : isHovered
                            ? 'text-luxury-ink'
                            : 'text-luxury-muted'
                        }`}
                      >
                        {item.name}
                      </span>
                    </NavLink>
                  );
                })}

                {/* More Dropdown Pill */}
                <div className="relative" ref={moreNavRef}>
                  <button
                    type="button"
                    onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                    onMouseEnter={() => setHoveredNav('more')}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer select-none ${
                      isSecondaryActive
                        ? 'text-luxury-ink font-semibold'
                        : 'text-luxury-muted hover:text-luxury-ink'
                    }`}
                  >
                    {isSecondaryActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-0.5" />
                    )}
                    <span>More</span>
                    <motion.div
                      animate={{ rotate: isMoreMenuOpen ? 180 : 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isMoreMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.95 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 bg-luxury-surface border border-luxury-border rounded-2xl shadow-elevated py-1.5 z-50 origin-top"
                      >
                        <div className="py-1">
                          {SECONDARY_NAV.map((item) => {
                            const active = isRouteActive(item.path);
                            return (
                              <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMoreMenuOpen(false)}
                                className={`flex items-center gap-2.5 px-3.5 py-2 text-xs transition-colors cursor-pointer ${
                                  active
                                    ? 'text-luxury-ink bg-luxury-surface-hover font-semibold'
                                    : 'text-luxury-muted hover:text-luxury-ink hover:bg-luxury-surface-hover'
                                }`}
                              >
                                {item.icon && <item.icon className="w-3.5 h-3.5" />}
                                <span>{item.name}</span>
                                {active && (
                                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-luxury-ink" />
                                )}
                              </NavLink>
                            );
                          })}
                        </div>
                        <div className="h-[1px] bg-luxury-border/70 my-1" />
                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsMoreMenuOpen(false);
                              setIsMegaMenuOpen(true);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-luxury-muted hover:text-luxury-ink hover:bg-luxury-surface-hover transition-colors text-left cursor-pointer"
                          >
                            <Compass className="w-3.5 h-3.5 text-amber-500" />
                            <span>Matrix Directory</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>
            </div>

            {/* Right section: Search trigger, Theme, Notifications, Auth with Motion Feedback */}
            <div className="flex items-center justify-end gap-2 flex-1">
              {/* Command Search Trigger */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={openCommandPalette}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-luxury-surface-hover/70 dark:bg-white/[0.05] border border-luxury-border/50 text-xs text-luxury-muted hover:text-luxury-ink hover:border-luxury-border-strong transition-all cursor-pointer shadow-subtle"
                aria-label="Open Command Search"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Search...</span>
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-luxury-surface border border-luxury-border rounded-full text-luxury-muted">
                  Ctrl+K
                </kbd>
              </motion.button>

              {/* Theme Toggle */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.08, rotate: 15 }}
                whileTap={{ scale: 0.92 }}
                onClick={toggleTheme}
                className="p-2 text-luxury-muted hover:text-luxury-ink hover:bg-luxury-surface-hover/80 rounded-full transition-colors cursor-pointer"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </motion.button>

              {/* Notifications Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={onOpenNotifications}
                className="p-2 text-luxury-muted hover:text-luxury-ink hover:bg-luxury-surface-hover/80 rounded-full transition-colors relative cursor-pointer"
                aria-label="Open Security Alerts"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-luxury-surface"
                  />
                )}
              </motion.button>

              {/* Auth Controls */}
              {!isAuthenticated ? (
                <div className="hidden sm:flex items-center gap-1.5 ml-1">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDemoAnalystLogin}
                    disabled={authActionLoading}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {authActionLoading ? 'Signing in...' : 'Demo Analyst'}
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-luxury-ink text-luxury-bg hover:opacity-90 transition-all cursor-pointer shadow-sm"
                  >
                    Sign In
                  </motion.button>
                </div>
              ) : (
                <div className="relative ml-1" ref={userRef}>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-luxury-surface-hover/80 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-luxury-ink text-luxury-bg font-mono font-bold text-xs flex items-center justify-center ring-2 ring-luxury-border">
                      {user?.name ? user.name.substring(0, 2).toUpperCase() : 'SA'}
                    </div>
                    <span className="hidden md:inline-flex items-center text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-luxury-surface-hover border border-luxury-border text-luxury-muted">
                      {user?.role || 'ANALYST'}
                    </span>
                  </motion.button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 mt-2 w-64 bg-luxury-surface border border-luxury-border rounded-2xl shadow-elevated py-1.5 z-50 origin-top-right"
                      >
                        <div className="px-4 py-2.5 border-b border-luxury-border/70">
                          <p className="text-xs font-semibold text-luxury-ink">{user?.name || 'SOC Analyst'}</p>
                          <p className="text-[11px] text-luxury-muted truncate">{user?.email || 'analyst@sentinelai.local'}</p>
                        </div>

                        <div className="py-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              navigate('/admin');
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-luxury-ink hover:bg-luxury-surface-hover text-left cursor-pointer"
                          >
                            <User className="w-3.5 h-3.5 text-luxury-muted" />
                            <span>Access Control</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              navigate('/settings');
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-luxury-ink hover:bg-luxury-surface-hover text-left cursor-pointer"
                          >
                            <SettingsIcon className="w-3.5 h-3.5 text-luxury-muted" />
                            <span>Security Policies</span>
                          </button>
                        </div>

                        <div className="pt-1 border-t border-luxury-border/70">
                          <button
                            type="button"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              logout();
                              addToast({
                                title: 'Session Terminated',
                                description: 'Signed out of SentinelAI SOC dashboard.',
                                type: 'info',
                              });
                            }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-500 hover:bg-rose-500/10 text-left cursor-pointer font-medium"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MegaMenu Dropdown */}
        <SentinelMegaMenu
          isOpen={isMegaMenuOpen}
          onClose={() => setIsMegaMenuOpen(false)}
        />
      </header>

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {/* New Cluster Modal */}
      <Modal
        isOpen={isNewClusterModalOpen}
        onClose={() => setIsNewClusterModalOpen(false)}
        title="Register Gateway Node"
        description="Attach an edge proxy cluster to the SentinelAI neural inspection pipeline."
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewClusterModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateCluster}
            >
              Deploy Ingress
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateCluster} className="space-y-4">
          <Input
            label="Gateway Identifier"
            placeholder="e.g. Cloudflare Ingress Node"
            value={newClusterName}
            onChange={(e) => setNewClusterName(e.target.value)}
            required
            autoFocus
          />
          <Select
            label="Regional Data Plane"
            value={newClusterRegion}
            onChange={(e) => setNewClusterRegion(e.target.value)}
            options={[
              { value: 'US-East (N. Virginia)', label: 'US-East (N. Virginia)' },
              { value: 'US-West (Oregon)', label: 'US-West (Oregon)' },
              { value: 'EU-West (Frankfurt)', label: 'EU-West (Frankfurt)' },
              { value: 'AP-South (Mumbai)', label: 'AP-South (Mumbai)' },
            ]}
          />
        </form>
      </Modal>
    </>
  );
}
