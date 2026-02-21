const Marks = require('../models/Marks');
const Attendance = require('../models/Attendance');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSession = require('../models/AttendanceSession');
const calculateRisk = require('../utils/riskModel');
const { getLogicSettings } = require('../utils/settingsHelper');

/**
 * Add or update marks for a student in a subject.
 * Uses centralized weightage from settings — single calculation, no re-scaling.
 */
const addOrUpdateMarks = async (studentId, subjectId, test1, test2, assignment, semester, batch) => {
    const t1 = Math.min(30, Math.max(0, Number(test1) || 0));
    const t2 = Math.min(30, Math.max(0, Number(test2) || 0));
    const a = Math.min(40, Math.max(0, Number(assignment) || 0));

    let marks = await Marks.findOne({ studentId, subjectId });

    if (marks) {
        marks.test1 = t1;
        marks.test2 = t2;
        marks.assignment = a;
        marks.semester = semester || marks.semester;
        marks.batch = batch || marks.batch;
        // Total will be auto-calculated by pre-save hook
        await marks.save();
        return marks;
    } else {
        marks = await Marks.create({
            studentId,
            subjectId,
            test1: t1,
            test2: t2,
            assignment: a,
            semester,
            batch
        });
        return marks;
    }
};

/**
 * Get marks for a specific student.
 */
const getStudentMarks = async (studentId) => {
    const marks = await Marks.find({ studentId }).populate('subjectId').lean();
    if (!marks) {
        throw { status: 404, message: 'Marks not found' };
    }

    return marks.map(m => ({
        ...m,
        total: parseFloat(((m.test1 || 0) + (m.test2 || 0) + (m.assignment || 0)).toFixed(1))
    }));
};

/**
 * Calculate risk analysis for a student.
 * Uses centralized settings for passMarks and minAttendance.
 */
const calculateStudentRisk = async (studentId) => {
    const settings = await getLogicSettings();
    const { weightage, passMarks, minAttendance } = settings;

    // 1. Fetch Attendance Percentage (using session-based records)
    const records = await AttendanceRecord.find({ studentId }).populate('sessionId');
    let totalHours = 0;
    let presentHours = 0;

    records.forEach(r => {
        if (r.sessionId) {
            const hours = r.sessionId.hoursConducted || 1;
            totalHours += hours;
            if (r.status === 'Present') {
                presentHours += hours;
            }
        }
    });

    const attendancePercentage = totalHours > 0 ? (presentHours / totalHours) * 100 : null;

    // 2. Fetch Marks (sum of components)
    const allMarks = await Marks.find({ studentId }).lean();
    let avgMarks = 0;
    if (allMarks.length > 0) {
        const sumTotal = allMarks.reduce((acc, m) => {
            return acc + (Number(m.test1) || 0) + (Number(m.test2) || 0) + (Number(m.assignment) || 0);
        }, 0);
        avgMarks = sumTotal / allMarks.length;
    }

    // 3. Risk Logic using settings thresholds (Standardized)
    let riskLevel = 'Low';
    let riskReasons = [];

    if (attendancePercentage !== null && attendancePercentage < minAttendance) {
        riskReasons.push(`Low Attendance (${attendancePercentage.toFixed(1)}% < ${minAttendance}%)`);
    }
    if (avgMarks < passMarks && allMarks.length > 0) {
        riskReasons.push(`Failing Marks (Avg: ${avgMarks.toFixed(1)} < ${passMarks})`);
    }

    // Dynamic Risk Level Mapping: >= 80: Low, 60-79: Medium, < 60: High
    // Using a simple weighted formula for the student view (similar to analyticsService)
    const effectiveAtt = attendancePercentage !== null ? attendancePercentage : 50;
    const finalScore = (effectiveAtt * 0.5) + (avgMarks * 0.5);

    if (finalScore < 60) riskLevel = 'High';
    else if (finalScore < 80) riskLevel = 'Medium';
    else riskLevel = 'Low';

    // ML probability (legacy support)
    const riskData = calculateRisk(attendancePercentage, avgMarks);

    return {
        attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
        avgMarks: parseFloat(avgMarks.toFixed(2)),
        probability: riskData.probability,
        riskLevel,
        riskReasons,
        settings: { minAttendance, passMarks }
    };
};

