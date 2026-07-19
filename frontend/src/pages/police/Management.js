import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { userAPI, departmentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
    name: '', email: '', password: '', phone: '',
    station: '', designation: '', department: '',
};

const PoliceManagement = () => {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'admin';
    const [officers, setOfficers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 15;

    const fetchOfficers = () => {
        setLoading(true);
        userAPI.getAll({ role: 'police', page, limit: LIMIT, search: search || undefined })
            .then(({ data }) => { setOfficers(data.data); setTotal(data.total); })
            .catch(() => toast.error('Failed to load officers'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchOfficers(); }, [page, search]);
    useEffect(() => {
        departmentAPI.getAll()
            .then(({ data }) => setDepartments(data.data))
            .catch(() => { });
    }, []);

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    const handleCreate = async (e) => {
        e.preventDefault();
        if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
        setSubmitting(true);
        try {
            await userAPI.createOfficer({ ...form, role: 'police' });
            toast.success(`Police officer "${form.name}" created successfully!`);
            setShowCreate(false);
            setForm(EMPTY_FORM);
            fetchOfficers();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create officer');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBlock = async (id, isBlocked) => {
        try {
            isBlocked ? await userAPI.unblock(id) : await userAPI.block(id);
            toast.success(isBlocked ? 'Officer unblocked' : 'Officer blocked');
            fetchOfficers();
        } catch { toast.error('Failed'); }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete officer "${name}"? This cannot be undone.`)) return;
        try { await userAPI.delete(id); toast.success('Officer deleted'); fetchOfficers(); }
        catch { toast.error('Failed'); }
    };

    return (
        <DashboardLayout>
            <div className="space-y-5 animate-fade-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-700 to-red-600 rounded-2xl p-6 text-white">
                    <p className="text-sm font-medium opacity-80">🚔 Police Management</p>
                    <h1 className="text-xl font-bold mt-1">Police Officer Directory</h1>
                    <p className="text-sm opacity-75 mt-0.5">View, create, and manage police officer accounts</p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search officers..."
                            className="input-field text-sm w-52 py-2"
                        />
                        <span className="text-sm text-gray-500">{total} total</span>
                    </div>
                    <button onClick={() => setShowCreate(s => !s)} className="btn-primary text-sm">
                        {showCreate ? '✕ Cancel' : '➕ Add Officer'}
                    </button>
                </div>

                {/* Create Form */}
                {showCreate && (
                    <div className="card border-red-200 bg-red-50 animate-fade-in">
                        <h2 className="text-sm font-semibold text-red-800 mb-4">👮 Create New Police Officer Account</h2>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">Full Name *</label>
                                <input required placeholder="e.g. Ravi Kumar" value={form.name} onChange={set('name')} className="input-field text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">Email *</label>
                                <input required type="email" placeholder="officer@police.gov.in" value={form.email} onChange={set('email')} className="input-field text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">Password * (min 8 chars)</label>
                                <input required type="password" placeholder="••••••••" value={form.password} onChange={set('password')} className="input-field text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">Phone Number</label>
                                <input placeholder="10-digit mobile" value={form.phone} onChange={set('phone')} className="input-field text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">Station / Area</label>
                                <input placeholder="e.g. Banjara Hills Police Station" value={form.station} onChange={set('station')} className="input-field text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">Designation / Rank</label>
                                <input placeholder="e.g. Sub-Inspector" value={form.designation} onChange={set('designation')} className="input-field text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">Department (optional)</label>
                                <select value={form.department} onChange={set('department')} className="input-field text-sm">
                                    <option value="">No Department</option>
                                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="sm:col-span-2 flex gap-2 pt-1">
                                <button type="submit" disabled={submitting} className="btn-primary text-sm">
                                    {submitting ? 'Creating...' : '✅ Create Officer Account'}
                                </button>
                                <button type="button" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }} className="btn-secondary text-sm">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Officers Table */}
                {loading ? (
                    <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
                ) : officers.length === 0 ? (
                    <div className="card text-center py-12">
                        <div className="text-4xl mb-3">👮</div>
                        <p className="text-gray-500 font-medium">No police officers found</p>
                        <p className="text-gray-400 text-sm mt-1">Click "Add Officer" to create the first one</p>
                    </div>
                ) : (
                    <div className="card p-0 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    {['Officer', 'Contact', 'Station', 'Designation', 'Dept', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {officers.map(u => (
                                    <tr key={u._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-bold text-red-700">{u.name?.[0]?.toUpperCase()}</span>
                                                </div>
                                                <span className="font-medium text-gray-800 truncate max-w-[120px]">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">
                                            <p>{u.email}</p>
                                            {u.phone && <p className="text-gray-400">{u.phone}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-[120px]">{u.station || '—'}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{u.designation || '—'}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{u.department?.name || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`badge text-xs ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {u.isBlocked ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1.5">
                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={() => handleBlock(u._id, u.isBlocked)}
                                                            className={`text-xs px-2 py-1 rounded transition-colors ${u.isBlocked ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'}`}
                                                        >
                                                            {u.isBlocked ? 'Unblock' : 'Block'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(u._id, u.name)}
                                                            className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                                {!isAdmin && (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {total > LIMIT && (
                    <div className="flex items-center justify-between pt-1">
                        <p className="text-sm text-gray-500">Page {page} · {total} officers</p>
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

export default PoliceManagement;
