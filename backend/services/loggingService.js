const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, action, details, status = 'SUCCESS', req = null) => {
    try {
        await ActivityLog.create({
            user: userId,
            action,
            details,
            status,
            ipAddress: req?.ip || null,
            userAgent: req?.headers['user-agent'] || null,
        });
    } catch (error) {
        console.error('Logging Error:', error.message);
    }
};

module.exports = { logActivity };
