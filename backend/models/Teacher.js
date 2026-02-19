const mongoose = require('mongoose');

const teacherSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    subjectsAssigned: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
    }],
    department: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;
