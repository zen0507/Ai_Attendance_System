const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'teacher', 'student'],
        default: 'student',
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'rejected', 'inactive'],
        default: 'active',
    },
    department: {
        type: String,
        required: false, // Optional for admin/others
    },
    batch: {
        type: String,
        required: false,
    },
    semester: {
        type: String,
        required: false,
    },
    isMainAdmin: {
        type: Boolean,
        default: false,
    },
    settings: {
        minAttendance: { type: Number, default: 75 },
        passMarks: { type: Number, default: 20 },
        weightage: {
            test1: { type: Number, default: 0.3 },
            test2: { type: Number, default: 0.3 },
            assignment: { type: Number, default: 0.4 }
        },
        emailAlerts: { type: Boolean, default: true },
        smsAlerts: { type: Boolean, default: false }
    },
}, {
    timestamps: true,
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
