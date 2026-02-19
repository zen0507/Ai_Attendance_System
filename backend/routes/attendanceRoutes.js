const express = require('express');
const router = express.Router();
const { markAttendance, getAttendance, getAttendancePercentage } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const { attendanceSchema } = require('../utils/validationSchemas');

router.route('/')
    .post(protect, authorize('teacher', 'admin'), validate(attendanceSchema), markAttendance);

router.route('/:studentId')
    .get(protect, authorize('student', 'teacher', 'admin'), getAttendance);

router.route('/percentage/:studentId')
    .get(protect, authorize('student', 'teacher', 'admin'), getAttendancePercentage);

module.exports = router;

