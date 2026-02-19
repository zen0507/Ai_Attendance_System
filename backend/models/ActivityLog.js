const mongoose = require('mongoose');

const activityLogSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    action: {
        type: String, // e.g., 'LOGIN', 'CREATE_USER', 'SUBMIT_ATTENDANCE'
        required: true,
    },
    details: {
        type: String, // Human-readable description
        required: true,
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILURE'],
        default: 'SUCCESS',
    },
    ipAddress: {
        type: String,
    },
    userAgent: {
        type: String,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
