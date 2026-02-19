const mongoose = require('mongoose');

const attendanceSchema = mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['Present', 'Absent'],
        required: true,
    },
}, {
    timestamps: true,
});

// Indexes
attendanceSchema.index({ studentId: 1 });
attendanceSchema.index({ subjectId: 1 });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ studentId: 1, subjectId: 1 });
attendanceSchema.index({ studentId: 1, status: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
