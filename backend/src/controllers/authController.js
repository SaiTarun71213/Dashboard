const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validationResult } = require('express-validator');

/**
 * AUTHENTICATION CONTROLLER
 * Handles user authentication, registration, and session management
 * Implements JWT-based authentication with refresh tokens
 */

class AuthController {
    /**
     * Generate JWT tokens (access + refresh)
     */
    generateTokens(userId) {
        const accessToken = jwt.sign(
            { userId, type: 'access' },
            process.env.JWT_SECRET,
            { expiresIn: '15m' } // Short-lived access token
        );

        const refreshToken = jwt.sign(
            { userId, type: 'refresh' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        return { accessToken, refreshToken };
    }

    /**
     * User Registration
     * POST /api/auth/register
     */
    async register(req, res) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { firstName, lastName, email, password, role = 'Viewer' } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ 'personalInfo.email': email });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'User already exists with this email'
                });
            }

            // Create new user
            const user = new User({
                personalInfo: { firstName, lastName, email },
                authentication: { password },
                authorization: { role },
                status: { isActive: true }
            });

            await user.save();

            // Generate tokens
            const { accessToken, refreshToken } = this.generateTokens(user._id);

            // Store refresh token
            user.authentication.refreshTokens.push({
                token: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                deviceInfo: req.get('User-Agent')
            });
            await user.save();

            // Log activity
            user.activity.actions.push({
                action: 'User Registration',
                resource: 'User',
                resourceId: user._id,
                ipAddress: req.ip
            });
            await user.save();

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: user._id,
                        name: user.fullName,
                        email: user.personalInfo.email,
                        role: user.authorization.role
                    },
                    tokens: { accessToken, refreshToken }
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during registration'
            });
        }
    }

    /**
     * User Login
     * POST /api/auth/login
     */
    async login(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const { email, password } = req.body;

            // Find user and include password for verification
            const user = await User.findOne({ 'personalInfo.email': email })
                .select('+authentication.password')
                .populate('authorization.accessScope.states', 'name code')
                .populate('authorization.accessScope.plants', 'name type');

            if (!user || !(await user.correctPassword(password))) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Check if account is active
            if (!user.status.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Account is deactivated. Please contact administrator.'
                });
            }

            // Check if account is locked
            if (user.isAccountLocked) {
                return res.status(423).json({
                    success: false,
                    message: 'Account is temporarily locked due to multiple failed login attempts'
                });
            }

            // Generate tokens
            const { accessToken, refreshToken } = this.generateTokens(user._id);

            // Store refresh token
            user.authentication.refreshTokens.push({
                token: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                deviceInfo: req.get('User-Agent')
            });

            // Update login statistics
            user.activity.lastLogin = new Date();
            user.activity.loginCount += 1;
            user.activity.sessions.push({
                loginTime: new Date(),
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            // Reset login attempts
            user.authentication.loginAttempts = 0;
            user.authentication.lockUntil = undefined;

            await user.save();

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user._id,
                        name: user.fullName,
                        email: user.personalInfo.email,
                        role: user.authorization.role,
                        permissions: user.authorization.permissions,
                        accessScope: user.authorization.accessScope,
                        preferences: user.preferences
                    },
                    tokens: { accessToken, refreshToken }
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during login'
            });
        }
    }

    /**
     * Refresh Access Token
     * POST /api/auth/refresh
     */
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token is required'
                });
            }

            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

            if (decoded.type !== 'refresh') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token type'
                });
            }

            // Find user and validate refresh token
            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const tokenExists = user.authentication.refreshTokens.some(
                t => t.token === refreshToken && t.expiresAt > new Date()
            );

            if (!tokenExists) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired refresh token'
                });
            }

            // Generate new access token
            const { accessToken } = this.generateTokens(user._id);

            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: { accessToken }
            });

        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
    }

    /**
     * Get User Profile
     * GET /api/auth/profile
     */
    async getProfile(req, res) {
        try {
            const user = await User.findById(req.user.userId)
                .populate('authorization.accessScope.states', 'name code')
                .populate('authorization.accessScope.plants', 'name type location.district');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: {
                    user: {
                        id: user._id,
                        personalInfo: user.personalInfo,
                        authorization: user.authorization,
                        professional: user.professional,
                        preferences: user.preferences,
                        activity: {
                            lastLogin: user.activity.lastLogin,
                            loginCount: user.activity.loginCount
                        },
                        status: user.status
                    }
                }
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching user profile'
            });
        }
    }

    /**
     * Logout User
     * POST /api/auth/logout
     */
    async logout(req, res) {
        try {
            const { refreshToken } = req.body;
            const user = await User.findById(req.user.userId);

            if (user && refreshToken) {
                // Remove the specific refresh token
                user.authentication.refreshTokens = user.authentication.refreshTokens.filter(
                    t => t.token !== refreshToken
                );
                await user.save();
            }

            res.json({
                success: true,
                message: 'Logged out successfully'
            });

        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Error during logout'
            });
        }
    }
}

const authController = new AuthController();

module.exports = {
    register: authController.register.bind(authController),
    login: authController.login.bind(authController),
    refreshToken: authController.refreshToken.bind(authController),
    getProfile: authController.getProfile.bind(authController),
    logout: authController.logout.bind(authController)
};
