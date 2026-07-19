import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { complaintAPI } from '../../services/api';
import { StatusBadge, PriorityBadge, SlaBadge } from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const StarRating = ({ value, onChange }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button" onClick={() => onChange(n)}
                className={`text-2xl transition-transform hover:scale-110 ${n <= value ? 'text-yellow-400' : 'text-gray-300'}`}>★</button>
        ))}
    </div>
);

const ComplaintDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [comment, setComment] = useState('');
    const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
    const [showFeedback, setShowFeedback] = useState(false);
    const [showReopen, setShowReopen] = useState(false);
    const [reopenReason, setReopenReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        setError(null);
        complaintAPI.getById(id)
            .then(({ data }) => setComplaint(data.data))
            .catch((err) => {
                const msg = err.response?.status === 404
                    ? 'This complaint was not found. It may have been removed or the link is invalid.'
                    : (err.response?.data?.message || 'Failed to load complaint. Please try again.');
                setError(msg);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleUpvote = async () => {
        try {
            const { data } = await complaintAPI.upvote(id);
            toast.success(data.upvoted ? 'Upvoted!' : 'Upvote removed');
            setComplaint(prev => ({ ...prev, upvoteCount: data.upvoteCount }));
        } catch { toast.error('Failed to upvote'); }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        try {
            await complaintAPI.addComment(id, { text: comment });
            toast.success('Comment added');
            setComment('');
            const { data } = await complaintAPI.getById(id);
            setComplaint(data.data);
        } catch { toast.error('Failed to add comment'); }
    };

    const handleFeedback = async (e) => {
        e.preventDefault();
        if (feedback.rating === 0) { toast.error('Please select a rating'); return; }
        setSubmitting(true);
        try {
            await complaintAPI.submitFeedback(id, feedback);
            toast.success('Thank you for your feedback! Complaint closed.');
            setShowFeedback(false);
            const { data } = await complaintAPI.getById(id);
            setComplaint(data.data);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSubmitting(false); }
    };

    const handleReopen = async () => {
        setSubmitting(true);
        try {
            await complaintAPI.reopen(id, { reason: reopenReason });
            toast.success('Complaint reopened');
            setShowReopen(false);
            const { data } = await complaintAPI.getById(id);
            setComplaint(data.data);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSubmitting(false); }
    };

    if (loading) return <DashboardLayout><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></DashboardLayout>;

    if (error || !complaint) return (
        <DashboardLayout>
            <div className="max-w-lg mx-auto mt-16 text-center animate-fade-in">
                <div className="card p-10">
                    <div className="text-6xl mb-4">🔍</div>
                    <h1 className="text-xl font-bold text-gray-800 mb-2">Complaint Not Found</h1>
                    <p className="text-gray-500 text-sm mb-6">
                        {error || 'The complaint you are looking for does not exist or you do not have permission to view it.'}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => navigate(-1)} className="btn-secondary text-sm">← Go Back</button>
                        <button onClick={() => navigate('/citizen/complaints')} className="btn-primary text-sm">My Complaints</button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
                {/* Header */}
                <div className="card">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-500">{complaint.complaintId}</code>
                            <h1 className="text-xl font-bold text-gray-900 mt-1">{complaint.title}</h1>
                            <p className="text-sm text-gray-500 mt-0.5">📍 {complaint.address}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <StatusBadge status={complaint.status} />
                            <PriorityBadge priority={complaint.priority} status={complaint.status} />
                            <SlaBadge slaDueAt={complaint.slaDueAt} status={complaint.status} />
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 leading-relaxed">{complaint.description}</p>
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        <span>📅 {format(new Date(complaint.createdAt), 'dd MMM yyyy, hh:mm a')}</span>
                        {complaint.assignedDepartment && <span>🏢 {complaint.assignedDepartment.name}</span>}
                        {complaint.assignedOfficer && <span>👤 {complaint.assignedOfficer.name}</span>}
                        <button onClick={handleUpvote} className="flex items-center gap-1 hover:text-primary-600 transition-colors">
                            👍 {complaint.upvoteCount || 0} upvotes
                        </button>
                    </div>
                </div>

                {/* Images */}
                {complaint.images?.length > 0 && (
                    <div className="card">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Attached Photos</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {complaint.images.map((img, i) => (
                                <img key={i} src={`${BASE_URL}${img}`} alt={`Complaint photo ${i + 1}`} className="rounded-lg object-cover h-24 w-full cursor-pointer hover:opacity-90 transition-opacity" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Resolution proof */}
                {complaint.resolutionProof?.images?.length > 0 && (
                    <div className="card border-green-200 bg-green-50">
                        <h3 className="text-sm font-semibold text-green-800 mb-2">✅ Resolution Proof</h3>
                        {complaint.resolutionProof.note && <p className="text-sm text-green-700 mb-3">{complaint.resolutionProof.note}</p>}
                        <div className="grid grid-cols-3 gap-2">
                            {complaint.resolutionProof.images.map((img, i) => (
                                <img key={i} src={`${BASE_URL}${img}`} alt="Proof" className="rounded-lg object-cover h-24 w-full" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Citizen actions */}
                {complaint.status === 'resolved' && !complaint.feedback?.rating && (
                    <div className="card border-primary-200 bg-primary-50">
                        <p className="text-sm font-semibold text-primary-800 mb-3">This complaint is resolved. How was the response?</p>
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => setShowFeedback(true)} className="btn-primary text-sm">⭐ Rate & Close</button>
                            <button onClick={() => setShowReopen(true)} className="btn-secondary text-sm text-red-600 border-red-200">🔄 Reopen</button>
                        </div>
                    </div>
                )}

                {complaint.feedback?.rating && (
                    <div className="card bg-yellow-50 border-yellow-200">
                        <p className="text-sm font-semibold text-yellow-800">Your Feedback</p>
                        <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map(n => <span key={n} className={n <= complaint.feedback.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>)}
                        </div>
                        {complaint.feedback.comment && <p className="text-xs text-yellow-700 mt-1">{complaint.feedback.comment}</p>}
                    </div>
                )}

                {/* Feedback modal */}
                {showFeedback && (
                    <div className="card border-primary-300 bg-white shadow-lg">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Rate the Resolution</h3>
                        <form onSubmit={handleFeedback} className="space-y-3">
                            <StarRating value={feedback.rating} onChange={(v) => setFeedback(f => ({ ...f, rating: v }))} />
                            <textarea value={feedback.comment} onChange={e => setFeedback(f => ({ ...f, comment: e.target.value }))}
                                placeholder="Optional feedback comment..." className="input-field text-sm resize-none" rows={3} />
                            <div className="flex gap-2">
                                <button type="submit" disabled={submitting} className="btn-primary text-sm">
                                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                                <button type="button" onClick={() => setShowFeedback(false)} className="btn-secondary text-sm">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Reopen modal */}
                {showReopen && (
                    <div className="card border-red-200 bg-white shadow-lg">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Why are you reopening?</h3>
                        <textarea value={reopenReason} onChange={e => setReopenReason(e.target.value)}
                            placeholder="The issue was not actually resolved because..." className="input-field text-sm resize-none" rows={3} />
                        <div className="flex gap-2 mt-3">
                            <button onClick={handleReopen} disabled={submitting} className="btn-danger text-sm">
                                {submitting ? 'Reopening...' : 'Reopen Complaint'}
                            </button>
                            <button onClick={() => setShowReopen(false)} className="btn-secondary text-sm">Cancel</button>
                        </div>
                    </div>
                )}

                {/* Timeline */}
                {complaint.auditTrail?.length > 0 && (
                    <div className="card">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Complaint Timeline</h3>
                        <div className="relative space-y-4 before:absolute before:top-0 before:bottom-0 before:left-3 before:w-0.5 before:bg-gray-200">
                            {[...complaint.auditTrail].reverse().map((entry, i) => (
                                <div key={i} className="flex gap-4 relative pl-8">
                                    <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-primary-400 rounded-full flex-shrink-0 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-primary-500 rounded-full" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800 capitalize">{entry.action?.replace(/_/g, ' ')}</p>
                                        {entry.performedByName && <p className="text-xs text-gray-500">By {entry.performedByName}</p>}
                                        {entry.note && <p className="text-xs text-gray-400 italic">{entry.note}</p>}
                                        <p className="text-xs text-gray-400 mt-0.5">{format(new Date(entry.timestamp), 'dd MMM yyyy, hh:mm a')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Comments */}
                <div className="card">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Comments</h3>
                    {complaint.comments?.filter(c => !c.isInternal).length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No comments yet</p>
                    ) : (
                        <div className="space-y-3 mb-4">
                            {complaint.comments?.filter(c => !c.isInternal).map((c, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-semibold text-gray-600">{c.author?.name?.[0]?.toUpperCase()}</span>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2.5 flex-1">
                                        <p className="text-xs font-semibold text-gray-700">{c.author?.name} <span className="text-gray-400 font-normal capitalize">({c.author?.role})</span></p>
                                        <p className="text-sm text-gray-700 mt-0.5">{c.text}</p>
                                        <p className="text-xs text-gray-400 mt-1">{format(new Date(c.createdAt), 'dd MMM, hh:mm a')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <form onSubmit={handleComment} className="flex gap-2">
                        <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." className="input-field text-sm flex-1" />
                        <button type="submit" className="btn-primary text-sm flex-shrink-0">Send</button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ComplaintDetail;
