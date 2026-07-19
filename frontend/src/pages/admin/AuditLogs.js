import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { format } from 'date-fns';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [actionFilter, setActionFilter] = useState('');
    const LIMIT = 30;

    const COMMON_ACTIONS = ['user_login', 'user_registered', 'complaint_created', 'complaint_assigned', 'status_updated', 'officer_account_created', 'user_blocked', 'user_unblocked', 'complaint_auto_escalated'];
    const ACTION_COLORS = { user_login: 'bg-blue-100 text-blue-700', user_blocked: 'bg-red-100 text-red-700', complaint_auto_escalated: 'bg-orange-100 text-orange-700', complaint_assigned: 'bg-indigo-100 text-indigo-700', status_updated: 'bg-purple-100 text-purple-700' };

    useEffect(() => {
        setLoading(true);
        const params = { page, limit: LIMIT };
        if (actionFilter) params.action = actionFilter;
        adminAPI.getAuditLogs(params).then(({ data }) => { setLogs(data.data); setTotal(data.total); }).catch(() => { }).finally(() => setLoading(false));
    }, [page, actionFilter]);

    return (
        <DashboardLayout>
            <div className="space-y-5 animate-fade-in">
                <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>

                <div className="flex gap-2 flex-wrap">
                    <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} className="input-field text-sm w-56">
                        <option value="">All Actions</option>
                        {COMMON_ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                    </select>
                    <p className="text-sm text-gray-400 self-center">{total} total records</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
                ) : (
                    <div className="card p-0 overflow-x-auto">
                        <table className="w-full text-sm min-w-[600px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    {['Time', 'Actor', 'Role', 'Action', 'Target', 'IP'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.map(log => (
                                    <tr key={log._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{format(new Date(log.createdAt), 'dd MMM, HH:mm')}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800 max-w-[130px] truncate">{log.actorName || log.actor?.name || 'System'}</td>
                                        <td className="px-4 py-3"><span className="text-xs text-gray-500 capitalize">{log.actorRole}</span></td>
                                        <td className="px-4 py-3">
                                            <span className={`badge text-xs ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                                                {log.action?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{log.targetIdentifier || log.targetType || '—'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.ipAddress || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {logs.length === 0 && <p className="text-center text-gray-400 py-8">No audit logs found</p>}
                    </div>
                )}

                {total > LIMIT && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Page {page}</span>
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

export default AuditLogs;
