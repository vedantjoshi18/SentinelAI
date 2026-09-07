import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  ShieldCheck,
  UserCheck,
  Lock,
  Unlock,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function UserManagementView() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 15;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm.trim();

      const [usersRes, statsRes] = await Promise.all([
        adminApi.getUsers(params),
        adminApi.getStats(),
      ]);

      if (usersRes.success) {
        setUsers(usersRes.users || []);
        setTotalUsers(usersRes.pagination?.total ?? (usersRes.users ? usersRes.users.length : 0));
        setTotalPages(usersRes.pagination?.totalPages ?? 1);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, limit, roleFilter, statusFilter, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    setError('');
    try {
      const res = await adminApi.updateRole(userId, newRole);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchUsers();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update role');
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    setError('');
    try {
      const res = await adminApi.updateStatus(userId, newStatus);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchUsers();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update status');
    }
  };

  const handleUnlock = async (userId) => {
    setError('');
    try {
      const res = await adminApi.unlockUser(userId);
      if (res.success) {
        setSuccessMsg('Account unlocked successfully');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchUsers();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to unlock account');
    }
  };

  const handleDelete = async (userId, email) => {
    if (!window.confirm('Are you sure you want to permanently delete user ' + email + '?')) {
      return;
    }
    setError('');
    try {
      const res = await adminApi.deleteUser(userId);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchUsers();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive User Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-blue-500/20 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-semibold">Total Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stats?.totalUsers ?? users.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Registered platform accounts</div>
        </div>

        <div className="bg-[#111827] border border-cyan-500/20 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-semibold">Admins</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono">
            {stats?.byRole?.ADMIN ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Full platform privileges</div>
        </div>

        <div className="bg-[#111827] border border-purple-500/20 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-semibold">SOC Analysts</span>
            <UserCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">
            {stats?.byRole?.ANALYST ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Threat triage & inspection</div>
        </div>

        <div className="bg-[#111827] border border-rose-500/20 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs uppercase font-semibold">Locked Accounts</span>
            <Lock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {stats?.totalLocked ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Brute-force lockout active</div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by user name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="ANALYST">ANALYST</option>
            <option value="USER">USER</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="locked">Locked</option>
          </select>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-3 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-300 hover:text-white transition flex items-center space-x-1.5 disabled:opacity-50"
        >
          <RefreshCw className={"w-3.5 h-3.5 " + (loading ? "animate-spin text-cyan-400" : "")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Failed Logins</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No users matching the active filters found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentUser?._id === u._id;
                  const isLocked =
                    u.status === 'locked' ||
                    (u.lockedUntil && new Date(u.lockedUntil) > new Date()) ||
                    u.failedLoginAttempts >= 5;

                  return (
                    <tr key={u._id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-medium text-white flex items-center space-x-2">
                        <span>{u.name}</span>
                        {isSelf && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            YOU
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-cyan-400 focus:outline-none focus:border-cyan-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="USER">USER</option>
                          <option value="ANALYST">ANALYST</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={u.status}
                          disabled={isSelf}
                          onChange={(e) => handleStatusChange(u._id, e.target.value)}
                          className={
                            "border rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed " +
                            (u.status === 'active'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : u.status === 'suspended'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400')
                          }
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="locked">Locked</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span
                          className={
                            "px-2 py-0.5 rounded-full font-bold " +
                            (u.failedLoginAttempts > 0
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'text-slate-500')
                          }
                        >
                          {u.failedLoginAttempts || 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {isLocked && (
                          <button
                            onClick={() => handleUnlock(u._id)}
                            title="Unlock Account"
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg transition inline-flex items-center space-x-1"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-semibold">Unlock</span>
                          </button>
                        )}
                        {!isSelf && (
                          <button
                            onClick={() => handleDelete(u._id, u.email)}
                            title="Delete User Account"
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg transition inline-flex items-center space-x-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {users.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(page * limit, totalUsers)} of {totalUsers} accounts
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-white px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
