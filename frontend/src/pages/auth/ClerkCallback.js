import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ROLE_REDIRECTS = {
    citizen: '/citizen/dashboard',
    police: '/police/dashboard',
    municipal: '/municipal/dashboard',
    admin: '/admin/dashboard',
};

/**
 * Intermediate page Clerk redirects to after sign-in/sign-up.
 * Waits for AuthContext sync to complete before redirecting by role.
 * Guards against the race condition where loading=false fires before sync starts.
 */
const ClerkCallback = () => {
    const { user, loading, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [waitExpired, setWaitExpired] = useState(false);
    const minWaitRef = useRef(false);

    // Minimum 800ms before we consider redirecting to /login on failure
    // This prevents the race where loading flips to false before Clerk sync begins
    useEffect(() => {
        const minTimer = setTimeout(() => {
            minWaitRef.current = true;
            setWaitExpired(true);
        }, 800);

        // Hard timeout of 10s — if sync never completes, bail to login
        const maxTimer = setTimeout(() => {
            if (!isAuthenticated) {
                toast.error('Sign-in timed out. Please try again.');
                navigate('/login', { replace: true });
            }
        }, 10000);

        return () => {
            clearTimeout(minTimer);
            clearTimeout(maxTimer);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (loading) return; // still syncing

        if (isAuthenticated && user) {
            toast.success(`Welcome, ${user.name}!`);
            navigate(ROLE_REDIRECTS[user.role] || '/', { replace: true });
        } else if (!isAuthenticated && waitExpired) {
            // Only redirect to login AFTER the minimum wait, and sync has definitively failed
            navigate('/login', { replace: true });
        }
    }, [loading, isAuthenticated, user, navigate, waitExpired]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <LoadingSpinner fullScreen />
            <p className="text-sm text-gray-500 mt-4">Signing you in…</p>
        </div>
    );
};

export default ClerkCallback;
