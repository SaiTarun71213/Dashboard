const express = require('express');
const readingController = require('../controllers/readingController');
const { 
    authenticate, 
    authorize, 
    checkPermission,
    auditLog 
} = require('../middleware/auth');
const { 
    validateCreateReading, 
    validateDateRange,
    validatePagination 
} = require('../middleware/validation');

const router = express.Router();

/**
 * READINGS ROUTES
 * Handles time-series SCADA data operations
 */

/**
 * @route   GET /api/readings
 * @desc    Get readings with time-based filtering
 * @access  Private (Viewer and above)
 */
router.get('/',
    authenticate,
    checkPermission('readings', 'read'),
    validatePagination,
    validateDateRange,
    readingController.getReadings
);

/**
 * @route   POST /api/readings
 * @desc    Create new reading (SCADA data ingestion)
 * @access  Private (Operator and above)
 */
router.post('/',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator', 'Technician'),
    checkPermission('readings', 'create'),
    validateCreateReading,
    auditLog('Create Reading', 'Reading'),
    readingController.createReading
);

/**
 * @route   POST /api/readings/bulk
 * @desc    Bulk create readings (high-frequency data ingestion)
 * @access  Private (Operator and above)
 */
router.post('/bulk',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator', 'Technician'),
    checkPermission('readings', 'create'),
    auditLog('Bulk Create Readings', 'Reading'),
    readingController.createBulkReadings
);

/**
 * @route   GET /api/readings/latest
 * @desc    Get latest readings for equipment
 * @access  Private (Viewer and above)
 */
router.get('/latest',
    authenticate,
    checkPermission('readings', 'read'),
    readingController.getLatestReadings
);

/**
 * @route   GET /api/readings/chart-data
 * @desc    Get chart data for dashboard
 * @access  Private (Viewer and above)
 */
router.get('/chart-data',
    authenticate,
    checkPermission('analytics', 'read'),
    validateDateRange,
    readingController.getChartData
);

module.exports = router;
