// server.js (Berjalan di Port 3001, Menggabungkan Semua Rute)

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path'); // Impor path sudah benar

// --- Konfigurasi Database ---
const connectDB = require('./src/config/db'); 

// --- Import Rute ---
const targetRoutes = require('./src/routes/targetRoutes'); 
const authRoutes = require('./src/routes/authRoutes'); 
const testRoutes = require('./src/routes/testRoutes'); 
const reportRoutes = require('./src/routes/reportRoutes');
const activityRoutes = require('./src/routes/activityRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3001; // DIUBAH: Default 3001
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vurneid_app';

// ===== Koneksi Database Mongoose =====
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
    });

// ===== Middleware Dasar =====
app.use(express.json()); 
app.use(cookieParser());

// ===== Konfigurasi CORS (KRITIS untuk Cookie/Auth) =====
const corsOptions = {
    origin: FRONTEND_URL, 
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options('/api/*', cors(corsOptions)); 

// =========================================================
// PERBAIKAN PATH KRITIS (FINAL): 
// server.js dan uploads sejajar di /app/. 
// Gunakan path.join(__dirname, 'uploads')
// =========================================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// ===== Pendaftaran API Routes =====
app.use('/api/auth', authRoutes); 
app.use('/api/targets', targetRoutes); 
app.use('/api/tests', testRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes); 


// ===== Route Health Check (Status Server & DB) =====
app.get('/health', (req, res) => res.json({ 
    status: 'ok',
    port: PORT,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}));

// ===== Start Server =====
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend running on port ${PORT}. Frontend at ${FRONTEND_URL}`);
});