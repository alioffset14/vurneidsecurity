const express = require('express');
const router = express.Router();

// ✨ PERBAIKAN 1: Import middleware autentikasi
const { authenticateCookieToken } = require('../middleware/auth'); 

const reportController = require('../controllers/reportController');

// --- Terapkan Middleware ke Semua Rute ---

router.get('/', authenticateCookieToken, reportController.getReports);
router.get('/:id', authenticateCookieToken, reportController.getReportById);
router.post('/', authenticateCookieToken, reportController.createReport);
router.delete('/:id', authenticateCookieToken, reportController.deleteReport);

// Export PDF endpoint juga harus dilindungi
router.get('/:id/export/pdf', authenticateCookieToken, reportController.exportReportPDF);

module.exports = router;