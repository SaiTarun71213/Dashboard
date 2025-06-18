const express = require('express');
const webSocketController = require('../controllers/webSocketController');
const { 
    authenticate, 
    authorize, 
    checkPermission,
    auditLog 
} = require('../middleware/auth');

const router = express.Router();

/**
 * WEBSOCKET ROUTES
 * Handles WebSocket service management via REST API
 * Provides statistics, health checks, and broadcasting control
 */

/**
 * @route   GET /api/websocket/stats
 * @desc    Get WebSocket service statistics
 * @access  Private (Operator and above)
 */
router.get('/stats',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('websocket', 'read'),
    webSocketController.getStats
);

/**
 * @route   GET /api/websocket/clients
 * @desc    Get connected clients information
 * @access  Private (Admin and above)
 */
router.get('/clients',
    authenticate,
    authorize('Super Admin', 'Admin'),
    checkPermission('websocket', 'read'),
    webSocketController.getClients
);

/**
 * @route   POST /api/websocket/broadcast
 * @desc    Trigger manual broadcast to all connected clients
 * @access  Private (Admin and above)
 */
router.post('/broadcast',
    authenticate,
    authorize('Super Admin', 'Admin'),
    checkPermission('websocket', 'update'),
    auditLog('Manual WebSocket Broadcast', 'WebSocket'),
    webSocketController.triggerBroadcast
);

/**
 * @route   GET /api/websocket/health
 * @desc    Get WebSocket service health status
 * @access  Private (Operator and above)
 */
router.get('/health',
    authenticate,
    authorize('Super Admin', 'Admin', 'Plant Manager', 'Operator'),
    checkPermission('websocket', 'read'),
    webSocketController.getHealth
);

/**
 * @route   GET /api/websocket/config
 * @desc    Get WebSocket service configuration
 * @access  Private (Admin and above)
 */
router.get('/config',
    authenticate,
    authorize('Super Admin', 'Admin'),
    checkPermission('websocket', 'read'),
    webSocketController.getConfig
);

/**
 * @route   POST /api/websocket/test
 * @desc    Send test message to all connected clients
 * @access  Private (Admin and above)
 */
router.post('/test',
    authenticate,
    authorize('Super Admin', 'Admin'),
    checkPermission('websocket', 'update'),
    auditLog('WebSocket Test Message', 'WebSocket'),
    webSocketController.sendTestMessage
);

module.exports = router;
