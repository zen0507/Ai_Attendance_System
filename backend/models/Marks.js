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
        min: 0,
        max: 30
    },
    test2: {
        type: Number,
        default: 0,
        min: 0,
        max: 30
    },
    assignment: {
        type: Number,
        default: 0,
        min: 0,
        max: 40
    },
    total: {
        type: Number,
        default: 0,
        max: 100
    },
}, {
    timestamps: true,
});

// Pre-save hook to ensure mathematical correctness
marksSchema.pre('save', function (next) {
    const rawSum = (this.test1 || 0) + (this.test2 || 0) + (this.assignment || 0);

    // Strict requirement: Reject if total > 100
    if (rawSum > 100) {
        return next(new Error('Total marks percentage cannot exceed 100% (Test1(30) + Test2(30) + Assignment(40) = 100)'));
    }

    // Formula: (T1+T2+A) / 100 * 100 = rawSum (since max is 100)
    this.total = parseFloat(rawSum.toFixed(1));
    next();
});

// Indexes
marksSchema.index({ studentId: 1 });
marksSchema.index({ subjectId: 1 });
// Strict prevention of duplicates (Student + Subject + Semester + Batch)
marksSchema.index({ studentId: 1, subjectId: 1, semester: 1, batch: 1 }, { unique: true });

const Marks = mongoose.model('Marks', marksSchema);

module.exports = Marks;
