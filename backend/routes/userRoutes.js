const express = require('express');
const router = express.Router();
const { authUser, registerUser, getUsers, updateUser, deleteUser, getUserProfile, updateUserProfile, changePassword } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const { loginSchema, registerSchema } = require('../utils/validationSchemas');

router.post('/login', validate(loginSchema), authUser);
router.route('/')
    .post(protect, authorize('admin'), validate(registerSchema), registerUser)
    .get(protect, authorize('admin', 'teacher'), getUsers);

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.put('/change-password', protect, changePassword);

router.route('/:id')
    .put(protect, authorize('admin'), updateUser)
    .delete(protect, authorize('admin'), deleteUser);

module.exports = router;

