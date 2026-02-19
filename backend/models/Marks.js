const mongoose = require('mongoose');

const marksSchema = mongoose.Schema({
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
    semester: {
        type: String,
        required: true,
    },
    batch: {
        type: String,
        required: true,
    },
    test1: {
        type: Number,
        default: 0,
    },
    test2: {
        type: Number,
        default: 0,
    },
    assignment: {
        type: Number,
        default: 0,
    },
    total: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Indexes
marksSchema.index({ studentId: 1 });
marksSchema.index({ subjectId: 1 });
marksSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });

const Marks = mongoose.model('Marks', marksSchema);

module.exports = Marks;
