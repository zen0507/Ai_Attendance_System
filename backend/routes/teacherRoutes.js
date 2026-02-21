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

router.get('/dashboard-stats', protect, authorize('teacher', 'hod'), getTeacherStats);
router.get('/subjects', protect, authorize('teacher', 'hod'), getTeacherSubjects);
router.get('/students', protect, authorize('teacher', 'hod'), getStudentsBySubject);
router.get('/attendance', protect, authorize('teacher', 'hod'), getAttendanceByDate);
router.post('/marks/bulk', protect, authorize('teacher', 'hod'), bulkUpdateMarks);
router.post('/attendance', protect, authorize('teacher', 'hod'), markAttendance);

module.exports = router;
