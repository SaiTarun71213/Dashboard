const express = require('express');
const authController = require('../controllers/authController');
const { authenticate, rateLimit, auditLog } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

const router = express.Router();

/**
 * AUTHENTICATION ROUTES
 * Handles user authentication and session management
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
    rateLimit(5, 15 * 60 * 1000), // 5 requests per 15 minutes
    validateRegister,
    auditLog('User Registration', 'User'),
    authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
    rateLimit(10, 15 * 60 * 1000), // 10 requests per 15 minutes
    validateLogin,
    auditLog('User Login', 'User'),
    authController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh',
    rateLimit(20, 15 * 60 * 1000), // 20 requests per 15 minutes
    authController.refreshToken
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile',
    authenticate,
    authController.getProfile
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout',
    authenticate,
    auditLog('User Logout', 'User'),
    authController.logout
);

module.exports = router;
