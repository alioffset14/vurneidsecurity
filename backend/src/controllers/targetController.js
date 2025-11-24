const Target = require('../models/Target');
const mongoose = require('mongoose');

// ✅ GET semua target milik user yang login
exports.getTargets = async (req, res) => {
    // Ambil ID pengguna dari token yang sudah diautentikasi
    const userId = req.user._id; 
    
    try {
        // ✨ PERBAIKAN: Filter data hanya milik userId yang login
        const targets = await Target.find({ userId: userId }).sort({ createdAt: -1 });
        res.json(targets);
    } catch (err) {
        console.error('getTargets error:', err);
        res.status(500).json({ error: 'Gagal mengambil target' });
    }
};

// ✅ GET target by ID
exports.getTargetById = async (req, res) => {
    const userId = req.user._id; // Ambil ID user dari request
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID target tidak valid' });
        }

        // ✨ PERBAIKAN: Cari berdasarkan ID dan userId
        const target = await Target.findOne({ _id: id, userId: userId });
        
        if (!target) {
            // Mengembalikan 404 jika tidak ditemukan ATAU TIDAK DIMILIKI
            return res.status(404).json({ error: 'Target tidak ditemukan atau Anda tidak memiliki akses' });
        }
        res.json(target);
    } catch (err) {
        console.error('getTargetById error:', err);
        res.status(500).json({ error: 'Gagal mengambil target' });
    }
};

// ✅ CREATE target baru
exports.createTarget = async (req, res) => {
    const userId = req.user._id; // ✨ Ambil ID user dari request
    try {
        // Whitelist field yang boleh dibuat
        const { name, url, description, type } = req.body;
        
        const newTarget = new Target({ 
            userId, // ✨ PERBAIKAN: Suntikkan userId ke Target baru
            name, 
            url, 
            description,
            type 
        });

        const savedTarget = await newTarget.save();
        res.status(201).json(savedTarget);
    } catch (err) {
        console.error('createTarget error:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ error: 'Data target tidak valid', detail: err.message });
        }
        res.status(500).json({ error: 'Gagal membuat target' });
    }
};

// ✅ UPDATE target by ID
exports.updateTarget = async (req, res) => {
    const userId = req.user._id; // Ambil ID user dari request
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID target tidak valid' });
        }

        // Whitelist update field
        const { name, url, description, type } = req.body;
        const updateData = { name, url, description, type };

        // ✨ PERBAIKAN: Update hanya jika ID cocok dan DIMILIKI oleh user
        const updated = await Target.findOneAndUpdate(
            { _id: id, userId: userId }, 
            updateData,
            { new: true, runValidators: true }
        );

        if (!updated) return res.status(404).json({ 
            error: 'Target tidak ditemukan atau Anda tidak memiliki izin untuk mengupdate' 
        });
        res.json(updated);
    } catch (err) {
        console.error('updateTarget error:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ error: 'Data target tidak valid', detail: err.message });
        }
        res.status(500).json({ error: 'Gagal update target' });
    }
};

// ✅ DELETE target
exports.deleteTarget = async (req, res) => {
    const userId = req.user._id; // Ambil ID user dari request
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID target tidak valid' });
        }

        // ✨ PERBAIKAN: Hapus hanya jika ID cocok dan DIMILIKI oleh user
        const deleted = await Target.findOneAndDelete({ _id: id, userId: userId });
        
        if (!deleted) return res.status(404).json({ 
            error: 'Target tidak ditemukan atau Anda tidak memiliki izin untuk menghapus' 
        });
        
        res.json({ message: 'Target berhasil dihapus' });
    } catch (err) {
        console.error('deleteTarget error:', err);
        res.status(500).json({ error: 'Gagal menghapus target' });
    }
};