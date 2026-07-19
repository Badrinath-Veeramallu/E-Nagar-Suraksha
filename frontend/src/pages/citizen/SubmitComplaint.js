import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import MapPicker from '../../components/MapPicker';
import { complaintAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const CATEGORIES = [
    { value: 'road_issue', label: '🛣️ Road Issue' }, { value: 'garbage', label: '🗑️ Garbage' },
    { value: 'water_supply', label: '💧 Water Supply' }, { value: 'streetlight', label: '💡 Streetlight' },
    { value: 'security', label: '🚨 Security' }, { value: 'drainage', label: '🌊 Drainage' },
    { value: 'noise', label: '🔊 Noise' }, { value: 'electrical', label: '⚡ Electrical Issue' },
    { value: 'sanitation', label: '🧹 Sanitation' }, { value: 'other', label: '📝 Other' },
];

// Security = Police dept (photo optional); everything else = Municipal dept (photo mandatory)
const POLICE_CATEGORIES = ['security'];

const SubmitComplaint = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [form, setForm] = useState({ category: '', title: '', description: '', address: '', latitude: '', longitude: '', consentGiven: false });
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const [duplicates, setDuplicates] = useState([]);
    const [step, setStep] = useState(1);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleLocationSelect = useCallback(({ lat, lng, address }) => {
        setForm(prev => ({ ...prev, latitude: lat, longitude: lng, address: address || prev.address }));
    }, []);

    const checkDuplicates = async () => {
        if (!form.category || !form.latitude || !form.longitude) return;
        try {
            const { data } = await complaintAPI.checkDuplicates({ category: form.category, latitude: form.latitude, longitude: form.longitude });
            setDuplicates(data.data);
        } catch { }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.consentGiven) { toast.error('You must provide consent to submit'); return; }
        if (!form.latitude || !form.longitude) { toast.error('Please select a location on the map'); return; }

        // Photo is mandatory for all municipal (non-security) complaints
        const isMunicipal = form.category && !POLICE_CATEGORIES.includes(form.category);
        if (isMunicipal && images.length === 0) {
            toast.error('📸 Photo is required for municipal complaints. Please upload at least one image.');
            setErrors(['Photo is required for municipal complaints. Please upload at least one image.']);
            return;
        }

        setLoading(true); setErrors([]);

        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => formData.append(k, v));
        images.forEach(img => formData.append('images', img));

        try {
            const { data } = await complaintAPI.create(formData);
            toast.success(`Complaint submitted! ID: ${data.data.complaintId}`);
            navigate('/citizen/complaints');
        } catch (err) {
            const apiErrors = err.response?.data?.errors || [];
            const msg = err.response?.data?.message || 'Submission failed';
            setErrors(apiErrors.length ? apiErrors.map(e => e.message) : [msg]);
            toast.error(msg);
        } finally { setLoading(false); }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-xl">➕</div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{t('complaint.submit')}</h1>
                        <p className="text-sm text-gray-500">Fill out all details accurately for faster resolution</p>
                    </div>
                </div>

                {/* Step indicator */}
                <div className="flex gap-2 mb-6">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-primary-600' : 'bg-gray-200'}`} />
                    ))}
                </div>

                {errors.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        {errors.map((e, i) => <p key={i} className="text-sm text-red-600">• {e}</p>)}
                    </div>
                )}

                {/* Duplicate warning */}
                {duplicates.length > 0 && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-sm font-semibold text-amber-800 mb-2">⚠ {t('complaint.duplicate')}</p>
                        {duplicates.map(d => (
                            <div key={d._id} className="flex items-center justify-between text-xs text-amber-700 py-1">
                                <span>{d.title} — <code>{d.complaintId}</code></span>
                                <span className="capitalize">{d.status.replace('_', ' ')}</span>
                            </div>
                        ))}
                        <p className="text-xs text-amber-600 mt-2">You can continue submitting or upvote the existing one instead.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="card space-y-4">
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Step 1: Complaint Details</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('complaint.category')} *</label>
                            <select name="category" required value={form.category} onChange={e => { handleChange(e); setTimeout(checkDuplicates, 100); }}
                                className="input-field">
                                <option value="">Select a category</option>
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('complaint.title')} *</label>
                            <input name="title" type="text" required value={form.title} onChange={handleChange} maxLength={200}
                                className="input-field" placeholder="Brief title of the issue" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('complaint.description')} *</label>
                            <textarea name="description" required value={form.description} onChange={handleChange}
                                rows={4} maxLength={2000} className="input-field resize-none"
                                placeholder="Describe the problem in detail (minimum 20 characters)..." />
                            <p className="text-xs text-gray-400 mt-1">{form.description.length}/2000</p>
                        </div>
                    </div>

                    <div className="card space-y-4">
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Step 2: Location</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address / Landmark *</label>
                            <input name="address" type="text" required value={form.address} onChange={handleChange}
                                className="input-field" placeholder="Auto-filled from map or type manually" />
                        </div>
                        <MapPicker onLocationSelect={handleLocationSelect} initialLat={form.latitude} initialLng={form.longitude} />
                    </div>

                    <div className="card space-y-4">
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Step 3: Photos &amp; Consent</h2>
                        <div>
                            {/* Dynamic label based on category */}
                            {form.category && (
                                POLICE_CATEGORIES.includes(form.category) ? (
                                    <div className="mb-2 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                        <span>🚔</span>
                                        <span><strong>Police complaint</strong> — photo is <strong>optional</strong> but recommended.</span>
                                    </div>
                                ) : (
                                    <div className="mb-2 flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                        <span>📸</span>
                                        <span><strong>Photo is required</strong> for municipal complaints. Upload at least one image.</span>
                                    </div>
                                )
                            )}
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Upload Photos
                                {form.category && !POLICE_CATEGORIES.includes(form.category)
                                    ? <span className="text-red-500 ml-1">* (required)</span>
                                    : <span className="text-gray-400 ml-1">(optional, max 5)</span>
                                }
                            </label>
                            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setImages(Array.from(e.target.files).slice(0, 5))}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                            {images.length > 0 && <p className="text-xs text-green-600 mt-1">✅ {images.length} file(s) selected</p>}
                            {form.category && !POLICE_CATEGORIES.includes(form.category) && images.length === 0 && (
                                <p className="text-xs text-red-500 mt-1">⚠ Please upload at least one photo before submitting.</p>
                            )}
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <input type="checkbox" id="consent" name="consentGiven" checked={form.consentGiven} onChange={handleChange}
                                className="mt-0.5 h-4 w-4 text-primary-600 rounded border-gray-300" />
                            <label htmlFor="consent" className="text-xs text-gray-600 leading-relaxed">{t('complaint.consent')}</label>
                        </div>
                    </div>

                    <button type="submit" disabled={loading || !form.consentGiven}
                        className="btn-primary w-full py-3 text-base font-semibold">
                        {loading ? '⏳ Submitting...' : `🚀 ${t('complaint.submitBtn')}`}
                    </button>
                </form>
            </div>
        </DashboardLayout>
    );
};

export default SubmitComplaint;
