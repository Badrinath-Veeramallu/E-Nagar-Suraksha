import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { userAPI, departmentAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ROLES = ['citizen', 'police', 'municipal', 'admin'];

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [showCreate, setShowCreate] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [newOfficer, setNewOfficer] = useState({ name: '', email: '', password: '', role: 'police', department: '', phone: '' });
    const LIMIT = 20;

    const fetchUsers = () => {
        const params = { page, limit: LIMIT, search: search || undefined };
        if (roleFilter !== 'all') params.role = roleFilter;
        setLoading(true);
        userAPI.getAll(params).then(({ data }) => { setUsers(data.data); setTotal(data.total); }).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(() => { fetchUsers(); }, [roleFilter, page, search]);
    useEffect(() => { departmentAPI.getAll().then(({ data }) => setDepartments(data.data)); }, []);

    const handleBlock = async (id, isBlocked) => {
        try {
            isBlocked ? await userAPI.unblock(id) : await userAPI.block(id);
            toast.success(isBlocked ? 'User unblocked' : 'User blocked');
            fetchUsers();
        } catch { toast.error('Failed'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this account? This cannot be undone.')) return;
        try { await userAPI.delete(id); toast.success('User deleted'); fetchUsers(); }
        catch { toast.error('Failed'); }
    };

    const handleCreateOfficer = async (e) => {
        e.preventDefault();
        try {
            await userAPI.createOfficer(newOfficer);
            toast.success('Officer account created');
            setShowCreate(false);
            setNewOfficer({ name: '', email: '', password: '', role: 'police', department: '', phone: '' });
            fetchUsers();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const roleColors = { citizen: 'bg-blue-100 text-blue-700', police: 'bg-red-100 text-red-700', municipal: 'bg-green-100 text-green-700', admin: 'bg-purple-100 text-purple-700' };

    return (
        <DashboardLayout>
            <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">User Management</h1>
                    <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-sm">➕ Create Officer</button>
                </div>

                {/* Create officer form */}
                {showCreate && (
                    <div className="card border-primary-200 bg-primary-50">
                        <h2 className="text-sm font-semibold text-primary-800 mb-3">Create Officer / Admin Account</h2>
                        <form onSubmit={handleCreateOfficer} className="grid grid-cols-2 gap-3">
                            <input required placeholder="Full name" value={newOfficer.name} onChange={e => setNewOfficer(o => ({ ...o, name: e.target.value }))} className="input-field text-sm" />
                            <input required type="email" placeholder="Email" value={newOfficer.email} onChange={e => setNewOfficer(o => ({ ...o, email: e.target.value }))} className="input-field text-sm" />
                            <input required type="password" placeholder="Password (min 8 chars)" value={newOfficer.password} onChange={e => setNewOfficer(o => ({ ...o, password: e.target.value }))} className="input-field text-sm" />
                            <input placeholder="Phone (optional)" value={newOfficer.phone} onChange={e => setNewOfficer(o => ({ ...o, phone: e.target.value }))} className="input-field text-sm" />
                            <select required value={newOfficer.role} onChange={e => setNewOfficer(o => ({ ...o, role: e.target.value }))} className="input-field text-sm">
                                <option value="police">Police Officer</option>
                                <option value="municipal">Municipal Officer</option>
                                <option value="admin">Admin</option>
                            </select>
                            <select value={newOfficer.department} onChange={e => setNewOfficer(o => ({ ...o, department: e.target.value }))} className="input-field text-sm">
                                <option value="">No Department</option>
                                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                            </select>
                            <div className="col-span-2 flex gap-2">
                                <button type="submit" className="btn-primary text-sm">Create Account</button>
                                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                    {['all', ...ROLES].map(r => (
                        <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${roleFilter === r ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                            {r === 'all' ? 'All' : r}
                        </button>
                    ))}
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or email..."
                        className="input-field text-sm w-48 py-1.5" />
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
                ) : (
                    <div className="card p-0 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    {['Name', 'Email', 'Role', 'Department', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(u => (
                                    <tr key={u._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-bold text-primary-700">{u.name?.[0]?.toUpperCase()}</span>
                                                </div>
                                                <span className="font-medium text-gray-800 truncate max-w-[120px]">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 truncate max-w-[160px]">{u.email}</td>
                                        <td className="px-4 py-3"><span className={`badge ${roleColors[u.role]} capitalize`}>{u.role}</span></td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{u.department?.name || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`badge ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {u.isBlocked ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleBlock(u._id, u.isBlocked)}
                                                    className={`text-xs px-2 py-1 rounded ${u.isBlocked ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'} transition-colors`}>
                                                    {u.isBlocked ? 'Unblock' : 'Block'}
                                                </button>
                                                {u.role !== 'admin' && (
                                                    <button onClick={() => handleDelete(u._id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 transition-colors">Delete</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && <p className="text-center text-gray-400 py-8">No users found</p>}
                    </div>
                )}

                {total > LIMIT && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">{total} total users</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3">← Prev</button>
                            <button onClick={() => setPage(p => p + 1)} disabled={page * LIMIT >= total} className="btn-secondary text-sm py-1.5 px-3">Next →</button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Users;
