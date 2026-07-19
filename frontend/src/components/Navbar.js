import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTranslation } from 'react-i18next';
import i18n from '../utils/i18n';

const BellIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

const NotificationDropdown = ({ notifications, unreadCount, markRead, markAllRead, onClose, userRole }) => {
    const navigate = useNavigate();
    const rolePrefix = {
        citizen: 'citizen',
        police: 'police',
        municipal: 'municipal',
        admin: 'admin',
    }[userRole] || 'citizen';

    return (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-sm text-gray-700">Notifications</h3>
                {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Mark all read</button>
                )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No notifications yet</p>
                ) : notifications.map((n) => (
                    <div
                        key={n._id}
                        onClick={() => {
                            if (!n.isRead) markRead(n._id);
                            if (n.relatedComplaint) navigate(`/${rolePrefix}/complaints/${n.relatedComplaint._id || n.relatedComplaint}`);
                            onClose();
                        }}
                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50' : ''}`}
                    >
                        <p className="text-sm font-medium text-gray-800 leading-tight">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Navbar = () => {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications() || {};
    const { t } = useTranslation();
    const [showNotif, setShowNotif] = useState(false);
    const [showLang, setShowLang] = useState(false);
    const [showUser, setShowUser] = useState(false);
    const notifRef = useRef(null);
    const langRef = useRef(null);
    const userRef = useRef(null);
    const navigate = useNavigate();

    const LANGS = [{ code: 'en', label: 'English' }, { code: 'hi', label: 'हिंदी' }, { code: 'te', label: 'తెలుగు' }];

    const changeLanguage = async (code) => {
        i18n.changeLanguage(code);
        localStorage.setItem('lang', code);
        setShowLang(false);
        // Persist to backend profile (fire-and-forget — silent failure is OK)
        if (user) {
            try {
                const { userAPI } = await import('../services/api');
                await userAPI.updateProfile({ languagePreference: code });
            } catch {
                // Non-critical — language is still applied locally
            }
        }
    };

    const handleLogout = async () => {
        setShowUser(false);
        await logout();
        navigate('/login');
    };

    // ── Click-away listener — close all dropdowns when clicking outside ──
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
            if (langRef.current && !langRef.current.contains(e.target)) setShowLang(false);
            if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const roleColors = {
        citizen: 'bg-blue-100 text-blue-700',
        police: 'bg-red-100 text-red-700',
        municipal: 'bg-green-100 text-green-700',
        admin: 'bg-purple-100 text-purple-700',
    };

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">eN</span>
                        </div>
                        <span className="font-bold text-gray-900 hidden sm:block">e-Nagar Suraksha</span>
                    </Link>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Language switcher */}
                        <div className="relative" ref={langRef}>
                            <button
                                onClick={() => { setShowLang(!showLang); setShowUser(false); setShowNotif(false); }}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-xs font-medium"
                            >
                                {i18n.language?.toUpperCase().slice(0, 2) || 'EN'}
                            </button>
                            {showLang && (
                                <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                                    {LANGS.map((l) => (
                                        <button
                                            key={l.code}
                                            onClick={() => changeLanguage(l.code)}
                                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${i18n.language === l.code ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                        >
                                            {l.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Notifications */}
                        {user && (
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={() => { setShowNotif(!showNotif); setShowLang(false); setShowUser(false); }}
                                    className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <BellIcon />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>
                                {showNotif && (
                                    <NotificationDropdown
                                        notifications={notifications || []}
                                        unreadCount={unreadCount || 0}
                                        markRead={markRead}
                                        markAllRead={markAllRead}
                                        onClose={() => setShowNotif(false)}
                                        userRole={user?.role}
                                    />
                                )}
                            </div>
                        )}

                        {/* User menu */}
                        {user ? (
                            <div className="relative" ref={userRef}>
                                <button
                                    onClick={() => { setShowUser(!showUser); setShowLang(false); setShowNotif(false); }}
                                    className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs font-semibold">{user.name?.[0]?.toUpperCase()}</span>
                                    </div>
                                    <span className={`badge ${roleColors[user.role]} hidden sm:inline-flex capitalize`}>{user.role}</span>
                                </button>
                                {showUser && (
                                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                                        <div className="px-3 py-2 border-b border-gray-100">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            id="logout-btn"
                                        >
                                            {t('nav.logout')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="btn-primary text-sm py-1.5 px-3">{t('nav.login')}</Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
