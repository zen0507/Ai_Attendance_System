const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const userService = require('../services/userService');
const responseHandler = require('../utils/responseHandler');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    try {
        const userData = await userService.authenticateUser(req.body.email, req.body.password, req);
        responseHandler(res, 200, userData, 'Login successful');
    } catch (error) {
        res.status(error.status || 500);
        throw new Error(error.message || 'Internal Server Error');
    }
});

// @desc    Register a new user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
const registerUser = asyncHandler(async (req, res) => {
    try {
        const newUser = await userService.createUser(req.body, req);
        responseHandler(res, 201, newUser, 'User registered successfully');
    } catch (error) {
        res.status(error.status || 500);
        throw new Error(error.message || 'Internal Server Error');
    }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const { role, department, search, page, limit, batch, semester } = req.query;

    // If pagination params provided, use paginated query
    if (page || search || batch || semester || (role && department)) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        // Build match stage
        const matchStage = {};
        if (role) {
            // Support comma-separated roles e.g. "teacher,hod"
            const roles = role.split(',');
            if (roles.length > 1) {
                matchStage.role = { $in: roles };
            } else {
                matchStage.role = role;
            }
        }
        if (search) {
            matchStage.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const pipeline = [
            { $match: matchStage },
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
            {
                $lookup: {
                    from: 'users',
                    let: { childIds: '$children' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: [
                                        { $toString: '$_id' },
                                        { $map: { input: { $ifNull: ['$$childIds', []] }, as: 'id', in: { $toString: '$$id' } } }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'childrenProfiles'
                }
            },
            {
                $addFields: {
                    department: {
                        $ifNull: [
                            '$department',
                            { $arrayElemAt: ['$studentProfile.department', 0] },
                            { $arrayElemAt: ['$teacherProfile.department', 0] }
                        ]
                    },
                    batch: { $arrayElemAt: ['$studentProfile.batch', 0] },
                    semester: { $arrayElemAt: ['$studentProfile.semester', 0] },
                    startDate: { $arrayElemAt: ['$studentProfile.startDate', 0] },
                    endDate: { $arrayElemAt: ['$studentProfile.endDate', 0] },
                    childNames: {
                        $map: {
                            input: '$childrenProfiles',
                            as: 'child',
                            in: '$$child.name'
                        }
                    }
                }
            },
        ];

        // Post-join filters
        const postMatch = {};
        if (department && department !== 'All') postMatch.department = department;
        if (batch) postMatch.batch = batch;
        if (semester) postMatch.semester = semester;
        if (Object.keys(postMatch).length > 0) {
            pipeline.push({ $match: postMatch });
        }

        // Count total before pagination
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await User.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        // Add sort, skip, limit, project
        pipeline.push(
            { $sort: { name: 1 } },
            { $skip: skip },
            { $limit: limitNum },
            { $project: { password: 0, __v: 0, studentProfile: 0, teacherProfile: 0 } }
        );

        const users = await User.aggregate(pipeline);

        responseHandler(res, 200, {
            users,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
        }, 'Users retrieved successfully');
    } else {
        // Backward-compatible: return full list (used by teacher dashboard etc.)
        const users = await userService.getAllUsers();
        responseHandler(res, 200, users, 'Users retrieved successfully');
    }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.user._id);
    if (user) {
        responseHandler(res, 200, user, 'Profile retrieved');
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        if (req.body.password) {
            user.password = req.body.password;
        }

        // Update Settings
        if (req.body.settings) {
            user.settings = { ...user.settings, ...req.body.settings };
        }

        const updatedUser = await user.save();

        // Return token/auth data structure
        responseHandler(res, 200, {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            settings: updatedUser.settings,
            token: req.headers.authorization.split(' ')[1] // Keep existing token
        }, 'Profile updated successfully');
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
    try {
        // Main Admin Logic: Allow updating isMainAdmin only if req.user is Main Admin
        if (req.body.isMainAdmin === true) {
            if (!req.user.isMainAdmin) {
                res.status(403);
                throw new Error('Not authorized to assign Main Admin privilege');
            }
            // If check passes, isMainAdmin will be updated by regular update logic below 
            // OR we specifically handle it if we want to be explicit.
            // Since req.body contains it, we just need to ensure we don't block it 
            // but we MUST ensure it's not set by non-main admins.
        } else if (req.body.isMainAdmin === false) {
            // Optional: allow demotion? For now let's focus on promotion.
        }

        // Prevent non-main admins from touching isMainAdmin at all
        if (req.body.isMainAdmin !== undefined && !req.user.isMainAdmin) {
            delete req.body.isMainAdmin;
        }

        const updatedUser = await userService.updateUser(req.params.id, req.body, req);
        responseHandler(res, 200, updatedUser, 'User updated successfully');
    } catch (error) {
        res.status(error.status || 500);
        throw new Error(error.message || 'Internal Server Error');
    }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);

    if (user) {
        if (user.isMainAdmin) {
            res.status(403);
            throw new Error('Cannot delete Main Admin account');
        }
        await user.deleteOne();
        responseHandler(res, 200, { id: req.params.id }, 'User deleted successfully');
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // 1. Complexity Validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        res.status(400);
        throw new Error('Password must be at least 8 characters long and contain at least one letter and one number.');
    }

    const user = await User.findById(req.user._id);

    if (user) {
        // 2. Verify current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            res.status(401);
            throw new Error('Current password is incorrect.');
        }

        // 3. Update and hash is handled by model middleware
        user.password = newPassword;
        await user.save();

        responseHandler(res, 200, null, 'Password changed successfully. Please log in again.');
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = { authUser, registerUser, getUsers, updateUser, deleteUser, getUserProfile, updateUserProfile, changePassword };
