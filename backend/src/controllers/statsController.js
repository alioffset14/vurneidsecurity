// backend/src/controllers/statsController.js

const Target = require('../models/Target');
const Test = require('../models/Test');
const Report = require('../models/Report'); // Asumsi Report/Vulnerability terhitung dari sini

/**
 * Menghitung dan mengembalikan statistik (Target, Test, Vuln) untuk user yang sedang login.
 * Endpoint: GET /api/stats/user
 */
exports.getUserStatistics = async (req, res) => {
    // Memastikan middleware authenticateCookieToken telah dijalankan
    if (!req.user || !req.user._id) {
        return res.status(401).json({ message: 'User not authenticated or ID missing.' });
    }

    try {
        const userId = req.user._id;
        
        // 1. Hitung Total Targets milik user
        const targetCount = await Target.countDocuments({ userId: userId });

        // 2. Hitung Total Tests milik user
        const testCount = await Test.countDocuments({ userId: userId });

        // 3. Hitung Total Vulnerabilities milik user
        // Asumsi: Vulnerabilities tersimpan dalam array 'vulnerabilities' di model Report
        // Kita hitung jumlah total elemen dalam array vulnerabilities dari semua report milik user.
        const vulnCountResult = await Report.aggregate([
            { $match: { userId: userId } }, // Filter Report berdasarkan owner
            {
                $project: {
                    // $size mengembalikan jumlah elemen di array 'vulnerabilities'
                    vulnerabilityCount: { $size: '$vulnerabilities' }
                }
            },
            {
                $group: {
                    _id: null,
                    // Menjumlahkan semua vulnerabilityCount dari setiap report
                    totalVulns: { $sum: '$vulnerabilityCount' }
                }
            }
        ]);
        
        // Dapatkan hasil totalVulns, default ke 0 jika array kosong
        const vulnCount = vulnCountResult.length > 0 ? vulnCountResult[0].totalVulns : 0;


        // 4. Kirim respons
        return res.json({
            targets: targetCount,
            tests: testCount,
            vulns: vulnCount,
        });

    } catch (error) {
        console.error('Error fetching user statistics:', error);
        return res.status(500).json({ message: 'Server error while calculating statistics.' });
    }
};