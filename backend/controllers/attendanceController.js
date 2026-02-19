const asyncHandler = require('express-async-handler');
const attendanceService = require('../services/attendanceService');
const responseHandler = require('../utils/responseHandler');

// @desc    Mark attendance for multiple students (Teacher)
// @route   POST /api/attendance
// @access  Private/Teacher
const markAttendance = asyncHandler(async (req, res) => {
    const { subjectId, date, students } = req.body;
    // Assuming this route is protected by 'protect' middleware which attaches req.user
    const teacherId = req.user ? req.user._id : null;
    await attendanceService.markStudentAttendance(subjectId, date, students, teacherId);
    responseHandler(res, 201, null, 'Attendance marked successfully');
});

// @desc    Get attendance for a student (Student/Admin/Teacher)
// @route   GET /api/attendance/:studentId
// @access  Private
const getAttendance = asyncHandler(async (req, res) => {
    const attendance = await attendanceService.getStudentAttendance(req.params.studentId);
    responseHandler(res, 200, attendance, 'Attendance retrieved successfully');
});

// @desc Get attendance percentage for a student
// @route GET /api/attendance/percentage/:studentId
// @access Private
const getAttendancePercentage = asyncHandler(async (req, res) => {
    const stats = await attendanceService.calculateAttendancePercentage(req.params.studentId);
    responseHandler(res, 200, stats, 'Attendance stats retrieved successfully');
});

module.exports = { markAttendance, getAttendance, getAttendancePercentage };

