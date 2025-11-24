// backend/src/controllers/activityController.js

const Test = require('../models/Test');
const Report = require('../models/Report');
const mongoose = require('mongoose');

exports.getRecentActivities = async (req, res) => {
    // 1. Validasi Keamanan
    if (!req.user || !req.user._id) {
        return res.status(401).json({ message: 'Pengguna tidak terautentikasi.' });
    }
    
    const userId = req.user._id;
    const limit = 10;
    
    try {
        // 1. Ambil Data Tests
        const recentTests = await Test.find({ userId: userId })
            // Ambil field penting. Gunakan 'completedAt' sebagai preferensi untuk aktivitas 'Selesai'.
            .select('scanType status scanLevel completedAt createdAt vulnerabilities') 
            .sort({ createdAt: -1 }) // Urutkan berdasarkan waktu pembuatan terbaru
            .limit(limit);

        // 2. Ambil Data Reports
        const recentReports = await Report.find({ userId: userId })
            .select('targetId createdAt')
            .sort({ createdAt: -1 })
            .limit(limit);

        // 3. Format dan Gabungkan Data
        let activities = [];

        // Format Tests
        recentTests.forEach(test => {
            // ✨ PERBAIKAN KRUSIAL: Menggunakan operator Nullish Coalescing (??) dan optional chaining (?)
            // 1. Tentukan tanggal (completedAt > createdAt).
            const activityDate = test.completedAt || test.createdAt;
            
            // 2. Tentukan detail status dengan aman.
            const vulnerabilityCount = test.vulnerabilities?.length || 0;
            const detailStatus = `(${test.scanLevel || 'N/A'} scan, Status: ${test.status || 'N/A'}, Vulns: ${vulnerabilityCount})`;

            // 3. Hanya tambahkan jika tanggal valid (untuk menghindari Invalid Date)
            if (activityDate) { 
                activities.push({
                    type: 'Scan',
                    date: activityDate.toISOString(), // Format ke ISO string (Mudah dibaca Frontend)
                    message: `Scan finished`,
                    detail: detailStatus,
                    relatedId: test._id 
                });
            }
        });

        // Format Reports
        recentReports.forEach(report => {
            if (report.createdAt) { // Hanya tambahkan jika tanggal valid
                activities.push({
                    type: 'Report',
                    date: report.createdAt.toISOString(),
                    message: 'Report generated',
                    detail: `Report for Target ID: ${report.targetId || 'N/A'}`,
                    relatedId: report._id
                });
            }
        });
        
        // *Opsional: Jika Anda ingin menambahkan aktivitas 'Updated Profile' dari logs, tambahkan di sini.*

        // 4. Urutkan Seluruh Aktivitas berdasarkan tanggal
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // 5. Batasi hasil akhir
        res.json(activities.slice(0, limit));

    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({ message: 'Gagal mengambil aktivitas terbaru.', error: error.message });
    }
};