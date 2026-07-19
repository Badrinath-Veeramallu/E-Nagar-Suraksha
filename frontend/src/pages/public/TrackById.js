import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { complaintAPI } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import Navbar from '../../components/Navbar';
import { format } from 'date-fns';

const TrackById = () => {
    const [complaintId, setComplaintId] = useState('');
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!complaintId.trim()) return;
        setLoading(true); setError(''); setComplaint(null);
        try {
            const { data } = await complaintAPI.search(complaintId.trim().toUpperCase());
            setComplaint(data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Complaint not found. Please check the ID and try again.');
        } finally { setLoading(false); }
    };

    const CATEGORY_LABELS = {
        road_issue: 'Road Issue', garbage: 'Garbage', water_supply: 'Water Supply',
        streetlight: 'Streetlight', security: 'Security', drainage: 'Drainage',
        noise: 'Noise', electrical: 'Electrical', sanitation: 'Sanitation', other: 'Other',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-12">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Complaint</h1>
                    <p className="text-gray-500">Enter your complaint ID to check its status</p>
                </div>

                <div className="card mb-6">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={complaintId}
                            onChange={(e) => setComplaintId(e.target.value)}
                            placeholder="e.g. ENS-2026-000001"
                            className="input-field flex-1"
                            id="complaint-id-input"
                        />
                        <button type="submit" disabled={loading} className="btn-primary flex-shrink-0">
                            {loading ? '⏳' : '🔍 Track'}
                        </button>
                    </form>
                </div>

                {error && (
                    <div className="card border-red-200 bg-red-50">
                        <p className="text-sm text-red-600 text-center">{error}</p>
                    </div>
                )}

                {complaint && (
                    <div className="card animate-fade-in">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-600">{complaint.complaintId}</code>
                                <h2 className="text-lg font-semibold text-gray-900 mt-1">{complaint.title}</h2>
                                <p className="text-sm text-gray-500">{CATEGORY_LABELS[complaint.category]} • {complaint.address}</p>
                            </div>
                            <StatusBadge status={complaint.status} />
                        </div>

                        {/* SLA info */}
                        {complaint.slaDueAt && !['resolved', 'closed'].includes(complaint.status) && (
                            <div className={`rounded-lg p-3 mb-4 text-sm ${complaint.slaBreached ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                                {complaint.slaBreached
                                    ? '⚠ SLA deadline has passed — complaint is overdue'
                                    : `⏱ Expected resolution by ${format(new Date(complaint.slaDueAt), 'dd MMM yyyy, hh:mm a')}`}
                            </div>
                        )}

                        {/* Timeline */}
                        {complaint.auditTrail?.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Complaint Timeline</h3>
                                <div className="relative space-y-4 before:absolute before:top-0 before:bottom-0 before:left-3 before:w-0.5 before:bg-gray-200">
                                    {complaint.auditTrail.map((entry, i) => (
                                        <div key={i} className="flex gap-4 relative pl-8">
                                            <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-primary-400 rounded-full flex-shrink-0 flex items-center justify-center">
                                                <div className="w-2 h-2 bg-primary-500 rounded-full" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-800 capitalize">{entry.action?.replace(/_/g, ' ')}</p>
                                                {entry.note && <p className="text-xs text-gray-500">{entry.note}</p>}
                                                <p className="text-xs text-gray-400 mt-0.5">{format(new Date(entry.timestamp), 'dd MMM yyyy, hh:mm a')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <p className="text-center text-sm text-gray-400 mt-6">
                    Are you a citizen?{' '}
                    <Link to="/login" className="text-primary-600 hover:underline">Sign in</Link> to track your complaints with full details.
                </p>
            </div>
        </div>
    );
};

export default TrackById;
