const asyncHandler = require('express-async-handler');
const Department = require('../models/Department');
const responseHandler = require('../utils/responseHandler');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Public
const getDepartments = asyncHandler(async (req, res) => {
    const departments = await Department.find({}).sort({ name: 1 });
    responseHandler(res, 200, departments, 'Departments retrieved successfully');
});

// @desc    Create a department
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const departmentExists = await Department.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

    if (departmentExists) {
        res.status(400);
        throw new Error('Department already exists');
    }

    const department = await Department.create({
        name,
        description
    });

    responseHandler(res, 201, department, 'Department created successfully');
});

// @desc    Delete a department
// @route   DELETE /api/departments/:id
// @access  Private/Admin
const deleteDepartment = asyncHandler(async (req, res) => {
    const department = await Department.findById(req.params.id);

    if (department) {
        await department.deleteOne();
        responseHandler(res, 200, { id: req.params.id }, 'Department deleted successfully');
    } else {
        res.status(404);
        throw new Error('Department not found');
    }
});

module.exports = {
    getDepartments,
    createDepartment,
    deleteDepartment
};
