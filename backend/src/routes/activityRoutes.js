// backend/src/routes/activityRoutes.js

const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticateCookieToken } = require('../middleware/auth'); 

// Rute ini harus dilindungi agar kita tahu user ID-nya
router.get('/recent', authenticateCookieToken, activityController.getRecentActivities);

module.exports = router;