import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { complaintAPI } from '../../services/api';
import { StatusBadge, PriorityBadge, SlaBadge } from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { format } from 'date-fns';

const CATEGORY_ICONS = { road_issue: '🛣️', garbage: '🗑️', water_supply: '💧', streetlight: '💡', security: '🚨', drainage: '🌊', noise: '🔊', electrical: '⚡', sanitation: '🧹', other: '📝' };
const STATUSES = ['all', 'submitted', 'pending_review', 'assigned', 'in_progress', 'escalated', 'resolved', 'closed'];

const MyComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 10;

    useEffect(() => {
        setLoading(true);
        const params = { page, limit: LIMIT };
        if (statusFilter !== 'all') params.status = statusFilter;
        complaintAPI.getMy(params).then(({ data }) => {
            setComplaints(data.data);
            setTotal(data.total);
        }).catch(() => { }).finally(() => setLoading(false));
    }, [statusFilter, page]);

    return (
        <DashboardLayout>
            <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">My Complaints</h1>
                    <Link to="/citizen/submit" className="btn-primary text-sm">➕ New Complaint</Link>
                </div>

                {/* Status filters */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {STATUSES.map(s => (
                        <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                            {s === 'all' ? 'All' : s.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
                ) : complaints.length === 0 ? (
                    <div className="card text-center py-12">
                        <div className="text-5xl mb-3">📭</div>
                        <p className="text-gray-500 font-medium">No complaints found</p>
                        <Link to="/citizen/submit" className="btn-primary mt-4 text-sm">Submit a Complaint</Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {complaints.map(c => (
                            <Link key={c._id} to={`/citizen/complaints/${c._id}`}
                                className="card flex gap-4 hover:shadow-md transition-all group p-4">
                                <span className="text-2xl flex-shrink-0 mt-0.5">{CATEGORY_ICONS[c.category]}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 truncate">{c.title}</p>
                                        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                                            <StatusBadge status={c.status} />
                                            <PriorityBadge priority={c.priority} status={c.status} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 truncate">📍 {c.address}</p>
                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                        <code className="text-xs text-gray-400 font-mono">{c.complaintId}</code>
                                        <SlaBadge slaDueAt={c.slaDueAt} status={c.status} />
                                        <span className="text-xs text-gray-400">{format(new Date(c.createdAt), 'dd MMM yyyy')}</span>
                                    </div>
                                    {c.assignedOfficer && (
                                        <p className="text-xs text-gray-400 mt-1">👤 Assigned: {c.assignedOfficer.name}</p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {total > LIMIT && (
                    <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-gray-500">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</p>
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

export default MyComplaints;
