// src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // PERBAIKAN NAMA FIELD: Menggunakan 'fullName' untuk konsistensi dengan controller/frontend.
    fullName: { 
        type: String, 
        required: true, 
        trim: true // Menghapus spasi putih di awal/akhir
    }, 
    email: { 
        type: String, 
        unique: true, 
        required: true 
    },
    passwordHash: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' 
    }, 
    avatarUrl: { 
        type: String, 
        default: '/uploads/avatars/default.png' 
    }, 
    
    // 💥 PERBAIKAN KRITIS: MENAMBAHKAN FIELD 'location'
    location: {
        type: String,
        default: 'Unknown Location',
        trim: true
    },
    
    // 💥 PERBAIKAN KRITIS: MENAMBAHKAN FIELD 'bio'
    bio: {
        type: String,
        default: 'No bio yet.',
        trim: true
    }
}, {
    timestamps: true // Secara otomatis menambahkan createdAt dan updatedAt
});

module.exports = mongoose.model('User', userSchema);