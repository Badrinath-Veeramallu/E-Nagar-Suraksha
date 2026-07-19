import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001', {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join', user._id);
            socket.emit('join-role', user.role);
        });

        socket.on('disconnect', () => setConnected(false));

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
        };
    }, [isAuthenticated, user]);

    const on = (event, handler) => {
        if (socketRef.current) socketRef.current.on(event, handler);
    };

    const off = (event, handler) => {
        if (socketRef.current) socketRef.current.off(event, handler);
    };

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, connected, on, off }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
