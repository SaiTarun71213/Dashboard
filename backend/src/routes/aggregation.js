const express = require('express');
const aggregationController = require('../controllers/aggregationController');
const { 
    authenticate, 
    authorize, 
    checkPermission,
    auditLog 
} = require('../middleware/auth');

const router = express.Router();

/**
 * AGGREGATION ROUTES
 * Handles real-time data aggregation API endpoints
 * Provides hierarchical aggregations: equipment → plant → state → sector
 */

/**
 * @route   GET /api/aggregation/plant/:plantId
 * @desc    Get plant-level aggregation (equipment → plant)
 * @access  Private (Operator and above)
 * @params  plantId - Plant ID
 * @query   timeWindow - Time window (15m, 1h, 24h)
 */
router.get('/plant/:plantId',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('aggregation', 'read'),
    aggregationController.getPlantAggregation
);

/**
 * @route   GET /api/aggregation/state/:stateId
 * @desc    Get state-level aggregation (plants → state)
 * @access  Private (Operator and above)
 * @params  stateId - State ID
 * @query   timeWindow - Time window (15m, 1h, 24h)
 */
router.get('/state/:stateId',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('aggregation', 'read'),
    aggregationController.getStateAggregation
);

/**
 * @route   GET /api/aggregation/sector
 * @desc    Get sector-level aggregation (states → sector)
 * @access  Private (Operator and above)
 * @query   timeWindow - Time window (15m, 1h, 24h)
 */
router.get('/sector',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('aggregation', 'read'),
    aggregationController.getSectorAggregation
);

/**
 * @route   GET /api/aggregation/hierarchy/:entityType/:entityId
 * @desc    Get multi-level hierarchy aggregation
 * @access  Private (Operator and above)
 * @params  entityType - Entity type (plant, state, sector)
 * @params  entityId - Entity ID
 * @query   timeWindow - Time window (15m, 1h, 24h)
 */
router.get('/hierarchy/:entityType/:entityId',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('aggregation', 'read'),
    aggregationController.getHierarchyAggregation
);

/**
 * @route   GET /api/aggregation/dashboard
 * @desc    Get real-time dashboard summary with key metrics
 * @access  Private (Operator and above)
 * @query   timeWindow - Time window (15m, 1h, 24h)
 */
router.get('/dashboard',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('aggregation', 'read'),
    aggregationController.getDashboardSummary
);

/**
 * @route   DELETE /api/aggregation/cache/:level/:id?
 * @desc    Clear aggregation cache for specific entity
 * @access  Private (Admin and above)
 * @params  level - Cache level (plant, state, sector)
 * @params  id - Entity ID (optional)
 * @query   timeWindow - Specific time window to clear (optional)
 */
router.delete('/cache/:level/:id?',
    authenticate,
    authorize('Super Admin', 'Admin'),
    checkPermission('aggregation', 'update'),
    auditLog('Clear Aggregation Cache', 'Aggregation'),
    aggregationController.clearCache
);

/**
 * @route   GET /api/aggregation/cache/stats
 * @desc    Get cache statistics and performance metrics
 * @access  Private (Admin and above)
 */
router.get('/cache/stats',
    authenticate,
    authorize('Super Admin', 'Admin'),
    checkPermission('aggregation', 'read'),
    aggregationController.getCacheStats
);

module.exports = router;
