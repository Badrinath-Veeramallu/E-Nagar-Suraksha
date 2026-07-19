const User = require('../models/User');
const Department = require('../models/Department');
const { createAuditLog, getRequestContext } = require('../utils/auditLog');

// @desc   Get all users (admin sees all; police/municipal see only their role)
// @route  GET /api/users
// @access Admin, Police, Municipal
const getAllUsers = async (req, res, next) => {
    try {
        const { role, isBlocked, page = 1, limit = 20, search } = req.query;
        const query = {};

        // Non-admin users are scoped to their own role only
        if (req.user.role !== 'admin') {
            query.role = req.user.role;
        } else if (role) {
            query.role = role;
        }

        if (isBlocked !== undefined) query.isBlocked = isBlocked === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const users = await User.find(query)
            .populate('department', 'name type')
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);
        res.json({ success: true, count: users.length, total, page: parseInt(page), data: users });
    } catch (err) {
        next(err);
    }
};

// @desc   Get single user
// @route  GET /api/users/:id
// @access Admin
const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).populate('department', 'name type').select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

// @desc   Create officer/municipal/admin account
// @route  POST /api/users/create-officer
// @access Admin (any role), Police (police role only), Municipal (municipal role only)
const createOfficer = async (req, res, next) => {
    try {
        const { name, email, password, role, department, phone, station, designation } = req.body;

        if (!['police', 'municipal', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Only police, municipal, or admin roles can be created here' });
        }

        // Non-admin users can only create accounts for their own role
        if (req.user.role !== 'admin' && role !== req.user.role) {
            return res.status(403).json({ success: false, message: `You can only create accounts with role: ${req.user.role}` });
        }

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

        let deptId = null;
        if (department) {
            const dept = await Department.findById(department);
            if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
            deptId = dept._id;
        }

        const user = await User.create({
            name, email, password, phone, role,
            department: deptId,
            station: station || undefined,
            designation: designation || undefined,
            isVerified: true,
            createdBy: req.user._id,
        });

        // Add officer to department's officers list
        if (deptId && (role === 'police' || role === 'municipal')) {
            await Department.findByIdAndUpdate(deptId, { $addToSet: { officers: user._id } });
        }

        await createAuditLog({
            ...getRequestContext(req),
            action: 'officer_account_created',
            targetType: 'User',
            targetId: user._id,
            targetIdentifier: user.email,
            metadata: { role, department },
        });

        const userData = {
            _id: user._id, name: user.name, email: user.email,
            role: user.role, department: user.department, phone: user.phone,
            station: user.station, designation: user.designation,
        };
        res.status(201).json({ success: true, message: 'Officer account created', data: userData });
    } catch (err) {
        next(err);
    }
};

// @desc   Block a user
// @route  PUT /api/users/:id/block
// @access Admin
const blockUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot block an admin' });

        user.isBlocked = true;
        await user.save({ validateBeforeSave: false });

        await createAuditLog({
            ...getRequestContext(req),
            action: 'user_blocked',
            targetType: 'User',
            targetId: user._id,
            targetIdentifier: user.email,
            metadata: { blockedBy: req.user.name },
        });

        res.json({ success: true, message: `User ${user.name} has been blocked` });
    } catch (err) {
        next(err);
    }
};

// @desc   Unblock a user
// @route  PUT /api/users/:id/unblock
// @access Admin
const unblockUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.isBlocked = false;
        await user.save({ validateBeforeSave: false });

        await createAuditLog({
            ...getRequestContext(req),
            action: 'user_unblocked',
            targetType: 'User',
            targetId: user._id,
            targetIdentifier: user.email,
        });

        res.json({ success: true, message: `User ${user.name} has been unblocked` });
    } catch (err) {
        next(err);
    }
};

// @desc   Soft delete a user
// @route  DELETE /api/users/:id
// @access Admin
const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete an admin account' });

        user.isDeleted = true;
        user.isBlocked = true;
        await user.save({ validateBeforeSave: false });

        await createAuditLog({
            ...getRequestContext(req),
            action: 'user_deleted',
            targetType: 'User',
            targetId: user._id,
            targetIdentifier: user.email,
        });

        res.json({ success: true, message: 'User account deleted' });
    } catch (err) {
        next(err);
    }
};

// @desc   Update own profile (language preference etc)
// @route  PUT /api/users/profile
// @access Private
const updateProfile = async (req, res, next) => {
    try {
        const allowed = ['name', 'phone', 'languagePreference', 'address'];
        const updates = {};
        allowed.forEach((field) => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllUsers, getUserById, createOfficer, blockUser, unblockUser, deleteUser, updateProfile };
