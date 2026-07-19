import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { on, off } = useSocket() || {};
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const { data } = await notificationAPI.getMy({ limit: 30 });
            setNotifications(data.data);
            setUnreadCount(data.unreadCount);
        } catch { }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Real-time new notifications
    useEffect(() => {
        if (!on || !off) return;
        const handler = (notification) => {
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((c) => c + 1);
        };
        on('new_notification', handler);
        return () => off('new_notification', handler);
    }, [on, off]);

    const markRead = useCallback(async (id) => {
        await notificationAPI.markRead(id);
        setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount((c) => Math.max(0, c - 1));
    }, []);

    const markAllRead = useCallback(async () => {
        await notificationAPI.markAllRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markRead, markAllRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
