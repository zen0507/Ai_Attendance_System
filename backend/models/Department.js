const mongoose = require('mongoose');

const departmentSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;
