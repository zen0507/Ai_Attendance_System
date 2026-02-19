const express = require('express');
const router = express.Router();
const { addMarks, getMarks, getRiskAnalysis, getAcademicHealth, getClassAverage } = require('../controllers/marksController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const { marksSchema } = require('../utils/validationSchemas');

router.route('/')
    .post(protect, authorize('teacher', 'admin'), validate(marksSchema), addMarks);

router.route('/health/academic')
    .get(protect, authorize('admin', 'teacher'), getAcademicHealth);

router.route('/analysis/:studentId')
    .get(protect, authorize('student', 'teacher', 'admin'), getRiskAnalysis);

router.route('/class-average/:studentId')
    .get(protect, authorize('student', 'teacher', 'admin'), getClassAverage);

router.route('/:studentId')
    .get(protect, authorize('student', 'teacher', 'admin'), getMarks);

module.exports = router;

