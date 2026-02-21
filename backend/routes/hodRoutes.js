const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getDashboardStats, getDepartmentManagementData, reassignFaculty, getReportsData } = require('../controllers/hodController');

router.get('/stats', protect, authorize('hod'), getDashboardStats);
router.get('/department', protect, authorize('hod'), getDepartmentManagementData);
router.put('/reassign-course', protect, authorize('hod'), reassignFaculty);
router.get('/reports', protect, authorize('hod'), getReportsData);

module.exports = router;
