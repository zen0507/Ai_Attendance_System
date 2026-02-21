const asyncHandler = require('express-async-handler');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Student = require('../models/Student');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const Marks = require('../models/Marks');
const responseHandler = require('../utils/responseHandler');
const analyticsService = require('../services/analyticsService');
const { getLogicSettings } = require('../utils/settingsHelper');

const safe = analyticsService.safe;

// ─── HELPER: get teacher's department ───
const getTeacherDept = async (userId) => {
    const teacher = await Teacher.findOne({ userId });
    if (!teacher) return null;
    return teacher;
};

// ─── HELPER: calculate per-student attendance % from raw records ───
const calcStudentAttendance = (studentId, allRecords, allSessions) => {
    const myRecs = allRecords.filter(r => r.studentId.toString() === studentId.toString());
    let hoursPresent = 0, hoursTotal = 0;
    myRecs.forEach(r => {
        const sess = allSessions.find(s => s._id.toString() === r.sessionId.toString());
        const h = safe(sess?.hoursConducted) || 1;
        hoursTotal += h;
        if (r.status === 'Present') hoursPresent += h;
    });
    return { hoursPresent, hoursTotal, pct: hoursTotal > 0 ? (hoursPresent / hoursTotal) * 100 : -1 };
};

// ================================================================
// @desc    Get Dashboard Stats (Fully Dynamic, Settings-Aware)
// @route   GET /api/teacher/dashboard-stats
// ================================================================
const getTeacherStats = asyncHandler(async (req, res) => {
    const teacher = await getTeacherDept(req.user._id);
    if (!teacher) { res.status(404); throw new Error('Teacher profile not found'); }

    const settings = await getLogicSettings();
    const { minAttendance, passMarks, weightage } = settings;

    const subjects = await Subject.find({ teacherId: teacher.userId });
    if (!subjects.length) {
        return responseHandler(res, 200, {
            totalSubjects: 0, totalStudents: 0, avgAttendance: '0.0', avgMarks: '0.0',
            highRiskStudents: [], highRiskCount: 0, subjectPerformance: [],
            componentStats: { test1: '0.0', test2: '0.0', assignment: '0.0' },
            weakestComponent: null,
            analytics: { forecast: null, consistencyScore: 0 },
            settings: { minAttendance, passMarks, weightage }
        }, 'No subjects assigned');
    }

    const subjectIds = subjects.map(s => s._id);
    const uniqueBatches = [...new Set(subjects.map(s => s.batch))].filter(Boolean);

    // --- FETCH RAW DATA ---
    const studentsModel = await User.find({
        role: 'student', batch: { $in: uniqueBatches }, department: teacher.department
    }).select('name email registerNo batch').lean();

    // Look up Student profile IDs (Student._id) for each user
    const studentProfiles = await Student.find({
        userId: { $in: studentsModel.map(s => s._id) }
    }).select('userId').lean();
    const userToProfileId = {};
    studentProfiles.forEach(p => { userToProfileId[p.userId.toString()] = p._id; });

    // Use Student._id (profileId) for attendance/marks queries
    const studentProfileIds = studentProfiles.map(p => p._id);

    const allMarks = await Marks.find({
        subjectId: { $in: subjectIds }, studentId: { $in: studentProfileIds }
    }).lean();

    const allSessions = await AttendanceSession.find({ subjectId: { $in: subjectIds } }).sort({ date: 1 }).lean();
    const sessionIds = allSessions.map(s => s._id);
    const allRecords = await AttendanceRecord.find({
        sessionId: { $in: sessionIds }, studentId: { $in: studentProfileIds }
    }).lean();

    // --- PER-STUDENT AGGREGATION ---
    let highRiskStudents = [];
    let forecastInputs = [];
    let totalPresent = 0, totalHours = 0;
    let t1Sum = 0, t2Sum = 0, assignSum = 0, totalSum = 0, markEntryCount = 0;

    for (const student of studentsModel) {
        // Use Student profile ID for attendance/marks lookup
        const profileId = userToProfileId[student._id.toString()];
        if (!profileId) continue; // skip if no profile found

        // Attendance
        const att = calcStudentAttendance(profileId, allRecords, allSessions);
        totalPresent += att.hoursPresent;
        totalHours += att.hoursTotal;

        // Marks — Use direct sum (30 + 30 + 40 = 100)
        const myMarks = allMarks.filter(m => m.studentId.toString() === profileId.toString());
        let sTotal = 0;
        myMarks.forEach(m => {
            const t1 = safe(m.test1); const t2 = safe(m.test2); const a = safe(m.assignment);
            // REQUIREMENT: Total = Test1(30) + Test2(30) + Assignment(40) = 100
            const rawTotal = t1 + t2 + a;
            t1Sum += t1; t2Sum += t2; assignSum += a;
            totalSum += rawTotal; sTotal += rawTotal;
            markEntryCount++;
        });
        const marksAvg = myMarks.length ? sTotal / myMarks.length : -1;

        // Risk logic: only flag if data exists
        let riskReasons = [];
        if (att.pct >= 0 && att.pct < minAttendance)
            riskReasons.push(`Low Attendance (${att.pct.toFixed(1)}%)`);
        if (marksAvg >= 0 && marksAvg < passMarks)
            riskReasons.push(`Low Marks (${marksAvg.toFixed(1)}/${passMarks})`);

        if (riskReasons.length > 0) {
            highRiskStudents.push({
                _id: student._id,
                name: student.name,
                batch: student.batch,
                attendance: att.pct >= 0 ? att.pct.toFixed(1) : 'N/A',
                marks: marksAvg >= 0 ? marksAvg.toFixed(1) : 'N/A',
                risk: riskReasons.length >= 2 ? 'Critical' : 'High',
                reason: riskReasons.join(' & ')
            });
        }

        if (marksAvg >= 0) {
            forecastInputs.push({
                total: marksAvg,
                attendancePct: att.pct >= 0 ? att.pct : 100
            });
        }
    }

    // Sort risk students: Critical first, then by attendance ascending
    highRiskStudents.sort((a, b) => {
        if (a.risk === 'Critical' && b.risk !== 'Critical') return -1;
        if (a.risk !== 'Critical' && b.risk === 'Critical') return 1;
        return parseFloat(a.attendance || 999) - parseFloat(b.attendance || 999);
    });

    // --- Averages ---
    const avgAtt = totalHours > 0 ? (totalPresent / totalHours) * 100 : 0;
    const avgT1 = markEntryCount ? t1Sum / markEntryCount : 0;
    const avgT2 = markEntryCount ? t2Sum / markEntryCount : 0;
    const avgAssign = markEntryCount ? assignSum / markEntryCount : 0;
    const avgTotal = markEntryCount ? totalSum / markEntryCount : 0;

    // --- Subject Performance ---
    const subPerf = {};
    allMarks.forEach(m => {
        const rawTotal = safe(m.test1) + safe(m.test2) + safe(m.assignment);
        if (!subPerf[m.subjectId]) subPerf[m.subjectId] = { sum: 0, count: 0 };
        subPerf[m.subjectId].sum += rawTotal;
        subPerf[m.subjectId].count++;
    });
    const subjectPerformance = subjects.map(s => ({
        subject: s.name,
        avg: subPerf[s._id] ? (subPerf[s._id].sum / subPerf[s._id].count).toFixed(1) : '0.0'
    }));

    // --- Weakest Component (percentage-normalized) ---
    let weakestComponent = null;
    if (markEntryCount > 0) {
        const deviation = analyticsService.getComponentDeviation(allMarks);
        if (deviation.weakComponent !== 'None') {
            const key = deviation.weakComponent === 'Test 1' ? 'test1' : deviation.weakComponent === 'Test 2' ? 'test2' : 'assignment';
            weakestComponent = {
                name: deviation.weakComponent,
                avg: deviation.averages[key],
                pct: deviation.percentages[key]
            };
        }
    }

    // --- Forecast ---
    const forecast = forecastInputs.length > 0
        ? analyticsService.predictClassPassRate(forecastInputs, passMarks)
        : null;

    // --- Consistency Score ---
    const weightedTotals = allMarks.map(m =>
        (safe(m.test1) * weightage.test1) + (safe(m.test2) * weightage.test2) + (safe(m.assignment) * weightage.assignment)
    );
    const consistencyScore = weightedTotals.length >= 2
        ? analyticsService.getConsistencyScore(weightedTotals)
        : 0;

    // --- RESPONSE ---
    responseHandler(res, 200, {
        totalSubjects: subjects.length,
        totalStudents: studentsModel.length,
        avgAttendance: avgAtt.toFixed(1),
        avgMarks: avgTotal.toFixed(1),

        highRiskStudents: highRiskStudents.slice(0, 10),
        highRiskCount: highRiskStudents.length,

        subjectPerformance,
        componentStats: {
            test1: avgT1.toFixed(1),
            test2: avgT2.toFixed(1),
            assignment: avgAssign.toFixed(1)
        },
        weakestComponent,

        analytics: { forecast, consistencyScore: Math.round(consistencyScore) },
        settings: { minAttendance, passMarks, weightage }
    }, 'Stats retrieved');
});

