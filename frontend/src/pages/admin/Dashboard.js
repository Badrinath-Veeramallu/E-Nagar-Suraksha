import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useSocket } from '../../context/SocketContext';

const StatCard = ({ label, value, icon, sub, color, to }) => {
    const card = (
        <div className={`card border-l-4 ${color} hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                </div>
                <span className="text-3xl opacity-60">{icon}</span>
            </div>
        </div>
    );
    return to ? <Link to={to}>{card}</Link> : card;
};

const AdminDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { on, off } = useSocket() || {};

    const fetchData = () => adminAPI.getDashboard().then(({ data }) => setData(data.data)).catch(() => { }).finally(() => setLoading(false));

    useEffect(() => { fetchData(); }, []);

    // Refresh dashboard on real-time events
    useEffect(() => {
        if (!on || !off) return;
        const refresh = () => fetchData();
        on('new_complaint', refresh);
        on('complaint_updated', refresh);
        return () => { off('new_complaint', refresh); off('complaint_updated', refresh); };
    }, [on, off]);

    if (loading) return <DashboardLayout><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></DashboardLayout>;

    const sb = data?.statusBreakdown || {};
    const uc = data?.userCounts || {};

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="bg-gradient-to-r from-indigo-700 to-purple-700 rounded-2xl p-6 text-white">
                    <p className="text-sm opacity-80">⚙️ Admin Control Center</p>
                    <h1 className="text-2xl font-bold mt-1">e-Nagar Suraksha</h1>
                    <p className="text-indigo-200 text-sm mt-0.5">Real-time civic complaint management platform</p>
                </div>

                {/* Alert banner */}
                {(data?.slaBreach > 0 || data?.escalated > 0) && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="text-sm font-semibold text-red-800">Action Required</p>
                            <p className="text-xs text-red-600">
                                {data.slaBreach > 0 && `${data.slaBreach} SLA breach(es) `}
                                {data.escalated > 0 && `• ${data.escalated} escalated complaint(s)`}
                            </p>
                        </div>
                        <Link to="/admin/complaints?escalated=true" className="ml-auto text-xs text-red-700 font-medium hover:underline">View →</Link>
                    </div>
                )}

                {/* Main stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Complaints" value={data?.total} icon="📋" color="border-blue-500" to="/admin/complaints" />
                    <StatCard label="Resolved Today" value={data?.resolvedToday} icon="✅" color="border-green-500" />
                    <StatCard label="SLA Breaches" value={data?.slaBreach} icon="⏰" color="border-red-500" to="/admin/complaints?slaBreached=true" />
                    <StatCard label="Escalated" value={data?.escalated} icon="🔺" color="border-orange-500" to="/admin/complaints?escalated=true" />
                </div>

                {/* Status breakdown */}
                <div className="card">
                    <h2 className="text-base font-semibold text-gray-800 mb-4">Complaints by Status</h2>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {[
                            ['Submitted', sb.submitted, 'bg-blue-100 text-blue-700'],
                            ['Pending', sb.pending_review, 'bg-yellow-100 text-yellow-700'],
                            ['In Progress', sb.in_progress, 'bg-purple-100 text-purple-700'],
                            ['Resolved', sb.resolved, 'bg-green-100 text-green-700'],
                            ['Closed', sb.closed, 'bg-gray-100 text-gray-600'],
                        ].map(([label, val, cls]) => (
                            <div key={label} className={`rounded-lg p-3 text-center ${cls}`}>
                                <p className="text-xl font-bold">{val || 0}</p>
                                <p className="text-xs font-medium mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Users & quick links */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="card">
                        <h2 className="text-base font-semibold text-gray-800 mb-3">User Overview</h2>
                        <div className="space-y-2">
                            {[
                                ['👤 Citizens', uc.citizen, 'bg-blue-50'],
                                ['🚔 Police Officers', uc.police, 'bg-red-50'],
                                ['🏗️ Municipal Officers', uc.municipal, 'bg-emerald-50'],
                                ['⚙️ Admins', uc.admin, 'bg-purple-50'],
                            ].map(([label, val, bg]) => (
                                <div key={label} className={`flex items-center justify-between px-3 py-2 rounded-lg ${bg}`}>
                                    <span className="text-sm font-medium text-gray-700">{label}</span>
                                    <span className="text-sm font-bold text-gray-900">{val || 0}</span>
                                </div>
                            ))}
                        </div>
                        <Link to="/admin/users" className="btn-secondary w-full mt-3 text-sm">Manage Users →</Link>
                    </div>

                    <div className="card">
                        <h2 className="text-base font-semibold text-gray-800 mb-3">Quick Actions</h2>
                        <div className="space-y-2">
                            {[
                                ['/admin/complaints', '📋 All Complaints'],
                                ['/admin/analytics', '📊 View Analytics'],
                                ['/admin/departments', '🏢 Manage Departments'],
                                ['/admin/audit-logs', '🔍 Audit Logs'],
                            ].map(([to, label]) => (
                                <Link key={to} to={to} className="btn-secondary w-full text-sm justify-start gap-2">{label}</Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
