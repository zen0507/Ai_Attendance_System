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
const addOrUpdateMarks = async (studentId, subjectId, test1, test2, assignment) => {
    const settings = await getLogicSettings();
    const { weightage } = settings;

    // Single calculation: Total = (T1 * W1) + (T2 * W2) + (A * W3)
    const t1 = Number(test1) || 0;
    const t2 = Number(test2) || 0;
    const a = Number(assignment) || 0;
    const total = (t1 * weightage.test1) + (t2 * weightage.test2) + (a * weightage.assignment);

    let marks = await Marks.findOne({ studentId, subjectId });

    if (marks) {
        marks.test1 = t1;
        marks.test2 = t2;
        marks.assignment = a;
        marks.total = parseFloat(total.toFixed(1));
        await marks.save();
        return marks;
    } else {
        marks = await Marks.create({
            studentId,
            subjectId,
            test1: t1,
            test2: t2,
            assignment: a,
            total: parseFloat(total.toFixed(1))
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

    // Recalculate totals using live settings to ensure consistency
    const settings = await getLogicSettings();
    const { weightage } = settings;

    return marks.map(m => ({
        ...m,
        total: parseFloat(
            ((Number(m.test1) || 0) * weightage.test1 +
                (Number(m.test2) || 0) * weightage.test2 +
                (Number(m.assignment) || 0) * weightage.assignment).toFixed(1)
        )
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

    const attendancePercentage = totalHours > 0 ? (presentHours / totalHours) * 100 : 0;

    // 2. Fetch Marks (recalculate using live weightage)
    const allMarks = await Marks.find({ studentId }).lean();
    let avgMarks = 0;
    if (allMarks.length > 0) {
        const sumTotal = allMarks.reduce((acc, m) => {
            const t1 = Number(m.test1) || 0;
            const t2 = Number(m.test2) || 0;
            const a = Number(m.assignment) || 0;
            return acc + (t1 * weightage.test1) + (t2 * weightage.test2) + (a * weightage.assignment);
        }, 0);
        avgMarks = sumTotal / allMarks.length;
    }

    // 3. Risk Logic using settings thresholds
    let riskLevel = 'Low';
    let riskReasons = [];

    if (attendancePercentage < minAttendance) {
        riskReasons.push(`Low Attendance (${attendancePercentage.toFixed(1)}% < ${minAttendance}%)`);
    }
    if (avgMarks < passMarks && allMarks.length > 0) {
        riskReasons.push(`Failing Marks (Avg: ${avgMarks.toFixed(1)} < ${passMarks})`);
    }

    if (riskReasons.length >= 2) riskLevel = 'Critical';
    else if (riskReasons.length === 1) riskLevel = 'High';

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
const bulkUpdateMarks = async (subjectId, marksData) => {
    const settings = await getLogicSettings();
    const { weightage } = settings;

    const operations = marksData.map(mark => {
        const t1 = Number(mark.test1 || 0);
        const t2 = Number(mark.test2 || 0);
        const a = Number(mark.assignment || 0);
        const total = (t1 * weightage.test1) + (t2 * weightage.test2) + (a * weightage.assignment);

        return {
            updateOne: {
                filter: { studentId: mark.studentId, subjectId },
                update: {
                    $set: {
                        test1: t1,
                        test2: t2,
                        assignment: a,
                        total: parseFloat(total.toFixed(1))
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
 * Returns per-subject: subjectName, studentTotal (weighted), classAvgTotal (weighted), rawTotals
 */
const getClassAverageForStudent = async (studentId) => {
    const settings = await getLogicSettings();
    const { weightage, passMarks } = settings;

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
            classTotal += (Number(m.test1) || 0) * weightage.test1
                + (Number(m.test2) || 0) * weightage.test2
                + (Number(m.assignment) || 0) * weightage.assignment;
        });
        const classAvg = classCount > 0 ? parseFloat((classTotal / classCount).toFixed(1)) : 0;

        // Student's weighted total
        const t1 = Number(sm.test1) || 0;
        const t2 = Number(sm.test2) || 0;
        const a = Number(sm.assignment) || 0;
        const studentTotal = parseFloat(((t1 * weightage.test1) + (t2 * weightage.test2) + (a * weightage.assignment)).toFixed(1));

        // Raw percentage: (t1+t2+a) / (50+50+20) * 100
        const MAX_RAW = 120;
        const rawPct = parseFloat(((t1 + t2 + a) / MAX_RAW * 100).toFixed(1));

        result.push({
            subjectId: subjectId.toString(),
            subject: sm.subjectId.name || 'Unknown',
            test1: t1,
            test2: t2,
            assignment: a,
            studentTotal,
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
