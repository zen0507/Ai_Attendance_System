const express = require('express');
const router = express.Router();
const { createSubject, getSubjects, updateSubject, deleteSubject } = require('../controllers/subjectController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, authorize('admin'), createSubject)
    .get(protect, getSubjects);

router.route('/:id')
    .put(protect, authorize('admin'), updateSubject)
    .delete(protect, authorize('admin'), deleteSubject);

module.exports = router;

