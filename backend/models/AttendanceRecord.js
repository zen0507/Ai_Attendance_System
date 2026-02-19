const mongoose = require('mongoose');

const attendanceRecordSchema = mongoose.Schema({
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AttendanceSession',
        required: true,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student', // Or 'User' if linking directly to user ID, but Student profile is cleaner
        required: true,
    },
    status: {
        type: String,
        enum: ['Present', 'Absent'],
        required: true,
    }
}, {
    timestamps: true,
});

// Indexes for faster lookup
attendanceRecordSchema.index({ sessionId: 1 });
attendanceRecordSchema.index({ studentId: 1 });
attendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true }); // Prevent duplicate marks for same session

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

module.exports = AttendanceRecord;
