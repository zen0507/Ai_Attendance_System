const asyncHandler = require('express-async-handler');

const checkAccountStatus = asyncHandler(async (req, res, next) => {
    if (req.user && req.user.status === 'pending') {
        res.status(403);
        throw new Error('Your account is pending approval. Please contact the administrator.');
    }
    if (req.user && req.user.status === 'rejected') {
        res.status(403);
        throw new Error('Your account has been rejected.');
    }
    if (req.user && req.user.status === 'inactive') {
        res.status(403);
        throw new Error('Your account is inactive.');
    }
    next();
});

module.exports = { checkAccountStatus };
