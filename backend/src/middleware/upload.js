// backend/src/middleware/upload.js
const multer = require('multer');
const path = require('path');

// =========================================================
// Perbaikan Path Kritis untuk Lingkungan Docker
// __dirname: /app/src/middleware
// path.join(__dirname, '..', '..', 'uploads', 'avatars') mengarah ke:
// /app/src/middleware/../../uploads/avatars  => /app/uploads/avatars
// =========================================================
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');


// Konfigurasi penyimpanan untuk Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Menggunakan path absolut yang sudah ditentukan (UPLOAD_DIR)
        cb(null, UPLOAD_DIR); 
    },
    filename: function (req, file, cb) {
        // Buat nama file unik untuk mencegah konflik
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Pastikan nama file adalah slug dan tambahkan ekstensi asli
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// Filter jenis file yang diizinkan (hanya gambar)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // Terima file
    } else {
        // Menggunakan error JS standar, bukan objek Error kustom, untuk kompatibilitas Multer
        cb(new Error('Hanya file gambar yang diizinkan!'), false); 
    }
};

// Inisialisasi Multer
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Batasan ukuran file 5MB
});

module.exports = upload;