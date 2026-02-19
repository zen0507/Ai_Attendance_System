const express = require('express');
const router = express.Router();
const { getDepartments, createDepartment, deleteDepartment } = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(getDepartments)
    .post(protect, authorize('admin'), createDepartment);

router.route('/:id')
    .delete(protect, authorize('admin'), deleteDepartment);

module.exports = router;
