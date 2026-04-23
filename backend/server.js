require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// ── Initialize App ─────────────────────────────────────────────────────────────
const app = express();

// ── CORS Configuration ─────────────────────────────────────────────────────────
// Update FRONTEND_URL in .env to match your deployed Vercel/Netlify domain
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g., curl, Postman) or matching origins
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked: origin ${origin} not allowed`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// ── Body Parsing Middleware ────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Basic Request Logger ───────────────────────────────────────────────────────
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/bookmark', require('./routes/bookmarkRoutes'));

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ success: true, message: '🏛️ SchemeChecker API is running' });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

// ── Start Server ───────────────────────────────────────────────────────────────
const startServer = async () => {
    try {
        await connectDB();
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
        });
    } catch (err) {
        console.error('❌ Server startup failed:', err.message);
        process.exit(1);
    }
};

startServer();
