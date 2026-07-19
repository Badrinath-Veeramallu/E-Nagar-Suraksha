import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { complaintAPI } from '../../services/api';
import { StatusBadge, PriorityBadge, SlaBadge } from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const StatCard = ({ label, value, icon, color }) => (
    <div className={`card border-l-4 ${color}`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
            <span className="text-3xl">{icon}</span>
        </div>
    </div>
);

const CitizenDashboard = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        complaintAPI.getMy({ limit: 10 }).then(({ data }) => {
            setComplaints(data.data);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const stats = {
        total: complaints.length,
        active: complaints.filter(c => !['resolved', 'closed'].includes(c.status)).length,
        resolved: complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length,
        escalated: complaints.filter(c => c.status === 'escalated').length,
    };

    const CATEGORY_ICONS = { road_issue: '🛣️', garbage: '🗑️', water_supply: '💧', streetlight: '💡', security: '🚨', drainage: '🌊', noise: '🔊', electrical: '⚡', sanitation: '🧹', other: '📝' };

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                {/* Welcome */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
                    <h1 className="text-xl font-bold">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
                    <p className="text-primary-100 text-sm mt-1">Track your complaints and make your city better.</p>
                    <Link to="/citizen/submit" className="inline-flex items-center gap-2 mt-4 bg-white text-primary-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-primary-50 transition-colors">
                        ➕ Submit New Complaint
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Submitted" value={stats.total} icon="📋" color="border-blue-500" />
                    <StatCard label="Active" value={stats.active} icon="⏳" color="border-yellow-500" />
                    <StatCard label="Resolved" value={stats.resolved} icon="✅" color="border-green-500" />
                    <StatCard label="Escalated" value={stats.escalated} icon="🔺" color="border-red-500" />
                </div>

                {/* Recent Complaints */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">My Complaints</h2>
                        <Link to="/citizen/complaints" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View all →</Link>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8"><LoadingSpinner /></div>
                    ) : complaints.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="text-4xl mb-3">📭</div>
                            <p className="text-gray-500 text-sm">No complaints submitted yet.</p>
                            <Link to="/citizen/submit" className="btn-primary mt-4 text-sm">Submit Your First Complaint</Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {complaints.slice(0, 5).map((c) => (
                                <Link key={c._id} to={`/citizen/complaints/${c._id}`}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100 group">
                                    <span className="text-2xl flex-shrink-0">{CATEGORY_ICONS[c.category]}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-primary-600">{c.title}</p>
                                            <StatusBadge status={c.status} />
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <code className="text-xs text-gray-400 font-mono">{c.complaintId}</code>
                                            <PriorityBadge priority={c.priority} status={c.status} />
                                            <SlaBadge slaDueAt={c.slaDueAt} status={c.status} />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">{format(new Date(c.createdAt), 'dd MMM yyyy')}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Track */}
                <div className="card bg-gray-50 border-dashed">
                    <p className="text-sm font-medium text-gray-600 mb-2">🔍 Quick Track by ID</p>
                    <div className="flex gap-2">
                        <input id="quick-track-input" type="text" placeholder="ENS-2026-000001" className="input-field text-sm" />
                        <Link to="/track" className="btn-secondary text-sm flex-shrink-0">Track</Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CitizenDashboard;
