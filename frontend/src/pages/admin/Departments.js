import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { departmentAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', type: 'police', description: '', contactEmail: '', contactPhone: '' });

    const fetchDepts = () => departmentAPI.getAll().then(({ data }) => setDepartments(data.data)).catch(() => { }).finally(() => setLoading(false));

    useEffect(() => { fetchDepts(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await departmentAPI.create(form);
            toast.success('Department created');
            setShowForm(false);
            setForm({ name: '', type: 'police', description: '', contactEmail: '', contactPhone: '' });
            fetchDepts();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Deactivate this department?')) return;
        try { await departmentAPI.delete(id); toast.success('Deactivated'); fetchDepts(); }
        catch { toast.error('Failed'); }
    };

    const typeColors = { police: 'bg-red-100 text-red-700', municipal: 'bg-green-100 text-green-700', admin: 'bg-purple-100 text-purple-700' };

    return (
        <DashboardLayout>
            <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-900">Departments</h1>
                    <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">➕ New Department</button>
                </div>

                {showForm && (
                    <div className="card border-primary-200 bg-primary-50">
                        <h2 className="text-sm font-semibold text-primary-800 mb-3">Create Department</h2>
                        <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
                            <input required placeholder="Department name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field text-sm" />
                            <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input-field text-sm">
                                <option value="police">Police</option>
                                <option value="municipal">Municipal</option>
                                <option value="admin">Admin</option>
                            </select>
                            <input placeholder="Contact email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className="input-field text-sm" />
                            <input placeholder="Contact phone" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} className="input-field text-sm" />
                            <textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field text-sm col-span-2 resize-none" rows={2} />
                            <div className="col-span-2 flex gap-2">
                                <button type="submit" className="btn-primary text-sm">Create</button>
                                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {departments.map(d => (
                            <div key={d._id} className="card">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-base font-semibold text-gray-800">{d.name}</h3>
                                            <span className={`badge ${typeColors[d.type]}`}>{d.type}</span>
                                        </div>
                                        {d.description && <p className="text-xs text-gray-500 mb-2">{d.description}</p>}
                                        <div className="text-xs text-gray-400 space-y-0.5">
                                            {d.contactEmail && <p>✉ {d.contactEmail}</p>}
                                            {d.contactPhone && <p>📞 {d.contactPhone}</p>}
                                            <p>👮 {d.officers?.length || 0} officers · {d.isActive ? '🟢 Active' : '🔴 Inactive'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(d._id)} className="text-xs text-red-500 hover:text-red-700">Deactivate</button>
                                </div>
                            </div>
                        ))}
                        {departments.length === 0 && <p className="text-center text-gray-400 col-span-2 py-8">No departments yet</p>}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default Departments;
