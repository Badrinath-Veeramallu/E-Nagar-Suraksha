import axios from 'axios';

const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
    withCredentials: true,
});

// Attach JWT to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 globally — dispatch custom event so AuthContext does a clean logout
const PUBLIC_PATHS = ['/login', '/register', '/clerk-callback', '/'];
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const isPublicPage = PUBLIC_PATHS.some(p => window.location.pathname.startsWith(p));
            // Only dispatch if we had a token AND we're not already on a public/auth page
            if (localStorage.getItem('token') && !isPublicPage) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.dispatchEvent(new Event('auth:logout'));
            }
        }
        return Promise.reject(error);
    }
);

// ── Auth ──────────────────────────────────────
export const authAPI = {
    register: (data) => API.post('/auth/register', data),
    login: (data) => API.post('/auth/login', data),
    clerkSync: (clerkToken, userData) => API.post('/auth/clerk-sync', userData, {
        headers: { Authorization: `Bearer ${clerkToken}` },
    }),
    getMe: () => API.get('/auth/me'),
    logout: () => API.post('/auth/logout'),
};

// ── Complaints ────────────────────────────────
export const complaintAPI = {
    create: (formData) => API.post('/complaints', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    getMy: (params) => API.get('/complaints/my', { params }),
    getAll: (params) => API.get('/complaints/all', { params }),
    getById: (id) => API.get(`/complaints/${id}`),
    search: (complaintId) => API.get('/complaints/search', { params: { complaintId } }),
    updateStatus: (id, data) => API.put(`/complaints/${id}/update-status`, data),
    assign: (id, data) => API.post(`/complaints/${id}/assign`, data),
    uploadProof: (id, formData) => API.post(`/complaints/${id}/proof`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    submitFeedback: (id, data) => API.post(`/complaints/${id}/feedback`, data),
    reopen: (id, data) => API.post(`/complaints/${id}/reopen`, data),
    upvote: (id) => API.post(`/complaints/${id}/upvote`),
    addComment: (id, data) => API.post(`/complaints/${id}/comment`, data),
    checkDuplicates: (params) => API.get('/complaints/duplicates/check', { params }),
};

// ── Notifications ─────────────────────────────
export const notificationAPI = {
    getMy: (params) => API.get('/notifications/my', { params }),
    markRead: (id) => API.put(`/notifications/${id}/read`),
    markAllRead: () => API.put('/notifications/read-all'),
};

// ── Users ─────────────────────────────────────
export const userAPI = {
    getAll: (params) => API.get('/users', { params }),
    getById: (id) => API.get(`/users/${id}`),
    createOfficer: (data) => API.post('/users/create-officer', data),
    block: (id) => API.put(`/users/${id}/block`),
    unblock: (id) => API.put(`/users/${id}/unblock`),
    delete: (id) => API.delete(`/users/${id}`),
    updateProfile: (data) => API.put('/users/profile', data),
};

// ── Admin ─────────────────────────────────────
export const adminAPI = {
    getDashboard: () => API.get('/admin/dashboard'),
    getAnalytics: () => API.get('/admin/analytics'),
    getAuditLogs: (params) => API.get('/admin/audit-logs', { params }),
};

// ── Departments ───────────────────────────────
export const departmentAPI = {
    getAll: () => API.get('/departments'),
    create: (data) => API.post('/departments', data),
    update: (id, data) => API.put(`/departments/${id}`, data),
    delete: (id) => API.delete(`/departments/${id}`),
};

export default API;
