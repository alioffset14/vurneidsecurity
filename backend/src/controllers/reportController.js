const Report = require('../models/Report');
const Test = require('../models/Test');
const Target = require('../models/Target');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

// ==========================================================
// FUNGSI UTILITY: Logika Inti Pembuatan Laporan (Dapat Dipanggil Internal)
// ==========================================================
/**
 * Membuat entitas Report baru berdasarkan hasil dari Test ID yang diberikan.
 * @param {string} testId ID dari Test yang telah selesai.
 * @param {string} currentUserId ID dari pengguna yang memiliki Test.
 * @returns {Promise<Report>} Objek Report yang telah disimpan.
 */
const generateReportFromTestId = async (testId, currentUserId) => {
    if (!mongoose.Types.ObjectId.isValid(testId)) {
        throw new Error('testId tidak valid');
    }

    // Ambil test, termasuk userId. TargetId perlu dipopulasi jika diperlukan 
    // di sini, tetapi karena hanya _id yang dibutuhkan, findById cukup.
    const test = await Test.findById(testId);
    if (!test) {
        throw new Error('Test tidak ditemukan');
    }

    // Pemeriksaan keamanan: Pastikan test ini milik user yang login
    if (test.userId.toString() !== currentUserId.toString()) {
        throw new Error('Anda tidak memiliki izin untuk membuat report dari test ini.');
    }

    // Cek apakah report sudah pernah dibuat
    const existingReport = await Report.findOne({ testId: testId, userId: currentUserId });
    if (existingReport) {
        // Jika sudah ada, kembalikan saja yang sudah ada (pencegahan duplikasi)
        console.log(`Report untuk Test ${testId} sudah ada.`);
        return existingReport;
    }
    
    const vulnerabilities = test.results?.vulnerabilities || [];

    // Buat summary
    // Logika severityCount dihapus karena tidak digunakan untuk disimpan, 
    // tetapi dihitung saat getReportById

    const newReport = new Report({
        userId: test.userId,
        testId: test._id,
        targetId: test.targetId, // targetId sudah ada di objek test
        summary: `Ditemukan ${vulnerabilities.length || 0} vulnerabilities`,
        vulnerabilities: vulnerabilities
    });

    const savedReport = await newReport.save();
    return savedReport;
};


// ==========================================================
// REPORT CONTROLLER METHODS
// ==========================================================

// GET semua report milik user yang login
exports.getReports = async (req, res) => {
    const userId = req.user._id; // Ambil ID user dari request
    try {
        const reports = await Report.find({ userId: userId }) 
            .populate('testId', 'status scanDuration createdAt')
            .populate('targetId', 'name url')
            .sort({ createdAt: -1 });

        res.json(reports);
    } catch (err) {
        console.error('getReports error:', err);
        res.status(500).json({ error: 'Gagal mengambil reports' });
    }
};

// GET report by ID
exports.getReportById = async (req, res) => {
    const userId = req.user._id; // Ambil ID user dari request
    try {
        const report = await Report.findOne({ _id: req.params.id, userId: userId }) 
            .populate('testId', 'scanType scanLevel createdAt parameters')
            .populate('targetId', 'name url');

        if (!report) return res.status(404).json({ error: 'Report tidak ditemukan atau Anda tidak memiliki akses' });

        const vulnList = Array.isArray(report.vulnerabilities) ? report.vulnerabilities : [];

        // Hitung severity
        const severityCount = { critical: 0, high: 0, medium: 0, low: 0 };
        vulnList.forEach(v => {
            const sev = (v.severity || 'low').toLowerCase();
            if (severityCount[sev] !== undefined) severityCount[sev]++;
            else severityCount.low++;
        });

        // Susun response yang cocok dengan ReportViewer.js
        res.json({
            _id: report._id,
            title: `Report for ${report.testId?.scanType || 'Security Test'}`,
            generatedAt: report.createdAt,
            summary: {
                totalVulnerabilities: vulnList.length,
                ...severityCount
            },
            details: vulnList, 
            recommendations: [
                "Gunakan parameterized queries (prepared statements).",
                "Validasi input dengan whitelist.",
                "Implementasikan Content Security Policy (CSP).",
                "Perbarui framework dan library ke versi terbaru."
            ],
            target: report.targetId,
            test: report.testId
        });
    } catch (err) {
        res.status(500).json({ error: 'Gagal mengambil report', detail: err.message });
    }
};


