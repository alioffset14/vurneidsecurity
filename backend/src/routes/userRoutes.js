// backend/src/routes/userRoutes.js (VERSI FINAL DENGAN ERROR WRAPPER MULTER)

const express = require('express');
const router = express.Router();
const multer = require('multer'); // Impor Multer untuk menangkap MulterError

// Impor Middleware & Controller
const { authenticateCookieToken } = require('../middleware/auth'); 
const { updateProfile } = require('../controllers/userController'); 
const upload = require('../middleware/upload'); // Middleware Multer yang sudah Anda buat


// =========================================================
// ✨ Wrapper Multer untuk Error Handling Eksplisit (KRITIS)
// =========================================================
const handleUpload = (req, res, next) => {
    // Memanggil upload.single('avatar') dan menyediakannya dengan callback error
    upload.single('avatar')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Error yang disebabkan oleh batasan Multer (misal: ukuran file, jenis file)
            console.error("⛔ MULTER LIMIT/TYPE ERROR:", err.message); 
            return res.status(400).json({ 
                message: `Upload failed (Multer): ${err.message}` 
            });
        } 
        
        if (err) {
            // Error lain, SANGAT MUNGKIN karena File Permission (EACCES)
            console.error("❌ FILE SYSTEM/UNKNOWN UPLOAD ERROR:", err.message); 
            // Jika ada error, hentikan rantai middleware dan kirim 500
            return res.status(500).json({ 
                message: `Internal upload error. Check server file permissions. Details: ${err.message}` 
            });
        }
        
        // Jika tidak ada error, lanjutkan ke controller
        next();
    });
};

// =========================================================
// Rute untuk pembaruan profil (Menggunakan wrapper baru)
// =========================================================
router.put('/profile', authenticateCookieToken, handleUpload, updateProfile);

module.exports = router;