const express = require('express');
const router = express.Router();
const {
    getAllUsers, getUserById, createOfficer, blockUser, unblockUser, deleteUser, updateProfile,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { validateCreateOfficer } = require('../middleware/validate');

router.use(protect);

// ⚠️ Specific named routes MUST come before parameterised /:id routes
router.put('/profile', updateProfile);

// Create officer: admin can create any role; police can create police; municipal can create municipal
router.post('/create-officer', authorize('admin', 'police', 'municipal'), validateCreateOfficer, createOfficer);

// List users: admin sees all; police sees only police; municipal sees only municipal
router.get('/', authorize('admin', 'police', 'municipal'), getAllUsers);

// Admin-only routes for individual user management
router.get('/:id', authorize('admin'), getUserById);
router.put('/:id/block', authorize('admin'), blockUser);
router.put('/:id/unblock', authorize('admin'), unblockUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
