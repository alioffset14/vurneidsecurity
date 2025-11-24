const express = require('express');
const router = express.Router();

// ✨ PERBAIKAN 1: Import middleware autentikasi
const { authenticateCookieToken } = require('../middleware/auth'); 

const testController = require('../controllers/testController');

// --- Terapkan Middleware ke Semua Rute yang Memerlukan User ID ---

router.get('/', authenticateCookieToken, testController.getTests);
router.get('/:id/status', authenticateCookieToken, testController.getTestStatus);
router.post('/', authenticateCookieToken, testController.createTest);
router.delete('/:id', authenticateCookieToken, testController.deleteTest);

module.exports = router;