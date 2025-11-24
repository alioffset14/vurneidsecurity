// backend/src/controllers/authController.js

// Import model User dan library JWT (misalnya 'jsonwebtoken')
const User = require('../models/User'); 
const jwt = require('jsonwebtoken'); // Asumsikan Anda menggunakan JWT untuk otentikasi

// Helper: Fungsi untuk membuat JWT
const createToken = (id) => {
    // Pastikan Anda memiliki JWT_SECRET di file .env Anda
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h', 
    });
};

// Fungsi untuk proses Pendaftaran (Signup)
exports.signup = async (req, res) => {
    // Pastikan kita mendestruct data yang masuk sebagai 'name'
    const { name, email, password } = req.body; 

    try {
        // 1. Validasi Input Dasar
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Semua field (Name, Email, Password) harus diisi." });
        }

        // 2. Cek apakah user sudah terdaftar
        let user = await User.findOne({ email });
        if (user) {
            return res.status(409).json({ message: "Email sudah terdaftar." });
        }

        // 3. Buat user baru (Mongoose akan otomatis melakukan hashing di hook 'pre-save')
        user = await User.create({ name, email, password });

        // 4. Buat token (payload user.id)
        const token = createToken(user._id);

        // 5. Kirim respon sukses
        res.status(201).json({
            message: "Pendaftaran berhasil!",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            token // Kirim token untuk auto-login frontend
        });
    } catch (error) {
        // Mongoose Validation Error (misalnya password terlalu pendek)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        
        // Error Umum (e.g., Duplikasi Key E11000)
        if (error.code === 11000) {
            return res.status(409).json({ message: "Email sudah terdaftar. Silakan login." });
        }

        console.error("Signup error:", error);
        res.status(500).json({ message: "Terjadi kesalahan server saat mendaftar." });
    }
};


// Fungsi untuk mendapatkan data pengguna yang sedang login (dipanggil oleh /api/auth/me)
exports.getMe = (req, res) => {
    // req.user disuntikkan oleh middleware autentikasi (misalnya authMiddleware)
    if (!req.user) {
        // Ini adalah fallback, biasanya middleware akan menangani 401
        return res.status(401).json({ message: 'Tidak terautentikasi.' });
    }
    // Mengembalikan data user yang berhasil diverifikasi tokennya
    // Asumsikan req.user berisi objek user setelah verifikasi token
    res.json(req.user);
};

// Fungsi untuk proses Login
exports.login = async (req, res) => {
    // ... Logika untuk memverifikasi username/password dan menghasilkan JWT ...
    // ...
};
// ... Tambahkan fungsi logout, dll.
