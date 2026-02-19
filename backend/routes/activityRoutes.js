const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin'), getLogs);

module.exports = router;