// POST buat report berdasarkan test (Endpoint API)
exports.createReport = async (req, res) => {
    try {
        const { testId } = req.body;
        const userId = req.user._id;

        // Memanggil fungsi utility
        const savedReport = await generateReportFromTestId(testId, userId);
        
        res.status(201).json(savedReport);
    } catch (err) {
        console.error('createReport error:', err);
        // Tangani error izin (403) atau tidak ditemukan (404)
        if (err.message.includes('izin') || err.message.includes('ditemukan') || err.message.includes('valid')) {
            return res.status(400).json({ error: err.message });
        }
        res.status(500).json({ error: 'Gagal membuat report' });
    }
};

// DELETE report
exports.deleteReport = async (req, res) => {
    const userId = req.user._id; // Ambil ID user dari request
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID report tidak valid' });
        }

        const deleted = await Report.findOneAndDelete({ _id: id, userId: userId });
        
        if (!deleted) return res.status(404).json({ 
            error: 'Report tidak ditemukan atau Anda tidak memiliki izin untuk menghapusnya' 
        });

        res.json({ message: 'Report berhasil dihapus' });
    } catch (err) {
        console.error('deleteReport error:', err);
        res.status(500).json({ error: 'Gagal menghapus report' });
    }
};

exports.exportReportPDF = async (req, res) => {
    const userId = req.user._id; // Ambil ID user dari request
    try {
        const { id } = req.params;
        
        const report = await Report.findOne({ _id: id, userId: userId }) 
            .populate('testId', 'scanType scanLevel createdAt scanDuration')
            .populate('targetId', 'name url');

        if (!report) {
            return res.status(404).json({ error: 'Report tidak ditemukan atau Anda tidak memiliki akses' });
        }

        // --- Logika PDF Generation ---

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report-${id}.pdf`);

        // Buat dokumen PDF
        const doc = new PDFDocument();
        doc.pipe(res);

        // Judul
        doc.fontSize(18).text('Security Report', { align: 'center' });
        doc.moveDown();

        // Info dasar
        doc.fontSize(12).text(`Target: ${report.targetId?.name || '-'} (${report.targetId?.url || '-'})`);
        doc.text(`Scan Type: ${report.testId?.scanType || '-'}`);
        doc.text(`Scan Level: ${report.testId?.scanLevel || '-'}`);
        doc.text(`Scan Duration: ${report.testId?.scanDuration || 0} detik`);
        doc.text(`Generated At: ${new Date(report.createdAt).toLocaleString()}`);
        doc.moveDown();

        // Summary
        doc.fontSize(14).text('Summary', { underline: true });
        doc.fontSize(12).text(`Total Vulnerabilities: ${report.vulnerabilities?.length || 0}`);
        doc.moveDown();

        // Vulnerabilities as table
        doc.moveDown();
        doc.fontSize(14).text('Vulnerabilities', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const colWidths = [30, 70, 80, 100, 100, 100, 100]; 

        // Table Header
        const headers = ["#", "Severity", "Type", "Parameter", "Payload", "URL", "Evidence"];
        headers.forEach((header, i) => {
            doc.fontSize(10).text(header, 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop, {
                width: colWidths[i],
                align: "left"
            });
        });
        doc.moveDown(1);

        // Table Rows
        report.vulnerabilities.forEach((v, idx) => {
            const y = doc.y;
            const row = [
                idx + 1,
                (v.severity || "-").toUpperCase(),
                v.type || "-",
                v.parameter || "-",
                v.payload || "-",
                v.url || "-",
                v.evidence || "-"
            ];

            row.forEach((cell, i) => {
                doc.fontSize(9).text(String(cell), 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y, {
                    width: colWidths[i],
                    align: "left"
                });
            });

            doc.moveDown(1);
        });

        // Selesai
        doc.end();

    } catch (err) {
        console.error('exportReportPDF error:', err);
        res.status(500).json({ error: 'Gagal export report ke PDF' });
    }
};

// --- EKSPOR FUNGSI UTILITY BARU AGAR BISA DIGUNAKAN DI CONTROLLER LAIN ---
module.exports.generateReportFromTestId = generateReportFromTestId;