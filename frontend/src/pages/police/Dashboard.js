import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { complaintAPI } from '../../services/api';
import { StatusBadge, PriorityBadge, SlaBadge } from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const OfficerDashboard = ({ role }) => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        complaintAPI.getAll({ limit: 20 }).then(({ data }) => setComplaints(data.data)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const stats = {
        total: complaints.length,
        active: complaints.filter(c => ['assigned', 'in_progress'].includes(c.status)).length,
        escalated: complaints.filter(c => c.status === 'escalated').length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
    };

    const roleConfig = {
        police: { icon: '🚔', color: 'from-red-700 to-red-600', label: 'Police' },
        municipal: { icon: '🏗️', color: 'from-emerald-700 to-emerald-600', label: 'Municipal' },
    };
    const cfg = roleConfig[role] || roleConfig.municipal;

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className={`bg-gradient-to-r ${cfg.color} rounded-2xl p-6 text-white`}>
                    <p className="text-sm font-medium opacity-80">{cfg.icon} {cfg.label} Officer Portal</p>
                    <h1 className="text-xl font-bold mt-1">Welcome, {user?.name?.split(' ')[0]}!</h1>
                    <p className="text-sm opacity-75 mt-0.5">Review and resolve assigned complaints</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Assigned', value: stats.total, color: 'border-blue-500' },
                        { label: 'Active', value: stats.active, color: 'border-yellow-500' },
                        { label: 'Escalated', value: stats.escalated, color: 'border-red-500' },
                        { label: 'Resolved', value: stats.resolved, color: 'border-green-500' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className={`card border-l-4 ${color}`}>
                            <p className="text-xs text-gray-500 font-medium">{label}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-gray-800">Assigned Complaints</h2>
                        <Link to={`/${role}/complaints`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all →</Link>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-8"><LoadingSpinner /></div>
                    ) : complaints.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">No complaints assigned yet</p>
                    ) : (
                        <div className="space-y-3">
                            {complaints.slice(0, 6).map(c => (
                                <Link key={c._id} to={`/${role}/complaints/${c._id}`}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100 group transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 flex-wrap">
                                            <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-primary-600">{c.title}</p>
                                            <div className="flex gap-1.5 flex-shrink-0">
                                                <StatusBadge status={c.status} />
                                                <PriorityBadge priority={c.priority} status={c.status} />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {c.address}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <code className="text-xs text-gray-400 font-mono">{c.complaintId}</code>
                                            <SlaBadge slaDueAt={c.slaDueAt} status={c.status} />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export const PoliceDashboard = () => <OfficerDashboard role="police" />;
export const MunicipalDashboard = () => <OfficerDashboard role="municipal" />;

export default OfficerDashboard;
