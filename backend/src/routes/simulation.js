const express = require('express');
const simulationController = require('../controllers/simulationController');
const { 
    authenticate, 
    authorize, 
    checkPermission,
    auditLog 
} = require('../middleware/auth');

const router = express.Router();

/**
 * SIMULATION ROUTES
 * Handles live data simulation control via REST API
 */

/**
 * @route   GET /api/simulation/status
 * @desc    Get current simulation status
 * @access  Private (Operator and above)
 */
router.get('/status',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('simulation', 'read'),
    simulationController.getStatus
);

/**
 * @route   POST /api/simulation/start
 * @desc    Start live data simulation
 * @access  Private (Admin and above)
 */
router.post('/start',
    authenticate,
    authorize('Super Admin', 'Admin'),
    checkPermission('simulation', 'create'),
    auditLog('Start Simulation', 'Simulation'),
    simulationController.startSimulation
);

/**
 * @route   POST /api/simulation/stop
 * @desc    Stop live data simulation
 * @access  Private (Admin and above)
 */
router.post('/stop',
    authenticate,
    authorize('Super Admin', 'Admin'),
    checkPermission('simulation', 'update'),
    auditLog('Stop Simulation', 'Simulation'),
    simulationController.stopSimulation
);

/**
 * @route   POST /api/simulation/restart
 * @desc    Restart live data simulation
 * @access  Private (Admin and above)
 */
router.post('/restart',
    authenticate,
    authorize('Super Admin', 'Admin'),
    checkPermission('simulation', 'update'),
    auditLog('Restart Simulation', 'Simulation'),
    simulationController.restartSimulation
);

/**
 * @route   GET /api/simulation/config
 * @desc    Get simulation configuration
 * @access  Private (Operator and above)
 */
router.get('/config',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('simulation', 'read'),
    simulationController.getConfig
);

/**
 * @route   GET /api/simulation/stats
 * @desc    Get simulation statistics and performance metrics
 * @access  Private (Operator and above)
 */
router.get('/stats',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('simulation', 'read'),
    simulationController.getStats
);

module.exports = router;
