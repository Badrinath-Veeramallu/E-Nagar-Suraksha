let io;

const initSocket = (socketIo) => {
    io = socketIo;

    io.on('connection', (socket) => {
        // Join personal room for targeted notifications
        socket.on('join', (userId) => {
            socket.join(`user:${userId}`);
        });

        // Join role-specific rooms
        socket.on('join-role', (role) => {
            socket.join(`role:${role}`);
        });

        socket.on('disconnect', () => {
            // cleanup handled automatically
        });
    });
};

const getIO = () => {
    if (!io) throw new Error('Socket.io not initialized');
    return io;
};

const emitToUser = (userId, event, data) => {
    if (io) io.to(`user:${userId}`).emit(event, data);
};

const emitToRole = (role, event, data) => {
    if (io) io.to(`role:${role}`).emit(event, data);
};

const emitToAll = (event, data) => {
    if (io) io.emit(event, data);
};

module.exports = { initSocket, getIO, emitToUser, emitToRole, emitToAll };
