import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { complaintAPI } from '../../services/api';
import { StatusBadge, PriorityBadge, SlaBadge } from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const STATUSES = ['all', 'submitted', 'assigned', 'in_progress', 'escalated', 'resolved'];

const OfficerComplaintList = ({ role }) => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 15;

    useEffect(() => {
        setLoading(true);
        const params = { page, limit: LIMIT };
        if (statusFilter !== 'all') params.status = statusFilter;
        complaintAPI.getAll(params).then(({ data }) => {
            setComplaints(data.data);
            setTotal(data.total);
        }).catch(() => { }).finally(() => setLoading(false));
    }, [statusFilter, page]);

    return (
        <DashboardLayout>
            <div className="space-y-5 animate-fade-in">
                <h1 className="text-xl font-bold text-gray-900">Assigned Complaints</h1>

                <div className="flex gap-2 overflow-x-auto pb-1">
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
                    <div className="card text-center py-12"><p className="text-gray-400">No complaints found</p></div>
                ) : (
                    <div className="space-y-3">
                        {complaints.map(c => (
                            <Link key={c._id} to={`/${role}/complaints/${c._id}`}
                                className="card flex gap-4 hover:shadow-md transition-all group p-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 truncate">{c.title}</p>
                                        <div className="flex gap-1.5 flex-shrink-0 flex-wrap">
                                            <StatusBadge status={c.status} />
                                            <PriorityBadge priority={c.priority} status={c.status} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 truncate">📍 {c.address}</p>
                                    <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-gray-400">
                                        <code className="font-mono">{c.complaintId}</code>
                                        <SlaBadge slaDueAt={c.slaDueAt} status={c.status} />
                                        <span>{format(new Date(c.createdAt), 'dd MMM yyyy')}</span>
                                        {c.citizen?.name && <span>By: {c.citizen.name}</span>}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {total > LIMIT && (
                    <div className="flex items-center justify-between pt-2">
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

export const PoliceComplaintList = () => <OfficerComplaintList role="police" />;
export const MunicipalComplaintList = () => <OfficerComplaintList role="municipal" />;

export default OfficerComplaintList;
