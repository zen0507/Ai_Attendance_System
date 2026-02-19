const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Marks = require('../models/Marks');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const Department = require('../models/Department');
const { getLogicSettings } = require('../utils/settingsHelper');
const responseHandler = require('../utils/responseHandler');

// @desc    Get admin dashboard stats (counts, per-course insights, unique values)
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = asyncHandler(async (req, res) => {
    const { department } = req.query;
    const userFilter = {};
    const subjectFilter = {};

    if (department && department !== 'All') {
        userFilter.department = department;
        subjectFilter.department = department;
    }

    // --- Counts ---
    const [studentCount, teacherCount, courseCount] = await Promise.all([
        User.countDocuments({ ...userFilter, role: 'student' }),
        User.countDocuments({ ...userFilter, role: 'teacher' }),
        Subject.countDocuments(subjectFilter),
    ]);

    // --- Unique batches & semesters from DB ---
    const [uniqueBatches, uniqueSemesters] = await Promise.all([
        User.distinct('batch', { role: 'student', batch: { $ne: null, $ne: '' } }),
        User.distinct('semester', { role: 'student', semester: { $ne: null, $ne: '' } }),
    ]);

    // --- Per-course relational insights ---
    const subjects = await Subject.find(subjectFilter)
        .populate('teacherId', 'name email')
        .sort({ name: 1 })
        .lean();

    const subjectIds = subjects.map(s => s._id);

    // Marks aggregation: avg marks, pass rate, student count per subject
    const settings = await getLogicSettings();
    const marksAgg = await Marks.aggregate([
        { $match: { subjectId: { $in: subjectIds } } },
        {
            $group: {
                _id: '$subjectId',
                avgMarks: { $avg: '$total' },
                totalStudents: { $sum: 1 },
                passedStudents: {
                    $sum: { $cond: [{ $gte: ['$total', settings.passMarks] }, 1, 0] }
                }
            }
        }
    ]);
    const marksMap = {};
    marksAgg.forEach(m => {
        marksMap[m._id.toString()] = {
            avgMarks: Math.round((m.avgMarks || 0) * 10) / 10,
            enrolledStudents: m.totalStudents,
            passRate: m.totalStudents > 0 ? Math.round((m.passedStudents / m.totalStudents) * 1000) / 10 : 0,
        };
    });

    // Attendance aggregation: per subject
    const attendanceAgg = await AttendanceSession.aggregate([
        { $match: { subjectId: { $in: subjectIds } } },
        {
            $lookup: {
                from: 'attendancerecords',
                localField: '_id',
                foreignField: 'sessionId',
                as: 'records'
            }
        },
        { $unwind: { path: '$records', preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: '$subjectId',
                totalSessions: { $addToSet: '$_id' },
                totalRecords: { $sum: 1 },
                presentCount: {
                    $sum: { $cond: [{ $eq: ['$records.status', 'Present'] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                totalSessions: { $size: '$totalSessions' },
                totalRecords: 1,
                presentCount: 1,
                attendanceRate: {
                    $cond: [
                        { $gt: ['$totalRecords', 0] },
                        { $round: [{ $multiply: [{ $divide: ['$presentCount', '$totalRecords'] }, 100] }, 1] },
                        0
                    ]
                }
            }
        }
    ]);
    const attendanceMap = {};
    attendanceAgg.forEach(a => {
        attendanceMap[a._id.toString()] = {
            totalSessions: a.totalSessions,
            attendanceRate: a.attendanceRate,
        };
    });

    // Teacher workload: count of courses per teacher
    const teacherWorkload = {};
    subjects.forEach(s => {
        if (s.teacherId) {
            const tid = s.teacherId._id.toString();
            teacherWorkload[tid] = (teacherWorkload[tid] || 0) + 1;
        }
    });

    // Build course insights
    const courseInsights = subjects.map(s => {
        const sid = s._id.toString();
        const marks = marksMap[sid] || { avgMarks: 0, enrolledStudents: 0, passRate: 0 };
        const attendance = attendanceMap[sid] || { totalSessions: 0, attendanceRate: 0 };
        return {
            _id: s._id,
            name: s.name,
            department: s.department,
            semester: s.semester,
            batch: s.batch,
            teacher: s.teacherId ? {
                _id: s.teacherId._id,
                name: s.teacherId.name,
                email: s.teacherId.email,
                workload: teacherWorkload[s.teacherId._id.toString()] || 0,
            } : null,
            enrolledStudents: marks.enrolledStudents,
            avgMarks: marks.avgMarks,
            passRate: marks.passRate,
            totalSessions: attendance.totalSessions,
            attendanceRate: attendance.attendanceRate,
        };
    });

    // Courses per teacher summary
    const teacherSummary = {};
    subjects.forEach(s => {
        if (s.teacherId) {
            const tid = s.teacherId._id.toString();
            if (!teacherSummary[tid]) {
                teacherSummary[tid] = { name: s.teacherId.name, courseCount: 0 };
            }
            teacherSummary[tid].courseCount++;
        }
    });

    responseHandler(res, 200, {
        counts: { students: studentCount, teachers: teacherCount, courses: courseCount },
        courseInsights,
        teacherWorkload: Object.values(teacherSummary),
        uniqueBatches: uniqueBatches.filter(Boolean).sort(),
        uniqueSemesters: uniqueSemesters.filter(Boolean).sort(),
    }, 'Admin stats retrieved');
});

// @desc    Get academic health chart data (avg score + pass rate per course)
// @route   GET /api/admin/academic-health
// @access  Private/Admin
const getAcademicHealth = asyncHandler(async (req, res) => {
    const { department, semester } = req.query;
    const settings = await getLogicSettings();

    // Build subject filter
    const subjectFilter = {};
    if (department && department !== 'All') subjectFilter.department = department;
    if (semester && semester !== 'All') subjectFilter.semester = semester;

    const subjectIds = await Subject.find(subjectFilter).distinct('_id');

    if (subjectIds.length === 0) {
        return responseHandler(res, 200, [], 'No courses found for filter');
    }

    const healthData = await Marks.aggregate([
        { $match: { subjectId: { $in: subjectIds } } },
        {
            $lookup: {
                from: 'subjects',
                localField: 'subjectId',
                foreignField: '_id',
                as: 'subject'
            }
        },
        { $unwind: '$subject' },
        {
            $group: {
                _id: { name: '$subject.name', department: '$subject.department', semester: '$subject.semester' },
                averageScore: { $avg: '$total' },
                totalStudents: { $sum: 1 },
                passedStudents: {
                    $sum: { $cond: [{ $gte: ['$total', settings.passMarks] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                _id: 0,
                subject: '$_id.name',
                department: '$_id.department',
                semester: '$_id.semester',
                averageScore: { $round: ['$averageScore', 1] },
                totalStudents: 1,
                passRate: {
                    $round: [
                        { $multiply: [{ $divide: ['$passedStudents', '$totalStudents'] }, 100] },
                        1
                    ]
                }
            }
        },
        { $sort: { subject: 1 } }
    ]);

    responseHandler(res, 200, healthData, 'Academic health data retrieved');
});

module.exports = { getAdminStats, getAcademicHealth };
