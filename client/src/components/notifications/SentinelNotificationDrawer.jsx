import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Trash2, ShieldAlert, Cpu, Terminal, Layers, Lock, HardDrive, Bell } from 'lucide-react';
import Drawer from '../ui/Drawer';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import { mockSecurityNotifications as initialNotifications } from '../../data/mockSecurityNotifications';
import { useToast } from '../../context/ToastContext';

const TYPE_ICONS = {
  threat: ShieldAlert,
  ai: Cpu,
  sandbox: Terminal,
  rules: Layers,
  security: Lock,
  auth: Lock,
  system: HardDrive,
};

export default function SentinelNotificationDrawer({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();
  const { addToast } = useToast();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    return true;
  });

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast({
      title: 'Alerts Acknowledged',
      description: 'All pending security notifications marked as reviewed.',
      type: 'info',
    });
  };

  const clearAll = () => {
    setNotifications([]);
    addToast({
      title: 'History Cleared',
      description: 'Security incident alert history purged.',
      type: 'info',
    });
  };

  const handleNotificationClick = (item) => {
    markAsRead(item.id);
    onClose();
    if (item.link) {
      navigate(item.link);
    }
  };

  const groups = ['Today', 'Yesterday', 'Earlier'];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Security Alert Stream"
      description="Live intrusion interceptions, neural model updates, and forensic triage alerts."
      width="md"
      footer={
        <div className="w-full flex items-center justify-between text-xs text-luxury-muted">
          <span>{unreadCount} unread notices</span>
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      }
    >
      {/* Subheader controls */}
      <div className="flex items-center justify-between pb-4 border-b border-luxury-border mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-luxury-ink text-luxury-bg'
                : 'text-luxury-muted hover:text-luxury-ink bg-luxury-surface-hover'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('unread')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeFilter === 'unread'
                ? 'bg-luxury-ink text-luxury-bg'
                : 'text-luxury-muted hover:text-luxury-ink bg-luxury-surface-hover'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs text-luxury-muted hover:text-luxury-ink transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications list */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All perimeter alerts resolved"
          description="Zero unacknowledged security warnings pending in this cluster."
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const groupItems = filteredNotifications.filter((n) => n.group === group);
            if (groupItems.length === 0) return null;

            return (
              <div key={group} className="space-y-2.5">
                <h4 className="text-[11px] uppercase tracking-wider font-semibold text-luxury-muted">
                  {group}
                </h4>
                <div className="space-y-2">
                  {groupItems.map((item) => {
                    const Icon = TYPE_ICONS[item.type] || ShieldAlert;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-start gap-3 relative ${
                          !item.read
                            ? 'bg-luxury-surface-hover/80 border-luxury-border-strong shadow-subtle'
                            : 'bg-luxury-surface border-luxury-border hover:bg-luxury-surface-hover'
                        }`}
                      >
                        <div className="p-2 rounded-lg bg-luxury-surface border border-luxury-border text-luxury-ink shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs font-semibold text-luxury-ink tracking-tight truncate">
                              {item.title}
                            </h5>
                            <span className="text-[10px] text-luxury-muted shrink-0">
                              {item.time}
                            </span>
                          </div>
                          <p className="text-xs text-luxury-muted mt-1 leading-relaxed">
                            {item.description}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="subtle" size="sm">
                              {item.meta}
                            </Badge>
                            {!item.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}
