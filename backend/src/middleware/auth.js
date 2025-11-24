// backend/src/middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Diperlukan untuk mengambil data user lengkap

// Ambil secret key dari environment, pastikan konsisten dengan authRoutes.js
const JWT_SECRET = process.env.JWT_SECRET || 'penetration-test-secret'; 

// --- Middleware Otentikasi Berbasis Cookie ---
const authenticateCookieToken = async (req, res, next) => {
    // 1. Cek token di cookie
    const token = req.cookies.token; 

    if (!token) {
        // Jika tidak ada token di cookie, tolak akses
        return res.status(401).json({ message: 'Token akses diperlukan.' });
    }

    try {
        // 2. Verifikasi token
        const decoded = jwt.verify(token, JWT_SECRET);

        // 3. Ambil data user lengkap dari DB
        // Ini memastikan user yang terautentikasi masih ada di database
        const user = await User.findById(decoded.id).select('-passwordHash -__v');
        
        if (!user) {
            res.clearCookie('token'); // Hapus cookie yang buruk
            return res.status(401).json({ message: 'Token valid, tetapi pengguna tidak ada di database.' });
        }
        
        // Simpan objek user lengkap ke dalam request
        req.user = user; 
        
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        // Token tidak valid/kadaluarsa. Hapus cookie yang buruk.
        res.clearCookie('token'); 
        return res.status(401).json({ message: 'Token tidak valid/kadaluarsa.' });
    }
};

// Middleware untuk role-based authorization (tidak diubah)
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User tidak terautentikasi' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Akses ditolak. Role tidak mencukupi' });
    }

    next();
  };
};

module.exports = {
  authenticateCookieToken, // Kita gunakan ini untuk rute /me
  authorize,
};