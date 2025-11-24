const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    // ✨ FIELD BARU KRUSIAL: Menghubungkan Test dengan User yang membuatnya
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    targetId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Target', 
        required: true 
    },
    
    scanType: {
        type: String,
        enum: [
            'sql-basic','sql-blind','sql-time-based',
            'xss-reflected','xss-stored','xss-dom','full-scan'
        ],
        required: true
    },
    
    scanLevel: { 
        type: String, 
        enum: ['low','medium','high','aggressive'], 
        default: 'medium' 
    },
    
    parameters: { type: Object }, // ex: { method: 'GET', url: 'https://...' }
    
    status: { 
        type: String, 
        enum: ['pending','running','completed','failed'], 
        default: 'pending' 
    },
    
    results: { type: Object }, // hasil scan (dalfox/sqlmap)
    
    vulnerabilities: [{ 
        type: { type: String }, 
        url: String, 
        parameter: String, 
        severity: String, 
        payload: String 
    }],
    
    scanDuration: { type: Number }, // dalam detik
    
    startedAt: { type: Date },
    completedAt: { type: Date },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Test', testSchema);