// ================================================================
// @desc    Get Students by Subject + Marks + Per-Student Attendance
// @route   GET /api/teacher/students
// ================================================================
const getStudentsBySubject = asyncHandler(async (req, res) => {
    const { subjectId, semester } = req.query;
    if (!subjectId) { res.status(400); throw new Error('Subject ID required'); }

    const settings = await getLogicSettings();
    const { weightage, passMarks, minAttendance } = settings;

    const subject = await Subject.findById(subjectId);
    if (!subject) { res.status(404); throw new Error('Subject not found'); }

    const sem = semester || subject.semester;

    const students = await User.find({
        role: 'student', department: subject.department,
        batch: subject.batch, semester: sem
    }).select('name email registerNo batch semester').sort({ registerNo: 1, name: 1 }).lean();

    // Look up Student profile IDs (Student._id) for each user
    const studentProfiles = await Student.find({
        userId: { $in: students.map(s => s._id) }
    }).select('userId').lean();
    const userToProfileId = {};
    studentProfiles.forEach(p => { userToProfileId[p.userId.toString()] = p._id; });
    const studentProfileIds = studentProfiles.map(p => p._id);

    // Attendance for THIS subject
    const sessions = await AttendanceSession.find({ subjectId: subject._id }).lean();
    const sessionIds = sessions.map(s => s._id);
    const records = await AttendanceRecord.find({
        sessionId: { $in: sessionIds }, studentId: { $in: studentProfileIds }
    }).lean();

    // Marks for THIS subject
    const marks = await Marks.find({
        subjectId: subject._id, studentId: { $in: studentProfileIds }
    }).lean();

    let passed = 0, totalClassMarks = 0, marksCount = 0;

    const processedStudents = students.map(s => {
        // Use Student profile ID for attendance/marks lookup
        const profileId = userToProfileId[s._id.toString()];

        // Per-student attendance for this subject
        const att = profileId ? calcStudentAttendance(profileId, records, sessions) : { pct: -1, hoursPresent: 0, hoursTotal: 0 };

        // Marks
        const myMark = profileId ? marks.find(m => m.studentId.toString() === profileId.toString()) : null;
        let markTotal = 0;
        if (myMark) {
            markTotal = safe(myMark.test1) + safe(myMark.test2) + safe(myMark.assignment);
            totalClassMarks += markTotal;
            marksCount++;
            if (markTotal >= passMarks) passed++;
        }

        // Risk classification
        let risk = 'Low';
        const hasAttRisk = att.pct >= 0 && att.pct < minAttendance;
        const hasMarkRisk = myMark && recalcTotal < passMarks;
        if (hasAttRisk && hasMarkRisk) risk = 'Critical';
        else if (hasAttRisk || hasMarkRisk) risk = 'High';
        else if (att.pct >= 0 && att.pct < minAttendance + 5) risk = 'Moderate';

        return {
            _id: s._id,
            studentProfileId: profileId || null, // Student._id for use in attendance/marks submission
            name: s.name,
            email: s.email,
            registerNo: s.registerNo || null,
            batch: s.batch,
            semester: s.semester,
            attendanceStats: {
                percentage: att.pct >= 0 ? parseFloat(att.pct.toFixed(1)) : null,
                hoursPresent: att.hoursPresent,
                hoursTotal: att.hoursTotal
            },
            marks: myMark ? {
                test1: safe(myMark.test1),
                test2: safe(myMark.test2),
                assignment: safe(myMark.assignment),
                total: parseFloat((safe(myMark.test1) + safe(myMark.test2) + safe(myMark.assignment)).toFixed(1))
            } : null,
            riskLevel: risk,
            academicStatus: (myMark && recalcTotal < passMarks) ? 'Failing' : 'Passing'
        };
    });

    // Distribution — 10-point bins on 0-100 scale (standardized)
    const dist = { '0-20': 0, '20-40': 0, '40-60': 0, '60-80': 0, '80-100': 0 };
    marks.forEach(m => {
        const t = safe(m.test1) + safe(m.test2) + safe(m.assignment);
        if (t < 20) dist['0-20']++;
        else if (t < 40) dist['20-40']++;
        else if (t < 60) dist['40-60']++;
        else if (t < 80) dist['60-80']++;
        else dist['80-100']++;
    });

    responseHandler(res, 200, {
        students: processedStudents,
        stats: {
            totalSessions: sessions.length,
            classAverageMarks: marksCount ? (totalClassMarks / marksCount).toFixed(1) : '0.0',
            passPercentage: marksCount ? ((passed / marksCount) * 100).toFixed(1) : '0.0',
            distribution: dist
        }
    }, 'Data retrieved');
});

