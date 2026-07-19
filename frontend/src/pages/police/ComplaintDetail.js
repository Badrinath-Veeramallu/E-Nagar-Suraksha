import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { complaintAPI } from '../../services/api';
import { StatusBadge, PriorityBadge, SlaBadge } from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// Statuses officers can set directly (no proof needed)
const STATUSES_POLICE = ['assigned', 'in_progress', 'resolved'];
const STATUSES_MUNICIPAL = ['assigned', 'in_progress']; // resolved only via proof modal

// ── Municipal Proof-Upload Modal ──────────────────────────────────────────────
const MunicipalResolveModal = ({ complaintId, onClose, onSuccess }) => {
    const [proofFiles, setProofFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [fieldError, setFieldError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 5);
        setProofFiles(files);
        setFieldError('');
        previews.forEach(URL.revokeObjectURL);          // cleanup old
        setPreviews(files.map(f => URL.createObjectURL(f)));
    };

    // Cleanup object URLs when modal unmounts
    useEffect(() => () => previews.forEach(URL.revokeObjectURL), []); // eslint-disable-line

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (proofFiles.length === 0) {
            setFieldError('Proof image is required to mark this complaint as resolved.');
            fileInputRef.current?.focus();
            return;
        }
        setSubmitting(true);
        try {
            const formData = new FormData();
            proofFiles.forEach(f => formData.append('proofImages', f));
            formData.append('note', remarks.trim() || 'Resolved by municipal officer');
            await complaintAPI.uploadProof(complaintId, formData);
            toast.success('✅ Complaint resolved with proof submitted!');
            onSuccess();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to submit proof. Please try again.';
            setFieldError(msg);
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

                {/* Modal header */}
                <div className="bg-gradient-to-r from-emerald-600 to-green-500 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-white font-bold text-lg">📸 Submit Resolution Proof</h2>
                        <p className="text-emerald-100 text-xs mt-0.5">Photo required to mark this complaint as Resolved</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="text-white/80 hover:text-white text-2xl leading-none font-light transition-colors"
                        aria-label="Close modal"
                    >✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* File Drop Zone */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Proof Photo <span className="text-red-500">*</span>
                            <span className="text-xs font-normal text-gray-400 ml-1">(jpg, png, webp — up to 5 files)</span>
                        </label>
                        <div
                            onClick={() => !submitting && fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${fieldError ? 'border-red-400 bg-red-50'
                                    : proofFiles.length ? 'border-emerald-400 bg-emerald-50'
                                        : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
                                }`}
                        >
                            {proofFiles.length === 0 ? (
                                <>
                                    <div className="text-4xl mb-2">📷</div>
                                    <p className="text-sm font-medium text-gray-600">Click to upload proof image(s)</p>
                                    <p className="text-xs text-gray-400 mt-1">JPG · PNG · WEBP</p>
                                </>
                            ) : (
                                <p className="text-sm font-semibold text-emerald-700">
                                    ✅ {proofFiles.length} file{proofFiles.length > 1 ? 's' : ''} selected — click to change
                                </p>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {fieldError && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">⚠ {fieldError}</p>
                        )}
                    </div>

                    {/* Preview grid */}
                    {previews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {previews.map((src, i) => (
                                <div key={i} className="relative">
                                    <img
                                        src={src}
                                        alt={`Preview ${i + 1}`}
                                        className="w-full h-24 object-cover rounded-lg border-2 border-emerald-200"
                                    />
                                    <span className="absolute top-1 right-1 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{i + 1}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Remarks */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Resolution Remarks <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                            placeholder="Describe what was done to resolve this complaint..."
                            className="input-field text-sm resize-none"
                            rows={3}
                            disabled={submitting}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 btn-secondary text-sm py-2.5"
                        >Cancel</button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 btn-primary text-sm py-2.5 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 disabled:opacity-60"
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                                        <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" className="opacity-75" />
                                    </svg>
                                    Submitting…
                                </span>
                            ) : '✅ Submit Proof & Mark Resolved'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ── Main Officer Complaint Detail ─────────────────────────────────────────────
const OfficerComplaintDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isMunicipal = user?.role === 'municipal';

    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [comment, setComment] = useState('');
    const [showProofModal, setShowProofModal] = useState(false);
    const BASE_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

    // Municipal users only see assigned/in_progress buttons; police see all + resolved
    const STATUSES = isMunicipal ? STATUSES_MUNICIPAL : STATUSES_POLICE;

    const refetch = () =>
        complaintAPI.getById(id).then(({ data }) => {
            setComplaint(data.data);
            setStatus(data.data.status);
        });

    useEffect(() => {
        setError(null);
        refetch().catch(err => {
            const msg = err.response?.status === 404
                ? 'Complaint not found. It may have been removed or the ID is invalid.'
                : (err.response?.data?.message || 'Failed to load complaint. Please try again.');
            setError(msg);
        }).finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleStatusUpdate = async () => {
        // Safety net: municipal must never bypass the modal for resolve
        if (isMunicipal && status === 'resolved') {
            setShowProofModal(true);
            return;
        }
        setSubmitting(true);
        try {
            await complaintAPI.updateStatus(id, { status, note });
            toast.success('Status updated');
            setNote('');
            refetch();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        try {
            await complaintAPI.addComment(id, { text: comment, isInternal: false });
            toast.success('Comment added');
            setComment('');
            refetch();
        } catch { toast.error('Failed'); }
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        </DashboardLayout>
    );

    if (error || !complaint) return (
        <DashboardLayout>
            <div className="max-w-lg mx-auto mt-16 text-center animate-fade-in">
                <div className="card p-10">
                    <div className="text-6xl mb-4">🔍</div>
                    <h1 className="text-xl font-bold text-gray-800 mb-2">Complaint Not Found</h1>
                    <p className="text-gray-500 text-sm mb-6">
                        {error || 'The complaint does not exist or you do not have permission to view it.'}
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => navigate(-1)} className="btn-secondary text-sm">← Go Back</button>
                        <button
                            onClick={() => {
                                setLoading(true); setError(null);
                                refetch().catch(e => setError(e.response?.data?.message || 'Failed')).finally(() => setLoading(false));
                            }}
                            className="btn-primary text-sm"
                        >Retry</button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            {/* Proof modal — renders above everything */}
            {showProofModal && (
                <MunicipalResolveModal
                    complaintId={id}
                    onClose={() => setShowProofModal(false)}
                    onSuccess={() => { setShowProofModal(false); refetch(); }}
                />
            )}

            <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">

                {/* ── Complaint header ── */}
                <div className="card">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-500">{complaint.complaintId}</code>
                            <h1 className="text-xl font-bold text-gray-900 mt-1">{complaint.title}</h1>
                            <p className="text-sm text-gray-500">📍 {complaint.address}</p>
                            {complaint.citizen?.name && (
                                <p className="text-xs text-gray-400 mt-0.5">Submitted by: {complaint.citizen.name}</p>
                            )}
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
                    {complaint.images?.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-4">
                            {complaint.images.map((img, i) => (
                                <img key={i} src={`${BASE_URL}${img}`} alt="Complaint" className="rounded-lg object-cover h-24 w-full" />
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Resolution proof display ── */}
                {complaint.resolutionProof?.images?.length > 0 && (
                    <div className="card border-emerald-200 bg-emerald-50">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">✅</span>
                            <h2 className="text-sm font-semibold text-emerald-800">Resolution Proof</h2>
                            {complaint.resolutionProof.submittedAt && (
                                <span className="text-xs text-emerald-600 ml-auto">
                                    {format(new Date(complaint.resolutionProof.submittedAt), 'dd MMM yyyy, hh:mm a')}
                                </span>
                            )}
                        </div>
                        {complaint.resolutionProof.note && (
                            <p className="text-sm text-emerald-700 mb-3 italic">"{complaint.resolutionProof.note}"</p>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                            {complaint.resolutionProof.images.map((img, i) => (
                                <a key={i} href={`${BASE_URL}${img}`} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={`${BASE_URL}${img}`}
                                        alt={`Proof ${i + 1}`}
                                        className="rounded-lg object-cover h-28 w-full border-2 border-emerald-200 hover:border-emerald-400 transition-colors cursor-zoom-in"
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Status update panel ── */}
                {complaint.status !== 'closed' && (
                    <div className="card">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3">Update Status</h2>

                        {/* Municipal info banner */}
                        {isMunicipal && complaint.status !== 'resolved' && (
                            <div className="mb-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                                <span>📸</span>
                                <span>To mark this as <strong>Resolved</strong>, use the <strong>"Resolve with Proof"</strong> button — a photo is mandatory.</span>
                            </div>
                        )}

                        <div className="flex gap-2 mb-2 flex-wrap">
                            {STATUSES.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatus(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${status === s
                                            ? 'bg-primary-600 text-white border-primary-600'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {s.replace('_', ' ')}
                                </button>
                            ))}

                            {/* Dedicated "Resolve with Proof" button for municipal */}
                            {isMunicipal && !['resolved', 'closed'].includes(complaint.status) && (
                                <button
                                    onClick={() => setShowProofModal(true)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 transition-colors"
                                >
                                    📸 Resolve with Proof
                                </button>
                            )}
                        </div>

                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Add a note about this status change..."
                            className="input-field text-sm resize-none mb-2"
                            rows={2}
                        />
                        <button
                            onClick={handleStatusUpdate}
                            disabled={submitting || (isMunicipal && status === 'resolved')}
                            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Updating...' : 'Update Status'}
                        </button>
                        {isMunicipal && status === 'resolved' && (
                            <p className="text-xs text-amber-600 mt-2">
                                ⚠ Use "📸 Resolve with Proof" to mark as resolved — direct resolve is not allowed for municipal complaints.
                            </p>
                        )}
                    </div>
                )}

                {/* ── Activity Timeline ── */}
                {complaint.auditTrail?.length > 0 && (
                    <div className="card">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Activity Timeline</h2>
                        <div className="relative space-y-4 before:absolute before:top-0 before:bottom-0 before:left-3 before:w-0.5 before:bg-gray-200">
                            {[...complaint.auditTrail].reverse().map((entry, i) => (
                                <div key={i} className="flex gap-4 relative pl-8">
                                    <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-primary-400 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-primary-500 rounded-full" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800 capitalize">{entry.action?.replace(/_/g, ' ')}</p>
                                        {entry.performedByName && <p className="text-xs text-gray-500">By {entry.performedByName}</p>}
                                        {entry.note && <p className="text-xs text-gray-400 italic">{entry.note}</p>}
                                        <p className="text-xs text-gray-400">{format(new Date(entry.timestamp), 'dd MMM yyyy, hh:mm a')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Comments ── */}
                <div className="card">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">Comments</h2>
                    <div className="space-y-3 mb-3">
                        {complaint.comments?.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-3">No comments yet</p>
                        )}
                        {complaint.comments?.map((c, i) => (
                            <div key={i} className={`flex gap-3 ${c.isInternal ? 'opacity-70' : ''}`}>
                                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-semibold">{c.author?.name?.[0]?.toUpperCase()}</span>
                                </div>
                                <div className={`rounded-lg p-2.5 flex-1 text-sm ${c.isInternal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                                    <p className="text-xs font-semibold text-gray-600">
                                        {c.author?.name} {c.isInternal && <span className="text-yellow-600">(Internal)</span>}
                                    </p>
                                    <p className="text-gray-700 mt-0.5">{c.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleComment} className="flex gap-2">
                        <input
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="input-field text-sm flex-1"
                        />
                        <button type="submit" className="btn-primary text-sm flex-shrink-0">Send</button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default OfficerComplaintDetail;
