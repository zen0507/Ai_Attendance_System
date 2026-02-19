const mongoose = require('mongoose');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');

/**
 * Mark attendance for multiple students (Session Based).
 * @param {string} subjectId
 * @param {string} date
 * @param {Array} students - Array of { studentId, status }
 * @param {string} teacherId - Optional, if available
 * @param {number} hours - Optional, default 1
 * @returns {Promise<void>}
 */
const markStudentAttendance = async (subjectId, date, students, teacherId = null, hours = 1) => {
    // 1. Fetch Subject to get metadata
    const Subject = require('../models/Subject'); // Lazy load or move to top
    const subject = await Subject.findById(subjectId);

    if (!subject) throw new Error('Subject not found');

    const targetDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (targetDate > today) {
        throw new Error("Cannot mark attendance for future dates.");
    }

    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // 2. Find or Create Session
    let session = await AttendanceSession.findOne({
        subjectId,
        date: { $gte: startOfDay, $lte: endOfDay },
        batch: subject.batch // Assuming class is for the batch
    });

    if (!session) {
        if (!teacherId) {
            // Try to find teacher from subject
            teacherId = subject.teacherId;
        }

        session = await AttendanceSession.create({
            subjectId,
            teacherId,
            department: subject.department || 'Unknown',
            batch: subject.batch,
            semester: subject.semester,
            date: targetDate,
            hoursConducted: hours
        });
    } else {
        // Update hours if provided and different? 
        // For now, keep existing unless explicitly trying to update session details.
    }

    // 3. Create Records
    // Remove existing records for this session/students to avoid duplicates if re-submitting
    const studentIds = students.map(s => s.studentId);
    await AttendanceRecord.deleteMany({ sessionId: session._id, studentId: { $in: studentIds } });

    const records = students.map(s => ({
        sessionId: session._id,
        studentId: s.studentId,
        status: s.status
    }));

    await AttendanceRecord.insertMany(records);
};

/**
 * Get attendance records for a specific student.
 * @param {string} studentId
 * @returns {Promise<Array>}
 */
const getStudentAttendance = async (studentId) => {
    // Find records and populate session info
    const records = await AttendanceRecord.find({ studentId })
        .populate({
            path: 'sessionId',
            populate: { path: 'subjectId', select: 'name code' }
        })
        .sort({ createdAt: -1 })
        .lean();

    // Flatten structure for frontend compatibility: { date, status, subjectName, ... }
    return records.map(r => {
        if (!r.sessionId) return null; // Orphaned record
        return {
            _id: r._id,
            date: r.sessionId.date,
            status: r.status,
            subjectId: r.sessionId.subjectId?._id,
            subjectName: r.sessionId.subjectId?.name || 'Unknown',
            hours: r.sessionId.hoursConducted,
            type: r.sessionId.sessionType
        };
    }).filter(r => r !== null);
};

/**
 * Calculate attendance statistics for a student.
 * @param {string} studentId
 * @returns {Promise<Object>} - { percentage, totalClasses, presentClasses }
 */
const calculateAttendancePercentage = async (studentId) => {
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

    const percentage = totalHours > 0 ? (presentHours / totalHours) * 100 : 0;

    return {
        percentage: parseFloat(percentage.toFixed(2)),
        totalClasses: totalHours, // Using hours as "classes" count for stats
        presentClasses: presentHours
    };
};

module.exports = {
    markStudentAttendance,
    getStudentAttendance,
    calculateAttendancePercentage
};
