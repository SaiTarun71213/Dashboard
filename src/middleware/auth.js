const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 * Handles JWT verification and role-based access control
 */

/**
 * Verify JWT Token
 * Middleware to authenticate users using JWT tokens
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.type !== 'access') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token type'
            });
        }

        // Get user from database
        const user = await User.findById(decoded.userId)
            .populate('authorization.accessScope.states')
            .populate('authorization.accessScope.plants');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is active
        if (!user.status.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Check if password was changed after token was issued
        if (user.changedPasswordAfter(decoded.iat)) {
            return res.status(401).json({
                success: false,
                message: 'Password was changed. Please login again.'
            });
        }

        // Update last activity
        user.activity.lastActivity = new Date();
        await user.save();

        // Attach user to request
        req.user = {
            userId: user._id,
            role: user.authorization.role,
            permissions: user.authorization.permissions,
            accessScope: user.authorization.accessScope,
            user: user
        };

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

/**
 * Role-based Authorization
 * Check if user has required role
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${roles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Permission-based Authorization
 * Check if user has specific permission for resource and action
 */
const checkPermission = (resource, action) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Super Admin has all permissions
        if (req.user.role === 'Super Admin') {
            return next();
        }

        // Check if user has the specific permission
        const hasPermission = req.user.user.hasPermission(resource, action);
        
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required permission: ${action} on ${resource}`
            });
        }

        next();
    };
};

/**
 * Scope-based Authorization
 * Check if user has access to specific state or plant
 */
const checkScope = (scopeType) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Super Admin has access to everything
        if (req.user.role === 'Super Admin') {
            return next();
        }

        const { stateId, plantId } = req.params;
        const accessScope = req.user.accessScope;

        if (scopeType === 'state' && stateId) {
            const hasStateAccess = accessScope.states.some(
                state => state._id.toString() === stateId
            );

            if (!hasStateAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this state'
                });
            }
        }

        if (scopeType === 'plant' && plantId) {
            const hasPlantAccess = accessScope.plants.some(
                plant => plant._id.toString() === plantId
            );

            if (!hasPlantAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied to this plant'
                });
            }
        }

        next();
    };
};

/**
 * Rate Limiting Middleware
 * Prevent abuse by limiting requests per user
 */
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req, res, next) => {
        const userId = req.user?.userId || req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Get user's request history
        if (!requests.has(userId)) {
            requests.set(userId, []);
        }

        const userRequests = requests.get(userId);
        
        // Remove old requests outside the window
        const recentRequests = userRequests.filter(time => time > windowStart);
        requests.set(userId, recentRequests);

        // Check if limit exceeded
        if (recentRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        // Add current request
        recentRequests.push(now);
        next();
    };
};

/**
 * Audit Logging Middleware
 * Log user actions for audit trail
 */
const auditLog = (action, resource) => {
    return async (req, res, next) => {
        // Store original res.json to intercept response
        const originalJson = res.json;
        
        res.json = function(data) {
            // Log the action if request was successful
            if (req.user && res.statusCode < 400) {
                setImmediate(async () => {
                    try {
                        const user = await User.findById(req.user.userId);
                        if (user) {
                            user.activity.actions.push({
                                action: action,
                                resource: resource,
                                resourceId: req.params.id || req.body.id,
                                ipAddress: req.ip,
                                details: {
                                    method: req.method,
                                    url: req.originalUrl,
                                    userAgent: req.get('User-Agent')
                                }
                            });

                            // Keep only last 100 actions
                            if (user.activity.actions.length > 100) {
                                user.activity.actions = user.activity.actions.slice(-100);
                            }

                            await user.save();
                        }
                    } catch (error) {
                        console.error('Audit logging error:', error);
                    }
                });
            }

            // Call original json method
            return originalJson.call(this, data);
        };

        next();
    };
};

/**
 * Optional Authentication
 * Authenticate if token is provided, but don't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            // If token is provided, authenticate
            return authenticate(req, res, next);
        }

        // No token provided, continue without authentication
        req.user = null;
        next();

    } catch (error) {
        // If authentication fails, continue without user
        req.user = null;
        next();
    }
};

module.exports = {
    authenticate,
    authorize,
    checkPermission,
    checkScope,
    rateLimit,
    auditLog,
    optionalAuth
};
