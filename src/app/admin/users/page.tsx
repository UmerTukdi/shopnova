'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  ShieldCheck,
  UserCheck,
  Search,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface UserAccount {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success && data.data?.users) {
        setUsers(data.data.users);
      } else {
        setError(data.message || 'Failed to fetch user accounts');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async (targetUser: UserAccount) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';

    if (targetUser._id === currentAdmin?.id && newRole === 'user') {
      alert('You cannot demote your own active admin account.');
      return;
    }

    if (!confirm(`Are you sure you want to change ${targetUser.name}'s role to "${newRole.toUpperCase()}"?`)) {
      return;
    }

    try {
      setUpdatingId(targetUser._id);
      const res = await fetch(`/api/admin/users/${targetUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.message || 'Failed to update role');
      }
    } catch (err) {
      console.error('Error toggling role:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-500" /> Account Directory & Roles
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage registered customer accounts and delegate Administrator permissions</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm">Fetching user accounts...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-300 rounded-2xl text-center">
          {error}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold">No accounts found matching search</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Contact Phone</th>
                  <th className="px-4 py-3.5">Joined Date</th>
                  <th className="px-4 py-3.5">Database Role</th>
                  <th className="px-4 py-3.5 text-right">Role Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-100">{u.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">{u.phone || '—'}</td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5">
                      {u.role === 'admin' ? (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 w-fit">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> ADMIN
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-950 text-slate-400 border border-slate-800 flex items-center gap-1.5 w-fit">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500" /> CUSTOMER
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        disabled={updatingId === u._id || (u._id === currentAdmin?.id && u.role === 'admin')}
                        onClick={() => handleToggleRole(u)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 ml-auto ${
                          u.role === 'admin'
                            ? 'bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                        }`}
                      >
                        {updatingId === u._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : u.role === 'admin' ? (
                          'Demote to User'
                        ) : (
                          'Promote to Admin'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
