const express = require('express');
const router = express.Router();
const { getAdminStats, getAcademicHealth } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/stats', protect, authorize('admin'), getAdminStats);
router.get('/academic-health', protect, authorize('admin'), getAcademicHealth);

module.exports = router;
