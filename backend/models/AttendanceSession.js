const mongoose = require('mongoose');

const attendanceSessionSchema = mongoose.Schema({
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true,
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    batch: {
        type: String,
        required: true,
    },
    semester: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    hoursConducted: {
        type: Number,
        required: true,
        default: 1,
    },
    sessionType: {
        type: String,
        enum: ['Lecture', 'Lab', 'Other'],
        default: 'Lecture',
    }
}, {
    timestamps: true,
});

const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);

module.exports = AttendanceSession;
