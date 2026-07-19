const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
    }
    next();
};

const validateRegister = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
    body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian phone number required'),
    handleValidationErrors,
];

const validateLogin = [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors,
];

const validateComplaint = [
    body('category')
        .isIn(['road_issue', 'garbage', 'water_supply', 'streetlight', 'security', 'drainage', 'noise', 'electrical', 'sanitation', 'other'])
        .withMessage('Invalid category'),
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('description').trim().notEmpty().withMessage('Description is required').isLength({ min: 20, max: 2000 }),
    body('address').trim().notEmpty().withMessage('Address is required').isLength({ max: 500 }),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required'),
    body('consentGiven').equals('true').withMessage('You must provide consent to submit a complaint'),
    handleValidationErrors,
];

const validateStatus = [
    body('status')
        .isIn(['submitted', 'pending_review', 'assigned', 'in_progress', 'resolved', 'closed'])
        .withMessage('Invalid status. Officers cannot manually set escalated status — it is system-triggered.'),
    handleValidationErrors,
];

const validateFeedback = [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim().isLength({ max: 500 }),
    handleValidationErrors,
];

const validateCreateOfficer = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['police', 'municipal', 'admin']).withMessage('Role must be police, municipal, or admin'),
    body('department').optional().isMongoId().withMessage('Invalid department ID'),
    body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian phone number required'),
    body('station').optional().trim().isLength({ max: 150 }).withMessage('Station name too long'),
    body('designation').optional().trim().isLength({ max: 100 }).withMessage('Designation too long'),
    handleValidationErrors,
];

module.exports = {
    validateRegister,
    validateLogin,
    validateComplaint,
    validateStatus,
    validateFeedback,
    validateCreateOfficer,
    handleValidationErrors,
};