/**
 * Get aggregate academic health data (Avg Marks & Pass Rate per subject).
 * Uses centralized settings for pass threshold.
 */
const getAcademicHealth = async () => {
    const settings = await getLogicSettings();

    const healthData = await Marks.aggregate([
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
                _id: '$subject.name',
                averageScore: { $avg: '$total' },
                totalStudents: { $sum: 1 },
                passedStudents: {
                    $sum: {
                        $cond: [{ $gte: ['$total', settings.passMarks] }, 1, 0]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                subject: '$_id',
                averageScore: { $round: ['$averageScore', 1] },
                passRate: {
                    $round: [
                        { $multiply: [{ $divide: ['$passedStudents', '$totalStudents'] }, 100] },
                        1
                    ]
                }
            }
        }
    ]);
    return healthData;
};

/**
 * Bulk update marks for multiple students.
 * Uses centralized settings for weightage — single calculation.
 */
const bulkUpdateMarks = async (subjectId, marksData, semester, batch) => {
    const operations = marksData.map(mark => {
        const t1 = Math.min(30, Math.max(0, Number(mark.test1) || 0));
        const t2 = Math.min(30, Math.max(0, Number(mark.test2) || 0));
        const a = Math.min(40, Math.max(0, Number(mark.assignment) || 0));
        const total = Math.min(100, t1 + t2 + a);

        return {
            updateOne: {
                filter: { studentId: mark.studentId, subjectId },
                update: {
                    $set: {
                        test1: t1,
                        test2: t2,
                        assignment: a,
                        total,
                        semester: semester || mark.semester,
                        batch: batch || mark.batch
                    }
                },
                upsert: true
            }
        };
    });

    if (operations.length > 0) {
        await Marks.bulkWrite(operations);
    }
};

/**
 * Get class average marks per subject for the subjects a student is enrolled in.
 * Returns per-subject: subjectName, studentTotal (raw), classAvgTotal (raw), rawTotals
 */
const getClassAverageForStudent = async (studentId) => {
    const settings = await getLogicSettings();
    const { passMarks } = settings;

    // Get all marks for this student
    const studentMarks = await Marks.find({ studentId }).populate('subjectId').lean();

    const result = [];
    for (const sm of studentMarks) {
        if (!sm.subjectId) continue;
        const subjectId = sm.subjectId._id;

        // All marks for this subject (class)
        const classMarks = await Marks.find({ subjectId }).lean();
        const classCount = classMarks.length;
        let classTotal = 0;
        classMarks.forEach(m => {
            classTotal += (Number(m.test1) || 0) + (Number(m.test2) || 0) + (Number(m.assignment) || 0);
        });
        const classAvg = classCount > 0 ? parseFloat((classTotal / classCount).toFixed(1)) : 0;

        // Student's raw total
        const t1 = Number(sm.test1) || 0;
        const t2 = Number(sm.test2) || 0;
        const a = Number(sm.assignment) || 0;
        const studentTotal = Math.min(100, t1 + t2 + a);

        // Raw percentage: (t1+t2+a) / 100 * 100
        const rawPct = studentTotal;

        result.push({
            subjectId: sm.subjectId, // Return the populated object
            subject: sm.subjectId.name || 'Unknown',
            test1: t1,
            test2: t2,
            assignment: a,
            total: studentTotal, // for ParentDashboard and new components
            studentTotal,        // for legacy components (StudentPerformance, ComparativeChart)
            classAvg,
            rawPct,
            passed: studentTotal >= passMarks
        });
    }
    return result;
};

module.exports = {
    addOrUpdateMarks,
    getStudentMarks,
    calculateStudentRisk,
    getAcademicHealth,
    bulkUpdateMarks,
    getClassAverageForStudent
};
