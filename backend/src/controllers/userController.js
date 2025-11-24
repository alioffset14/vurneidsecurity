// backend/src/controllers/userController.js (VERSI TERSINKRONISASI)

const User = require('../models/User'); 
const path = require('path');
const fs = require('fs').promises;

// =========================================================
// Fungsi Utility untuk Menghapus File (CLEANUP)
// =========================================================
const deleteFile = async (filePath) => {
    try {
        if (filePath) {
            await fs.unlink(filePath);
            console.log(`✅ CLEANUP: File deleted successfully: ${filePath}`);
        }
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error(`❌ CLEANUP ERROR: Could not delete file ${filePath}.`, err.message);
        }
    }
};

// =========================================================
// GET PROFILE CONTROLLER (Tidak Berubah)
// =========================================================
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        // Hanya ambil field yang ada di model
        const user = await User.findById(userId).select('-passwordHash -__v');
        
        if (!user) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
        }
        
        res.json(user);
    } catch (err) {
        console.error('getProfile error:', err);
        res.status(500).json({ error: 'Gagal mengambil data profil.' });
    }
};

// =========================================================
// UPDATE PROFILE CONTROLLER (FINAL FIXES)
// =========================================================
exports.updateProfile = async (req, res) => {
    if (!req.user || !req.user._id) {
        return res.status(401).json({ error: 'Pengguna tidak terautentikasi.' });
    }
    
    const userId = req.user._id; 
    let oldAvatarUrlFromDb = null;
    let oldAvatarPathToDelete = null; 
    let newFilePathIfError = req.file ? req.file.path : null; // Path file Multer

    try {
        const currentUserData = await User.findById(userId).select('email avatarUrl');
        if (!currentUserData) {
            if (newFilePathIfError) { await deleteFile(newFilePathIfError); }
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }
        oldAvatarUrlFromDb = currentUserData.avatarUrl; 

        // 🛑 PERBAIKAN KRITIS: Menggunakan 'fullName' sesuai dengan model Mongoose
        const { fullName, email, location, bio } = req.body; 
        
        const updateData = {};
        
        // 1. Handle File Upload (Avatar)
        if (req.file) {
            // 🌟 PERBAIKAN PATH: Pastikan URL web menggunakan '/'
            // Kita ambil path Multer, ganti semua '\' menjadi '/', dan pastikan diawali '/'
            const normalizedPath = req.file.path.replace(/\\/g, "/");
            const newAvatarUrl = `/${normalizedPath}`; // e.g., /uploads/avatars/timestamp-id.jpg
            
            updateData.avatarUrl = newAvatarUrl;

            console.log(`⭐ UPLOAD DEBUG: New Avatar URL: ${newAvatarUrl}`);
            
            // Siapkan path file lama untuk dihapus
            if (oldAvatarUrlFromDb && oldAvatarUrlFromDb.startsWith('/uploads/avatars/')) {
                // Logika penghapusan file lama Anda sudah benar, 
                // karena path.basename bekerja dengan baik untuk memisahkan nama file dari URL.
                const fileName = path.basename(oldAvatarUrlFromDb); 
                
                // Dapatkan path absolut untuk operasi fs.unlink
                // Kita gunakan path.join(__dirname, '..', '..', 'uploads', 'avatars', fileName)
                // agar path lebih stabil daripada memanipulasi string
                const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'avatars');
                oldAvatarPathToDelete = path.join(uploadDir, fileName);

                console.log(`⭐ CLEANUP DEBUG: Old file path prepared: ${oldAvatarPathToDelete}`);
            }
        }
        
        // 2. Handle Data Teks
        // 🛑 PERBAIKAN KRITIS: Pastikan field yang di-update adalah 'fullName'
        if (fullName) updateData.fullName = fullName; 
        if (location) updateData.location = location; 
        if (bio) updateData.bio = bio;

        // 3. Handle Email (Duplikasi) - (Logika ini sudah benar)
        if (email && email !== currentUserData.email) {
            const existingUser = await User.findOne({ email: email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email yang dimasukkan sudah digunakan oleh pengguna lain.' });
            }
            updateData.email = email;
        }

        // 4. Update Database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true } 
        ).select('-passwordHash -__v'); 

        if (!updatedUser) {
            if (newFilePathIfError) { await deleteFile(newFilePathIfError); }
            return res.status(404).json({ message: 'Pengguna tidak ditemukan setelah update.' });
        }
        
        // 5. Hapus Avatar Lama (setelah update DB berhasil)
        if (oldAvatarPathToDelete) {
            if (!oldAvatarPathToDelete.includes('default.png')) { 
                await deleteFile(oldAvatarPathToDelete);
            }
        }
        
        // 🛑 PERBAIKAN KRITIS: Kirim objek updatedUser secara langsung
        return res.json(updatedUser); 

    } catch (err) {
        console.error('❌ UPDATE PROFILE FATAL ERROR:', err);
        
        if (newFilePathIfError) {
            await deleteFile(newFilePathIfError);
        }

        if (err.code === 11000) { 
            return res.status(400).json({ message: 'Email yang dimasukkan sudah digunakan oleh pengguna lain.' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: `Data yang dikirimkan tidak valid: ${err.message}` });
        }
        res.status(500).json({ message: 'Gagal memperbarui profil karena error server internal.' });
    }
};

// ... (userRoutes.js tidak perlu diubah, itu sudah benar)