const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createAuditLog, getRequestContext } = require('../utils/auditLog');

// @desc   Register citizen (kept for non-Clerk legacy / seed use)
// @route  POST /api/auth/register
// @access Public
const register = async (req, res, next) => {
    try {
        const { name, email, password, phone, languagePreference } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const user = await User.create({
            name, email, password, phone,
            role: 'citizen',
            languagePreference: languagePreference || 'en',
        });

        await createAuditLog({
            ...getRequestContext(req),
            actor: user._id,
            actorName: user.name,
            actorRole: 'citizen',
            action: 'user_registered',
            targetType: 'User',
            targetId: user._id,
            targetIdentifier: user.email,
        });

        const token = user.getSignedToken();
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            languagePreference: user.languagePreference,
        };

        res.status(201).json({ success: true, message: 'Registration successful', token, user: userData });
    } catch (err) {
        next(err);
    }
};

// @desc   Login for all roles (kept for non-Clerk / seed use)
// @route  POST /api/auth/login
// @access Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: 'Account blocked. Contact an administrator.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        await createAuditLog({
            ...getRequestContext(req),
            actor: user._id,
            actorName: user.name,
            actorRole: user.role,
            action: 'user_login',
            targetType: 'User',
            targetId: user._id,
            targetIdentifier: user.email,
        });

        const token = user.getSignedToken();
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            department: user.department,
            languagePreference: user.languagePreference,
            isBlocked: user.isBlocked,
        };

        res.status(200).json({ success: true, message: 'Login successful', token, user: userData });
    } catch (err) {
        next(err);
    }
};

// @desc   Sync Clerk-authenticated user with our MongoDB + issue backend JWT
// @route  POST /api/auth/clerk-sync
// @access Public (auth is done via Clerk token verification)
const clerkSync = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const clerkToken = authHeader.replace('Bearer ', '').trim();

        if (!clerkToken) {
            return res.status(401).json({ success: false, message: 'No Clerk token provided' });
        }

        // Verify the Clerk session token
        let clerkPayload;
        try {
            const { verifyToken } = require('@clerk/express');
            clerkPayload = await verifyToken(clerkToken, {
                secretKey: process.env.CLERK_SECRET_KEY,
            });
        } catch (clerkErr) {
            return res.status(401).json({ success: false, message: 'Invalid or expired Clerk token' });
        }

        const clerkUserId = clerkPayload.sub;
        // Clerk embeds email as email claim in some templates; fall back to extracting from token
        const clerkEmail = clerkPayload.email || req.body.email || null;
        const clerkName = req.body.name || clerkPayload.fullName || 'User';

        if (!clerkUserId) {
            return res.status(400).json({ success: false, message: 'Clerk user ID not found in token' });
        }

        // Upsert user: find by clerkId first, then fall back to email
        let user = await User.findOne({ clerkId: clerkUserId });

        if (!user && clerkEmail) {
            user = await User.findOne({ email: clerkEmail });
        }

        if (user) {
            // Existing user — update Clerk ID if not set, refresh lastLogin
            if (!user.clerkId) {
                user.clerkId = clerkUserId;
            }
            if (user.isBlocked) {
                return res.status(403).json({ success: false, message: 'Account blocked. Contact an administrator.' });
            }
            user.lastLogin = new Date();
            await user.save({ validateBeforeSave: false });
        } else {
            // New user — create as citizen
            const email = clerkEmail || `${clerkUserId}@clerk.local`;
            user = await User.create({
                clerkId: clerkUserId,
                name: clerkName,
                email,
                password: require('crypto').randomBytes(32).toString('hex'), // random unusable password
                role: 'citizen',
                languagePreference: req.body.languagePreference || 'en',
                emailVerified: true,
            });

            await createAuditLog({
                ...getRequestContext(req),
                actor: user._id,
                actorName: user.name,
                actorRole: 'citizen',
                action: 'user_registered',
                targetType: 'User',
                targetId: user._id,
                targetIdentifier: user.email,
            });
        }

        await createAuditLog({
            ...getRequestContext(req),
            actor: user._id,
            actorName: user.name,
            actorRole: user.role,
            action: 'user_login',
            targetType: 'User',
            targetId: user._id,
            targetIdentifier: user.email,
        });

        const token = user.getSignedToken();
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            department: user.department,
            languagePreference: user.languagePreference,
            isBlocked: user.isBlocked,
            clerkId: user.clerkId,
        };

        res.status(200).json({ success: true, message: 'Clerk sync successful', token, user: userData });
    } catch (err) {
        next(err);
    }
};

// @desc   Get current logged-in user
// @route  GET /api/auth/me
// @access Private
const getMe = async (req, res) => {
    const user = await User.findById(req.user._id).populate('department', 'name type');
    res.json({ success: true, user });
};

// @desc   Logout (client-side token invalidation; audit-logged)
// @route  POST /api/auth/logout
// @access Private
const logout = async (req, res, next) => {
    try {
        await createAuditLog({
            ...getRequestContext(req),
            action: 'user_logout',
            targetType: 'User',
            targetId: req.user._id,
            targetIdentifier: req.user.email,
        });
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        next(err);
    }
};

module.exports = { register, login, clerkSync, getMe, logout };
