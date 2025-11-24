// backend/src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
// Import middleware yang baru kita buat
const { authenticateCookieToken } = require('../middleware/auth'); 

const JWT_SECRET = process.env.JWT_SECRET || 'penetration-test-secret'; 

// --- Utilities ---
const cleanUserData = (user) => {
    // Menghapus passwordHash dan data sensitif lainnya
    const { passwordHash, __v, ...data } = user.toObject();
    return data;
};
// -----------------

// --- ROUTE: /api/auth/signup ---
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ message: 'Email already registered' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const user = new User({ name, email, passwordHash, role: 'user' }); 
        await user.save();

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role || 'user' }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );
        
        res.cookie('token', token, { httpOnly: true, sameSite: 'lax' }); 
        
        return res.status(201).json({ 
            token, 
            user: cleanUserData(user),
            message: 'Registration successful'
        });

    } catch (err) {
        console.error('Signup error:', err);
        if (err.code === 11000) return res.status(409).json({ message: 'Email already registered' });
        return res.status(500).json({ message: 'Server error' });
    }
});

// --- ROUTE: /api/auth/login ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role || 'user' }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.cookie('token', token, { httpOnly: true, sameSite: 'lax' }); 
        
        return res.json({ 
            token, 
            user: cleanUserData(user),
            message: 'Login successful' 
        });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// --- ROUTE BARU: /api/auth/me (ROUTE YANG DIBUTUHKAN) ---
// Rute ini diverifikasi menggunakan middleware berbasis cookie
router.get('/me', authenticateCookieToken, (req, res) => {
    // Jika sampai di sini, token sudah valid dan req.user berisi objek user lengkap dari DB.
    return res.json({ 
        user: cleanUserData(req.user), 
        message: 'Token verified and user data retrieved' 
    });
});

// --- ROUTE: /api/auth/logout ---
router.post('/logout', (req, res) => {
    // Menghapus cookie token
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax' }); 
    res.json({ ok: true, message: 'Logout successful' });
});


module.exports = router;