const express = require('express');
const router = express.Router();

// ✨ PERBAIKAN 1: Import middleware autentikasi
const { authenticateCookieToken } = require('../middleware/auth'); 

// ✅ Import semua function dari controller
const { 
  getTargets, 
  getTargetById, 
  createTarget, 
  updateTarget, 
  deleteTarget 
} = require('../controllers/targetController');

// --- Terapkan Middleware ke Semua Rute yang Memerlukan User ID ---

// ✅ Route list (Semua rute sekarang dilindungi oleh authenticateCookieToken)
router.get('/', authenticateCookieToken, getTargets);        
router.get('/:id', authenticateCookieToken, getTargetById);  
router.post('/', authenticateCookieToken, createTarget);     
router.put('/:id', authenticateCookieToken, updateTarget);   
router.delete('/:id', authenticateCookieToken, deleteTarget);

module.exports = router;