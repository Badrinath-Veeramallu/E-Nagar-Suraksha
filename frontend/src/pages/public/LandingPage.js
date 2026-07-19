import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';

const features = [
    { icon: '📍', title: 'Pin-point Location', desc: 'Use the built-in map to precisely mark where the issue is.' },
    { icon: '🔄', title: 'Real-time Updates', desc: 'Get instant notifications as your complaint progresses.' },
    { icon: '📊', title: 'SLA Tracking', desc: 'Every complaint has a deadline. We track it for you.' },
    { icon: '🌐', title: 'Multilingual', desc: 'Available in English, Hindi and Telugu.' },
    { icon: '🔒', title: 'Secure & Private', desc: 'Your data is protected and never shared publicly.' },
    { icon: '📱', title: 'Mobile Friendly', desc: 'Works seamlessly on any device, anywhere.' },
];

const categories = [
    { icon: '🛣️', label: 'Road Issue' }, { icon: '🗑️', label: 'Garbage' }, { icon: '💧', label: 'Water Supply' },
    { icon: '💡', label: 'Streetlight' }, { icon: '🚨', label: 'Security' }, { icon: '🌊', label: 'Drainage' },
    { icon: '🔊', label: 'Noise' }, { icon: '⚡', label: 'Electrical' }, { icon: '🧹', label: 'Sanitation' },
];

const LandingPage = () => (
    <div className="min-h-screen bg-white">
        <Navbar />

        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white py-20 px-4">
            <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6 backdrop-blur-sm">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Live Platform — Report & Track Civic Issues
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
                    e-Nagar Suraksha
                </h1>
                <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
                    Report civic complaints, track resolutions, and hold authorities accountable — all in one platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/register" className="bg-white text-primary-700 font-semibold px-8 py-3 rounded-xl hover:bg-primary-50 transition-colors shadow-lg">
                        Register as Citizen
                    </Link>
                    <Link to="/track" className="border border-white/30 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors backdrop-blur-sm">
                        Track a Complaint
                    </Link>
                </div>
            </div>
        </section>

        {/* Stats */}
        <section className="bg-primary-700 text-white py-8">
            <div className="max-w-4xl mx-auto grid grid-cols-3 divide-x divide-primary-500 text-center">
                {[['100%', 'Free to Use'], ['24/7', 'Available'], ['3 Languages', 'Supported']].map(([stat, label]) => (
                    <div key={label} className="px-4">
                        <div className="text-2xl font-bold">{stat}</div>
                        <div className="text-sm text-primary-200">{label}</div>
                    </div>
                ))}
            </div>
        </section>

        {/* Categories */}
        <section className="py-16 px-4 bg-gray-50">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">What Can You Report?</h2>
                <p className="text-gray-500 mb-8">9 complaint categories handled by specialized departments</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                    {categories.map(({ icon, label }) => (
                        <div key={label} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="text-2xl mb-1">{icon}</div>
                            <div className="text-xs text-gray-600 font-medium">{label}</div>
                        </div>
                    ))}
                    <Link to="/register" className="bg-primary-50 rounded-xl p-4 text-center border border-primary-100 flex flex-col items-center justify-center hover:bg-primary-100 transition-colors">
                        <div className="text-2xl mb-1">➕</div>
                        <div className="text-xs text-primary-700 font-medium">Submit Issue</div>
                    </Link>
                </div>
            </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Why e-Nagar Suraksha?</h2>
                <p className="text-gray-500 text-center mb-10">A modern civic platform built for real accountability</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map(({ icon, title, desc }) => (
                        <div key={title} className="card hover:shadow-md transition-shadow">
                            <div className="text-3xl mb-3">{icon}</div>
                            <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
                            <p className="text-sm text-gray-500">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* CTA */}
        <section className="bg-primary-600 text-white py-14 px-4 text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to make your city better?</h2>
            <p className="text-primary-100 mb-6 text-sm">Register free and submit your first complaint in under 2 minutes.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register" className="bg-white text-primary-700 font-semibold px-8 py-3 rounded-xl hover:bg-primary-50 transition-colors">
                    Get Started Free
                </Link>
                <Link to="/track" className="border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    Track Existing Complaint
                </Link>
            </div>
        </section>

        <footer className="bg-gray-900 text-gray-400 text-center py-6 text-sm">
            <p>© 2026 e-Nagar Suraksha. A Civic Complaint Platform. Built for public safety and accountability.</p>
        </footer>
    </div>
);

export default LandingPage;
