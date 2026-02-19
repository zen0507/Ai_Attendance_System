const asyncHandler = require('express-async-handler');
const ActivityLog = require('../models/ActivityLog');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all activity logs
// @route   GET /api/activity
// @access  Private/Admin
const getLogs = asyncHandler(async (req, res) => {
    const logs = await ActivityLog.find({})
        .populate('user', 'name role email')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    responseHandler(res, 200, logs, 'Activity logs retrieved successfully');
});

module.exports = { getLogs };
