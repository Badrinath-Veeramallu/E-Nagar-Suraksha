import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const Analytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminAPI.getAnalytics().then(({ data }) => setData(data.data)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const CATEGORY_LABELS = { road_issue: 'Road Issue', garbage: 'Garbage', water_supply: 'Water Supply', streetlight: 'Streetlight', security: 'Security', drainage: 'Drainage', noise: 'Noise', electrical: 'Electrical', sanitation: 'Sanitation', other: 'Other' };
    const CATEGORY_ICONS = { road_issue: '🛣️', garbage: '🗑️', water_supply: '💧', streetlight: '💡', security: '🚨', drainage: '🌊', noise: '🔊', electrical: '⚡', sanitation: '🧹', other: '📝' };

    if (loading) return <DashboardLayout><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></DashboardLayout>;

    const byCategory = data?.byCategory || {};
    const totalCat = Object.values(byCategory).reduce((a, b) => a + b, 0) || 1;

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>

                {/* KPI row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Avg Resolution Time', value: data?.avgResolutionTimeHours ? `${data.avgResolutionTimeHours}h` : 'N/A', icon: '⏱️', color: 'border-blue-500' },
                        { label: 'Avg Satisfaction', value: data?.feedback?.avgRating ? `${parseFloat(data.feedback.avgRating).toFixed(1)} ⭐` : 'N/A', icon: '😊', color: 'border-yellow-500' },
                        { label: 'Feedback Count', value: data?.feedback?.count || 0, icon: '💬', color: 'border-green-500' },
                        { label: 'Departments', value: data?.byDepartment?.length || 0, icon: '🏢', color: 'border-purple-500' },
                    ].map(({ label, value, icon, color }) => (
                        <div key={label} className={`card border-l-4 ${color}`}>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                        </div>
                    ))}
                </div>

                {/* Complaints by category */}
                <div className="card">
                    <h2 className="text-base font-semibold text-gray-800 mb-4">Complaints by Category</h2>
                    <div className="space-y-3">
                        {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, count]) => {
                            const pct = Math.round((count / totalCat) * 100);
                            return (
                                <div key={cat} className="flex items-center gap-3">
                                    <span className="text-lg w-7 flex-shrink-0">{CATEGORY_ICONS[cat] || '📝'}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">{CATEGORY_LABELS[cat] || cat}</span>
                                            <span className="text-sm text-gray-500">{count} ({pct}%)</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {Object.keys(byCategory).length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data yet</p>}
                    </div>
                </div>

                {/* By Department */}
                {data?.byDepartment?.length > 0 && (
                    <div className="card">
                        <h2 className="text-base font-semibold text-gray-800 mb-4">Complaints by Department</h2>
                        <div className="space-y-3">
                            {data.byDepartment.map((d) => (
                                <div key={d._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">🏢 {d.name}</span>
                                    <span className="badge bg-blue-100 text-blue-700">{d.count} complaints</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Monthly trend */}
                {data?.monthlyTrend?.length > 0 && (
                    <div className="card">
                        <h2 className="text-base font-semibold text-gray-800 mb-4">Monthly Trend (Last 12 Months)</h2>
                        <div className="flex items-end gap-2 h-32">
                            {data.monthlyTrend.map((m, i) => {
                                const max = Math.max(...data.monthlyTrend.map(x => x.count));
                                const height = max > 0 ? (m.count / max) * 100 : 0;
                                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                        <span className="text-xs text-gray-500">{m.count}</span>
                                        <div className="w-full bg-primary-500 rounded-t-sm transition-all opacity-80 hover:opacity-100" style={{ height: `${height}%`, minHeight: '2px' }} />
                                        <span className="text-xs text-gray-400">{months[(m._id.month - 1)]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Analytics;
