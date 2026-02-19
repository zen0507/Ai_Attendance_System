const mongoose = require('mongoose');

const studentSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
        required: true,
    },
    rollNumber: {
        type: Number,
        required: false,
    },
}, {
    timestamps: true,
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
