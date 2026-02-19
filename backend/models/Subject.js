const mongoose = require('mongoose');

const subjectSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
        default: 'S1' // Temporary default for migration
    },
    department: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
    },
}, {
    timestamps: true,
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
