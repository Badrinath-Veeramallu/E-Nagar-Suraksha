import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { complaintAPI, departmentAPI, userAPI } from '../../services/api';
import { StatusBadge, PriorityBadge, SlaBadge } from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AdminComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [escalatedOnly, setEscalatedOnly] = useState(false);
    const [slaOnly, setSlaOnly] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [selected, setSelected] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [assignDept, setAssignDept] = useState('');
    const [assignOfficer, setAssignOfficer] = useState('');
    const LIMIT = 20;
    const STATUSES = ['all', 'submitted', 'pending_review', 'assigned', 'in_progress', 'escalated', 'resolved', 'closed'];

    const fetchComplaints = () => {
        setLoading(true);
        const params = { page, limit: LIMIT };
        if (statusFilter !== 'all') params.status = statusFilter;
        if (escalatedOnly) params.escalated = true;
        if (slaOnly) params.slaBreached = true;
        if (search) params.search = search;
        complaintAPI.getAll(params).then(({ data }) => { setComplaints(data.data); setTotal(data.total); }).catch(() => { }).finally(() => setLoading(false));
    };

    useEffect(() => { fetchComplaints(); }, [statusFilter, escalatedOnly, slaOnly, search, page]);
    useEffect(() => {
        departmentAPI.getAll().then(({ data }) => setDepartments(data.data));
        userAPI.getAll({ role: 'police', limit: 50 }).then(({ data }) => setOfficers(o => [...data.data]));
        userAPI.getAll({ role: 'municipal', limit: 50 }).then(({ data }) => setOfficers(o => [...o, ...data.data]));
    }, []);

    const handleAssign = async () => {
        if (!selected) return;
        try {
            await complaintAPI.assign(selected._id, { departmentId: assignDept || undefined, officerId: assignOfficer || undefined });
            toast.success('Complaint assigned');
            setSelected(null); setAssignDept(''); setAssignOfficer('');
            fetchComplaints();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    return (
        <DashboardLayout>
            <div className="space-y-5 animate-fade-in">
                <h1 className="text-xl font-bold text-gray-900">All Complaints</h1>

                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                    {STATUSES.map(s => (
                        <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                            {s === 'all' ? 'All' : s.replace('_', ' ')}
                        </button>
                    ))}
                    <button onClick={() => setEscalatedOnly(e => !e)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${escalatedOnly ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                        🔺 Escalated
                    </button>
                    <button onClick={() => setSlaOnly(s => !s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${slaOnly ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200'}`}>
                        ⏰ SLA Breach
                    </button>
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search..."
                        className="input-field text-sm w-44 py-1.5" />
                </div>

                {/* Assign panel */}
                {selected && (
                    <div className="card border-indigo-200 bg-indigo-50">
                        <p className="text-sm font-semibold text-indigo-800 mb-2">Assign: {selected.complaintId}</p>
                        <div className="flex gap-2 flex-wrap items-end">
                            <select value={assignDept} onChange={e => setAssignDept(e.target.value)} className="input-field text-sm w-44">
                                <option value="">Select Department</option>
                                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                            </select>
                            <select value={assignOfficer} onChange={e => setAssignOfficer(e.target.value)} className="input-field text-sm w-44">
                                <option value="">Select Officer</option>
                                {officers.map(o => <option key={o._id} value={o._id}>{o.name} ({o.role})</option>)}
                            </select>
                            <button onClick={handleAssign} className="btn-primary text-sm">Assign</button>
                            <button onClick={() => setSelected(null)} className="btn-secondary text-sm">Cancel</button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
                ) : (
                    <div className="card p-0 overflow-x-auto">
                        <table className="w-full text-sm min-w-[700px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    {['ID', 'Title', 'Category', 'Status', 'Priority', 'SLA', 'Submitted', 'Actions'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {complaints.map(c => (
                                    <tr key={c._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3"><code className="text-xs text-gray-500 font-mono">{c.complaintId}</code></td>
                                        <td className="px-4 py-3 max-w-[180px] truncate font-medium text-gray-800">{c.title}</td>
                                        <td className="px-4 py-3 text-gray-500 capitalize text-xs">{c.category?.replace('_', ' ')}</td>
                                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                                        <td className="px-4 py-3"><PriorityBadge priority={c.priority} status={c.status} /></td>
                                        <td className="px-4 py-3"><SlaBadge slaDueAt={c.slaDueAt} status={c.status} /></td>
                                        <td className="px-4 py-3 text-xs text-gray-400">{format(new Date(c.createdAt), 'dd MMM')}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => setSelected(c)} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded transition-colors">
                                                Assign
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {complaints.length === 0 && <p className="text-center text-gray-400 py-8">No complaints found</p>}
                    </div>
                )}

                {total > LIMIT && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">{total} total</p>
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

export default AdminComplaints;
