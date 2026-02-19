const express = require('express');
const router = express.Router();
const {
    getTeacherStats,
    getTeacherSubjects,
    getStudentsBySubject,
    getAttendanceByDate,
    bulkUpdateMarks,
    markAttendance
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Base path: /api/teacher

router.get('/dashboard-stats', protect, authorize('teacher'), getTeacherStats);
router.get('/subjects', protect, authorize('teacher'), getTeacherSubjects);
router.get('/students', protect, authorize('teacher'), getStudentsBySubject);
router.get('/attendance', protect, authorize('teacher'), getAttendanceByDate);
router.post('/marks/bulk', protect, authorize('teacher'), bulkUpdateMarks);
router.post('/attendance', protect, authorize('teacher'), markAttendance);

module.exports = router;
