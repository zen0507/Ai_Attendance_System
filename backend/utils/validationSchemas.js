const Joi = require('joi');

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

const registerSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('student', 'teacher', 'admin').required(),
    batch: Joi.string().allow('', null),
    semester: Joi.string().allow('', null),
    department: Joi.string().allow('', null),
    subjectsAssigned: Joi.array().items(Joi.string()).allow(null),
});

const marksSchema = Joi.object({
    studentId: Joi.string().required(),
    subjectId: Joi.string().required(),
    test1: Joi.number().min(0).max(100).required(),
    test2: Joi.number().min(0).max(100).required(),
    assignment: Joi.number().min(0).max(100).required(),
});

// Attendance validation can be added here
const attendanceSchema = Joi.object({
    date: Joi.date().required(),
    subjectId: Joi.string().required(),
    students: Joi.array().items(
        Joi.object({
            studentId: Joi.string().required(),
            status: Joi.string().valid('Present', 'Absent').required()
        })
    ).required()
});

module.exports = { loginSchema, registerSchema, marksSchema, attendanceSchema };
