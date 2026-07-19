import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { authAPI } from '../services/api';
import i18n from '../utils/i18n';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
    const { getToken, signOut } = useClerkAuth();

    const [user, setUser] = useState(() => {
        // Restore from localStorage on first load (supports page refresh)
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    });
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);
    const syncedRef = useRef(false);  // prevent duplicate Clerk syncs
    const inactivityTimerRef = useRef(null);

    // ── Session persistence guard ─────────────────────────────────────────
    // Use sessionStorage to detect genuine tab close (vs. page refresh).
    // On page refresh, sessionStorage persists. On tab close + reopen, it is cleared.
    useEffect(() => {
        const sessionAlive = sessionStorage.getItem('session_alive');
        const storedToken = localStorage.getItem('token');
        if (!sessionAlive && storedToken) {
            // New browser session — clear auth
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
        }
        // Mark session as alive
        sessionStorage.setItem('session_alive', '1');
    }, []);

    // ── Inactivity auto-logout (30 minutes) ───────────────────────────────
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = setTimeout(() => {
            // Only logout if there is an active session
            if (localStorage.getItem('token')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                sessionStorage.removeItem('session_alive');
                window.dispatchEvent(new Event('auth:logout'));
            }
        }, 30 * 60 * 1000); // 30 minutes
    }, []);

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }));
        resetInactivityTimer(); // start on mount
        return () => {
            events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        };
    }, [resetInactivityTimer]);

    // ── Clerk → Backend sync ──────────────────────────────────────────────
    useEffect(() => {
        if (!clerkLoaded) return;

        if (!isSignedIn) {
            // Clerk says not signed in — only clear Clerk-based sessions
            // Don't clear if user logged in via direct staff login (no Clerk session)
            const storedUser = (() => {
                try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
            })();

            const isStaffDirectLogin = storedUser && ['admin', 'police', 'municipal'].includes(storedUser.role);

            if (!isStaffDirectLogin) {
                setUser(null);
                setToken(null);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
            syncedRef.current = false;
            setLoading(false);
            return;
        }

        // Clerk signed in — sync with backend (only once per session)
        const syncWithBackend = async () => {
            try {
                const clerkToken = await getToken();
                if (!clerkToken) throw new Error('No Clerk token available');

                const { data } = await authAPI.clerkSync(
                    clerkToken,
                    {
                        name: clerkUser.fullName || clerkUser.firstName || 'User',
                        email: clerkUser.primaryEmailAddress?.emailAddress || '',
                    }
                );

                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                sessionStorage.setItem('session_alive', '1');
                setToken(data.token);
                setUser(data.user);
                syncedRef.current = true;

                // Sync language preference
                const lang = data.user.languagePreference || localStorage.getItem('lang') || 'en';
                i18n.changeLanguage(lang);
                localStorage.setItem('lang', lang);
            } catch (err) {
                console.error('Backend sync failed:', err);
                // Fallback: try localStorage token (e.g. direct staff login still active)
                const storedToken = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');
                if (storedToken && storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        setToken(storedToken);
                        setUser(parsed);
                    } catch {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        if (!syncedRef.current) {
            syncWithBackend();
        } else {
            setLoading(false);
        }
    }, [clerkLoaded, isSignedIn, clerkUser, getToken]);

    // ── Direct login for staff (Admin / Police / Municipal) ───────────────
    // Bypasses Clerk entirely — uses the backend JWT directly
    const loginDirect = useCallback((backendToken, backendUser) => {
        localStorage.setItem('token', backendToken);
        localStorage.setItem('user', JSON.stringify(backendUser));
        sessionStorage.setItem('session_alive', '1');
        setToken(backendToken);
        setUser(backendUser);

        // Apply language preference from user profile
        const lang = backendUser.languagePreference || localStorage.getItem('lang') || 'en';
        i18n.changeLanguage(lang);
        localStorage.setItem('lang', lang);
    }, []);

    // ── Logout ────────────────────────────────────────────────────────────
    const logout = useCallback(async () => {
        try {
            if (token) await authAPI.logout().catch(() => { });
            // Only sign out from Clerk if Clerk has an active session
            if (isSignedIn) await signOut();
        } catch { }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('session_alive');
        setToken(null);
        setUser(null);
        syncedRef.current = false;
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    }, [token, signOut, isSignedIn]);

    // ── Listen for global auth:logout events (dispatched by api.js 401 interceptor) ──
    useEffect(() => {
        const handler = () => logout();
        window.addEventListener('auth:logout', handler);
        return () => window.removeEventListener('auth:logout', handler);
    }, [logout]);

    // ── Update user in state + localStorage ───────────────────────────────
    const updateUser = useCallback((updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    }, []);

    const isRole = useCallback((...roles) => roles.includes(user?.role), [user]);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            logout,
            loginDirect,
            updateUser,
            isRole,
            isAuthenticated: !!user && !!token,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
