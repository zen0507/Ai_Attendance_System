const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getChildStats, getChildAttendance, getChildPerformance } = require('../controllers/parentController');

router.get('/child-stats', protect, authorize('parent'), getChildStats);
router.get('/child-attendance', protect, authorize('parent'), getChildAttendance);
router.get('/child-performance', protect, authorize('parent'), getChildPerformance);

module.exports = router;