// ================================================================
// @desc    Get Attendance for a Specific Date (for editing)
// @route   GET /api/teacher/attendance?subjectId=...&batch=...&date=...
// ================================================================
const getAttendanceByDate = asyncHandler(async (req, res) => {
    const { subjectId, batch, date } = req.query;

    if (!subjectId || !date) {
        res.status(400); throw new Error('subjectId and date are required');
    }

    const targetDate = new Date(date);
    const start = new Date(targetDate); start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate); end.setHours(23, 59, 59, 999);

    const query = { subjectId, date: { $gte: start, $lte: end } };
    if (batch) query.batch = batch;

    const session = await AttendanceSession.findOne(query);

    if (!session) {
        return responseHandler(res, 200, { exists: false, records: [] }, 'No attendance recorded for this date');
    }

    const records = await AttendanceRecord.find({ sessionId: session._id })
        .populate({ path: 'studentId', model: 'Student', select: 'userId' })
        .lean();

    // Get User info for each student profile
    const userIds = records.map(r => r.studentId?.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).select('name email registerNo').lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const formatted = records.map(r => {
        const profileId = r.studentId?._id || r.studentId;
        const userId = r.studentId?.userId;
        const userInfo = userId ? userMap[userId.toString()] : null;
        return {
            studentId: profileId, // Student._id
            name: userInfo?.name || 'Unknown',
            registerNo: userInfo?.registerNo || null,
            status: r.status
        };
    });

    responseHandler(res, 200, {
        exists: true,
        sessionId: session._id,
        date: session.date,
        hoursConducted: session.hoursConducted,
        records: formatted
    }, 'Attendance found for this date');
});

