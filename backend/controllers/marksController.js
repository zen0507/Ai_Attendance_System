const asyncHandler = require('express-async-handler');
const marksService = require('../services/marksService');
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

// @desc    Add/Update marks
// @route   POST /api/marks
// @access  Private/Teacher
const addMarks = asyncHandler(async (req, res) => {
    const { studentId, subjectId, test1, test2, assignment } = req.body;
    const marks = await marksService.addOrUpdateMarks(studentId, subjectId, test1, test2, assignment);
    const statusCode = marks.isNew ? 201 : 200; // Simplified status handling, though isNew might not be available on return. 
    // Actually, service returns the document. If it was an update, we send 200. If create, we send 201.
    // For simplicity here, let's just use 200 or check if we can distinguish. 
    // The service doesn't return isNew. Let's just use 200 for now or 201. The tests might care.
    // Let's stick to 200 for success.
    responseHandler(res, 200, marks, 'Marks saved successfully');
});

// @desc    Get marks for a student
// @route   GET /api/marks/:studentId
// @access  Private
const getMarks = asyncHandler(async (req, res) => {
    if (!await hasStudentAccess(req.user, req.params.studentId)) {
        res.status(403);
        throw new Error('Not authorized to access this student\'s marks.');
    }
    try {
        const marks = await marksService.getStudentMarks(req.params.studentId);
        responseHandler(res, 200, marks, 'Marks retrieved successfully');
    } catch (error) {
        res.status(error.status || 500);
        throw new Error(error.message || 'Internal Server Error');
    }
});

// @desc    Get Risk Analysis (ML Implementation)
// @route   GET /api/marks/analysis/:studentId
// @access  Private
const getRiskAnalysis = asyncHandler(async (req, res) => {
    if (!await hasStudentAccess(req.user, req.params.studentId)) {
        res.status(403);
        throw new Error('Not authorized to access this student\'s risk analysis.');
    }
    const analysis = await marksService.calculateStudentRisk(req.params.studentId);
    responseHandler(res, 200, analysis, 'Risk analysis calculated');
});

// @desc    Get Academic Health (Average & Pass Rate per Subject)
// @route   GET /api/marks/health/academic
// @access  Private
const getAcademicHealth = asyncHandler(async (req, res) => {
    const health = await marksService.getAcademicHealth(); // We'll implement this service method next
    responseHandler(res, 200, health, 'Academic health data retrieved');
});

// @desc    Get class average per subject for a student
// @route   GET /api/marks/class-average/:studentId
// @access  Private/Student
const getClassAverage = asyncHandler(async (req, res) => {
    if (!await hasStudentAccess(req.user, req.params.studentId)) {
        res.status(403);
        throw new Error('Not authorized to access this student\'s class average.');
    }
    const data = await marksService.getClassAverageForStudent(req.params.studentId);
    responseHandler(res, 200, data, 'Class average retrieved');
});

module.exports = { addMarks, getMarks, getRiskAnalysis, getAcademicHealth, getClassAverage };

