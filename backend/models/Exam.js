const mongoose = require('mongoose');

const examSchema = mongoose.Schema({
    subject: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    type: {
        type: String,
        enum: ['Internal', 'Semester', 'Quiz', 'Assignment'],
        default: 'Internal',
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
}, {
    timestamps: true,
});

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
