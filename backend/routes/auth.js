const express = require('express');
const router = express.Router();
const { register, login, clerkSync, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validate');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

router.post('/register', registerLimiter, validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);
router.post('/clerk-sync', clerkSync);          // Clerk session → backend JWT
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
