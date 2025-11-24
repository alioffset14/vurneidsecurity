const Test = require('../models/Test');
const ScannerService = require('../services/scannerService');
const mongoose = require('mongoose');
// 💥 1. IMPORT FUNGSI PEMBUAT LAPORAN OTOMATIS
// Asumsi: file ini berada di lokasi yang sama atau dapat diakses dengan path ini.
const { generateReportFromTestId } = require('./reportController'); 

// ==========================================================
// TEST CONTROLLER METHODS
// ==========================================================

// ✅ GET semua test milik user yang login
exports.getTests = async (req, res) => {
    const userId = req.user._id; 
    
    try {
        const tests = await Test.find({ userId: userId }) 
            .populate('targetId', 'name url') 
            .sort({ createdAt: -1 });
            
        res.json(tests);
    } catch (err) {
        console.error('getTests error:', err);
        res.status(500).json({ error: 'Gagal mengambil tests' });
    }
};

// ✅ GET status test by ID
exports.getTestStatus = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id; 
    
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID test tidak valid' });
        }

        const test = await Test.findOne({ _id: id, userId: userId }).select( 
            'status scanType scanLevel scanDuration results vulnerabilitiesCount createdAt startedAt completedAt'
        );

        if (!test) {
            return res.status(404).json({ error: 'Test tidak ditemukan atau Anda tidak memiliki akses' }); 
        }

        res.json({
            id: test._id,
            status: test.status,
            scanType: test.scanType,
            scanLevel: test.scanLevel,
            createdAt: test.createdAt,
            startedAt: test.startedAt,
            completedAt: test.completedAt,
            scanDuration: test.scanDuration,
            vulnerabilitiesCount:
                test.results?.vulnerabilities?.length || test.vulnerabilitiesCount || 0
        });
    } catch (err) {
        console.error('getTestStatus error:', err);
        res.status(500).json({ error: 'Gagal mengambil status test' });
    }
};

// ✅ POST buat test baru & jalankan scanner
exports.createTest = async (req, res) => {
    try {
        const { targetId, scanType, scanLevel, parameters } = req.body;
        const userId = req.user._id; 

        // Validasi input
        if (!mongoose.Types.ObjectId.isValid(targetId)) {
            return res.status(400).json({ error: 'targetId tidak valid' });
        }
        if (!parameters || typeof parameters.url !== 'string') {
            return res.status(400).json({ error: 'URL target wajib diisi' });
        }
        if (!scanType) {
            return res.status(400).json({ error: 'scanType wajib diisi' });
        }

        const newTest = new Test({
            userId, 
            targetId,
            scanType,
            scanLevel: scanLevel || 'medium',
            parameters,
            status: 'pending' // Mulai dengan pending
        });

        const savedTest = await newTest.save();

        // Jalankan scanner async (non-blocking)
        ScannerService.runTest(savedTest._id, parameters.url, scanType, scanLevel)
            .then(async ({ results, duration }) => {
                
                // 💥 2. LOGIKA PENYELESAIAN TEST (setelah scanner selesai)
                const completedTest = await Test.findByIdAndUpdate(
                    savedTest._id,
                    {
                        status: 'Completed',
                        results: results, // Simpan hasil scan
                        scanDuration: duration, // Simpan durasi
                        completedAt: new Date()
                    },
                    { new: true }
                );

                // 💥 3. PANGGIL FUNGSI PEMBUAT LAPORAN OTOMATIS
                try {
                    // Gunakan ID test yang baru selesai dan userId pemiliknya
                    await generateReportFromTestId(completedTest._id, completedTest.userId); 
                    console.log(`[Test ${completedTest._id}] Laporan berhasil dibuat secara otomatis.`);
                } catch (reportError) {
                    console.error(`[Test ${completedTest._id}] Gagal membuat laporan otomatis:`, reportError.message);
                }

                console.log(`[Test ${savedTest._id}] Scanner selesai dan status diperbarui.`);
            })
            .catch(async (err) => {
                console.error(`[Test ${savedTest._id}] Scanner error:`, err);
                // Update status test menjadi Failed jika ada error
                await Test.findByIdAndUpdate(savedTest._id, { status: 'Failed' });
            });

        // Client langsung dapat ID untuk tracking
        res.status(201).json({
            message: 'Test berhasil dibuat, scanner sedang berjalan',
            testId: savedTest._id,
            status: savedTest.status
        });
    } catch (err) {
        console.error('createTest error:', err);
        res.status(500).json({ error: 'Gagal membuat test' });
    }
};

// ✅ DELETE test
exports.deleteTest = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id; 
    
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID test tidak valid' });
        }

        const deleted = await Test.findOneAndDelete({ _id: id, userId: userId });
        
        if (!deleted) return res.status(404).json({ 
            error: 'Test tidak ditemukan atau Anda tidak memiliki izin untuk menghapusnya' 
        });
        
        res.json({ message: 'Test berhasil dihapus' });
    } catch (err) {
        console.error('deleteTest error:', err);
        res.status(500).json({ error: 'Gagal menghapus test' });
    }
};