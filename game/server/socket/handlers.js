const jwt = require('jsonwebtoken');
const { userOps, raceOps, betOps } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-this';

// Store active connections
const connections = new Map(); // oderId -> { oderId, odername }
const raceViewers = new Map(); // raceId -> Set of socketIds

function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        // Authenticate socket connection
        socket.on('auth', (token) => {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                const user = userOps.findById.get(decoded.id);
                
                if (user) {
                    connections.set(socket.id, {
                        oderId: user.id,
                        username: user.username
                    });
                    socket.emit('auth:success', { username: user.username });
                    console.log(`✅ Authenticated: ${user.username}`);
                }
            } catch (error) {
                socket.emit('auth:failed', { error: 'Invalid token' });
            }
        });

        // Join race room (to watch a specific race)
        socket.on('race:join', (raceId) => {
            const roomName = `race:${raceId}`;
            socket.join(roomName);
            
            if (!raceViewers.has(raceId)) {
                raceViewers.set(raceId, new Set());
            }
            raceViewers.get(raceId).add(socket.id);
            
            // Notify others
            const viewerCount = raceViewers.get(raceId).size;
            io.to(roomName).emit('race:viewers', { raceId, count: viewerCount });
            
            console.log(`👁️ ${socket.id} watching race ${raceId} (${viewerCount} viewers)`);
        });

        // Leave race room
        socket.on('race:leave', (raceId) => {
            const roomName = `race:${raceId}`;
            socket.leave(roomName);
            
            if (raceViewers.has(raceId)) {
                raceViewers.get(raceId).delete(socket.id);
                const viewerCount = raceViewers.get(raceId).size;
                io.to(roomName).emit('race:viewers', { raceId, count: viewerCount });
            }
        });

        // Race state sync (from game host)
        socket.on('race:state', (data) => {
            const { raceId, gameState } = data;
            // Broadcast to all viewers of this race
            io.to(`race:${raceId}`).emit('race:state', gameState);
        });

        // Chat message
        socket.on('chat:message', (data) => {
            const user = connections.get(socket.id);
            if (!user) {
                socket.emit('error', { message: 'Not authenticated' });
                return;
            }

            const { raceId, message } = data;
            if (!message || message.length > 200) return;

            const chatMessage = {
                username: user.username,
                message: message.trim(),
                timestamp: Date.now()
            };

            if (raceId) {
                // Send to specific race room
                io.to(`race:${raceId}`).emit('chat:message', chatMessage);
            } else {
                // Global chat
                io.emit('chat:message', chatMessage);
            }
        });

        // Get online users count
        socket.on('stats:request', () => {
            socket.emit('stats:update', {
                onlineUsers: connections.size,
                activeRaces: raceViewers.size
            });
        });

        // Disconnect
        socket.on('disconnect', () => {
            const user = connections.get(socket.id);
            if (user) {
                console.log(`👋 ${user.username} disconnected`);
            }
            
            connections.delete(socket.id);
            
            // Remove from all race viewers
            for (const [raceId, viewers] of raceViewers.entries()) {
                if (viewers.has(socket.id)) {
                    viewers.delete(socket.id);
                    io.to(`race:${raceId}`).emit('race:viewers', { 
                        raceId, 
                        count: viewers.size 
                    });
                }
            }
        });
    });

    // Periodic stats broadcast
    setInterval(() => {
        io.emit('stats:update', {
            onlineUsers: connections.size,
            activeRaces: raceViewers.size
        });
    }, 30000); // Every 30 seconds

    console.log('🔌 Socket handlers initialized');
}

module.exports = { setupSocketHandlers };
