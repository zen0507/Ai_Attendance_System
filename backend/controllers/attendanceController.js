const asyncHandler = require('express-async-handler');
const attendanceService = require('../services/attendanceService');
const responseHandler = require('../utils/responseHandler');
const Student = require('../models/Student');
const User = require('../models/User');

const hasStudentAccess = async (user, studentId) => {
    if (['admin', 'teacher', 'hod'].includes(user.role)) return true;
    if (user.role === 'student') return user.profileId?.toString() === studentId.toString();
    if (user.role === 'parent') {
        const student = await Student.findById(studentId);
        if (!student) return false;
        const parent = await User.findById(user._id);
        return parent.children.some(childId => childId.toString() === student.userId.toString());
    }
    return false;
};

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
    if (!await hasStudentAccess(req.user, req.params.studentId)) {
        res.status(403);
        throw new Error('Not authorized to access this student\'s attendance.');
    }
    const attendance = await attendanceService.getStudentAttendance(req.params.studentId);
    responseHandler(res, 200, attendance, 'Attendance retrieved successfully');
});

// @desc Get attendance percentage for a student
// @route GET /api/attendance/percentage/:studentId
// @access Private
const getAttendancePercentage = asyncHandler(async (req, res) => {
    if (!await hasStudentAccess(req.user, req.params.studentId)) {
        res.status(403);
        throw new Error('Not authorized to access this student\'s attendance stats.');
    }
    const stats = await attendanceService.calculateAttendancePercentage(req.params.studentId);
    responseHandler(res, 200, stats, 'Attendance stats retrieved successfully');
});

module.exports = { markAttendance, getAttendance, getAttendancePercentage };

