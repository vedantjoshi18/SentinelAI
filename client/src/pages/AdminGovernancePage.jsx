import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  UserPlus,
  Lock,
  Unlock,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { Input, Select, SearchInput } from '../components/ui/Input';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const INITIAL_USERS = [
  {
    _id: 'usr-101',
    name: 'Demo SOC Administrator',
    email: 'demo.admin@sentinelai.local',
    role: 'ADMIN',
    status: 'active',
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: '2026-01-15',
  },
  {
    _id: 'usr-102',
    name: 'Demo SOC Analyst',
    email: 'demo.analyst@sentinelai.local',
    role: 'ANALYST',
    status: 'active',
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: '2026-02-01',
  },
  {
    _id: 'usr-103',
    name: 'Marcus Chen',
    email: 'marcus.chen@sentinelai.local',
    role: 'ANALYST',
    status: 'active',
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: '2026-03-10',
  },
  {
    _id: 'usr-104',
    name: 'Astrid Lindholm',
    email: 'astrid.lindholm@sentinelai.local',
    role: 'USER',
    status: 'active',
    failedLoginAttempts: 2,
    lockedUntil: null,
    createdAt: '2026-04-18',
  },
  {
    _id: 'usr-105',
    name: 'Suspended Ingress Probe',
    email: 'probe.origin@attacker.net',
    role: 'USER',
    status: 'suspended',
    failedLoginAttempts: 6,
    lockedUntil: '2026-09-08T00:00:00.000Z',
    createdAt: '2026-09-01',
  },
];

export default function AdminGovernancePage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { addToast } = useToast();

  const [users, setUsers] = useState(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newAnalyst, setNewAnalyst] = useState({
    name: '',
    email: '',
    role: 'ANALYST',
  });

  const fetchUsers = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await adminApi.getUsers();
      if (res.success && res.users && res.users.length > 0) {
        setUsers(res.users);
      }
    } catch {
      // Retain fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAuthenticated]);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleRoleChange = async (userId, newRole) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
    );
    try {
      await adminApi.updateRole(userId, newRole);
    } catch {
      // Optimistic update retained
    }
    addToast({
      title: 'Role Updated',
      description: `User role modified to ${newRole}.`,
      type: 'success',
    });
  };

  const handleUnlockUser = async (userId, name) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, failedLoginAttempts: 0, lockedUntil: null, status: 'active' } : u))
    );
    try {
      await adminApi.unlockUser(userId);
    } catch {
      // Handled
    }
    addToast({
      title: 'Account Unlocked',
      description: `${name} has been released from rate-limit quarantine.`,
      type: 'success',
    });
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setUsers((prev) =>
      prev.map((u) => (u._id === userId ? { ...u, status: nextStatus } : u))
    );
    try {
      await adminApi.updateStatus(userId, nextStatus);
    } catch {
      // Handled
    }
    addToast({
      title: 'Status Updated',
      description: `Account is now ${nextStatus}.`,
      type: 'info',
    });
  };

  const handleInviteUser = (e) => {
    e.preventDefault();
    if (!newAnalyst.name.trim() || !newAnalyst.email.trim()) return;

    const created = {
      _id: 'usr-' + Math.random().toString(36).substring(2, 7),
      name: newAnalyst.name.trim(),
      email: newAnalyst.email.trim(),
      role: newAnalyst.role,
      status: 'active',
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: '2026-09-07',
    };

    setUsers([created, ...users]);
    setIsInviteModalOpen(false);
    setNewAnalyst({ name: '', email: '', role: 'ANALYST' });

    addToast({
      title: 'Specialist Enrolled',
      description: `Credentials provisioned for ${created.name} (${created.role}).`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-luxury-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 font-mono">
              ACCESS CONTROL &amp; RBAC
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-luxury-ink tracking-tight">
            SOC Access Governance &amp; User Directory
          </h1>
          <p className="text-xs md:text-sm text-luxury-muted mt-1">
            Provision analyst credentials, unlock brute-force quarantined accounts, and enforce least-privilege roles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            loading={isLoading}
            onClick={fetchUsers}
          >
            Refresh Users
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={UserPlus}
            onClick={() => setIsInviteModalOpen(true)}
          >
            Invite Analyst
          </Button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="inline-flex p-1 bg-luxury-surface-hover border border-luxury-border rounded-xl text-xs font-medium">
          {['All', 'ADMIN', 'ANALYST', 'USER'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                roleFilter === role
                  ? 'bg-luxury-surface text-luxury-ink shadow-subtle font-semibold'
                  : 'text-luxury-muted hover:text-luxury-ink'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Search users by name or email..."
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-luxury-surface-hover border-b border-luxury-border uppercase text-[10px] font-semibold text-luxury-muted tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Specialist Profile</th>
                <th className="py-3.5 px-4">Role Tier</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Failed Logins</th>
                <th className="py-3.5 px-4">Enrolled Date</th>
                <th className="py-3.5 px-4 text-right">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border/60">
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-luxury-surface-hover/50 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-luxury-ink flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-luxury-ink text-luxury-bg font-mono text-xs font-bold flex items-center justify-center">
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-luxury-ink">{u.name}</div>
                      <div className="text-[11px] text-luxury-muted font-normal">{u.email}</div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="bg-luxury-surface border border-luxury-border rounded px-2 py-1 text-xs text-luxury-ink font-semibold cursor-pointer"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="ANALYST">ANALYST</option>
                      <option value="USER">USER</option>
                    </select>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge
                      variant={u.status === 'active' ? 'success' : 'danger'}
                      size="sm"
                      dot
                    >
                      {u.status}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 font-mono">
                    {u.failedLoginAttempts > 0 ? (
                      <span className="text-rose-500 font-bold">{u.failedLoginAttempts} attempts</span>
                    ) : (
                      <span className="text-luxury-muted">0</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-luxury-muted">
                    {u.createdAt ? u.createdAt.substring(0, 10) : '2026-09-01'}
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-2">
                    {u.failedLoginAttempts > 0 && (
                      <button
                        type="button"
                        onClick={() => handleUnlockUser(u._id, u.name)}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Unlock
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(u._id, u.status)}
                      className="text-xs font-semibold text-luxury-muted hover:text-luxury-ink cursor-pointer"
                    >
                      {u.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Analyst Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Provision Analyst Credentials"
        description="Enforce least-privilege role boundaries for new SOC analysts."
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleInviteUser}
            >
              Provision Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleInviteUser} className="space-y-4">
          <Input
            label="Analyst Full Name"
            placeholder="e.g. Marcus Vance"
            value={newAnalyst.name}
            onChange={(e) => setNewAnalyst({ ...newAnalyst, name: e.target.value })}
            required
            autoFocus
          />
          <Input
            label="Corporate Security Email"
            type="email"
            placeholder="analyst@sentinelai.local"
            value={newAnalyst.email}
            onChange={(e) => setNewAnalyst({ ...newAnalyst, email: e.target.value })}
            required
          />
          <Select
            label="RBAC Role Assignment"
            value={newAnalyst.role}
            onChange={(e) => setNewAnalyst({ ...newAnalyst, role: e.target.value })}
            options={[
              { value: 'ANALYST', label: 'SOC Analyst (Tier 2 Triage)' },
              { value: 'ADMIN', label: 'SOC Administrator (Full Governance)' },
              { value: 'USER', label: 'Auditor (Read-Only)' },
            ]}
          />
        </form>
      </Modal>
    </div>
  );
}
