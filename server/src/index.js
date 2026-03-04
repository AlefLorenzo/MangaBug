import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Routes
import authRoutes from './routes/authRoutes.js';
import workRoutes from './routes/workRoutes.js';
import chapterRoutes from './routes/chapterRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import readerRoutes from './routes/readerRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import gamificationRoutes from './routes/gamificationRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// --- Allowed Origins ---
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

const io = new Server(httpServer, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ["GET", "POST"]
    }
});

// --- Security Middleware ---
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images to load cross-origin
    contentSecurityPolicy: false // Disable CSP for now (React SPA handles its own)
}));

app.use(cors({
    origin: ALLOWED_ORIGINS,
    credentials: true
}));

// --- Rate Limiting ---
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per window
    message: { success: false, message: 'Muitas tentativas. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { success: false, message: 'Limite de requisições atingido. Aguarde.' },
    standardHeaders: true,
    legacyHeaders: false
});

// --- Body Parsers ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Apply general rate limit ---
app.use('/api/', apiLimiter);

// Uploads static directory
const uploadDir = path.join(__dirname, '../../uploads');
const subDirs = ['covers', 'chapters', 'banners', 'avatars'];

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

subDirs.forEach(sub => {
    const subPath = path.join(uploadDir, sub);
    if (!fs.existsSync(subPath)) {
        fs.mkdirSync(subPath, { recursive: true });
    }
});

app.use('/uploads', express.static(uploadDir));

// Health check — frontend connectivity probe
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// Route Middleware — Auth FIRST (most critical, must never be blocked)
app.set('io', io);
global.io = io;

// Apply stricter rate limit on auth routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/works', workRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reader', readerRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/gamification', gamificationRoutes);

// Socket.io integration
io.on('connection', (socket) => {
    console.log('User connected signal:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected signal:', socket.id);
    });
});

// Global error handler — prevents server crashes from unhandled errors
app.use((err, req, res, next) => {
    console.error('🔥 Unhandled Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server Premium running on port ${PORT}`);
});
