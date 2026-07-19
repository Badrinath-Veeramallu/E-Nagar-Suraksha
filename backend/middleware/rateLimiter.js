const rateLimit = require('express-rate-limit');

const complaintSubmitLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: parseInt(process.env.COMPLAINT_RATE_LIMIT_MAX) || 5,
    message: {
        success: false,
        message: 'You have reached the maximum number of complaints (5) allowed per 24 hours. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user ? req.user._id.toString() : req.ip,
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { success: false, message: 'Too many registration attempts. Please try again after 1 hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { complaintSubmitLimiter, loginLimiter, registerLimiter };
