const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { 
    authenticate, 
    checkPermission,
    rateLimit 
} = require('../middleware/auth');
const { validateDateRange } = require('../middleware/validation');

const router = express.Router();

/**
 * ANALYTICS ROUTES
 * Provides comprehensive analytics and dashboard data
 */

/**
 * @route   GET /api/analytics/overview
 * @desc    Get dashboard overview with key metrics
 * @access  Private (Viewer and above)
 */
router.get('/overview',
    authenticate,
    checkPermission('analytics', 'read'),
    rateLimit(30, 15 * 60 * 1000), // 30 requests per 15 minutes
    analyticsController.getDashboardOverview
);

/**
 * @route   GET /api/analytics/trends
 * @desc    Get energy production trends
 * @access  Private (Analyst and above)
 */
router.get('/trends',
    authenticate,
    checkPermission('analytics', 'read'),
    validateDateRange,
    rateLimit(20, 15 * 60 * 1000), // 20 requests per 15 minutes
    analyticsController.getEnergyTrends
);

/**
 * @route   GET /api/analytics/plant-comparison
 * @desc    Get plant performance comparison
 * @access  Private (Analyst and above)
 */
router.get('/plant-comparison',
    authenticate,
    checkPermission('analytics', 'read'),
    validateDateRange,
    rateLimit(15, 15 * 60 * 1000), // 15 requests per 15 minutes
    analyticsController.getPlantComparison
);

/**
 * @route   GET /api/analytics/environmental-impact
 * @desc    Get environmental impact report
 * @access  Private (Analyst and above)
 */
router.get('/environmental-impact',
    authenticate,
    checkPermission('analytics', 'read'),
    validateDateRange,
    rateLimit(10, 15 * 60 * 1000), // 10 requests per 15 minutes
    analyticsController.getEnvironmentalImpact
);

module.exports = router;
