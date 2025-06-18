const express = require('express');
const stateController = require('../controllers/stateController');
const { 
    authenticate, 
    authorize, 
    checkPermission, 
    checkScope,
    auditLog 
} = require('../middleware/auth');
const { 
    validateCreateState, 
    validateUpdateState, 
    validateMongoId,
    validatePagination 
} = require('../middleware/validation');

const router = express.Router();

/**
 * STATE ROUTES
 * Handles CRUD operations for Indian states
 */

/**
 * @route   GET /api/states
 * @desc    Get all states with filtering and pagination
 * @access  Private (Viewer and above)
 */
router.get('/',
    authenticate,
    checkPermission('states', 'read'),
    validatePagination,
    stateController.getAllStates
);

/**
 * @route   GET /api/states/:id
 * @desc    Get state by ID with detailed information
 * @access  Private (Viewer and above)
 */
router.get('/:id',
    authenticate,
    checkPermission('states', 'read'),
    validateMongoId,
    checkScope('state'),
    stateController.getStateById
);

/**
 * @route   POST /api/states
 * @desc    Create a new state
 * @access  Private (Admin and above)
 */
router.post('/',
    authenticate,
    authorize('Super Admin', 'Admin'),
    checkPermission('states', 'create'),
    validateCreateState,
    auditLog('Create State', 'State'),
    stateController.createState
);

/**
 * @route   PUT /api/states/:id
 * @desc    Update state information
 * @access  Private (Admin and above)
 */
router.put('/:id',
    authenticate,
    authorize('Super Admin', 'Admin'),
    checkPermission('states', 'update'),
    validateUpdateState,
    checkScope('state'),
    auditLog('Update State', 'State'),
    stateController.updateState
);

/**
 * @route   DELETE /api/states/:id
 * @desc    Delete a state
 * @access  Private (Super Admin only)
 */
router.delete('/:id',
    authenticate,
    authorize('Super Admin'),
    checkPermission('states', 'delete'),
    validateMongoId,
    auditLog('Delete State', 'State'),
    stateController.deleteState
);

/**
 * @route   GET /api/states/:id/plants
 * @desc    Get all plants in a state
 * @access  Private (Viewer and above)
 */
router.get('/:id/plants',
    authenticate,
    checkPermission('plants', 'read'),
    validateMongoId,
    validatePagination,
    checkScope('state'),
    stateController.getStatePlants
);

/**
 * @route   GET /api/states/:id/energy-overview
 * @desc    Get comprehensive energy overview for a state
 * @access  Private (Viewer and above)
 */
router.get('/:id/energy-overview',
    authenticate,
    checkPermission('analytics', 'read'),
    validateMongoId,
    checkScope('state'),
    stateController.getStateEnergyOverview
);

module.exports = router;
