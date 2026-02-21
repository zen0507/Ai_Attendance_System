const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const Remark = require('../models/Remark');
const asyncHandler = require('express-async-handler');

/**
 * Defensive check to verify Parent -> Student link
 */
const verifyParentChildLink = async (parentId, studentUserId) => {
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent') return false;
    return parent.children.some(childId => childId.toString() === studentUserId.toString());
};

const marksService = require('../services/marksService');
const attendanceService = require('../services/attendanceService');
const analyticsService = require('../services/analyticsService');
const { getLogicSettings } = require('../utils/settingsHelper');

// @desc    Get Child Stats for Parent (Summary)
// @route   GET /api/parent/child-stats
// @access  Private (Parent only)
const getChildStats = asyncHandler(async (req, res) => {
    const parent = await User.findById(req.user._id).populate('children');
    if (!parent || parent.role !== 'parent') {
        res.status(403);
        throw new Error('Not authorized as Parent');
    }

    if (!parent.children || parent.children.length === 0) {
        return res.status(200).json({ success: true, data: null, message: 'No students linked to this account.' });
    }

    // Assuming first child for MVP
    const childUser = parent.children[0];
    const studentProfile = await Student.findOne({ userId: childUser._id });

    if (!studentProfile) {
        res.status(404);
        throw new Error('Student profile not found for the linked child.');
    }

    const settings = await getLogicSettings();

    // 1. Centralized Attendance
    const attStats = await attendanceService.calculateAttendancePercentage(studentProfile._id);
    const hasAttendanceData = attStats.hasData;
    const attendancePercentage = attStats.percentage;

    // 2. Centralized Performance & Analysis
    // getClassAverageForStudent returns per-subject data
    const performanceData = await marksService.getClassAverageForStudent(studentProfile._id);

    // Filter valid marks (those that exist in DB)
    const validMarks = performanceData.filter(m => m.total !== undefined && m.total !== null);
    const hasMarksData = validMarks.length > 0;

    const avgPerf = hasMarksData
        ? parseFloat((validMarks.reduce((sum, m) => sum + m.total, 0) / validMarks.length).toFixed(1))
        : 0;

    // Find highest/lowest valid scores
    let highestSubject = 'N/A';
    let lowestSubject = 'N/A';
    let highestScore = -1;
    let lowestScore = 101;

    validMarks.forEach(m => {
        if (m.total > highestScore) {
            highestScore = m.total;
            highestSubject = m.subject || 'Unknown';
        }
        if (m.total < lowestScore) {
            lowestScore = m.total;
            lowestSubject = m.subject || 'Unknown';
        }
    });

    // 3. Centralized Risk Profile (Using updated analyticsService)
    const riskProfile = analyticsService.getRiskProfile({
        attendancePct: attendancePercentage,
        internalMarks: avgPerf,
        attendanceTrend: [], // Future: could fetch from history
        marksTrend: []       // Future: could fetch from history
    }, settings);

    // 4. Upcoming Exams (Batch & Semester specific)
    const upcomingExams = await Exam.find({
        department: studentProfile.department,
        batch: studentProfile.batch,
        semester: studentProfile.semester,
        date: { $gte: new Date() }
    }).sort({ date: 1 }).limit(3).lean();

    // 5. Teacher Remarks
    const teacherRemarks = await Remark.find({ studentId: studentProfile._id })
        .populate('teacherId', 'name')
        .populate('subjectId', 'name')
        .sort({ createdAt: -1 })
        .limit(3);

    // 6. Subjects & Faculty
    const subjects = await Subject.find({
        department: studentProfile.department,
        batch: studentProfile.batch,
        semester: studentProfile.semester
    }).populate('teacherId', 'name email');

    res.status(200).json({
        success: true,
        data: {
            studentName: childUser.name,
            studentBatch: studentProfile.batch,
            studentDepartment: studentProfile.department,
            studentSemester: studentProfile.semester,
            attendancePercentage: hasAttendanceData ? attendancePercentage : 'N/A',
            hasAttendanceData,
            hasMarksData,
            totalSubjects: subjects.length,
            averagePerformance: avgPerf,
            highestPerforming: highestSubject,
            lowestPerforming: lowestSubject,
            riskScore: riskProfile.riskScore,
            riskLabel: riskProfile.riskLevel,
            engagementScore: riskProfile.engagementScore,
            engagementStatus: riskProfile.engagementStatus,
            riskExplanation: riskProfile.riskFactors.length > 0
                ? `Safety Score: ${riskProfile.riskScore}. Factors: ${riskProfile.riskFactors.join(', ')}.`
                : "Your child's academic health is excellent.",
            subjects: subjects.map(s => ({
                name: s.name,
                teacher: s.teacherId ? s.teacherId.name : 'Unassigned',
                teacherEmail: s.teacherId ? s.teacherId.email : null
            })),
            upcomingExams: upcomingExams.map(e => ({
                subject: e.subject,
                date: e.date,
                type: e.type
            })),
            teacherRemarks: teacherRemarks.map(r => ({
                teacher: r.teacherId?.name || 'System',
                subject: r.subjectId?.name || 'General',
                remark: r.content,
                date: r.date
            })),
            recentMarks: validMarks.slice(0, 5)
        }
    });
});

// @desc    Get Detailed Attendance for Child
// @route   GET /api/parent/child-attendance
// @access  Private (Parent only)
const getChildAttendance = asyncHandler(async (req, res) => {
    const parent = await User.findById(req.user._id);
    if (!parent || parent.role !== 'parent' || !parent.children.length) {
        res.status(403);
        throw new Error('No child data accessible.');
    }

    const childUserId = parent.children[0];
    const studentProfile = await Student.findOne({ userId: childUserId });

    if (!studentProfile) {
        res.status(404);
        throw new Error('Student profile not found');
    }

    // Use session-based attendance with strict filtering
    const attendanceRecords = await attendanceService.getStudentAttendance(
        studentProfile._id,
        studentProfile.semester,
        studentProfile.batch
    );

    res.status(200).json({ success: true, data: attendanceRecords });
});

// @desc    Get Detailed Performance for Child
// @route   GET /api/parent/child-performance
// @access  Private (Parent only)
const getChildPerformance = asyncHandler(async (req, res) => {
    const parent = await User.findById(req.user._id);
    if (!parent || parent.role !== 'parent' || !parent.children.length) {
        res.status(403);
        throw new Error('No child data accessible.');
    }

    const childUserId = parent.children[0];
    const studentProfile = await Student.findOne({ userId: childUserId });

    if (!studentProfile) {
        res.status(404);
        throw new Error('Student profile not found');
    }

    // Strict filtering by current semester and batch
    const marks = await Marks.find({
        studentId: studentProfile._id,
        semester: studentProfile.semester,
        batch: studentProfile.batch
    })
        .populate('subjectId', 'name')
        .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: marks });
});

module.exports = { getChildStats, getChildAttendance, getChildPerformance };
