const asyncHandler = require('express-async-handler');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const User = require('../models/User');

const responseHandler = require('../utils/responseHandler');

// @desc    Create a subject
// @route   POST /api/subjects
// @access  Private/Admin
const createSubject = asyncHandler(async (req, res) => {
    let { name, teacherId, department, batch, semester, startDate, endDate } = req.body;

    // Sanitize teacherId: empty string is not a valid ObjectId
    const sanitizedTeacherId = (!teacherId || teacherId === '') ? null : teacherId;

    const subject = new Subject({
        name,
        teacherId: sanitizedTeacherId,
        department,
        batch,
        semester: semester || 'S1', // Default if not provided
        startDate,
        endDate
    });

    try {
        const createdSubject = await subject.save();

        if (sanitizedTeacherId) {
            const teacherProfile = await Teacher.findOne({ userId: sanitizedTeacherId });
            if (teacherProfile) {
                if (!teacherProfile.subjectsAssigned) teacherProfile.subjectsAssigned = [];
                teacherProfile.subjectsAssigned.push(createdSubject._id);
                await teacherProfile.save();
            }
        }

        // Return populated subject so frontend sees the teacher name immediately
        const populatedSubject = await Subject.findById(createdSubject._id).populate('teacherId');
        responseHandler(res, 201, populatedSubject, 'Course created successfully');
    } catch (error) {
        console.error('Core Error in createSubject:', error);
        res.status(400); // Validation errors are usually 400
        throw error;
    }
});

// @desc    Get all subjects (supports pagination + filtering)
// @route   GET /api/subjects
// @access  Private
const getSubjects = asyncHandler(async (req, res) => {
    const { department, search, page, limit, semester, batch } = req.query;

    if (page || search) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        const filter = {};
        if (department && department !== 'All') filter.department = department;
        if (semester && semester !== 'All') filter.semester = semester;
        if (batch) filter.batch = batch;
        if (search) filter.name = { $regex: search, $options: 'i' };

        const total = await Subject.countDocuments(filter);
        const subjects = await Subject.find(filter)
            .populate('teacherId', 'name email')
            .sort({ name: 1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Add teacher workload count
        const teacherIds = subjects.filter(s => s.teacherId).map(s => s.teacherId._id);
        const workloadAgg = await Subject.aggregate([
            { $match: { teacherId: { $in: teacherIds } } },
            { $group: { _id: '$teacherId', count: { $sum: 1 } } }
        ]);
        const workloadMap = {};
        workloadAgg.forEach(w => { workloadMap[w._id.toString()] = w.count; });

        const enriched = subjects.map(s => ({
            ...s,
            teacherWorkload: s.teacherId ? (workloadMap[s.teacherId._id.toString()] || 0) : 0,
        }));

        responseHandler(res, 200, {
            subjects: enriched,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
        }, 'Subjects retrieved successfully');
    } else {
        // Backward-compatible: full list
        const subjects = await Subject.find({}).populate('teacherId').sort({ name: 1 });
        responseHandler(res, 200, subjects, 'Subjects retrieved successfully');
    }
});

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
const updateSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id);

    if (subject) {
        if (req.body.name) subject.name = req.body.name;
        if (req.body.department !== undefined) subject.department = req.body.department;
        if (req.body.batch !== undefined) subject.batch = req.body.batch;
        if (req.body.semester !== undefined) subject.semester = req.body.semester;
        if (req.body.startDate !== undefined) subject.startDate = req.body.startDate;
        if (req.body.endDate !== undefined) subject.endDate = req.body.endDate;

        // If teacher is changed
        const newTeacherId = req.body.teacherId === '' ? null : req.body.teacherId;

        if (newTeacherId !== undefined && newTeacherId !== (subject.teacherId ? subject.teacherId.toString() : null)) {
            // Remove from old teacher if exists
            if (subject.teacherId) {
                const oldTeacherProfile = await Teacher.findOne({ userId: subject.teacherId });
                if (oldTeacherProfile) {
                    oldTeacherProfile.subjectsAssigned = oldTeacherProfile.subjectsAssigned.filter(id => id.toString() !== subject._id.toString());
                    await oldTeacherProfile.save();
                }
            }

            // Add to new teacher
            if (newTeacherId) {
                const newTeacherProfile = await Teacher.findOne({ userId: newTeacherId });
                if (newTeacherProfile) {
                    subject.teacherId = newTeacherId;
                    newTeacherProfile.subjectsAssigned.push(subject._id);
                    await newTeacherProfile.save();
                }
            } else {
                subject.teacherId = null;
            }
        }

        const updatedSubject = await subject.save();
        responseHandler(res, 200, updatedSubject, 'Subject updated successfully');
    } else {
        res.status(404);
        throw new Error('Subject not found');
    }
});

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
const deleteSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id);

    if (subject) {
        // Remove from teacher profile if assigned
        if (subject.teacherId) {
            const teacherProfile = await Teacher.findOne({ userId: subject.teacherId });
            if (teacherProfile) {
                teacherProfile.subjectsAssigned = teacherProfile.subjectsAssigned.filter(id => id.toString() !== subject._id.toString());
                await teacherProfile.save();
            }
        }

        await subject.deleteOne();
        responseHandler(res, 200, { id: req.params.id }, 'Subject deleted successfully');
    } else {
        res.status(404);
        throw new Error('Subject not found');
    }
});

module.exports = { createSubject, getSubjects, updateSubject, deleteSubject };

