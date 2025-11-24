const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    // ✨ FIELD BARU KRUSIAL: Menghubungkan Report dengan User yang membuatnya
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Target' },
    
    summary: String,
    vulnerabilities: { type: Array, default: [] },
    severityCount: { type: Object, default: {} },
    meta: { type: Object, default: {} },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);