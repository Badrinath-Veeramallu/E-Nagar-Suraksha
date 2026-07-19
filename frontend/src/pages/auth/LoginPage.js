import React, { useState } from 'react';
import { SignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

const ROLE_REDIRECTS = {
    citizen: '/citizen/dashboard',
    police: '/police/dashboard',
    municipal: '/municipal/dashboard',
    admin: '/admin/dashboard',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Staff Direct Login Form ────────────────────────────────────────────────
const StaffLoginForm = () => {
    const { loginDirect } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        if (!form.email.trim() || !form.password.trim()) {
            setError('Email and password are required.');
            return;
        }
        if (!EMAIL_REGEX.test(form.email.trim())) {
            setError('Please enter a valid email address.');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const { data } = await authAPI.login({ email: form.email.trim(), password: form.password });
            if (data.success) {
                loginDirect(data.token, data.user);
                toast.success(`Welcome, ${data.user.name}!`);
                navigate(ROLE_REDIRECTS[data.user.role] || '/', { replace: true });
            }
        } catch (err) {
            const msg = err?.response?.data?.message;
            if (msg === 'Invalid credentials') {
                setError('Incorrect email or password. Please check your credentials.');
            } else if (msg?.includes('blocked')) {
                setError('Your account has been blocked. Contact an administrator.');
            } else {
                setError(msg || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-sm">
            <form onSubmit={handleSubmit} className="card p-6 space-y-4" noValidate>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Official Email
                    </label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="admin@enagar.gov.in"
                        className="input-field"
                        autoComplete="email"
                        disabled={loading}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="••••••••"
                        className="input-field"
                        autoComplete="current-password"
                        disabled={loading}
                        required
                        minLength={6}
                    />
                </div>

                {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? 'Signing in…' : 'Sign In'}
                </button>
            </form>

            {/* Demo hints for staff */}
            <div className="mt-4 card py-3 px-4">
                <p className="text-xs text-gray-400 text-center mb-2 font-medium">🎭 Staff Demo Accounts</p>
                <div className="grid grid-cols-1 gap-1.5 text-xs text-gray-500">
                    <div className="bg-red-50 rounded p-1.5 flex justify-between">
                        <span className="font-medium text-red-700">👮 Police</span>
                        <span>police@enagar.gov.in / Police@1234</span>
                    </div>
                    <div className="bg-green-50 rounded p-1.5 flex justify-between">
                        <span className="font-medium text-green-700">🏗 Municipal</span>
                        <span>municipal@enagar.gov.in / Municipal@1234</span>
                    </div>
                    <div className="bg-purple-50 rounded p-1.5 flex justify-between">
                        <span className="font-medium text-purple-700">⚙ Admin</span>
                        <span>admin@enagar.gov.in / Admin@1234</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Main Login Page ────────────────────────────────────────────────────────
const LoginPage = () => {
    const [tab, setTab] = useState('citizen'); // 'citizen' | 'staff'

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
            <Navbar />
            <div className="flex flex-col items-center justify-center py-10 px-4">

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 shadow-lg">
                        <span className="text-white text-2xl font-bold">eN</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Sign in to e-Nagar Suraksha</h1>
                    <p className="text-gray-500 text-sm mt-1">Report civic issues. Track resolution. Build your city.</p>
                </div>

                {/* Tab switcher */}
                <div className="flex rounded-lg border border-gray-200 bg-gray-100 p-1 mb-6 w-full max-w-sm">
                    <button
                        onClick={() => setTab('citizen')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${tab === 'citizen'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        👤 Citizen
                    </button>
                    <button
                        onClick={() => setTab('staff')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${tab === 'staff'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        🏛 Staff / Admin
                    </button>
                </div>

                {/* Tab content */}
                {tab === 'citizen' ? (
                    <div className="w-full max-w-sm">
                        <SignIn
                            routing="hash"
                            afterSignInUrl="/clerk-callback"
                            signUpUrl="/register"
                            appearance={{
                                elements: {
                                    rootBox: 'mx-auto',
                                    card: 'shadow-sm border border-gray-200 rounded-xl',
                                    headerTitle: 'hidden',
                                    headerSubtitle: 'hidden',
                                    socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50',
                                    formButtonPrimary: 'bg-primary-600 hover:bg-primary-700 text-sm',
                                    footerActionLink: 'text-primary-600 hover:text-primary-700',
                                },
                            }}
                        />
                        {/* Citizen demo hint */}
                        <div className="mt-4 card py-3 px-4">
                            <p className="text-xs text-gray-400 text-center mb-1 font-medium">🎭 Citizen Demo Account</p>
                            <div className="bg-blue-50 rounded p-1.5 text-xs text-center">
                                <span className="font-medium text-blue-700">citizen1@example.com</span>
                                <span className="text-gray-500"> / </span>
                                <span>Citizen@1234</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <StaffLoginForm />
                )}
            </div>
        </div>
    );
};

export default LoginPage;
