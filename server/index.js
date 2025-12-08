require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const { initDatabase } = require('./db/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const raceRoutes = require('./routes/race');
const adminRoutes = require('./routes/admin');
const horseRoutes = require('./routes/horses');
const { setupSocketHandlers } = require('./socket/handlers');

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? process.env.FRONTEND_URL 
            : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));
// Increase body size limit for map preview images (default is 100kb)
app.use(express.json({ limit: '10mb' }));

// Make io accessible to routes
app.set('io', io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/race', raceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/horses', horseRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../web/dist')));
app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../web/dist/index.html'));
});

// Start server (use 4000 by default to avoid clashing with other local servers)
const PORT = process.env.PORT || 4000;

async function startServer() {
    // Initialize database first
    await initDatabase();
    
    // Setup Socket.io handlers
    setupSocketHandlers(io);
    
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`
🐎 Horse Race Betting Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Server running on port ${PORT}
🌐 Accessible at http://0.0.0.0:${PORT}
📡 WebSocket ready
💾 Database initialized
━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
    });
}

startServer().catch(console.error);

module.exports = { app, io };
