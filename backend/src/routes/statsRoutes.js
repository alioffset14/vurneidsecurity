// backend/src/routes/statsRoutes.js

const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateCookieToken } = require('../middleware/auth'); 

// Endpoint yang dipanggil oleh frontend: /api/stats/user
router.get('/user', authenticateCookieToken, statsController.getUserStatistics);

module.exports = router;