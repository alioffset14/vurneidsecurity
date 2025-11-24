const mongoose = require('mongoose');

const targetSchema = new mongoose.Schema({
    // ✨ FIELD BARU KRUSIAL: Menghubungkan Target dengan User yang membuatnya
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    name: { type: String, required: true }, // Nama target (ex: Website A)
    url: { type: String, required: true },  // URL lengkap
    type: { type: String, enum: ['web', 'api'], default: 'web' }, // jenis target
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Target', targetSchema);