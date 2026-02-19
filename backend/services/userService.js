const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const generateToken = require('../utils/generateToken');
const { logActivity } = require('./loggingService');

/**
 * Authenticate a user by email and password.
 * @param {string} email
 * @param {string} password
 * @param {object} req - Express request object for logging
 * @returns {object} - User data with token or throws error
 */
const authenticateUser = async (email, password, req) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw { status: 401, message: 'No account found with that email.' };
    }

    const passwordMatch = await user.matchPassword(password);

    if (!passwordMatch) {
        await logActivity(user._id, 'LOGIN_FAILED', `User ${user.email} entered wrong password`, 'FAILURE', req);
        throw { status: 401, message: 'Incorrect password.' };
    }

    // Account Status Check
    if (user.status !== 'active') {
        await logActivity(user._id, 'LOGIN_FAILED', `User ${user.email} tried to login with status ${user.status}`, 'FAILURE', req);
        throw { status: 403, message: `Your account has been ${user.status}. Please contact the administrator.` };
    }

    let profileId = null;
    if (user.role === 'student') {
        const student = await Student.findOne({ userId: user._id });
        if (student) profileId = student._id;
    } else if (user.role === 'teacher') {
        const teacher = await Teacher.findOne({ userId: user._id });
        if (teacher) profileId = teacher._id;
    }

    await logActivity(user._id, 'LOGIN', `User ${user.email} logged in successfully`, 'SUCCESS', req);

    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profileId: profileId,
        token: generateToken(user._id, user.role),
    };
};

/**
 * Register a new user and their associated profile.
 * @param {object} userData
 * @param {object} req - Express request object for logging
 * @returns {object} - Created user data
 */
const createUser = async (userData, req) => {
    const { name, email, password, role, batch, semester, subjectsAssigned, department, startDate, endDate } = userData;

    const userExists = await User.findOne({ email });

    if (userExists) {
        throw { status: 400, message: 'User already exists' };
    }

    // Create user with all common fields
    const user = await User.create({
        name,
        email,
        password,
        role,
        status: 'active',
        // Save these to User model as well for easier filtering/reporting
        department,
        batch,
        semester
    });

    try {
        if (role === 'student') {
            await Student.create({
                userId: user._id,
                batch: batch || 'TBD', // Ensure required fields have values
                semester: semester || 'TBD',
                department: department || 'General',
                startDate: startDate || new Date(),
                endDate: endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 4)),
                rollNumber: 0
            });
        }

        if (role === 'teacher') {
            await Teacher.create({
                userId: user._id,
                subjectsAssigned: subjectsAssigned || [],
                department: department || 'General'
            });
        }

        await logActivity(req.user._id, 'CREATE_USER', `Created new ${role}: ${email}`, 'SUCCESS', req);

        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            department: user.department,
            batch: user.batch,
            semester: user.semester
        };
    } catch (error) {
        // Rollback: delete the user if profile creation fails
        if (user && user._id) {
            await User.findByIdAndDelete(user._id);
        }
        throw { status: 400, message: 'Failed to create user profile: ' + error.message };
    }
};

/**
 * Get all users.
 * @returns {Array} - List of users
 */
const getAllUsers = async () => {
    return await User.aggregate([
        {
            $lookup: {
                from: 'students',
                localField: '_id',
                foreignField: 'userId',
                as: 'studentProfile'
            }
        },
        {
            $lookup: {
                from: 'teachers',
                localField: '_id',
                foreignField: 'userId',
                as: 'teacherProfile'
            }
        },
        // Fallback lookup using pipeline for string-to-objectId if needed
        {
            $addFields: {
                studentProfile: {
                    $cond: [
                        { $gt: [{ $size: '$studentProfile' }, 0] },
                        '$studentProfile',
                        // Optional: you could add a pipeline lookup here if we still thought it was a string issue
                        '$studentProfile'
                    ]
                }
            }
        },
        {
            $addFields: {
                department: {
                    $cond: {
                        if: { $eq: ['$role', 'student'] },
                        then: { $ifNull: [{ $arrayElemAt: ['$studentProfile.department', 0] }, null] },
                        else: {
                            $cond: {
                                if: { $eq: ['$role', 'teacher'] },
                                then: { $ifNull: [{ $arrayElemAt: ['$teacherProfile.department', 0] }, null] },
                                else: null
                            }
                        }
                    }
                },
                batch: { $arrayElemAt: ['$studentProfile.batch', 0] },
                semester: { $arrayElemAt: ['$studentProfile.semester', 0] },
                startDate: { $arrayElemAt: ['$studentProfile.startDate', 0] },
                endDate: { $arrayElemAt: ['$studentProfile.endDate', 0] }
            }
        },
        {
            $project: {
                password: 0,
                __v: 0,
            }
        },
        {
            $sort: { name: 1 }
        }
    ]);
};

/**
 * Update user and their associated profile.
 * @param {string} id
 * @param {object} updateData
 * @param {object} req - Express request object for logging
 * @returns {object} - Updated user data
 */
const updateUser = async (id, updateData, req) => {
    const { name, email, password, department, batch, semester, startDate, endDate } = updateData;
    const user = await User.findById(id);

    if (!user) {
        throw { status: 404, message: 'User not found' };
    }

    user.name = name || user.name;
    user.email = email || user.email;
    if (password) {
        user.password = password;
    }

    const updatedUser = await user.save();

    if (user.role === 'student') {
        const studentData = {};
        if (department !== undefined) studentData.department = department;
        if (batch !== undefined) studentData.batch = batch;
        if (semester !== undefined) studentData.semester = semester;
        if (startDate !== undefined) studentData.startDate = startDate;
        if (endDate !== undefined) studentData.endDate = endDate;

        await Student.findOneAndUpdate(
            { userId: user._id },
            { $set: studentData },
            { new: true, upsert: true }
        );
    } else if (user.role === 'teacher') {
        const teacherData = {};
        if (department !== undefined) teacherData.department = department;

        await Teacher.findOneAndUpdate(
            { userId: user._id },
            { $set: teacherData },
            { new: true, upsert: true }
        );
    }

    await logActivity(req.user._id, 'UPDATE_USER', `Updated user: ${user.email}`, 'SUCCESS', req);

    return updatedUser;
};

/**
 * Get user by ID.
 * @param {string} id
 * @returns {object} - User document
 */
const getUserById = async (id) => {
    return await User.findById(id);
};

module.exports = {
    authenticateUser,
    createUser,
    getAllUsers,
    updateUser,
    getUserById,
};