// ================================================================
// @desc    Mark/Update Attendance
// @route   POST /api/teacher/attendance
// ================================================================
const markAttendance = asyncHandler(async (req, res) => {
    const { subjectId, batch, hours, students, date } = req.body;

    if (!subjectId || !students || !date) {
        res.status(400); throw new Error("Subject, students, and date are required.");
    }

    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (targetDate > today) {
        res.status(400); throw new Error("Cannot mark attendance for future dates.");
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) { res.status(404); throw new Error("Subject not found"); }

    const start = new Date(targetDate); start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate); end.setHours(23, 59, 59, 999);

    // Check for existing session (upsert)
    let session = await AttendanceSession.findOne({ subjectId, batch, date: { $gte: start, $lte: end } });
    let isUpdate = false;

    if (session) {
        isUpdate = true;
        session.hoursConducted = hours || 1;
        await session.save();
        await AttendanceRecord.deleteMany({ sessionId: session._id });
    } else {
        session = await AttendanceSession.create({
            subjectId, teacherId: req.user._id, department: subject.department,
            batch, semester: subject.semester, date: targetDate, hoursConducted: hours || 1
        });
    }

    const recordDocs = students.map(s => ({
        // s._id is now Student._id (studentProfileId) sent from frontend
        sessionId: session._id, studentId: s._id, status: s.status || 'Present'
    }));
    await AttendanceRecord.insertMany(recordDocs);

    responseHandler(res, 200, {
        sessionId: session._id,
        isUpdate
    }, isUpdate ? 'Attendance updated' : 'Attendance marked');
});

// ================================================================
// @desc    Bulk Update Marks
// @route   POST /api/teacher/marks/bulk
// ================================================================
const bulkUpdateMarks = asyncHandler(async (req, res) => {
    const { subjectId, marks, semester, batch } = req.body;
    if (!marks || !Array.isArray(marks) || !subjectId) {
        res.status(400); throw new Error('Subject ID and marks array are required');
    }

    const settings = await getLogicSettings();
    const { weightage } = settings;

    // Validate weightage sums to 1.0
    const wSum = safe(weightage.test1) + safe(weightage.test2) + safe(weightage.assignment);
    if (Math.abs(wSum - 1.0) > 0.01) {
        res.status(400);
        throw new Error(`Weightage must sum to 100%. Current: ${(wSum * 100).toFixed(0)}%. Fix in Settings.`);
    }

    const updates = marks.map(async (m) => {
        const t1 = safe(m.test1);
        const t2 = safe(m.test2);
        const ass = safe(m.assignment);
        const total = t1 + t2 + ass;

        return Marks.findOneAndUpdate(
            { studentId: m.studentId, subjectId },
            { test1: t1, test2: t2, assignment: ass, total: parseFloat(total.toFixed(1)), semester, batch },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    });

    await Promise.all(updates);
    responseHandler(res, 200, null, 'Marks saved successfully');
});

// ================================================================
// @desc    Get Teacher's Subjects
// @route   GET /api/teacher/subjects
// ================================================================
const getTeacherSubjects = asyncHandler(async (req, res) => {
    const subjects = await Subject.find({ teacherId: req.user._id }).sort({ name: 1 });
    responseHandler(res, 200, subjects, 'Subjects retrieved');
});

module.exports = {
    getTeacherStats,
    getTeacherSubjects,
    getStudentsBySubject,
    getAttendanceByDate,
    markAttendance,
    bulkUpdateMarks
};
