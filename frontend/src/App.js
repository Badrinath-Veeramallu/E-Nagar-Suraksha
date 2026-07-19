import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

const CLERK_PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

// Lazy load pages
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const TrackById = lazy(() => import('./pages/public/TrackById'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ClerkCallback = lazy(() => import('./pages/auth/ClerkCallback'));

const CitizenDashboard = lazy(() => import('./pages/citizen/Dashboard'));
const SubmitComplaint = lazy(() => import('./pages/citizen/SubmitComplaint'));
const MyComplaints = lazy(() => import('./pages/citizen/MyComplaints'));
const ComplaintDetail = lazy(() => import('./pages/citizen/ComplaintDetail'));

const PoliceDashboard = lazy(() => import('./pages/police/Dashboard').then(m => ({ default: m.PoliceDashboard })));
const PoliceComplaintList = lazy(() => import('./pages/police/ComplaintList').then(m => ({ default: m.PoliceComplaintList })));
const PoliceComplaintDetail = lazy(() => import('./pages/police/ComplaintDetail'));
const PoliceManagement = lazy(() => import('./pages/police/Management'));

const MunicipalDashboard = lazy(() => import('./pages/municipal/Dashboard'));
const MunicipalComplaintList = lazy(() => import('./pages/municipal/ComplaintList'));
const MunicipalComplaintDetail = lazy(() => import('./pages/municipal/ComplaintDetail'));
const MunicipalManagement = lazy(() => import('./pages/municipal/Management'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminComplaints = lazy(() => import('./pages/admin/Complaints'));
const AdminDepartments = lazy(() => import('./pages/admin/Departments'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AuditLogs'));

// Protected route wrapper
const ProtectedRoute = ({ children, roles }) => {
    const { user, loading, isAuthenticated } = useAuth();
    if (loading) return <LoadingSpinner fullScreen />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user?.role)) return <Navigate to="/unauthorized" replace />;
    return children;
};

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <LoadingSpinner fullScreen />;
    if (user) {
        const roleRedirects = {
            citizen: '/citizen/dashboard',
            police: '/police/dashboard',
            municipal: '/municipal/dashboard',
            admin: '/admin/dashboard',
        };
        return <Navigate to={roleRedirects[user.role] || '/'} replace />;
    }
    return children;
};

const AppRoutes = () => {
    return (
        <Suspense fallback={<LoadingSpinner fullScreen />}>
            <Routes>
                {/* Public */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/track" element={<TrackById />} />
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/login/*" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/register/*" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/clerk-callback" element={<ClerkCallback />} />

                {/* Citizen */}
                <Route path="/citizen/dashboard" element={<ProtectedRoute roles={['citizen']}><CitizenDashboard /></ProtectedRoute>} />
                <Route path="/citizen/submit" element={<ProtectedRoute roles={['citizen']}><SubmitComplaint /></ProtectedRoute>} />
                <Route path="/citizen/complaints" element={<ProtectedRoute roles={['citizen']}><MyComplaints /></ProtectedRoute>} />
                <Route path="/citizen/complaints/:id" element={<ProtectedRoute roles={['citizen']}><ComplaintDetail /></ProtectedRoute>} />

                {/* Police */}
                <Route path="/police/dashboard" element={<ProtectedRoute roles={['police', 'admin']}><PoliceDashboard /></ProtectedRoute>} />
                <Route path="/police/complaints" element={<ProtectedRoute roles={['police', 'admin']}><PoliceComplaintList /></ProtectedRoute>} />
                <Route path="/police/complaints/:id" element={<ProtectedRoute roles={['police', 'admin']}><PoliceComplaintDetail /></ProtectedRoute>} />
                <Route path="/police/manage" element={<ProtectedRoute roles={['police', 'admin']}><PoliceManagement /></ProtectedRoute>} />

                {/* Municipal */}
                <Route path="/municipal/dashboard" element={<ProtectedRoute roles={['municipal', 'admin']}><MunicipalDashboard /></ProtectedRoute>} />
                <Route path="/municipal/complaints" element={<ProtectedRoute roles={['municipal', 'admin']}><MunicipalComplaintList /></ProtectedRoute>} />
                <Route path="/municipal/complaints/:id" element={<ProtectedRoute roles={['municipal', 'admin']}><MunicipalComplaintDetail /></ProtectedRoute>} />
                <Route path="/municipal/manage" element={<ProtectedRoute roles={['municipal', 'admin']}><MunicipalManagement /></ProtectedRoute>} />

                {/* Admin */}
                <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/complaints" element={<ProtectedRoute roles={['admin']}><AdminComplaints /></ProtectedRoute>} />
                <Route path="/admin/departments" element={<ProtectedRoute roles={['admin']}><AdminDepartments /></ProtectedRoute>} />
                <Route path="/admin/audit-logs" element={<ProtectedRoute roles={['admin']}><AdminAuditLogs /></ProtectedRoute>} />

                {/* Fallbacks */}
                <Route path="/unauthorized" element={
                    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                        <div className="text-6xl mb-4">🚫</div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
                        <p className="text-gray-500 mb-6">You don't have permission to access this page.</p>
                        <a href="/" className="btn-primary">Go Home</a>
                    </div>
                } />
                <Route path="*" element={
                    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
                        <div className="text-6xl mb-4">404</div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
                        <a href="/" className="btn-primary">Go Home</a>
                    </div>
                } />
            </Routes>
        </Suspense>
    );
};

function App() {
    if (!CLERK_PUBLISHABLE_KEY) {
        return (
            <div className="flex items-center justify-center min-h-screen text-center p-8">
                <div>
                    <div className="text-4xl mb-4">⚠️</div>
                    <h1 className="text-xl font-bold text-gray-800 mb-2">Configuration Error</h1>
                    <p className="text-gray-500">REACT_APP_CLERK_PUBLISHABLE_KEY is not set in your .env file.</p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
                <Router>
                    <AuthProvider>
                        <SocketProvider>
                            <NotificationProvider>
                                <Toaster
                                    position="top-right"
                                    toastOptions={{
                                        duration: 4000,
                                        style: { borderRadius: '10px', background: '#1f2937', color: '#fff' },
                                        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                                        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                                    }}
                                />
                                <AppRoutes />
                            </NotificationProvider>
                        </SocketProvider>
                    </AuthProvider>
                </Router>
            </ClerkProvider>
        </ErrorBoundary>
    );
}

export default App;
